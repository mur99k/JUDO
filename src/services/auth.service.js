const fs = require('fs');
const bcrypt = require('bcryptjs');
const UserRepo = require('../repositories/user.repo');
const StudentRepo = require('../repositories/student.repo');
const storage = require('../storage');
const { AuthError, ValidationError } = require('../utils/errors');
const { withTransaction } = require('../utils/transaction');

async function persistPhoto(file, subDir) {
  if (!file) return null;
  const key = subDir + '/' + file.filename;
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
    return { id: student.id, name: student.fullName, role: 'student', photo: storage.normalizeDbValue(student.photo) };
  },

  async registerStudent(data) {
    return withTransaction(async (conn) => {
      const existing = await StudentRepo.findByNationalId(data.nationalId, conn);
      if (existing) throw new ValidationError('رقم الهوية مسجل مسبقاً');
      const result = await StudentRepo.create(data, conn);
      return { id: result.id, name: data.fullName, role: 'student' };
    });
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserRepo.findById(userId);
    if (user) {
      const fullUser = await UserRepo.findByEmail(user.email);
      if (!fullUser || !bcrypt.compareSync(currentPassword, fullUser.password)) throw new AuthError('كلمة المرور الحالية غير صحيحة');
      const hash = bcrypt.hashSync(newPassword, 10);
      await UserRepo.updatePassword(userId, hash);
      return;
    }
    const student = await require('../repositories/student.repo').findById(userId);
    if (!student) throw new AuthError('المستخدم غير موجود');
    const studentWithPwd = await require('../repositories/student.repo').findByNationalIdWithPassword(student.nationalId);
    if (!studentWithPwd || !studentWithPwd.password || !bcrypt.compareSync(currentPassword, studentWithPwd.password)) {
      throw new AuthError('كلمة المرور الحالية غير صحيحة');
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    await require('../repositories/student.repo').update(userId, { password: hash });
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
