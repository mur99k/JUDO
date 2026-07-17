const { getConnection } = require('../database/connection');

const SettingsRepo = {
  getAll() {
    const rows = getConnection().prepare('SELECT * FROM settings').all();
    const result = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  },

  get(key) {
    const row = getConnection().prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  },

  set(key, value) {
    return getConnection().prepare(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
    ).run(key, value);
  },

  setMultiple(data) {
    const stmt = getConnection().prepare(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
    );
    const tx = getConnection().transaction((entries) => {
      for (const [key, value] of entries) {
        stmt.run(key, value);
      }
    });
    tx(Object.entries(data));
  }
};

module.exports = SettingsRepo;
