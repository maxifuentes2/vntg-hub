const { google } = require('googleapis');
const db = require('./db');

const POLL_INTERVAL = 20000;

function decodeBase64(data) {
    if (!data) return '';
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function getHeader(headers, name) {
    const found = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return found ? found.value : '';
}

function extractBody(payload) {
    if (payload.body?.data) {
        const decoded = decodeBase64(payload.body.data);
        if (decoded.length > 0) {
            if (payload.mimeType === 'text/plain') return decoded;
            if (payload.mimeType === 'text/html') return decoded.replace(/<[^>]*>/g, '').trim();
        }
    }
    if (payload.parts) {
        for (const part of payload.parts) {
            const text = extractBody(part);
            if (text) return text;
        }
    }
    return '';
}

function stripQuoted(text) {
    if (!text) return '';
    // Buscar marcador de reply en español/inglés
    const markers = [
        /\nEl .+ escribió:\n/i,
        /\nOn .+ wrote:\n/i,
        /\n-{3,} Forwarded message -{3,}\n/i,
        /\n_{10,}\n/i,
    ];
    let clean = text;
    for (const marker of markers) {
        const idx = clean.search(marker);
        if (idx >= 0) {
            clean = clean.substring(0, idx).trim();
        }
    }
    // Sacar líneas citadas con >
    const lines = clean.split('\n');
    const filtered = lines.filter(l => !l.trim().startsWith('>'));
    clean = filtered.join('\n').trim();
    // Sacar URLs sueltas (las inline del HTML)
    clean = clean.replace(/https?:\/\/\S+/g, '').trim();
    return clean;
}

const SYSTEM_PROMPT = `Eres el asistente automático de VNTG HUB, una tienda argentina de coleccionismo vintage. Vendemos figuras, Funko Pops, cómics, manga, cartas, artículos de cine/películas, autos a escala, y más — de Marvel, DC, Star Wars, Disney, anime y cultura pop.

REGLAS:
- Máximo 2 oraciones. Tono amable.
- Confirmá que trabajamos con lo que menciona y ofrecé el catálogo.
- NO confirmes stock ni productos específicos.
- NUNCA inventes emails, teléfonos ni URLs.
- Solo derivá a humano si es problema de cuenta/pago/envío.
- Texto plano, sin markdown.`;

class EmailPoller {
    constructor() {
        this.gmail = null;
        this.interval = null;
    }

    async auth() {
        const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;
        if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) return false;
        const oauth = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
        oauth.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
        this.gmail = google.gmail({ version: 'v1', auth: oauth });
        try {
            await this.gmail.users.getProfile({ userId: 'me' });
            console.log('[email-poller] Autenticado');
            return true;
        } catch (e) {
            console.error('[email-poller] Auth error:', e.message);
            this.gmail = null;
            return false;
        }
    }

    async groq(messages, system) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: system || SYSTEM_PROMPT },
                        ...messages,
                    ],
                    temperature: 0.7,
                    max_tokens: 256,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!res.ok) {
                const t = await res.text();
                console.error('[groq] Error:', res.status, t);
                return null;
            }
            const data = await res.json();
            return data.choices?.[0]?.message?.content || null;
        } catch (e) {
            clearTimeout(timeout);
            console.error('[groq] Error:', e.message);
            return null;
        }
    }

    async sendReply(to, text, threadId, inReplyTo) {
        if (!this.gmail && !(await this.auth())) return;
        const msgId = `<vntg-auto-${Date.now()}@hubvntg.com>`;
        const lines = [
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset="UTF-8"',
            'Content-Transfer-Encoding: base64',
            'From: VNTG Hub <hubvntg@gmail.com>',
            `To: ${to}`,
            'Subject: =?UTF-8?B?' + Buffer.from('Re: Tu consulta en VNTG Hub').toString('base64') + '?=',
            `Message-ID: ${msgId}`,
        ];
        if (inReplyTo) {
            lines.push(`In-Reply-To: ${inReplyTo}`);
            lines.push(`References: ${inReplyTo}`);
        }
        lines.push('');
        lines.push(Buffer.from(text).toString('base64'));
        const raw = Buffer.from(lines.join('\r\n')).toString('base64url');
        try {
            const res = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw },
            });
            console.log(`[email-poller] Reply enviado a ${to} threadId=${res.data?.threadId}`);
        } catch (e) {
            console.error('[email-poller] Error enviando reply:', e.message);
        }
    }

    async alreadyProcessed(gmailMsgId) {
        const [rows] = await db.query(
            "SELECT id FROM support_messages WHERE gmail_msg_id = ? LIMIT 1",
            [gmailMsgId]
        );
        return rows.length > 0;
    }

    async poll() {
        if (!this.gmail && !(await this.auth())) return;

        try {
            const profile = await this.gmail.users.getProfile({ userId: 'me' });
            const emailAddress = profile.data.emailAddress;

            const list = await this.gmail.users.messages.list({
                userId: 'me',
                maxResults: 20,
            });

            const messages = list.data.messages || [];
            if (messages.length === 0) return;

            console.log(`[email-poller] ${messages.length} mensajes`);

            for (const msg of messages) {
                if (await this.alreadyProcessed(msg.id)) continue;

                let detail;
                try {
                    detail = await this.gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'full',
                    });
                } catch (e) {
                    continue;
                }

                const payload = detail.data.payload;
                const headers = payload.headers || [];
                const from = getHeader(headers, 'from');
                const fromMatch = from.match(/(?:"?([^"]*)"?\s*)?<([^>]+)>/);
                const fromEmail = fromMatch ? fromMatch[2] : from;
                const fromName = fromMatch ? (fromMatch[1] || fromMatch[2]) : from;
                const subject = getHeader(headers, 'subject');
                const inReplyTo = getHeader(headers, 'in-reply-to');
                const rawBody = extractBody(payload);
                const body = stripQuoted(rawBody).substring(0, 2000);
                const gmailThreadId = detail.data.threadId;
                const dateStr = getHeader(headers, 'date');

                // Ignorar nuestros propios mensajes
                if (fromEmail === emailAddress || fromEmail === 'hubvntg@gmail.com') continue;

                if (!body) {
                    console.log(`[email-poller] Sin contenido de ${fromEmail}, salteando`);
                    continue;
                }

                console.log(`[email-poller] <<< ${fromEmail} "${subject?.substring(0, 60)}" thread=${gmailThreadId} body="${body?.substring(0, 80)}..."`);

                // Marcar como procesado apenas lo vemos (evita reprocesar si falla)
                await db.query(
                    "UPDATE support_messages SET gmail_msg_id = ? WHERE gmail_msg_id = ?",
                    [msg.id, msg.id]
                ).catch(() => {});

                // Buscar si ya tenemos un thread abierto
                const [existing] = await db.query(
                    "SELECT id, thread_id FROM support_messages WHERE thread_id = ? AND source IS NULL LIMIT 1",
                    [gmailThreadId]
                );

                let contactId;
                if (existing.length > 0) {
                    contactId = existing[0].id;
                    console.log(`[email-poller] Reply en thread #${contactId}`);

                    await db.query(
                        "INSERT INTO support_messages (nombre, email, mensaje, status, thread_id, source, gmail_msg_id) VALUES (?, ?, ?, 'pending', ?, 'email_reply', ?)",
                        [fromName, fromEmail, body, contactId, msg.id]
                    );

                    const [history] = await db.query(
                        "SELECT * FROM support_messages WHERE id = ? OR thread_id = ? ORDER BY created_at ASC",
                        [contactId, contactId]
                    );

                    const conversation = history.map(h => {
                        const s = h.source === 'email_reply' ? 'Cliente' : 'VNTG Bot';
                        const t = h.mensaje || h.respuesta || '';
                        return `${s}: ${t}`;
                    }).join('\n');

                    const groqResp = await this.groq([
                        { role: 'user', content: `Historial:\n${conversation}\n\nRespondé al último mensaje del cliente.` }
                    ]);

                    if (groqResp) {
                        await this.sendReply(fromEmail, groqResp, gmailThreadId, inReplyTo);
                        await db.query(
                            "INSERT INTO support_messages (nombre, email, mensaje, respuesta, status, thread_id, source) VALUES (?, ?, ?, ?, 'replied', ?, 'bot_reply')",
                            ['VNTG Bot', 'hubvntg@gmail.com', body, groqResp, contactId]
                        );
                        console.log(`[email-poller] Respondido a ${fromEmail} en thread #${contactId}`);
                    }
                } else {
                    console.log(`[email-poller] Nuevo contacto de ${fromEmail}`);

                    const [result] = await db.query(
                        "INSERT INTO support_messages (nombre, email, mensaje, status, gmail_msg_id) VALUES (?, ?, ?, 'pending', ?)",
                        [fromName, fromEmail, body, msg.id]
                    );
                    contactId = result.insertId;

                    const groqResp = await this.groq([
                        { role: 'user', content: `Un cliente escribió: "${body}". Respondé amablemente.` }
                    ]);

                    if (groqResp) {
                        await this.sendReply(fromEmail, groqResp, gmailThreadId, inReplyTo);
                        await db.query(
                            "INSERT INTO support_messages (nombre, email, mensaje, respuesta, status, thread_id, source) VALUES (?, ?, ?, ?, 'replied', ?, 'bot_reply')",
                            ['VNTG Bot', 'hubvntg@gmail.com', body, groqResp, contactId]
                        );
                        console.log(`[email-poller] Nuevo contacto respondido: #${contactId}`);
                    }

                    await db.query(
                        "UPDATE support_messages SET thread_id = ? WHERE id = ?",
                        [gmailThreadId, contactId]
                    );
                }
            }
        } catch (e) {
            console.error('[email-poller] Error:', e.message);
        }
    }

    start() {
        console.log('[email-poller] Iniciando...');
        this.auth().catch(() => {});
        const run = () => this.poll().catch(() => {});
        run();
        this.interval = setInterval(run, POLL_INTERVAL);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        this.gmail = null;
    }
}

module.exports = EmailPoller;