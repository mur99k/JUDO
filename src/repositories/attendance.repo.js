const { getConnection } = require('../database/connection');

const AttendanceRepo = {
  findByDate(date) {
    return getConnection().prepare(`
      SELECT a.*, s.fullName, s.photo
      FROM attendance a
      JOIN students s ON a.studentId = s.id
      WHERE a.date = ?
      ORDER BY s.fullName
    `).all(date);
  },

  findByStudentAndDate(studentId, date) {
    return getConnection().prepare(
      'SELECT * FROM attendance WHERE studentId = ? AND date = ?'
    ).get(studentId, date);
  },

  upsert(studentId, date, status, notes) {
    const existing = this.findByStudentAndDate(studentId, date);
    if (existing) {
      return getConnection().prepare(
        'UPDATE attendance SET status = ?, notes = ? WHERE id = ?'
      ).run(status, notes || null, existing.id);
    }
    return getConnection().prepare(
      'INSERT INTO attendance (studentId, date, status, notes) VALUES (?, ?, ?, ?)'
    ).run(studentId, date, status, notes || null);
  },

  getMonthlySummary(studentId, month, year) {
    const monthStr = String(month).padStart(2, '0');
    const start = `${year}-${monthStr}-01`;
    const end = `${year}-${monthStr}-31`;
    return getConnection().prepare(`
      SELECT status, COUNT(*) as count
      FROM attendance
      WHERE studentId = ? AND date BETWEEN ? AND ?
      GROUP BY status
    `).all(studentId, start, end);
  },

  getStudentRate(studentId) {
    const total = getConnection().prepare(
      'SELECT COUNT(*) as count FROM attendance WHERE studentId = ?'
    ).get(studentId).count;
    const present = getConnection().prepare(
      'SELECT COUNT(*) as count FROM attendance WHERE studentId = ? AND status = ?'
    ).get(studentId, 'حاضر').count;
    return { total, present, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
  },

  getTodayCount() {
    const today = new Date().toISOString().split('T')[0];
    return getConnection().prepare(
      'SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = ?'
    ).get(today, 'حاضر').count;
  },

  getMonthlyAttendance(month, year) {
    const monthStr = String(month).padStart(2, '0');
    return getConnection().prepare(`
      SELECT a.*, s.fullName
      FROM attendance a
      JOIN students s ON a.studentId = s.id
      WHERE a.date LIKE ?
      ORDER BY a.date, s.fullName
    `).all(`${year}-${monthStr}%`);
  },

  getMonthlyGrid(month, year) {
    const monthStr = String(month).padStart(2, '0');
    const records = getConnection().prepare(`
      SELECT a.studentId, a.date, a.status
      FROM attendance a
      WHERE a.date LIKE ?
    `).all(`${year}-${monthStr}%`);
    const students = getConnection().prepare(
      'SELECT id, fullName FROM students ORDER BY fullName'
    ).all();
    const daysInMonth = new Date(year || new Date().getFullYear(), month, 0).getDate();
    const grid = {};
    const stats = { present: 0, absent: 0, excused: 0 };
    for (const r of records) {
      if (!grid[r.studentId]) grid[r.studentId] = {};
      grid[r.studentId][r.date] = r.status;
      if (r.status === 'حاضر') stats.present++;
      else if (r.status === 'غائب') stats.absent++;
      else if (r.status === 'معذر') stats.excused++;
    }
    return { students, daysInMonth, grid, stats };
  },

  getStudentReport(studentId, startDate, endDate) {
    const records = getConnection().prepare(`
      SELECT a.date, a.status, a.notes
      FROM attendance a
      WHERE a.studentId = ? AND a.date BETWEEN ? AND ?
      ORDER BY a.date
    `).all(studentId, startDate, endDate);
    const sums = getConnection().prepare(`
      SELECT status, COUNT(*) as count
      FROM attendance
      WHERE studentId = ? AND date BETWEEN ? AND ?
      GROUP BY status
    `).all(studentId, startDate, endDate);
    var present = 0, absent = 0, excused = 0;
    for (var i=0; i<sums.length; i++) {
      if (sums[i].status === 'حاضر') present = sums[i].count;
      else if (sums[i].status === 'غائب') absent = sums[i].count;
      else if (sums[i].status === 'معذر') excused = sums[i].count;
    }
    const total = present + absent + excused;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { records, present, absent, excused, total, rate };
  },

  getStudentAllTimeStats(studentId) {
    const sums = getConnection().prepare(`
      SELECT status, COUNT(*) as count
      FROM attendance WHERE studentId = ? GROUP BY status
    `).all(studentId);
    var present = 0, absent = 0, excused = 0, total = 0;
    for (var i=0; i<sums.length; i++) {
      total += sums[i].count;
      if (sums[i].status === 'حاضر') present = sums[i].count;
      else if (sums[i].status === 'غائب') absent = sums[i].count;
      else if (sums[i].status === 'معذر') excused = sums[i].count;
    }
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    const first = getConnection().prepare(
      'SELECT MIN(date) as d FROM attendance WHERE studentId = ?'
    ).get(studentId);
    const last = getConnection().prepare(
      'SELECT MAX(date) as d FROM attendance WHERE studentId = ?'
    ).get(studentId);
    return { present, absent, excused, total, rate, firstDate: first ? first.d : null, lastDate: last ? last.d : null };
  }
};

module.exports = AttendanceRepo;
