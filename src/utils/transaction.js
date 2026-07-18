const { getConnection } = require('../database/connection');

async function withTransaction(fn) {
  const db = getConnection();
  return db.transaction(fn);
}

module.exports = { withTransaction };
