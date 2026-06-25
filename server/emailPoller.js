const { google } = require('googleapis');
const db = require('./db');

const POLL_INTERVAL = 30000;

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
    if (payload.mimeType === 'text/plain' && payload.body?.data) {
        return decodeBase64(payload.body.data);
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

    connect() {
        return true;
    }

    async poll() {
        if (!this.gmail) {
            const ok = await this.authenticate();
            if (!ok) return;
        }

        try {
            const res = await this.gmail.users.messages.list({
                userId: 'me',
                q: 'is:unread',
                maxResults: 10,
            });

            const messages = res.data.messages || [];
            if (messages.length === 0) return;

            const processedIds = [];

            for (const msg of messages) {
                try {
                    const detail = await this.gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'full',
                    });

                    const payload = detail.data.payload;
                    const headers = payload.headers || [];
                    const gmailThreadId = detail.data.threadId;

                    // Buscar por threadId de Gmail (más confiable que In-Reply-To)
                    const [contacts] = await db.query(
                        "SELECT id, nombre, email FROM support_messages WHERE thread_id = ? AND source IS NULL LIMIT 1",
                        [gmailThreadId]
                    );

                    if (contacts.length > 0) {
                        const contact = contacts[0];
                        const fromHeader = getHeader(headers, 'from');
                        const fromMatch = fromHeader.match(/(?:"?([^"]*)"?\s*)?<([^>]+)>/);
                        const fromName = fromMatch ? (fromMatch[1] || fromMatch[2]) : fromHeader;
                        const fromEmail = fromMatch ? fromMatch[2] : fromHeader;
                        const bodyText = extractBody(payload).trim().substring(0, 2000) || '(sin contenido)';

                        console.log(`[email-poller] Reply recibido para contact #${contact.id} de ${fromEmail}`);

                        await db.query(
                            "INSERT INTO support_messages (nombre, email, mensaje, status, thread_id, source) VALUES (?, ?, ?, 'pending', ?, 'email_reply')",
                            [fromName, fromEmail, bodyText, contact.id]
                        );

                        const [history] = await db.query(
                            "SELECT * FROM support_messages WHERE id = ? OR thread_id = ? ORDER BY created_at ASC",
                            [contact.id, contact.id]
                        );

                        const aiResponse = await this.generateResponse(history);
                        if (aiResponse) {
                            await this.sendGmailReply(fromEmail, aiResponse, gmailThreadId);
                            console.log(`[email-poller] Auto-respuesta enviada a ${fromEmail} para contact #${contact.id}`);
                        } else {
                            console.log(`[email-poller] No se generó respuesta IA para contact #${contact.id}`);
                        }
                    }

                    processedIds.push(msg.id);
                } catch (err) {
                    console.error('[email-poller] Error procesando mensaje:', err.message);
                }
            }

            if (processedIds.length > 0) {
                await this.gmail.users.messages.batchModify({
                    userId: 'me',
                    requestBody: {
                        ids: processedIds,
                        removeLabelIds: ['UNREAD'],
                    },
                });
                console.log(`[email-poller] ${processedIds.length} email(s) procesado(s)`);
            }
        } catch (err) {
            console.error('[email-poller] Error en poll:', err.message);
        }
    }

    async generateResponse(history) {
        const conversation = history.map(msg => {
            const sender = msg.source === 'email_reply' ? 'Cliente' : 'VNTG Bot';
            const text = msg.mensaje || msg.respuesta || '';
            return `${sender}: ${text}`;
        }).join('\n');

        const systemPrompt = `Eres el agente de soporte automático de VNTG HUB. Un cliente respondió a un email anterior y necesitás contestar.

REGLAS:
- Máximo 3 oraciones. Respondé en español, tono amable.
- Respondé al contenido de su último mensaje.
- Si no sabés con certeza, decí que lo derivás a soporte humano.
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

        const lines = [
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset="UTF-8"',
            'Content-Transfer-Encoding: base64',
            `From: VNTG Hub <${process.env.SMTP_USER || 'hubvntg@gmail.com'}>`,
            `To: ${to}`,
            `Subject: =?UTF-8?B?${Buffer.from('Re: Recibimos tu mensaje — VNTG Hub').toString('base64')}?=`,
            '',
            Buffer.from(text).toString('base64'),
        ];

        const raw = Buffer.from(lines.join('\r\n')).toString('base64url');

        try {
            await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw, threadId: gmailThreadId },
            });
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
