const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

app.use(cors({ origin: ["http://localhost:5173", "https://vntg-hub.vercel.app"], credentials: true }));
app.use(express.json());

// --- PRODUCTOS ---
app.get("/api/products", async (req, res) => {
    const { categoryId, q } = req.query;
    let sql = "SELECT * FROM products WHERE stock > 0";
    const params = [];
    if (categoryId && categoryId !== 'all') { sql += " AND categoryId = ?"; params.push(categoryId); }
    if (q) {
        sql += " AND (title LIKE ? OR description LIKE ? OR franchise LIKE ?)";
        const searchTerm = `%${q}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    try {
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: "Error al obtener productos" }); }
});

// DETALLE: Trae todos los campos de TiDB y procesa la galería
app.get("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "No encontrado" });
        
        const producto = rows[0];
        if (producto.gallery) {
            if (typeof producto.gallery === 'string') {
                try {
                    producto.gallery = JSON.parse(producto.gallery);
                } catch (e) {
                    producto.gallery = producto.gallery.split(',').map(img => img.trim());
                }
            }
        } else { producto.gallery = []; }
        
        res.json(producto);
    } catch (error) { res.status(500).json({ error: "Error en el servidor" }); }
});

app.get("/api/categories", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT DISTINCT c.* FROM categories c INNER JOIN products p ON c.id = p.categoryId WHERE p.stock > 0");
        res.json(rows);
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

// --- AUTENTICACIÓN CON DISEÑO DE CORREO PROFESIONAL ---
app.post("/api/auth/login/local", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (!users[0] || !users[0].password) return res.status(401).json({ error: "Credenciales" });
        const valid = await bcrypt.compare(password, users[0].password);
        if (!valid) return res.status(401).json({ error: "Credenciales" });
        
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await db.query("UPDATE users SET verification_code = ?, verification_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?", [code, users[0].id]);

        const html = `
        <div style="font-family:sans-serif;background:#09090b;color:#fff;padding:40px;text-align:center;">
            <h1 style="color:#f97316;font-size:32px;font-style:italic;text-transform:uppercase;">VNTG HUB</h1>
            <div style="background:#111;padding:30px;border:1px solid #27272a;display:inline-block;min-width:300px;">
                <h2 style="text-transform:uppercase;font-size:18px;">Código de Verificación</h2>
                <div style="background:#f97316;color:#fff;font-size:42px;font-weight:900;padding:15px;margin:20px 0;">${code}</div>
                <p style="color:#a1a1aa;font-size:12px;">Válido por 5 minutos.</p>
            </div>
        </div>`;

        await transporter.sendMail({ from: `"VNTG HUB" <${process.env.EMAIL_USER}>`, to: email, subject: `${code} es tu código - VNTG HUB`, html });
        res.json({ message: "Código enviado", requireCode: true, email });
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

app.post("/api/auth/verify-code", async (req, res) => {
    const { email, code } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND verification_code = ? AND verification_expires > NOW()", [email, code]);
        if (rows.length === 0) return res.status(401).json({ error: "Inválido" });
        const user = rows[0];
        await db.query("UPDATE users SET verification_code = NULL, verification_expires = NULL WHERE id = ?", [user.id]);
        const { password, ...userSinPass } = user;
        res.json({ message: "Éxito", user: userSinPass });
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

app.post("/api/auth/google", async (req, res) => {
    const { token } = req.body;
    try {
        // 1. Verificamos el token con Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        // 2. Buscamos si el usuario ya existe
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        
        let user;
        if (users.length === 0) {
            // 3. Si no existe, lo creamos automáticamente
            // Nota: Usamos el googleId como contraseña temporal o simplemente dejamos el pass nulo
            await db.query(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                [name, email, 'google-auth-user-' + googleId] 
            );
            const [newUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
            user = newUser[0];
        } else {
            user = users[0];
        }

        // 4. Devolvemos el usuario (sin datos sensibles)
        const { password, ...userSinPass } = user;
        res.json({ user: userSinPass });
    } catch (error) {
        console.error("Error en Google Auth:", error);
        res.status(500).json({ error: "Error al autenticar con Google" });
    }
});

// --- CHECKOUT CON PRECIOS DE IMAGEN Y ENVÍO GRATIS > 200k ---
app.post("/api/checkout", async (req, res) => {
    const { user, cart, shipping, shippingType } = req.body;
    try {
        await db.query("UPDATE orders SET status = 'cancelled' WHERE user_id = ? AND status = 'pending'", [user.id]);
        const orderId = uuidv4();
        let subtotal = 0;
        for (let item of cart) {
            const [prod] = await db.query("SELECT stock, price FROM products WHERE id = ?", [item.id]);
            if (!prod[0] || prod[0].stock < item.cantidad) return res.status(400).json({ error: "Sin stock" });
            subtotal += prod[0].price * item.cantidad;
        }

        let shippingCost = 0;
        if (subtotal < 200000) { 
            if (shippingType === 'normal') shippingCost = 9426.05;
            else if (shippingType === 'prioritario') shippingCost = 17276.99;
        }

        const totalFinal = subtotal + shippingCost;
        await db.query("INSERT INTO orders (id, user_id, total, status, shipping_info, expires_at) VALUES (?, ?, ?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))", [orderId, user.id, totalFinal, JSON.stringify(shipping)]);
        
        for (let item of cart) {
            await db.query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [orderId, item.id, item.cantidad, item.price]);
            await db.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.cantidad, item.id]);
        }

        const preference = new Preference(mpClient);
        const response = await preference.create({
            body: {
                items: [
                    ...cart.map(i => ({ title: i.title, quantity: Number(i.cantidad), unit_price: Number(i.price), currency_id: "ARS" })),
                    ...(shippingCost > 0 ? [{ title: `Envío (${shippingType})`, quantity: 1, unit_price: Number(shippingCost.toFixed(2)), currency_id: "ARS" }] : [])
                ],
                back_urls: { success: "https://vntg-hub.vercel.app", failure: "https://vntg-hub.vercel.app" },
                external_reference: orderId, binary_mode: true
            }
        });
        res.json({ init_point: response.init_point });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- PURGA AFK ---
setInterval(async () => {
    try {
        const [expired] = await db.query("SELECT id FROM orders WHERE status = 'pending' AND expires_at <= NOW()");
        for (let order of expired) {
            const [items] = await db.query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
            for (let item of items) { await db.query("UPDATE products SET stock = stock + ? WHERE id = ?", [item.quantity, item.product_id]); }
            await db.query("DELETE FROM order_items WHERE order_id = ?", [order.id]);
            await db.query("DELETE FROM orders WHERE id = ?", [order.id]);
        }
    } catch (e) { console.error("Error purga"); }
}, 60000);

const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => { console.log(`🚀 VNTG HUB activo en ${PORT}`); });