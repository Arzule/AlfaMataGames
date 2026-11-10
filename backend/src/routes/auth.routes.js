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
const { authRequired } = require('../middleware/auth.middleware');

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
router.put('/me/avatar', authRequired, updateAvatar);
router.delete('/me/avatar', authRequired, deleteAvatar);

module.exports = router;
