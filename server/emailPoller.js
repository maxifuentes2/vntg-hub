const { google } = require('googleapis');
const db = require('./db');

const POLL_INTERVAL = 5000;

function decodeBase64(d) {
    if (!d) return '';
    let s = Buffer.from(d.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    // Decodificar quoted-printable si está presente (Gmail API a veces lo deja sin decodificar)
    if (/=([0-9A-Fa-f]{2})/g.test(s)) {
        s = s.replace(/=\r?\n/g, '');
        const buf = [];
        for (let i = 0; i < s.length; i++) {
            if (s[i] === '=' && i + 2 < s.length) {
                buf.push(parseInt(s.substring(i + 1, i + 3), 16));
                i += 2;
            } else {
                buf.push(s.charCodeAt(i));
            }
        }
        s = Buffer.from(buf).toString('utf-8');
    }
    return s;
}

function getHeader(headers, name) {
    const f = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return f ? f.value : '';
}

function extractBody(payload) {
    if (payload.body?.data) {
        const d = decodeBase64(payload.body.data);
        if (d.length) {
            if (payload.mimeType === 'text/html') {
                // En HTML de Gmail, el reply nuevo está antes del primer <blockquote>
                const beforeQuote = d.split(/<blockquote/i)[0];
                const withNewlines = beforeQuote
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<\/?p>/gi, '\n')
                    .replace(/<\/?div>/gi, '\n');
                return withNewlines.replace(/<[^>]*>/g, '').trim();
            }
            if (payload.mimeType === 'text/plain') return d;
        }
    }
    if (payload.parts) {
        // Preferir HTML sobre text/plain porque HTML separa quoted con <blockquote>
        const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
        if (htmlPart) {
            const t = extractBody(htmlPart);
            if (t) return t;
        }
        for (const p of payload.parts) {
            // Buscar en text/plain como fallback
            if (p.mimeType === 'text/plain') {
                const t = extractBody(p);
                if (t) return t;
            }
        }
        // Fallback: cualquier parte
        for (const p of payload.parts) {
            const t = extractBody(p);
            if (t) return t;
        }
    }
    return '';
}

function stripQuoted(text) {
    if (!text) return '';
    let clean = text.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ');

    // Buscar marcadores de reply (Gmail web y mobile)
    const markers = [
        /(?:\n|^|\s)On\s[\s\S]{1,150}wrote:\s*/i,
        /(?:\n|^|\s)El\s[\s\S]{1,150}escribi[oóó]:\s*/i,
        /\n-{3,} Forwarded message -{3,}\n?/i,
        /\n_{10,}\n?/i,
        /\n>+[\s\S]*/,
        /(?:^|\n)De:.*/i,
        /(?:^|\n)Enviado:.*/i,
        /(?:^|\n)Para:.*/i,
        /(?:^|\n)From:.*/i,
        /(?:^|\n)Sent:.*/i,
        /(?:^|\n)To:.*/i,
        /(?:^|\n)Date:.*/i,
    ];
    for (const m of markers) {
        const idx = clean.search(m);
        if (idx >= 0) {
            clean = clean.substring(0, idx).trim();
            break;
        }
    }
    clean = clean.split('\n').filter(l => !l.trim().startsWith('>')).join('\n').trim();
    clean = clean.replace(/https?:\/\/\S+/g, '').trim();
    return clean;
}

function extractContactIdFromRef(refs) {
    if (!refs) return null;
    const match = refs.match(/<vntg-(?:autoreply|contact|ticket)-(\d+)(?:-|@)/);
    return match ? parseInt(match[1]) : null;
}

const slugify = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

