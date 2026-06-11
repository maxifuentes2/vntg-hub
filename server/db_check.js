const mysql = require('mysql2');
require('dotenv').config();
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});
const p = pool.promise();

async function run() {
    const [prodCols] = await p.query('SHOW COLUMNS FROM products');
    console.log('=== Products Columns ===');
    prodCols.forEach(c => console.log(c.Field + ' (' + c.Type + ') null=' + c.Null + ' default=' + c.Default));

    const [catCols] = await p.query('SHOW COLUMNS FROM categories');
    console.log('\n=== Categories Columns ===');
    catCols.forEach(c => console.log(c.Field + ' (' + c.Type + ') null=' + c.Null + ' default=' + c.Default));

    const [cats] = await p.query('SELECT * FROM categories');
    console.log('\n=== All Categories ===');
    cats.forEach(c => console.log('  id=' + c.id + ' (' + typeof c.id + ') name="' + c.name + '"'));

    const [prods] = await p.query('SELECT id, title, categoryId FROM products ORDER BY id DESC LIMIT 15');
    console.log('\n=== Recent 15 Products ===');
    prods.forEach(p => console.log('  id=' + p.id + ' categoryId=' + p.categoryId + ' (' + typeof p.categoryId + ') title="' + p.title + '"'));

    // Products with categoryId that doesn't match any category
    const [mismatches] = await p.query(
        `SELECT p.id AS pid, p.title, p.categoryId AS pcid
         FROM products p
         LEFT JOIN categories c ON p.categoryId = c.id
         WHERE p.categoryId IS NOT NULL
           AND (p.categoryId != 0 OR p.categoryId IS NOT NULL)
           AND c.id IS NULL
         LIMIT 20`
    );
    console.log('\n=== Mismatched (catId not in categories) ===');
    mismatches.forEach(m => console.log('  pid=' + m.pid + ' catId=' + m.pcid + ' title="' + m.title + '"'));
    if (mismatches.length === 0) console.log('  (none)');

    // Products with categoryId = 0 or empty
    const [zeros] = await p.query(
        `SELECT id, title, categoryId FROM products WHERE categoryId IS NULL OR categoryId = 0 OR categoryId = ''`
    );
    console.log('\n=== Null/Zero/Empty categoryId ===');
    zeros.forEach(z => console.log('  id=' + z.id + ' catId=' + z.categoryId + ' title="' + z.title + '"'));
    if (zeros.length === 0) console.log('  (none)');

    await p.end();
}

run().catch(e => { console.error(e); process.exit(1); });
