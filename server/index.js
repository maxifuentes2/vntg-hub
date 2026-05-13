const express = require("express");
const cors = require("cors");
const os = require("os"); 
require("dotenv").config();
const db = require("./db");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// CONFIGURACIÓN DE NODEMAILER (Para envío de códigos y enlaces de recuperación)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// CONFIGURACIÓN DE CORS
const allowedOrigins = [
    "http://localhost:5173",        
    "http://localhost:3000",        
    "https://vntg-hub.vercel.app"   
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Acceso denegado por política de CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// --- RUTAS DE PRODUCTOS ---
app.get("/api/products", async (req, res) => {
    const { categoryId, minPrice, maxPrice, title, franchise, q } = req.query;
    let sql = "SELECT * FROM products WHERE stock > 0";
    const params = [];

    if (categoryId && categoryId !== 'all') {
        sql += " AND categoryId = ?";
        params.push(categoryId);
    }
    if (franchise) { sql += " AND franchise = ?"; params.push(franchise); }
    if (minPrice) { sql += " AND price >= ?"; params.push(minPrice); }
    if (maxPrice) { sql += " AND price <= ?"; params.push(maxPrice); }
    if (title) { sql += " AND title LIKE ?"; params.push(`%${title}%`); }
    
    if (q) {
        sql += " AND (title LIKE ? OR description LIKE ? OR franchise LIKE ?)";
        const searchTerm = `%${q}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += " ORDER BY createdAt DESC";

    try {
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error("Error en GET /api/products:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

app.get("/api/products/:id", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
        const producto = rows[0];
        if (producto.gallery) producto.gallery = producto.gallery.split(",");
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el detalle" });
    }
});

// --- RUTAS DE CATEGORÍAS ---
app.get("/api/categories", async (req, res) => {
    try {
        const sql = "SELECT DISTINCT c.* FROM categories c INNER JOIN products p ON c.id = p.categoryId WHERE p.stock > 0";
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener categorías" });
    }
});

// --- RUTAS DE AUTENTICACIÓN ---

// 1. Google Auth
app.post("/api/auth/google", async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email } = ticket.getPayload();
        
        let [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        let user = users.length === 0 ? null : users[0];

        if (!user) {
            const [result] = await db.query(
                "INSERT INTO users (name, email, role) VALUES (?, ?, ?)", 
                [name, email, "buyer"]
            );
            user = { id: result.insertId, name, email, role: "buyer" };
        }
        res.json({ message: "Login exitoso", user });
    } catch (error) {
        console.error("Falla en Google Auth:", error);
        res.status(401).json({ error: "Falla en la autenticación con Google" });
    }
});

// 2. Registro Local
app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: "El correo ya está registrado" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", 
            [name, email, hashedPassword, "buyer"]
        );

        res.json({ 
            message: "Usuario registrado con éxito", 
            user: { id: result.insertId, name, email, role: "buyer" } 
        });
    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error al registrar el usuario" });
    }
});

// 3. Login Local - Fase 1: Validar contraseña y enviar código 2FA
app.post("/api/auth/login/local", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = users.length === 0 ? null : users[0];

        if (!user || !user.password) {
            return res.status(401).json({ error: "Credenciales inválidas o cuenta de Google." });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await db.query(
            "UPDATE users SET verification_code = ?, verification_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?",
            [code, user.id]
        );

        await transporter.sendMail({
            from: `"VNTG HUB" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Tu código de acceso - VNTG HUB",
            html: `
                <div style="font-family: sans-serif; text-align: center; padding: 20px; background-color: #111; color: #fff;">
                    <h2 style="color: #FF5A00; font-style: italic;">VNTG HUB</h2>
                    <p style="color: #ddd;">Tu código de verificación de 6 dígitos es:</p>
                    <h1 style="font-size: 40px; letter-spacing: 5px; color: #FF5A00; background: #222; padding: 10px; border-radius: 5px; display: inline-block;">${code}</h1>
                    <p style="color: #888; font-size: 12px; margin-top: 20px;">Este código expira en 10 minutos.</p>
                </div>
            `
        });

        res.json({ message: "Código enviado", requireCode: true, email: user.email });
    } catch (error) {
        console.error("Error en login local:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// 4. Login Local - Fase 2: Verificar el código 2FA
app.post("/api/auth/verify-code", async (req, res) => {
    const { email, code } = req.body;

    try {
        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ? AND verification_code = ? AND verification_expires > NOW()",
            [email, code]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: "Código inválido o expirado" });
        }

        const user = users[0];

        await db.query("UPDATE users SET verification_code = NULL, verification_expires = NULL WHERE id = ?", [user.id]);

        const { password: _, verification_code, verification_expires, ...userSinPassword } = user;
        res.json({ message: "Login exitoso", user: userSinPassword });

    } catch (error) {
        console.error("Error verificando código:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// 5. Olvidé mi contraseña (Enviar enlace de recuperación)
app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.json({ message: "Si el correo existe, se enviará un enlace." });
        }

        const user = users[0];
        if (!user.password) {
            return res.status(400).json({ error: "Esta cuenta usa Google. Inicia sesión con Google." });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        await db.query(
            "UPDATE users SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?",
            [resetToken, user.id]
        );

        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${email}`;

        await transporter.sendMail({
            from: `"VNTG HUB" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Recupera tu contraseña - VNTG HUB",
            html: `
                <div style="font-family: sans-serif; text-align: center; padding: 20px; background-color: #111; color: #fff;">
                    <h2 style="color: #FF5A00; font-style: italic;">VNTG HUB</h2>
                    <p style="color: #ddd;">Has solicitado restablecer tu contraseña.</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #FF5A00; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px; margin-top: 10px;">Restablecer Contraseña</a>
                    <p style="color: #888; font-size: 12px; margin-top: 20px;">Este enlace expira en 5 minutos.</p>
                </div>
            `
        });

        res.json({ message: "Si el correo existe, se enviará un enlace." });
    } catch (error) {
        console.error("Error en forgot-password:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// 6. Restablecer la contraseña
app.post("/api/auth/reset-password", async (req, res) => {
    const { email, token, newPassword } = req.body;

    try {
        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_expires > NOW()",
            [email, token]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: "El enlace es inválido o ha expirado." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query(
            "UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
            [hashedPassword, users[0].id]
        );

        res.json({ message: "Contraseña actualizada con éxito." });
    } catch (error) {
        console.error("Error en reset-password:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.get("/api/health", (req, res) => res.json({ status: "Servidor activo" }));

// LANZAMIENTO
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Servidor VNTG HUB activo en: http://localhost:${PORT}`);
    });
}

module.exports = app;