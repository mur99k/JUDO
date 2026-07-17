/**
 * seed-media.js
 * Generates realistic demo media (gallery achievements + coach photos + hero background)
 * and assigns coach photos to the two named coaches in the database.
 *
 * No external dependencies — writes valid PNG files via a minimal encoder.
 * Safe to run repeatedly: it clears previous seed media first and re-assigns.
 *
 * Usage: node seed-media.js
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const ROOT = __dirname;
const galleryDir = path.join(ROOT, 'بطولات وجوائز');
const bgPhotosDir = path.join(ROOT, 'background-photos');
const coachesDir = path.join(ROOT, 'uploads', 'coaches');
const bgDir = path.join(ROOT, 'backgrounds');

// ---------- minimal PNG encoder (RGB, no compression filter) ----------
function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function writePNG(file, width, height, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // raw scanlines with filter byte 0
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0;
    rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  }
  const idat = zlib.deflateSync(raw);
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(file, png);
}

// ---------- drawing helpers ----------
function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
function mix(c1, c2, t) { return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]; }

function drawImage(width, height, topColor, botColor, label, sublabel, opts) {
  opts = opts || {};
  const rgb = Buffer.alloc(width * height * 3);
  // diagonal gradient
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = (x / width) * 0.6 + (y / height) * 0.4;
      const c = mix(topColor, botColor, Math.min(1, Math.max(0, t)));
      const i = (y * width + x) * 3;
      rgb[i] = c[0]; rgb[i + 1] = c[1]; rgb[i + 2] = c[2];
    }
  }
  // soft vignette circle in center for a "medal/photo" feel
  if (opts.badge) {
    const cx = width / 2, cy = height / 2;
    const r = Math.min(width, height) * 0.32;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (d < r) {
          const t = d / r;
          const c = mix(opts.badge, [255, 255, 255], (1 - t) * 0.25);
          const i = (y * width + x) * 3;
          rgb[i] = c[0]; rgb[i + 1] = c[1]; rgb[i + 2] = c[2];
        }
      }
    }
  }
  // text label (rendered as a centered rounded bar since we can't do real font glyphs)
  if (label) {
    const barH = Math.round(height * 0.16);
    const barY = Math.round(height * 0.74);
    const barX = Math.round(width * 0.12);
    const barW = Math.round(width * 0.76);
    for (let y = barY; y < barY + barH; y++) {
      for (let x = barX; x < barX + barW; x++) {
        const i = (y * width + x) * 3;
        rgb[i] = 255; rgb[i + 1] = 255; rgb[i + 2] = 255;
      }
    }
  }
  return rgb;
}

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function rndName(ext) { return Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext; }

// ---------- palette (navy / gold brand) ----------
const NAVY = [27, 47, 79];
const GOLD = [201, 168, 76];
const NAVY2 = [16, 32, 58];
const BLUE = [59, 130, 246];
const GREEN = [5, 150, 105];

// ---------- main ----------
ensureDir(galleryDir); ensureDir(bgPhotosDir); ensureDir(coachesDir); ensureDir(bgDir);

// 1. Clear previous seed media (only the folders we manage — never the real gallery)
function clearDir(dir, keep) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isFile() && (!keep || !keep.test(f))) {
      try { fs.unlinkSync(fp); } catch (e) {}
    }
  });
}
clearDir(coachesDir);
clearDir(bgDir);
clearDir(bgPhotosDir);

const db = new Database(path.join(ROOT, 'data', 'club.db'));
db.pragma('journal_mode = WAL');

// 2. Gallery (بطولات وجوائز) — uses the REAL photos already placed in the folder.
//    We do NOT generate or delete gallery images here so user photos are preserved.
const realGallery = fs.existsSync(galleryDir)
  ? fs.readdirSync(galleryDir).filter(f => ['.jpg','.jpeg','.png','.gif','.webp'].includes(path.extname(f).toLowerCase()))
  : [];
console.log('📸 مجلد "بطولات وجوائز" يحتوي على ' + realGallery.length + ' صورة حقيقية (محفوظة كما هي).');

// 3. Background photos (باكروند فوتوز) — regenerate decorative gradients
console.log('🖼 إنشاء صور مجلد background-photos...');
const bgPalette = [[NAVY, GOLD], [NAVY, BLUE], [GOLD, NAVY2], [BLUE, NAVY], [GREEN, NAVY]];
bgPalette.forEach((pair, i) => {
  const rgb = drawImage(1200, 800, pair[0], pair[1], '', '', {});
  writePNG(path.join(bgPhotosDir, 'bg-photo-' + (i + 1) + '.png'), 1200, 800, rgb);
});
console.log('   تم إنشاء ' + bgPalette.length + ' صورة خلفية');

// 4. Hero background
console.log('🖼 إنشاء خلفية الصفحة الرئيسية...');
const bgName = 'hero-' + rndName('.png').replace('.png', '') + '.png';
const bgRgb = drawImage(1600, 900, NAVY, NAVY2, '', '', {});
writePNG(path.join(bgDir, bgName), 1600, 900, bgRgb);
console.log('   تم إنشاء ' + bgName);

// 4. Coach photos
console.log('📷 إنشاء صور المدربين...');
const coachPhotoFiles = {};
function makeCoachPhoto(name, top, bot, badge) {
  const fn = rndName('.png');
  const rgb = drawImage(400, 400, top, bot, name, '', { badge });
  writePNG(path.join(coachesDir, fn), 400, 400, rgb);
  return '/uploads/coaches/' + fn;
}
// معتوق (1 photo)
const moataqPhoto = makeCoachPhoto('معتوق', NAVY, NAVY2, GOLD);
// كبتن مروان (2 photos — private album)
const marwanP1 = makeCoachPhoto('مروان 1', BLUE, NAVY, GOLD);
const marwanP2 = makeCoachPhoto('مروان 2', GREEN, NAVY, GOLD);
console.log('   تم إنشاء صور: معتوق (1)، كبتن مروان (2)');

// 5. Assign coach photos to the two named coaches in DB
//    Find or create them as users with role = 'coach'.
function upsertCoach(fullName, email, phone, password, photos) {
  const existing = db.prepare('SELECT id, profileImage FROM users WHERE email = ?').get(email);
  const hash = require('bcryptjs').hashSync(password, 10);
  if (existing) {
    db.prepare('UPDATE users SET fullName = ?, phone = ?, profileImage = ? WHERE id = ?').run(fullName, phone, photos[0], existing.id);
    return existing.id;
  }
  const res = db.prepare('INSERT INTO users (fullName, email, phone, password, role, profileImage, createdAt) VALUES (?, ?, ?, ?, \'coach\', ?, ?)').run(fullName, email, phone, hash, photos[0], new Date().toISOString().split('T')[0]);
  return res.lastInsertRowid;
}
const id1 = upsertCoach('معتوق', 'coach.moataq@riyadah.com', '0551000001', 'moataq123', [moataqPhoto]);
const id2 = upsertCoach('كبتن مروان', 'coach.marwan@riyadah.com', '0551000002', 'marwan123', [marwanP1, marwanP2]);
console.log('   تم ربط الصور بالمدربين (id ' + id1 + ', ' + id2 + ')');

// 6. Store the extra (2nd) photo for marwan via a lightweight album note in settings
//    (the app shows one profileImage; the 2nd photo is kept as a "private album" reference)
const albumKey = 'coachAlbum_' + id2;
const albumRef = JSON.stringify({ coachId: id2, photos: [marwanP1, marwanP2] });
db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(albumKey, albumRef);

db.close();
console.log('\n✅ تم إنشاء وتوزيع كل الوسائط التجريبية بنجاح!');
console.log('   معرض (بطولات وجوائز): ' + realGallery.length + ' صورة حقيقية في مجلد "بطولات وجوائز/"');
console.log('   خلفية رئيسية: 1 في backgrounds/');
console.log('   صور المدربين: 3 في uploads/coaches/ (معتوق 1، مروان 2)');
