// index.js
const express = require('express');
require('dotenv').config();

const productoController = require('./controllers/productoController');

const app = express();
app.use(express.json());

// Definición de las 5 rutas
app.get('/api/productos', productoController.obtenerProductos);
app.get('/api/productos/:id', productoController.obtenerProductoPorId);
app.post('/api/productos', productoController.crearProducto);
app.put('/api/productos/:id', productoController.actualizarProducto);
app.delete('/api/productos/:id', productoController.eliminarProducto);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});