const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database');

// Obtener todas las cazuelas
router.get('/', async (req, res) => {
  try {
    const cazuelas = await allQuery(`
      SELECT 
        c.*,
        u.direccion,
        u.barrio,
        u.coordenadas,
        (SELECT COUNT(*) FROM arboles a WHERE a.cazuela_id = c.id) as arboles_asignados
      FROM cazuelas c
      LEFT JOIN ubicaciones u ON c.ubicacion_id = u.id
      ORDER BY c.id DESC
    `);
    res.json(cazuelas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener cazuelas disponibles (sin árbol asignado)
router.get('/disponibles', async (req, res) => {
  try {
    const cazuelas = await allQuery(`
      SELECT c.*, u.direccion, u.barrio 
      FROM cazuelas c
      LEFT JOIN ubicaciones u ON c.ubicacion_id = u.id
      WHERE c.id NOT IN (SELECT cazuela_id FROM arboles WHERE cazuela_id IS NOT NULL)
      ORDER BY c.id
    `);
    res.json(cazuelas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nueva cazuela
router.post('/', async (req, res) => {
  try {
    const { material, tamaño, estado, fecha_instalacion, ubicacion_id } = req.body;
    
    // Validaciones básicas
    if (!material || !tamaño || !estado) {
      return res.status(400).json({ error: 'Material, tamaño y estado son obligatorios' });
    }

    const result = await runQuery(
      'INSERT INTO cazuelas (material, tamaño, estado, fecha_instalacion, ubicacion_id) VALUES (?, ?, ?, ?, ?)',
      [material, tamaño, estado, fecha_instalacion, ubicacion_id]
    );
    
    res.status(201).json({ 
      id: result.id, 
      message: 'Cazuela creada exitosamente' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Las rutas PUT y DELETE son similares a las de árboles...

module.exports = router;
