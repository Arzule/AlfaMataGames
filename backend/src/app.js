// Aplicación Express: middlewares globales, rutas y manejo de errores.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const pool = require('./config/db');
const { corsOrigins } = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const libraryRoutes = require('./routes/library.routes');
const gamesRoutes = require('./routes/games.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { requestLogger } = require('./middleware/requestLogger.middleware');

const app = express();

// Detrás del proxy de Azure Container Apps: la IP real llega en X-Forwarded-For (un salto).
// Lo necesita el límite de peticiones para no tratar a todos como el mismo cliente.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
app.disable('x-powered-by');

// Primero el registro de peticiones, para medir también las que fallen después.
app.use(requestLogger);
// Cabeceras de seguridad. Es una API JSON: sin CSP de páginas ni política de recursos cruzados
// que bloquee las imágenes en la versión web.
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

const allowedOrigins = corsOrigins();
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    exposedHeaders: ['X-Request-Id'],
  })
);
// Límite ampliado para la foto de perfil (200 KB en base64 ocupan ~270 KB).
app.use(express.json({ limit: '400kb' }));

// Estado del servicio: comprueba también la base de datos (503 si no responde).
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'unavailable' });
  }
});

app.use('/auth', authRoutes);
app.use('/library', libraryRoutes);
app.use('/games', gamesRoutes);

// 404 y manejador de errores (siempre JSON).
app.use(notFound);
app.use(errorHandler);

module.exports = app;
