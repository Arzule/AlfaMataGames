// Catálogo de juegos: el backend consulta RAWG con su clave y la app nunca la conoce.
const { listGames, getGame } = require('../services/rawg.service');

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 40;
const SEARCH_MAX_LENGTH = 100;
const MAX_GAME_ID = 2147483647;
// Juego al azar: página aleatoria de los más agregados y un elemento al azar.
const RANDOM_MAX_PAGE = 100;
const RANDOM_PAGE_SIZE = 40;

function positiveInt(raw, max = Number.MAX_SAFE_INTEGER) {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 && value <= max ? value : null;
}

// Los errores de RAWG llevan status y code; los demás siguen al manejador global.
function handleServiceError(err, res, next) {
  if (err.status && err.code) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }
  return next(err);
}

// GET /games?search=&page=1&pageSize=20 -> { results, hasMore }
async function list(req, res, next) {
  const page = req.query.page === undefined ? 1 : positiveInt(req.query.page);
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

// GET /games/random -> un juego de la lista (con id y name).
async function random(req, res, next) {
  const page = 1 + Math.floor(Math.random() * RANDOM_MAX_PAGE);
  try {
    const { results } = await listGames({ page, pageSize: RANDOM_PAGE_SIZE, ordering: '-added' });
    const games = results.filter((game) => game?.id);
    if (!games.length) {
      return res.status(502).json({ message: 'RAWG no devolvió juegos.', code: 'RAWG_UNAVAILABLE' });
    }
    return res.json(games[Math.floor(Math.random() * games.length)]);
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

// GET /games/:gameId -> detalle completo de RAWG.
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
