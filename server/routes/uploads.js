const express = require('express');
const multer = require('multer');
const path = require('path');
const { runQuery } = require('../database');

const router = express.Router();

// Configuración de multer para almacenamiento en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, JPG, PNG, GIF)'));
    }
  }
});

// Función para convertir buffer a base64
function bufferToBase64(buffer, mimetype) {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
}

// Subir imagen para árbol
router.post('/arbol/:id', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const arbolId = req.params.id;
    const imageBase64 = bufferToBase64(req.file.buffer, req.file.mimetype);

    // Actualizar el árbol con la nueva imagen
    const result = await runQuery(
      'UPDATE arboles SET foto = ? WHERE id = ?',
      [imageBase64, arbolId]
    );

    if (result.changes > 0) {
      res.json({ 
        message: 'Imagen subida exitosamente',
        imagen: imageBase64 
      });
    } else {
      res.status(404).json({ error: 'Árbol no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subir imagen para cazuela
router.post('/cazuela/:id', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const cazuelaId = req.params.id;
    const imageBase64 = bufferToBase64(req.file.buffer, req.file.mimetype);

    // En una implementación real, agregarías un campo 'foto' a la tabla cazuelas
    const result = await runQuery(
      'UPDATE cazuelas SET foto = ? WHERE id = ?',
      [imageBase64, cazuelaId]
    );

    if (result.changes > 0) {
      res.json({ 
        message: 'Imagen subida exitosamente',
        imagen: imageBase64 
      });
    } else {
      res.status(404).json({ error: 'Cazuela no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
