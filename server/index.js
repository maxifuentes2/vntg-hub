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
    const { categoryId, minPrice, maxPrice, title, franchise } = req.query;

    let sql = "SELECT * FROM products WHERE 1=1";
    const params = [];

    if (categoryId) {
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
        franchise,
        escala, fabricante, anio, material, estado, gallery
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
            franchise,
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
        franchise,
        escala, fabricante, anio, material, estado, gallery
    } = req.body;

    if (!title || !price || !categoryId) {
        return res.status(400).json({ error: "Título, precio y categoría son obligatorios" });
    }

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
            franchise,
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

// DELETE - Eliminar un producto a la fuerza
app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();

    try {
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");
        const [result] = await connection.query("DELETE FROM products WHERE id = ?", [id]);
        await connection.query("SET FOREIGN_KEY_CHECKS = 1");

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ message: "Producto eliminado a la fuerza con éxito" });
    } catch (error) {
        console.error("Error al borrar a la fuerza:", error);
        res.status(500).json({ error: "Error interno al eliminar" });
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
        res.status(500).json({ error: "Error al obtener categorías dinámicas" });
    }
});

// GET - Obtener TODAS las categorías (Uso administrativo en Postman)
app.get("/api/admin/categories", async (req, res) => {
    try {
        // Traemos todo de la tabla sin filtros de stock o productos
        const [rows] = await db.query("SELECT * FROM categories");
        res.json(rows);
    } catch (error) {
        console.error("Error en GET /api/admin/categories:", error);
        res.status(500).json({ error: "Error al obtener el listado completo de categorías" });
    }
});

// POST - Crear una nueva categoría
app.post("/api/categories", async (req, res) => {
    const { name } = req.body; 

    if (!name) {
        return res.status(400).json({ error: "El nombre de la categoría es obligatorio" });
    }

    try {
        const sql = "INSERT INTO categories (name) VALUES (?)";
        const [result] = await db.query(sql, [name]);
        res.status(201).json({ id: result.insertId, message: "¡Categoría creada con éxito!" });
    } catch (error) {
        console.error("Error en POST /api/categories:", error);
        res.status(500).json({ error: "Error al crear la categoría" });
    }
});

// PUT - Editar el nombre de una categoría
app.put("/api/categories/:id", async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "El nuevo nombre es obligatorio" });
    }

    try {
        const [result] = await db.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Categoría no encontrada" });
        res.json({ message: "¡Categoría actualizada con éxito!" });
    } catch (error) {
        console.error("Error en PUT /api/categories:", error);
        res.status(500).json({ error: "Error al actualizar la categoría" });
    }
});

// DELETE - Eliminar una categoría
app.delete("/api/categories/:id", async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();

    try {
        // Desactivamos checks para poder borrar aunque tenga productos asociados
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");

        const [result] = await connection.query("DELETE FROM categories WHERE id = ?", [id]);

        await connection.query("SET FOREIGN_KEY_CHECKS = 1");

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Categoría no encontrada" });
        }

        res.json({ message: "Categoría eliminada con éxito" });
    } catch (error) {
        console.error("Error al eliminar categoría:", error);
        res.status(500).json({ error: "Error interno al eliminar" });
    } finally {
        connection.release();
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