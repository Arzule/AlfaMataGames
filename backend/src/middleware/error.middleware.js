// Manejo centralizado de rutas no encontradas y errores.
const { createLogger } = require('../utils/logger');

const log = createLogger('error');

// 404 para cualquier ruta no definida.
function notFound(req, res) {
  res.status(404).json({ message: 'Recurso no encontrado' });
}

// Manejador de errores: siempre responde JSON con { message }.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Cuerpo demasiado grande o JSON mal formado (errores de express.json).
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'La solicitud es demasiado grande.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la solicitud no es JSON válido.' });
  }

  const status = err.status || 500;
  const fields = { id: req.id, method: req.method, path: req.originalUrl.split('?')[0] };
  if (status >= 500) {
    // Error inesperado: traza completa en el servidor y mensaje genérico al cliente
    // (el detalle puede incluir datos internos, como SQL).
    log.error(err.message || 'Error interno', { ...fields, stack: err.stack });
    return res.status(status).json({ message: 'Error interno del servidor' });
  }
  log.warn(err.message || `Error ${status}`, fields);
  return res.status(status).json({ message: err.message || 'Error en la solicitud' });
}

module.exports = { notFound, errorHandler };
