const { success } = require('../utils/response');
const ReportService = require('../services/report.service');

const ReportController = {
  async dashboard(req, res, next) {
    try {
      const data = await ReportService.getDashboard();
      return success(res, data);
    } catch (err) {
      next(err);
    }
  },

  async students(req, res, next) {
    try {
      const data = await ReportService.getStudentStats();
      return success(res, data);
    } catch (err) {
      next(err);
    }
  },

  async subscriptions(req, res, next) {
    try {
      const data = await ReportService.getSubscriptionStats();
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ReportController;
