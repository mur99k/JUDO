const SettingsRepo = require('../repositories/settings.repo');

const SettingsService = {
  getAll() {
    return SettingsRepo.getAll();
  },

  update(data) {
    SettingsRepo.setMultiple(data);
    return SettingsRepo.getAll();
  }
};

module.exports = SettingsService;