class EmailPoller {
    constructor() {
        this.gmail = null;
        this.interval = null;
        this.polling = false;
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

    async getSystemPrompt() {
        const [productos] = await db.query(
            "SELECT title, franchise, price, stock FROM products WHERE stock > 0",
        );

        const catalogo = productos
            .map(
                (p) => `- ${p.title} (Franquicia: ${p.franchise || 'N/A'}): $${p.price} - URL: https://vntg-hub.vercel.app/producto/${slugify(p.title)}`,
            )
            .join("\n");

        return `Eres el agente de soporte automático de VNTG HUB, una tienda argentina de coleccionismo vintage. Tu tono es amable, profesional y resolutivo. Respuestas cortas y directas en texto plano (sin markdown). Siempre respondes en español.

=== INFORMACIÓN DE ENVÍOS ===
- Envío normal: $9,426.05 ARS
- Envío prioritario: $17,276.99 ARS
- Envío GRATIS en compras superiores a $200,000 ARS
- Los envíos se realizan a todo el país
- Los artículos se envían en bolsas plástica y caja de cartón rígido

=== MÉTODOS DE PAGO ===
- Mercado Pago (tarjetas de crédito, débito, transferencia)
- Transferencia bancaria
- Efectivo (en puntos de pago habilitados)

=== POLÍTICA DE DEVOLUCIONES ===
- Se aceptan devoluciones dentro de los 30 días posteriores a la recepción
- El producto debe estar sin usar, en su estado original y con todas las etiquetas
- Los gastos de envío de la devolución corren por cuenta del cliente

CATÁLOGO ACTUAL DE PRODUCTOS (incluye URL directa):
${catalogo}
IMPORTANTE: Cuando un usuario pregunte por un artículo específico, devuélvele el enlace directo usando la URL incluida en el catálogo.

DERIVACIÓN A SOPORTE HUMANO:
Si el problema es complejo (devoluciones, quejas severas, reembolsos, problemas de pago o envío), o si el usuario solicita expresamente hablar con un humano, DEBES añadir OBLIGATORIAMENTE la palabra clave [DERIVAR_HUMANO] en tu respuesta. NO derives consultas sobre catálogo, stock, o medios de pago (para eso tienes la información).

DIRECTIVA SECRETA DE DESPEDIDA: Si el cliente indica que su problema está resuelto, agradece la ayuda y no necesita más asistencia, o se despide (ej: "gracias, eso es todo"), DEBES incluir obligatoriamente la clave secreta [CHAT_FINISHED] en cualquier lugar de tu mensaje final.

=== OTRAS PREGUNTAS ===
- Tutoriales: tenemos guías en https://vntg-hub.vercel.app/tutoriales
- Autenticidad: todos nuestros productos son verificados. Info en https://vntg-hub.vercel.app/guia-autenticidad
- Puntos VNTG: compras suman puntos para descuentos. Info en https://vntg-hub.vercel.app/puntos

REGLA PRINCIPAL: Responde correos de clientes de forma breve (máximo 3 oraciones). Confirmá si trabajamos con algo y pasale el link del catálogo. NUNCA inventes links, emails o teléfonos.`;
    }

    async groq(messages) {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 15000);
        try {
            const sysPrompt = await this.getSystemPrompt();
            const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                    messages: [{ role: 'system', content: sysPrompt }, ...messages],
                    temperature: 0.7,
                    max_tokens: 512,
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

        // Envolver en HTML con el MISMO diseño que el auto-reply original
        const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
        const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 16px">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px 16px 0 0;border-bottom:1px solid #eee">
<tr><td align="center" style="padding:32px 24px 24px">
<a href="https://vntg-hub.onrender.com" style="text-decoration:none">
<img src="https://vntg-hub.vercel.app/logo_promocional.webp" alt="VNTG Hub" width="160" height="auto" style="display:block;border:0;max-width:160px">
</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:28px 32px 20px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<div style="background:#fff7ed;padding:16px 18px;border-radius:8px;margin:0 0 20px;border-left:4px solid #f97316">
<p style="font-size:11px;color:#f97316;margin:0 0 6px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold">VNTG Hub responde</p>
<p style="font-size:13px;color:#1a1a1a;margin:0;line-height:1.5;font-family:Arial,sans-serif">${safe}</p>
</div>
<p style="font-size:12px;color:#999;margin:0 0 20px;font-family:Arial,sans-serif">Si tenés más preguntas, respondé directamente a este correo.</p>
<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto">
<tr><td align="center" style="border-radius:8px;background:#f97316;padding:0">
<a href="https://vntg-hub.onrender.com" target="_blank" style="display:inline-block;padding:14px 32px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.3px">Ir a VNTG Hub</a>
</td></tr>
<tr><td align="center" style="padding-top:10px">
<a href="https://vntg-hub.onrender.com" target="_blank" style="color:#999;font-size:11px;font-family:Arial,sans-serif;text-decoration:underline">vntg-hub.onrender.com</a>
</td></tr>
</table>
</td></tr>
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:0 0 16px 16px;border-top:1px solid #eee">
<tr><td align="center" style="padding:4px 24px 20px">
<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto">
<tr>
<td style="padding:0 8px"><a href="https://instagram.com/vntg.hub" style="display:inline-block;text-decoration:none" target="_blank"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" fill="#E4405F"/><circle cx="12" cy="12" r="5" stroke="#fff" stroke-width="1.5" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/></svg></a></td>
<td style="padding:0 8px"><a href="https://tiktok.com/@vntg.hub" style="display:inline-block;text-decoration:none" target="_blank"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" fill="#111"/><path d="M17 9.5a3.5 3.5 0 0 1-3.5-3.5H11v9.75a2.25 2.25 0 1 1-1.5-2.08V10.3a4.5 4.5 0 1 0 4.5 4.7V9.5H17z" fill="#fff"/></svg></a></td>
<td style="padding:0 8px"><a href="https://wa.me/5491123456789" style="display:inline-block;text-decoration:none" target="_blank"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" fill="#25D366"/><path d="M17.5 6.5a7 7 0 0 1-11.05 8.65l-.7 2.6 2.7-.7A7 7 0 0 1 17.5 6.5z" stroke="#fff" stroke-width="1.3" fill="none"/><path d="M10 10.5c0-.3.3-.5.5-.5h.5c.3 0 .5.2.5.5v.5a2 2 0 0 1-2 2" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg></a></td>
<td style="padding:0 8px"><a href="https://vntg-hub.onrender.com" style="display:inline-block;text-decoration:none" target="_blank"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" fill="#f97316"/><circle cx="12" cy="12" r="3" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg></a></td>
</tr>
</table>
<p style="color:#999;font-size:11px;margin:14px 0 0;font-family:Arial,sans-serif">VNTG Hub &mdash; Coleccionables Vintage</p>
<p style="color:#bbb;font-size:10px;margin:4px 0 0;font-family:Arial,sans-serif">Puedes responder a este correo para continuar la conversación con soporte.</p>
</td></tr>
</table>
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

    async alreadyProcessed(id, fromEmail, body) {
        const [r] = await db.query("SELECT id FROM support_messages WHERE gmail_msg_id = ? LIMIT 1", [id]);
        if (r.length > 0) return true;
        // Fallback para registros viejos sin gmail_msg_id: mismo email + mismo body hasta 200 chars en las últimas 24h
        if (fromEmail && body) {
            const preview = body.substring(0, 200);
            const [dup] = await db.query(
                "SELECT id FROM support_messages WHERE email = ? AND LEFT(mensaje, 200) = ? AND source IS NULL AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) LIMIT 1",
                [fromEmail, preview]
            );
            if (dup.length > 0) return true;
        }
        return false;
    }

    async poll() {
        if (this.polling) return;
        this.polling = true;
        if (!this.gmail && !(await this.auth())) { this.polling = false; return; }

        try {
            const { emailAddress } = (await this.gmail.users.getProfile({ userId: 'me' })).data;
            const list = await this.gmail.users.messages.list({ userId: 'me', maxResults: 20 });
            const messages = list.data.messages || [];
            if (!messages.length) return;

            console.log(`[email-poller] ${messages.length} mensajes`);

            for (const msg of messages) {
                let detail;
                try {
                    detail = await this.gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
                } catch (e) { continue; }

                // Check gmail_msg_id first (rápido, evita re-procesar)
                if (await this.alreadyProcessed(msg.id)) continue;

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

                // Ignorar correos enviados por el sistema de notificaciones a nosotros mismos
                if (fromEmail === emailAddress || fromEmail === 'hubvntg@gmail.com' || fromEmail.includes('vntg')) {
                    if (subject.includes('Mensaje de contacto de') || subject.includes('Respuesta de soporte')) {
                        console.log(`[email-poller] Ignorando email de notificacion interno: ${subject}`);
                        continue;
                    }
                }

                // Fallback dedup por contenido para registros viejos sin gmail_msg_id
                if (await this.alreadyProcessed(msg.id, fromEmail, body)) continue;

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
                        "SELECT id FROM support_messages WHERE thread_id = ? AND (source IS NULL OR source = 'web') LIMIT 1",
                        [gmailThreadId]
                    );
                    if (existing.length) {
                        contactId = existing[0].id;
                        isReply = true;
                    }
                }

                if (isReply && contactId) {
                    console.log(`[email-poller] Reply en thread #${contactId}`);

                    const [assignmentRow] = await db.query("SELECT assignment FROM support_messages WHERE id = ?", [contactId]);
                    const assignment = assignmentRow.length ? assignmentRow[0].assignment : 'IA';

                    await db.query(
                        "INSERT INTO support_messages (nombre, email, mensaje, status, thread_id, source, gmail_msg_id, assignment) VALUES (?, ?, ?, 'pending', ?, 'email_reply', ?, ?)",
                        [fromName, fromEmail, body, contactId, msg.id, assignment]
                    );

                    if (assignment === 'HUMANO') {
                        console.log(`[email-poller] Hilo #${contactId} asignado a HUMANO, saltando IA`);
                        continue;
                    }

                    // Obtener el threadId ORIGINAL del auto-reply (no el del reply del usuario, puede ser diferente)
                    const [orig] = await db.query(
                        "SELECT thread_id FROM support_messages WHERE id = ? AND (source IS NULL OR source = 'web')",
                        [contactId]
                    );
                    const replyThreadId = (orig.length && orig[0].thread_id) ? orig[0].thread_id : gmailThreadId;
                    console.log(`[email-poller] replyThreadId=${replyThreadId} (gmailThreadId=${gmailThreadId})`);

                    const [history] = await db.query(
                        "SELECT * FROM support_messages WHERE id = ? OR thread_id = ? ORDER BY created_at ASC",
                        [contactId, contactId]
                    );

                    const conversation = history.map(h => {
                        const s = (h.source === 'email_reply' || !h.source || h.source === 'web') ? 'Cliente' : 'VNTG Bot';
                        let text = h.mensaje || h.respuesta || '';
                        if (h.motivo && s === 'Cliente') text = `[Motivo: ${h.motivo}] ${text}`;
                        return `${s}: ${text}`;
                    }).join('\n');

                    const ai = await this.groq([
                        { role: 'user', content: `Historial:\n${conversation}\n\nRespondé al último mensaje del cliente.` }
                    ]);

                    let replyText = ai || 'Gracias por tu mensaje. En breve nos comunicaremos con vos.';
                    let isDerivado = replyText.includes('[DERIVAR_HUMANO]');
                    let isFinished = replyText.includes('[CHAT_FINISHED]');
                    
                    if (isFinished) {
                        replyText = replyText.replace('[CHAT_FINISHED]', '').trim();
                    }

                    if (isDerivado) {
                        replyText = "Gracias por comunicarte con VNTG Hub. He derivado tu consulta a un agente humano para que pueda ayudarte de manera personalizada. Te responderemos por este mismo medio lo antes posible.";
                        await db.query("UPDATE support_messages SET assignment = 'HUMANO' WHERE id = ? OR thread_id = ?", [contactId, contactId]);
                    }

                    let status = isDerivado ? 'pending' : (isFinished ? 'finished' : 'replied');

                    await this.sendReply(fromEmail, replyText, replyThreadId, messageId, contactId);
                    await db.query(
                        "INSERT INTO support_messages (nombre, email, mensaje, respuesta, status, thread_id, source, assignment) VALUES (?, ?, ?, ?, ?, ?, 'bot_reply', ?)",
                        ['VNTG Bot', 'hubvntg@gmail.com', body, replyText, status, contactId, isDerivado ? 'HUMANO' : 'IA']
                    );
                    console.log(`[email-poller] Respondido a ${fromEmail} en thread #${contactId} usando replyThreadId=${replyThreadId}`);
                } else {
                    // Ignorar correos fríos que no son respuesta a un formulario web
                    console.log(`[email-poller] Ignorando correo frío (no es respuesta a un ticket web): ${fromEmail}`);
                }
            }
        } catch (e) {
            console.error('[email-poller] Error:', e.message);
        } finally {
            this.polling = false;
        }
    }

