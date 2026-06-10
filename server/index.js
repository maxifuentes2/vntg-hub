const express = require("express");
const cors = require("cors");
require("dotenv").config();
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const BASE_URL = process.env.BASE_URL || "https://vntg-hub.onrender.com";
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("[FATAL] JWT_SECRET no está configurado en el entorno");
    process.exit(1);
}
const JWT_EXPIRES = process.env.JWT_EXPIRES || "1d";
const db = require("./db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const GmailPoller = require("./imapPoller");

const shipping = require("./shipping");
const multer = require("multer");
const path = require("path");

// Configuración de multer para subida de comprobantes
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `proof_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|webp|gif)$/i;
        if (allowed.test(path.extname(file.originalname))) {
            cb(null, true);
        } else {
            cb(new Error("Solo se permiten imágenes (jpg, jpeg, png, webp, gif)"));
        }
    }
});

// Datos bancarios para transferencia
const BANK_ACCOUNT = {
    bank: process.env.BANK_NAME || "Banco de la Nación Argentina",
    holder: process.env.BANK_HOLDER || "VNTG Hub S.A.",
    cuit: process.env.BANK_CUIT || "30-12345678-9",
    alias: process.env.BANK_ALIAS || "VNTG.HUB.TRANSFER",
    cbu: process.env.BANK_CBU || "0123456789012345678901",
};

// Direcciones crypto estáticas para pago manual
const CRYPTO_ADDRESSES = {
    usdttrc20: process.env.CRYPTO_USDT_TRC20 || "TKVYXdVh6rfkeYugiXFbduT3JsiP64ShjA",
    usdc: process.env.CRYPTO_USDC || "0xd044e54a586fc65ed87204b747e19e9216a1b88c",
    btc: process.env.CRYPTO_BTC || "3Mhrxf7iawv5Q41rZLuyS1RtqCnVE4Zkiy",
    eth: process.env.CRYPTO_ETH || "0xd044e54a586fc65ed87204b747e19e9216a1b88c",
    ltc: process.env.CRYPTO_LTC || "MQ4X5rkLChuNx8p81epTPa9S2vHYwmjtEm",
    sol: process.env.CRYPTO_SOL || "E27cUefTLS2d5Sa35aCcHt7dF8MPf3ic6WsHTeHAgqwx",
};

// Tablas creadas manualmente en TiDB Cloud

const app = express();
app.set('trust proxy', 1);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// --- Configuración de nodemailer (fallback directo) ---
const createTransporter = (prefix) => {
    const host = process.env[`${prefix}HOST`] || "smtp.gmail.com";
    const port = parseInt(process.env[`${prefix}PORT`] || "587");
    const user = process.env[`${prefix}USER`];
    const pass = process.env[`${prefix}PASS`];
    if (!user || !pass) return null;
    const secure = port === 465;
    return nodemailer.createTransport({
        host, port, secure,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
};

const HEADER = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px 16px 0 0;border-bottom:1px solid #eee">
        <tr>
            <td align="center" style="padding:32px 24px 24px">
                <a href="https://vntg-hub.vercel.app" style="text-decoration:none">
                    <img src="https://vntg-hub.vercel.app/logo_promocional.webp" alt="VNTG Hub" width="160" height="auto" style="display:block;border:0;max-width:160px">
                </a>
            </td>
        </tr>
    </table>`;

const FOOTER_SOCIAL = `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto">
        <tr>
            <td style="padding:0 8px">
                <a href="https://instagram.com/vntg.hub" style="display:inline-block;text-decoration:none" target="_blank">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" fill="#E4405F"/><circle cx="12" cy="12" r="5" stroke="#fff" stroke-width="1.5" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/></svg>
                </a>
            </td>
            <td style="padding:0 8px">
                <a href="https://tiktok.com/@vntg.hub" style="display:inline-block;text-decoration:none" target="_blank">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" fill="#111"/><path d="M17 9.5a3.5 3.5 0 0 1-3.5-3.5H11v9.75a2.25 2.25 0 1 1-1.5-2.08V10.3a4.5 4.5 0 1 0 4.5 4.7V9.5H17z" fill="#fff"/></svg>
                </a>
            </td>
            <td style="padding:0 8px">
                <a href="https://wa.me/5491123456789" style="display:inline-block;text-decoration:none" target="_blank">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" fill="#25D366"/><path d="M17.5 6.5a7 7 0 0 1-11.05 8.65l-.7 2.6 2.7-.7A7 7 0 0 1 17.5 6.5z" stroke="#fff" stroke-width="1.3" fill="none"/><path d="M10 10.5c0-.3.3-.5.5-.5h.5c.3 0 .5.2.5.5v.5a2 2 0 0 1-2 2" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>
                </a>
            </td>
            <td style="padding:0 8px">
                <a href="https://vntg-hub.vercel.app" style="display:inline-block;text-decoration:none" target="_blank">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" fill="#f97316"/><circle cx="12" cy="12" r="3" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>
                </a>
            </td>
        </tr>
    </table>`;

const FOOTER = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:0 0 16px 16px;border-top:1px solid #eee">
        <tr>
            <td align="center" style="padding:4px 24px 20px">
                ${FOOTER_SOCIAL}
                <p style="color:#999;font-size:11px;margin:14px 0 0;font-family:Arial,sans-serif">VNTG Hub &mdash; Coleccionables Vintage</p>
                <p style="color:#bbb;font-size:10px;margin:4px 0 0;font-family:Arial,sans-serif">Este correo fue enviado automáticamente. No respondas a este mensaje.</p>
            </td>
        </tr>
    </table>`;

const WRAP = (content) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 16px">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
                    <tr><td>${HEADER}</td></tr>
                    <tr>
                        <td style="padding:28px 32px 20px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
                            ${content}
                        </td>
                    </tr>
                    <tr><td>${FOOTER}</td></tr>
                </table>
            </td>
        </tr>
    </table>`;

const BTN = (text, url, bg = "#f97316") => `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto">
        <tr>
            <td align="center" style="border-radius:8px;background:${bg};padding:0">
                <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;background:${bg};color:#ffffff;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.3px;mso-hide:all">${text}</a>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-top:10px">
                <a href="${url}" target="_blank" style="color:#999;font-size:11px;font-family:Arial,sans-serif;text-decoration:underline">${url}</a>
            </td>
        </tr>
    </table>`;

const buildEmailHtml = (type, data) => {
    switch (type) {
        case "2fa_code":
            return WRAP(`
                <p style="font-size:14px;color:#666;margin:0 0 20px;font-family:Arial,sans-serif">Usá este código para completar tu inicio de sesión:</p>
                <div style="background:#fff7ed;border:2px dashed #f97316;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px">
                    <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#1a1a1a;font-family:monospace">${data.code}</span>
                </div>
                <p style="font-size:12px;color:#999;margin:0 0 24px;font-family:Arial,sans-serif">Válido por 5 minutos. Si no solicitaste este código, ignorá este mensaje.</p>
                ${BTN("Ir a la Tienda", "https://vntg-hub.vercel.app")}
            `);

        case "stock_alert":
            return WRAP(`
                <p style="font-size:14px;color:#1a1a1a;margin:0 0 6px;font-family:Arial,sans-serif">Hola ${data.userName},</p>
                <p style="font-size:14px;color:#333;margin:0 0 16px;line-height:1.5;font-family:Arial,sans-serif">El producto que tenías en tu lista de deseos ya tiene stock.</p>
                <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:14px 18px;border-radius:8px;margin:0 0 20px">
                    <p style="font-size:15px;font-weight:bold;color:#15803d;margin:0;font-family:Arial,sans-serif">${data.productTitle}</p>
                </div>
                <p style="font-size:13px;color:#666;margin:0 0 24px;font-family:Arial,sans-serif">¡No esperes demasiado! Este producto suele agotarse rápido.</p>
                ${BTN("Ver producto", `https://vntg-hub.vercel.app/producto/${data.productId}`)}
            `);

        case "order_status":
            return WRAP(`
                <p style="font-size:18px;font-weight:bold;color:#f97316;margin:0 0 12px;font-family:Arial,sans-serif">${data.title}</p>
                <p style="font-size:14px;color:#333;margin:0 0 24px;line-height:1.6;font-family:Arial,sans-serif">${data.message}</p>
                ${data.btnText && data.btnUrl ? `<div style="margin:0 0 16px">${BTN(data.btnText, data.btnUrl)}</div>` : ""}
                <div style="border-top:1px solid #eee;margin:20px 0 0;padding-top:20px;text-align:center">
                    <a href="https://vntg-hub.vercel.app" style="color:#f97316;font-size:13px;font-weight:bold;text-decoration:none;font-family:Arial,sans-serif">Ir a la Tienda →</a>
                </div>
            `);

        case "support_reply":
            return WRAP(`
                <p style="font-size:14px;color:#1a1a1a;margin:0 0 18px;font-family:Arial,sans-serif">Hola ${data.nombre},</p>
                <div style="background:#f5f5f5;padding:16px 18px;border-radius:8px;margin:0 0 14px">
                    <p style="font-size:11px;color:#999;margin:0 0 6px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold">Tu consulta</p>
                    <p style="font-size:13px;color:#333;margin:0;font-family:Arial,sans-serif">${data.mensajeOriginal}</p>
                </div>
                <div style="background:#fff7ed;padding:16px 18px;border-radius:8px;margin:0 0 20px;border-left:4px solid #f97316">
                    <p style="font-size:11px;color:#f97316;margin:0 0 6px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold">Nuestra respuesta</p>
                    <p style="font-size:13px;color:#1a1a1a;margin:0;line-height:1.5;font-family:Arial,sans-serif">${data.respuesta}</p>
                </div>
                ${BTN("Ir a mi cuenta", "https://vntg-hub.vercel.app/perfil")}
            `);

        case "contact":
            return WRAP(`
                <p style="font-size:14px;color:#666;margin:0 0 4px;font-family:Arial,sans-serif">Nuevo mensaje desde el formulario de contacto</p>
                <p style="font-size:12px;color:#999;margin:0 0 16px;font-family:Arial,sans-serif"><strong>De:</strong> ${data.nombre} &lt;${data.email}&gt;</p>
                <div style="background:#f5f5f5;padding:16px 18px;border-radius:8px;margin:0 0 4px">
                    <p style="font-size:13px;color:#333;margin:0;line-height:1.5;font-family:Arial,sans-serif">${data.mensaje}</p>
                </div>
            `);

        case "chat_summary": {
            const chatHtml = Array.isArray(data.messages) ? data.messages.map((m) => {
                const isUser = m.role === "user";
                const align = isUser ? "right" : "left";
                const bg = isUser ? "#f97316" : "#f5f5f5";
                const color = isUser ? "#fff" : "#1a1a1a";
                const label = isUser ? "Tú" : "VNTG Bot";
                return `
                    <tr>
                        <td align="${align}" style="padding:4px 0">
                            <span style="font-size:10px;color:#999;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px">${label}</span>
                            <div style="display:inline-block;background:${bg};color:${color};padding:10px 14px;border-radius:18px;max-width:85%;font-size:13px;line-height:1.5;word-wrap:break-word;text-align:left;margin-top:2px;${isUser ? "border-bottom-right-radius:4px" : "border-bottom-left-radius:4px"}">
                                ${m.text.replace(/\n/g, '<br>')}
                            </div>
                        </td>
                    </tr>
                `;
            }).join("") : `<tr><td style="padding:12px 0;color:#666;font-size:13px">${data.summary || ""}</td></tr>`;
            return WRAP(`
                <p style="font-size:16px;font-weight:bold;color:#f97316;margin:0 0 4px;font-family:Arial,sans-serif">Transcripción de tu conversación</p>
                <p style="font-size:12px;color:#999;margin:0 0 16px;font-family:Arial,sans-serif">VNTG Hub &mdash; Chat de soporte</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #eee;border-radius:12px;padding:16px">
                    ${chatHtml}
                </table>
                <div style="margin-top:20px">${BTN("Volver a VNTG Hub", "https://vntg-hub.vercel.app")}</div>
            `);
        }

        case "reset_password":
            return WRAP(`
                <p style="font-size:14px;color:#1a1a1a;margin:0 0 6px;font-family:Arial,sans-serif">Hola,</p>
                <p style="font-size:14px;color:#333;margin:0 0 16px;line-height:1.5;font-family:Arial,sans-serif">Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>VNTG Hub</strong>.</p>
                <p style="font-size:13px;color:#555;margin:0 0 20px;line-height:1.5;font-family:Arial,sans-serif">Hacé clic en el siguiente botón para crear una nueva contraseña:</p>
                ${BTN("Restablecer contraseña", data.resetUrl)}
                <p style="font-size:12px;color:#999;margin:16px 0 0;font-family:Arial,sans-serif">Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignorá este mensaje.</p>
            `);
    }
};

const getEmailSubject = (type, data) => {
    const subjects = {
        "2fa_code":       "Tu código de verificación — VNTG Hub",
        "stock_alert":    `¡${data.productTitle} tiene stock! — VNTG Hub`,
        "order_status":   data.subject || "Estado de tu pedido — VNTG Hub",
        "support_reply":  "Respuesta de soporte — VNTG Hub",
        "contact":        `Mensaje de contacto de ${data.nombre} — VNTG Hub`,
        "chat_summary":   "Transcripción de tu conversación — VNTG Hub",
        "reset_password": "Restablecer tu contraseña — VNTG Hub",
    };
    return subjects[type] || "Notificación — VNTG Hub";
};

const sendEmail = async (type, to, data) => {
    const isSupport = type === "support_reply" || type === "contact";
    const prefix = isSupport ? "SMTP_SUPPORT_" : "SMTP_";
    const fromKey = isSupport ? "EMAIL_SUPPORT_FROM" : "EMAIL_FROM";
    const from = process.env[fromKey] || (isSupport ? '"VNTG Soporte" <soportehubvntg@gmail.com>' : '"VNTG Hub" <hubvntg@gmail.com>');
    const subject = getEmailSubject(type, data);
    const html = buildEmailHtml(type, data);

    if (resend) {
        try {
            const { error } = await resend.emails.send({ from, to, subject, html });
            if (error) {
                console.error(`[email] Error Resend type="${type}" to="${to}":`, error);
            } else {
                console.log(`[email] OK via Resend type="${type}" to="${to}"`);
                return { sentVia: "resend" };
            }
        } catch (err) {
            console.error(`[email] Resend exception type="${type}" to="${to}":`, err.message);
        }
    }

    const transporter = createTransporter(prefix);
    if (!transporter) {
        console.error(`[email] SMTP${isSupport ? " soporte" : ""} no configurado. No se pudo enviar email type="${type}" to="${to}"`);
        return { error: true, reason: `SMTP${isSupport ? "_SUPPORT" : ""} not configured` };
    }

    const mailOptions = { from, to, subject, html };
    if (type === "support_reply" && data.ticketId) {
        mailOptions.messageId = `<vntg-ticket-${data.ticketId}@vntg-hub.vercel.app>`;
    }
    try {
        await transporter.sendMail(mailOptions);
        console.log(`[email] OK via SMTP type="${type}" to="${to}"`);
        return { sentVia: "smtp" };
    } catch (err) {
        console.error(`[email] Error SMTP type="${type}" to="${to}":`, err.message);
        return { error: true, reason: err.message };
    }
};

// --- SEGURIDAD: Rate limiting ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Demasiados intentos. Intentá de nuevo en 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
});
const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: "Demasiados mensajes. Esperá un momento." },
    standardHeaders: true,
    legacyHeaders: false,
});
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { error: "Demasiados mensajes de contacto. Intentá de nuevo más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});
const lookupLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { error: "Demasiadas consultas. Esperá un momento." },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- Helper para cookie httpOnly JWT ---
const isLocalhost = (origin) => origin && (origin.includes("localhost") || origin.includes("192.168.") || origin.includes("127.0.0.1"));
const setAuthCookie = (res, token) => {
    if (!token) {
        res.clearCookie("vntg_token", { httpOnly: true, secure: false, sameSite: "lax", path: "/" });
        return;
    }
    const origin = res.req?.headers?.origin || "";
    const secure = !isLocalhost(origin);
    res.cookie("vntg_token", token, {
        httpOnly: true,
        secure,
        sameSite: secure ? "none" : "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
    });
};

app.use(
    cors({
        origin: ["http://localhost:5173", "https://vntg-hub.vercel.app", /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- SEGURIDAD: Cabeceras HTTP ---
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:");
    next();
});

// Función para generar slugs URL-friendly desde nombres/títulos
const slugify = (text) => {
    if (!text) return "";
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
};

// --- MIDDLEWARE: Verificación de JWT para usuarios autenticados ---
const verifyToken = (req, res, next) => {
    const token = req.cookies?.vntg_token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No autorizado" });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
};

// --- USUARIO ACTUAL (datos frescos) ---
app.get("/api/user", verifyToken, async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, email, address, city, province, zip_code, phone, dni, role, points FROM users WHERE id = ?",
            [req.user.id],
        );
        if (!users[0]) return res.status(404).json({ error: "Usuario no encontrado" });
        res.json(users[0]);
    } catch (err) {
        console.error("Error /api/user:", err);
        res.status(500).json({ error: "Error del servidor" });
    }
});

// --- PRODUCTOS ---
app.get("/api/products", async (req, res) => {
    const { categoryId, q, minPrice, maxPrice, franchise } = req.query;
    let sql = "SELECT p.* FROM products p LEFT JOIN categories c ON p.categoryId = c.id WHERE 1=1";
    const params = [];
    if (categoryId && categoryId !== "all") {
        sql += " AND p.categoryId = ?";
        params.push(categoryId);
    }
    if (minPrice) {
        sql += " AND p.price >= ?";
        params.push(Number(minPrice));
    }
    if (maxPrice) {
        sql += " AND p.price <= ?";
        params.push(Number(maxPrice));
    }
    if (franchise) {
        const franchises = franchise.split(',').map(f => f.trim()).filter(f => f);
        if (franchises.length === 1) {
            sql += " AND p.franchise = ?";
            params.push(franchises[0]);
        } else if (franchises.length > 1) {
            sql += ` AND p.franchise IN (${franchises.map(() => '?').join(',')})`;
            params.push(...franchises);
        }
    }
    if (q) {
        // Normalizar: quitar acentos y pasar a minúsculas
        const normalizedQ = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        
        // Diccionario local de sinónimos para rapidez y fiabilidad extrema
        const synonymMap = {
            "peliculas": ["cine", "movie", "film", "hollywood", "estreno", "pantalla"],
            "pelicula": ["cine", "movie", "film", "hollywood", "estreno", "pantalla"],
            "autos": ["coche", "vehiculo", "car", "escala", "motor", "ruedas"],
            "auto": ["coche", "vehiculo", "car", "escala", "motor", "ruedas"],
            "figuras": ["figura", "coleccionable", "statue", "action figure", "muñeco", "toys", "funko"],
            "figura": ["figura", "coleccionable", "statue", "action figure", "muñeco", "toys", "funko"],
            "comics": ["historieta", "dc", "marvel", "manga", "lectura"],
            "anime": ["manga", "japon", "otaku", "animacion"]
        };

        // Dividir en palabras y aplicar un "stemming" ultra-básico
        let keywords = normalizedQ.split(/\s+/).filter(w => w.length > 2).map(word => {
            if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
            if (word.endsWith('s') && word.length > 3) return word.slice(0, -1);
            return word;
        });

        // Enriquecer con el mapa local
        keywords.forEach(word => {
            if (synonymMap[word]) {
                keywords = [...new Set([...keywords, ...synonymMap[word]])];
            }
        });

        // --- EXPANSIÓN SEMÁNTICA CON IA (GEMINI) ---
        // Se mantiene como capa extra de inteligencia
        if (normalizedQ.length > 3) {
            try {
                const semanticModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = `Actúa como un expert en coleccionismo. El usuario busca "${normalizedQ}". 
                Devuelve una lista de 5 palabras clave relacionadas (sinónimos, franquicias o temas). 
                Solo palabras separadas por comas.`;
                const result = await semanticModel.generateContent(prompt);
                const expanded = result.response.text().split(",").map(t => t.trim().toLowerCase()).filter(t => t.length > 2);
                keywords = [...new Set([...keywords, ...expanded])];
            } catch (aiErr) {
                // Falla silenciosa de la IA
            }
        }

        if (keywords.length > 0) {
            sql += " AND (";
            const keywordConditions = [];
            
            // 1. Prioridad: Coincidencia exacta de la frase completa en campos clave
            keywordConditions.push("(LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.franchise) LIKE ? OR LOWER(c.name) LIKE ?)");
            params.push(`%${normalizedQ}%`, `%${normalizedQ}%`, `%${normalizedQ}%`, `%${normalizedQ}%`);

            // 2. Coincidencia de palabras clave en TODOS los campos técnicos
            keywords.forEach(word => {
                if (word.length < 3) return;
                keywordConditions.push("(LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.franchise) LIKE ? OR LOWER(p.escala) LIKE ? OR LOWER(p.fabricante) LIKE ? OR LOWER(p.anio) LIKE ? OR LOWER(p.material) LIKE ? OR LOWER(c.name) LIKE ?)");
                const searchTerm = `%${word}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
            });

            sql += keywordConditions.join(" OR ");
            sql += ")";
        } else {
            sql += " AND (LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.franchise) LIKE ? OR LOWER(c.name) LIKE ?)";
            const searchTerm = `%${normalizedQ}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
    }
    // Ordenar: Los que tienen stock arriba, luego por ID
    sql += " ORDER BY (p.stock > 0) DESC, p.id DESC";
    try {
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error("Error en búsqueda:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

app.get("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);
    try {
        let rows;
        if (isNumeric) {
            [rows] = await db.query("SELECT * FROM products WHERE id = ?", [
                id,
            ]);
        } else {
            // Búsqueda por slug: traer todos y filtrar en JS
            const [all] = await db.query("SELECT * FROM products");
            rows = all.filter((p) => slugify(p.title) === id);
        }
        if (rows.length === 0)
            return res.status(404).json({ error: "No encontrado" });

        const producto = rows[0];
        if (producto.gallery) {
            if (typeof producto.gallery === "string") {
                try {
                    producto.gallery = JSON.parse(producto.gallery);
                } catch (e) {
                    producto.gallery = producto.gallery
                        .split(",")
                        .map((img) => img.trim());
                }
            }
        } else {
            producto.gallery = [];
        }

        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

app.get("/api/categories", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT DISTINCT c.* FROM categories c INNER JOIN products p ON c.id = p.categoryId",
        );
        // Agregar campo slug derivado del nombre
        const withSlug = rows.map((c) => ({ ...c, slug: slugify(c.name) }));
        res.json(withSlug);
    } catch (error) {
        res.status(500).json({ error: "Error" });
    }
});

// --- RUTAS DE WISHLIST (protegidas con JWT) ---
app.get("/api/wishlist/:userId", verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT p.* FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?",
            [req.user.id],
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: "Error al obtener wishlist" });
    }
});

app.post("/api/wishlist", verifyToken, async (req, res) => {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "Producto requerido" });
    try {
        await db.query(
            "INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)",
            [req.user.id, productId],
        );
        res.json({ message: "Ok" });
    } catch (e) {
        res.status(500).json({ error: "Error al guardar en wishlist" });
    }
});

app.delete("/api/wishlist/:userId/:productId", verifyToken, async (req, res) => {
    try {
        await db.query(
            "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
            [req.user.id, req.params.productId],
        );
        res.json({ message: "Ok" });
    } catch (e) {
        res.status(500).json({ error: "Error al eliminar de wishlist" });
    }
});

app.delete("/api/wishlist/:userId", verifyToken, async (req, res) => {
    try {
        await db.query("DELETE FROM wishlist WHERE user_id = ?", [req.user.id]);
        res.json({ message: "Wishlist cleared" });
    } catch (e) {
        res.status(500).json({ error: "Error al limpiar wishlist" });
    }
});

// --- PERFIL DE USUARIO (protegido con JWT) ---
app.put("/api/auth/update-profile", verifyToken, async (req, res) => {
    const { field, value } = req.body;
    const allowedFields = ["address", "city", "province", "zip_code", "phone", "dni"];
    if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: "Campo no permitido" });
    }
    if (typeof value !== "string" || value.length > 255) {
        return res.status(400).json({ error: "Valor inválido" });
    }
    try {
        await db.query(`UPDATE users SET ${field} = ? WHERE id = ?`, [
            value,
            req.user.id,
        ]);
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
            req.user.id,
        ]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const {
            password,
            verification_code,
            verification_expires,
            ...userSinPass
        } = rows[0];
        res.json({
            message: "Perfil actualizado correctamente",
            user: userSinPass,
        });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// --- INTERESES DE USUARIO (protegido con JWT) ---

app.get("/api/auth/interests", verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT category_id FROM user_interests WHERE user_id = ?",
            [req.user.id]
        );
        res.json(rows.map(r => String(r.category_id)));
    } catch (error) {
        console.error("Error al obtener intereses:", error);
        res.status(500).json({ error: "Error al obtener intereses" });
    }
});

app.put("/api/auth/interests", verifyToken, async (req, res) => {
    const { categoryIds } = req.body;
    if (!Array.isArray(categoryIds)) {
        return res.status(400).json({ error: "categoryIds debe ser un array" });
    }
    try {
        await db.query("DELETE FROM user_interests WHERE user_id = ?", [req.user.id]);
        if (categoryIds.length > 0) {
            const values = categoryIds.map(catId => [req.user.id, catId]);
            await db.query(
                "INSERT INTO user_interests (user_id, category_id) VALUES ?",
                [values]
            );
        }
        res.json({ message: "Intereses actualizados correctamente", categoryIds: categoryIds.map(String) });
    } catch (error) {
        console.error("Error al guardar intereses:", error);
        res.status(500).json({ error: "Error al guardar intereses" });
    }
});

// --- DIRECCIONES MÚLTIPLES (protegido con JWT) ---

app.get("/api/addresses", verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener direcciones:", error);
        res.status(500).json({ error: "Error al obtener direcciones" });
    }
});

app.post("/api/addresses", verifyToken, async (req, res) => {
    const { tag, address, city, province, zip_code, phone } = req.body;
    if (!address || !city || !province || !zip_code) {
        return res.status(400).json({ error: "Campos obligatorios: address, city, province, zip_code" });
    }
    try {
        // Verificar si es la primera dirección → default automático
        const [existing] = await db.query("SELECT COUNT(*) AS count FROM addresses WHERE user_id = ?", [req.user.id]);
        const isDefault = existing[0].count === 0;

        const [result] = await db.query(
            "INSERT INTO addresses (user_id, tag, address, city, province, zip_code, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [req.user.id, tag || "", address, city, province, zip_code, phone || "", isDefault]
        );

        const [created] = await db.query("SELECT * FROM addresses WHERE id = ?", [result.insertId]);
        res.status(201).json(created[0]);
    } catch (error) {
        console.error("Error al crear dirección:", error);
        res.status(500).json({ error: "Error al crear dirección" });
    }
});

app.put("/api/addresses/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const { tag, address, city, province, zip_code, phone } = req.body;
    try {
        const [existing] = await db.query("SELECT * FROM addresses WHERE id = ? AND user_id = ?", [id, req.user.id]);
        if (existing.length === 0) return res.status(404).json({ error: "Dirección no encontrada" });

        await db.query(
            "UPDATE addresses SET tag=?, address=?, city=?, province=?, zip_code=?, phone=? WHERE id=? AND user_id=?",
            [tag ?? existing[0].tag, address ?? existing[0].address, city ?? existing[0].city, province ?? existing[0].province, zip_code ?? existing[0].zip_code, phone ?? existing[0].phone, id, req.user.id]
        );

        const [updated] = await db.query("SELECT * FROM addresses WHERE id = ?", [id]);
        res.json(updated[0]);
    } catch (error) {
        console.error("Error al actualizar dirección:", error);
        res.status(500).json({ error: "Error al actualizar dirección" });
    }
});

app.put("/api/addresses/:id/default", verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [existing] = await db.query("SELECT * FROM addresses WHERE id = ? AND user_id = ?", [id, req.user.id]);
        if (existing.length === 0) return res.status(404).json({ error: "Dirección no encontrada" });

        // Quitar default de todas las direcciones del usuario
        await db.query("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [req.user.id]);
        // Poner default en la seleccionada
        await db.query("UPDATE addresses SET is_default = TRUE WHERE id = ?", [id]);

        const [updated] = await db.query("SELECT * FROM addresses WHERE id = ?", [id]);
        res.json(updated[0]);
    } catch (error) {
        console.error("Error al establecer dirección default:", error);
        res.status(500).json({ error: "Error al establecer dirección predeterminada" });
    }
});

app.delete("/api/addresses/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [existing] = await db.query("SELECT * FROM addresses WHERE id = ? AND user_id = ?", [id, req.user.id]);
        if (existing.length === 0) return res.status(404).json({ error: "Dirección no encontrada" });

        const wasDefault = existing[0].is_default;
        await db.query("DELETE FROM addresses WHERE id = ? AND user_id = ?", [id, req.user.id]);

        // Si borramos la default, asignar default a la más reciente si existe
        if (wasDefault) {
            const [remaining] = await db.query("SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", [req.user.id]);
            if (remaining.length > 0) {
                await db.query("UPDATE addresses SET is_default = TRUE WHERE id = ?", [remaining[0].id]);
            }
        }

        res.json({ message: "Dirección eliminada" });
    } catch (error) {
        console.error("Error al eliminar dirección:", error);
        res.status(500).json({ error: "Error al eliminar dirección" });
    }
});

// --- AUTENTICACIÓN ---

app.post("/api/auth/register", authLimiter, async (req, res) => {
    const { name, email, password, dni } = req.body;

    try {
        const [existingUsers] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email],
        );
        if (existingUsers.length > 0) {
            return res
                .status(400)
                .json({ error: "El correo ya está registrado" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            "INSERT INTO users (name, email, password, dni) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, dni || ""],
        );

        res.status(201).json({ message: "Usuario registrado exitosamente" });
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({
            error: "Error interno del servidor al registrar",
        });
    }
});

app.post("/api/auth/login/local", authLimiter, async (req, res) => {
    const { email, password, deviceToken } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
            email,
        ]);
        if (!users[0] || !users[0].password)
            return res.status(401).json({ error: "Credenciales" });
        const valid = await bcrypt.compare(password, users[0].password);
        if (!valid) return res.status(401).json({ error: "Credenciales" });

        // --- LÓGICA DE DISPOSITIVO DE CONFIANZA ---
        if (deviceToken) {
            const [trusted] = await db.query(
                "SELECT * FROM trusted_devices WHERE user_id = ? AND device_token = ? AND expires_at > NOW()",
                [users[0].id, deviceToken],
            );

            if (trusted.length > 0) {
                // Si el dispositivo es conocido y no expiró, entramos directo
                const {
                    password,
                    verification_code,
                    verification_expires,
                    ...userSinPass
                } = users[0];
                const token = jwt.sign(
                    { id: users[0].id, email: users[0].email, role: users[0].role || 'user' },
                    JWT_SECRET,
                    { expiresIn: JWT_EXPIRES },
                );
                setAuthCookie(res, token);
                return res.json({
                    message: "Inicio rápido",
                    user: userSinPass,
                    skipCode: true,
                    token,
                });
            }
        }

        // Si no hay token o no es válido, procedemos con el código de siempre
        const code = crypto.randomInt(100000, 999999).toString();
        await db.query(
            "UPDATE users SET verification_code = ?, verification_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?",
            [code, users[0].id],
        );

        await sendEmail("2fa_code", email, { code });
        res.json({ message: "Código enviado", requireCode: true, email });
    } catch (error) {
        res.status(500).json({ error: "Error" });
    }
});

app.post("/api/auth/verify-code", authLimiter, async (req, res) => {
    const { email, code, rememberDevice } = req.body;
    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ? AND verification_code = ? AND verification_expires > NOW()",
            [email, code],
        );
        if (rows.length === 0)
            return res.status(401).json({ error: "Inválido" });

        const user = rows[0];
        let newToken = null;

        if (rememberDevice) {
            newToken = uuidv4();
            await db.query(
                "INSERT INTO trusted_devices (user_id, device_token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))",
                [user.id, newToken],
            );
        }

        await db.query(
            "UPDATE users SET verification_code = NULL, verification_expires = NULL WHERE id = ?",
            [user.id],
        );
        const {
            password,
            verification_code,
            verification_expires,
            ...userSinPass
        } = user;
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES },
        );
        setAuthCookie(res, token);

        res.json({
            message: "Éxito",
            user: userSinPass,
            deviceToken: newToken,
            token,
        });
    } catch (error) {
        res.status(500).json({ error: "Error" });
    }
});

app.post("/api/auth/google", authLimiter, async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
            email,
        ]);
        let user;
        if (users.length === 0) {
            await db.query(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                [name, email, "google-auth-user-" + googleId],
            );
            const [newUser] = await db.query(
                "SELECT * FROM users WHERE email = ?",
                [email],
            );
            user = newUser[0];
        } else {
            user = users[0];
        }
        const { password, ...userSinPass } = user;
        const jwtToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES },
        );
        setAuthCookie(res, jwtToken);
        res.json({ user: userSinPass, token: jwtToken });
    } catch (error) {
        console.error("Error en Google Auth:", error);
        res.status(500).json({ error: "Error al autenticar con Google" });
    }
});

// --- CERRAR SESIÓN (limpiar cookie) ---
app.post("/api/auth/logout", (req, res) => {
    setAuthCookie(res, null);
    res.json({ message: "Sesión cerrada" });
});

// --- RESTABLECER CONTRASEÑA ---
app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });
    try {
        const [users] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.json({ message: "Si el email existe, recibirás un enlace" });

        const token = require("crypto").randomBytes(32).toString("hex");
        await db.query(
            "UPDATE users SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?",
            [token, users[0].id]
        );

        await sendEmail("reset_password", email, {
            resetUrl: `https://vntg-hub.vercel.app/reset-password?email=${encodeURIComponent(email)}&token=${token}`,
        });

        res.json({ message: "Si el email existe, recibirás un enlace" });
    } catch (error) {
        console.error("Error forgot password:", error);
        res.status(500).json({ error: "Error al procesar la solicitud" });
    }
});

