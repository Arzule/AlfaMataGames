// Logger del backend: una línea por evento con fecha, nivel, ámbito, mensaje y campos.
//   2026-10-20T05:12:01.123Z INFO  [http] GET /library 200 12ms id=1a2b3c4d user=3
// Nivel mínimo con LOG_LEVEL (debug | info | warn | error; por defecto info).
// Los campos con nombres sensibles (contraseñas, tokens, avatar...) nunca se escriben.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL = LEVELS[(process.env.LOG_LEVEL || '').toLowerCase()] ?? LEVELS.info;

const SENSITIVE_KEY = /pass|token|authorization|secret|cookie|avatar|api_?key/i;

function formatValue(value) {
  if (value instanceof Error) return JSON.stringify(value.message);
  if (typeof value === 'string') return /[\s"=]/.test(value) ? JSON.stringify(value) : value;
  if (value !== null && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatFields(fields) {
  if (!fields) return '';
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${SENSITIVE_KEY.test(key) ? '***' : formatValue(value)}`)
    .map((pair) => ` ${pair}`)
    .join('');
}

function write(level, scope, message, fields) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const { stack, ...rest } = fields || {};
  const line =
    `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} [${scope}] ${message}` +
    formatFields(rest);
  const print = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  print(line);
  // La traza va en líneas aparte (solo errores del servidor).
  if (stack) print(stack);
}

function createLogger(scope) {
  return {
    debug: (message, fields) => write('debug', scope, message, fields),
    info: (message, fields) => write('info', scope, message, fields),
    warn: (message, fields) => write('warn', scope, message, fields),
    error: (message, fields) => write('error', scope, message, fields),
  };
}

module.exports = { createLogger };
