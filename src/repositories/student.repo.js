const { getConnection } = require('../database/connection');

// Explicit column list — never SELECT * so the password column is never
// returned to clients (it exists only for schema compatibility).
const COLUMNS = 'id, fullName, nationalId, age, phone, parentPhone, photo, status, createdAt, updatedAt, category';

const StudentRepo = {
  async findAll(filters = {}) {
    const db = getConnection();
    let sql = `SELECT ${COLUMNS} FROM students WHERE 1=1`;
    const params = [];
    if (filters.search) {
      sql += ' AND (fullName LIKE $' + (params.length + 1) + ' OR nationalId LIKE $' + (params.length + 1) + ' OR phone LIKE $' + (params.length + 1) + ')';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    if (filters.status) {
      sql += ' AND status = $' + (params.length + 1);
      params.push(filters.status);
    }
    if (filters.category) {
      sql += ' AND category = $' + (params.length + 1);
      params.push(filters.category);
    }
    sql += ' ORDER BY createdAt DESC';
    const limit = parseInt(filters.limit) || 1000;
    const page = Math.max(1, parseInt(filters.page) || 1);
    const offset = (page - 1) * limit;
    sql += ` LIMIT ${limit}`;
    if (offset > 0) sql += ` OFFSET ${offset}`;
    const r = await db.query(sql, params);
    return r.rows;
  },

  async findById(id, conn) {
    const db = conn || getConnection();
    const r = await db.query(`SELECT ${COLUMNS} FROM students WHERE id = $1`, [id]);
    return r.rows[0] || null;
  },

  async findByNationalId(nationalId, conn) {
    const db = conn || getConnection();
    const r = await db.query(`SELECT ${COLUMNS} FROM students WHERE nationalId = $1`, [nationalId]);
    return r.rows[0] || null;
  },

  async findByNationalIdWithPassword(nationalId, conn) {
    const db = conn || getConnection();
    const r = await db.query('SELECT * FROM students WHERE nationalId = $1', [nationalId]);
    return r.rows[0] || null;
  },

  async create(data, conn) {
    const db = conn || getConnection();
    const r = await db.query(
      'INSERT INTO students (fullName, nationalId, age, phone, parentPhone, photo, password, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [data.fullName, data.nationalId, data.age || null, data.phone || null,
       data.parentPhone || null, data.photo || null, data.password || null, data.category || null]
    );
    return { id: r.lastId || (r.rows[0] && r.rows[0].id) };
  },

  async update(id, data) {
    const db = getConnection();
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && key !== 'id') {
        fields.push(`${key} = $${fields.length + 1}`);
        values.push(val);
      }
    }
    if (fields.length === 0) return null;
    fields.push('updatedAt = NOW()');
    values.push(id);
    await db.query(`UPDATE students SET ${fields.join(', ')} WHERE id = $${values.length}`, values);
    return true;
  },

  async delete(id, conn) {
    const db = conn || getConnection();
    await db.query('DELETE FROM students WHERE id = $1', [id]);
  },

  async getStatusBreakdown() {
    const db = getConnection();
    const r = await db.query('SELECT status, COUNT(*) as count FROM students GROUP BY status ORDER BY status');
    return r.rows.map(row => ({ status: row.status, count: Number(row.count) }));
  },

  async getCategoryBreakdown() {
    const db = getConnection();
    const r = await db.query('SELECT COALESCE(category, \'بدون تصنيف\') as category, COUNT(*) as count FROM students GROUP BY category ORDER BY count DESC');
    return r.rows.map(row => ({ category: row.category, count: Number(row.count) }));
  },

  async count(filters = {}) {
    const db = getConnection();
    let sql = 'SELECT COUNT(*) as count FROM students WHERE 1=1';
    const params = [];
    if (filters.status) {
      sql += ' AND status = $' + (params.length + 1);
      params.push(filters.status);
    }
    const r = await db.query(sql, params);
    return Number(r.rows[0].count);
  },

  async updatePassword(id, hashedPassword, conn) {
    const db = conn || getConnection();
    await db.query('UPDATE students SET password = $1, updatedAt = NOW() WHERE id = $2', [hashedPassword, id]);
  },
};

module.exports = StudentRepo;
