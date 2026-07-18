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
      const { fullName, nationalId, age, phone, parentPhone, category, status } = req.body;
      if (!fullName) return error(res, 'اسم الطالب مطلوب');
      var data = { fullName, nationalId, age, phone, parentPhone, status };
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
