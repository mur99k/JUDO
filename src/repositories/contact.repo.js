const { getConnection } = require('../database/connection');

const ContactRepo = {
  create(data) {
    return getConnection().prepare(
      'INSERT INTO contact_messages (name, phone, message) VALUES (?, ?, ?)'
    ).run(data.name, data.phone || null, data.message || null);
  },

  findAll() {
    return getConnection().prepare(
      'SELECT * FROM contact_messages ORDER BY createdAt DESC'
    ).all();
  }
};

module.exports = ContactRepo;
