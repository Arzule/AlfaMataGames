// Rutas de autenticación.
const express = require('express');
const {
  register,
  login,
  me,
  updateProfile,
  changePassword,
  deleteAccount,
  updateAvatar,
  deleteAvatar,
} = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');
const { authRequired, optionalAuth } = require('../middleware/auth.middleware');
const oauth = require('../controllers/oauth.controller');

const router = express.Router();

// Límite contra fuerza bruta en login, registro y acciones que piden la contraseña: 20 intentos por IP cada 15 minutos.
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.', code: 'RATE_LIMITED' },
});

router.post('/register', credentialsLimiter, register);
router.post('/login', credentialsLimiter, login);
router.get('/me', authRequired, me);
router.put('/me', authRequired, updateProfile);
// Piden la contraseña actual: mismo límite contra fuerza bruta que el login.
router.put('/me/password', authRequired, credentialsLimiter, changePassword);
router.delete('/me', authRequired, credentialsLimiter, deleteAccount);
// Login social (Google y Discord): ver controllers/oauth.controller.js.
router.get('/oauth/providers', oauth.providers);
router.post('/oauth/exchange', credentialsLimiter, oauth.exchange);
router.post('/oauth/:provider/start', optionalAuth, oauth.start);
router.get('/oauth/:provider/callback', oauth.callback);
router.get('/me/identities', authRequired, oauth.identities);
router.delete('/me/identities/:provider', authRequired, oauth.unlink);
router.put('/me/avatar', authRequired, updateAvatar);
router.delete('/me/avatar', authRequired, deleteAvatar);

module.exports = router;
