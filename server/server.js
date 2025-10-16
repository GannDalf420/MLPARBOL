const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check para Render
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Sistema de Árboles Urbanos funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Importar y usar rutas
app.use('/api/arboles', require('./routes/arboles'));
app.use('/api/cazuelas', require('./routes/cazuelas'));
app.use('/api/ubicaciones', require('./routes/ubicaciones'));
app.use('/api/mantenimientos', require('./routes/mantenimientos'));
app.use('/api/catalogos', require('./routes/catalogos'));

// Ruta principal - servir el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Manejar todas las demás rutas para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicializar base de datos
const { initializeDatabase } = require('./database');
initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Health check disponible en: http://localhost:${PORT}/healthz`);
  console.log(`🌐 Frontend disponible en: http://localhost:${PORT}/`);
});
