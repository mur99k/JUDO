const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { createUploader } = require('../middleware/upload');

const upload = createUploader('');

router.post('/login', AuthController.login);
router.post('/register', upload.single('photo'), AuthController.register);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.me);
router.post('/contact', AuthController.contact);
router.put('/profile', requireAuth, upload.single('photo'), AuthController.updateProfile);
router.put('/password', requireAuth, AuthController.changePassword);

module.exports = router;
