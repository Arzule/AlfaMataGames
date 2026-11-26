// Rutas de Steam: conexión de la cuenta e importación de la biblioteca.
const express = require('express');
const steam = require('../controllers/steam.controller');
const { authRequired } = require('../middleware/auth.middleware');

const router = express.Router();

// Steam vuelve aquí desde el navegador: sin token (el usuario va en el state firmado).
router.get('/callback', steam.callback);

router.get('/', authRequired, steam.status);
router.delete('/', authRequired, steam.unlink);
router.post('/link/start', authRequired, steam.start);
router.post('/link/confirm', authRequired, steam.confirm);
router.post('/sync', authRequired, steam.syncStart);
router.post('/sync/next', authRequired, steam.syncNext);

module.exports = router;
