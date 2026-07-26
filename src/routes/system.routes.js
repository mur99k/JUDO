// TEMPORARY — one-time cleanup route.
const router = require('express').Router();
const SystemController = require('../controllers/system.controller');
const { requireAdmin } = require('../middleware/auth');

router.post('/cleanup', requireAdmin, SystemController.cleanup);

module.exports = router;
