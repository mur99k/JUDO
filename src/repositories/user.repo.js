const { getConnection } = require('../database/connection');

const UserRepo = {
  findByEmail(email) {
    return getConnection().prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findById(id) {
    return getConnection().prepare('SELECT id, fullName, email, phone, profileImage, role, createdAt FROM users WHERE id = ?').get(id);
  },

  findByRole(role) {
    return getConnection().prepare('SELECT id, fullName, email, phone, profileImage, role, createdAt FROM users WHERE role = ? ORDER BY createdAt DESC').all(role);
  },

  create(data) {
    const stmt = getConnection().prepare(
      'INSERT INTO users (fullName, email, phone, password, role) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(data.fullName, data.email, data.phone, data.password, data.role);
    return { id: result.lastInsertRowid, ...data };
  },

  delete(id) {
    return getConnection().prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  updateProfile(id, data) {
    const fields = [];
    const values = [];
    if (data.fullName !== undefined) { fields.push('fullName = ?'); values.push(data.fullName); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.profileImage !== undefined) { fields.push('profileImage = ?'); values.push(data.profileImage); }
    if (fields.length === 0) return null;
    values.push(id);
    return getConnection().prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  updatePassword(id, hash) {
    return getConnection().prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, id);
  }
};

module.exports = UserRepo;
