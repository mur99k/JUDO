const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/report.controller');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

router.get('/dashboard', ReportController.dashboard);
router.get('/students', ReportController.students);
router.get('/subscriptions', ReportController.subscriptions);

module.exports = router;
