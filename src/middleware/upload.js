const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createUploader(subDir) {
  const dir = path.join(config.upload.path, subDir);
  ensureDir(dir);

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
      cb(null, name);
    }
  });

  return multer({
    storage,
    limits: { fileSize: config.upload.maxFileSize },
    fileFilter: function (req, file, cb) {
      if (config.upload.allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('نوع الملف غير مسموح به. يرجى رفع صورة JPG أو PNG'));
      }
    }
  });
}

module.exports = { createUploader };
