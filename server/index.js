const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// 1. OBTENER TODOS LOS PRODUCTOS (Modificado para incluir categoryId)
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, title, price, images, description, categoryId FROM products ORDER BY id DESC');
        console.log('✅ Productos obtenidos:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error en /api/products:', error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

// 2. OBTENER UN PRODUCTO POR ID (Faltaba para DetalleProducto)
app.get('/api/products/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, title, price, images, description, stock, categoryId FROM products WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            console.warn('⚠️ Producto no encontrado:', req.params.id);
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('❌ Error en /api/products/:id:', error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 3. OBTENER CATEGORÍAS
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name FROM categories');
        console.log('✅ Categorías obtenidas:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error en /api/categories:', error);
        res.status(500).json({ error: "Error al obtener categorías" });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: '✅ Servidor activo' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));