// index.js - Backend VNTG-HUB
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();

// Middlewares
app.use(cors()); // Permite que el frontend (React) acceda a la API
app.use(express.json()); // Permite recibir datos en formato JSON

// ==========================================
// 1. RUTAS DE PRODUCTOS (ABM + FILTROS)
// ==========================================

// GET - Listar productos con filtros avanzados (Sprint 1 & 2)
app.get('/api/products', async (req, res) => {
    const { categoryId, minPrice, maxPrice, title } = req.query;
    
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (categoryId) {
        sql += ' AND categoryId = ?';
        params.push(categoryId);
    }
    if (minPrice) {
        sql += ' AND price >= ?';
        params.push(minPrice);
    }
    if (maxPrice) {
        sql += ' AND price <= ?';
        params.push(maxPrice);
    }
    if (title) {
        sql += ' AND title LIKE ?';
        params.push(`%${title}%`);
    }

    sql += ' ORDER BY createdAt DESC';

    try {
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error("Error en GET /api/products:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

// POST - Crear un producto nuevo con FICHA TÉCNICA
app.post('/api/products', async (req, res) => {
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
            Array.isArray(gallery) ? gallery.join(',') : gallery // Convertimos el array de fotos a texto para SQL
        ]);

        res.status(201).json({ id: result.insertId, message: "¡Tesoro publicado con éxito!" });
    } catch (error) {
        console.error("Error en POST:", error);
        res.status(500).json({ error: "Error al crear el producto" });
    }
});

// GET - Obtener un producto por ID (Necesario para DetalleProducto.jsx)
app.get('/api/products/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
        
        // Convertimos la cadena de texto de 'gallery' de vuelta a un Array para React
        const producto = rows[0];
        if (producto.gallery) producto.gallery = producto.gallery.split(',');
        
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el detalle" });
    }
});

// DELETE - Eliminar un producto (ABM)
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar producto" });
    }
});

// ==========================================
// 2. RUTAS DE CATEGORÍAS (DINÁMICAS)
// ==========================================

// GET - Obtener solo categorías que tienen productos con stock (Evita categorías vacías)
app.get('/api/categories', async (req, res) => {
    try {
        const sql = `
            SELECT DISTINCT c.* 
            FROM categories c
            INNER JOIN products p ON c.id = p.categoryId
            WHERE p.stock > 0
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error("Error en GET /api/categories:", error);
        res.status(500).json({ error: "Error al obtener categorías dinámicas" });
    }
});

// ==========================================
// 3. RUTA DE RESERVA (US-06)
// ==========================================

// POST - Bloquea un producto por 10 minutos para el carrito
app.post('/api/reserve', async (req, res) => {
    const { productId, userId } = req.body;

    try {
        // 1. Verificamos si ya existe una reserva activa para este producto
        const [existing] = await db.query(
            `SELECT * FROM cart_reservations 
             WHERE productId = ? AND status = 'active' AND expiresAt > NOW()`,
            [productId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                error: "El artículo ya está reservado por otro comprador temporalmente." 
            });
        }

        // 2. Insertamos la reserva calculando los 10 min directo en la Base de Datos
        await db.query(
            `INSERT INTO cart_reservations (productId, userId, expiresAt) 
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
            [productId, userId]
        );

        res.json({ 
            message: "Reserva exitosa por 10 minutos." 
        });
    } catch (error) {
        console.error("Error en /api/reserve:", error);
        res.status(500).json({ error: "Error al procesar la reserva" });
    }
});

// ==========================================
// 4. RUTAS DE AUTENTICACIÓN (SPRINT 2/3)
// ==========================================

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role || 'buyer']
        );
        res.status(201).json({ id: result.insertId, message: "Usuario registrado con éxito" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "El email ya está registrado" });
        }
        res.status(500).json({ error: "Error en el registro" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        if (rows.length === 0) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        const user = rows[0];
        delete user.password; // Ocultar contraseña
        res.json({ message: "Bienvenido", user });
    } catch (error) {
        res.status(500).json({ error: "Error en el login" });
    }
});

// ==========================================
// 5. RUTA DE COMPRA FINAL (US-07)
// ==========================================

app.post('/api/checkout', async (req, res) => {
    const { productId, userId } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Bloqueamos la fila para evitar que otro proceso la modifique
        const [products] = await connection.query(
            'SELECT stock FROM products WHERE id = ? FOR UPDATE',
            [productId]
        );

        if (products.length === 0 || products[0].stock <= 0) {
            return res.status(400).json({ error: "Stock no disponible" });
        }

        // Restar stock
        await connection.query('UPDATE products SET stock = stock - 1 WHERE id = ?', [productId]);
        
        // Marcar reserva como completada (si existía)
        await connection.query(
            "UPDATE cart_reservations SET status = 'completed' WHERE productId = ? AND userId = ? AND status = 'active'",
            [productId, userId]
        );

        // Opcional: Registrar la orden
        await connection.query(
            "INSERT INTO orders (userId, productId, status) VALUES (?, ?, 'completed')",
            [userId, productId]
        );

        await connection.commit();
        res.json({ message: "¡Compra realizada con éxito! El stock ha sido actualizado." });
    } catch (error) {
        await connection.rollback();
        console.error("Error en el checkout:", error);
        res.status(500).json({ error: "Error al procesar el pago" });
    } finally {
        connection.release();
    }
});

// ==========================================
// 6. HEALTH CHECK Y SERVIDOR (Merge Conflict Resuelto)
// ==========================================

// Ruta de estado del servidor
app.get('/api/health', (req, res) => {
    res.json({ status: 'Servidor activo' });
});

// Inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    🚀 Servidor de VNTG-HUB encendido
    📡 Puerto: ${PORT}
    🔗 URL: http://localhost:${PORT}
    `);
});