app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ error: "Email, token y contraseña requeridos" });
    if (newPassword.length < 6) return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    try {
        const [users] = await db.query(
            "SELECT id FROM users WHERE email = ? AND reset_token = ? AND reset_expires > NOW()",
            [email, token]
        );
        if (users.length === 0) return res.status(400).json({ error: "El enlace expiró o es inválido" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await db.query(
            "UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
            [hashedPassword, users[0].id]
        );

        res.json({ message: "Contraseña actualizada con éxito." });
    } catch (error) {
        console.error("Error reset password:", error);
        res.status(500).json({ error: "Error al restablecer la contraseña" });
    }
});

// --- DETALLE DE ORDEN ESPECÍFICA (protegida con JWT) ---
app.get("/api/orders/detail/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [
            id,
        ]);
        if (orders.length === 0)
            return res.status(404).json({ error: "Orden no encontrada" });

        if (orders[0].user_id !== req.user.id) {
            return res.status(403).json({ error: "No tienes acceso a esta orden" });
        }

        const [items] = await db.query(
            `
            SELECT oi.*, p.title, p.images 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?
        `,
            [id],
        );

        res.json({ ...orders[0], items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno" });
    }
});

// --- HISTORIAL DE ÓRDENES (Usuario normal, protegido con JWT) ---
app.get("/api/orders/:userId", verifyToken, async (req, res) => {
    try {
        // CORRECCIÓN APLICADA AQUÍ: Se añadieron todos los estados válidos
        const [rows] = await db.query(
            "SELECT * FROM orders WHERE user_id = ? AND status IN ('pending', 'approved', 'preparing', 'ready', 'shipped', 'delivered') ORDER BY created_at DESC",
            [req.user.id],
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener órdenes:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Generador de ID estilo número de orden (7 caracteres: 2 letras + 3 números + 2 letras)
const generatePatenteId = () => {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin O, I para evitar confusiones
    const digits = "23456789"; // sin 0, 1 para evitar confusiones
    const rand = (chars) => chars[crypto.randomInt(chars.length)];
    return `${rand(letters)}${rand(letters)}${rand(digits)}${rand(digits)}${rand(digits)}${rand(letters)}${rand(letters)}`;
};

// --- CHECKOUT (protegido con JWT) ---
app.post("/api/checkout", verifyToken, async (req, res) => {
    const { cart, shipping: shippingData, shippingType, puntosAUsar } = req.body;
    if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: "Carrito vacío" });
    }
    try {
        await db.query(
            "UPDATE orders SET status = 'cancelled' WHERE user_id = ? AND status = 'pending'",
            [req.user.id],
        );
        // Generar ID único estilo número de orden (evitar colisiones)
        let orderId = generatePatenteId();
        let exists = true;
        while (exists) {
            const [dup] = await db.query("SELECT id FROM orders WHERE id = ?", [orderId]);
            if (dup.length === 0) exists = false;
            else orderId = generatePatenteId();
        }
        let subtotal = 0;
        for (let item of cart) {
            const [prod] = await db.query(
                "SELECT stock, price FROM products WHERE id = ?",
                [item.id],
            );
            if (!prod[0] || prod[0].stock < item.cantidad)
                return res.status(400).json({ error: "Sin stock" });
            subtotal += prod[0].price * item.cantidad;
        }
        let shippingCost = 0;
        const cfg = await shipping.loadConfig(db);
        if (subtotal < cfg.ENVIO_GRATIS_DESDE) {
            if (shippingType === "normal") shippingCost = cfg.COSTO_NORMAL;
            else if (shippingType === "prioritario") shippingCost = cfg.COSTO_PRIORITARIO;
        }
        
        const totalPrevio = subtotal + shippingCost;

        // --- LÓGICA DE CANJE DE PUNTOS ---
        let descuento = 0;
        let puntosARestar = 0;

        const [userRes] = await db.query("SELECT points FROM users WHERE id = ?", [req.user.id]);
        const puntosDisponibles = userRes[0]?.points || 0;

        if (puntosAUsar > 0 && puntosDisponibles > 0) {
            const valorPorPunto = 10;
            const puntosValidos = Math.min(puntosAUsar, puntosDisponibles, Math.ceil(totalPrevio / valorPorPunto));
            descuento = puntosValidos * valorPorPunto;
            puntosARestar = puntosValidos;
        }

        const totalFinal = totalPrevio - descuento;

        if (puntosARestar > 0) {
            await db.query("UPDATE users SET points = points - ? WHERE id = ?", [puntosARestar, req.user.id]);
        }

        await db.query(
            "INSERT INTO orders (id, user_id, total, status, shipping_info, expires_at) VALUES (?, ?, ?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
            [orderId, req.user.id, totalFinal, JSON.stringify({ ...shippingData, shippingType })],
        );
        for (let item of cart) {
            await db.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [orderId, item.id, item.cantidad, item.price],
            );
            await db.query(
                "UPDATE products SET stock = stock - ? WHERE id = ?",
                [item.cantidad, item.id],
            );
        }

        // Si el descuento por puntos cubre el 100% de la orden, saltamos Mercado Pago
        if (totalFinal <= 0) {
            await db.query("UPDATE orders SET status = 'approved' WHERE id = ?", [orderId]);
            return res.json({ init_point: `https://vntg-hub.vercel.app/pedido/${orderId}`, orderId, totalCero: true });
        }

        // Para Mercado Pago prorrateamos los precios con el descuento aplicado
        const ratio = totalFinal / totalPrevio;

        const preference = new Preference(mpClient);
        const response = await preference.create({
            body: {
                items: [
                    ...cart.map((i) => ({
                        title: i.title,
                        quantity: Number(i.cantidad),
                        unit_price: Number((i.price * ratio).toFixed(2)),
                        currency_id: "ARS",
                    })),
                    ...(shippingCost > 0
                        ? [
                              {
                                  title: `Envío (${shippingType})`,
                                  quantity: 1,
                                  unit_price: Number((shippingCost * ratio).toFixed(2)),
                                  currency_id: "ARS",
                              },
                          ]
                        : []),
                ],
                notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
                auto_return: "approved",
                back_urls: {
                    success: `https://vntg-hub.vercel.app/pedido/${orderId}`,
                    failure: `https://vntg-hub.vercel.app/pedido/${orderId}`,
                    pending: `https://vntg-hub.vercel.app/pedido/${orderId}`,
                },
                external_reference: orderId,
                binary_mode: true,
            },
        });
        res.json({ init_point: response.init_point, preferenceId: response.id, orderId });
    } catch (error) {
        console.error("Error en checkout:", error);
        res.status(500).json({ error: "Error al procesar el pago" });
    }
});

