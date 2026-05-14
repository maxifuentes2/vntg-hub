const mysql = require('mysql2');
const fs = require('fs'); 
const path = require('path');
require('dotenv').config();

// Definimos la ruta del certificado
const sslCertPath = path.join(__dirname, 'isrgrootx1.pem');

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
};

// Si el archivo pem existe localmente (o se subió a Render), lo usamos.
// Algunos entornos de nube ya tienen los certificados raíz incorporados y no lo necesitan.
if (fs.existsSync(sslCertPath)) {
    dbConfig.ssl.ca = fs.readFileSync(sslCertPath);
}

const pool = mysql.createPool(dbConfig);

module.exports = pool.promise();