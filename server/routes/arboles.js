const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database');

// Obtener todos los árboles con detalles
router.get('/', async (req, res) => {
  try {
    const arboles = await allQuery(`
      SELECT 
        a.*,
        c.material as cazuela_material,
        c.tamaño as cazuela_tamaño,
        c.estado as cazuela_estado,
        u.direccion,
        u.barrio,
        u.coordenadas
      FROM arboles a
      LEFT JOIN cazuelas c ON a.cazuela_id = c.id
      LEFT JOIN ubicaciones u ON c.ubicacion_id = u.id
      ORDER BY a.id DESC
    `);
    res.json(arboles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un árbol específico
router.get('/:id', async (req, res) => {
  try {
    const arbol = await getQuery(`
      SELECT 
        a.*,
        c.material as cazuela_material,
        c.tamaño as cazuela_tamaño,
        c.estado as cazuela_estado,
        u.direccion,
        u.barrio,
        u.coordenadas
      FROM arboles a
      LEFT JOIN cazuelas c ON a.cazuela_id = c.id
      LEFT JOIN ubicaciones u ON c.ubicacion_id = u.id
      WHERE a.id = ?
    `, [req.params.id]);
    
    if (arbol) {
      res.json(arbol);
    } else {
      res.status(404).json({ error: 'Árbol no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo árbol
router.post('/', async (req, res) => {
  try {
    const { especie, fecha_plantacion, estado, foto, cazuela_id } = req.body;
    const result = await runQuery(
      'INSERT INTO arboles (especie, fecha_plantacion, estado, foto, cazuela_id) VALUES (?, ?, ?, ?, ?)',
      [especie, fecha_plantacion, estado, foto, cazuela_id]
    );
    res.status(201).json({ id: result.id, message: 'Árbol creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar árbol
router.put('/:id', async (req, res) => {
  try {
    const { especie, fecha_plantacion, estado, foto, cazuela_id } = req.body;
    const result = await runQuery(
      'UPDATE arboles SET especie = ?, fecha_plantacion = ?, estado = ?, foto = ?, cazuela_id = ? WHERE id = ?',
      [especie, fecha_plantacion, estado, foto, cazuela_id, req.params.id]
    );
    
    if (result.changes > 0) {
      res.json({ message: 'Árbol actualizado exitosamente' });
    } else {
      res.status(404).json({ error: 'Árbol no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar árbol
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery('DELETE FROM arboles WHERE id = ?', [req.params.id]);
    
    if (result.changes > 0) {
      res.json({ message: 'Árbol eliminado exitosamente' });
    } else {
      res.status(404).json({ error: 'Árbol no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas de árboles
router.get('/estadisticas/estados', async (req, res) => {
  try {
    const stats = await allQuery(`
      SELECT 
        estado,
        COUNT(*) as cantidad,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM arboles)), 2) as porcentaje
      FROM arboles 
      GROUP BY estado
    `);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
