const path = require('path');
const fs = require('fs');

const config = require('../config');
const galleryDir = config.media.galleryDir;

// Ensure a filename resolves inside galleryDir (no traversal).
function safeFile(name) {
  const resolved = path.resolve(galleryDir, name);
  if (!resolved.startsWith(path.resolve(galleryDir) + path.sep) && resolved !== path.resolve(galleryDir)) {
    return null;
  }
  return resolved;
}

const GalleryService = {
  list() {
    try {
      if (!fs.existsSync(galleryDir)) return [];
      return fs.readdirSync(galleryDir)
        .filter(f => ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(f).toLowerCase()))
        .map(f => {
          var stat = fs.statSync(path.join(galleryDir, f));
          var t = stat.mtime.getTime();
          return { name: f, url: '/gallery-img/' + encodeURIComponent(f) + '?v=' + t };
        });
    } catch {
      return [];
    }
  },

  delete(filename) {
    const filePath = safeFile(filename);
    if (!filePath || !fs.existsSync(filePath)) throw new Error('الملف غير موجود');
    fs.unlinkSync(filePath);
  }
};

module.exports = GalleryService;
