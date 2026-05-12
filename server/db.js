const mysql = require('mysql2');
const fs = require('fs'); // Necesario para leer el certificado
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000, // TiDB usa el puerto 4000
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // ESTO ES LO MÁS IMPORTANTE PARA TIDB CLOUD:
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
        // Asegúrate de descargar el certificado de la consola de TiDB 
        // y ponerlo en la raíz de tu proyecto con este nombre:
        ca: fs.readFileSync('./isrgrootx1.pem'), 
    }
});

module.exports = pool.promise();