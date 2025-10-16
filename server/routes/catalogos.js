const express = require('express');
const router = express.Router();
const { allQuery } = require('../database');

// Obtener todos los catálogos
router.get('/', async (req, res) => {
  try {
    const [tiposMantenimiento, motivosExtraccion] = await Promise.all([
      allQuery('SELECT * FROM tipos_mantenimiento ORDER BY nombre'),
      allQuery('SELECT * FROM motivos_extraccion ORDER BY nombre')
    ]);
    
    res.json({
      tiposMantenimiento,
      motivosExtraccion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener tipos de mantenimiento
router.get('/tipos-mantenimiento', async (req, res) => {
  try {
    const tipos = await allQuery('SELECT * FROM tipos_mantenimiento ORDER BY nombre');
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener motivos de extracción
router.get('/motivos-extraccion', async (req, res) => {
  try {
    const motivos = await allQuery('SELECT * FROM motivos_extraccion ORDER BY nombre');
    res.json(motivos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
