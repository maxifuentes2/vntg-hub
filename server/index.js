const express = require("express");
const cors = require("cors");
require("dotenv").config();
const BASE_URL = process.env.BASE_URL || "https://vntg-hub.onrender.com";
const db = require("./db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const ImapPoller = require("./imapPoller");
const crypto = require("./crypto");
const shipping = require("./shipping");

// Tablas creadas manualmente en TiDB Cloud

const app = express();
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
    return nodemailer.createTransport({
        host, port, secure: false,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
};

const FOOTER_SOCIAL = `
    <div style="text-align:center;margin-bottom:12px">
        <a href="https://instagram.com/vntg.hub" style="display:inline-block;margin:0 6px"><img src="https://cdn-icons-png.flaticon.com/24/2111/2111463.png" alt="Instagram" width="24" height="24"></a>
        <a href="https://tiktok.com/@vntg.hub" style="display:inline-block;margin:0 6px"><img src="https://cdn-icons-png.flaticon.com/24/3046/3046121.png" alt="TikTok" width="24" height="24"></a>
        <a href="https://wa.me/5491123456789" style="display:inline-block;margin:0 6px"><img src="https://cdn-icons-png.flaticon.com/24/3670/3670051.png" alt="WhatsApp" width="24" height="24"></a>
        <a href="https://vntg-hub.vercel.app" style="display:inline-block;margin:0 6px"><img src="https://cdn-icons-png.flaticon.com/24/1006/1006771.png" alt="Web" width="24" height="24"></a>
    </div>`;

const FOOTER = `${FOOTER_SOCIAL}
    <hr style="margin:24px 0 12px;border:none;border-top:1px solid #eee">
    <p style="color:#999;font-size:11px;text-align:center">VNTG Hub — Coleccionables Vintage</p>`;

const buildEmailHtml = (type, data) => {
    switch (type) {
        case "2fa_code":
            return `<div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#f97316">Código de verificación</h2>
                <p>Tu código de un solo uso es:</p>
                <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:24px;background:#f5f5f5;border-radius:12px;margin:16px 0">${data.code}</div>
                <p style="color:#666">Válido por 5 minutos. Si no solicitaste este código, ignorá este mensaje.</p>
                <div style="text-align:center;margin:16px 0">
                    <a href="https://vntg-hub.vercel.app" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:13px">Ir a la Tienda</a>
                </div>
                ${FOOTER}
            </div>`;

        case "stock_alert":
            return `<div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#22c55e">¡Stock disponible!</h2>
                <p>Hola ${data.userName},</p>
                <p>El producto <strong>${data.productTitle}</strong> que tenías en tu lista de deseos ya tiene stock.</p>
                <p>No esperes demasiado, ¡se agota rápido!</p>
                <div style="text-align:center;margin:16px 0">
                    <a href="https://vntg-hub.vercel.app/producto/${data.productId}" style="display:inline-block;padding:14px 32px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">Ver producto</a>
                </div>
                ${FOOTER}
            </div>`;

        case "order_status":
            return `<div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#f97316">${data.title}</h2>
                <p>${data.message}</p>
                <div style="text-align:center;margin:20px 0">
                    ${data.btnText && data.btnUrl ? `<a href="${data.btnUrl}" style="display:inline-block;padding:14px 32px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">${data.btnText}</a>` : ""}
                </div>
                <div style="text-align:center;margin:12px 0">
                    <a href="https://vntg-hub.vercel.app" style="display:inline-block;padding:10px 24px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:13px">Ir a la Tienda</a>
                </div>
                ${FOOTER}
            </div>`;

        case "support_reply":
            return `<div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#f97316">Respuesta de soporte</h2>
                <p>Hola ${data.nombre},</p>
                <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:12px 0">
                    <p style="font-size:12px;color:#666;margin:0 0 8px"><strong>Tu mensaje:</strong></p>
                    <p style="margin:0">${data.mensajeOriginal}</p>
                </div>
                <div style="background:#fff7ed;padding:16px;border-radius:8px;margin:12px 0;border-left:4px solid #f97316">
                    <p style="font-size:12px;color:#666;margin:0 0 8px"><strong>Nuestra respuesta:</strong></p>
                    <p style="margin:0">${data.respuesta}</p>
                </div>
                <div style="text-align:center;margin:16px 0">
                    <a href="https://vntg-hub.vercel.app/perfil" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:13px">Ir a mi cuenta</a>
                </div>
                ${FOOTER}
            </div>`;

        case "contact":
            return `<div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#f97316">Nuevo mensaje de contacto</h2>
                <p><strong>Nombre:</strong> ${data.nombre}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:12px 0">
                    <p style="margin:0">${data.mensaje}</p>
                </div>
                ${FOOTER}
            </div>`;

        case "chat_summary":
            return `<div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#f97316">Resumen de conversación</h2>
                <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:12px 0">
                    <p style="margin:0">${data.summary}</p>
                </div>
                <div style="text-align:center;margin:16px 0">
                    <a href="https://vntg-hub.vercel.app" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:13px">Seguir comprando</a>
                </div>
                ${FOOTER}
            </div>`;

        case "reset_password":
            return `<div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#f97316">Restablecer contraseña</h2>
                <p>Hola,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en VNTG Hub.</p>
                <p>Hacé clic en el botón de abajo para crear una nueva contraseña:</p>
                <div style="text-align:center;margin:20px 0">
                    <a href="${data.resetUrl}" style="display:inline-block;padding:14px 32px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">Restablecer contraseña</a>
                </div>
                <p style="color:#666;font-size:12px">Este enlace expira en 1 hora. Si no solicitaste esto, ignorá este mensaje.</p>
                ${FOOTER}
            </div>`;
    }
};

const getEmailSubject = (type, data) => {
    const subjects = {
        "2fa_code":       "Tu código de verificación — VNTG Hub",
        "stock_alert":    `¡${data.productTitle} tiene stock! — VNTG Hub`,
        "order_status":   data.subject || "Estado de tu pedido — VNTG Hub",
        "support_reply":  "Respuesta de soporte — VNTG Hub",
        "contact":        `Mensaje de contacto de ${data.nombre} — VNTG Hub`,
        "chat_summary":   "Resumen de tu conversación — VNTG Hub",
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
        console.log(`[email] OK type="${type}" to="${to}"`);
        return { sentVia: "smtp" };
    } catch (err) {
        console.error(`[email] Error SMTP type="${type}" to="${to}":`, err.message);
        return { error: true, reason: err.message };
    }
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

// --- SEGURIDAD: Cabeceras HTTP ---
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
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
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No autorizado" });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "vntg_secret_key");
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
            "SELECT id, name, email, address, city, province, zip_code, phone, dni, role, points, created_at FROM users WHERE id = ?",
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
    const allowedFields = ["address", "city", "province", "zip_code", "phone"];
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

app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;

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
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword],
        );

        res.status(201).json({ message: "Usuario registrado exitosamente" });
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({
            error: "Error interno del servidor al registrar",
        });
    }
});

