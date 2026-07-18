const { getConnection } = require('../database/connection');
const hijri = require('../utils/hijri');

// Compute remaining days until endDate (relative to today) using Hijri dates.
function daysBetween(todayStr, endStr) {
  return hijri.hijriDaysBetween(todayStr, endStr);
}

const SubscriptionRepo = {
  async findAll(filters = {}) {
    const db = getConnection();
    let sql = `
      SELECT sub.*, s.fullName as studentName
      FROM subscriptions sub
      JOIN students s ON sub.studentId = s.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.status) { sql += ' AND sub.status = $' + (params.length + 1); params.push(filters.status); }
    if (filters.studentId) { sql += ' AND sub.studentId = $' + (params.length + 1); params.push(filters.studentId); }
    sql += ' ORDER BY sub.createdAt DESC';
    const r = await db.query(sql, params);
    const today = hijri.todayHijri();
    return r.rows.map(row => ({
      ...row,
      remainingDays: row.status !== 'نشط' ? 0 : daysBetween(today, row.endDate)
    }));
  },

  async findById(id, conn) {
    const db = conn || getConnection();
    const r = await db.query(`
      SELECT sub.*, s.fullName as studentName
      FROM subscriptions sub
      JOIN students s ON sub.studentId = s.id
      WHERE sub.id = $1
    `, [id]);
    const row = r.rows[0];
    if (!row) return null;
    const today = hijri.todayHijri();
    return { ...row, remainingDays: row.status !== 'نشط' ? 0 : daysBetween(today, row.endDate) };
  },

  async create(data, conn) {
    const db = conn || getConnection();
    const r = await db.query(
      `INSERT INTO subscriptions (studentId, type, days, amount, startDate, endDate, status, paymentMethod, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [data.studentId, data.type, data.days, data.amount,
       data.startDate, data.endDate, data.status || 'نشط',
       data.paymentMethod || null, data.notes || null]
    );
    return { id: r.lastId || (r.rows[0] && r.rows[0].id) };
  },

  async update(id, data) {
    const db = getConnection();
    const fields = [];
    const values = [];
    const allowed = ['type', 'days', 'amount', 'startDate', 'endDate', 'status', 'paymentMethod', 'notes'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${fields.length + 1}`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return null;
    values.push(id);
    await db.query(`UPDATE subscriptions SET ${fields.join(', ')} WHERE id = $${values.length}`, values);
    return true;
  },

  async delete(id, conn) {
    const db = conn || getConnection();
    await db.query('DELETE FROM subscriptions WHERE id = $1', [id]);
  },

  async getActiveCount() {
    const db = getConnection();
    const r = await db.query('SELECT COUNT(*) as count FROM subscriptions WHERE status = $1', ['نشط']);
    return Number(r.rows[0].count);
  },

  async getTotalRevenue() {
    const db = getConnection();
    const r = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM subscriptions WHERE status != $1', ['ملغي']
    );
    return Number(r.rows[0].total);
  },

  async getMonthlyRevenue(year) {
    const db = getConnection();
    // startDate is stored as Hijri YYYY-MM-DD TEXT, so a simple prefix match
    // groups by the Hijri month/year (portable across pg/sqlite).
    const r = await db.query(`
      SELECT SUBSTR(startDate, 1, 7) as month, COALESCE(SUM(amount), 0) as total
      FROM subscriptions
      WHERE SUBSTR(startDate, 1, 4) = $1 AND status != $2
      GROUP BY month
      ORDER BY month
    `, [String(year), 'ملغي']);
    return r.rows.map(row => ({ ...row, total: Number(row.total) }));
  },

  async getExemptionCount() {
    const db = getConnection();
    const r = await db.query("SELECT COUNT(*) as count FROM subscriptions WHERE paymentMethod = 'إعفاء'");
    return Number(r.rows[0].count);
  },

  async getStatusBreakdown() {
    const db = getConnection();
    const r = await db.query('SELECT status, COUNT(*) as count FROM subscriptions GROUP BY status ORDER BY status');
    return r.rows.map(row => ({ status: row.status, count: Number(row.count) }));
  },

  async getTypeBreakdown() {
    const db = getConnection();
    const r = await db.query('SELECT type, COUNT(*) as count FROM subscriptions GROUP BY type ORDER BY count DESC');
    return r.rows.map(row => ({ type: row.type, count: Number(row.count) }));
  },

  async expireOverdue() {
    const db = getConnection();
    const today = hijri.todayHijri();
    const r = await db.query(
      'UPDATE subscriptions SET status = $1 WHERE status = $2 AND endDate < $3',
      ['منتهي', 'نشط', today]
    );
    return r.rowCount;
  }
};

module.exports = SubscriptionRepo;
