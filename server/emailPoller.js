const { google } = require('googleapis');
const db = require('./db');

const POLL_INTERVAL = 20000;

function decodeBase64(d) {
    if (!d) return '';
    return Buffer.from(d.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function getHeader(headers, name) {
    const f = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return f ? f.value : '';
}

function extractBody(payload) {
    if (payload.body?.data) {
        const d = decodeBase64(payload.body.data);
        if (d.length) {
            if (payload.mimeType === 'text/plain') return d;
            if (payload.mimeType === 'text/html') return d.replace(/<[^>]*>/g, '').trim();
        }
    }
    if (payload.parts) {
        for (const p of payload.parts) {
            const t = extractBody(p);
            if (t) return t;
        }
    }
    return '';
}

function stripQuoted(text) {
    if (!text) return '';
    let clean = text;
    const markers = [
        /\nEl .+ escribió:\n/i,
        /\nOn .+ wrote:\n/i,
        /\n-{3,} Forwarded message -{3,}\n/i,
        /\n_{10,}\n/i,
    ];
    for (const m of markers) {
        const idx = clean.search(m);
        if (idx >= 0) { clean = clean.substring(0, idx).trim(); break; }
    }
    clean = clean.split('\n').filter(l => !l.trim().startsWith('>')).join('\n').trim();
    clean = clean.replace(/https?:\/\/\S+/g, '').trim();
    return clean;
}

function extractContactIdFromRef(ref) {
    if (!ref) return null;
    const m1 = ref.match(/vntg-contact-(\d+)@/);
    if (m1) return parseInt(m1[1], 10);
    const m2 = ref.match(/vntg-autoreply-(\d+)-/);
    if (m2) return parseInt(m2[1], 10);
    return null;
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
        const o = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
        o.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
        this.gmail = google.gmail({ version: 'v1', auth: o });
        try {
            await this.gmail.users.getProfile({ userId: 'me' });
            return true;
        } catch (e) {
            console.error('[email-poller] Auth error:', e.message);
            this.gmail = null;
            return false;
        }
    }

    async groq(messages) {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 15000);
        try {
            const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
                    temperature: 0.7,
                    max_tokens: 256,
                }),
                signal: c.signal,
            });
            clearTimeout(t);
            if (!r.ok) { const e = await r.text(); console.error('[groq]', r.status, e); return null; }
            const d = await r.json();
            return d.choices?.[0]?.message?.content || null;
        } catch (e) {
            clearTimeout(t);
            console.error('[groq]', e.message);
            return null;
        }
    }

    async sendReply(to, text, gmailThreadId, replyToMsgId, contactId) {
        if (!this.gmail && !(await this.auth())) return;
        const msgId = `<vntg-autoreply-${contactId}-${Date.now()}@hubvntg.com>`;

        // Envolver en HTML como el auto-reply original
        const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
        const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 10px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px 40px;text-align:center">
<img src="https://vntg-hub.onrender.com/logo.svg" alt="VNTG Hub" height="48" style="margin-bottom:12px">
<h1 style="color:#fff;font-size:20px;margin:0;font-weight:800;text-transform:uppercase;letter-spacing:-.5px">VNTG<span style="color:#f97316"> Hub</span></h1>
<p style="color:#94a3b8;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:2px">Coleccionables Vintage</p>
</td></tr>
<tr><td style="padding:30px 40px">
<p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 16px">${safe}</p>
<p style="font-size:12px;color:#888;margin:24px 0 0;border-top:1px solid #eee;padding-top:16px">Si tenés más preguntas, respondé directamente a este correo. Un agente humano puede ayudarte si el tema es complejo.</p>
</td></tr>
<tr><td style="background:#f8f8f8;padding:20px 40px;text-align:center;font-size:11px;color:#aaa">
<a href="https://vntg-hub.onrender.com" style="color:#f97316;text-decoration:none;font-weight:700">vntg-hub.onrender.com</a>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

        const lines = [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset="UTF-8"',
            'Content-Transfer-Encoding: base64',
            'From: VNTG Hub <hubvntg@gmail.com>',
            `To: ${to}`,
            'Subject: =?UTF-8?B?' + Buffer.from('Re: Tu consulta en VNTG Hub').toString('base64') + '?=',
            `Message-ID: ${msgId}`,
            `In-Reply-To: ${replyToMsgId}`,
            `References: ${replyToMsgId}`,
            '',
            Buffer.from(htmlBody).toString('base64'),
        ];
        const raw = Buffer.from(lines.join('\r\n')).toString('base64url');
        try {
            const res = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw, threadId: gmailThreadId },
            });
            console.log(`[email-poller] Reply enviado a ${to} threadId=${res.data?.threadId}`);
        } catch (e) {
            console.error('[email-poller] Error sendReply:', e.message);
        }
    }

    async alreadyProcessed(id) {
        const [r] = await db.query("SELECT id FROM support_messages WHERE gmail_msg_id = ? LIMIT 1", [id]);
        return r.length > 0;
    }

    async poll() {
        if (!this.gmail && !(await this.auth())) return;

        try {
            const { emailAddress } = (await this.gmail.users.getProfile({ userId: 'me' })).data;
            const list = await this.gmail.users.messages.list({ userId: 'me', maxResults: 20 });
            const messages = list.data.messages || [];
            if (!messages.length) return;

            console.log(`[email-poller] ${messages.length} mensajes`);

            for (const msg of messages) {
                if (await this.alreadyProcessed(msg.id)) continue;

                let detail;
                try {
                    detail = await this.gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
                } catch (e) { continue; }

                const payload = detail.data.payload;
                const headers = payload.headers || [];
                const from = getHeader(headers, 'from');
                const fromM = from.match(/(?:"?([^"]*)"?\s*)?<([^>]+)>/);
                const fromEmail = fromM ? fromM[2] : from;
                const fromName = fromM ? (fromM[1] || fromM[2]) : from;
                const subject = getHeader(headers, 'subject');
                const messageId = getHeader(headers, 'message-id');
                const inReplyTo = getHeader(headers, 'in-reply-to');
                const body = stripQuoted(extractBody(payload)).substring(0, 2000);
                const gmailThreadId = detail.data.threadId;

                if (fromEmail === emailAddress || fromEmail === 'hubvntg@gmail.com') continue;
                if (!body) { console.log(`[email-poller] Sin cuerpo de ${fromEmail}`); continue; }

                console.log(`[email-poller] <<< ${fromEmail} "${(subject || '').substring(0, 60)}" thread=${gmailThreadId} body="${body.substring(0, 80)}..."`);

                // Buscar contacto por In-Reply-To (confiable, no depende de threading de Gmail)
                let contactId = extractContactIdFromRef(inReplyTo);
                let isReply = false;

                if (contactId) {
                    // Verificar que el contacto existe
                    const [check] = await db.query("SELECT id FROM support_messages WHERE id = ?", [contactId]);
                    if (check.length === 0) contactId = null;
                    else isReply = true;
                }

                if (!contactId) {
                    // Fallback: buscar por threadId
                    const [existing] = await db.query(
                        "SELECT id FROM support_messages WHERE thread_id = ? AND source IS NULL LIMIT 1",
                        [gmailThreadId]
                    );
                    if (existing.length) {
                        contactId = existing[0].id;
                        isReply = true;
                    }
                }

                if (isReply && contactId) {
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
                        return `${s}: ${h.mensaje || h.respuesta || ''}`;
                    }).join('\n');

                    const ai = await this.groq([
                        { role: 'user', content: `Historial:\n${conversation}\n\nRespondé al último mensaje del cliente.` }
                    ]);

                    if (ai) {
                        await this.sendReply(fromEmail, ai, gmailThreadId, messageId, contactId);
                        await db.query(
                            "INSERT INTO support_messages (nombre, email, mensaje, respuesta, status, thread_id, source) VALUES (?, ?, ?, ?, 'replied', ?, 'bot_reply')",
                            ['VNTG Bot', 'hubvntg@gmail.com', body, ai, contactId]
                        );
                        console.log(`[email-poller] Respondido a ${fromEmail} en thread #${contactId}`);
                    }
                } else {
                    // Nuevo contacto
                    console.log(`[email-poller] Nuevo contacto de ${fromEmail}`);
                    const [result] = await db.query(
                        "INSERT INTO support_messages (nombre, email, mensaje, status, gmail_msg_id) VALUES (?, ?, ?, 'pending', ?)",
                        [fromName, fromEmail, body, msg.id]
                    );
                    contactId = result.insertId;

                    const ai = await this.groq([
                        { role: 'user', content: `Un cliente escribió: "${body}". Respondé amablemente.` }
                    ]);

                    if (ai) {
                        await this.sendReply(fromEmail, ai, gmailThreadId, messageId, contactId);
                        await db.query(
                            "INSERT INTO support_messages (nombre, email, mensaje, respuesta, status, thread_id, source) VALUES (?, ?, ?, ?, 'replied', ?, 'bot_reply')",
                            ['VNTG Bot', 'hubvntg@gmail.com', body, ai, contactId]
                        );
                        console.log(`[email-poller] Nuevo contacto respondido: #${contactId}`);
                    }
                    await db.query("UPDATE support_messages SET thread_id = ? WHERE id = ?", [gmailThreadId, contactId]);
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
