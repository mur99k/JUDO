const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendance.controller');
const { requireAdminOrCoach, requireAuth } = require('../middleware/auth');

router.use(requireAdminOrCoach);

router.get('/', AttendanceController.getByDate);
router.get('/today', AttendanceController.getToday);
router.get('/monthly', AttendanceController.getMonthlyGrid);
router.get('/summary', AttendanceController.getSummary);
router.get('/student/:studentId/report', AttendanceController.getStudentReport);
router.get('/student/:studentId/stats', AttendanceController.getStudentAllTimeStats);
router.post('/', AttendanceController.save);

module.exports = router;
