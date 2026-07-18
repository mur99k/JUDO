const { success, error } = require('../utils/response');
const StudentService = require('../services/student.service');

const StudentController = {
  async list(req, res, next) {
    try {
      const { search, status, category, page, limit } = req.query;
      const filters = { search, status, category };
      if (limit) filters.limit = limit;
      if (page) filters.page = page;
      const students = await StudentService.list(filters);
      return success(res, { students });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const student = await StudentService.getById(req.params.id);
      return success(res, { student });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { fullName, nationalId, age, phone, parentPhone, category, status, password } = req.body;
      if (!fullName) return error(res, 'اسم الطالب مطلوب');
      const pwd = password || nationalId;
      if (!pwd || pwd.length < 6) return error(res, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      const hashedPassword = require('bcryptjs').hashSync(pwd, 10);
      var data = { fullName, nationalId, age, phone, parentPhone, status, password: hashedPassword };
      if (req.session.role === 'admin') data.category = category;
      const result = await StudentService.create(data);
      return success(res, { id: result.id });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { fullName, nationalId, age, phone, parentPhone, category, status } = req.body;
      const data = { fullName, nationalId, age, phone, parentPhone, status };
      if (req.session.role === 'admin') data.category = category;
      const student = await StudentService.update(req.params.id, data, req.file);
      return success(res, { student });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const newPassword = await StudentService.resetPassword(req.params.id);
      return success(res, { password: newPassword });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await StudentService.delete(req.params.id);
      return success(res);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = StudentController;
