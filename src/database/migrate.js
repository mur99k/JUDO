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
  // Strip DO $$...$$ blocks (PL/pgSQL) that contain internal semicolons.
  sql = sql.replace(/DO\s+\$\$[\s\S]*?\$\$/gi, '');
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

  // Upsert coaches (always reset password, re-create if missing)
  const coachHash = bcrypt.hashSync('coach123', 10);
  const seedCoaches = [
    { name: 'كابتن معتوق', email: 'coach.moataq@riyadah.com', bio: 'بطل المملكة وحاصل على بطولات داخلية وخارجية. خبرة أكثر من 20 سنة.' },
    { name: 'كابتن مروان', email: 'coach.marwan@riyadah.com', bio: 'مدرب سابق في نادي الأهلي ولاعب منتخب وبطل المملكة.' }
  ];
  for (const sc of seedCoaches) {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [sc.email]);
    let coachId;
    if (existing.rows.length === 0) {
      const r = await db.query(
        'INSERT INTO users (fullName, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [sc.name, sc.email, coachHash, 'coach']
      );
      coachId = r.rows[0].id;
    } else {
      coachId = existing.rows[0].id;
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [coachHash, coachId]);
    }
    await db.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      ['coachBio_' + coachId, sc.bio]
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
