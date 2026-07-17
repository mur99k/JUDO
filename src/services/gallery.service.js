const fs = require('fs');
const path = require('path');
const config = require('../config');
const storage = require('../storage');

const galleryPrefix = 'gallery';
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const GalleryService = {
  async list() {
    const seen = new Set();
    const out = [];
    // 1. Repo-seeded photos (served via the /gallery-img static route from the
    //    git checkout — always present on Render's ephemeral FS at boot).
    try {
      const seedDir = config.media.galleryDir;
      if (fs.existsSync(seedDir)) {
        for (const f of fs.readdirSync(seedDir)) {
          if (IMAGE_EXT.includes(path.extname(f).toLowerCase())) {
            seen.add(f);
            const stat = fs.statSync(path.join(seedDir, f));
            out.push({ name: f, url: '/gallery-img/' + encodeURIComponent(f) + '?v=' + stat.mtime.getTime() });
          }
        }
      }
    } catch {}
    // 2. Admin uploads persisted in cloud storage (survive restarts).
    try {
      const items = await storage.list(galleryPrefix);
      for (const it of items) {
        const f = it.key.split('/').pop();
        if (IMAGE_EXT.includes(path.extname(f).toLowerCase()) && !seen.has(f)) {
          out.push({ name: f, url: it.url });
        }
      }
    } catch {}
    return out;
  },

  async upload(file) {
    const key = galleryPrefix + '/' + file.filename;
    const buffer = fs.readFileSync(file.path);
    const { url } = await storage.upload(key, buffer, file.mimetype);
    try { fs.unlinkSync(file.path); } catch {}
    return { name: file.filename, url };
  },

  async delete(filename) {
    const key = galleryPrefix + '/' + filename;
    await storage.remove(key);
  }
};

module.exports = GalleryService;
