// Punto de arranque del servidor: aplica migraciones pendientes y luego escucha.
const app = require('./app');
const { runMigrations } = require('./migrate');
const { createLogger } = require('./utils/logger');

const log = createLogger('server');

const PORT = Number(process.env.PORT) || 3000;

async function start() {
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
