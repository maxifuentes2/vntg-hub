const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const jwt = require("jsonwebtoken");
const config = require("./config");

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// FUNCIÓN AUXILIAR PARA DISEÑO DE CORREOS VNTG HUB
const sendVntgEmail = async (to, subject, title, message, buttonText, buttonUrl) => {
    const html = `
        <div style="font-family: sans-serif; background: #09090b; color: #fff; padding: 40px; text-align: center; max-width: 600px; margin: auto; border: 1px solid #27272a;">
            <h1 style="color: #f97316; font-size: 32px; font-style: italic; text-transform: uppercase; margin-bottom: 20px;">VNTG HUB</h1>
            <h2 style="text-transform: uppercase; font-size: 18px; letter-spacing: 2px;">${title}</h2>
            <div style="background: #111; padding: 30px; border: 1px solid #27272a; margin: 20px 0; text-align: left;">
                <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">${message}</p>
            </div>
            ${buttonText ? `<a href="${buttonUrl}" style="background: #f97316; color: #fff; padding: 15px 25px; text-decoration: none; font-weight: bold; display: inline-block; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">${buttonText}</a>` : ''}
            <p style="color: #52525b; font-size: 10px; margin-top: 30px; text-transform: uppercase;">Este es un correo automático, por favor no lo respondas.</p>
        </div>`;

    return transporter.sendMail({ from: `"VNTG HUB" <${process.env.EMAIL_USER}>`, to, subject, html });
};

app.use(cors({ origin: ["http://localhost:5173", "https://vntg-hub.vercel.app"], credentials: true }));
app.use(express.json());

