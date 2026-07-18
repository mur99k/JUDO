const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/student.controller');
const { requireAdmin, requireAdminOrCoach } = require('../middleware/auth');
const { createUploader } = require('../middleware/upload');

const upload = createUploader('students');

router.get('/', requireAdminOrCoach, StudentController.list);
router.get('/:id', requireAdminOrCoach, StudentController.getById);
router.post('/', requireAdmin, StudentController.create);
router.put('/:id', requireAdminOrCoach, upload.single('photo'), StudentController.update);
router.delete('/:id', requireAdmin, StudentController.delete);

module.exports = router;
