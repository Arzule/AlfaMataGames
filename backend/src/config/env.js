// Validación de variables de entorno al arrancar: sin las obligatorias el backend no inicia
// y el mensaje dice cuáles faltan (nunca muestra valores).
const MIN_JWT_SECRET_LENGTH = 32;

function validateEnv(env = process.env) {
  const errors = [];

  const hasUrl = Boolean(env.DATABASE_URL || env.MYSQL_URL);
  if (!hasUrl) {
    for (const name of ['MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE']) {
      if (!env[name]) errors.push(`${name} (o DATABASE_URL)`);
    }
  }

  if (!env.JWT_SECRET) {
    errors.push('JWT_SECRET');
  } else if (env.NODE_ENV === 'production' && env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(`JWT_SECRET (mínimo ${MIN_JWT_SECRET_LENGTH} caracteres en producción)`);
  }

  // El catálogo es el núcleo de la app: en producción las credenciales son obligatorias.
  if (env.NODE_ENV === 'production') {
    for (const name of ['IGDB_CLIENT_ID', 'IGDB_CLIENT_SECRET']) {
      if (!env[name]) errors.push(name);
    }
  }

  return errors;
}

// Orígenes permitidos por CORS: CORS_ORIGINS separado por comas. Vacío = cualquiera
// (la app nativa no envía Origin; solo la versión web lo usa).
function corsOrigins(env = process.env) {
  return (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = { validateEnv, corsOrigins };
