#!/usr/bin/env node
/**
 * backup-db.js
 * Safely backs up the SQLite database for the production server.
 *
 * Strategy:
 *   1. Open the live DB and run a WAL checkpoint so all data is flushed
 *      into the main .db file (no data left only in the -wal/-shm files).
 *   2. Copy club.db (+ -wal, + -shm if present) to a timestamped file
 *      inside the backups/ directory.
 *
 * Usage:  node scripts/backup-db.js
 * Cron example (daily at 03:00):
 *   0 3 * * * cd /path/to/app && node scripts/backup-db.js >> logs/backup.log 2>&1
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const ROOT = path.resolve(__dirname, '..');
const dbPath = path.resolve(ROOT, process.env.DB_PATH || './data/club.db');
const backupDir = path.resolve(ROOT, process.env.BACKUP_DIR || './backups');

if (!fs.existsSync(dbPath)) {
  console.error('ERROR: database not found at', dbPath);
  process.exit(1);
}
fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const base = path.basename(dbPath, '.db'); // e.g. "club"
const outPath = path.join(backupDir, `${base}-${stamp}.db`);

// Flush WAL → main file so the copy is complete & consistent.
try {
  const db = new Database(dbPath);
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
  console.log(`[${new Date().toISOString()}] WAL checkpoint done.`);
} catch (e) {
  console.error('WARNING: checkpoint failed:', e.message, '(continuing with file copy)');
}

for (const suffix of ['', '-wal', '-shm']) {
  const src = dbPath + suffix;
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, outPath + suffix);
  }
}
console.log(`[${new Date().toISOString()}] Backup created:`, outPath);

// ─── Keep only the last N backups (default 14) ───
const keep = parseInt(process.env.BACKUP_KEEP || '14', 10);
const files = fs.readdirSync(backupDir)
  .filter(f => f.startsWith(base + '-') && f.endsWith('.db'))
  .map(f => ({ f, t: fs.statSync(path.join(backupDir, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t);
const toDelete = files.slice(keep);
toDelete.forEach(({ f }) => {
  for (const suffix of ['', '-wal', '-shm']) {
    const p = path.join(backupDir, f + suffix);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
});
if (toDelete.length) console.log(`Pruned ${toDelete.length} old backup(s).`);