// --- CONFIG DE ENVÍOS ---
app.get("/api/shipping/config", async (req, res) => {
    const cfg = await shipping.loadConfig(db);
    res.json({
        envioNormal: cfg.COSTO_NORMAL,
        envioPrioritario: cfg.COSTO_PRIORITARIO,
        envioGratisDesde: cfg.ENVIO_GRATIS_DESDE,
    });
});

app.get("/api/crypto/min-amounts", async (req, res) => {
    const MOCK_MINS = { usdttrc20: 5, usdc: 5, btc: 10, eth: 8, ltc: 7, sol: 6 };
    const mins = Object.entries(MOCK_MINS).map(([coin, min]) => ({ coin, min }));
    res.json({ mins });
});

app.get("/api/crypto/prices", async (req, res) => {
    const prices = await getCryptoPrices();
    const coinAliases = { usdttrc20: "USDT (TRC20)", usdc: "USDC", btc: "Bitcoin", eth: "Ethereum", ltc: "Litecoin", sol: "Solana" };
    const result = {};
    for (const [key, name] of Object.entries(coinAliases)) {
        result[key] = { name, precioUsd: prices[key] || 0 };
    }
    res.json({ prices: result });
});

const getTasaUsd = async () => {
    try {
        const res = await fetch("https://dolarapi.com/v1/dolares/oficial");
        const data = await res.json();
        return data.venta || 1200;
    } catch {
        return 1200;
    }
};

