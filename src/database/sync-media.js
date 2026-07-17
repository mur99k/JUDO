const fs = require('fs');
const path = require('path');
const config = require('../config');
const storage = require('../storage');

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

// On cloud storage (prod), upload repo seed photos so they persist and are
// reachable via the public bucket. Also backfills coach profileImage URLs
// for coaches that don't have one yet (matched by filename -> coach name).
async function seedToStorage() {
  try {
    const repo = path.resolve(__dirname, '..', '..');
    const coachSrc = path.join(repo, 'صور المدربين');
    if (!storage.isRemote()) return;
    if (!fs.existsSync(coachSrc)) return;
    const UserRepo = require('../repositories/user.repo');
    const coaches = await UserRepo.findByRole('coach');
    for (const file of fs.readdirSync(coachSrc)) {
      const fp = path.join(coachSrc, file);
      if (!fs.statSync(fp).isFile()) continue;
      const key = 'coaches/' + file;
      const buffer = fs.readFileSync(fp);
      await storage.upload(key, buffer, 'image/png');
      // Best-effort: assign to a coach whose name appears in the filename.
      const base = path.basename(file, path.extname(file));
      const match = coaches.find(c => !c.profileImage && base.includes(c.fullName.replace(/\s+/g, '')));
      if (match) {
        await UserRepo.updateProfile(match.id, { profileImage: storage.normalizeDbValue(storage.publicUrl(key)) });
        console.log(`[sync-media] set profileImage for coach ${match.id}`);
      }
    }
  } catch (e) {
    console.warn('[sync-media] storage seed skipped -', e.message);
  }
}

async function syncMediaToDisk() {
  const repo = path.resolve(__dirname, '..', '..');
  copyIfEmpty(path.join(repo, 'بطولات وجوائز'), config.media.galleryDir);
  copyIfEmpty(path.join(repo, 'صور المدربين'), config.media.coachDir);
  copyIfEmpty(path.join(repo, 'uploads', 'coaches'), path.join(config.upload.path, 'coaches'));
  await seedToStorage();
}

module.exports = { syncMediaToDisk };
