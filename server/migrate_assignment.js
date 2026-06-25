const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });
    try {
        await conn.query("ALTER TABLE support_messages ADD COLUMN assignment ENUM('IA', 'HUMANO') DEFAULT 'IA'");
        console.log('Column assignment added');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists');
        } else {
            console.error(err);
        }
    }
    await conn.end();
}
run();
