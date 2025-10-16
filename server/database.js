const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'arboles.db');
let db;

function initializeDatabase() {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error al abrir la base de datos', err);
    } else {
      console.log('✅ Conectado a la base de datos SQLite.');
      crearTablas();
    }
  });
}

function crearTablas() {
  // Tabla de ubicaciones
  db.run(`
    CREATE TABLE IF NOT EXISTS ubicaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      direccion TEXT NOT NULL,
      barrio TEXT NOT NULL,
      coordenadas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de cazuelas
  db.run(`
    CREATE TABLE IF NOT EXISTS cazuelas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material TEXT NOT NULL,
      tamaño TEXT NOT NULL,
      estado TEXT NOT NULL,
      fecha_instalacion DATE,
      ubicacion_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones (id)
    )
  `);

  // Tabla de árboles
  db.run(`
    CREATE TABLE IF NOT EXISTS arboles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      especie TEXT NOT NULL,
      fecha_plantacion DATE,
      estado TEXT NOT NULL CHECK(estado IN ('Vivo', 'Muerto', 'Extraído')),
      foto TEXT,
      cazuela_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cazuela_id) REFERENCES cazuelas (id)
    )
  `);

  // Tabla de tipos de mantenimiento
  db.run(`
    CREATE TABLE IF NOT EXISTS tipos_mantenimiento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      frecuencia_recomendada_dias INTEGER
    )
  `);

  // Tabla de motivos de extracción
  db.run(`
    CREATE TABLE IF NOT EXISTS motivos_extraccion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT
    )
  `);

  // Tabla de mantenimientos
  db.run(`
    CREATE TABLE IF NOT EXISTS mantenimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arbol_id INTEGER NOT NULL,
      tipo_mantenimiento_id INTEGER,
      motivo_extraccion_id INTEGER,
      fecha DATE NOT NULL,
      responsable TEXT NOT NULL,
      costo REAL,
      observaciones TEXT,
      proximo_mantenimiento DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (arbol_id) REFERENCES arboles (id),
      FOREIGN KEY (tipo_mantenimiento_id) REFERENCES tipos_mantenimiento (id),
      FOREIGN KEY (motivo_extraccion_id) REFERENCES motivos_extraccion (id)
    )
  `);

  // Insertar datos de catálogos
  insertarDatosCatalogo();
}

function insertarDatosCatalogo() {
  // Tipos de mantenimiento
  const tiposMantenimiento = [
    { nombre: 'Poda', descripcion: 'Poda de ramas y formación', frecuencia: 180 },
    { nombre: 'Riego', descripcion: 'Riego manual complementario', frecuencia: 7 },
    { nombre: 'Fertilización', descripcion: 'Aplicación de fertilizante', frecuencia: 90 },
    { nombre: 'Control de plagas', descripcion: 'Tratamiento fitosanitario', frecuencia: 30 },
    { nombre: 'Limpieza', descripcion: 'Limpieza de cazuela y alrededores', frecuencia: 15 },
    { nombre: 'Extracción', descripcion: 'Extracción del árbol', frecuencia: null }
  ];

  tiposMantenimiento.forEach(tipo => {
    db.get("SELECT id FROM tipos_mantenimiento WHERE nombre = ?", [tipo.nombre], (err, row) => {
      if (!row) {
        db.run(
          "INSERT INTO tipos_mantenimiento (nombre, descripcion, frecuencia_recomendada_dias) VALUES (?, ?, ?)",
          [tipo.nombre, tipo.descripcion, tipo.frecuencia]
        );
      }
    });
  });

  // Motivos de extracción
  const motivosExtraccion = [
    { nombre: 'Árbol muerto', descripcion: 'El árbol ha muerto por causas naturales' },
    { nombre: 'Daño estructural', descripcion: 'Árbol con daños que representan riesgo' },
    { nombre: 'Enfermedad', descripcion: 'Árbol afectado por enfermedad incurable' },
    { nombre: 'Solicitud vecinal', descripcion: 'Extracción solicitada por vecinos' },
    { nombre: 'Obras públicas', descripcion: 'Extracción por obras de infraestructura' },
    { nombre: 'Crecimiento inadecuado', descripcion: 'Árbol con crecimiento problemático' }
  ];

  motivosExtraccion.forEach(motivo => {
    db.get("SELECT id FROM motivos_extraccion WHERE nombre = ?", [motivo.nombre], (err, row) => {
      if (!row) {
        db.run(
          "INSERT INTO motivos_extraccion (nombre, descripcion) VALUES (?, ?)",
          [motivo.nombre, motivo.descripcion]
        );
      }
    });
  });
}

// Funciones de utilidad para la base de datos
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  initializeDatabase,
  runQuery,
  getQuery,
  allQuery,
  getDb: () => db
};
