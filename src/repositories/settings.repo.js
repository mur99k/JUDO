const { getConnection } = require('../database/connection');

const SettingsRepo = {
  async getAll() {
    const db = getConnection();
    const r = await db.query('SELECT * FROM settings');
    const result = {};
    for (const row of r.rows) {
      result[row.key] = row.value;
    }
    return result;
  },

  async get(key) {
    const db = getConnection();
    const r = await db.query('SELECT value FROM settings WHERE key = $1', [key]);
    return r.rows[0] ? r.rows[0].value : null;
  },

  async set(key, value) {
    const db = getConnection();
    await db.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      [key, value]
    );
  },

  async setMultiple(data) {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
  }
};

module.exports = SettingsRepo;
