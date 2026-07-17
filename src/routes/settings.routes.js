const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settings.controller');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

router.get('/', SettingsController.get);
router.put('/', SettingsController.update);

module.exports = router;
