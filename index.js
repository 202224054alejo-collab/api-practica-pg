// index.js
const express = require('express');
const cors = require('cors'); // 1. Importar cors
require('dotenv').config();

const productoController = require('./controllers/productoController');

const app = express();

// Middlewares
app.use(cors()); // 2. Habilitar CORS globalmente
app.use(express.json());

// Definición de tus 5 rutas
app.get('/api/productos', productoController.obtenerProductos);
app.get('/api/productos/:id', productoController.obtenerProductoPorId);
app.post('/api/productos', productoController.crearProducto);
app.put('/api/productos/:id', productoController.actualizarProducto);
app.delete('/api/productos/:id', productoController.eliminarProducto);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});