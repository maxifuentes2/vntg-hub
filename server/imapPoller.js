const { google } = require('googleapis');
const db = require('./db');

const TICKET_PATTERN = /<vntg-ticket-(\d+)@vntg-hub\.onrender\.com>/;

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

class GmailPoller {
    constructor() {
        this.gmail = null;
        this.interval = null;
    }

    async authenticate() {
        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;
        const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            console.log('[gmail] GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN no configurados, Gmail API desactivado');
            return false;
        }

        try {
            const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            // Verify connectivity by fetching profile
            await this.gmail.users.getProfile({ userId: 'me' });
            console.log('[gmail] Conectado a Gmail API');
            return true;
        } catch (err) {
            console.error('[gmail] Error de autenticación:', err.message);
            this.gmail = null;
            return false;
        }
    }

    async poll() {
        if (!this.gmail) {
            console.log('[gmail] Reautenticando...');
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
                    const inReplyTo = getHeader(headers, 'in-reply-to');
                    const messageId = getHeader(headers, 'message-id');
                    const from = getHeader(headers, 'from');
                    const fromMatch = from.match(/(?:"?([^"]*)"?\s*)?<([^>]+)>/);
                    const fromName = fromMatch ? (fromMatch[1] || fromMatch[2]) : from;
                    const fromEmail = fromMatch ? fromMatch[2] : from;

                    const match = inReplyTo.match(TICKET_PATTERN);
                    if (match) {
                        const ticketId = parseInt(match[1], 10);
                        const bodyText = extractBody(payload).trim().substring(0, 2000) || '(sin contenido)';

                        await db.query(
                            "INSERT INTO support_messages (nombre, email, mensaje, status, thread_id, source) VALUES (?, ?, ?, 'pending', ?, 'email')",
                            [fromName, fromEmail, bodyText, ticketId]
                        );

                        console.log(`[gmail] Reply email recibido para ticket #${ticketId} de ${fromEmail}`);
                    }

                    processedIds.push(msg.id);
                } catch (err) {
                    console.error('[gmail] Error procesando mensaje ' + msg.id + ':', err.message);
                }
            }

            // Mark as read by removing UNREAD label
            if (processedIds.length > 0) {
                await this.gmail.users.messages.batchModify({
                    userId: 'me',
                    requestBody: {
                        ids: processedIds,
                        removeLabelIds: ['UNREAD'],
                    },
                });
                console.log(`[gmail] ${processedIds.length} email(s) procesado(s)`);
            }
        } catch (err) {
            console.error('[gmail] Error en poll:', err.message);
        }
    }

    start() {
        this.authenticate().then((ok) => {
            if (ok) {
                this.poll();
                this.interval = setInterval(() => this.poll(), 30000);
            }
        }).catch((err) => {
            console.error('[gmail] Error en start:', err.message);
        });
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.gmail = null;
    }
}

module.exports = GmailPoller;
