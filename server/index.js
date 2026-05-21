const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
// nodemailer eliminado — emails delegados a n8n
const { v4: uuidv4 } = require("uuid");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const jwt = require("jsonwebtoken");

// --- INICIALIZACIÓN DE TABLAS ---
const initDB = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS support_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                mensaje TEXT NOT NULL,
                status ENUM('pending', 'replied') DEFAULT 'pending',
                respuesta TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Tabla support_messages lista");

        // Agregar columna role a users si no existe
        await db.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin', 'support') DEFAULT 'user'
        `);
        console.log("✅ Columna role en users verificada");
    } catch (err) {
        console.error("❌ Error al inicializar tablas:", err);
    }
};
initDB();

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

// Función para disparar un email a través de n8n webhook
const triggerN8nEmail = async (type, to, data) => {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn("⚠️  N8N_WEBHOOK_URL no configurada. Correo no enviado.");
        return;
    }
    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, to, data }),
    });
    if (!res.ok) throw new Error(`n8n webhook error: ${res.status}`);
    return res.json();
};

app.use(
    cors({
        origin: ["http://localhost:5173", "https://vntg-hub.vercel.app"],
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// --- PRODUCTOS ---
app.get("/api/products", async (req, res) => {
    const { categoryId, q, minPrice, maxPrice } = req.query;
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
    if (q) {
        // Normalizar: quitar acentos y pasar a minúsculas
        const normalizedQ = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        
        // Diccionario local de sinónimos para rapidez y fiabilidad extrema
        const synonymMap = {
            "peliculas": ["cine", "movie", "film", "hollywood", "estreno", "pantalla"],
            "pelicula": ["cine", "movie", "film", "hollywood", "estreno", "pantalla"],
            "autos": ["coche", "vehiculo", "car", "escala", "motor", "ruedas"],
            "auto": ["coche", "vehiculo", "car", "escala", "motor", "ruedas"],
            "figuras": ["figura", "coleccionable", "statue", "action figure", "muñeco", "toys"],
            "figura": ["figura", "coleccionable", "statue", "action figure", "muñeco", "toys"],
            "ropa": ["vintage", "urbana", "streetwear", "t-shirt", "prenda", "outfit"],
            "remeras": ["t-shirt", "remera", "prenda", "vintage", "top"],
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
                const prompt = `Actúa como un experto en coleccionismo. El usuario busca "${normalizedQ}". 
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

// --- RUTAS DE WISHLIST ---
app.get("/api/wishlist/:userId", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT p.* FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?",
            [req.params.userId],
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: "Error" });
    }
});

app.post("/api/wishlist", async (req, res) => {
    const { userId, productId } = req.body;
    try {
        await db.query(
            "INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)",
            [userId, productId],
        );
        res.json({ message: "Ok" });
    } catch (e) {
        res.status(500).json({ error: "Error" });
    }
});

app.delete("/api/wishlist/:userId/:productId", async (req, res) => {
    try {
        await db.query(
            "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
            [req.params.userId, req.params.productId],
        );
        res.json({ message: "Ok" });
    } catch (e) {
        res.status(500).json({ error: "Error" });
    }
});

// --- PERFIL DE USUARIO ---
app.put("/api/auth/update-profile", async (req, res) => {
    const { userId, field, value } = req.body;
    const allowedFields = ["address", "city", "province", "zip_code", "phone"];
    if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: "Campo no permitido" });
    }
    try {
        await db.query(`UPDATE users SET ${field} = ? WHERE id = ?`, [
            value,
            userId,
        ]);
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
            userId,
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

        await triggerN8nEmail("2fa_code", email, { code });
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

// --- DETALLE DE ORDEN ESPECÍFICA ---
app.get("/api/orders/detail/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [
            id,
        ]);
        if (orders.length === 0)
            return res.status(404).json({ error: "Orden no encontrada" });

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

