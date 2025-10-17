const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/healthz', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Sistema avanzado de árboles urbanos funcionando',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

// Rutas API
app.use('/api/arboles', require('./routes/arboles'));
app.use('/api/cazuelas', require('./routes/cazuelas'));
app.use('/api/ubicaciones', require('./routes/ubicaciones'));
app.use('/api/mantenimientos', require('./routes/mantenimientos'));
app.use('/api/catalogos', require('./routes/catalogos'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/auth', require('./routes/auth'));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Manejar todas las demás rutas
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicializar base de datos
const { initializeDatabase } = require('./database');

async function startServer() {
    try {
        console.log('🔄 Inicializando sistema avanzado...');
        await initializeDatabase();
        console.log('✅ Sistema inicializado correctamente');
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor avanzado corriendo en puerto ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
            console.log(`🌐 Frontend: http://localhost:${PORT}/`);
            console.log('🔧 Características: Imágenes, Auth, Mapas, Reportes');
        });
    } catch (error) {
        console.error('❌ Error al inicializar el sistema:', error);
        process.exit(1);
    }
}

startServer();