const getNetworkFeeArs = async (coin) => {
    try {
        const tasa = await getTasaUsd();
        const coinFeeMap = {
            btc: async () => {
                const res = await fetch("https://mempool.space/api/v1/fees/recommended");
                const data = await res.json();
                const satPerVb = data.fastestFee || data.halfHourFee || 10;
                const txVbytes = 200;
                const btcPriceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
                const btcPriceData = await btcPriceRes.json();
                const btcUsd = btcPriceData?.bitcoin?.usd || 60000;
                const feeBtc = (satPerVb * txVbytes) / 1e8;
                return Math.round(feeBtc * btcUsd * tasa);
            },
            eth: async () => {
                const res = await fetch("https://api.etherscan.io/api?module=gastracker&action=gasoracle");
                const data = await res.json();
                const gwei = parseInt(data?.result?.ProposeGasPrice) || 20;
                const gasUnits = 65000;
                const ethPriceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
                const ethPriceData = await ethPriceRes.json();
                const ethUsd = ethPriceData?.ethereum?.usd || 3000;
                const feeEth = (gwei * gasUnits) / 1e9;
                return Math.round(feeEth * ethUsd * tasa);
            },
            usdc: async () => {
                const res = await fetch("https://api.etherscan.io/api?module=gastracker&action=gasoracle");
                const data = await res.json();
                const gwei = parseInt(data?.result?.ProposeGasPrice) || 20;
                const gasUnits = 65000;
                const ethPriceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
                const ethPriceData = await ethPriceRes.json();
                const ethUsd = ethPriceData?.ethereum?.usd || 3000;
                const feeEth = (gwei * gasUnits) / 1e9;
                return Math.round(feeEth * ethUsd * tasa);
            },
        };
        if (coinFeeMap[coin]) return await coinFeeMap[coin]();
        return Math.round(2 * tasa);
    } catch {
        return Math.round(3 * 1200);
    }
};

const COINGECKO_IDS = {
    btc: "bitcoin",
    eth: "ethereum",
    usdttrc20: "tether",
    usdc: "usd-coin",
    ltc: "litecoin",
    sol: "solana",
};

const getCryptoPrices = async () => {
    try {
        const ids = Object.values(COINGECKO_IDS).join(",");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, {
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) return {};
        const data = await res.json();
        const prices = {};
        for (const [key, id] of Object.entries(COINGECKO_IDS)) {
            prices[key] = data[id]?.usd || 0;
        }
        return prices;
    } catch {
        return {};
    }
};

