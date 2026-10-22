// Rutas de autenticación.
const express = require('express');
const {
  register,
  login,
  me,
  updateAvatar,
  deleteAvatar,
} = require('../controllers/auth.controller');
const { authRequired } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authRequired, me);
router.put('/me/avatar', authRequired, updateAvatar);
router.delete('/me/avatar', authRequired, deleteAvatar);

module.exports = router;