// --- HISTORIAL DE ÓRDENES (Usuario normal) ---
app.get("/api/orders/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        // CORRECCIÓN APLICADA AQUÍ: Se añadieron todos los estados válidos
        const [rows] = await db.query(
            "SELECT * FROM orders WHERE user_id = ? AND status IN ('pending', 'approved', 'preparing', 'shipped', 'delivered') ORDER BY created_at DESC",
            [userId],
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener órdenes:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Generador de ID estilo patente (7 caracteres: 2 letras + 3 números + 2 letras)
const generatePatenteId = () => {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin O, I para evitar confusiones
    const digits = "23456789"; // sin 0, 1 para evitar confusiones
    const rand = (chars) => chars[Math.floor(Math.random() * chars.length)];
    return `${rand(letters)}${rand(letters)}${rand(digits)}${rand(digits)}${rand(digits)}${rand(letters)}${rand(letters)}`;
};

// --- CHECKOUT ---
app.post("/api/checkout", async (req, res) => {
    const { user, cart, shipping, shippingType } = req.body;
    try {
        await db.query(
            "UPDATE orders SET status = 'cancelled' WHERE user_id = ? AND status = 'pending'",
            [user.id],
        );
        // Generar ID único estilo patente (evitar colisiones)
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
        if (subtotal < 200000) {
            if (shippingType === "normal") shippingCost = 9426.05;
            else if (shippingType === "prioritario") shippingCost = 17276.99;
        }
        const totalFinal = subtotal + shippingCost;
        await db.query(
            "INSERT INTO orders (id, user_id, total, status, shipping_info, expires_at) VALUES (?, ?, ?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
            [orderId, user.id, totalFinal, JSON.stringify(shipping)],
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
        const preference = new Preference(mpClient);
        const response = await preference.create({
            body: {
                items: [
                    ...cart.map((i) => ({
                        title: i.title,
                        quantity: Number(i.cantidad),
                        unit_price: Number(i.price),
                        currency_id: "ARS",
                    })),
                    ...(shippingCost > 0
                        ? [
                              {
                                  title: `Envío (${shippingType})`,
                                  quantity: 1,
                                  unit_price: Number(shippingCost.toFixed(2)),
                                  currency_id: "ARS",
                              },
                          ]
                        : []),
                ],
                notification_url: "https://vntg-hub.vercel.app/api/webhooks/mercadopago",
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
        res.status(500).json({ error: error.message });
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
        await db.query("UPDATE orders SET status = ?, payment_id = ? WHERE id = ?", [dbStatus, data.id, orderId]);
        res.status(200).send("OK");
    } catch (error) {
        console.error("Error en webhook MP:", error.message);
        res.status(200).send("OK");
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
        // Soporte puede ser Admin O Soporte específico
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
        id,
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
        res.status(500).json({ error: error.message });
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
                await triggerN8nEmail("stock_alert", u.email, {
                    userName: u.name,
                    productTitle: title,
                    productId: id,
                });
            }
        }
        res.json({ message: "Producto actualizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/api/admin/products/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM products WHERE id=?", [id]);
        res.json({ message: "Producto eliminado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        // Ya no enviamos el ID, MySQL lo pone automáticamente
        await db.query("INSERT INTO categories (name) VALUES (?)", [name]);
        res.json({ message: "Categoría creada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
});

app.delete("/api/admin/categories/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM categories WHERE id=?", [id]);
        res.json({ message: "Categoría eliminada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
            await triggerN8nEmail("order_status", order.email, {
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
const GROQ_MODEL = "llama-3.3-70b-versatile"; // modelo gratuito con alta cuota (30 RPM)

app.post("/api/chat", async (req, res) => {
    const { message, history, userId, userEmail } = req.body;
    if (!message) return res.status(400).json({ error: "Mensaje vacío" });

    try {
        // 1. Extraemos el catálogo de la Base de Datos (solo los que tienen stock)
        const [productos] = await db.query(
            "SELECT title, franchise, price, stock FROM products WHERE stock > 0",
        );

        // 2. Armamos una lista de texto legible para la IA (con slugs para enlaces directos)
        const catalogo = productos
            .map(
                (p) => `- ${p.title} (Franquicia: ${p.franchise}): $${p.price} - URL: /producto/${slugify(p.title)}`,
            )
            .join("\n");

        // 3. Obtenemos el historial de órdenes si hay un usuario logueado
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

        const systemPrompt = `Eres el agente de soporte oficial de VNTG HUB, una tienda de ropa urbana, vintage y coleccionismo. Tu tono es amable, profesional y resolutivo. Respuestas cortas y directas. Siempre respondes en español.

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

            CONSULTA DE ÓRDENES POR PATENTE:
            El número de orden (ID) tiene formato de patente argentina: 7 caracteres alfanuméricos, ej: "AB123CD". Cuando el usuario quiera saber el estado de su orden y te proporcione esa patente, respondé incluyendo el marcador [LOOKUP_ORDER:PATENTE] (reemplazando PATENTE por el valor). El sistema buscará automáticamente la orden y te mostrará la información.

            DERIVACIÓN A SOPORTE HUMANO:
            Si el problema es complejo (devoluciones, quejas severas, reembolsos) o el usuario lo solicita explícitamente, indícale que puede usar la opción "Hablar con un humano" en el chat para llenar un formulario de contacto, o bien escribir a soportehubvntg@gmail.com.

            DIRECTIVA SECRETA DE DESPEDIDA: Si el cliente indica que su problema está resuelto, no necesita más ayuda, o se despide cerrando la conversación (ej: "gracias, chau", "eso es todo"), DEBES incluir obligatoriamente la clave secreta [CHAT_FINISHED] en cualquier lugar de tu mensaje final.`;

        // 5. Convertir el historial de formato Gemini a formato OpenAI/Groq
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

        // 6. Llamar a Groq API
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

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
            console.error("Error en Groq API:", groqRes.status, errText, "API Key starts with:", GROQ_API_KEY?.slice(0, 8));

            if (groqRes.status === 429) {
                return res.status(429).json({
                    reply: "Estoy recibiendo muchos mensajes ahora mismo. Por favor, espera unos segundos e intenta de nuevo. ⏳",
                });
            }

            if (groqRes.status === 401) {
                return res.status(500).json({
                    reply: "Error de autenticación con el motor de IA. Verificá la API key.",
                });
            }

            return res.status(500).json({
                reply: "Error interno del sistema. Intenta de nuevo más tarde.",
            });
        }

        const groqData = await groqRes.json();
        let response = groqData.choices?.[0]?.message?.content || "";

        // 7. Procesamos el marcador LOOKUP_ORDER:ID si está presente
        const lookupMatch = response.match(/\[LOOKUP_ORDER:(\d+)\]/);
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

        // 8. Verificamos si el bot decidió terminar la charla
        let finished = false;
        if (response.includes("[CHAT_FINISHED]")) {
            finished = true;
            response = response.replace("[CHAT_FINISHED]", "").trim();

            // Si tenemos el email del usuario, generamos y enviamos un resumen
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
                        await triggerN8nEmail("chat_summary", userEmail, {
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
        // 1. Guardar en la base de datos para el panel de soporte
        await db.query(
            "INSERT INTO support_messages (nombre, email, mensaje) VALUES (?, ?, ?)",
            [nombre, email, mensaje]
        );

        // 2. Notificar por n8n (opcional, ya que ahora se ve en el panel)
        await triggerN8nEmail("contact", "hubvntg@gmail.com", {
            nombre,
            email,
            mensaje,
        });

        res.json({ message: "Mensaje recibido con éxito. Nos contactaremos pronto." });
    } catch (error) {
        console.error("Error al procesar contacto:", error);
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

        // 1. Actualizar DB
        await db.query("UPDATE support_messages SET respuesta = ?, status = 'replied' WHERE id = ?", [respuesta, id]);

        // 2. Enviar correo via n8n
        await triggerN8nEmail("support_reply", message.email, {
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

// Usamos process.env.PORT para que Render le asigne el puerto correctamente
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 VNTG HUB activo en el puerto ${PORT}`);
});
