// Rutas de información compartida de los juegos; requieren token.
const express = require('express');
const { listForGame } = require('../controllers/reviews.controller');
const { authRequired } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authRequired);

router.get('/:gameId/reviews', listForGame);

module.exports = router;