app.post("/api/auth/login/local", async (req, res) => {
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
                    process.env.JWT_SECRET || "vntg_secret_key",
                    { expiresIn: "7d" },
                );
                return res.json({
                    message: "Inicio rápido",
                    user: userSinPass,
                    skipCode: true,
                    token,
                });
            }
        }

        // Si no hay token o no es válido, procedemos con el código de siempre
        const code = Math.floor(100000 + Math.random() * 900000).toString();
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

app.post("/api/auth/verify-code", async (req, res) => {
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
            process.env.JWT_SECRET || "vntg_secret_key",
            { expiresIn: "7d" },
        );

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

app.post("/api/auth/google", async (req, res) => {
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
            process.env.JWT_SECRET || "vntg_secret_key",
            { expiresIn: "7d" },
        );
        res.json({ user: userSinPass, token: jwtToken });
    } catch (error) {
        console.error("Error en Google Auth:", error);
        res.status(500).json({ error: "Error al autenticar con Google" });
    }
});

// --- RESTABLECER CONTRASEÑA ---
app.post("/api/auth/forgot-password", async (req, res) => {
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

app.post("/api/auth/reset-password", async (req, res) => {
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
    const rand = (chars) => chars[Math.floor(Math.random() * chars.length)];
    return `${rand(letters)}${rand(letters)}${rand(digits)}${rand(digits)}${rand(digits)}${rand(letters)}${rand(letters)}`;
};

// --- CHECKOUT (protegido con JWT) ---
app.post("/api/checkout", verifyToken, async (req, res) => {
    const { cart, shipping, shippingType, puntosAUsar } = req.body;
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
            [orderId, req.user.id, totalFinal, JSON.stringify({ ...shipping, shippingType })],
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
    try {
        const coins = ["usdttrc20", "usdc", "btc", "eth", "ltc", "sol"];
        const mins = await Promise.all(
            coins.map(async (coin) => {
                const min = await crypto.getMinAmount({ currency_to: coin });
                return { coin, min: Math.ceil(min) };
            }),
        );
        res.json({ mins });
    } catch (error) {
        console.error("Error obteniendo mínimos crypto:", error);
        res.status(500).json({ error: "Error al obtener mínimos" });
    }
});

// --- CHECKOUT CRYPTO ---
app.post("/api/checkout-crypto", verifyToken, async (req, res) => {
    const { cart, shipping, shippingType, puntosAUsar, payCurrency } = req.body;
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
        let descuento = 0;
        let puntosARestar = 0;
        if (puntosAUsar > 0) {
            const [userRow] = await db.query("SELECT points FROM users WHERE id = ?", [req.user.id]);
            const puntosDisponibles = userRow.length > 0 ? Number(userRow[0].points) : 0;
            const valorPorPunto = 10;
            const puntosValidos = Math.min(puntosAUsar, puntosDisponibles, Math.ceil(subtotal / valorPorPunto));
            descuento = puntosValidos * valorPorPunto;
            puntosARestar = puntosValidos;
        }
        const totalFinal = subtotal - descuento;

        if (puntosARestar > 0) {
            await db.query("UPDATE users SET points = points - ? WHERE id = ?", [puntosARestar, req.user.id]);
        }

        await db.query(
            "INSERT INTO orders (id, user_id, total, status, shipping_info, expires_at, payment_method) VALUES (?, ?, ?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 'crypto')",
            [orderId, req.user.id, totalFinal, JSON.stringify({ ...shipping, shippingType })],
        );
        for (let item of cart) {
            const [prod] = await db.query("SELECT price FROM products WHERE id = ?", [item.id]);
            await db.query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [orderId, item.id, item.cantidad || 1, prod[0]?.price || 0]);
            await db.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.cantidad || 1, item.id]);
        }

        if (totalFinal <= 0) {
            await db.query("UPDATE orders SET status = 'approved' WHERE id = ?", [orderId]);
            const [orderData] = await db.query("SELECT * FROM orders WHERE id = ?", [orderId]);
            return res.json({ totalCero: true, orderId, order: orderData[0] });
        }

        const coin = payCurrency || "usdttrc20";
        const tasaUSD = await crypto.getArsUsdRate();
        const minUSD = await crypto.getMinAmount({ currency_to: coin });
        const precioUSD = Math.ceil(totalFinal / tasaUSD);
        const price_amount = Math.max(precioUSD, Math.ceil(minUSD));

        const ipnUrl = `${BASE_URL}/api/webhooks/nowpayments?order_id=${orderId}`;
        const payment = await crypto.createPayment({
            price_amount,
            pay_currency: coin,
            order_id: orderId,
            ipn_callback_url: ipnUrl,
        });

        await db.query("UPDATE orders SET crypto_info = ? WHERE id = ?", [
            JSON.stringify({
                payment_id: payment.payment_id,
                pay_address: payment.pay_address,
                pay_amount: payment.pay_amount,
                pay_currency: payment.pay_currency,
                created_at: new Date().toISOString(),
            }),
            orderId,
        ]);

        const [orderRow] = await db.query("SELECT expires_at FROM orders WHERE id = ?", [orderId]);

        res.json({
            orderId,
            cryptoPayment: {
                payment_id: payment.payment_id,
                pay_address: payment.pay_address,
                pay_amount: payment.pay_amount,
                pay_currency: payment.pay_currency,
                price_amount: payment.price_amount,
                tasa_ars: tasaUSD,
                total_ars: totalFinal,
                expires_at: orderRow[0]?.expires_at,
            },
        });
    } catch (error) {
        console.error("Error en checkout crypto:", error);
        res.status(500).json({ error: error.message || "Error al procesar pago crypto" });
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
        const tasaUSD = await crypto.getArsUsdRate();
        const minUSD = await crypto.getMinAmount({ currency_to: coin });
        const precioUSD = Math.ceil(Number(order.total) / tasaUSD);
        const price_amount = Math.max(precioUSD, Math.ceil(minUSD));

        const ipnUrl = `${BASE_URL}/api/webhooks/nowpayments?order_id=${id}`;
        const payment = await crypto.createPayment({
            price_amount,
            pay_currency: coin,
            order_id: id,
            ipn_callback_url: ipnUrl,
        });

        await db.query("UPDATE orders SET crypto_info = ?, expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?", [
            JSON.stringify({
                payment_id: payment.payment_id,
                pay_address: payment.pay_address,
                pay_amount: payment.pay_amount,
                pay_currency: payment.pay_currency,
                created_at: new Date().toISOString(),
            }),
            id,
        ]);

        const [orderRow] = await db.query("SELECT expires_at FROM orders WHERE id = ?", [id]);

        res.json({
            crypto: {
                payment_id: payment.payment_id,
                pay_address: payment.pay_address,
                pay_amount: payment.pay_amount,
                pay_currency: payment.pay_currency,
                price_amount,
                tasa_ars: tasaUSD,
                total_ars: Number(order.total),
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

// --- WEBHOOK DE NOWPAYMENTS ---
app.post("/api/webhooks/nowpayments", async (req, res) => {
    try {
        const orderId = req.query.order_id || req.body.order_id;
        const paymentStatus = req.body.payment_status;
        const paymentId = req.body.payment_id;

        if (!orderId) return res.status(200).send("OK");
        const [orderCheck] = await db.query(
            "SELECT o.status, o.total, o.user_id, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?", [orderId]
        );
        if (paymentStatus === "finished" || paymentStatus === "confirmed") {
            await db.query("UPDATE orders SET status = 'approved', payment_id = ? WHERE id = ?", [paymentId, orderId]);
            if (orderCheck.length > 0 && orderCheck[0].status !== "approved") {
                const row = orderCheck[0];
                const puntos = Math.floor(parseFloat(row.total) / 1000);
                if (puntos > 0) {
                    await db.query("UPDATE users SET points = points + ? WHERE id = ?", [puntos, row.user_id]);
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
            console.log(`[crypto] Pago confirmado orden ${orderId}`);
        } else if (["failed", "expired", "rejected", "cancelled"].includes(paymentStatus)) {
            await db.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);
            if (orderCheck.length > 0 && orderCheck[0].status !== "cancelled") {
                const [items] = await db.query("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [orderId]);
                for (const item of items) {
                    await db.query("UPDATE products SET stock = stock + ? WHERE id = ?", [item.quantity, item.product_id]);
                }
            }
            console.log(`[crypto] Pago fallido orden ${orderId}: ${paymentStatus}`);
        }
        res.status(200).send("OK");
    } catch (error) {
        console.error("Error en webhook NowPayments:", error.message);
        res.status(200).send("OK");
    }
});

// --- CONSULTAR ESTADO PAGO CRYPTO ---
app.get("/api/crypto/payment/:orderId", verifyToken, async (req, res) => {
    const { orderId } = req.params;
    try {
        const [orders] = await db.query("SELECT id, status, crypto_info FROM orders WHERE id = ? AND user_id = ?", [orderId, req.user.id]);
        if (orders.length === 0) return res.status(404).json({ error: "Orden no encontrada" });

        const order = orders[0];
        const cryptoInfo = order.crypto_info ? JSON.parse(order.crypto_info) : null;
        let paymentStatus = null;
        if (cryptoInfo?.payment_id) {
            try {
                console.log("[crypto] Polling payment:", cryptoInfo.payment_id);
                const info = await crypto.getPaymentStatus(cryptoInfo.payment_id);
                paymentStatus = info.payment_status;
                console.log("[crypto] Status from NP:", paymentStatus, "order status:", order.status);
                if (paymentStatus === 'finished' && order.status === 'pending') {
                    const [orderData] = await db.query(
                        "SELECT o.total, o.user_id, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?", [orderId]
                    );
                    await db.query("UPDATE orders SET status = 'approved' WHERE id = ?", [orderId]);
                    const row = orderData[0];
                    if (row) {
                const puntos = Math.floor(parseFloat(row.total) / 1000);
                        if (puntos > 0) {
                            await db.query(
                                "UPDATE users SET points = points + ? WHERE id = ?",
                                [puntos, row.user_id]
                            );
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
                    order.status = 'approved';
                    console.log("[crypto] Order approved:", orderId);
                } else if (["failed", "expired", "rejected", "cancelled"].includes(paymentStatus) && order.status === 'pending') {
                    await db.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);
                    const [items] = await db.query("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [orderId]);
                    for (const item of items) {
                        await db.query("UPDATE products SET stock = stock + ? WHERE id = ?", [item.quantity, item.product_id]);
                    }
                    order.status = 'cancelled';
                    console.log("[crypto] Order cancelled, stock restored:", orderId);
                }
            } catch (e) { console.error("[crypto] Poll error:", e?.message) }
        }
        res.json({ status: order.status, cryptoInfo, paymentStatus });
    } catch (error) {
        console.error("Error al consultar pago crypto:", error);
        res.status(500).json({ error: "Error al consultar pago" });
    }
});

// --- TASA ARS/USD ---
app.get("/api/tasa-usd", async (req, res) => {
    try {
        const tasa = await crypto.getArsUsdRate();
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
            process.env.JWT_SECRET || "vntg_secret_key",
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

const verifySupport = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No autorizado" });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "vntg_secret_key",
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
    const { name } = req.body;
    try {
        await db.query("INSERT INTO categories (name) VALUES (?)", [name]);
        res.json({ message: "Categoría creada" });
    } catch (error) {
        console.error("Error al crear categoría:", error);
        res.status(500).json({ error: "Error al crear categoría" });
    }
});

app.put("/api/admin/categories/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        await db.query("UPDATE categories SET name = ? WHERE id = ?", [
            name,
            id,
        ]);
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
app.post("/api/orders/lookup", async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "Número de orden requerido" });

    try {
        const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [orderId]);
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

app.post("/api/chat", async (req, res) => {
    const { message, history, userId, userEmail } = req.body;
    if (!message) return res.status(400).json({ error: "Mensaje vacío" });

    try {
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
        if (userId) {
            const [orders] = await db.query(
                "SELECT id, status, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
                [userId],
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

            DIRECTIVA SECRETA DE DESPEDIDA: Si el cliente indica que su problema está resuelto, no necesita más ayuda, o se despide cerrando la conversación (ej: "gracias, chau", "eso es todo"), DEBES incluir obligatoriamente la clave secreta [CHAT_FINISHED] en cualquier lugar de tu mensaje final.`;

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
                    const summaryRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${GROQ_API_KEY}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            model: GROQ_MODEL,
                            messages: [
                                { role: "system", content: "Resumís conversaciones de soporte técnico en 1-2 párrafos concisos, solo texto claro y formal." },
                                { role: "user", content: `Resume esta conversación:\n\nHistorial:\n${JSON.stringify(history)}\n\nCliente: ${message}\nSoporte: ${response}` },
                            ],
                            temperature: 0.3,
                            max_tokens: 512,
                        }),
                    });
                    const summaryData = await summaryRes.json();
                    const summaryText = summaryData.choices?.[0]?.message?.content || "";

                    if (summaryText) {
                        await sendEmail("chat_summary", userEmail, {
                            summary: summaryText,
                        });
                    }
                } catch (summaryError) {
                    console.error("Error al generar/enviar resumen del chat:", summaryError);
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
app.post("/api/contact", async (req, res) => {
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
        sendEmail("contact", "hubvntg@gmail.com", { nombre, email, mensaje })
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
// ─── IMAP Poller ───
const imapPoller = new ImapPoller();

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`🚀 VNTG HUB activo en el puerto ${PORT}`);

    // Agregar columnas para threading de soporte
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM support_messages LIKE 'thread_id'");
        if (cols.length === 0) {
            await db.query("ALTER TABLE support_messages ADD COLUMN thread_id INT NULL");
            await db.query("ALTER TABLE support_messages ADD COLUMN source VARCHAR(10) DEFAULT 'web'");
            console.log('[db] Columnas thread_id y source agregadas a support_messages');
        }
    } catch (e) {
        console.log('[db] Columnas ya existen o error:', e.message);
    }

    // Agregar columnas crypto a orders
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM orders LIKE 'payment_method'");
        if (cols.length === 0) {
            await db.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) DEFAULT 'mp'");
            await db.query("ALTER TABLE orders ADD COLUMN crypto_info TEXT NULL");
            console.log('[db] Columnas payment_method y crypto_info agregadas a orders');
        }
    } catch (e) {
        console.log('[db] Columnas orders ya existen o error:', e.message);
    }

    // Agregar columnas para reset de contraseña
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM users LIKE 'reset_token'");
        if (cols.length === 0) {
            await db.query("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL");
            await db.query("ALTER TABLE users ADD COLUMN reset_expires DATETIME NULL");
            console.log('[db] Columnas reset_token y reset_expires agregadas a users');
        }
    } catch (e) {
        console.log('[db] Columnas reset ya existen o error:', e.message);
    }

    // Cargar configuración de envío (fallback a .env si la tabla no existe)
    try {
        await shipping.loadConfig(db);
    } catch (e) {
        console.log('[db] Error cargando shipping_config:', e.message);
    }

    imapPoller.start();
});