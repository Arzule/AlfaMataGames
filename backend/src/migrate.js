// Runner de migraciones SQL.
// Aplica en orden los archivos de backend/migrations (NNN-nombre.sql) que aún no
// figuran en la tabla schema_migrations. Se usa al arrancar el servidor y con
// `npm run migrate`.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const { getConnectionOptions } = require('./config/db');
const { createLogger } = require('./utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const FILE_PATTERN = /^\d{3}-[\w-]+\.sql$/;
const LOCK_NAME = 'alfamatagames_migrations';
const LOCK_TIMEOUT_S = 30;
const CONNECT_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

const logger = createLogger('migrate');
const log = (msg) => logger.info(msg);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Checksum independiente del fin de línea (CRLF en Windows, LF en Linux).
function checksum(sql) {
  return crypto.createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex');
}

// Conecta reintentando: la BD puede tardar en aceptar conexiones al desplegar.
async function connectWithRetry() {
  const options = getConnectionOptions({ multipleStatements: true });
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await mysql.createConnection(options);
    } catch (err) {
      if (attempt >= CONNECT_RETRIES) throw err;
      log(`BD no disponible (${err.code || err.message}); reintento ${attempt}/${CONNECT_RETRIES - 1}`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

// Lista los archivos de migración ordenados por nombre.
function readMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => FILE_PATTERN.test(file))
    .sort()
    .map((file) => {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      return { name: file, sql, checksum: checksum(sql) };
    });
}

async function runMigrations() {
  const conn = await connectWithRetry();
  try {
    // Evita que dos instancias migren a la vez.
    const [[{ locked }]] = await conn.query('SELECT GET_LOCK(?, ?) AS locked', [
      LOCK_NAME,
      LOCK_TIMEOUT_S,
    ]);
    if (locked !== 1) {
      throw new Error('No se pudo obtener el bloqueo de migraciones');
    }

    await conn.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name       VARCHAR(255) NOT NULL PRIMARY KEY,
         checksum   CHAR(64)     NOT NULL,
         applied_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
       ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci`
    );

    const [rows] = await conn.query('SELECT name, checksum FROM schema_migrations');
    const applied = new Map(rows.map((row) => [row.name, row.checksum]));

    let count = 0;
    for (const migration of readMigrationFiles()) {
      if (applied.has(migration.name)) {
        if (applied.get(migration.name) !== migration.checksum) {
          log(`AVISO: ${migration.name} cambió después de aplicarse; crea una migración nueva en su lugar`);
        }
        continue;
      }

      // MySQL no revierte DDL: si falla, se detiene sin registrarla.
      try {
        await conn.query(migration.sql);
      } catch (err) {
        throw new Error(`Falló la migración ${migration.name}: ${err.message}`);
      }
      await conn.query('INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)', [
        migration.name,
        migration.checksum,
      ]);
      log(`aplicada ${migration.name}`);
      count += 1;
    }

    log(count ? `${count} migración(es) aplicada(s)` : 'sin migraciones pendientes');
  } finally {
    await conn.query('SELECT RELEASE_LOCK(?)', [LOCK_NAME]).catch(() => {});
    await conn.end();
  }
}

// Uso directo: `npm run migrate`.
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error(err.message);
      process.exit(1);
    });
}

module.exports = { runMigrations };