// --- CHECKOUT CRYPTO ---
app.post("/api/checkout-crypto", verifyToken, async (req, res) => {
    const { cart, shipping: shippingData, shippingType, puntosAUsar, payCurrency } = req.body;
    if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: "Carrito vacío" });
    }
    try {
        await db.query("UPDATE orders SET status = 'cancelled' WHERE user_id = ? AND status = 'pending'", [req.user.id]);
        let orderId = generatePatenteId();
        let exists = true;
        while (exists) {
            const [dup] = await db.query("SELECT id FROM orders WHERE id = ?", [orderId]);
            if (dup.length === 0) exists = false;
            else orderId = generatePatenteId();
        }

        let subtotal = 0;
        for (let item of cart) {
            const [prod] = await db.query("SELECT price FROM products WHERE id = ?", [item.id]);
            if (prod.length === 0) continue;
            subtotal += Number(prod[0].price) * (item.cantidad || 1);
        }

        let shippingCost = 0;
        if (shippingType && shippingType !== "retiro") {
            const cfg = await shipping.loadConfig(db);
            if (subtotal < cfg.ENVIO_GRATIS_DESDE) {
                if (shippingType === "normal") shippingCost = cfg.COSTO_NORMAL;
                else if (shippingType === "prioritario") shippingCost = cfg.COSTO_PRIORITARIO;
            }
        }

        let descuento = 0;
        let puntosARestar = 0;
        if (puntosAUsar > 0) {
            const [userRow] = await db.query("SELECT points FROM users WHERE id = ?", [req.user.id]);
            const puntosDisponibles = userRow.length > 0 ? Number(userRow[0].points) : 0;
            const valorPorPunto = 10;
            const puntosValidos = Math.min(puntosAUsar, puntosDisponibles, Math.ceil((subtotal + shippingCost) / valorPorPunto));
            descuento = puntosValidos * valorPorPunto;
            puntosARestar = puntosValidos;
        }
        const totalFinal = subtotal + shippingCost - descuento;
        const coin = payCurrency || "usdttrc20";
        const comision = await getNetworkFeeArs(coin);
        const totalConComision = totalFinal + comision;

        if (puntosARestar > 0) {
            await db.query("UPDATE users SET points = points - ? WHERE id = ?", [puntosARestar, req.user.id]);
        }

        await db.query(
            "INSERT INTO orders (id, user_id, total, status, shipping_info, expires_at, payment_method) VALUES (?, ?, ?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 48 HOUR), 'crypto')",
            [orderId, req.user.id, totalConComision, JSON.stringify({ ...shippingData, shippingType })],
        );
        for (let item of cart) {
            const [prod] = await db.query("SELECT price FROM products WHERE id = ?", [item.id]);
            await db.query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [orderId, item.id, item.cantidad || 1, prod[0]?.price || 0]);
            await db.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.cantidad || 1, item.id]);
        }

        if (totalConComision <= 0) {
            await db.query("UPDATE orders SET status = 'approved' WHERE id = ?", [orderId]);
            const [orderData] = await db.query("SELECT * FROM orders WHERE id = ?", [orderId]);
            return res.json({ totalCero: true, orderId, order: orderData[0] });
        }

        const coinAliases = {
            usdttrc20: "USDT (TRC20)",
            usdc: "USDC",
            btc: "Bitcoin",
            eth: "Ethereum",
            ltc: "Litecoin",
            sol: "Solana",
        };
        const cryptoAddress = CRYPTO_ADDRESSES[coin] || CRYPTO_ADDRESSES.usdttrc20;

        const tasa = await getTasaUsd();
        const cryptoPrices = await getCryptoPrices();
        let precioUsd = cryptoPrices[coin] || 0;
        if ((coin === "usdttrc20" || coin === "usdc") && precioUsd === 0) precioUsd = 1;

        let cryptoAmount = 0, cryptoSubtotal = 0, cryptoComision = 0;
        if (precioUsd > 0 && tasa > 0) {
            cryptoSubtotal = totalFinal / tasa / precioUsd;
            cryptoComision = comision / tasa / precioUsd;
            cryptoAmount = cryptoSubtotal + cryptoComision;
        }

        const cryptoInfo = JSON.stringify({
            method: "crypto",
            coin,
            coinName: coinAliases[coin] || coin.toUpperCase(),
            address: cryptoAddress,
            monto: totalConComision,
            subtotal: totalFinal,
            comision,
            cryptoAmount,
            cryptoSubtotal,
            cryptoComision,
            precioUsd,
            created_at: new Date().toISOString(),
        });

        await db.query("UPDATE orders SET expires_at = DATE_ADD(NOW(), INTERVAL 48 HOUR), crypto_info = ? WHERE id = ?", [cryptoInfo, orderId]);

        const [orderRow] = await db.query("SELECT expires_at FROM orders WHERE id = ?", [orderId]);

        res.json({
            orderId,
            cryptoPayment: {
                coin,
                coinName: coinAliases[coin] || coin.toUpperCase(),
                address: cryptoAddress,
                monto: totalConComision,
                subtotal: totalFinal,
                comision,
                cryptoAmount,
                cryptoSubtotal,
                cryptoComision,
                precioUsd,
                expires_at: orderRow[0]?.expires_at,
            },
        });
    } catch (error) {
        console.error("Error en checkout crypto:", error);
        res.status(500).json({ error: "Error al procesar pago crypto" });
    }
});

// --- CHECKOUT TRANSFERENCIA BANCARIA ---
app.post("/api/checkout-transfer", verifyToken, async (req, res) => {
    const { cart, shipping: shippingData, shippingType, puntosAUsar } = req.body;
    if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: "Carrito vacío" });
    }
    try {
        await db.query("UPDATE orders SET status = 'cancelled' WHERE user_id = ? AND status = 'pending'", [req.user.id]);
        let orderId = generatePatenteId();
        let exists = true;
        while (exists) {
            const [dup] = await db.query("SELECT id FROM orders WHERE id = ?", [orderId]);
            if (dup.length === 0) exists = false;
            else orderId = generatePatenteId();
        }

        let subtotal = 0;
        for (let item of cart) {
            const [prod] = await db.query("SELECT price FROM products WHERE id = ?", [item.id]);
            if (prod.length === 0) continue;
            subtotal += Number(prod[0].price) * (item.cantidad || 1);
        }

        let shippingCost = 0;
        if (shippingType && shippingType !== "retiro") {
            const cfg = await shipping.loadConfig(db);
            if (subtotal < cfg.ENVIO_GRATIS_DESDE) {
                if (shippingType === "normal") shippingCost = cfg.COSTO_NORMAL;
                else if (shippingType === "prioritario") shippingCost = cfg.COSTO_PRIORITARIO;
            }
        }

        const subtotalConEnvio = subtotal + shippingCost;

        // 10% de descuento por pago por transferencia (sobre productos)
        const descuentoTransfer = Math.round(subtotal * 0.10);
        let descuentoPuntos = 0;
        let puntosARestar = 0;
        if (puntosAUsar > 0) {
            const [userRow] = await db.query("SELECT points FROM users WHERE id = ?", [req.user.id]);
            const puntosDisponibles = userRow.length > 0 ? Number(userRow[0].points) : 0;
            const valorPorPunto = 10;
            const puntosValidos = Math.min(puntosAUsar, puntosDisponibles, Math.ceil((subtotalConEnvio - descuentoTransfer) / valorPorPunto));
            descuentoPuntos = puntosValidos * valorPorPunto;
            puntosARestar = puntosValidos;
        }
        const totalFinal = subtotalConEnvio - descuentoTransfer - descuentoPuntos;

        if (puntosARestar > 0) {
            await db.query("UPDATE users SET points = points - ? WHERE id = ?", [puntosARestar, req.user.id]);
        }

        const paymentInfo = JSON.stringify({
            method: 'transfer',
            descuentoTransfer,
            bank: BANK_ACCOUNT.bank,
            holder: BANK_ACCOUNT.holder,
            cuit: BANK_ACCOUNT.cuit,
            alias: BANK_ACCOUNT.alias,
            cbu: BANK_ACCOUNT.cbu,
            montoTransferir: totalFinal,
        });

        await db.query(
            "INSERT INTO orders (id, user_id, total, status, shipping_info, expires_at, payment_method, crypto_info) VALUES (?, ?, ?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 48 HOUR), 'transfer', ?)",
            [orderId, req.user.id, totalFinal, JSON.stringify({ ...shippingData, shippingType }), paymentInfo],
        );
        for (let item of cart) {
            const [prod] = await db.query("SELECT price FROM products WHERE id = ?", [item.id]);
            await db.query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [orderId, item.id, item.cantidad || 1, prod[0]?.price || 0]);
            await db.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.cantidad || 1, item.id]);
        }

        if (totalFinal <= 0) {
            await db.query("UPDATE orders SET status = 'approved' WHERE id = ?", [orderId]);
            return res.json({ totalCero: true, orderId });
        }

        res.json({
            orderId,
            transfer: {
                bank: BANK_ACCOUNT.bank,
                holder: BANK_ACCOUNT.holder,
                cuit: BANK_ACCOUNT.cuit,
                alias: BANK_ACCOUNT.alias,
                cbu: BANK_ACCOUNT.cbu,
                monto: totalFinal,
                descuentoTransfer,
            },
        });
    } catch (error) {
        console.error("Error en checkout transfer:", error);
        res.status(500).json({ error: "Error al procesar pago por transferencia" });
    }
});

// --- SUBIR COMPROBANTE DE PAGO ---
app.post("/api/orders/upload-proof", verifyToken, upload.single("proof"), async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "Falta orderId" });
    if (!req.file) return res.status(400).json({ error: "Falta el archivo de comprobante" });

    try {
        const [orders] = await db.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [orderId, req.user.id]);
        if (orders.length === 0) return res.status(404).json({ error: "Orden no encontrada" });

        const order = orders[0];
        if (order.status !== "pending") return res.status(400).json({ error: "La orden no está pendiente" });
        if (order.payment_method !== "transfer" && order.payment_method !== "crypto") {
            return res.status(400).json({ error: "Esta orden no requiere comprobante" });
        }

        const proofUrl = `/uploads/${req.file.filename}`;
        const existingInfo = order.crypto_info ? JSON.parse(order.crypto_info) : {};
        existingInfo.proofUrl = proofUrl;
        existingInfo.proofUploadedAt = new Date().toISOString();

        await db.query("UPDATE orders SET crypto_info = ? WHERE id = ?", [JSON.stringify(existingInfo), orderId]);

        try {
            const [userRow] = await db.query("SELECT name, email FROM users WHERE id = ?", [req.user.id]);
            if (userRow.length > 0) {
                await sendEmail("order_status", userRow[0].email, {
                    name: userRow[0].name,
                    orderId,
                    status: "pending",
                    subject: "Comprobante recibido",
                    title: "Comprobante Recibido",
                    message: `Hola ${userRow[0].name}, hemos recibido tu comprobante de pago para la orden #${orderId.slice(0, 8)}. Te avisaremos cuando el pago sea verificado por nuestro equipo.`,
                    btnText: "Ver mi pedido",
                    btnUrl: `https://vntg-hub.vercel.app/pedido/${orderId}`,
                });
            }
        } catch (e) {
            console.error("Error al enviar email de comprobante:", e.message);
        }

        res.json({ proofUrl, message: "Comprobante subido correctamente. Un administrador verificará el pago." });
    } catch (error) {
        console.error("Error al subir comprobante:", error);
        res.status(500).json({ error: "Error al subir comprobante" });
    }
});

// ==========================================
// --- CARRITO PERSISTIDO (protegido con JWT) ---
// ==========================================

