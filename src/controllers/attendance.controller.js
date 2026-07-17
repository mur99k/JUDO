const { success, error } = require('../utils/response');
const AttendanceService = require('../services/attendance.service');

const AttendanceController = {
  async getByDate(req, res, next) {
    try {
      const { date } = req.query;
      const records = AttendanceService.getByDate(date);
      return success(res, { records });
    } catch (err) {
      next(err);
    }
  },

  async getToday(req, res, next) {
    try {
      const records = AttendanceService.getToday();
      const today = require('../utils/date').today();
      return success(res, { records, date: today });
    } catch (err) {
      next(err);
    }
  },

  async save(req, res, next) {
    try {
      const { records } = req.body;
      if (!records || !records.length) return error(res, 'بيانات الحضور مطلوبة');
      AttendanceService.save(records);
      return success(res, { count: records.length });
    } catch (err) {
      next(err);
    }
  },

  async getSummary(req, res, next) {
    try {
      const { month, year } = req.query;
      const summary = AttendanceService.getSummary(month, year);
      const m = month || (new Date().getMonth() + 1).toString();
      const y = year || new Date().getFullYear().toString();
      return success(res, { summary, month: m, year: y });
    } catch (err) {
      next(err);
    }
  },

  async getMonthlyGrid(req, res, next) {
    try {
      const { month, year } = req.query;
      const data = AttendanceService.getMonthlyGrid(month, year);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getStudentReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return error(res, 'تاريخ البداية والنهاية مطلوبان');
      }
      const data = AttendanceService.getStudentReport(req.params.studentId, startDate, endDate);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getStudentAllTimeStats(req, res, next) {
    try {
      const data = AttendanceService.getStudentAllTimeStats(req.params.studentId);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AttendanceController;
