// Pool de conexiones a MySQL usando mysql2/promise.
// La conexión se configura con una URL única (DATABASE_URL o MYSQL_URL, como la
// entrega Railway) o, si no existe, con variables sueltas (DB_HOST, DB_PORT, MYSQL_*).
const mysql = require('mysql2/promise');

// SSL opcional: DB_SSL=true lo activa; DB_SSL_REJECT_UNAUTHORIZED=false acepta
// certificados autofirmados.
function sslOptions() {
  if (process.env.DB_SSL !== 'true') return undefined;
  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

// Opciones de conexión comunes al pool y al runner de migraciones.
function getConnectionOptions(extra = {}) {
  const uri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const base = uri
    ? { uri }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
      };

  return { ...base, charset: 'utf8mb4', ssl: sslOptions(), ...extra };
}

const pool = mysql.createPool(
  getConnectionOptions({
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
);

module.exports = pool;
module.exports.getConnectionOptions = getConnectionOptions;
