const SettingsRepo = require('../repositories/settings.repo');

const SettingsService = {
  async getAll() {
    return SettingsRepo.getAll();
  },

  async update(data) {
    await SettingsRepo.setMultiple(data);
    return SettingsRepo.getAll();
  }
};

module.exports = SettingsService;
