const fs = require('fs');
const path = require('path');

const config = require('../config');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const level = LEVELS[process.env.LOG_LEVEL] ?? (config.isProduction ? LEVELS.info : LEVELS.debug);

const logDir = path.resolve(__dirname, '..', '..', process.env.LOG_DIR || './logs');
let logStream = null;
try {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const file = path.join(logDir, 'app.log');
  logStream = fs.createWriteStream(file, { flags: 'a' });
} catch (e) {
  // If we can't open the log file, fall back to console only.
  console.error('Logger: could not open log file:', e.message);
}

function ts() {
  return new Date().toISOString();
}

function write(levelName, args) {
  if (LEVELS[levelName] > level) return;
  const line = `[${ts()}] [${levelName.toUpperCase()}] ${args.map(stringify).join(' ')}`;
  if (logStream) logStream.write(line + '\n');
  // Mirror to console for visibility (stderr for errors so they aren't swallowed by pipes).
  if (levelName === 'error') console.error(line);
  else console.log(line);
}

function stringify(a) {
  if (a instanceof Error) return a.stack || a.message;
  if (typeof a === 'object') {
    try { return JSON.stringify(a); } catch { return String(a); }
  }
  return String(a);
}

module.exports = {
  error: (...a) => write('error', a),
  warn:  (...a) => write('warn', a),
  info:  (...a) => write('info', a),
  debug: (...a) => write('debug', a)
};
