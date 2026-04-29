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
// Ejemplo de uso: /api/products?categoryId=1&maxPrice=5000
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

// POST - Crear un producto nuevo (ABM - Solo para Vendedores)
app.post('/api/products', async (req, res) => {
    const { title, description, price, stock, images, categoryId } = req.body;
    
    // Validación básica de backend
    if (!title || !price || !categoryId) {
        return res.status(400).json({ error: "Título, precio y categoría son obligatorios" });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO products (title, description, price, stock, images, categoryId) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, price, stock, images, categoryId]
        );
        res.status(201).json({ 
            id: result.insertId, 
            message: "Producto publicado con éxito" 
        });
    } catch (error) {
        console.error("Error en POST /api/products:", error);
        res.status(500).json({ error: "Error al crear el producto" });
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
// 2. RUTAS DE CATEGORÍAS
// ==========================================

// GET - Obtener todas las categorías (Para el Navbar de tus amigos)
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener categorías" });
    }
});

// ==========================================
// 3. RUTAS DE AUTENTICACIÓN (SPRINT 2/3)
// ==========================================

// POST - Registro de usuario (Sprint 2 - Base)
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
        // No enviamos la contraseña de vuelta por seguridad
        delete user.password;
        res.json({ message: "Bienvenido", user });
    } catch (error) {
        res.status(500).json({ error: "Error en el login" });
    }
});

// ==========================================
// INICIO DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    🚀 Servidor de VNTG-HUB encendido
    📡 Puerto: ${PORT}
    🔗 URL: http://localhost:${PORT}
    `);
});