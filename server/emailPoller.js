const { google } = require('googleapis');
const db = require('./db');

const POLL_INTERVAL = 15000;

function decodeBase64(data) {
    if (!data) return '';
    const buf = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    return buf.toString('utf-8');
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
            if (payload.mimeType === 'text/html') {
                return decoded.replace(/<[^>]*>/g, '').trim();
            }
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

class EmailPoller {
    constructor() {
        this.gmail = null;
        this.interval = null;
        this.watchedThreads = new Map(); // threadId -> { contactId, processedMsgIds: Set }
        this.seenMsgIds = new Set();
    }

    async authenticate() {
        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;
        const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            console.log('[email-poller] GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN no configurados');
            return false;
        }

        try {
            const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            await this.gmail.users.getProfile({ userId: 'me' });
            console.log('[email-poller] Conectado a Gmail API');
            return true;
        } catch (err) {
            console.error('[email-poller] Error de autenticación:', err.message);
            this.gmail = null;
            return false;
        }
    }

    // Registrar un threadId para velar por nuevos mensajes
    watchThread(threadId, contactId) {
        if (!this.watchedThreads.has(threadId)) {
            this.watchedThreads.set(threadId, {
                contactId,
                processedMsgIds: new Set(),
            });
            console.log(`[email-poller] Velando thread ${threadId} para contact #${contactId}`);
        }
    }

    connect() {
        return true;
    }

    async poll() {
        if (!this.gmail) {
            const ok = await this.authenticate();
            if (!ok) return;
        }

        // Cargar threads activos desde la DB (los que tienen thread_id y source IS NULL)
        try {
            const [rows] = await db.query(
                "SELECT id, thread_id FROM support_messages WHERE thread_id IS NOT NULL AND thread_id != '' AND source IS NULL ORDER BY created_at DESC LIMIT 50"
            );
            for (const row of rows) {
                if (row.thread_id && !this.watchedThreads.has(row.thread_id)) {
                    this.watchedThreads.set(row.thread_id, {
                        contactId: row.id,
                        processedMsgIds: new Set(),
                    });
                }
            }
        } catch (err) {
            console.error('[email-poller] Error cargando threads:', err.message);
        }

        if (this.watchedThreads.size === 0) {
            console.log('[email-poller] 0 threads activos para velar');
            return;
        }

        console.log(`[email-poller] Velando ${this.watchedThreads.size} threads...`);

        for (const [threadId, watch] of this.watchedThreads) {
            try {
                const thread = await this.gmail.users.threads.get({
                    userId: 'me',
                    id: threadId,
                    format: 'full',
                });

                const messages = thread.data.messages || [];
                if (messages.length <= 1) continue; // Solo el mensaje original

                for (const msg of messages) {
                    if (this.seenMsgIds.has(msg.id)) continue;
                    if (watch.processedMsgIds.has(msg.id)) continue;

                    const payload = msg.payload;
                    const headers = payload.headers || [];
                    const fromHeader = getHeader(headers, 'from');
                    const fromMatch = fromHeader.match(/(?:"?([^"]*)"?\s*)?<([^>]+)>/);
                    const fromEmail = fromMatch ? fromMatch[2] : fromHeader;
                    const fromName = fromMatch ? (fromMatch[1] || fromMatch[2]) : fromHeader;
                    const subject = getHeader(headers, 'subject') || '(sin asunto)';
                    const bodyText = extractBody(payload).trim().substring(0, 2000) || '(sin contenido)';

                    // Ignorar mensajes enviados por nosotros
                    if (fromEmail === 'hubvntg@gmail.com') {
                        watch.processedMsgIds.add(msg.id);
                        this.seenMsgIds.add(msg.id);
                        continue;
                    }

                    console.log(`[email-poller] Nuevo mensaje en thread=${threadId} from="${fromEmail}" subject="${subject}"`);

                    // Insertar reply del cliente
                    await db.query(
                        "INSERT INTO support_messages (nombre, email, mensaje, status, thread_id, source) VALUES (?, ?, ?, 'pending', ?, 'email_reply')",
                        [fromName, fromEmail, bodyText, watch.contactId]
                    );

                    // Obtener historial
                    const [history] = await db.query(
                        "SELECT * FROM support_messages WHERE id = ? OR thread_id = ? ORDER BY created_at ASC",
                        [watch.contactId, watch.contactId]
                    );

                    // Generar respuesta IA
                    const aiResponse = await this.generateResponse(history);
                    if (aiResponse) {
                        console.log(`[email-poller] Enviando reply IA a ${fromEmail} en thread=${threadId}`);
                        await this.sendGmailReply(fromEmail, aiResponse, threadId);

                        await db.query(
                            "INSERT INTO support_messages (nombre, email, mensaje, respuesta, status, thread_id, source) VALUES (?, ?, ?, ?, 'replied', ?, 'bot_reply')",
                            ['VNTG Bot', 'hubvntg@gmail.com', bodyText, aiResponse, watch.contactId]
                        ).catch(err => console.error('[email-poller] Error guardando respuesta IA:', err.message));

                        console.log(`[email-poller] Auto-respuesta enviada y guardada para contact #${watch.contactId}`);
                    } else {
                        console.log(`[email-poller] No se generó respuesta IA para contact #${watch.contactId}`);
                    }

                    watch.processedMsgIds.add(msg.id);
                    this.seenMsgIds.add(msg.id);
                }
            } catch (err) {
                if (err.code === 404) {
                    // Thread ya no existe, lo removemos
                    console.log(`[email-poller] Thread ${threadId} ya no existe, removiendo`);
                    this.watchedThreads.delete(threadId);
                } else {
                    console.error(`[email-poller] Error velando thread ${threadId}:`, err.message);
                }
            }
        }
    }

    async generateResponse(history) {
        const conversation = history.map(msg => {
            const sender = msg.source === 'email_reply' ? 'Cliente' : 'VNTG Bot';
            const text = msg.mensaje || msg.respuesta || '';
            return `${sender}: ${text}`;
        }).join('\n');

        const systemPrompt = `Eres el agente de soporte automático de VNTG HUB, una tienda argentina de coleccionismo vintage. Vendemos figuras, Funko Pops, cómics, manga, cartas, artículos de cine/películas, autos a escala, y más — de Marvel, DC, Star Wars, Disney, anime y cultura pop.

Un cliente respondió a un email anterior.

REGLAS:
- Máximo 2 oraciones. Tono amable. Respondé directamente lo que pregunte.
- Si menciona una categoría/franquicia que vendemos, confirmá que sí trabajamos con eso e invitá a ver el catálogo.
- NO confirmes stock ni productos específicos.
- NUNCA inventes direcciones de email, teléfonos ni URLs.
- Solo derivá a humano si es problema de cuenta/pago/envío.
- Texto plano, sin markdown.`;

        const groqMessages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Historial de la conversación:\n${conversation}\n\nGenerá una respuesta al último mensaje del cliente.` },
        ];

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                    messages: groqMessages,
                    temperature: 0.7,
                    max_tokens: 512,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!groqRes.ok) {
                const errText = await groqRes.text();
                console.error('[email-poller] Error Groq:', groqRes.status, errText);
                return null;
            }

            const data = await groqRes.json();
            return data.choices?.[0]?.message?.content || null;
        } catch (e) {
            clearTimeout(timeout);
            console.error('[email-poller] Error Groq:', e.message);
            return null;
        }
    }

    async sendGmailReply(to, text, gmailThreadId) {
        if (!this.gmail) await this.authenticate();
        if (!this.gmail) return;

        const msgId = `<vntg-bot-${Date.now()}@vntg-hub.onrender.com>`;
        const inReplyTo = `<vntg-thread-${gmailThreadId}@vntg-hub.onrender.com>`;

        const lines = [
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset="UTF-8"',
            'Content-Transfer-Encoding: base64',
            `From: VNTG Hub <${process.env.SMTP_USER || 'hubvntg@gmail.com'}>`,
            `To: ${to}`,
            `Subject: =?UTF-8?B?${Buffer.from('Re: Recibimos tu mensaje — VNTG Hub').toString('base64')}?=`,
            `Message-ID: ${msgId}`,
            `In-Reply-To: ${inReplyTo}`,
            `References: ${inReplyTo}`,
            '',
            Buffer.from(text).toString('base64'),
        ];

        const raw = Buffer.from(lines.join('\r\n')).toString('base64url');

        try {
            const res = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw, threadId: gmailThreadId },
            });
            console.log('[email-poller] Reply enviado threadId=' + (res.data?.threadId || gmailThreadId));
        } catch (err) {
            console.error('[email-poller] Error enviando reply por Gmail API:', err.message);
        }
    }

    start() {
        console.log('[email-poller] Iniciando...');
        this.authenticate().catch(() => {});

        const pollFn = () => {
            this.poll().catch(err => {
                console.error('[email-poller] Error en polling:', err.message);
            });
        };

        pollFn();
        this.interval = setInterval(pollFn, POLL_INTERVAL);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.gmail = null;
    }
}

module.exports = EmailPoller;