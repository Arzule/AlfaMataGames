// Middleware que exige un token JWT válido en la cabecera Authorization.
// Además comprueba que el usuario siga existiendo: el token de una cuenta eliminada
// deja de servir al instante (no al expirar).
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res
      .status(401)
      .json({ message: 'No autenticado', code: 'TOKEN_INVALID' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ message: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res
      .status(401)
      .json({ message: 'Token inválido', code: 'TOKEN_INVALID' });
  }

  try {
    const [rows] = await pool.query('SELECT 1 FROM users WHERE id = ?', [payload.id]);
    if (!rows.length) {
      return res
        .status(401)
        .json({ message: 'Usuario no encontrado', code: 'TOKEN_INVALID' });
    }
  } catch (err) {
    return next(err);
  }

  req.userId = payload.id;
  return next();
}

// Si llega un token lo exige válido (y fija req.userId); sin cabecera deja pasar.
function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return authRequired(req, res, next);
}

module.exports = { authRequired, optionalAuth };
