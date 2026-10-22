// Controladores de la biblioteca del usuario autenticado.
// Todas las operaciones usan el user_id tomado del token.
const pool = require('../config/db');
const { STATUSES, REVIEW_MAX_LENGTH } = require('../utils/validators');

// Convierte una fila de user_games al formato camelCase de la API.
function mapEntry(row) {
  return {
    gameId: row.game_id,
    name: row.game_name,
    image: row.game_image,
    rating: row.game_rating === null ? null : Number(row.game_rating),
    isFavorite: Boolean(row.is_favorite),
    status: row.status,
    userScore: row.user_score,
    review: row.review,
  };
}

// Valida que el gameId de la ruta sea un entero positivo.
function parseGameId(raw) {
  const gameId = Number(raw);
  return Number.isInteger(gameId) && gameId > 0 ? gameId : null;
}

// GET /library (?favorite=true)
async function list(req, res, next) {
  try {
    let sql = 'SELECT * FROM user_games WHERE user_id = ?';
    if (req.query.favorite === 'true') {
      sql += ' AND is_favorite = 1';
    }
    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(sql, [req.userId]);
    return res.json({ items: rows.map(mapEntry) });
  } catch (err) {
    return next(err);
  }
}

// GET /library/:gameId
async function getOne(req, res, next) {
  try {
    const gameId = parseGameId(req.params.gameId);
    if (!gameId) {
      return res.status(400).json({ message: 'gameId inválido' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM user_games WHERE user_id = ? AND game_id = ?',
      [req.userId, gameId]
    );
    return res.json({ entry: rows.length ? mapEntry(rows[0]) : null });
  } catch (err) {
    return next(err);
  }
}

// PUT /library/:gameId → upsert parcial.
async function upsert(req, res, next) {
  try {
    const gameId = parseGameId(req.params.gameId);
    if (!gameId) {
      return res.status(400).json({ message: 'gameId inválido' });
    }

    const body = req.body || {};
    const errors = [];
    const fields = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        errors.push('El nombre no es válido.');
      } else {
        fields.game_name = body.name.trim();
      }
    }
    if (body.image !== undefined) {
      fields.game_image = body.image === null ? null : String(body.image);
    }
    if (body.rating !== undefined) {
      if (body.rating === null) {
        fields.game_rating = null;
      } else if (
        typeof body.rating === 'number' &&
        body.rating >= 0 &&
        body.rating <= 10
      ) {
        fields.game_rating = body.rating;
      } else {
        errors.push('El rating no es válido.');
      }
    }
    if (body.isFavorite !== undefined) {
      if (typeof body.isFavorite !== 'boolean') {
        errors.push('isFavorite debe ser booleano.');
      } else {
        fields.is_favorite = body.isFavorite ? 1 : 0;
      }
    }
    if (body.status !== undefined) {
      if (body.status === null || STATUSES.includes(body.status)) {
        fields.status = body.status;
      } else {
        errors.push('status inválido.');
      }
    }
    if (body.userScore !== undefined) {
      if (body.userScore === null) {
        fields.user_score = null;
      } else if (
        Number.isInteger(body.userScore) &&
        body.userScore >= 0 &&
        body.userScore <= 5
      ) {
        fields.user_score = body.userScore;
      } else {
        errors.push('userScore debe ser un entero entre 0 y 5.');
      }
    }
    if (body.review !== undefined) {
      if (body.review === null) {
        fields.review = null;
      } else if (
        typeof body.review === 'string' &&
        body.review.length <= REVIEW_MAX_LENGTH
      ) {
        fields.review = body.review;
      } else {
        errors.push(
          `La reseña debe ser texto de máximo ${REVIEW_MAX_LENGTH} caracteres.`
        );
      }
    }

    if (errors.length) {
      return res.status(400).json({ message: errors[0] });
    }

    // Valores actuales (si la fila ya existe) para no perder campos no enviados.
    const [existingRows] = await pool.query(
      'SELECT * FROM user_games WHERE user_id = ? AND game_id = ?',
      [req.userId, gameId]
    );
    const existing = existingRows[0] || null;

    const pick = (col) =>
      fields[col] !== undefined ? fields[col] : existing ? existing[col] : undefined;

    const gameName = pick('game_name');
    if (gameName === undefined || gameName === null) {
      return res
        .status(400)
        .json({ message: 'name es obligatorio para crear la entrada.' });
    }

    const values = [
      req.userId,
      gameId,
      gameName,
      pick('game_image') ?? null,
      pick('game_rating') ?? null,
      pick('is_favorite') ?? 0,
      pick('status') ?? null,
      pick('user_score') ?? null,
      pick('review') ?? null,
    ];

    // La fecha de la reseña solo cambia cuando cambia su texto (no con el favorito, etc.).
    const newReview = pick('review') ?? null;
    const reviewChanged = newReview !== (existing ? existing.review : null);
    values.push(reviewChanged ? 1 : 0, newReview, reviewChanged ? 1 : 0);

    // Upsert en una sola sentencia; los campos no enviados conservan su valor.
    await pool.query(
      `INSERT INTO user_games
         (user_id, game_id, game_name, game_image, game_rating, is_favorite, status, user_score,
          review, review_updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, IF(? AND ? IS NOT NULL, CURRENT_TIMESTAMP, NULL))
       ON DUPLICATE KEY UPDATE
         game_name = VALUES(game_name),
         game_image = VALUES(game_image),
         game_rating = VALUES(game_rating),
         is_favorite = VALUES(is_favorite),
         status = VALUES(status),
         user_score = VALUES(user_score),
         review = VALUES(review),
         review_updated_at = IF(?, IF(VALUES(review) IS NULL, NULL, CURRENT_TIMESTAMP),
                                review_updated_at)`,
      values
    );

    const [rows] = await pool.query(
      'SELECT * FROM user_games WHERE user_id = ? AND game_id = ?',
      [req.userId, gameId]
    );
    return res.json({ entry: mapEntry(rows[0]) });
  } catch (err) {
    return next(err);
  }
}

// DELETE /library/:gameId
async function remove(req, res, next) {
  try {
    const gameId = parseGameId(req.params.gameId);
    if (!gameId) {
      return res.status(400).json({ message: 'gameId inválido' });
    }

    await pool.query('DELETE FROM user_games WHERE user_id = ? AND game_id = ?', [
      req.userId,
      gameId,
    ]);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, upsert, remove };
