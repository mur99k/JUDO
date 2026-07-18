const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { getConnection } = require('./connection');
const hijri = require('../utils/hijri');

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

  // Set default password for existing students who have no password (legacy accounts)
  const defaultStudentHash = bcrypt.hashSync('student123', 10);
  await db.query('UPDATE students SET password = $1 WHERE password IS NULL', [defaultStudentHash]);

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

// Convert any stored GREGORIAN YYYY-MM-DD dates (attendance.date,
// subscriptions.startDate/endDate) into HIJRI YYYY-MM-DD strings.
// Idempotent: only touches values whose year looks Gregorian (>=1600);
// Hijri years (1300-1500) are left alone. Runs once, tracked via a setting.
async function migrateDatesToHijri() {
  const db = getConnection();
  try {
    const flag = await db.query("SELECT value FROM settings WHERE key = $1", ['datesMigratedToHijri']);
    if (flag.rows.length && flag.rows[0].value === '1') return;
  } catch (e) { /* settings table may not exist yet on first boot */ }

  const isGregorian = (str) => {
    if (!str) return false;
    const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    const y = Number(m[1]);
    return y >= 1600 && y <= 2999;
  };

  try {
    const att = await db.query('SELECT id, date FROM attendance');
    for (const row of att.rows) {
      if (isGregorian(row.date)) {
        await db.query('UPDATE attendance SET date = $1 WHERE id = $2', [hijri.gregorianToHijriISO(row.date), row.id]);
      }
    }
    const subs = await db.query('SELECT id, startDate, endDate FROM subscriptions');
    for (const row of subs.rows) {
      const sets = [];
      const params = [];
      let i = 1;
      if (isGregorian(row.startDate)) { sets.push('startDate = $' + i); params.push(hijri.gregorianToHijriISO(row.startDate)); i++; }
      if (isGregorian(row.endDate)) { sets.push('endDate = $' + i); params.push(hijri.gregorianToHijriISO(row.endDate)); i++; }
      if (sets.length) { params.push(row.id); await db.query('UPDATE subscriptions SET ' + sets.join(', ') + ' WHERE id = $' + i, params); }
    }
  } catch (e) {
    console.error('[migrateDatesToHijri] skipped:', e.message);
  }

  try {
    await db.query(
      "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      ['datesMigratedToHijri', '1']
    );
  } catch (e) { /* ignore */ }
  console.log('[migrateDatesToHijri] done');
}

async function initDatabase() {
  await applySchema();
  await seed();
  await migrateDatesToHijri();
}

module.exports = { initDatabase, applySchema, seed };
