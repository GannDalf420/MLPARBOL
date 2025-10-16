const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database');

// Obtener todos los mantenimientos con detalles
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    let query = `
      SELECT 
        m.*,
        a.especie,
        tm.nombre as tipo_mantenimiento,
        me.nombre as motivo_extraccion
      FROM mantenimientos m
      LEFT JOIN arboles a ON m.arbol_id = a.id
      LEFT JOIN tipos_mantenimiento tm ON m.tipo_mantenimiento_id = tm.id
      LEFT JOIN motivos_extraccion me ON m.motivo_extraccion_id = me.id
      ORDER BY m.fecha DESC
    `;
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const mantenimientos = await allQuery(query);
    res.json(mantenimientos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener mantenimientos de un árbol específico
router.get('/arbol/:arbol_id', async (req, res) => {
  try {
    const mantenimientos = await allQuery(`
      SELECT 
        m.*,
        tm.nombre as tipo_mantenimiento,
        me.nombre as motivo_extraccion
      FROM mantenimientos m
      LEFT JOIN tipos_mantenimiento tm ON m.tipo_mantenimiento_id = tm.id
      LEFT JOIN motivos_extraccion me ON m.motivo_extraccion_id = me.id
      WHERE m.arbol_id = ?
      ORDER BY m.fecha DESC
    `, [req.params.arbol_id]);
    
    res.json(mantenimientos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un mantenimiento específico
router.get('/:id', async (req, res) => {
  try {
    const mantenimiento = await getQuery(`
      SELECT 
        m.*,
        a.especie,
        tm.nombre as tipo_mantenimiento,
        me.nombre as motivo_extraccion
      FROM mantenimientos m
      LEFT JOIN arboles a ON m.arbol_id = a.id
      LEFT JOIN tipos_mantenimiento tm ON m.tipo_mantenimiento_id = tm.id
      LEFT JOIN motivos_extraccion me ON m.motivo_extraccion_id = me.id
      WHERE m.id = ?
    `, [req.params.id]);
    
    if (mantenimiento) {
      res.json(mantenimiento);
    } else {
      res.status(404).json({ error: 'Mantenimiento no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo mantenimiento
router.post('/', async (req, res) => {
  try {
    const { 
      arbol_id, 
      tipo_mantenimiento_id, 
      motivo_extraccion_id, 
      fecha, 
      responsable, 
      costo, 
      observaciones 
    } = req.body;

    // Validaciones básicas
    if (!arbol_id || !fecha || !responsable) {
      return res.status(400).json({ 
        error: 'arbol_id, fecha y responsable son obligatorios' 
      });
    }

    // Calcular próximo mantenimiento si es un tipo de mantenimiento (no extracción)
    let proximo_mantenimiento = null;
    if (tipo_mantenimiento_id && !motivo_extraccion_id) {
      const tipoMantenimiento = await getQuery(
        'SELECT frecuencia_recomendada_dias FROM tipos_mantenimiento WHERE id = ?',
        [tipo_mantenimiento_id]
      );
      
      if (tipoMantenimiento && tipoMantenimiento.frecuencia_recomendada_dias) {
        const fechaProximo = new Date(fecha);
        fechaProximo.setDate(fechaProximo.getDate() + tipoMantenimiento.frecuencia_recomendada_dias);
        proximo_mantenimiento = fechaProximo.toISOString().split('T')[0];
      }
    }

    const result = await runQuery(
      `INSERT INTO mantenimientos 
       (arbol_id, tipo_mantenimiento_id, motivo_extraccion_id, fecha, responsable, costo, observaciones, proximo_mantenimiento) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [arbol_id, tipo_mantenimiento_id, motivo_extraccion_id, fecha, responsable, costo, observaciones, proximo_mantenimiento]
    );
    
    res.status(201).json({ 
      id: result.id, 
      message: 'Mantenimiento registrado exitosamente',
      proximo_mantenimiento 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar mantenimiento
router.put('/:id', async (req, res) => {
  try {
    const { 
      tipo_mantenimiento_id, 
      motivo_extraccion_id, 
      fecha, 
      responsable, 
      costo, 
      observaciones 
    } = req.body;

    const result = await runQuery(
      `UPDATE mantenimientos 
       SET tipo_mantenimiento_id = ?, motivo_extraccion_id = ?, fecha = ?, responsable = ?, costo = ?, observaciones = ? 
       WHERE id = ?`,
      [tipo_mantenimiento_id, motivo_extraccion_id, fecha, responsable, costo, observaciones, req.params.id]
    );
    
    if (result.changes > 0) {
      res.json({ message: 'Mantenimiento actualizado exitosamente' });
    } else {
      res.status(404).json({ error: 'Mantenimiento no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar mantenimiento
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery(
      'DELETE FROM mantenimientos WHERE id = ?',
      [req.params.id]
    );
    
    if (result.changes > 0) {
      res.json({ message: 'Mantenimiento eliminado exitosamente' });
    } else {
      res.status(404).json({ error: 'Mantenimiento no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
