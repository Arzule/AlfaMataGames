// Punto de arranque del servidor: aplica migraciones pendientes y luego escucha.
const { validateEnv } = require('./config/env');
const { createLogger } = require('./utils/logger');

const log = createLogger('server');

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  // Antes de tocar la BD: sin variables obligatorias no se arranca.
  const missing = validateEnv();
  if (missing.length) {
    log.error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
    process.exit(1);
  }

  const app = require('./app');
  const { runMigrations } = require('./migrate');

  try {
    await runMigrations();
  } catch (err) {
    // Sin esquema al día no se arranca: mejor fallar con un mensaje claro.
    log.error('No se pudieron aplicar las migraciones', { error: err.message });
    process.exit(1);
  }

  app.listen(PORT, () => {
    log.info(`AlfaMataGames API escuchando en el puerto ${PORT}`);
  });
}

start();
