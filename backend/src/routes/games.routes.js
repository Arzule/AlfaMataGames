// Rutas de información compartida de los juegos; requieren token.
const express = require('express');
const { listForGame } = require('../controllers/reviews.controller');
const { list, random, detail } = require('../controllers/catalog.controller');
const { getDescription } = require('../controllers/descriptions.controller');
const { authRequired } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authRequired);

// Catálogo de RAWG a través del backend (la clave queda en el servidor).
router.get('/', list);
router.get('/random', random);
router.get('/:gameId', detail);
router.get('/:gameId/reviews', listForGame);
// Sinopsis en español (RAWG + DeepL, con caché en game_translations).
router.get('/:gameId/description', getDescription);

module.exports = router;
