const { getConnection } = require('../database/connection');

const ContactRepo = {
  async create(data) {
    const db = getConnection();
    await db.query(
      'INSERT INTO contact_messages (name, phone, message) VALUES ($1, $2, $3)',
      [data.name, data.phone || null, data.message || null]
    );
  }
};

module.exports = ContactRepo;
