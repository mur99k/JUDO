const { success, error } = require('../utils/response');
const CoachService = require('../services/coach.service');

const CoachController = {
  async list(req, res, next) {
    try {
      const coaches = await CoachService.list();
      return success(res, { coaches });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const coach = await CoachService.getById(req.params.id);
      return success(res, { coach });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { fullName, email, password, phone } = req.body;
      if (!fullName || !email || !password) return error(res, 'الاسم والبريد وكلمة المرور مطلوبة');
      const coach = await CoachService.create({ fullName, email, password, phone }, req.file);
      return success(res, { id: coach.id });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const { fullName, email, phone, password } = req.body;
      const coach = await CoachService.update(req.params.id, { fullName, email, phone, password }, req.file);
      return success(res, { coach });
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await CoachService.delete(req.params.id);
      return success(res);
    } catch (err) { next(err); }
  }
};

module.exports = CoachController;
