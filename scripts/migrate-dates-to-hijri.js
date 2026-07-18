// One-time migration: convert any stored GREGORIAN YYYY-MM-DD dates in
// attendance.date / subscriptions.startDate / subscriptions.endDate into
// HIJRI YYYY-MM-DD strings. Idempotent: only converts values whose year
// looks Gregorian (>= 1600). Hijri years (1300-1500) are left untouched.
//
// Run against the target DB by setting the right env (DATABASE_URL for pg,
// or DB_PATH for local sqlite). Example (production):
//   DATABASE_URL=... node scripts/migrate-dates-to-hijri.js
//   node scripts/migrate-dates-to-hijri.js   (local sqlite)

const { getConnection } = require('../src/database/connection');
const hijri = require('../src/utils/hijri');

function isGregorian(str) {
  if (!str) return false;
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]);
  return y >= 1600 && y <= 2999; // Gregorian era; Hijri years are 1300-1500
}

(async () => {
  const db = getConnection();
  let converted = 0, skipped = 0;

  // Attendance
  const att = await db.query('SELECT id, date FROM attendance');
  for (const row of att.rows) {
    if (isGregorian(row.date)) {
      const h = hijri.gregorianToHijriISO(row.date);
      await db.query('UPDATE attendance SET date = $1 WHERE id = $2', [h, row.id]);
      converted++;
      console.log('att ' + row.id + ': ' + row.date + ' -> ' + h);
    } else skipped++;
  }

  // Subscriptions
  const subs = await db.query('SELECT id, startDate, endDate FROM subscriptions');
  for (const row of subs.rows) {
    const updates = [];
    const params = [];
    let i = 1;
    if (isGregorian(row.startDate)) {
      const h = hijri.gregorianToHijriISO(row.startDate);
      updates.push('startDate = $' + i); params.push(h); i++;
      console.log('sub ' + row.id + ' startDate: ' + row.startDate + ' -> ' + h);
      converted++;
    }
    if (isGregorian(row.endDate)) {
      const h = hijri.gregorianToHijriISO(row.endDate);
      updates.push('endDate = $' + i); params.push(h); i++;
      console.log('sub ' + row.id + ' endDate: ' + row.endDate + ' -> ' + h);
      converted++;
    }
    if (updates.length) {
      params.push(row.id);
      await db.query('UPDATE subscriptions SET ' + updates.join(', ') + ' WHERE id = $' + i, params);
    } else skipped++;
  }

  console.log('\n=== DONE ===');
  console.log('converted:', converted, '| already-hijri/skipped:', skipped);
  process.exit(0);
})().catch(e => { console.error('MIGRATION ERROR:', e); process.exit(1); });
