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
    if (payload.body?.data) {
        const decoded = decodeBase64(payload.body.data);
        if (decoded.length > 0) {
            if (payload.mimeType === 'text/plain') return decoded;
            if (payload.mimeType === 'text/html') {
                // Strip HTML tags
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
        this.seenIds = new Set();
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
            // Buscar en inbox completo (no solo unread, porque Gmail marca como leído al abrir)
            const res = await this.gmail.users.messages.list({
                userId: 'me',
                q: 'in:inbox -from:me',
                maxResults: 20,
            });

            const messages = res.data.messages || [];
            console.log(`[email-poller] Gmail devolvió ${messages.length} mensajes en inbox`);

            // Filtrar mensajes ya procesados
            const newMessages = messages.filter(m => !this.seenIds.has(m.id));
            if (newMessages.length === 0) return;

            console.log(`[email-poller] ${newMessages.length} mensajes nuevos (no vistos)`);

            const processedIds = [];

            for (const msg of newMessages) {
                try {
                    const detail = await this.gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'full',
                    });

                    const payload = detail.data.payload;
                    const headers = payload.headers || [];
                    const gmailThreadId = detail.data.threadId || '';
                    const fromHeader = getHeader(headers, 'from');
                    const subject = getHeader(headers, 'subject') || '(sin asunto)';
                    const fromMatch = fromHeader.match(/(?:"?([^"]*)"?\s*)?<([^>]+)>/);
                    const fromEmail = fromMatch ? fromMatch[2] : fromHeader;
                    const fromName = fromMatch ? (fromMatch[1] || fromMatch[2]) : fromHeader;
                    const bodyText = extractBody(payload).trim().substring(0, 2000) || '(sin contenido)';
                    const inReplyTo = getHeader(headers, 'in-reply-to') || '';

                    console.log(`[email-poller] msg=${msg.id} from="${fromEmail}" subject="${subject}" threadId="${gmailThreadId}" inReplyTo="${inReplyTo}" bodyLen=${bodyText.length}`);

                    // Ignorar emails enviados desde hubvntg (auto-notificaciones)
                    if (fromEmail === 'hubvntg@gmail.com') {
                        console.log(`[email-poller] Ignorando email de hubvntg msg=${msg.id}`);
                        processedIds.push(msg.id);
                        continue;
                    }

                    // 1) Buscar por threadId de Gmail
                    let contact = null;
                    if (gmailThreadId) {
                        const [rows] = await db.query(
                            "SELECT id, nombre, email, thread_id FROM support_messages WHERE thread_id = ? AND source IS NULL LIMIT 1",
                            [gmailThreadId]
                        );
                        if (rows.length > 0) contact = rows[0];
                        console.log(`[email-poller] Busqueda por threadId=${gmailThreadId}: ${contact ? 'encontrado #'+contact.id : 'no encontrado'}`);
                    }

                    // 2) Fallback: buscar por In-Reply-To (patrón vntg-contact-{id} o vntg-ticket-{id})
                    if (!contact) {
                        const idMatch = inReplyTo.match(/vntg-(?:contact|ticket)-(\d+)/);
                        if (idMatch) {
                            const [rows] = await db.query(
                                "SELECT id, nombre, email, thread_id FROM support_messages WHERE id = ? AND source IS NULL LIMIT 1",
                                [parseInt(idMatch[1], 10)]
                            );
                            if (rows.length > 0) contact = rows[0];
                            console.log(`[email-poller] Busqueda por In-Reply-To id=${idMatch[1]}: ${contact ? 'encontrado #'+contact.id : 'no encontrado'}`);
                        } else {
                            console.log(`[email-poller] In-Reply-To no coincide con patrón vntg: "${inReplyTo.substring(0, 60)}"`);
                        }
                    }

                    // 3) Fallback: buscar por email del remitente (cualquier contacto, incluso sin thread_id)
                    if (!contact && fromEmail) {
                        const [rows] = await db.query(
                            "SELECT id, nombre, email, thread_id FROM support_messages WHERE email = ? AND source IS NULL ORDER BY created_at DESC LIMIT 1",
                            [fromEmail]
                        );
                        if (rows.length > 0) contact = rows[0];
                        console.log(`[email-poller] Busqueda por email ${fromEmail}: ${contact ? 'encontrado #'+contact.id : 'no encontrado'}`);
                    }

                    if (contact) {
                        console.log(`[email-poller] Reply recibido para contact #${contact.id} de ${fromEmail} threadId=${contact.thread_id}`);

                        await db.query(
                            "INSERT INTO support_messages (nombre, email, mensaje, status, thread_id, source) VALUES (?, ?, ?, 'pending', ?, 'email_reply')",
                            [fromName, fromEmail, bodyText, contact.id]
                        );

                        const [history] = await db.query(
                            "SELECT * FROM support_messages WHERE id = ? OR thread_id = ? ORDER BY created_at ASC",
                            [contact.id, contact.id]
                        );

                        console.log(`[email-poller] Generando respuesta IA para contact #${contact.id} (historial: ${history.length} mensajes)`);
                        const aiResponse = await this.generateResponse(history);
                        console.log(`[email-poller] Respuesta IA ${aiResponse ? 'generada ('+aiResponse.length+' chars)' : 'null'}`);
                        if (aiResponse) {
                            const replyThreadId = gmailThreadId || contact.thread_id;
                            console.log(`[email-poller] Enviando reply threadId=${replyThreadId} a ${fromEmail}`);
                            await this.sendGmailReply(fromEmail, aiResponse, replyThreadId);

                            // Guardar la respuesta de la IA en el historial
                            await db.query(
                                "INSERT INTO support_messages (nombre, email, mensaje, respuesta, status, thread_id, source) VALUES (?, ?, ?, ?, 'replied', ?, 'bot_reply')",
                                ['VNTG Bot', 'hubvntg@gmail.com', bodyText, aiResponse, contact.id]
                            ).catch(err => console.error('[email-poller] Error guardando respuesta IA:', err.message));

                            console.log(`[email-poller] Auto-respuesta enviada y guardada para contact #${contact.id}`);
                        } else {
                            console.log(`[email-poller] No se generó respuesta IA para contact #${contact.id}`);
                        }
                    } else {
                        console.log(`[email-poller] No se encontró contacto para msg=${msg.id}`);
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

            // Marcar como vistos para no reprocesar
            for (const m of newMessages) {
                this.seenIds.add(m.id);
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