// --- PRODUCTOS ---
app.get("/api/products", async (req, res) => {
    const { categoryId, q } = req.query;
    let sql = "SELECT * FROM products WHERE 1=1";
    const params = [];
    if (categoryId && categoryId !== 'all') { sql += " AND categoryId = ?"; params.push(categoryId); }
    if (q) {
        sql += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(franchise) LIKE ?)";
        const searchTerm = `%${q.toLowerCase()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    // Ordenar: Los que tienen stock arriba, luego por ID
    sql += " ORDER BY (stock > 0) DESC, id DESC";
    try {
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: "Error al obtener productos" }); }
});

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
        const [rows] = await db.query("SELECT DISTINCT c.* FROM categories c INNER JOIN products p ON c.id = p.categoryId");
        res.json(rows);
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

// --- RUTAS DE WISHLIST ---
app.get("/api/wishlist/:userId", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT p.* FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?", [req.params.userId]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.post("/api/wishlist", async (req, res) => {
    const { userId, productId } = req.body;
    try {
        await db.query("INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)", [userId, productId]);
        res.json({ message: "Ok" });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.delete("/api/wishlist/:userId/:productId", async (req, res) => {
    try {
        await db.query("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?", [req.params.userId, req.params.productId]);
        res.json({ message: "Ok" });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

// --- PERFIL DE USUARIO ---
app.put("/api/auth/update-profile", async (req, res) => {
    const { userId, field, value } = req.body;
    const allowedFields = ['address', 'city', 'province', 'zip_code', 'phone'];
    if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: "Campo no permitido" });
    }
    try {
        await db.query(`UPDATE users SET ${field} = ? WHERE id = ?`, [value, userId]);
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const { password, verification_code, verification_expires, ...userSinPass } = rows[0];
        res.json({ message: "Perfil actualizado correctamente", user: userSinPass });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// --- AUTENTICACIÓN ---

app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const [existingUsers] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: "El correo ya está registrado" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: "Usuario registrado exitosamente" });
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ error: "Error interno del servidor al registrar" });
    }
});

app.post("/api/auth/login/local", async (req, res) => {
    const { email, password, deviceToken } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (!users[0] || !users[0].password) return res.status(401).json({ error: "Credenciales" });
        const valid = await bcrypt.compare(password, users[0].password);
        if (!valid) return res.status(401).json({ error: "Credenciales" });

        // --- LÓGICA DE DISPOSITIVO DE CONFIANZA ---
        if (deviceToken) {
            const [trusted] = await db.query(
                "SELECT * FROM trusted_devices WHERE user_id = ? AND device_token = ? AND expires_at > NOW()",
                [users[0].id, deviceToken]
            );

            if (trusted.length > 0) {
                // Si el dispositivo es conocido y no expiró, entramos directo
                const { password, verification_code, verification_expires, ...userSinPass } = users[0];
                const token = jwt.sign({ id: users[0].id, email: users[0].email }, process.env.JWT_SECRET || 'vntg_secret_key', { expiresIn: '7d' });
                return res.json({ message: "Inicio rápido", user: userSinPass, skipCode: true, token });
            }
        }

        // Si no hay token o no es válido, procedemos con el código de siempre
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
    const { email, code, rememberDevice } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND verification_code = ? AND verification_expires > NOW()", [email, code]);
        if (rows.length === 0) return res.status(401).json({ error: "Inválido" });

        const user = rows[0];
        let newToken = null;

        if (rememberDevice) {
            newToken = uuidv4();
            await db.query(
                "INSERT INTO trusted_devices (user_id, device_token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))",
                [user.id, newToken]
            );
        }

        await db.query("UPDATE users SET verification_code = NULL, verification_expires = NULL WHERE id = ?", [user.id]);
        const { password, verification_code, verification_expires, ...userSinPass } = user;
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'vntg_secret_key', { expiresIn: '7d' });

        res.json({
            message: "Éxito",
            user: userSinPass,
            deviceToken: newToken,
            token
        });
    } catch (error) { res.status(500).json({ error: "Error" }); }
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
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        let user;
        if (users.length === 0) {
            await db.query(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                [name, email, 'google-auth-user-' + googleId]
            );
            const [newUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
            user = newUser[0];
        } else {
            user = users[0];
        }
        const { password, ...userSinPass } = user;
        const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'vntg_secret_key', { expiresIn: '7d' });
        res.json({ user: userSinPass, token: jwtToken });
    } catch (error) {
        console.error("Error en Google Auth:", error);
        res.status(500).json({ error: "Error al autenticar con Google" });
    }
});

// --- DETALLE DE ORDEN ESPECÍFICA ---
app.get("/api/orders/detail/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
        if (orders.length === 0) return res.status(404).json({ error: "Orden no encontrada" });

        const [items] = await db.query(`
            SELECT oi.*, p.title, p.images 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?
        `, [id]);

        res.json({ ...orders[0], items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno" });
    }
});

// --- HISTORIAL DE ÓRDENES (Usuario normal) ---
app.get("/api/orders/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        // CORRECCIÓN APLICADA AQUÍ: Se añadieron todos los estados válidos
        const [rows] = await db.query(
            "SELECT * FROM orders WHERE user_id = ? AND status IN ('approved', 'preparing', 'shipped', 'delivered') ORDER BY created_at DESC",
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener órdenes:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// --- CHECKOUT ---
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


// ==========================================
// --- RUTAS DE ADMINISTRACIÓN (CRUD y Órdenes) ---
// ==========================================

const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No autorizado" });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vntg_secret_key');
        if (!config.ADMIN_EMAILS.includes(decoded.email)) {
            return res.status(403).json({ error: "No eres administrador" });
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
        const [rows] = await db.query("SELECT * FROM products ORDER BY id DESC");
        res.json(rows);
    } catch (error) { res.status(500).json({ error: "Error al cargar productos" }); }
});

app.post("/api/admin/products", verifyAdmin, async (req, res) => {
    const { id, title, description, franchise, categoryId, price, stock, images, gallery, escala, fabricante, anio, material, estado } = req.body;
    const gal = Array.isArray(gallery) ? JSON.stringify(gallery) : gallery;
    try {
        await db.query(
            "INSERT INTO products (title, description, franchise, categoryId, price, stock, images, gallery, escala, fabricante, anio, material, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [title, description || '', franchise || '', categoryId, price, stock, images || '', gal, escala || '', fabricante || '', anio || '', material || '', estado || '']
        );
        res.json({ message: "Producto creado exitosamente" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put("/api/admin/products/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, description, franchise, categoryId, price, stock, images, gallery, escala, fabricante, anio, material, estado } = req.body;
    const gal = Array.isArray(gallery) ? JSON.stringify(gallery) : gallery;
    try {
        const [prev] = await db.query("SELECT stock, title FROM products WHERE id = ?", [id]);
        const stockPrevio = prev[0]?.stock || 0;

        await db.query(
            "UPDATE products SET title=?, description=?, franchise=?, categoryId=?, price=?, stock=?, images=?, gallery=?, escala=?, fabricante=?, anio=?, material=?, estado=? WHERE id=?",
            [title, description || '', franchise || '', categoryId, price, stock, images || '', gal, escala || '', fabricante || '', anio || '', material || '', estado || '', id]
        );

        if (stockPrevio === 0 && stock > 0) {
            const [interesados] = await db.query("SELECT u.email, u.name FROM wishlist w JOIN users u ON w.user_id = u.id WHERE w.product_id = ?", [id]);
            for (let u of interesados) {
                await sendVntgEmail(
                    u.email,
                    `¡Stock disponible! ${title}`,
                    "¡VOLVIÓ A INGRESAR!",
                    `Hola ${u.name}, el producto que tenías en tu wishlist ya está disponible para su compra inmediata.`,
                    "Comprar ahora",
                    `https://vntg-hub.vercel.app/producto/${id}`
                );
            }
        }
        res.json({ message: "Producto actualizado" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete("/api/admin/products/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM products WHERE id=?", [id]);
        res.json({ message: "Producto eliminado" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Categorías
app.get("/api/admin/categories", verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM categories");
        res.json(rows);
    } catch (error) { res.status(500).json({ error: "Error al cargar categorías" }); }
});

app.post("/api/admin/categories", verifyAdmin, async (req, res) => {
    const { name } = req.body;
    try {
        // Ya no enviamos el ID, MySQL lo pone automáticamente
        await db.query("INSERT INTO categories (name) VALUES (?)", [name]);
        res.json({ message: "Categoría creada" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put("/api/admin/categories/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        await db.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
        res.json({ message: "Categoría actualizada" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete("/api/admin/categories/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM categories WHERE id=?", [id]);
        res.json({ message: "Categoría eliminada" });
    } catch (error) { res.status(500).json({ error: error.message }); }
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
    } catch (error) { res.status(500).json({ error: "Error al cargar órdenes" }); }
});

app.put("/api/admin/orders/:id/status", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;
    try {
        const [orderData] = await db.query(`
            SELECT o.*, u.email, u.name 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.id = ?`, [id]);

        if (orderData.length === 0) return res.status(404).json({ error: "Orden no encontrada" });
        const order = orderData[0];

        await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

        let subject = "", title = "", message = "", btnText = "", btnUrl = "";

        switch (status) {
            case 'approved':
                subject = "¡Tu pago ha sido aprobado!";
                title = "Compra Confirmada";
                message = `Hola ${order.name}, ¡tu pago por la orden #${id.slice(0, 8)} ha sido aprobado con éxito! Pronto comenzaremos con la preparación de tus tesoros.`;
                btnText = "Ver mi pedido";
                btnUrl = `https://vntg-hub.vercel.app/pedido/${id}`;
                break;
            case 'preparing':
                subject = "Estamos preparando tu pedido";
                title = "En Preparación";
                message = `¡Buenas noticias, ${order.name}! Tu pedido #${id.slice(0, 8)} ya está siendo cuidadosamente embalado por nuestro equipo.`;
                break;
            case 'shipped':
                subject = "¡Tu pedido va en camino!";
                title = "Pedido Enviado";
                message = `¡Tu colección está en viaje! Tu orden #${id.slice(0, 8)} ha sido despachada. ${trackingNumber ? `Puedes seguirlo con el código: <b>${trackingNumber}</b>` : ''}`;
                btnText = "Seguir Envío";
                btnUrl = `https://vntg-hub.vercel.app/pedido/${id}`;
                break;
            case 'delivered':
                subject = "Tu pedido ha sido entregado";
                title = "¡Entrega Exitosa!";
                message = `Hola ${order.name}, según nuestros registros el pedido #${id.slice(0, 8)} ya está en tus manos. ¡Esperamos que disfrutes tus nuevas piezas!`;
                break;
        }

        if (subject) {
            await sendVntgEmail(order.email, subject, title, message, btnText, btnUrl);
        }

        res.json({ message: "Estado de orden actualizado y correo enviado" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================


// --- CHATBOT IA (GEMINI) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/chat", async (req, res) => {
    const { message, history, userId, userEmail } = req.body;
    if (!message) return res.status(400).json({ error: "Mensaje vacío" });

    try {
        // 1. Extraemos el catálogo de la Base de Datos (solo los que tienen stock)
        const [productos] = await db.query("SELECT title, franchise, price, stock FROM products WHERE stock > 0");
        
        // 2. Armamos una lista de texto legible para la IA
        const catalogo = productos.map(p => `- ${p.title} (Franquicia: ${p.franchise}): $${p.price}`).join('\n');

        // 3. Obtenemos el historial de órdenes si hay un usuario logueado
        let orderContext = "El usuario actual no ha iniciado sesión o es un invitado. No tienes acceso a su historial de compras.";
        if (userId) {
            const [orders] = await db.query("SELECT id, status, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5", [userId]);
            if (orders.length > 0) {
                orderContext = "HISTORIAL DE COMPRAS RECIENTES DEL USUARIO ACTUAL:\n" + orders.map(o => `- Orden #${o.id} | Estado: ${o.status} | Total: $${o.total} | Fecha: ${o.created_at}`).join('\n');
            } else {
                orderContext = "El usuario está registrado pero aún no ha realizado ninguna compra.";
            }
        }

        // 4. Le inyectamos el catálogo y contexto al cerebro
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: `Eres el agente de soporte oficial de VNTG HUB, una tienda de ropa urbana, vintage y coleccionismo. Tu tono es amable, profesional y resolutivo. Usas un estilo 'racing/automovilismo' ocasionalmente.
            Ayudas a los clientes con dudas sobre envíos (normal $9426, prioritario $17276), medios de pago y estado de órdenes. Respuestas cortas y directas.

            CONTEXTO DEL USUARIO ACTUAL:
            ${orderContext}
            Si el usuario pregunta por el estado de sus pedidos o compras recientes, usa estrictamente esta información para responderle. (Ej: si el estado es 'pending', dile que estamos esperando acreditación; si es 'shipped', dile que ya está en camino).

            CATÁLOGO ACTUAL DE PRODUCTOS:
            ${catalogo}
            Si te piden algo que no está en la lista, diles amablemente que por el momento no hay stock en boxes de ese artículo.

            DERIVACIÓN A SOPORTE HUMANO:
            Si el problema es complejo (devoluciones, quejas severas, reembolsos) indica al usuario que debe enviar un correo a soportehubvntg@gmail.com para que un humano del equipo de boxes lo asista.
            
            DIRECTIVA SECRETA DE DESPEDIDA: Si el cliente indica que su problema está resuelto, no necesita más ayuda, o se despide cerrando la conversación (ej: "gracias, chau", "eso es todo"), DEBES incluir obligatoriamente la clave secreta [CHAT_FINISHED] en cualquier lugar de tu mensaje final.`
        });

        // 5. Iniciamos el chat con el historial previo
        const chat = model.startChat({
            history: history || []
        });

        const result = await chat.sendMessage(message);
        let response = result.response.text();
        
        // 6. Verificamos si el bot decidió terminar la charla
        let finished = false;
        if (response.includes('[CHAT_FINISHED]')) {
            finished = true;
            response = response.replace('[CHAT_FINISHED]', '').trim();

            // Si tenemos el email del usuario, generamos y enviamos un resumen
            if (userEmail) {
                try {
                    const summaryModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                    const summaryPrompt = `Resume brevemente esta conversación de soporte técnico en 1 o 2 párrafos concisos para enviársela al cliente por correo electrónico como un comprobante de su consulta. No uses formato markdown complejo, solo texto claro y formal:\n\nHistorial:\n${JSON.stringify(history)}\n\nCliente: ${message}\nSoporte: ${response}`;
                    const summaryResult = await summaryModel.generateContent(summaryPrompt);
                    const summaryText = summaryResult.response.text();

                    await sendVntgEmail(
                        userEmail,
                        "Resumen de tu consulta - Soporte VNTG HUB",
                        "Registro de tu consulta reciente",
                        summaryText,
                        "Volver a la Tienda",
                        "https://vntg-hub.vercel.app"
                    );
                } catch (summaryError) {
                    console.error("Error al generar/enviar resumen del chat:", summaryError);
                }
            }
        }

        res.json({ reply: response, finished });
    } catch (error) {
        console.error("Error en Gemini API:", error);
        res.status(500).json({ error: "Error de conexión en boxes" });
    }
});

// --- RUTA DE CONTACTO ---
app.post("/api/contact", async (req, res) => {
    const { nombre, email, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        await transporter.sendMail({
            from: `"VNTG HUB Web" <${process.env.EMAIL_USER}>`,
            to: "soportehubvntg@gmail.com",
            replyTo: email,
            subject: `Nuevo Correo de ${nombre} - VNTG HUB`,
            html: `
                <div style="font-family: sans-serif; background: #09090b; color: #fff; padding: 20px;">
                    <h2 style="color: #f97316;">Nuevo mensaje desde la web</h2>
                    <p><strong>Nombre:</strong> ${nombre}</p>
                    <p><strong>Email de contacto:</strong> ${email}</p>
                    <hr style="border: 1px solid #27272a; margin: 20px 0;">
                    <p><strong>Mensaje:</strong></p>
                    <p style="background: #111; padding: 15px; border-radius: 5px;">${mensaje}</p>
                </div>
            `
        });
        res.json({ message: "Correo enviado con éxito" });
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        res.status(500).json({ error: "Error al enviar el correo" });
    }
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

// Usamos process.env.PORT para que Render le asigne el puerto correctamente
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => { 
    console.log(`🚀 VNTG HUB activo en el puerto ${PORT}`); 
});