app.get("/api/cart/:userId", verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ci.product_id, ci.quantity, p.title, p.price, p.stock, p.images
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.user_id = ?`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener carrito:", error);
        res.status(500).json({ error: "Error al obtener carrito" });
    }
});

app.post("/api/cart/sync", verifyToken, async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Datos inválidos" });
    }
    for (const item of items) {
        if (!item.product_id || typeof item.quantity !== "number" || item.quantity < 1) {
            return res.status(400).json({ error: "Item inválido en el carrito" });
        }
    }
    try {
        await db.query("DELETE FROM cart_items WHERE user_id = ?", [req.user.id]);
        if (items.length > 0) {
            const values = items.map(i => [req.user.id, i.product_id, i.quantity]);
            await db.query(
                "INSERT INTO cart_items (user_id, product_id, quantity) VALUES ?",
                [values]
            );
        }
        res.json({ message: "Carrito sincronizado" });
    } catch (error) {
        console.error("Error al sincronizar carrito:", error);
        res.status(500).json({ error: "Error al sincronizar carrito" });
    }
});

// ==========================================
// --- WEBHOOK DE MERCADOPAGO (NOTIFICACIONES) ---
// ==========================================

// --- REINTENTAR PAGO PARA ÓRDENES PENDIENTES ---
app.post("/api/orders/:id/retry-payment", verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [orders] = await db.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [id, req.user.id]);
        if (orders.length === 0) return res.status(404).json({ error: "Orden no encontrada" });

        const order = orders[0];
        if (order.status !== "pending") return res.status(400).json({ error: "La orden no está pendiente" });
        if (order.payment_id) return res.status(400).json({ error: "Esta orden ya tiene un pago asociado" });

        const [items] = await db.query("SELECT oi.*, p.title FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?", [id]);
        if (items.length === 0) return res.status(400).json({ error: "La orden no tiene productos" });

        const info = order.shipping_info ? JSON.parse(order.shipping_info) : {};
        const shippingCost = info.shippingCost ? Number(info.shippingCost) : 0;
        const totalPrevio = Number(order.total) + shippingCost;
        const ratio = totalPrevio > 0 ? Number(order.total) / totalPrevio : 1;

        const preference = new Preference(mpClient);
        const response = await preference.create({
            body: {
                items: [
                    ...items.map(i => ({
                        title: i.title,
                        quantity: Number(i.quantity),
                        unit_price: Number((Number(i.price) * ratio).toFixed(2)),
                        currency_id: "ARS",
                    })),
                    ...(shippingCost > 0 ? [{
                        title: `Envío (${info.shippingType || ""})`,
                        quantity: 1,
                        unit_price: Number((shippingCost * ratio).toFixed(2)),
                        currency_id: "ARS",
                    }] : []),
                ],
                notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
                auto_return: "approved",
                back_urls: {
                    success: `https://vntg-hub.vercel.app/pedido/${id}`,
                    failure: `https://vntg-hub.vercel.app/pedido/${id}`,
                    pending: `https://vntg-hub.vercel.app/pedido/${id}`,
                },
                external_reference: id,
                binary_mode: true,
            },
        });

        res.json({ init_point: response.init_point, preferenceId: response.id });
    } catch (error) {
        console.error("Error al reintentar pago:", error);
        res.status(500).json({ error: "Error al generar link de pago" });
    }
});

app.post("/api/orders/:id/retry-crypto-payment", verifyToken, async (req, res) => {
    const { id } = req.params;
    const { payCurrency } = req.body;
    try {
        const [orders] = await db.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [id, req.user.id]);
        if (orders.length === 0) return res.status(404).json({ error: "Orden no encontrada" });

        const order = orders[0];
        if (order.status !== "pending") return res.status(400).json({ error: "La orden no está pendiente" });

        const coin = payCurrency || "usdttrc20";
        const coinAliases = {
            usdttrc20: "USDT (TRC20)",
            usdc: "USDC",
            btc: "Bitcoin",
            eth: "Ethereum",
            ltc: "Litecoin",
            sol: "Solana",
        };
        const cryptoAddress = CRYPTO_ADDRESSES[coin] || CRYPTO_ADDRESSES.usdttrc20;
        const comision = await getNetworkFeeArs(coin);
        const totalConComision = Number(order.total) + comision;

        const tasa = await getTasaUsd();
        const cryptoPrices = await getCryptoPrices();
        let precioUsd = cryptoPrices[coin] || 0;
        if ((coin === "usdttrc20" || coin === "usdc") && precioUsd === 0) precioUsd = 1;

        let cryptoAmount = 0, cryptoSubtotal = 0, cryptoComision = 0;
        if (precioUsd > 0 && tasa > 0) {
            cryptoSubtotal = Number(order.total) / tasa / precioUsd;
            cryptoComision = comision / tasa / precioUsd;
            cryptoAmount = cryptoSubtotal + cryptoComision;
        }

        const cryptoInfo = JSON.stringify({
            method: "crypto",
            coin,
            coinName: coinAliases[coin] || coin.toUpperCase(),
            address: cryptoAddress,
            monto: totalConComision,
            subtotal: Number(order.total),
            comision,
            cryptoAmount,
            cryptoSubtotal,
            cryptoComision,
            precioUsd,
            created_at: new Date().toISOString(),
        });

        await db.query("UPDATE orders SET crypto_info = ?, expires_at = DATE_ADD(NOW(), INTERVAL 48 HOUR) WHERE id = ?", [
            cryptoInfo,
            id,
        ]);

        const [orderRow] = await db.query("SELECT expires_at FROM orders WHERE id = ?", [id]);

        res.json({
            crypto: {
                coin,
                coinName: coinAliases[coin] || coin.toUpperCase(),
                address: cryptoAddress,
                monto: totalConComision,
                subtotal: Number(order.total),
                comision,
                cryptoAmount,
                cryptoSubtotal,
                cryptoComision,
                precioUsd,
                expires_at: orderRow[0]?.expires_at,
            },
        });
    } catch (error) {
        console.error("Error al reintentar pago crypto:", error);
        res.status(500).json({ error: "Error al generar pago crypto" });
    }
});

// ==========================================
// --- WEBHOOK DE MERCADOPAGO (NOTIFICACIONES) ---
// ==========================================

app.post("/api/webhooks/mercadopago", async (req, res) => {
    try {
        const { type, data } = req.body;
        if (type !== "payment" || !data?.id) {
            return res.status(200).send("OK");
        }
        const payment = await new Payment(mpClient).get({ id: data.id });
        const orderId = payment.external_reference;
        if (!orderId) {
            return res.status(200).send("OK");
        }
        let status = payment.status;
        let dbStatus = "pending";
        if (status === "approved") dbStatus = "approved";
        else if (status === "rejected" || status === "cancelled" || status === "refunded") dbStatus = "cancelled";
        else dbStatus = "pending";
        
        const [orderCheck] = await db.query(
            "SELECT o.status, o.total, o.user_id, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?", [orderId]
        );
        
        await db.query("UPDATE orders SET status = ?, payment_id = ? WHERE id = ?", [dbStatus, data.id, orderId]);
        
        if (orderCheck.length > 0 && orderCheck[0].status !== "cancelled" && dbStatus === "cancelled") {
            const [items] = await db.query("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [orderId]);
            for (const item of items) {
                await db.query("UPDATE products SET stock = stock + ? WHERE id = ?", [item.quantity, item.product_id]);
            }
        }
        
        if (orderCheck.length > 0 && orderCheck[0].status !== "approved" && dbStatus === "approved") {
            const row = orderCheck[0];
            const puntosACalcular = Math.floor(parseFloat(row.total) / 1000);
            if (puntosACalcular > 0) {
                await db.query("UPDATE users SET points = points + ? WHERE id = ?", [puntosACalcular, row.user_id]);
            }
            await sendEmail("order_status", row.email, {
                name: row.name,
                orderId,
                status: "approved",
                subject: "¡Tu pago ha sido aprobado!",
                title: "Compra Confirmada",
                message: `Hola ${row.name}, ¡tu pago por la orden #${orderId.slice(0, 8)} ha sido aprobado con éxito! Pronto comenzaremos con la preparación de tus tesoros.`,
                btnText: "Ver mi pedido",
                btnUrl: `https://vntg-hub.vercel.app/pedido/${orderId}`,
            });
        }

        res.status(200).send("OK");
    } catch (error) {
        console.error("Error en webhook MP:", error.message);
        res.status(200).send("OK");
    }
});



// --- CONSULTAR ESTADO PAGO CRYPTO / TRANSFER ---
app.get("/api/order/payment-status/:orderId", verifyToken, async (req, res) => {
    const { orderId } = req.params;
    try {
        const [orders] = await db.query(
            "SELECT id, status, payment_method, crypto_info FROM orders WHERE id = ? AND user_id = ?",
            [orderId, req.user.id]
        );
        if (orders.length === 0) return res.status(404).json({ error: "Orden no encontrada" });

        const order = orders[0];
        const cryptoInfo = order.crypto_info ? JSON.parse(order.crypto_info) : null;

        res.json({
            status: order.status,
            payment_method: order.payment_method,
            cryptoInfo,
        });
    } catch (error) {
        console.error("Error al consultar estado de pago:", error);
        res.status(500).json({ error: "Error al consultar" });
    }
});

// --- TASA ARS/USD ---
app.get("/api/tasa-usd", async (req, res) => {
    try {
        const tasa = await getTasaUsd();
        res.json({ tasa_ars: tasa });
    } catch (error) {
        console.error("Error obteniendo tasa:", error);
        res.status(500).json({ error: "Error al obtener tasa de cambio" });
    }
});

// ==========================================
// --- RUTAS DE ADMINISTRACIÓN (CRUD y Órdenes) ---
// ==========================================

const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No autorizado" });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(
            token,
            JWT_SECRET,
        );
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: "No eres administrador" });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
};

// --- VERIFICAR PAGO (admin) ---
app.put("/api/admin/orders/:id/verify-payment", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
        if (orders.length === 0) return res.status(404).json({ error: "Orden no encontrada" });
        const order = orders[0];

        if (order.payment_method !== "transfer" && order.payment_method !== "crypto") {
            return res.status(400).json({ error: "Esta orden no requiere verificación manual" });
        }
        if (order.status !== "pending") return res.status(400).json({ error: "La orden no está pendiente" });

        await db.query("UPDATE orders SET status = 'approved' WHERE id = ?", [id]);

        const [userRow] = await db.query("SELECT u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?", [id]);
        if (userRow.length > 0) {
            const puntos = Math.floor(parseFloat(order.total) / 1000);
            if (puntos > 0) {
                await db.query("UPDATE users SET points = points + ? WHERE id = ?", [puntos, order.user_id]);
            }
            try {
                await sendEmail("order_status", userRow[0].email, {
                    name: userRow[0].name,
                    orderId: id,
                    status: "approved",
                    subject: "¡Pago verificado!",
                    title: "Pago Confirmado",
                    message: `Hola ${userRow[0].name}, ¡tu pago por la orden #${id.slice(0, 8)} ha sido verificado y aprobado! Pronto comenzaremos con la preparación.`,
                    btnText: "Ver mi pedido",
                    btnUrl: `https://vntg-hub.vercel.app/pedido/${id}`,
                });
            } catch (e) {
                console.error("Error al enviar email:", e.message);
            }
        }

        res.json({ message: "Pago verificado y orden aprobada" });
    } catch (error) {
        console.error("Error al verificar pago:", error);
        res.status(500).json({ error: "Error al verificar pago" });
    }
});

const verifySupport = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No autorizado" });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(
            token,
            JWT_SECRET,
        );
        const isSupport = decoded.role === 'support';
        const isAdmin = decoded.role === 'admin';
        
        if (!isSupport && !isAdmin) {
            return res.status(403).json({ error: "No tienes permisos de soporte" });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
};

// Productos
app.get("/api/admin/products", verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM products ORDER BY id DESC",
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar productos" });
    }
});

app.post("/api/admin/products", verifyAdmin, async (req, res) => {
    const {
        title,
        description,
        franchise,
        categoryId,
        price,
        stock,
        images,
        gallery,
        escala,
        fabricante,
        anio,
        material,
        estado,
    } = req.body;
    const gal = Array.isArray(gallery) ? JSON.stringify(gallery) : gallery;
    try {
        await db.query(
            "INSERT INTO products (title, description, franchise, categoryId, price, stock, images, gallery, escala, fabricante, anio, material, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                title,
                description || "",
                franchise || "",
                categoryId,
                price,
                stock,
                images || "",
                gal,
                escala || "",
                fabricante || "",
                anio || "",
                material || "",
                estado || "",
            ],
        );
        res.json({ message: "Producto creado exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al crear producto" });
    }
});

