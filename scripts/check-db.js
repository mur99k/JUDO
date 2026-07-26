const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'club.db'));

console.log('=== ALL TABLES ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => {
  const cnt = db.prepare(`SELECT COUNT(*) c FROM "${t.name}"`).get();
  console.log(t.name + ':', cnt.c, 'rows');
  if (cnt.c > 0) {
    const cols = db.prepare(`PRAGMA table_info("${t.name}")`).all();
    const colNames = cols.map(c => c.name).join(', ');
    console.log('  cols:', colNames);
    const rows = db.prepare(`SELECT * FROM "${t.name}" LIMIT 30`).all();
    rows.forEach(r => console.log('  ', JSON.stringify(r)));
  }
});

db.close();
