const mysql = require('mysql2');
const fs = require('fs'); 
const path = require('path');
require('dotenv').config();

// Generamos la ruta absoluta al certificado para compatibilidad total con Vercel
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
        // fs.readFileSync con ruta absoluta es la clave para la nube
        ca: fs.readFileSync(sslCertPath), 
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();