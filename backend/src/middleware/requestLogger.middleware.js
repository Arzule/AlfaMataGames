// Registra cada petición al terminar: método, ruta, status, duración, id y usuario.
// Nunca registra cuerpos, cabeceras (Authorization) ni la query string.
// Asigna un id corto a la petición (req.id) y lo devuelve en la cabecera X-Request-Id,
// para relacionar un error de la app con su línea en los logs.
const crypto = require('crypto');
const { createLogger } = require('../utils/logger');

const log = createLogger('http');

// Peticiones frecuentes y sin interés (health checks, preflight de CORS): solo en debug.
const isNoise = (req, path) => path === '/health' || req.method === 'OPTIONS';

function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();
  req.id = crypto.randomUUID().slice(0, 8);
  res.setHeader('X-Request-Id', req.id);

  let logged = false;
  const done = (aborted) => {
    if (logged) return;
    logged = true;

    const path = req.originalUrl.split('?')[0];
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const status = aborted ? 'abortada' : res.statusCode;
    const message = `${req.method} ${path} ${status} ${ms.toFixed(0)}ms`;
    const fields = {
      id: req.id,
      user: req.userId,
      bytes: res.getHeader('content-length'),
    };

    if (isNoise(req, path)) log.debug(message, fields);
    else if (res.statusCode >= 500 && !aborted) log.error(message, fields);
    else if (aborted || res.statusCode >= 400) log.warn(message, fields);
    else log.info(message, fields);
  };

  res.on('finish', () => done(false));
  // El cliente cortó la conexión antes de recibir la respuesta.
  res.on('close', () => done(!res.writableFinished));
  next();
}

module.exports = { requestLogger };
