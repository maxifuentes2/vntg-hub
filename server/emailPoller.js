const { google } = require('googleapis');
const db = require('./db');

const POLL_INTERVAL = 20000;

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
                return beforeQuote.replace(/<[^>]*>/g, '').trim();
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
        /\nOn\b[\s\S]*?\bwrote:\s*\n?/i,
        /(?:^|\s)On\b[\s\S]*?\bwrote:\s*\n?/i,
        /\nEl\b[\s\S]*?\bescribió:\s*\n?/i,
        /(?:^|\s)El\b[\s\S]*?\bescribió:\s*\n?/i,
        /\n-{3,} Forwarded message -{3,}\n?/i,
        /\n_{10,}\n?/i,
        /\n>+[\s\S]*/,
        /(?:^|\n)De:.*/,
        /(?:^|\n)Enviado:.*/,
        /(?:^|\n)Para:.*/,
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
<p style="color:#bbb;font-size:10px;margin:4px 0 0;font-family:Arial,sans-serif">Este correo fue enviado automáticamente. No respondas a este mensaje.</p>
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

    async alreadyProcessed(id) {
        const [r] = await db.query("SELECT id FROM support_messages WHERE gmail_msg_id = ? LIMIT 1", [id]);
        return r.length > 0;
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

                    // Obtener el threadId ORIGINAL del auto-reply (no el del reply del usuario, puede ser diferente)
                    const [orig] = await db.query(
                        "SELECT thread_id FROM support_messages WHERE id = ? AND source IS NULL",
                        [contactId]
                    );
                    const replyThreadId = (orig.length && orig[0].thread_id) ? orig[0].thread_id : gmailThreadId;
                    console.log(`[email-poller] replyThreadId=${replyThreadId} (gmailThreadId=${gmailThreadId})`);

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

                    const replyText = ai || 'Gracias por tu mensaje. En breve nos comunicaremos con vos.';
                    await this.sendReply(fromEmail, replyText, replyThreadId, messageId, contactId);
                    await db.query(
                        "INSERT INTO support_messages (nombre, email, mensaje, respuesta, status, thread_id, source) VALUES (?, ?, ?, ?, 'replied', ?, 'bot_reply')",
                        ['VNTG Bot', 'hubvntg@gmail.com', body, replyText, contactId]
                    );
                    console.log(`[email-poller] Respondido a ${fromEmail} en thread #${contactId} usando replyThreadId=${replyThreadId}`);
                } else {
                    // Nuevo contacto — auto-reply genérico (no AI)
                    console.log(`[email-poller] Nuevo contacto de ${fromEmail}`);
                    const [result] = await db.query(
                        "INSERT INTO support_messages (nombre, email, mensaje, status, gmail_msg_id) VALUES (?, ?, ?, 'pending', ?)",
                        [fromName, fromEmail, body, msg.id]
                    );
                    contactId = result.insertId;

                    const genericReply = `Gracias por contactarte con VNTG Hub, ${fromName}. Recibimos tu consulta y te responderemos a la brevedad.`;
                    await this.sendReply(fromEmail, genericReply, gmailThreadId, messageId, contactId);
                    await db.query(
                        "INSERT INTO support_messages (nombre, email, respuesta, status, thread_id, source) VALUES (?, ?, ?, 'replied', ?, 'bot_reply')",
                        ['VNTG Bot', 'hubvntg@gmail.com', genericReply, contactId]
                    );
                    console.log(`[email-poller] Nuevo contacto respondido: #${contactId}`);
                    await db.query("UPDATE support_messages SET thread_id = ? WHERE id = ?", [gmailThreadId, contactId]);
                }
            }
        } catch (e) {
            console.error('[email-poller] Error:', e.message);
        } finally {
            this.polling = false;
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
