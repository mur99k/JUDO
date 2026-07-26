// TEMPORARY — one-time cleanup. Removed after use.
const { getConnection } = require('../database/connection');
const { success } = require('../utils/response');

module.exports = {
  async cleanup(req, res, next) {
    try {
      const db = getConnection();

      await db.query('DELETE FROM subscriptions WHERE id = $1', [36]);
      await db.query('DELETE FROM attendance');
      await db.query('DELETE FROM students WHERE id = $1', [98]);
      await db.query("UPDATE students SET photo = null, updatedAt = NOW() WHERE id = $1", [41]);

      const stale = ['coachBio_2','coachBio_3','coachBio_15','coachBio_16',
        'coachBio_18','coachBio_19','coachBio_24','coachBio_25',
        'coachBio_26','coachBio_27'];
      for (const k of stale) await db.query('DELETE FROM settings WHERE key = $1', [k]);

      const s = (await db.query('SELECT COUNT(*) c FROM students')).rows[0];
      const c = (await db.query("SELECT COUNT(*) c FROM users WHERE role='coach'")).rows[0];
      const sub = (await db.query('SELECT COUNT(*) c FROM subscriptions')).rows[0];
      const a = (await db.query('SELECT COUNT(*) c FROM attendance')).rows[0];
      const bioKeys = (await db.query("SELECT key FROM settings WHERE key LIKE 'coachBio%' ORDER BY key")).rows.map(r => r.key);

      return success(res, {
        message: 'Clean complete',
        state: {
          students: Number(s.c), coaches: Number(c.c),
          subscriptions: Number(sub.c), attendance: Number(a.c),
          coachBios: bioKeys
        }
      });
    } catch (err) { next(err); }
  }
};
