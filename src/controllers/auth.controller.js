const { success, error } = require('../utils/response');
const AuthService = require('../services/auth.service');
const storage = require('../storage');
const fs = require('fs');

const AuthController = {
  async login(req, res, next) {
    try {
      const { email, password, nationalId } = req.body;

      if (email && password) {
        const user = await AuthService.loginAdmin(email, password);
        req.session.userId = user.id;
        req.session.userName = user.name;
        req.session.role = user.role;
        return success(res, { role: user.role, user });
      }

      if (nationalId) {
        const student = await AuthService.loginStudent(nationalId);
        req.session.userId = student.id;
        req.session.userName = student.name;
        req.session.role = 'student';
        return success(res, { role: 'student', user: student });
      }

      return error(res, 'بيانات الدخول مطلوبة');
    } catch (err) {
      next(err);
    }
  },

  async register(req, res, next) {
    try {
      const { fullName, nationalId, age, phone, parentPhone } = req.body;
      var photo = null;
      if (req.file) {
        const key = 'students/' + req.file.filename;
        const buffer = fs.readFileSync(req.file.path);
        const uploaded = await storage.upload(key, buffer, req.file.mimetype);
        try { fs.unlinkSync(req.file.path); } catch {}
        photo = storage.normalizeDbValue(uploaded.url);
      }
      const student = await AuthService.registerStudent({ fullName, nationalId, age, phone, parentPhone, photo });
      req.session.userId = student.id;
      req.session.userName = student.name;
      req.session.role = 'student';
      return success(res, { role: 'student', user: student });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      req.session.destroy();
      return success(res);
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const userId = req.session.userId;
      if (!userId) return error(res, 'غير مصرح', 401);
      if (req.session.role === 'admin' || req.session.role === 'coach') {
        const user = await require('../repositories/user.repo').findById(userId);
        if (!user) return error(res, 'المستخدم غير موجود', 404);
        return success(res, { user });
      }
      const student = await require('../repositories/student.repo').findById(userId);
      if (!student) return error(res, 'الطالب غير موجود', 404);
      student.photo = storage.normalizeDbValue(student.photo);
      const AttendanceService = require('../services/attendance.service');
      const SubscriptionService = require('../services/subscription.service');
      const rate = await AttendanceService.getStudentRate(userId);
      const subs = await SubscriptionService.list({ studentId: userId });
      return success(res, {
        user: { ...student, role: 'student' },
        attendance: rate,
        subscriptions: subs || []
      });
    } catch (err) {
      next(err);
    }
  },

  async contact(req, res, next) {
    try {
      const { name, phone, message } = req.body;
      if (!name || !message) return error(res, 'الاسم والرسالة مطلوبان');
      await require('../repositories/contact.repo').create({ name, phone, message });
      return success(res);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { fullName, email, phone, parentPhone } = req.body;
      const user = await AuthService.updateProfile(req.session.userId, { fullName, email, phone, parentPhone }, req.file);
      if (fullName) req.session.userName = fullName;
      return success(res, { user });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.session.userId, currentPassword, newPassword);
      return success(res);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AuthController;
