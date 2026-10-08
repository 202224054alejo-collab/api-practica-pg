// controllers/productoController.js
const db = require('../config/db');

// 1. GET ALL
exports.obtenerProductos = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM productos ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error en GET /productos:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 2. GET BY ID
exports.obtenerProductoPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM productos WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(`Error en GET /productos/${id}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 3. POST (CREATE)
exports.crearProducto = async (req, res) => {
    const { nombre, precio, stock } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING *',
            [nombre, precio, stock]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error en POST /productos:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 4. PUT (UPDATE)
exports.actualizarProducto = async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, stock } = req.body;
    try {
        const result = await db.query(
            'UPDATE productos SET nombre = $1, precio = $2, stock = $3 WHERE id = $4 RETURNING *',
            [nombre, precio, stock, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        res.json({ mensaje: 'Producto actualizado exitosamente', producto: result.rows[0] });
    } catch (error) {
        console.error(`Error en PUT /productos/${id}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 5. DELETE
exports.eliminarProducto = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        res.json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error(`Error en DELETE /productos/${id}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};