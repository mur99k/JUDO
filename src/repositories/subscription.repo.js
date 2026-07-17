const { getConnection } = require('../database/connection');

const SubscriptionRepo = {
  findAll(filters = {}) {
    let sql = `
      SELECT sub.*, s.fullName as studentName,
        CASE WHEN sub.status != 'نشط' THEN 0 ELSE CAST(julianday(sub.endDate) - julianday('now','localtime') AS INTEGER) END as remainingDays
      FROM subscriptions sub
      JOIN students s ON sub.studentId = s.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.status) { sql += ' AND sub.status = ?'; params.push(filters.status); }
    if (filters.studentId) { sql += ' AND sub.studentId = ?'; params.push(filters.studentId); }
    sql += ' ORDER BY sub.createdAt DESC';
    return getConnection().prepare(sql).all(...params);
  },

  findById(id) {
    return getConnection().prepare(`
      SELECT sub.*, s.fullName as studentName,
        CASE WHEN sub.status != 'نشط' THEN 0 ELSE CAST(julianday(sub.endDate) - julianday('now','localtime') AS INTEGER) END as remainingDays
      FROM subscriptions sub
      JOIN students s ON sub.studentId = s.id
      WHERE sub.id = ?
    `).get(id);
  },

  create(data) {
    const stmt = getConnection().prepare(
      `INSERT INTO subscriptions (studentId, type, days, amount, startDate, endDate, status, paymentMethod, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.studentId, data.type, data.days, data.amount,
      data.startDate, data.endDate, data.status || 'نشط',
      data.paymentMethod || null, data.notes || null
    );
    return { id: result.lastInsertRowid };
  },

  update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['type', 'days', 'amount', 'startDate', 'endDate', 'status', 'paymentMethod', 'notes'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return null;
    values.push(id);
    return getConnection().prepare(`UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  delete(id) {
    return getConnection().prepare('DELETE FROM subscriptions WHERE id = ?').run(id);
  },

  getActiveCount() {
    return getConnection().prepare(
      "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'نشط'"
    ).get().count;
  },

  getTotalRevenue() {
    const row = getConnection().prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM subscriptions WHERE status != 'ملغي'"
    ).get();
    return row.total;
  },

  getMonthlyRevenue(year) {
    return getConnection().prepare(`
      SELECT strftime('%m', startDate) as month, COALESCE(SUM(amount), 0) as total
      FROM subscriptions
      WHERE strftime('%Y', startDate) = ? AND status != 'ملغي'
      GROUP BY month
      ORDER BY month
    `).all(String(year));
  },

  expireOverdue() {
    return getConnection().prepare(`
      UPDATE subscriptions
      SET status = 'منتهي'
      WHERE status = 'نشط' AND endDate < date('now','localtime')
    `).run().changes;
  }
};

module.exports = SubscriptionRepo;
