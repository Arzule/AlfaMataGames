// Rutas de la biblioteca; todas requieren token.
const express = require('express');
const {
  list,
  getOne,
  upsert,
  remove,
} = require('../controllers/library.controller');
const { authRequired } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authRequired);

router.get('/', list);
router.get('/:gameId', getOne);
router.put('/:gameId', upsert);
router.delete('/:gameId', remove);

module.exports = router;
