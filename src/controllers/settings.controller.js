const { success } = require('../utils/response');
const SettingsService = require('../services/settings.service');

const SettingsController = {
  async get(req, res, next) {
    try {
      const settings = await SettingsService.getAll();
      return success(res, { settings });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const settings = SettingsService.update(req.body);
      return success(res, { settings });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = SettingsController;
