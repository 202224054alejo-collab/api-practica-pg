// index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const productoController = require('./controllers/productoController');

const app = express();

// Configuración de Multer para la subida de archivos temporales en la carpeta /uploads
const upload = multer({ dest: 'uploads/' });

// Middlewares
app.use(cors());
app.use(express.json());

// --- NUEVAS RUTAS PRÁCTICA 4 (Importación y Exportación) ---
// Deben ir ANTES de /api/productos/:id para evitar conflictos de ruteo
app.post('/api/productos/importar', upload.single('archivo'), productoController.importarProductos);
app.get('/api/productos/exportar/:formato', productoController.exportarProductos);

// Rutas CRUD generales
app.get('/api/productos', productoController.obtenerProductos);
app.post('/api/productos', productoController.crearProducto);

// Rutas con parámetro dinámico (:id) siempre al final
app.get('/api/productos/:id', productoController.obtenerProductoPorId);
app.put('/api/productos/:id', productoController.actualizarProducto);
app.delete('/api/productos/:id', productoController.eliminarProducto);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});