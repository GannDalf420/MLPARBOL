const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'arboles.db');
let db;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error al abrir la base de datos', err);
        reject(err);
      } else {
        console.log('✅ Conectado a la base de datos SQLite.');
        crearTablas()
          .then(() => {
            console.log('✅ Todas las tablas creadas exitosamente.');
            resolve();
          })
          .catch(reject);
      }
    });
  });
}

function crearTablas() {
  return new Promise((resolve, reject) => {
    // Crear tablas en serie para evitar problemas de dependencias
    const tables = [
      `CREATE TABLE IF NOT EXISTS ubicaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        direccion TEXT NOT NULL,
        barrio TEXT NOT NULL,
        coordenadas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS cazuelas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material TEXT NOT NULL,
        tamaño TEXT NOT NULL,
        estado TEXT NOT NULL,
        fecha_instalacion DATE,
        ubicacion_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones (id)
      )`,
      `CREATE TABLE IF NOT EXISTS arboles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        especie TEXT NOT NULL,
        fecha_plantacion DATE,
        estado TEXT NOT NULL CHECK(estado IN ('Vivo', 'Muerto', 'Extraído')),
        foto TEXT,
        cazuela_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cazuela_id) REFERENCES cazuelas (id)
      )`,
      `CREATE TABLE IF NOT EXISTS tipos_mantenimiento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        frecuencia_recomendada_dias INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS motivos_extraccion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS mantenimientos (
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
      )`
    ];

    // Función para ejecutar las consultas en serie
    const executeQueries = (index = 0) => {
      if (index >= tables.length) {
        // Todas las tablas creadas, ahora insertar datos del catálogo
        insertarDatosCatalogo()
          .then(resolve)
          .catch(reject);
        return;
      }

      db.run(tables[index], function(err) {
        if (err) {
          console.error(`Error creando tabla ${index + 1}:`, err);
          reject(err);
        } else {
          console.log(`✅ Tabla ${index + 1} creada/verificada`);
          executeQueries(index + 1);
        }
      });
    };

    executeQueries();
  });
}

function insertarDatosCatalogo() {
  return new Promise((resolve, reject) => {
    // Tipos de mantenimiento
    const tiposMantenimiento = [
      { nombre: 'Poda', descripcion: 'Poda de ramas y formación', frecuencia: 180 },
      { nombre: 'Riego', descripcion: 'Riego manual complementario', frecuencia: 7 },
      { nombre: 'Fertilización', descripcion: 'Aplicación de fertilizante', frecuencia: 90 },
      { nombre: 'Control de plagas', descripcion: 'Tratamiento fitosanitario', frecuencia: 30 },
      { nombre: 'Limpieza', descripcion: 'Limpieza de cazuela y alrededores', frecuencia: 15 },
      { nombre: 'Extracción', descripcion: 'Extracción del árbol', frecuencia: null }
    ];

    // Motivos de extracción
    const motivosExtraccion = [
      { nombre: 'Árbol muerto', descripcion: 'El árbol ha muerto por causas naturales' },
      { nombre: 'Daño estructural', descripcion: 'Árbol con daños que representan riesgo' },
      { nombre: 'Enfermedad', descripcion: 'Árbol afectado por enfermedad incurable' },
      { nombre: 'Solicitud vecinal', descripcion: 'Extracción solicitada por vecinos' },
      { nombre: 'Obras públicas', descripcion: 'Extracción por obras de infraestructura' },
      { nombre: 'Crecimiento inadecuado', descripcion: 'Árbol con crecimiento problemático' }
    ];

    let completed = 0;
    const total = tiposMantenimiento.length + motivosExtraccion.length;

    if (total === 0) {
      resolve();
      return;
    }

    const checkCompletion = () => {
      completed++;
      if (completed === total) {
        console.log('✅ Datos de catálogo insertados/verificados');
        resolve();
      }
    };

    // Insertar tipos de mantenimiento
    tiposMantenimiento.forEach(tipo => {
      db.get("SELECT id FROM tipos_mantenimiento WHERE nombre = ?", [tipo.nombre], (err, row) => {
        if (err) {
          console.error('Error verificando tipo mantenimiento:', err);
          checkCompletion();
          return;
        }
        
        if (!row) {
          db.run(
            "INSERT INTO tipos_mantenimiento (nombre, descripcion, frecuencia_recomendada_dias) VALUES (?, ?, ?)",
            [tipo.nombre, tipo.descripcion, tipo.frecuencia],
            function(err) {
              if (err) {
                console.error('Error insertando tipo mantenimiento:', err);
              } else {
                console.log(`✅ Tipo mantenimiento insertado: ${tipo.nombre}`);
              }
              checkCompletion();
            }
          );
        } else {
          checkCompletion();
        }
      });
    });

    // Insertar motivos de extracción
    motivosExtraccion.forEach(motivo => {
      db.get("SELECT id FROM motivos_extraccion WHERE nombre = ?", [motivo.nombre], (err, row) => {
        if (err) {
          console.error('Error verificando motivo extracción:', err);
          checkCompletion();
          return;
        }
        
        if (!row) {
          db.run(
            "INSERT INTO motivos_extraccion (nombre, descripcion) VALUES (?, ?)",
            [motivo.nombre, motivo.descripcion],
            function(err) {
              if (err) {
                console.error('Error insertando motivo extracción:', err);
              } else {
                console.log(`✅ Motivo extracción insertado: ${motivo.nombre}`);
              }
              checkCompletion();
            }
          );
        } else {
          checkCompletion();
        }
      });
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
