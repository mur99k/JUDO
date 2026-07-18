// Unified database adapter.
//
// Production (Render Free): PostgreSQL via `pg` (Render's free managed instance).
// Local development: SQLite via `better-sqlite3` (zero setup).
//
// Repositories are written once in PostgreSQL-flavored SQL ($1 placeholders,
// RETURNING, ON CONFLICT, SERIAL, NOW(), CURRENT_DATE). The SQLite branch
// transparently translates the few dialect differences so the same repos run in dev.
//
// The public surface is async: `query(sql, params)` -> { rows } and
// `run(sql, params)` -> { rowCount, lastId }.

const config = require('../config');

let impl = null;
let flavor = null;

// pg lowercases all column names. Map known multi-word columns to camelCase.
const PG_CAMEL_MAP = {
  fullname: 'fullName', nationalid: 'nationalId', parentphone: 'parentPhone',
  profileimage: 'profileImage', studentid: 'studentId', coachid: 'coachId',
  createdat: 'createdAt', updatedat: 'updatedAt', startdate: 'startDate',
  enddate: 'endDate', paymentmethod: 'paymentMethod', coachgroups: 'coachGroups'
};

function mapRow(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) out[PG_CAMEL_MAP[k] || k] = v;
  return out;
}

function detect() {
  if (impl) return;
  if (config.db.type === 'postgres') {
    flavor = 'postgres';
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: config.db.url, ssl: { rejectUnauthorized: false } });
    impl = {
      async query(sql, params) {
        const r = await pool.query(translateToPg(sql), params || []);
        const rows = r.rows.map(mapRow);
        return { rows, rowCount: r.rowCount, lastId: rows[0] && (rows[0].id !== undefined ? rows[0].id : null) };
      },
      async transaction(fn) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const out = await fn({ query: async (s, p) => { const r = await client.query(translateToPg(s), p || []); return { rows: r.rows.map(mapRow), rowCount: r.rowCount }; } });
          await client.query('COMMIT');
          return out;
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      },
      async close() { await pool.end(); }
    };
  } else {
    flavor = 'sqlite';
    const Database = require('better-sqlite3');
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(config.db.path);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const db = new Database(config.db.path);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    impl = {
      async query(sql, params) {
        const s = translateToSqlite(sql).trim();
        const stmt = db.prepare(s);
        // SELECT (or queries that return rows) use .all(); others use .run().
        const isSelect = /^select\b/i.test(s);
        let rows = [];
        if (isSelect) {
          rows = stmt.all(...(params || []));
        } else {
          stmt.run(...(params || []));
        }
        const lastId = db.prepare('SELECT last_insert_rowid() AS id').get().id;
        return { rows, rowCount: rows.length, lastId };
      },
      async transaction(fn) {
        const run = (s, p) => {
          const stmt = db.prepare(translateToSqlite(s));
          const rows = stmt.all(...(p || []));
          return { rows, rowCount: rows.length };
        };
        const res = db.transaction(() => fn({ query: run }))();
        return res;
      },
      async close() { db.close(); }
    };
  }
}

// Postgres -> SQLite translation for the handful of constructs our repos use.
function translateToSqlite(sql) {
  let s = sql;
  // $1, $2, ... (pg placeholders) -> ? (sqlite placeholders)
  s = s.replace(/\$(\d+)/g, '?');
  // RETURNING id  ->  handled by reading last_insert_rowid after insert
  s = s.replace(/\bRETURNING\s+id\b/gi, '');
  // INSERT ... VALUES (..) ON CONFLICT (key) DO UPDATE SET col = EXCLUDED.col
  //   -> INSERT OR REPLACE INTO ... VALUES (..)   (SQLite upsert equivalent)
  s = s.replace(/INSERT\s+INTO\s+(\S+)\s*\(([^)]*)\)\s*VALUES\s*\(([^)]*)\)\s*ON\s+CONFLICT\s*\([^)]*\)\s*DO\s+UPDATE\s+SET\s+\w+\s*=\s*EXCLUDED\.\w+/gi,
    'INSERT OR REPLACE INTO $1 ($2) VALUES ($3)');
  // SERIAL -> INTEGER PRIMARY KEY AUTOINCREMENT
  s = s.replace(/\bSERIAL\b/gi, 'INTEGER');
  // NOW() and CURRENT_DATE
  s = s.replace(/\bNOW\(\)/gi, "date('now','localtime')");
  s = s.replace(/\bCURRENT_DATE\b/gi, "date('now','localtime')");
  // julianday(x) - julianday('now','localtime') ->  day difference
  s = s.replace(/julianday\(\s*([^)]+?)\s*\)\s*-\s*julianday\(\s*'now'\s*,\s*'localtime'\s*\)/gi,
    "(julianday($1) - julianday('now','localtime'))");
  // TO_CHAR(dateCol::date,'MM') -> strftime('%m', dateCol)
  s = s.replace(/TO_CHAR\(\s*([^,]+?)::date\s*,\s*'MM'\s*\)/gi, "strftime('%m', $1)");
  // EXTRACT(YEAR FROM col) -> strftime('%Y', col)
  s = s.replace(/EXTRACT\(\s*YEAR\s+FROM\s+([^)]+?)\s*\)/gi, "strftime('%Y', $1)");
  return s;
}

// SQLite -> Postgres placeholder translation ($1 -> $1 already; we author in pg,
// so this is a no-op kept for clarity / future use).
function translateToPg(sql) { return sql; }

function getConnection() {
  detect();
  return {
    flavor,
    async query(sql, params) { return impl.query(sql, params); },
    async transaction(fn) { return impl.transaction(fn); },
    async close() { if (impl) await impl.close(); impl = null; }
  };
}

function close() {
  if (impl) { const i = impl; impl = null; return i.close(); }
  return Promise.resolve();
}

module.exports = { getConnection, close, get flavor() { return flavor; } };
