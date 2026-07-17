const { getConnection } = require('../database/connection');

const StudentRepo = {
  findAll(filters = {}) {
    let sql = 'SELECT * FROM students WHERE 1=1';
    const params = [];
    if (filters.search) {
      sql += ' AND (fullName LIKE ? OR nationalId LIKE ? OR phone LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    sql += ' ORDER BY createdAt DESC';
    const limit = parseInt(filters.limit) || 1000; // default no limit
    const page = Math.max(1, parseInt(filters.page) || 1);
    const offset = (page - 1) * limit;
    sql += ` LIMIT ${limit}`;
    if (offset > 0) sql += ` OFFSET ${offset}`;
    return getConnection().prepare(sql).all(...params);
  },

  countAll(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM students WHERE 1=1';
    const params = [];
    if (filters.search) {
      sql += ' AND (fullName LIKE ? OR nationalId LIKE ? OR phone LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    return getConnection().prepare(sql).get(...params).count;
  },

  findById(id) {
    return getConnection().prepare('SELECT * FROM students WHERE id = ?').get(id);
  },

  findByNationalId(nationalId) {
    return getConnection().prepare('SELECT * FROM students WHERE nationalId = ?').get(nationalId);
  },

  create(data) {
    const stmt = getConnection().prepare(
      'INSERT INTO students (fullName, nationalId, age, phone, parentPhone, photo, password, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      data.fullName, data.nationalId, data.age || null,
      data.phone || null, data.parentPhone || null,
      data.photo || null, data.password || null, data.category || null
    );
    return { id: result.lastInsertRowid };
  },

  update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length === 0) return null;
    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);
    return getConnection().prepare(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  delete(id) {
    return getConnection().prepare('DELETE FROM students WHERE id = ?').run(id);
  },

  count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM students WHERE 1=1';
    const params = [];
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    return getConnection().prepare(sql).get(...params).count;
  }
};

module.exports = StudentRepo;
