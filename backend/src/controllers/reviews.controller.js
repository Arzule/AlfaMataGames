// Reseñas de la comunidad: lo que otros usuarios escribieron sobre un juego.
const pool = require('../config/db');

const PAGE_SIZE_DEFAULT = 10;
const PAGE_SIZE_MAX = 30;

// Entero positivo o null.
function positiveInt(raw) {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

// GET /games/:gameId/reviews?page=1&pageSize=10
// Reseñas de los demás usuarios (excluye la del usuario del token), la más reciente primero.
async function listForGame(req, res, next) {
  try {
    const gameId = positiveInt(req.params.gameId);
    if (!gameId) {
      return res.status(400).json({ message: 'gameId inválido' });
    }
    const page = req.query.page === undefined ? 1 : positiveInt(req.query.page);
    const pageSize =
      req.query.pageSize === undefined ? PAGE_SIZE_DEFAULT : positiveInt(req.query.pageSize);
    if (!page || !pageSize || pageSize > PAGE_SIZE_MAX) {
      return res.status(400).json({ message: 'Parámetros de paginación inválidos.' });
    }

    // Se pide un elemento extra para saber si hay más páginas.
    const [rows] = await pool.query(
      `SELECT ug.id, ug.review, ug.user_score, ug.status, ug.review_updated_at,
              u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar
         FROM user_games ug
         JOIN users u ON u.id = ug.user_id
        WHERE ug.game_id = ?
          AND ug.user_id <> ?
          AND ug.review IS NOT NULL
          AND TRIM(ug.review) <> ''
        ORDER BY ug.review_updated_at DESC, ug.id DESC
        LIMIT ? OFFSET ?`,
      [gameId, req.userId, pageSize + 1, (page - 1) * pageSize]
    );

    const hasMore = rows.length > pageSize;
    const items = rows.slice(0, pageSize).map((row) => ({
      id: row.id,
      review: row.review,
      userScore: row.user_score,
      status: row.status,
      date: row.review_updated_at,
      user: { id: row.user_id, name: row.user_name, avatar: row.user_avatar ?? null },
    }));

    return res.json({ items, page, hasMore });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listForGame };
