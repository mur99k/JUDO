const fs = require('fs');
const path = require('path');
const config = require('../config');

// Copies seed media from the repo's committed folders into the configured
// (possibly disk-mounted) media dirs — but ONLY if the target dir is empty.
// This keeps the real gallery/coach photos available on hosts with an
// ephemeral filesystem (e.g. Render free tier) without clobbering uploads.
function copyIfEmpty(src, dest) {
  try {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const destFiles = fs.readdirSync(dest).filter(f => !f.startsWith('.'));
    if (destFiles.length > 0) return; // already populated — don't overwrite
    for (const f of fs.readdirSync(src)) {
      const s = path.join(src, f);
      if (fs.statSync(s).isFile()) fs.copyFileSync(s, path.join(dest, f));
    }
    console.log(`[sync-media] seeded ${dest}`);
  } catch (e) {
    console.warn('[sync-media] skipped', dest, '-', e.message);
  }
}

function syncMediaToDisk() {
  const repo = path.resolve(__dirname, '..', '..');
  copyIfEmpty(path.join(repo, 'بطولات وجوائز'), config.media.galleryDir);
  copyIfEmpty(path.join(repo, 'صور المدربين'), config.media.coachDir);
  copyIfEmpty(path.join(repo, 'uploads', 'coaches'), path.join(config.upload.path, 'coaches'));
}

module.exports = { syncMediaToDisk };
