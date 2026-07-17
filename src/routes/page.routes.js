const express = require('express');
const router = express.Router();
const PageController = require('../controllers/page.controller');

router.get('/', PageController.home);
router.get('/about', PageController.about);
router.get('/contact', PageController.contact);
router.get('/login', PageController.login);
router.get('/register', PageController.register);
router.get('/dashboard', PageController.dashboard);
router.get('/dashboard/students', PageController.dashboardStudents);
router.get('/dashboard/attendance', PageController.dashboardAttendance);
router.get('/dashboard/attendance/student/:id', PageController.dashboardStudentReport);
router.get('/dashboard/subscriptions', PageController.dashboardSubscriptions);
router.get('/dashboard/reports', PageController.dashboardReports);
router.get('/dashboard/coaches', PageController.dashboardCoaches);
router.get('/dashboard/gallery', PageController.dashboardGallery);
router.get('/dashboard/settings', PageController.dashboardSettings);
router.get('/dashboard/profile', PageController.dashboardProfile);
router.get('/student', PageController.student);
router.get('/coach', PageController.coach);

module.exports = router;
