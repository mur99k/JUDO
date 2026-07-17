require('dotenv').config();
const path = require('path');
const crypto = require('crypto');

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

const config = {
  isProduction,
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim()).filter(Boolean),
  https: {
    // True when a reverse proxy terminates TLS and sends X-Forwarded-* headers.
    behindProxy: (process.env.HTTPS || 'true') === 'true',
    // Optional: serve HTTPS directly from Node (no proxy). Requires cert paths.
    direct: (process.env.HTTPS_DIRECT || 'false') === 'true',
    keyPath: process.env.TLS_KEY_PATH || '',
    certPath: process.env.TLS_CERT_PATH || ''
  },
  sessionSecret: process.env.SESSION_SECRET || '',
  db: {
    path: path.resolve(__dirname, '..', '..', process.env.DB_PATH || './data/club.db')
  },
  upload: {
    path: path.resolve(__dirname, '..', '..', process.env.UPLOAD_PATH || './uploads'),
    studentPhoto: 'students',
    adminPhoto: 'admins',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  // Media folders. On hosts with an ephemeral filesystem (e.g. Render free
  // tier) point these at a persistent disk mount (e.g. /var/data/...).
  // Defaults keep the existing repo-relative layout for local/dev.
  media: {
    galleryDir: path.resolve(__dirname, '..', '..', process.env.GALLERY_DIR || './بطولات وجوائز'),
    coachDir: path.resolve(__dirname, '..', '..', process.env.COACH_DIR || './صور المدربين'),
    backgroundsDir: path.resolve(__dirname, '..', '..', process.env.BACKGROUNDS_DIR || './backgrounds'),
    backgroundPhotosDir: path.resolve(__dirname, '..', '..', process.env.BGPHOTOS_DIR || './background-photos')
  },
  session: {
    maxAge: 24 * 60 * 60 * 1000
  },
  viewCache: isProduction,
  app: {
    name: 'نادي الريادة للجودو',
    phone: '+966 56 738 3104',
    whatsapp: '966567383104',
    mapUrl: 'https://maps.app.goo.gl/yw3GYxyD1ndC7SUx7?g_st=ic'
  }
};

// ─── Production safety checks ───────────────────────
if (isProduction) {
  const weak = !config.sessionSecret || config.sessionSecret.length < 16 ||
    ['change-me', 'fallback-secret', 'secret'].includes(config.sessionSecret.toLowerCase());
  if (weak) {
    // Fail fast: a weak session secret in prod is a critical security risk.
    console.error('FATAL: SESSION_SECRET is missing or too weak for production. Generate one with:');
    console.error("  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"");
    process.exit(1);
  }
  if (!config.https.behindProxy && !config.https.direct) {
    console.warn('WARN: NODE_ENV=production but no HTTPS mode enabled (set HTTPS=true for a proxy, or HTTPS_DIRECT=true with cert paths).');
  }
}

module.exports = config;
