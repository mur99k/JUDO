const { getConnection } = require('../database/connection');

const UserRepo = {
  async findByEmail(email, conn) {
    const db = conn || getConnection();
    const r = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return r.rows[0] || null;
  },

  async findById(id, conn) {
    const db = conn || getConnection();
    const r = await db.query('SELECT id, fullName, email, phone, profileImage, role, createdAt FROM users WHERE id = $1', [id]);
    return r.rows[0] || null;
  },

  async findByRole(role) {
    const db = getConnection();
    const r = await db.query('SELECT id, fullName, email, phone, profileImage, role, createdAt FROM users WHERE role = $1 ORDER BY createdAt ASC', [role]);
    return r.rows;
  },

  async create(data, conn) {
    const db = conn || getConnection();
    const hasImage = data.profileImage !== undefined && data.profileImage !== null;
    const sql = hasImage
      ? 'INSERT INTO users (fullName, email, phone, password, role, profileImage) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id'
      : 'INSERT INTO users (fullName, email, phone, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    const params = hasImage
      ? [data.fullName, data.email, data.phone, data.password, data.role, data.profileImage]
      : [data.fullName, data.email, data.phone, data.password, data.role];
    const r = await db.query(sql, params);
    return { id: r.lastId || (r.rows[0] && r.rows[0].id) };
  },

  async delete(id, conn) {
    const db = conn || getConnection();
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  },

  async updateProfile(id, data, conn) {
    const db = conn || getConnection();
    const fields = [];
    const values = [];
    if (data.fullName !== undefined) { fields.push('fullName = $' + (fields.length + 1)); values.push(data.fullName); }
    if (data.email !== undefined) { fields.push('email = $' + (fields.length + 1)); values.push(data.email); }
    if (data.phone !== undefined) { fields.push('phone = $' + (fields.length + 1)); values.push(data.phone); }
    if (data.profileImage !== undefined) { fields.push('profileImage = $' + (fields.length + 1)); values.push(data.profileImage); }
    if (fields.length === 0) return null;
    values.push(id);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length}`, values);
    return true;
  },

  async updatePassword(id, hash, conn) {
    const db = conn || getConnection();
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, id]);
  }
};

module.exports = UserRepo;
