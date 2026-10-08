// config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
});

// Prueba de conexión
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error al conectar a la base de datos PostgreSQL:', err.stack);
    }
    console.log('Conectado exitosamente a la base de datos PostgreSQL');
    release();
});

module.exports = pool;