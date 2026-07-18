const fs = require('fs');
const StudentRepo = require('../repositories/student.repo');
const AttendanceRepo = require('../repositories/attendance.repo');
const SubscriptionRepo = require('../repositories/subscription.repo');
const storage = require('../storage');
const { NotFoundError } = require('../utils/errors');
const { withTransaction } = require('../utils/transaction');

async function persistPhoto(file) {
  if (!file) return null;
  const key = 'students/' + file.filename;
  const buffer = fs.readFileSync(file.path);
  try {
    const { url } = await storage.upload(key, buffer, file.mimetype);
    try { fs.unlinkSync(file.path); } catch {}
    return storage.normalizeDbValue(url);
  } catch (err) {
    console.error('R2 upload failed (falling back to local):', err.message);
    return '/uploads/' + file.filename;
  }
}

const StudentService = {
  async list(filters) {
    return StudentRepo.findAll(filters);
  },

  async getById(id) {
    const student = await StudentRepo.findById(id);
    if (!student) throw new NotFoundError('الطالب غير موجود');
    student.photo = storage.normalizeDbValue(student.photo);
    const attendance = await AttendanceRepo.getStudentRate(id);
    const subs = await SubscriptionRepo.findAll({ studentId: id });
    return { ...student, attendance, subscriptions: subs };
  },

  async create(data) {
    return withTransaction(async (conn) => {
      return StudentRepo.create(data, conn);
    });
  },

  async update(id, data, file) {
    const student = await StudentRepo.findById(id);
    if (!student) throw new NotFoundError('الطالب غير موجود');
    if (file) data.photo = await persistPhoto(file);
    await StudentRepo.update(id, data);
    const updated = await StudentRepo.findById(id);
    updated.photo = storage.normalizeDbValue(updated.photo);
    return updated;
  },

  async delete(id) {
    return withTransaction(async (conn) => {
      const student = await StudentRepo.findById(id, conn);
      if (!student) throw new NotFoundError('الطالب غير موجود');
      await StudentRepo.delete(id, conn);
      if (student.photo) { try { await storage.remove(storage.keyFromUrl(student.photo)); } catch {} }
    });
  },

  async resetPassword(id) {
    const student = await StudentRepo.findById(id);
    if (!student) throw new NotFoundError('الطالب غير موجود');
    const defaultPassword = student.nationalId || 'student123';
    const hash = require('bcryptjs').hashSync(defaultPassword, 10);
    await StudentRepo.updatePassword(id, hash);
    return defaultPassword;
  },

  async getStats() {
    const total = await StudentRepo.count();
    const active = await StudentRepo.count({ status: 'نشط' });
    const inactive = total - active;
    return { total, active, inactive };
  }
};

module.exports = StudentService;
