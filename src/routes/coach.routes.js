const express = require('express');
const router = express.Router();
const CoachController = require('../controllers/coach.controller');
const { requireAdmin } = require('../middleware/auth');
const { createUploader } = require('../middleware/upload');

const upload = createUploader('coaches');

router.use(requireAdmin);

router.get('/', CoachController.list);
router.get('/:id', CoachController.getById);
router.post('/', upload.single('photo'), CoachController.create);
router.put('/:id', upload.single('photo'), CoachController.update);
router.delete('/:id', CoachController.delete);

module.exports = router;
