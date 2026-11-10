// Catálogo de juegos: el backend consulta IGDB con sus credenciales y la app nunca las conoce.
const { listGames, getRandomGame, getGame } = require('../services/igdb.service');

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 40;
const SEARCH_MAX_LENGTH = 100;
const MAX_GAME_ID = 2147483647;
// IGDB no permite desplazamientos muy grandes; 250 páginas bastan para el catálogo.
const PAGE_MAX = 250;

function positiveInt(raw, max = Number.MAX_SAFE_INTEGER) {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 && value <= max ? value : null;
}

// Los errores del catálogo llevan status y code; los demás siguen al manejador global.
function handleServiceError(err, res, next) {
  if (err.status && err.code) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }
  return next(err);
}

// GET /games?search=&page=1&pageSize=20 -> { results, hasMore }
async function list(req, res, next) {
  const page = req.query.page === undefined ? 1 : positiveInt(req.query.page, PAGE_MAX);
  const pageSize =
    req.query.pageSize === undefined ? PAGE_SIZE_DEFAULT : positiveInt(req.query.pageSize, PAGE_SIZE_MAX);
  if (!page || !pageSize) {
    return res.status(400).json({ message: 'Parámetros de paginación inválidos.' });
  }
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  if (search.length > SEARCH_MAX_LENGTH) {
    return res.status(400).json({ message: 'La búsqueda es demasiado larga.' });
  }

  try {
    return res.json(await listGames({ search, page, pageSize }));
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

// GET /games/random -> un juego entre los más votados (con id y name).
async function random(req, res, next) {
  try {
    return res.json(await getRandomGame());
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

// GET /games/:gameId -> detalle normalizado.
async function detail(req, res, next) {
  const gameId = positiveInt(req.params.gameId, MAX_GAME_ID);
  if (!gameId) {
    return res.status(400).json({ message: 'gameId inválido' });
  }
  try {
    return res.json(await getGame(gameId));
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

module.exports = { list, random, detail };
