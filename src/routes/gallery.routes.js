const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const GalleryController = require('../controllers/gallery.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const config = require('../config');
const photosDir = config.media.galleryDir;
if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, photosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    // Validate real content type, not just the client-supplied extension.
    if (config.upload.allowedImageTypes.includes(file.mimetype)) return cb(null, true);
    cb(new Error('صيغة الملف غير مدعومة. الصيغ المسموحة: JPG, PNG, GIF, WebP'));
  }
});

router.get('/', GalleryController.list);
router.post('/', requireAdmin, upload.single('photo'), GalleryController.upload);
router.delete('/:name', requireAdmin, GalleryController.delete);

module.exports = router;
