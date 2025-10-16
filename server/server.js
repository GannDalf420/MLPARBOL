const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Inicializar base de datos
initializeDatabase();

// Rutas API
app.use('/api/arboles', require('./routes/arboles'));
app.use('/api/cazuelas', require('./routes/cazuelas'));
app.use('/api/ubicaciones', require('./routes/ubicaciones'));
app.use('/api/mantenimientos', require('./routes/mantenimientos'));
app.use('/api/catalogos', require('./routes/catalogos'));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// Health check para Render
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Sistema de Árboles Urbanos funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});