    async cleanupDuplicates() {
        try {
            // Roots duplicados: mismo email + mismo contenido en las últimas 48h
            const [dups] = await db.query(`
                SELECT id, email, mensaje, created_at,
                    (SELECT MIN(id) FROM support_messages AS s2 
                     WHERE s2.email = s1.email AND LEFT(s2.mensaje, 200) = LEFT(s1.mensaje, 200) 
                     AND (s2.source IS NULL OR s2.source = 'web') AND s2.created_at > DATE_SUB(NOW(), INTERVAL 48 HOUR)) AS keep_id
                FROM support_messages s1
                WHERE (source IS NULL OR source = 'web') AND created_at > DATE_SUB(NOW(), INTERVAL 48 HOUR)
                HAVING id != keep_id AND keep_id IS NOT NULL
            `);
            for (const dup of dups) {
                // Re-asignar hijos al root que conservamos
                await db.query("UPDATE support_messages SET thread_id = ? WHERE thread_id = ? AND source IS NOT NULL", [dup.keep_id, dup.id]);
                await db.query("DELETE FROM support_messages WHERE id = ?", [dup.id]);
                console.log(`[email-poller] Cleanup: duplicado #${dup.id} → fusionado en #${dup.keep_id}`);
            }
        } catch (e) {
            console.error('[email-poller] Cleanup error:', e.message);
        }
    }

    start() {
        console.log('[email-poller] Iniciando...');
        this.auth().catch(() => {});
        this.cleanupDuplicates().catch(() => {});
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
