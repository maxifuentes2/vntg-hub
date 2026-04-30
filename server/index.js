const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// 1. RUTAS DE PRODUCTOS (ABM + FILTROS)
// ==========================================

// GET - Listar productos con filtros avanzados
app.get("/api/products", async (req, res) => {
    const { categoryId, minPrice, maxPrice, title } = req.query;

    let sql = "SELECT * FROM products WHERE 1=1";
    const params = [];

    if (categoryId) {
        sql += " AND categoryId = ?";
        params.push(categoryId);
    }
    if (minPrice) {
        sql += " AND price >= ?";
        params.push(minPrice);
    }
    if (maxPrice) {
        sql += " AND price <= ?";
        params.push(maxPrice);
    }
    if (title) {
        sql += " AND title LIKE ?";
        params.push(`%${title}%`);
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

// POST - Crear un producto nuevo
app.post("/api/products", async (req, res) => {
    const {
        title, description, price, stock, images, categoryId,
        escala, fabricante, anio, material, estado, gallery
    } = req.body;

    if (!title || !price || !categoryId) {
        return res.status(400).json({ error: "Título, precio y categoría son obligatorios" });
    }

    try {
        const sql = `INSERT INTO products 
            (title, description, price, stock, images, categoryId, escala, fabricante, anio, material, estado, gallery) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await db.query(sql, [
            title, description, price, stock, images, categoryId,
            escala, fabricante, anio, material, estado,
            Array.isArray(gallery) ? gallery.join(",") : gallery
        ]);

        res.status(201).json({ id: result.insertId, message: "¡Tesoro publicado con éxito!" });
    } catch (error) {
        console.error("Error en POST:", error);
        res.status(500).json({ error: "Error al crear el producto" });
    }
});

// PUT - Editar un producto existente (Edición completa)
app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const {
        title, description, price, stock, images, categoryId,
        escala, fabricante, anio, material, estado, gallery
    } = req.body;

    if (!title || !price || !categoryId) {
        return res.status(400).json({ error: "Título, precio y categoría son obligatorios" });
    }

    try {
        const sql = `
            UPDATE products 
            SET title = ?, description = ?, price = ?, stock = ?, images = ?, 
                categoryId = ?, escala = ?, fabricante = ?, anio = ?, 
                material = ?, estado = ?, gallery = ?
            WHERE id = ?
        `;

        const [result] = await db.query(sql, [
            title, description, price, stock, images, categoryId,
            escala, fabricante, anio, material, estado,
            Array.isArray(gallery) ? gallery.join(",") : gallery,
            id
        ]);

        if (result.affectedRows === 0) return res.status(404).json({ error: "Producto no encontrado" });

        res.json({ message: "¡Producto actualizado con éxito!" });
    } catch (error) {
        console.error("Error en PUT:", error);
        res.status(500).json({ error: "Error al actualizar el producto" });
    }
});

// PATCH - Agregar imágenes a la galería (Sin borrar las anteriores)
app.patch("/api/products/:id/gallery", async (req, res) => {
    const { id } = req.params;
    const { newImages } = req.body;

    if (!Array.isArray(newImages) || newImages.length === 0) {
        return res.status(400).json({ error: "Se requiere un array 'newImages'" });
    }

    try {
        const [rows] = await db.query("SELECT gallery FROM products WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });

        const currentGallery = rows[0].gallery;
        let galleryArray = currentGallery ? currentGallery.split(",") : [];
        
        // Combinamos y evitamos duplicados
        const updatedGallery = [...new Set([...galleryArray, ...newImages])];

        await db.query("UPDATE products SET gallery = ? WHERE id = ?", [updatedGallery.join(","), id]);

        res.json({ message: "Galería actualizada", gallery: updatedGallery });
    } catch (error) {
        console.error("Error en PATCH gallery:", error);
        res.status(500).json({ error: "Error al actualizar la galería" });
    }
});

// GET - Obtener un producto por ID
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

// DELETE - Eliminar un producto a la fuerza (Ignorando llaves foráneas)
app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection(); // Usamos una conexión dedicada

    try {
        // 1. Apagamos la seguridad de MySQL a la fuerza
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");

        // 2. Borramos el producto directo, sin preguntar
        const [result] = await connection.query("DELETE FROM products WHERE id = ?", [id]);

        // 3. Volvemos a prender la seguridad obligatoriamente
        await connection.query("SET FOREIGN_KEY_CHECKS = 1");

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ message: "Producto eliminado a la fuerza con éxito" });
    } catch (error) {
        console.error("Error al borrar a la fuerza:", error);
        res.status(500).json({ error: "Error interno al eliminar" });
    } finally {
        // Soltamos la conexión para que no se cuelgue el servidor
        connection.release();
    }
});

// ==========================================
// 2. RUTAS DE CATEGORÍAS
// ==========================================

app.get("/api/categories", async (req, res) => {
    try {
        const sql = `
            SELECT DISTINCT c.* FROM categories c
            INNER JOIN products p ON c.id = p.categoryId
            WHERE p.stock > 0
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener categorías dinámicas" });
    }
});

// ==========================================
// 3. RUTA DE RESERVA
// ==========================================

app.post("/api/reserve", async (req, res) => {
    const { productId, userId } = req.body;
    try {
        const [existing] = await db.query(
            `SELECT * FROM cart_reservations 
            WHERE productId = ? AND status = 'active' AND expiresAt > NOW()`,
            [productId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: "Artículo ya reservado temporalmente." });
        }

        await db.query(
            `INSERT INTO cart_reservations (productId, userId, expiresAt) 
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
            [productId, userId]
        );

        res.json({ message: "Reserva exitosa por 10 minutos." });
    } catch (error) {
        res.status(500).json({ error: "Error al procesar la reserva" });
    }
});

// ==========================================
// 4. RUTAS DE AUTENTICACIÓN
// ==========================================

app.post("/api/auth/google", async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email } = ticket.getPayload();

        let [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        let user;

        if (users.length === 0) {
            const [result] = await db.query(
                "INSERT INTO users (name, email, role) VALUES (?, ?, ?)",
                [name, email, "buyer"]
            );
            user = { id: result.insertId, name, email, role: "buyer" };
        } else {
            user = users[0];
            delete user.password;
        }

        res.json({ message: "Login exitoso", user });
    } catch (error) {
        res.status(401).json({ error: "Autenticación de Google fallida" });
    }
});

app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, password, role || "buyer"]
        );
        res.status(201).json({ id: result.insertId, message: "Usuario registrado" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Email ya registrado" });
        res.status(500).json({ error: "Error en el registro" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
        if (rows.length === 0) return res.status(401).json({ error: "Credenciales inválidas" });
        const user = rows[0];
        delete user.password;
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: "Error en el login" });
    }
});

// ==========================================
// 5. RUTA DE COMPRA FINAL
// ==========================================

app.post("/api/checkout", async (req, res) => {
    const { productId, userId } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [products] = await connection.query("SELECT stock FROM products WHERE id = ? FOR UPDATE", [productId]);

        if (products.length === 0 || products[0].stock <= 0) throw new Error("Stock no disponible");

        await connection.query("UPDATE products SET stock = stock - 1 WHERE id = ?", [productId]);
        await connection.query(
            "UPDATE cart_reservations SET status = 'completed' WHERE productId = ? AND userId = ? AND status = 'active'",
            [productId, userId]
        );
        await connection.query("INSERT INTO orders (userId, productId, status) VALUES (?, ?, 'completed')", [userId, productId]);

        await connection.commit();
        res.json({ message: "¡Compra realizada con éxito!" });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ error: error.message || "Error al procesar el pago" });
    } finally {
        connection.release();
    }
});

// ==========================================
// 6. HEALTH CHECK Y SERVIDOR
// ==========================================

app.get("/api/health", (req, res) => res.json({ status: "Servidor activo" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de VNTG-HUB en http://localhost:${PORT}`);
});