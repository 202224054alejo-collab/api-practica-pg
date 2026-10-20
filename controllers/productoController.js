// controllers/productoController.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const db = require('../config/db'); // Conexión a PostgreSQL

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
            [nombre, precio, stock || 0]
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
            [nombre, precio, stock || 0, id]
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

// --- IMPORTACIÓN DE PRODUCTOS (JSON / CSV) ---
exports.importarProductos = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha adjuntado ningún archivo.' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let productosAInsertar = [];

    try {
        if (fileExtension === '.json') {
            // Procesamiento de archivo JSON
            const dataRaw = fs.readFileSync(filePath, 'utf8');
            const parsedData = JSON.parse(dataRaw);
            
            productosAInsertar = parsedData.map(item => ({
                nombre: item.nombre,
                precio: parseFloat(item.precio),
                stock: item.stock ? parseInt(item.stock, 10) : 0
            }));

        } else if (fileExtension === '.csv') {
            // Procesamiento de archivo CSV con Streams
            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv({
                        // Limpia caracteres invisibles (BOM) y espacios extra de los encabezados
                        mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, '').toLowerCase()
                    }))
                    .on('data', (row) => {
                        if (row.nombre && row.precio) {
                            productosAInsertar.push({
                                nombre: row.nombre.trim(),
                                precio: parseFloat(row.precio),
                                stock: row.stock ? parseInt(row.stock, 10) : 0
                            });
                        }
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Formato no soportado. Solo se permite .json o .csv' });
        }

        if (productosAInsertar.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'El archivo está vacío o no contiene el formato esperado.' });
        }

        // Inserción en PostgreSQL
        let totalInsertados = 0;
        for (const prod of productosAInsertar) {
            await db.query(
                'INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3)',
                [prod.nombre, prod.precio, prod.stock]
            );
            totalInsertados++;
        }

        // Eliminar el archivo temporal
        fs.unlinkSync(filePath);

        return res.status(200).json({
            mensaje: 'Importación realizada con éxito.',
            totalInsertados
        });

    } catch (error) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        console.error('Error detallado al importar:', error);
        return res.status(500).json({ error: 'Error al procesar el archivo e insertar en la base de datos.' });
    }
};

// --- EXPORTACIÓN DE PRODUCTOS (JSON / CSV) ---
exports.exportarProductos = async (req, res) => {
    const { formato } = req.params;

    try {
        const resultado = await db.query('SELECT * FROM productos ORDER BY id ASC');
        const productos = resultado.rows;

        if (formato.toLowerCase() === 'json') {
            res.setHeader('Content-Disposition', 'attachment; filename=productos_exportados.json');
            res.setHeader('Content-Type', 'application/json');
            return res.json(productos);

        } else if (formato.toLowerCase() === 'csv') {
            const json2csvParser = new Parser({ fields: ['id', 'nombre', 'precio', 'stock'] });
            const csvData = json2csvParser.parse(productos);

            res.setHeader('Content-Disposition', 'attachment; filename=productos_exportados.csv');
            res.setHeader('Content-Type', 'text/csv');
            return res.send(csvData);

        } else {
            return res.status(400).json({ error: 'Formato no válido. Utilice "json" o "csv".' });
        }

    } catch (error) {
        console.error('Error al exportar:', error);
        return res.status(500).json({ error: 'Error al consultar y exportar los datos.' });
    }
};