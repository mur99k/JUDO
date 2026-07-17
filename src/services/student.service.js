const StudentRepo = require('../repositories/student.repo');
const AttendanceRepo = require('../repositories/attendance.repo');
const SubscriptionRepo = require('../repositories/subscription.repo');
const { NotFoundError } = require('../utils/errors');

const StudentService = {
  list(filters) {
    return StudentRepo.findAll(filters);
  },

  getById(id) {
    const student = StudentRepo.findById(id);
    if (!student) throw new NotFoundError('الطالب غير موجود');
    const attendance = AttendanceRepo.getStudentRate(id);
    const subs = SubscriptionRepo.findAll({ studentId: id });
    return { ...student, attendance, subscriptions: subs };
  },

  create(data) {
    return StudentRepo.create(data);
  },

  update(id, data, file) {
    const student = StudentRepo.findById(id);
    if (!student) throw new NotFoundError('الطالب غير موجود');
    if (file) data.photo = '/uploads/students/' + file.filename;
    StudentRepo.update(id, data);
    return StudentRepo.findById(id);
  },

  delete(id) {
    const student = StudentRepo.findById(id);
    if (!student) throw new NotFoundError('الطالب غير موجود');
    StudentRepo.delete(id);
  },

  getStats() {
    const total = StudentRepo.count();
    const active = StudentRepo.count({ status: 'نشط' });
    const inactive = total - active;
    return { total, active, inactive };
  }
};

module.exports = StudentService;