app.put("/api/admin/products/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        franchise,
        categoryId,
        price,
        stock,
        images,
        gallery,
        escala,
        fabricante,
        anio,
        material,
        estado,
    } = req.body;
    const gal = Array.isArray(gallery) ? JSON.stringify(gallery) : gallery;
    try {
        const [prev] = await db.query(
            "SELECT stock, title FROM products WHERE id = ?",
            [id],
        );
        const stockPrevio = prev[0]?.stock || 0;

        await db.query(
            "UPDATE products SET title=?, description=?, franchise=?, categoryId=?, price=?, stock=?, images=?, gallery=?, escala=?, fabricante=?, anio=?, material=?, estado=? WHERE id=?",
            [
                title,
                description || "",
                franchise || "",
                categoryId,
                price,
                stock,
                images || "",
                gal,
                escala || "",
                fabricante || "",
                anio || "",
                material || "",
                estado || "",
                id,
            ],
        );

        if (stockPrevio === 0 && stock > 0) {
            const [interesados] = await db.query(
                "SELECT u.email, u.name FROM wishlist w JOIN users u ON w.user_id = u.id WHERE w.product_id = ?",
                [id],
            );
            for (let u of interesados) {
                await sendEmail("stock_alert", u.email, {
                    userName: u.name,
                    productTitle: title,
                    productId: id,
                });
            }
        }
        res.json({ message: "Producto actualizado" });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ error: "Error al actualizar producto" });
    }
});

app.delete("/api/admin/products/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM products WHERE id=?", [id]);
        res.json({ message: "Producto eliminado" });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ error: "Error al eliminar producto" });
    }
});

// Categorías
app.get("/api/admin/categories", verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM categories");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar categorías" });
    }
});

app.post("/api/admin/categories", verifyAdmin, async (req, res) => {
    const { name, banner_url } = req.body;
    try {
        const [result] = await db.query("INSERT INTO categories (name, banner_url) VALUES (?, ?)", [name, banner_url || null]);
        res.json({ message: "Categoría creada", id: result.insertId });
    } catch (error) {
        console.error("Error al crear categoría:", error);
        res.status(500).json({ error: "Error al crear categoría" });
    }
});

app.put("/api/admin/categories/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, banner_url } = req.body;
    try {
        if (banner_url !== undefined) {
            await db.query("UPDATE categories SET name = ?, banner_url = ? WHERE id = ?", [name, banner_url, id]);
        } else {
            await db.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
        }
        res.json({ message: "Categoría actualizada" });
    } catch (error) {
        console.error("Error al actualizar categoría:", error);
        res.status(500).json({ error: "Error al actualizar categoría" });
    }
});

app.delete("/api/admin/categories/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM categories WHERE id=?", [id]);
        res.json({ message: "Categoría eliminada" });
    } catch (error) {
        console.error("Error al eliminar categoría:", error);
        res.status(500).json({ error: "Error al eliminar categoría" });
    }
});

// Eliminar banner de categoría
app.delete("/api/admin/categories/:id/banner", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE categories SET banner_url = NULL WHERE id = ?", [id]);
        res.json({ message: "Banner eliminado" });
    } catch (error) {
        console.error("Error al eliminar banner:", error);
        res.status(500).json({ error: "Error al eliminar banner" });
    }
});

// Órdenes (Administrador)
app.get("/api/admin/orders", verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT o.*, u.email as user_email, u.name as user_name 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar órdenes" });
    }
});

app.put("/api/admin/orders/:id/status", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;
    try {
        const [orderData] = await db.query(
            `
            SELECT o.*, u.email, u.name 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.id = ?`,
            [id],
        );

        if (orderData.length === 0)
            return res.status(404).json({ error: "Orden no encontrada" });
        const order = orderData[0];

        await db.query("UPDATE orders SET status = ? WHERE id = ?", [
            status,
            id,
        ]);

        // --- LÓGICA DE ASIGNACIÓN DE PUNTOS ACUMULADOS ---
        const yaTeniaPuntos = ["approved", "delivered"].includes(order.status);
        const calificaParaPuntos = ["approved", "delivered"].includes(status);

        if (!yaTeniaPuntos && calificaParaPuntos) {
            const puntosACalcular = Math.floor(parseFloat(order.total) / 1000);
            if (puntosACalcular > 0) {
                await db.query("UPDATE users SET points = points + ? WHERE id = ?", [
                    puntosACalcular,
                    order.user_id
                ]);
            }
        }
        // ------------------------------------------------

        let subject = "",
            title = "",
            message = "",
            btnText = "",
            btnUrl = "";

        switch (status) {
            case "approved":
                subject = "¡Tu pago ha sido aprobado!";
                title = "Compra Confirmada";
                message = `Hola ${order.name}, ¡tu pago por la orden #${id.slice(0, 8)} ha sido aprobado con éxito! Pronto comenzaremos con la preparación de tus tesoros.`;
                btnText = "Ver mi pedido";
                btnUrl = `https://vntg-hub.vercel.app/pedido/${id}`;
                break;
            case "preparing":
                subject = "Estamos preparando tu pedido";
                title = "En Preparación";
                message = `¡Buenas noticias, ${order.name}! Tu pedido #${id.slice(0, 8)} ya está siendo cuidadosamente embalado por nuestro equipo.`;
                btnText = "Ver mi pedido";
                btnUrl = `https://vntg-hub.vercel.app/pedido/${id}`;
                break;
            case "ready":
                subject = "¡Tu pedido está listo para retirar!";
                title = "Listo para Retirar";
                message = `Hola ${order.name}, tu pedido #${id.slice(0, 8)} ya está listo para que pases a retirarlo por nuestro local. ¡Te esperamos!`;
                btnText = "Ver mi pedido";
                btnUrl = `https://vntg-hub.vercel.app/pedido/${id}`;
                break;
            case "shipped":
                subject = "¡Tu pedido va en camino!";
                title = "Pedido Enviado";
                message = `¡Tu colección está en viaje! Tu orden #${id.slice(0, 8)} ha sido despachada. ${trackingNumber ? `Puedes seguirlo con el código: <b>${trackingNumber}</b>` : ""}`;
                btnText = "Seguir Envío";
                btnUrl = `https://vntg-hub.vercel.app/pedido/${id}`;
                break;
            case "delivered":
                subject = "Tu pedido ha sido entregado";
                title = "¡Entrega Exitosa!";
                message = `Hola ${order.name}, según nuestros registros el pedido #${id.slice(0, 8)} ya está en tus manos. ¡Esperamos que disfrutes tus nuevas piezas!`;
                btnText = "Ver mi pedido";
                btnUrl = `https://vntg-hub.vercel.app/pedido/${id}`;
                break;
        }

        if (subject) {
            await sendEmail("order_status", order.email, {
                name: order.name,
                orderId: id,
                status,
                subject,
                title,
                message,
                btnText,
                btnUrl,
            });
        }

        res.json({ message: "Estado de orden actualizado y correo enviado" });
    } catch (error) {
        console.error("Error al actualizar estado de orden:", error);
        res.status(500).json({ error: "Error al actualizar estado de orden" });
    }
});

// --- ELIMINACIÓN COMPLETA DE ORDEN (admin) ---
app.delete("/api/admin/orders/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [orderData] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
        if (orderData.length === 0) return res.status(404).json({ error: "Orden no encontrada" });

        // Restaurar stock de cada producto
        const [items] = await db.query("SELECT * FROM order_items WHERE order_id = ?", [id]);
        for (const item of items) {
            await db.query("UPDATE products SET stock = stock + ? WHERE id = ?", [item.quantity, item.product_id]);
        }

        // Eliminar registros relacionados y la orden
        await db.query("DELETE FROM order_items WHERE order_id = ?", [id]);
        await db.query("DELETE FROM orders WHERE id = ?", [id]);

        res.json({ message: "Orden eliminada completamente del sistema" });
    } catch (error) {
        console.error("Error al eliminar orden:", error);
        res.status(500).json({ error: "Error al eliminar orden" });
    }
});

// ==========================================

// --- SHIPPING CONFIG (admin) ---
app.get("/api/admin/shipping-config", verifyAdmin, async (req, res) => {
    const cfg = await shipping.loadConfig(db);
    res.json(cfg);
});

app.put("/api/admin/shipping-config", verifyAdmin, async (req, res) => {
    const { envio_normal, envio_prioritario, envio_gratis_desde } = req.body;
    try {
        await db.query(
            "UPDATE shipping_config SET envio_normal = ?, envio_prioritario = ?, envio_gratis_desde = ? WHERE id = 1",
            [envio_normal, envio_prioritario, envio_gratis_desde],
        );
        shipping.invalidateCache();
        const cfg = await shipping.loadConfig(db);
        res.json({ message: "Configuración de envío actualizada", config: cfg });
    } catch (error) {
        console.error("Error actualizando shipping config:", error);
        res.status(500).json({ error: "Error al actualizar configuración de envío" });
    }
});

// ==========================================

