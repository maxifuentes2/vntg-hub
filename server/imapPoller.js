const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const db = require('./db');

const TICKET_PATTERN = /<vntg-ticket-(\d+)@vntg-hub\.vercel\.app>/;

class ImapPoller {
  constructor() {
    this.client = null;
    this.interval = null;
  }

  async connect() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!user || !pass) {
      console.log('[imap] SMTP_USER/PASS no configurados, IMAP desactivado');
      return false;
    }

    this.client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: { user, pass },
      logger: false,
    });

    this.client.on('error', (err) => {
      console.error('[imap] Error en conexión IMAP:', err.message);
    });

    try {
      await this.client.connect();
      console.log('[imap] Conectado a Gmail IMAP');
      return true;
    } catch (err) {
      console.error('[imap] Error de conexión:', err.message);
      this.client = null;
      return false;
    }
  }

  async poll() {
    if (!this.client || !this.client.connection?.connected) {
      console.log('[imap] Reconectando...');
      const ok = await this.connect();
      if (!ok) return;
    }

    try {
      const lock = await this.client.getMailboxLock('INBOX');
      try {
        const uids = await this.client.search({ seen: false });
        if (uids.length === 0) return;

        for (const uid of uids) {
          try {
            const msg = await this.client.fetchOne(uid, { source: true });
            const parsed = await simpleParser(msg.source);

            const inReplyTo = parsed.inReplyTo || '';
            const match = inReplyTo.match(TICKET_PATTERN);

            if (match) {
              const ticketId = parseInt(match[1], 10);
              const fromName = parsed.from?.name || parsed.from?.text || 'Usuario';
              const fromEmail = parsed.from?.value?.[0]?.address || '';
              const bodyText = parsed.text || parsed.html || '';
              const cleanText = bodyText.replace(/<[^>]*>/g, '').trim().substring(0, 2000);

              await db.query(
                "INSERT INTO support_messages (nombre, email, mensaje, status, thread_id, source) VALUES (?, ?, ?, 'pending', ?, 'email')",
                [fromName, fromEmail, cleanText || '(sin contenido)', ticketId]
              );

              console.log(`[imap] Reply email recibido para ticket #${ticketId} de ${fromEmail}`);
            }
          } catch (err) {
            console.error('[imap] Error procesando email UID ' + uid + ':', err.message);
          }
        }

        await this.client.messageFlagsAdd(uids, ['\\Seen']);
        if (uids.length > 0) {
          console.log(`[imap] ${uids.length} email(s) procesado(s)`);
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      console.error('[imap] Error en poll:', err.message);
    }
  }

  start() {
    this.connect().then((ok) => {
      if (ok) {
        this.poll();
        this.interval = setInterval(() => this.poll(), 30000);
      }
    }).catch((err) => {
      console.error('[imap] Error en start:', err.message);
    });
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.client) {
      this.client.logout().catch(() => {});
    }
  }
}

module.exports = ImapPoller;
