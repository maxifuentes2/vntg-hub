const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middlewares
// Se simplifica el CORS para permitir peticiones locales de desarrollo
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"] 
}));
app.use(express.json());

// ==========================================
// 1. RUTAS DE PRODUCTOS (ABM + FILTROS)
// ==========================================

// GET - Listar productos con filtros avanzados
app.get("/api/products", async (req, res) => {
    const { categoryId, minPrice, maxPrice, title, franchise } = req.query;

    // Solo mostramos productos que tengan stock disponible
    let sql = "SELECT * FROM products WHERE stock > 0";
    const params = [];

    // LÓGICA CLAVE: Si categoryId es 'all', omitimos el filtro de ID
    if (categoryId && categoryId !== 'all') {
        sql += " AND categoryId = ?";
        params.push(categoryId);
    }
    if (franchise) {
        sql += " AND franchise = ?";
        params.push(franchise);
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
        franchise, escala, fabricante, anio, material, estado, gallery
    } = req.body;

    if (!title || !price || !categoryId) {
        return res.status(400).json({ error: "Título, precio y categoría son obligatorios" });
    }

    try {
        const sql = `INSERT INTO products 
            (title, description, price, stock, images, categoryId, franchise, escala, fabricante, anio, material, estado, gallery) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await db.query(sql, [
            title, description, price, stock, images, categoryId,
            franchise, escala, fabricante, anio, material, estado,
            Array.isArray(gallery) ? gallery.join(",") : gallery
        ]);

        res.status(201).json({ id: result.insertId, message: "¡Tesoro publicado con éxito!" });
    } catch (error) {
        console.error("Error en POST:", error);
        res.status(500).json({ error: "Error al crear el producto" });
    }
});

// PUT - Editar un producto existente
app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const {
        title, description, price, stock, images, categoryId,
        franchise, escala, fabricante, anio, material, estado, gallery
    } = req.body;

    try {
        const sql = `
            UPDATE products 
            SET title = ?, description = ?, price = ?, stock = ?, images = ?, 
                categoryId = ?, franchise = ?, escala = ?, fabricante = ?, anio = ?, 
                material = ?, estado = ?, gallery = ?
            WHERE id = ?
        `;

        const [result] = await db.query(sql, [
            title, description, price, stock, images, categoryId,
            franchise, escala, fabricante, anio, material, estado,
            Array.isArray(gallery) ? gallery.join(",") : gallery,
            id
        ]);

        if (result.affectedRows === 0) return res.status(404).json({ error: "Producto no encontrado" });
        res.json({ message: "¡Producto actualizado con éxito!" });
    } catch (error) {
        console.error("Error en PUT:", error);
        res.status(500).json({ error: "Error al actualizar" });
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

// DELETE - Eliminar un producto
app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");
        const [result] = await connection.query("DELETE FROM products WHERE id = ?", [id]);
        await connection.query("SET FOREIGN_KEY_CHECKS = 1");

        if (result.affectedRows === 0) return res.status(404).json({ error: "Producto no encontrado" });
        res.json({ message: "Producto eliminado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    } finally {
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
        res.status(500).json({ error: "Error al obtener categorías" });
    }
});

// ==========================================
// 3. AUTENTICACIÓN Y OTROS
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
        let user = users.length === 0 ? null : users[0];

        if (!user) {
            const [result] = await db.query("INSERT INTO users (name, email, role) VALUES (?, ?, ?)", [name, email, "buyer"]);
            user = { id: result.insertId, name, email, role: "buyer" };
        }
        res.json({ message: "Login exitoso", user });
    } catch (error) {
        res.status(401).json({ error: "Falla en Google Auth" });
    }
});

app.get("/api/health", (req, res) => res.json({ status: "Servidor activo" }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor accesible vía MagicDNS en http://kernelos-pc:${PORT}`);
});