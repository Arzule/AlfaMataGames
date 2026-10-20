// Rutas de información compartida de los juegos; requieren token.
const express = require('express');
const { listForGame } = require('../controllers/reviews.controller');
const { getDescription } = require('../controllers/descriptions.controller');
const { authRequired } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authRequired);

router.get('/:gameId/reviews', listForGame);
// Sinopsis en español (RAWG + DeepL, con caché en game_translations).
router.get('/:gameId/description', getDescription);

module.exports = router;
