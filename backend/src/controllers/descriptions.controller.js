// Sinopsis de un juego en español: descripción de RAWG traducida con DeepL y guardada en
// game_translations. La segunda consulta de un juego sale de la caché (sin RAWG ni DeepL).
// Si no se puede traducir se devuelve el texto original con un aviso (notice) y no se
// guarda nada, para traducir en cuanto DeepL esté disponible.
const crypto = require('crypto');
const pool = require('../config/db');
const { getGameDescription } = require('../services/rawg.service');
const { translate } = require('../services/deepl.service');
const { createLogger } = require('../utils/logger');

const log = createLogger('sinopsis');

const TARGET_LANG = 'ES';
const LANG_KEY = 'es';
const MAX_GAME_ID = 2147483647; // INT de MySQL
// Límite de caracteres a traducir: protege la cuota mensual de DeepL Free (500 000).
const MAX_SOURCE_CHARS = 6000;

// Peticiones en curso por juego: dos consultas simultáneas comparten una sola traducción.
const inFlight = new Map();

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

function positiveGameId(raw) {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 && value <= MAX_GAME_ID ? value : null;
}

// Corta en el último fin de oración antes del límite.
function limitLength(text) {
  if (text.length <= MAX_SOURCE_CHARS) return text;
  const slice = text.slice(0, MAX_SOURCE_CHARS);
  const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.\n'));
  return lastStop > MAX_SOURCE_CHARS / 2 ? slice.slice(0, lastStop + 1) : `${slice}…`;
}

// Respuesta común. notice: null | 'empty' | 'same-language' | 'not-configured' | 'quota' | 'unavailable'
function result(gameId, { text, original, translated, source, notice = null }) {
  return { gameId, lang: LANG_KEY, text, original, translated, source, notice };
}

async function readCache(gameId) {
  const [rows] = await pool.query(
    `SELECT original_text, translated_text, source_lang
       FROM game_translations
      WHERE game_id = ? AND lang = ?`,
    [gameId, LANG_KEY]
  );
  return rows[0] ?? null;
}

async function writeCache(gameId, original, translated, sourceLang) {
  await pool.query(
    `INSERT INTO game_translations
       (game_id, lang, source_hash, source_lang, original_text, translated_text)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       source_hash = VALUES(source_hash),
       source_lang = VALUES(source_lang),
       original_text = VALUES(original_text),
       translated_text = VALUES(translated_text)`,
    [gameId, LANG_KEY, sha256(original), sourceLang, original, translated]
  );
}

// Cuando el texto original ya está en español, DeepL lo devuelve igual: no es una traducción.
const isSameLanguage = (sourceLang) => (sourceLang ?? '').toUpperCase().startsWith(TARGET_LANG);

async function buildDescription(gameId) {
  const cached = await readCache(gameId);
  if (cached) {
    const sameLanguage = isSameLanguage(cached.source_lang);
    return result(gameId, {
      text: cached.translated_text,
      original: cached.original_text,
      translated: !sameLanguage,
      source: 'cache',
      notice: sameLanguage ? 'same-language' : null,
    });
  }

  const game = await getGameDescription(gameId);
  if (!game.description) {
    return result(gameId, {
      text: '',
      original: '',
      translated: false,
      source: null,
      notice: 'empty',
    });
  }

  const original = limitLength(game.description);
  try {
    const { text, detectedSourceLang } = await translate(original, TARGET_LANG);
    await writeCache(gameId, original, text, detectedSourceLang);
    const sameLanguage = isSameLanguage(detectedSourceLang);
    log.info('Sinopsis traducida y guardada', {
      gameId,
      chars: original.length,
      from: detectedSourceLang,
    });
    return result(gameId, {
      text: sameLanguage ? original : text,
      original,
      translated: !sameLanguage,
      source: 'deepl',
      notice: sameLanguage ? 'same-language' : null,
    });
  } catch (err) {
    if (!err.reason) throw err; // Error de la BD u otro inesperado: 500.
    return result(gameId, {
      text: original,
      original,
      translated: false,
      source: null,
      notice: err.reason,
    });
  }
}

// GET /games/:gameId/description
async function getDescription(req, res, next) {
  const gameId = positiveGameId(req.params.gameId);
  if (!gameId) {
    return res.status(400).json({ message: 'gameId inválido' });
  }

  try {
    if (!inFlight.has(gameId)) {
      inFlight.set(
        gameId,
        buildDescription(gameId).finally(() => inFlight.delete(gameId))
      );
    }
    return res.json(await inFlight.get(gameId));
  } catch (err) {
    // Errores de RAWG con status propio (404, 502, 503): mensaje claro para la app.
    if (err.status && err.status < 500) {
      return res.status(err.status).json({ message: err.message, code: err.code });
    }
    if (err.code === 'RAWG_UNAVAILABLE' || err.code === 'RAWG_NOT_CONFIGURED') {
      return res.status(err.status).json({ message: err.message, code: err.code });
    }
    return next(err);
  }
}

module.exports = { getDescription };
