// Cliente de DeepL API (Free o Pro) para traducir textos.
// Las claves Free terminan en ":fx" y usan api-free.deepl.com; DEEPL_API_URL lo fuerza.
const { createLogger } = require('../utils/logger');

const log = createLogger('deepl');

const TIMEOUT_MS = 10000;

const isConfigured = () => Boolean(process.env.DEEPL_API_KEY);

function baseUrl() {
  if (process.env.DEEPL_API_URL) return process.env.DEEPL_API_URL.replace(/\/+$/, '');
  return process.env.DEEPL_API_KEY.endsWith(':fx')
    ? 'https://api-free.deepl.com'
    : 'https://api.deepl.com';
}

// Error con un motivo que el controlador traduce en aviso para la app.
function translationError(reason, message) {
  const error = new Error(message);
  error.reason = reason;
  return error;
}

// Traduce un texto. Devuelve { text, detectedSourceLang }.
// Lanza un error con reason: 'not-configured' | 'quota' | 'unavailable'.
async function translate(text, targetLang) {
  if (!isConfigured()) {
    throw translationError('not-configured', 'DeepL no está configurado.');
  }

  let response;
  try {
    response = await fetch(`${baseUrl()}/v2/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: [text], target_lang: targetLang }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    log.warn('POST /v2/translate -> sin respuesta', { error: err.name });
    throw translationError('unavailable', 'No se pudo contactar con DeepL.');
  }

  if (!response.ok) {
    // X-Trace-ID permite consultar el problema con DeepL; nunca se registra la clave.
    const fields = { traceId: response.headers.get('x-trace-id') };
    if (response.status === 456) {
      log.warn('Cuota de DeepL agotada', fields);
      throw translationError('quota', 'Se agotó la cuota de traducción.');
    }
    if (response.status === 403) {
      log.error('DeepL rechazó la clave (403): revisa DEEPL_API_KEY', fields);
    } else {
      log.warn(`POST /v2/translate -> ${response.status}`, fields);
    }
    throw translationError('unavailable', 'DeepL respondió con un error.');
  }

  const data = await response.json();
  const translation = data?.translations?.[0];
  if (!translation || typeof translation.text !== 'string') {
    throw translationError('unavailable', 'Respuesta inesperada de DeepL.');
  }
  return {
    text: translation.text,
    detectedSourceLang: translation.detected_source_language ?? null,
  };
}

module.exports = { translate, isDeeplConfigured: isConfigured };
