const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const { injectUser } = require('./middleware/auth');
const { errorHandler } = require('./middleware/error');
const setupRoutes = require('./routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Cache compiled templates in production for performance.
app.set('view cache', !!config.viewCache);

// Trust the reverse proxy (nginx/Cloudflare) for secure cookies + real IP.
if (config.https.behindProxy) {
  app.set('trust proxy', 1);
}

// Restrict CORS to known origins in production (default '*' is dev-only).
const corsOptions = config.corsOrigin.includes('*')
  ? {}
  : { origin: config.corsOrigin, credentials: true };
app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Secure cookies only when served over HTTPS (directly or via proxy).
    secure: config.https.behindProxy || config.https.direct,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: config.session.maxAge
  }
}));

app.use(injectUser);

app.use('/styles', express.static(path.join(__dirname, '..', 'client', 'styles')));
app.use('/scripts', express.static(path.join(__dirname, '..', 'client', 'scripts')));
app.use('/assets', express.static(path.join(__dirname, '..', 'client', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Manual static route for the gallery folder (folder name is Arabic on disk:
// "بطولات وجوائز", but served via an ASCII route to avoid Windows URL
// decoding issues with express.static / path-to-regexp).
// Resolve a name relative to a base dir and ensure it stays inside it
// (prevents path traversal like ../../etc/passwd).
function safeJoin(baseDir, name) {
  const resolved = path.resolve(baseDir, name);
  if (!resolved.startsWith(path.resolve(baseDir) + path.sep) && resolved !== path.resolve(baseDir)) {
    return null;
  }
  return resolved;
}

const GALLERY_PREFIX = '/gallery-img/';
const GALLERY_DIR = config.media.galleryDir;
app.use(function (req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (!req.path.startsWith(GALLERY_PREFIX)) return next();
  const name = decodeURIComponent(req.path.slice(GALLERY_PREFIX.length));
  const filePath = safeJoin(GALLERY_DIR, name);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return res.status(404).end();
  res.sendFile(filePath);
});

// Coaches folder ("صور المدربين" on disk) served via an ASCII route for the
// same Windows UTF-8 path-decode reason as the gallery above.
const COACH_PREFIX = '/coach-img/';
const COACH_DIR = config.media.coachDir;
app.use(function (req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (!req.path.startsWith(COACH_PREFIX)) return next();
  const name = decodeURIComponent(req.path.slice(COACH_PREFIX.length));
  const filePath = safeJoin(COACH_DIR, name);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return res.status(404).end();
  res.sendFile(filePath);
});

// About page images ("صور عن النادي")
const ABOUT_PREFIX = '/about-img/';
const ABOUT_DIR = config.media.aboutDir;
app.use(function (req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (!req.path.startsWith(ABOUT_PREFIX)) return next();
  const name = decodeURIComponent(req.path.slice(ABOUT_PREFIX.length));
  const filePath = safeJoin(ABOUT_DIR, name);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return res.status(404).end();
  res.sendFile(filePath);
});

app.use('/backgrounds', express.static(path.join(__dirname, '..', 'صور الخلفية في الصفحة الرئيسية')));
app.use('/background-photos', express.static(path.join(__dirname, '..', 'صور الخلفية في الصفحة الرئيسية')));
app.use('/logo', express.static(path.join(__dirname, '..', 'logo')));

// ─── Health / liveness probe (registered before routes so it is never
//     shadowed by the catch-all 404 handler) ───
app.get('/api/health', function (req, res) {
  res.json({ status: 'ok', ts: Date.now(), env: config.isProduction ? 'production' : 'development' });
});

setupRoutes(app);

app.use(errorHandler);

// ─── Process-level safety (log instead of crashing silently) ───
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason && reason.stack ? reason.stack : reason);
});

module.exports = app;
