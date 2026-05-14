const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

app.use(cors({
    origin: ["http://localhost:5173", "https://vntg-hub.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

// --- PRODUCTOS Y CATEGORÍAS ---
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
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

app.get("/api/categories", async (req, res) => {
    try {
        const sql = "SELECT DISTINCT c.* FROM categories c INNER JOIN products p ON c.id = p.categoryId WHERE p.stock > 0";
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

// --- GESTIÓN DE USUARIO Y PERFIL ---
app.put("/api/auth/update-profile", async (req, res) => {
    const { userId, address, city, province, zip_code, phone } = req.body;
    try {
        await db.query(
            "UPDATE users SET address = ?, city = ?, province = ?, zip_code = ?, phone = ? WHERE id = ?",
            [address, city, province, zip_code, phone, userId]
        );
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
        const { password, ...userSinPass } = rows[0];
        res.json({ message: "Perfil actualizado", user: userSinPass });
    } catch (error) { res.status(500).json({ error: "Error al actualizar" }); }
});

// --- HISTORIAL: Solo aprobadas ---
app.get("/api/orders/:userId", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM orders WHERE user_id = ? AND status = 'approved' ORDER BY created_at DESC",
            [req.params.userId]
        );
        res.json(rows);
    } catch (error) { res.status(500).json({ error: "Error historial" }); }
});

app.post("/api/orders/cancel-pending", async (req, res) => {
    const { userId } = req.body;
    try {
        const [pending] = await db.query("SELECT id FROM orders WHERE user_id = ? AND status = 'pending'");
        for (const order of pending) {
            const [items] = await db.query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
            for (const item of items) { await db.query("UPDATE products SET stock = stock + ? WHERE id = ?", [item.quantity, item.product_id]); }
            await db.query("DELETE FROM order_items WHERE order_id = ?", [order.id]);
            await db.query("DELETE FROM orders WHERE id = ?", [order.id]);
        }
        res.json({ message: "Pendientes purgados" });
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

// --- AUTH Y CHECKOUT ---
app.post("/api/auth/login/local", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (!users[0] || !users[0].password) return res.status(401).json({ error: "Credenciales" });
        
        const valid = await bcrypt.compare(password, users[0].password);
        if (!valid) return res.status(401).json({ error: "Credenciales" });
        
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await db.query("UPDATE users SET verification_code = ?, verification_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?", [code, users[0].id]);

        // --- DISEÑO DEL CORREO ---
        const htmlContent = `
        <div style="font-family: sans-serif; background-color: #09090b; color: #ffffff; padding: 40px; text-align: center; border-radius: 8px;">
            <div style="margin-bottom: 20px;">
                <h1 style="color: #f97316; font-size: 32px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -1px; margin: 0;">VNTG HUB</h1>
                <p style="color: #71717a; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Tu destino para tesoros vintage</p>
            </div>
            
            <div style="background-color: #111111; border: 1px solid #27272a; padding: 30px; border-radius: 4px; display: inline-block; min-width: 300px;">
                <h2 style="font-size: 18px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">Código de Verificación</h2>
                <div style="background-color: #f97316; color: #ffffff; font-size: 42px; font-weight: 900; letter-spacing: 10px; padding: 15px; margin-bottom: 20px; font-style: italic;">
                    ${code}
                </div>
                <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5;">
                    Este código expirará en <strong>5 minutos</strong> por motivos de seguridad.<br>
                    Si no intentaste iniciar sesión, ignora este mensaje.
                </p>
            </div>

            <div style="margin-top: 30px; border-top: 1px solid #27272a; padding-top: 20px;">
                <p style="color: #71717a; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">
                    Explora nuestra colección de indumentaria vintage, streetwear y accesorios únicos.
                </p>
                <div style="margin-top: 15px;">
                    <a href="https://vntg-hub.vercel.app" style="color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; margin: 0 10px;">Tienda</a>
                    <a href="https://vntg-hub.vercel.app/register" style="color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; margin: 0 10px;">Soporte</a>
                </div>
            </div>
        </div>
        `;

        await transporter.sendMail({ 
            from: `"VNTG HUB" <${process.env.EMAIL_USER}>`, 
            to: email, 
            subject: `${code} es tu código de acceso - VNTG HUB`, 
            html: htmlContent 
        });

        res.json({ message: "Enviado", requireCode: true, email });
    } catch (error) { 
        console.error(error);
        res.status(500).json({ error: "Error al enviar el código" }); 
    }
});

app.post("/api/auth/verify-code", async (req, res) => {
    const { email, code } = req.body;
    try {
        // Buscamos al usuario que coincida con el email, el código y que no haya expirado
        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ? AND verification_code = ? AND verification_expires > NOW()",
            [email, code]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Código incorrecto o expirado" });
        }

        const user = rows[0];

        // Limpiamos el código de la base de datos para que no se use de nuevo
        await db.query(
            "UPDATE users SET verification_code = NULL, verification_expires = NULL WHERE id = ?",
            [user.id]
        );

        // Quitamos la contraseña y datos sensibles antes de enviar al frontend
        const { password, verification_code, verification_expires, ...userSinPass } = user;
        
        res.json({ 
            message: "Verificación exitosa", 
            user: userSinPass 
        });
    } catch (error) {
        console.error("Error en verify-code:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

app.post("/api/checkout", async (req, res) => {
    const { user, cart, shipping } = req.body;
    try {
        await db.query("UPDATE orders SET status = 'cancelled' WHERE user_id = ? AND status = 'pending'", [user.id]);
        const orderId = uuidv4();
        let total = 0;
        for (let item of cart) {
            const [prod] = await db.query("SELECT stock FROM products WHERE id = ?", [item.id]);
            if (!prod[0] || prod[0].stock < item.cantidad) return res.status(400).json({ error: "Sin stock" });
            total += item.price * item.cantidad;
        }
        await db.query("INSERT INTO orders (id, user_id, total, status, shipping_info, expires_at) VALUES (?, ?, ?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))", [orderId, user.id, total, JSON.stringify(shipping)]);
        for (let item of cart) {
            await db.query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [orderId, item.id, item.cantidad, item.price]);
            await db.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.cantidad, item.id]);
        }
        const preference = new Preference(mpClient);
        const response = await preference.create({
            body: {
                items: cart.map(i => ({ id: String(i.id), title: i.title, quantity: Number(i.cantidad), unit_price: Number(i.price), currency_id: "ARS" })),
                back_urls: { success: "http://localhost:5173", failure: "http://localhost:5173", pending: "http://localhost:5173" },
                external_reference: orderId, binary_mode: true
            }
        });
        res.json({ init_point: response.init_point });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- PURGA AFK: Borrado físico cada minuto ---
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
app.listen(PORT, "0.0.0.0", () => { console.log(`🚀 Activo en puerto ${PORT}`); });