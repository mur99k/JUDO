const AttendanceRepo = require('../repositories/attendance.repo');
const StudentRepo = require('../repositories/student.repo');
const { today } = require('../utils/date');

const AttendanceService = {
  getByDate(date) {
    date = date || today();
    const students = StudentRepo.findAll({ status: 'نشط' });
    const records = AttendanceRepo.findByDate(date);
    const recordMap = {};
    for (const r of records) { recordMap[r.studentId] = r; }
    const result = [];
    for (const s of students) {
      const rec = recordMap[s.id];
      result.push({
        studentId: s.id,
        studentName: s.fullName,
        nationalId: s.nationalId,
        status: rec ? rec.status : null,
        notes: rec ? rec.notes : null,
        date: date
      });
    }
    return result;
  },

  getToday() {
    return this.getByDate(today());
  },

  save(records) {
    for (const rec of records) {
      AttendanceRepo.upsert(rec.studentId, rec.date, rec.status, rec.notes);
    }
  },

  getSummary(month, year) {
    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();
    return AttendanceRepo.getMonthlyAttendance(m, y);
  },

  getStudentRate(studentId) {
    return AttendanceRepo.getStudentRate(studentId);
  },

  getDashboardStats() {
    const todayCount = AttendanceRepo.getTodayCount();
    return { todayCount };
  },

  getMonthlyGrid(month, year) {
    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();
    return AttendanceRepo.getMonthlyGrid(m, y);
  },

  getStudentReport(studentId, startDate, endDate) {
    return AttendanceRepo.getStudentReport(studentId, startDate, endDate);
  },

  getStudentAllTimeStats(studentId) {
    return AttendanceRepo.getStudentAllTimeStats(studentId);
  }
};

module.exports = AttendanceService;