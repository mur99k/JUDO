const { getConnection } = require('../database/connection');

const AttendanceRepo = {
  async findByDate(date) {
    const db = getConnection();
    const r = await db.query(`
      SELECT a.*, s.fullName, s.photo
      FROM attendance a
      JOIN students s ON a.studentId = s.id
      WHERE a.date = $1
      ORDER BY s.fullName
    `, [date]);
    return r.rows;
  },

  async findByStudentAndDate(studentId, date) {
    const db = getConnection();
    const r = await db.query(
      'SELECT * FROM attendance WHERE studentId = $1 AND date = $2',
      [studentId, date]
    );
    return r.rows[0] || null;
  },

  async upsert(studentId, date, status, notes) {
    const db = getConnection();
    const existing = await this.findByStudentAndDate(studentId, date);
    if (existing) {
      await db.query(
        'UPDATE attendance SET status = $1, notes = $2 WHERE id = $3',
        [status, notes || null, existing.id]
      );
      return true;
    }
    await db.query(
      'INSERT INTO attendance (studentId, date, status, notes) VALUES ($1, $2, $3, $4)',
      [studentId, date, status, notes || null]
    );
    return true;
  },

  async getMonthlySummary(studentId, month, year) {
    const db = getConnection();
    const monthStr = String(month).padStart(2, '0');
    const start = `${year}-${monthStr}-01`;
    const end = `${year}-${monthStr}-31`;
    const r = await db.query(`
      SELECT status, COUNT(*) as count
      FROM attendance
      WHERE studentId = $1 AND date BETWEEN $2 AND $3
      GROUP BY status
    `, [studentId, start, end]);
    return r.rows;
  },

  async getStudentRate(studentId) {
    const db = getConnection();
    const total = Number((await db.query(
      'SELECT COUNT(*) as count FROM attendance WHERE studentId = $1', [studentId]
    )).rows[0].count);
    const present = Number((await db.query(
      'SELECT COUNT(*) as count FROM attendance WHERE studentId = $1 AND status = $2', [studentId, 'حاضر']
    )).rows[0].count);
    return { total, present, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
  },

  async getTodayCount() {
    const db = getConnection();
    const today = new Date().toISOString().split('T')[0];
    const r = await db.query(
      'SELECT COUNT(*) as count FROM attendance WHERE date = $1 AND status = $2', [today, 'حاضر']
    );
    return Number(r.rows[0].count);
  },

  async getMonthlyAttendance(month, year) {
    const db = getConnection();
    const monthStr = String(month).padStart(2, '0');
    const r = await db.query(`
      SELECT a.*, s.fullName
      FROM attendance a
      JOIN students s ON a.studentId = s.id
      WHERE a.date LIKE $1
      ORDER BY a.date, s.fullName
    `, [`${year}-${monthStr}%`]);
    return r.rows;
  },

  async getMonthlyGrid(month, year) {
    const db = getConnection();
    const monthStr = String(month).padStart(2, '0');
    const r = await db.query(`
      SELECT a.studentId, a.date, a.status
      FROM attendance a
      WHERE a.date LIKE $1
    `, [`${year}-${monthStr}%`]);
    const records = r.rows;
    const students = (await db.query('SELECT id, fullName FROM students ORDER BY fullName')).rows;
    const daysInMonth = new Date(year || new Date().getFullYear(), month, 0).getDate();
    const grid = {};
    const stats = { present: 0, absent: 0, excused: 0 };
    for (const rec of records) {
      if (!grid[rec.studentId]) grid[rec.studentId] = {};
      grid[rec.studentId][rec.date] = rec.status;
      if (rec.status === 'حاضر') stats.present++;
      else if (rec.status === 'غائب') stats.absent++;
      else if (rec.status === 'معذر') stats.excused++;
    }
    return { students, daysInMonth, grid, stats };
  },

  async getStudentReport(studentId, startDate, endDate) {
    const db = getConnection();
    const r = await db.query(`
      SELECT a.date, a.status, a.notes
      FROM attendance a
      WHERE a.studentId = $1 AND a.date BETWEEN $2 AND $3
      ORDER BY a.date
    `, [studentId, startDate, endDate]);
    const records = r.rows;
    const sums = (await db.query(`
      SELECT status, COUNT(*) as count
      FROM attendance
      WHERE studentId = $1 AND date BETWEEN $2 AND $3
      GROUP BY status
    `, [studentId, startDate, endDate])).rows;
    let present = 0, absent = 0, excused = 0;
    for (const s of sums) {
      if (s.status === 'حاضر') present = Number(s.count);
      else if (s.status === 'غائب') absent = Number(s.count);
      else if (s.status === 'معذر') excused = Number(s.count);
    }
    const total = present + absent + excused;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { records, present, absent, excused, total, rate };
  },

  async getStudentAllTimeStats(studentId) {
    const db = getConnection();
    const sums = (await db.query(
      'SELECT status, COUNT(*) as count FROM attendance WHERE studentId = $1 GROUP BY status', [studentId]
    )).rows;
    let present = 0, absent = 0, excused = 0, total = 0;
    for (const s of sums) {
      const c = Number(s.count);
      total += c;
      if (s.status === 'حاضر') present = c;
      else if (s.status === 'غائب') absent = c;
      else if (s.status === 'معذر') excused = c;
    }
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    const first = (await db.query('SELECT MIN(date) as d FROM attendance WHERE studentId = $1', [studentId])).rows[0];
    const last = (await db.query('SELECT MAX(date) as d FROM attendance WHERE studentId = $1', [studentId])).rows[0];
    return { present, absent, excused, total, rate, firstDate: first ? first.d : null, lastDate: last ? last.d : null };
  }
};

module.exports = AttendanceRepo;
