// Aplicación Express: middlewares globales, rutas y manejo de errores.
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const libraryRoutes = require('./routes/library.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors());
// Límite ampliado para la foto de perfil (200 KB en base64 ocupan ~270 KB).
app.use(express.json({ limit: '400kb' }));

// Comprobación de estado del servicio.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/library', libraryRoutes);

// 404 y manejador de errores (siempre JSON).
app.use(notFound);
app.use(errorHandler);

module.exports = app;
