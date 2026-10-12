// Middleware que exige un token JWT válido en la cabecera Authorization.
const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res
      .status(401)
      .json({ message: 'No autenticado', code: 'TOKEN_INVALID' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    return next();
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
}

module.exports = { authRequired };
