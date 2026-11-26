// Rutas de push remotas (/push).
const express = require('express');
const push = require('../controllers/push.controller');
const { authRequired } = require('../middleware/auth.middleware');

const router = express.Router();

router.put('/token', authRequired, push.registerToken);
router.delete('/token', push.unregisterToken);
router.get('/reminders', authRequired, push.listReminders);
router.put('/reminders/daily', authRequired, push.saveDailyReminder);
router.delete('/reminders/daily', authRequired, push.deleteDailyReminder);
router.put('/reminders/game/:gameId', authRequired, push.saveGameReminder);
router.delete('/reminders/game/:gameId', authRequired, push.deleteGameReminder);

module.exports = router;
