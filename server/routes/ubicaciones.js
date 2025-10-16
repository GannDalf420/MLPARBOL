const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database');

// Obtener todas las ubicaciones
router.get('/', async (req, res) => {
  try {
    const ubicaciones = await allQuery(`
      SELECT * FROM ubicaciones 
      ORDER BY id DESC
    `);
    res.json(ubicaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una ubicación específica
router.get('/:id', async (req, res) => {
  try {
    const ubicacion = await getQuery(
      'SELECT * FROM ubicaciones WHERE id = ?',
      [req.params.id]
    );
    
    if (ubicacion) {
      res.json(ubicacion);
    } else {
      res.status(404).json({ error: 'Ubicación no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nueva ubicación
router.post('/', async (req, res) => {
  try {
    const { direccion, barrio, coordenadas } = req.body;
    
    if (!direccion || !barrio) {
      return res.status(400).json({ error: 'Dirección y barrio son obligatorios' });
    }

    const result = await runQuery(
      'INSERT INTO ubicaciones (direccion, barrio, coordenadas) VALUES (?, ?, ?)',
      [direccion, barrio, coordenadas]
    );
    
    res.status(201).json({ 
      id: result.id, 
      message: 'Ubicación creada exitosamente' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar ubicación
router.put('/:id', async (req, res) => {
  try {
    const { direccion, barrio, coordenadas } = req.body;
    
    if (!direccion || !barrio) {
      return res.status(400).json({ error: 'Dirección y barrio son obligatorios' });
    }

    const result = await runQuery(
      'UPDATE ubicaciones SET direccion = ?, barrio = ?, coordenadas = ? WHERE id = ?',
      [direccion, barrio, coordenadas, req.params.id]
    );
    
    if (result.changes > 0) {
      res.json({ message: 'Ubicación actualizada exitosamente' });
    } else {
      res.status(404).json({ error: 'Ubicación no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar ubicación
router.delete('/:id', async (req, res) => {
  try {
    // Verificar si la ubicación está siendo usada en cazuelas
    const cazuelas = await allQuery(
      'SELECT id FROM cazuelas WHERE ubicacion_id = ?',
      [req.params.id]
    );
    
    if (cazuelas.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la ubicación porque está siendo usada por una o más cazuelas' 
      });
    }

    const result = await runQuery(
      'DELETE FROM ubicaciones WHERE id = ?',
      [req.params.id]
    );
    
    if (result.changes > 0) {
      res.json({ message: 'Ubicación eliminada exitosamente' });
    } else {
      res.status(404).json({ error: 'Ubicación no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
