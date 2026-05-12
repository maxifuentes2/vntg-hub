const express = require("express");
const cors = require("cors");
const os = require("os"); 
require("dotenv").config();
const db = require("./db");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// CONFIGURACIÓN DE CORS PARA DESARROLLO Y PRODUCCIÓN
const allowedOrigins = [
    "http://localhost:5173",        // Frontend local (Vite)
    "http://localhost:3000",        // Puerto local alternativo
    "https://vntg-hub.vercel.app"   // Frontend oficial en Vercel
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como Postman) o si están en la lista oficial
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Acceso denegado por política de CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// --- RUTAS DE PRODUCTOS ---
app.get("/api/products", async (req, res) => {
    const { categoryId, minPrice, maxPrice, title, franchise, q } = req.query;
    let sql = "SELECT * FROM products WHERE stock > 0";
    const params = [];

    if (categoryId && categoryId !== 'all') {
        sql += " AND categoryId = ?";
        params.push(categoryId);
    }
    if (franchise) { sql += " AND franchise = ?"; params.push(franchise); }
    if (minPrice) { sql += " AND price >= ?"; params.push(minPrice); }
    if (maxPrice) { sql += " AND price <= ?"; params.push(maxPrice); }
    if (title) { sql += " AND title LIKE ?"; params.push(`%${title}%`); }
    
    if (q) {
        sql += " AND (title LIKE ? OR description LIKE ? OR franchise LIKE ?)";
        const searchTerm = `%${q}%`;
        params.push(searchTerm, searchTerm, searchTerm);
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

// --- RUTAS DE CATEGORÍAS ---
app.get("/api/categories", async (req, res) => {
    try {
        const sql = "SELECT DISTINCT c.* FROM categories c INNER JOIN products p ON c.id = p.categoryId WHERE p.stock > 0";
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener categorías" });
    }
});

// --- AUTH Y HEALTH ---
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

// LANZAMIENTO
const PORT = process.env.PORT || 5000;
const hostname = os.hostname().toLowerCase(); 

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Servidor VNTG HUB activo en local: http://localhost:${PORT}`);
    });
}

module.exports = app; // Necesario para que Vercel maneje el servidor como Serverless