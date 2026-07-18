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
  // Upsert admin — always set correct password hash.
  const hash = bcrypt.hashSync('Ma123456', 10);
  const existing = await db.query('SELECT id FROM users WHERE email = $1', ['Matoq701@gmail.com']);
  if (existing.rows.length === 0) {
    await db.query(
      'INSERT INTO users (fullName, email, password, role) VALUES ($1, $2, $3, $4)',
      ['الكابتن معتوق', 'Matoq701@gmail.com', hash, 'admin']
    );
  } else {
    await db.query('UPDATE users SET password = $1, role = $2 WHERE email = $3', [hash, 'admin', 'Matoq701@gmail.com']);
  }

  // Seed coaches if not present
  const coachHash = bcrypt.hashSync('coach123', 10);

  const moataq = await db.query('SELECT id FROM users WHERE email = $1', ['coach.moataq@riyadah.com']);
  let moataqId;
  if (moataq.rows.length === 0) {
    const r = await db.query(
      'INSERT INTO users (fullName, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      ['كابتن معتوق', 'coach.moataq@riyadah.com', coachHash, 'coach']
    );
    moataqId = r.rows[0].id;
  } else {
    moataqId = moataq.rows[0].id;
  }

  const marwan = await db.query('SELECT id FROM users WHERE email = $1', ['coach.marwan@riyadah.com']);
  let marwanId;
  if (marwan.rows.length === 0) {
    const r = await db.query(
      'INSERT INTO users (fullName, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      ['كابتن مروان', 'coach.marwan@riyadah.com', coachHash, 'coach']
    );
    marwanId = r.rows[0].id;
  } else {
    marwanId = marwan.rows[0].id;
  }

  // Coach bios
  const coachBios = [
    ['coachBio_' + moataqId, 'بطل المملكة وحاصل على بطولات داخلية وخارجية. خبرة أكثر من 20 سنة.'],
    ['coachBio_' + marwanId, 'مدرب سابق في نادي الأهلي ولاعب منتخب وبطل المملكة.']
  ];
  for (const [key, value] of coachBios) {
    await db.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      [key, value]
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
