const fs = require('fs');
const StudentRepo = require('../repositories/student.repo');
const AttendanceRepo = require('../repositories/attendance.repo');
const SubscriptionRepo = require('../repositories/subscription.repo');
const storage = require('../storage');
const { NotFoundError } = require('../utils/errors');

async function persistPhoto(file) {
  if (!file) return null;
  const key = 'students/' + file.filename;
  const buffer = fs.readFileSync(file.path);
  const { url } = await storage.upload(key, buffer, file.mimetype);
  try { fs.unlinkSync(file.path); } catch {}
  return storage.normalizeDbValue(url);
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
    return StudentRepo.create(data);
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
    const student = await StudentRepo.findById(id);
    if (!student) throw new NotFoundError('الطالب غير موجود');
    if (student.photo) { try { await storage.remove(storage.keyFromUrl(student.photo)); } catch {} }
    await StudentRepo.delete(id);
  },

  async getStats() {
    const total = await StudentRepo.count();
    const active = await StudentRepo.count({ status: 'نشط' });
    const inactive = total - active;
    return { total, active, inactive };
  }
};

module.exports = StudentService;
