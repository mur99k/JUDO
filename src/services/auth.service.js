const fs = require('fs');
const bcrypt = require('bcryptjs');
const UserRepo = require('../repositories/user.repo');
const StudentRepo = require('../repositories/student.repo');
const AttendanceRepo = require('../repositories/attendance.repo');
const storage = require('../storage');
const { AuthError, ValidationError } = require('../utils/errors');

async function persistPhoto(file, subDir) {
  if (!file) return null;
  const key = subDir + '/' + file.filename;
  const buffer = fs.readFileSync(file.path);
  const { url } = await storage.upload(key, buffer, file.mimetype);
  try { fs.unlinkSync(file.path); } catch {}
  return storage.normalizeDbValue(url);
}

const AuthService = {
  async loginAdmin(email, password) {
    const user = await UserRepo.findByEmail(email);
    if (!user) throw new AuthError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    if (!bcrypt.compareSync(password, user.password)) throw new AuthError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    return { id: user.id, name: user.fullName, email: user.email, role: user.role, profileImage: storage.normalizeDbValue(user.profileImage) };
  },

  async loginStudent(nationalId) {
    const student = await StudentRepo.findByNationalId(nationalId);
    if (!student) throw new AuthError('رقم الهوية غير صحيح');
    if (student.status !== 'نشط') throw new AuthError('الحساب غير نشط');
    return { id: student.id, name: student.fullName, role: 'student' };
  },

  async registerStudent(data) {
    const existing = await StudentRepo.findByNationalId(data.nationalId);
    if (existing) throw new ValidationError('رقم الهوية مسجل مسبقاً');
    const result = await StudentRepo.create(data);
    return { id: result.id, name: data.fullName, role: 'student' };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserRepo.findById(userId);
    if (!user) throw new AuthError('المستخدم غير موجود');
    const fullUser = await UserRepo.findByEmail(user.email);
    if (!bcrypt.compareSync(currentPassword, fullUser.password)) throw new AuthError('كلمة المرور الحالية غير صحيحة');
    const hash = bcrypt.hashSync(newPassword, 10);
    await UserRepo.updatePassword(userId, hash);
  },

  async updateProfile(userId, data, file) {
    const user = await UserRepo.findById(userId);
    if (user) {
      const updates = {};
      if (data.fullName) updates.fullName = data.fullName;
      if (data.email) updates.email = data.email;
      if (data.phone) updates.phone = data.phone;
      if (file) updates.profileImage = await persistPhoto(file, 'admins');
      await UserRepo.updateProfile(userId, updates);
      const updated = await UserRepo.findById(userId);
      updated.profileImage = storage.normalizeDbValue(updated.profileImage);
      return updated;
    }
    const student = await StudentRepo.findById(userId);
    if (student) {
      const updates = {};
      if (data.fullName) updates.fullName = data.fullName;
      if (data.phone) updates.phone = data.phone;
      if (data.parentPhone !== undefined) updates.parentPhone = data.parentPhone;
      if (file) updates.photo = await persistPhoto(file, 'students');
      await StudentRepo.update(userId, updates);
      const updated = await StudentRepo.findById(userId);
      updated.photo = storage.normalizeDbValue(updated.photo);
      return updated;
    }
    throw new AuthError('المستخدم غير موجود');
  }
};

module.exports = AuthService;
