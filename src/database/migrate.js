const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { getConnection } = require('./connection');

async function applySchema() {
  const db = getConnection();
  const flavor = db.flavor;
  const file = path.join(__dirname, flavor === 'postgres' ? 'schema-postgres.sql' : 'schema-sqlite.sql');
  let sql = fs.readFileSync(file, 'utf8');
  // Strip SQL comments so the statement splitter doesn't choke on them.
  sql = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  // Split on statements (works for both dialects; Postgres blocks separated by ';').
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await db.query(stmt + ';');
  }
}

async function seed() {
  const db = getConnection();
  // Remove old default admin account.
  await db.query('DELETE FROM users WHERE email = $1', ['admin@riyadah.com']);
  // Create new admin if not already present.
  const existing = await db.query('SELECT id FROM users WHERE email = $1', ['Matoq701@gmail.com']);
  if (existing.rows.length === 0) {
    const hash = bcrypt.hashSync('Ma123456', 10);
    await db.query(
      'INSERT INTO users (fullName, email, password, role) VALUES ($1, $2, $3, $4)',
      ['الكابتن معتوق', 'Matoq701@gmail.com', hash, 'admin']
    );
  }

  const settingKeys = [
    ['adminName', 'الكابتن معتوق'],
    ['adminPhone', ''],
    ['clubWhatsapp', ''],
    ['aiProvider', ''],
    ['aiApiKey', '']
  ];
  for (const [key, value] of settingKeys) {
    await db.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      [key, value]
    );
  }
}

async function initDatabase() {
  await applySchema();
  await seed();
}

module.exports = { initDatabase, applySchema, seed };
