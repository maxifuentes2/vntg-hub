const mysql = require('mysql2');
const fs = require('fs'); 
const path = require('path');
require('dotenv').config();

// Esto genera la ruta correcta tanto en tu PC como en Vercel
const sslCertPath = path.join(__dirname, 'isrgrootx1.pem');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
        // USAR ESTA VARIABLE ES CLAVE:
        ca: fs.readFileSync(sslCertPath), 
    }
});

module.exports = pool.promise();