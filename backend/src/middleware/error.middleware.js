// Manejo centralizado de rutas no encontradas y errores.

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
  // Se registra en el servidor (no se expone al cliente).
  console.error(err);
  res.status(status).json({ message: err.message || 'Error interno del servidor' });
}

module.exports = { notFound, errorHandler };
