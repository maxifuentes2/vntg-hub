const express = require("express");
const cors = require("cors");
const os = require("os"); 
require("dotenv").config();
const db = require("./db");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// --- LIBRERÍAS PARA MERCADO PAGO Y RESERVAS ---
const { v4: uuidv4 } = require("uuid");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- CONFIGURACIÓN MERCADO PAGO ---
const mpClient = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

// CONFIGURACIÓN DE NODEMAILER
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
    if (categoryId && categoryId !== 'all') { sql += " AND categoryId = ?"; params.push(categoryId); }
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
    } catch (error) { res.status(500).json({ error: "Error al obtener productos" }); }
});

app.get("/api/products/:id", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "No encontrado" });
        const producto = rows[0];
        if (producto.gallery) producto.gallery = producto.gallery.split(",");
        res.json(producto);
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

// --- RUTAS DE CATEGORÍAS ---
app.get("/api/categories", async (req, res) => {
    try {
        const sql = "SELECT DISTINCT c.* FROM categories c INNER JOIN products p ON c.id = p.categoryId WHERE p.stock > 0";
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

// --- RUTAS DE AUTENTICACIÓN ---
app.post("/api/auth/google", async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
        const { name, email } = ticket.getPayload();
        let [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        let user = users.length === 0 ? null : users[0];
        if (!user) {
            const [result] = await db.query("INSERT INTO users (name, email, role) VALUES (?, ?, ?)", [name, email, "buyer"]);
            user = { id: result.insertId, name, email, role: "buyer" };
        }
        res.json({ message: "Login exitoso", user });
    } catch (error) { res.status(401).json({ error: "Error Google" }); }
});

app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existing.length > 0) return res.status(400).json({ error: "Registrado" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, hashedPassword, "buyer"]);
        res.json({ message: "Éxito", user: { id: result.insertId, name, email, role: "buyer" } });
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

app.post("/api/auth/login/local", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (!users[0] || !users[0].password) return res.status(401).json({ error: "Error" });
        const valid = await bcrypt.compare(password, users[0].password);
        if (!valid) return res.status(401).json({ error: "Error" });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await db.query("UPDATE users SET verification_code = ?, verification_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?", [code, users[0].id]);
        await transporter.sendMail({ from: process.env.EMAIL_USER, to: email, subject: "Código", html: `<h1>${code}</h1>` });
        res.json({ message: "Enviado", requireCode: true, email });
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

app.post("/api/auth/verify-code", async (req, res) => {
    const { email, code } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ? AND verification_code = ? AND verification_expires > NOW()", [email, code]);
        if (users.length === 0) return res.status(401).json({ error: "Inválido" });
        await db.query("UPDATE users SET verification_code = NULL, verification_expires = NULL WHERE id = ?", [users[0].id]);
        res.json({ message: "Login", user: users[0] });
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.json({ message: "Ok" });
        const token = crypto.randomBytes(32).toString("hex");
        await db.query("UPDATE users SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?", [token, users[0].id]);
        const link = `http://localhost:5173/reset-password?token=${token}&email=${email}`;
        await transporter.sendMail({ from: process.env.EMAIL_USER, to: email, subject: "Recuperar", html: `<a href="${link}">Reset</a>` });
        res.json({ message: "Ok" });
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

app.post("/api/auth/reset-password", async (req, res) => {
    const { email, token, newPassword } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_expires > NOW()", [email, token]);
        if (users.length === 0) return res.status(400).json({ error: "Error" });
        const pass = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?", [pass, users[0].id]);
        res.json({ message: "Ok" });
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

// --- RUTA DE CHECKOUT ---
app.post("/api/checkout", async (req, res) => {
    const { user, cart, shipping } = req.body;
    if (!user || !cart || cart.length === 0) return res.status(400).json({ error: "Faltan datos" });

    try {
        const orderId = uuidv4();
        let total = 0;

        for (let item of cart) {
            const [dbProd] = await db.query("SELECT stock FROM products WHERE id = ?", [item.id]);
            if (!dbProd[0] || dbProd[0].stock < item.cantidad) {
                return res.status(400).json({ error: `Sin stock para ${item.title}` });
            }
            total += item.price * item.cantidad;
        }

        await db.query(
            "INSERT INTO orders (id, user_id, total, status, shipping_info, expires_at) VALUES (?, ?, ?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
            [orderId, user.id, total, JSON.stringify(shipping)]
        );

        for (let item of cart) {
            await db.query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [orderId, item.id, item.cantidad, item.price]);
            await db.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.cantidad, item.id]);
        }

        // MERCADO PAGO: Se desactiva auto_return para evitar el error 400 en localhost
        const preference = new Preference(mpClient);
        const response = await preference.create({
            body: {
                items: cart.map(i => ({
                    id: String(i.id),
                    title: i.title,
                    quantity: Number(i.cantidad),
                    unit_price: Number(i.price),
                    currency_id: "ARS"
                })),
                back_urls: {
                    success: "http://localhost:5173",
                    failure: "http://localhost:5173",
                    pending: "http://localhost:5173"
                },
                // auto_return: "approved", // Desactivado por compatibilidad con localhost
                external_reference: orderId,
                binary_mode: true
            }
        });

        res.json({ init_point: response.init_point });

    } catch (error) {
        console.error("--- ERROR DETALLADO DE MERCADO PAGO ---");
        console.log(JSON.stringify(error, null, 2));
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/webhook", async (req, res) => { res.status(200).send("OK"); });

// TAREA AUTOMÁTICA DE LIMPIEZA
setInterval(async () => {
    try {
        const [expired] = await db.query("SELECT id FROM orders WHERE status = 'pending' AND expires_at <= NOW()");
        for (let order of expired) {
            const [items] = await db.query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
            for (let item of items) { await db.query("UPDATE products SET stock = stock + ? WHERE id = ?", [item.quantity, item.product_id]); }
            await db.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [order.id]);
        }
    } catch (e) { console.error("Error limpieza"); }
}, 60000);

app.get("/api/health", (req, res) => res.json({ status: "OK" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => { console.log(`🚀 Servidor VNTG HUB activo en: http://localhost:${PORT}`); });

module.exports = app;