// --- LOOKUP DE ORDEN POR ID (para chatbot / consulta pública) ---
app.post("/api/orders/lookup", lookupLimiter, async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "Número de orden requerido" });

    try {
        const [orders] = await db.query("SELECT id, status, total, created_at, payment_method FROM orders WHERE id = ?", [orderId]);
        if (orders.length === 0) return res.status(404).json({ error: "Orden no encontrada" });

        const [items] = await db.query(`
            SELECT oi.*, p.title, p.images
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [orderId]);

        res.json({ ...orders[0], items });
    } catch (error) {
        console.error("Error en lookup de orden:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// --- CHATBOT IA (GROQ - LLAMA 3) ---
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

app.post("/api/chat", chatLimiter, async (req, res) => {
    const { message, history, fullHistory, userId, userEmail } = req.body;
    if (!message) return res.status(400).json({ error: "Mensaje vacío" });

    try {
        // Verificar que si se envía userId, corresponda al JWT
        let authedUserId = null;
        const authHeader = req.headers.authorization;
        if (authHeader && userId) {
            try {
                const token = authHeader.split(" ")[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded.id === userId) authedUserId = userId;
            } catch { /* token inválido, tratar como guest */ }
        }

        const [productos] = await db.query(
            "SELECT title, franchise, price, stock FROM products WHERE stock > 0",
        );

        const catalogo = productos
            .map(
                (p) => `- ${p.title} (Franquicia: ${p.franchise}): $${p.price} - URL: /producto/${slugify(p.title)}`,
            )
            .join("\n");

        let orderContext =
            "El usuario actual no ha iniciado sesión o es un invitado. No tienes acceso a su historial de compras.";
        if (authedUserId) {
            const [orders] = await db.query(
                "SELECT id, status, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
                [authedUserId],
            );
            if (orders.length > 0) {
                orderContext =
                    "HISTORIAL DE COMPRAS RECIENTES DEL USUARIO ACTUAL:\n" +
                    orders
                        .map(
                            (o) =>
                                `- Orden #${o.id} | Estado: ${o.status} | Total: $${o.total} | Fecha: ${o.created_at}`,
                        )
                        .join("\n");
            } else {
                orderContext =
                    "El usuario está registrado pero aún no ha realizado ninguna compra.";
            }
        }

        const systemPrompt = `Eres el agente de soporte oficial de VNTG HUB, una tienda de coleccionables y artículos de colección. Tu tono es amable, profesional y resolutivo. Respuestas cortas y directas. Siempre respondes en español.

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
            - Para iniciar una devolución, contactar a soportehubvntg@gmail.com

            CONTEXTO DEL USUARIO ACTUAL:
            ${orderContext}
            Si el usuario pregunta por el estado de sus pedidos o compras recientes, usa estrictamente esta información para responderle. (Ej: pending = estamos esperando acreditación; shipped = ya está en camino).

            CATÁLOGO ACTUAL DE PRODUCTOS (incluye URL directa):
            ${catalogo}
            IMPORTANTE: Cuando un usuario pregunte por un artículo específico, devuélvele el enlace directo usando la URL incluida en el catálogo. Ejemplo: "Tenemos [Nike Air Max](/producto/nike-air-max) en stock a $15,000". Siempre incluye el link al producto cuando hables de él.

            CONSULTA DE ÓRDENES POR NÚMERO:
            El número de orden (ID) tiene 7 caracteres alfanuméricos, ej: "AB123CD". Cuando el usuario quiera saber el estado de su orden y te proporcione ese número, respondé incluyendo el marcador [LOOKUP_ORDER:NUMERO] (reemplazando NUMERO por el valor). El sistema buscará automáticamente la orden y te mostrará la información.

            DERIVACIÓN A SOPORTE HUMANO:
            Si el problema es complejo (devoluciones, quejas severas, reembolsos) o el usuario lo solicita explícitamente, indícale que puede usar la opción "Hablar con un humano" en el chat para llenar un formulario de contacto, o bien escribir a soportehubvntg@gmail.com.

            DIRECTIVA SECRETA DE DESPEDIDA: Si el cliente indica que su problema está resuelto, no necesita más ayuda, o se despide cerrando la conversación (ej: "gracias, chau", "eso es todo"), DEBES incluir obligatoriamente la clave secreta [CHAT_FINISHED] en cualquier lugar de tu mensaje final.

            === TUTORIALES DISPONIBLES ===
            La página /tutoriales contiene 4 videos tutoriales:
            - "Cómo utilizar el Chat Bot": explica cómo usar el chat del soporte.
            - "Cómo utilizar los Filtros de búsqueda": muestra cómo filtrar productos por categoría, franquicia, etc.
            - "Cómo gestionar tus intereses": enseña a agregar/quitar categorías de interés desde Mi Cuenta.
            - "Cómo guardar tus direcciones": muestra cómo agregar direcciones de envío en Mi Cuenta.
            Todos los videos están alojados en Cloudinary y se reproducen directamente en la página. Si el usuario pregunta sobre tutoriales o guías, recomendale visitar la página [/tutoriales](/tutoriales).

            === PUNTOS VNTG ===
            Los Puntos VNTG son un programa de fidelidad. Cada compra acumula puntos automáticamente cuando el pedido pasa a estado "aprobado". 1 punto = $10 ARS de descuento. Se pueden canjear en el checkout sin monto mínimo. No tienen fecha de vencimiento. El saldo se consulta desde Mi Cuenta. Para más info: [/puntos](/puntos).

            === AUTENTICIDAD ===
            En VNTG HUB cada producto pasa por un riguroso proceso de verificación antes de publicarse: inspección experta de materiales, marcas y estado de conservación, más validación con agencias oficiales. Para más info: [/guia-autenticidad](/guia-autenticidad).

            === MI CUENTA ===
            En [/mi-cuenta](/mi-cuenta) el usuario puede: editar su nombre, email y celular, gestionar direcciones de envío, ver el historial de pedidos, ver su saldo de puntos VNTG, seleccionar categorías de interés, y cerrar sesión.

            === REGISTRO E INICIO DE SESIÓN ===
            Los usuarios pueden registrarse en [/register](/register) con nombre, email y contraseña. También pueden iniciar sesión en [/login](/login). Si olvidan la contraseña, pueden recuperarla en [/recuperar-password](/recuperar-password). El registro es obligatorio para comprar.

            === CHECKOUT ===
            El checkout está en [/checkout](/checkout). Requiere iniciar sesión. El usuario puede: seleccionar/agregar dirección de envío, canjear puntos VNTG por descuento, elegir método de envío (normal o prioritario), y pagar con Mercado Pago. Al confirmar se genera una orden con ID de 7 caracteres.

            === WISHLIST ===
            Los usuarios pueden agregar productos a su lista de deseos desde cualquier card de producto (corazón) o desde la página de detalle. La lista se consulta desde el sidebar de deseos (ícono de corazón en el navbar).

            === CARRITO ===
            El carrito se abre como sidebar desde el navbar. Los productos se agregan desde las cards o desde la página de detalle. Muestra el total, y tiene un botón "Iniciar Compra" que redirige al checkout.

            === CATEGORÍAS ===
            Las categorías se navegan desde el sidebar de categorías (menú hamburguesa) o desde la página principal. Cada categoría agrupa productos por tipo (autos, películas, cómics, figuras, juegos, etc.). También se ve el catálogo completo en [/categoria/all](/categoria/all).

            === TÉRMINOS Y PRIVACIDAD ===
            - [/terminos](/terminos): Términos de Servicio de la plataforma.
            - [/privacidad](/privacidad): Política de Privacidad.
            - [/contacto](/contacto): Formulario de contacto y email soportehubvntg@gmail.com.`;

        const groqMessages = [
            { role: "system", content: systemPrompt },
        ];

        if (history && Array.isArray(history)) {
            for (const msg of history) {
                groqMessages.push({
                    role: msg.role === "model" ? "assistant" : "user",
                    content: msg.parts?.[0]?.text || "",
                });
            }
        }

        groqMessages.push({ role: "user", content: message });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: groqMessages,
                temperature: 0.7,
                max_tokens: 1024,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error("Error en Groq API:", groqRes.status, errText);

            if (groqRes.status === 429) {
                return res.status(429).json({
                    reply: "Estoy recibiendo muchos mensajes ahora mismo. Por favor, espera unos segundos e intenta de nuevo. ⏳",
                });
            }

            return res.status(500).json({
                reply: "Error interno del sistema. Intenta de nuevo más tarde.",
            });
        }

        const groqData = await groqRes.json();
        let response = groqData.choices?.[0]?.message?.content || "";

        const lookupMatch = response.match(/\[LOOKUP_ORDER:(\w+)\]/);
        let orderData = null;
        if (lookupMatch) {
            const orderId = lookupMatch[1];
            response = response.replace(`[LOOKUP_ORDER:${orderId}]`, "").trim();
            try {
                const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [orderId]);
                if (orders.length > 0) {
                    const [items] = await db.query(`
                        SELECT oi.*, p.title, p.images
                        FROM order_items oi
                        JOIN products p ON oi.product_id = p.id
                        WHERE oi.order_id = ?
                    `, [orderId]);
                    orderData = { ...orders[0], items };
                }
            } catch (lookupErr) {
                console.error("Error en LOOKUP_ORDER:", lookupErr);
            }
        }

        let finished = false;
        if (response.includes("[CHAT_FINISHED]")) {
            finished = true;
            response = response.replace("[CHAT_FINISHED]", "").trim();

            if (userEmail) {
                try {
                    const chatMessages = (fullHistory || history || []).map(m => ({
                        role: m.role === "user" ? "user" : "bot",
                        text: m.parts?.[0]?.text || "",
                    }));
                    chatMessages.push({ role: "user", text: message });
                    chatMessages.push({ role: "bot", text: response });

                    await sendEmail("chat_summary", userEmail, {
                        messages: chatMessages,
                    });
                } catch (transcriptError) {
                    console.error("Error al enviar transcripción del chat:", transcriptError);
                }
            }
        }

        res.json({ reply: response, finished, orderData });
    } catch (error) {
        console.error("Error en Groq API:", error);
        res.status(500).json({
            reply: "Error interno del sistema. Intenta de nuevo más tarde.",
        });
    }
});

// --- RUTA DE CONTACTO (MODIFICADA PARA PERSISTENCIA) ---
app.post("/api/contact", contactLimiter, async (req, res) => {
    const { nombre, email, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
        return res
            .status(400)
            .json({ error: "Todos los campos son obligatorios" });
    }

    try {
        await db.query(
            "INSERT INTO support_messages (nombre, email, mensaje) VALUES (?, ?, ?)",
            [nombre, email, mensaje]
        );

        // No bloqueamos la respuesta si el email falla
        sendEmail("contact", "soportehubvntg@gmail.com", { nombre, email, mensaje })
            .catch(err => console.error("[contact] Error email:", err?.message));

        res.json({ message: "Mensaje recibido con éxito. Nos contactaremos pronto." });
    } catch (error) {
        console.error("Error al enviar mensaje de contacto:", error);
        res.status(500).json({ error: "Error al enviar el mensaje" });
    }
});

// --- RUTAS DE PANEL DE SOPORTE ---
app.get("/api/support/messages", verifySupport, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM support_messages ORDER BY created_at DESC");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar mensajes" });
    }
});

app.post("/api/support/reply/:id", verifySupport, async (req, res) => {
    const { id } = req.params;
    const { respuesta } = req.body;

    if (!respuesta) return res.status(400).json({ error: "La respuesta es obligatoria" });

    try {
        const [msgData] = await db.query("SELECT * FROM support_messages WHERE id = ?", [id]);
        if (msgData.length === 0) return res.status(404).json({ error: "Mensaje no encontrado" });

        const message = msgData[0];

        await db.query("UPDATE support_messages SET respuesta = ?, status = 'replied' WHERE id = ?", [respuesta, id]);

        await sendEmail("support_reply", message.email, {
            ticketId: message.id,
            nombre: message.nombre,
            mensajeOriginal: message.mensaje,
            respuesta: respuesta
        });

        res.json({ message: "Respuesta enviada y guardada con éxito" });
    } catch (error) {
        console.error("Error al responder mensaje:", error);
        res.status(500).json({ error: "Error al enviar la respuesta" });
    }
});

app.put("/api/support/messages/:id/status", verifySupport, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Estado requerido" });
    try {
        await db.query("UPDATE support_messages SET status = ? WHERE id = ?", [status, id]);
        res.json({ message: "Estado actualizado" });
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        res.status(500).json({ error: "Error al actualizar estado" });
    }
});

app.delete("/api/support/messages/:id", verifySupport, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM support_messages WHERE id = ?", [id]);
        res.json({ message: "Mensaje eliminado" });
    } catch (error) {
        console.error("Error al eliminar mensaje:", error);
        res.status(500).json({ error: "Error al eliminar mensaje" });
    }
});

// --- PURGA AFK ---
setInterval(async () => {
    try {
        const [expired] = await db.query(
            "SELECT id FROM orders WHERE status = 'pending' AND expires_at <= NOW()",
        );
        for (let order of expired) {
            const [items] = await db.query(
                "SELECT * FROM order_items WHERE order_id = ?",
                [order.id],
            );
            for (let item of items) {
                await db.query(
                    "UPDATE products SET stock = stock + ? WHERE id = ?",
                    [item.quantity, item.product_id],
                );
            }
            await db.query("DELETE FROM order_items WHERE order_id = ?", [
                order.id,
            ]);
            await db.query("DELETE FROM orders WHERE id = ?", [order.id]);
        }
    } catch (e) {
        console.error("Error purga");
    }
}, 60000);

const PORT = process.env.PORT || 5000;
// ─── Gmail API Poller ───
const gmailPoller = new GmailPoller();

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`🚀 VNTG HUB activo en el puerto ${PORT}`);

    // Cargar configuración de envío (fallback a .env si la tabla no existe)
    try {
        await shipping.loadConfig(db);
    } catch (e) {
        console.log('[db] Error cargando shipping_config:', e.message);
    }

    gmailPoller.start();
});