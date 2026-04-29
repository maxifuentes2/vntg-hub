const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors()); // Permite que React se comunique con el backend
app.use(express.json());

app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(5000, () => console.log('Servidor corriendo en el puerto 5000'));