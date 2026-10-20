// src/utils/logger.js
// Logger central de la app. Nunca usar console.* directamente en el resto del código.
// - Desarrollo: todos los niveles, con detalles.
// - Producción: solo warn y error, con el mensaje y el error resumido (sin detalles).
// - Siempre: oculta datos sensibles (contraseñas, tokens, claves, fotos en base64).
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL = __DEV__ ? LEVELS.debug : LEVELS.warn;
const MAX_DEPTH = 3;
const MAX_STRING = 300;

// Claves cuyo valor nunca se registra.
const SENSITIVE_KEY = /pass|token|authorization|secret|api_?key|^key$|avatar|base64/i;

// Oculta secretos que pueden ir dentro de un texto (URLs con ?key=, cabeceras Bearer...).
function scrubString(text) {
  const scrubbed = text
    .replace(/([?&](?:key|token|api_key)=)[^&\s]+/gi, '$1***')
    .replace(/Bearer\s+[\w.-]+/gi, 'Bearer ***')
    .replace(/data:[\w/+.-]+;base64,[A-Za-z0-9+/=]+/g, '[data URI]');
  return scrubbed.length > MAX_STRING ? `${scrubbed.slice(0, MAX_STRING)}…` : scrubbed;
}

function describeError(error) {
  const summary = { name: error.name, message: scrubString(String(error.message ?? '')) };
  if (error.status !== undefined) summary.status = error.status;
  if (error.code !== undefined) summary.code = error.code;
  if (__DEV__ && error.stack) summary.stack = scrubString(error.stack);
  return summary;
}

// Copia segura de cualquier valor para registrarlo.
export function sanitize(value, depth = 0) {
  if (value instanceof Error) return describeError(value);
  if (typeof value === 'string') return scrubString(value);
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[…]';
  if (Array.isArray(value)) return value.slice(0, 10).map((item) => sanitize(item, depth + 1));

  const result = {};
  Object.keys(value).forEach((key) => {
    result[key] = SENSITIVE_KEY.test(key) ? '***' : sanitize(value[key], depth + 1);
  });
  return result;
}

function write(level, scope, message, details) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const prefix = `[${scope}] ${message}`;
  const print = level === 'debug' ? console.log : console[level];

  if (details === undefined) {
    print(prefix);
  } else if (__DEV__) {
    print(prefix, sanitize(details));
  } else {
    // En producción solo se agrega el resumen de un error, nunca el contexto.
    print(prefix, details instanceof Error ? describeError(details).message : '');
  }
}

// Logger con un ámbito fijo: const log = createLogger('api'); log.warn('mensaje', err)
export function createLogger(scope) {
  return {
    debug: (message, details) => write('debug', scope, message, details),
    info: (message, details) => write('info', scope, message, details),
    warn: (message, details) => write('warn', scope, message, details),
    error: (message, details) => write('error', scope, message, details),
  };
}

export default createLogger('app');
