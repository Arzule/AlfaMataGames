// Rutas de autenticación.
const express = require('express');
const { register, login, me } = require('../controllers/auth.controller');
const { authRequired } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authRequired, me);

module.exports = router;
