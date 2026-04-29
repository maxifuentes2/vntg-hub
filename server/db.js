// db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',      // El usuario por defecto
    password: 'vntghub2026', // La que pusiste en el instalador
    database: 'vntg_hub'
});

// Usamos promesas para que sea más moderno y fácil de usar
module.exports = pool.promise();