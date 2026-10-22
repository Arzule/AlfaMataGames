// Aplicación Express: middlewares globales, rutas y manejo de errores.
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const libraryRoutes = require('./routes/library.routes');
const gamesRoutes = require('./routes/games.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { requestLogger } = require('./middleware/requestLogger.middleware');

const app = express();

// Primero el registro de peticiones, para medir también las que fallen después.
app.use(requestLogger);
app.use(cors({ exposedHeaders: ['X-Request-Id'] }));
// Límite ampliado para la foto de perfil (200 KB en base64 ocupan ~270 KB).
app.use(express.json({ limit: '400kb' }));

// Comprobación de estado del servicio.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/library', libraryRoutes);
app.use('/games', gamesRoutes);

// 404 y manejador de errores (siempre JSON).
app.use(notFound);
app.use(errorHandler);

module.exports = app;
