const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { getConnection } = require('./connection');

const migrationsDir = path.join(__dirname, 'migrations');

function runMigrations() {
  const db = getConnection();
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  db.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, runAt DATETIME DEFAULT CURRENT_TIMESTAMP)');
  const run = new Set(db.prepare('SELECT name FROM _migrations').all().map(r => r.name));

  for (const file of files) {
    if (run.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
  }
}

function seed() {
  const db = getConnection();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@riyadah.com');
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?)').run(
      'الكابتن معتوق', 'admin@riyadah.com', hash, 'admin'
    );
  }

  const settingKeys = [
    ['adminName', 'الكابتن معتوق'],
    ['adminPhone', ''],
    ['clubWhatsapp', ''],
    ['aiProvider', ''],
    ['aiApiKey', '']
  ];
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of settingKeys) {
    insertSetting.run(key, value);
  }
}

function ensureSchemaExtras() {
  const db = getConnection();
  const cols = db.prepare('PRAGMA table_info(students)').all().map(c => c.name);
  if (!cols.includes('category')) {
    db.exec('ALTER TABLE students ADD COLUMN category TEXT');
  }
}

function initDatabase() {
  runMigrations();
  ensureSchemaExtras();
  seed();
}

module.exports = { initDatabase };
