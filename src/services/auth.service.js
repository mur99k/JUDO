const bcrypt = require('bcryptjs');
const UserRepo = require('../repositories/user.repo');
const StudentRepo = require('../repositories/student.repo');
const { AuthError, ValidationError } = require('../utils/errors');

const AuthService = {
  async loginAdmin(email, password) {
    const user = UserRepo.findByEmail(email);
    if (!user) throw new AuthError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    if (!bcrypt.compareSync(password, user.password)) throw new AuthError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    return { id: user.id, name: user.fullName, email: user.email, role: user.role, profileImage: user.profileImage };
  },

  async loginStudent(nationalId) {
    const student = StudentRepo.findByNationalId(nationalId);
    if (!student) throw new AuthError('رقم الهوية غير صحيح');
    if (student.status !== 'نشط') throw new AuthError('الحساب غير نشط');
    return { id: student.id, name: student.fullName, role: 'student' };
  },

  async registerStudent(data) {
    const existing = StudentRepo.findByNationalId(data.nationalId);
    if (existing) throw new ValidationError('رقم الهوية مسجل مسبقاً');
    const result = StudentRepo.create(data);
    return { id: result.id, name: data.fullName, role: 'student' };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = UserRepo.findById(userId);
    if (!user) throw new AuthError('المستخدم غير موجود');
    const fullUser = UserRepo.findByEmail(user.email);
    if (!bcrypt.compareSync(currentPassword, fullUser.password)) throw new AuthError('كلمة المرور الحالية غير صحيحة');
    const hash = bcrypt.hashSync(newPassword, 10);
    UserRepo.updatePassword(userId, hash);
  },

  async updateProfile(userId, data, file) {
    const user = UserRepo.findById(userId);
    if (user) {
      const updates = {};
      if (data.fullName) updates.fullName = data.fullName;
      if (data.email) updates.email = data.email;
      if (data.phone) updates.phone = data.phone;
      if (file) updates.profileImage = '/uploads/' + file.filename;
      UserRepo.updateProfile(userId, updates);
      return UserRepo.findById(userId);
    }
    const student = StudentRepo.findById(userId);
    if (student) {
      const updates = {};
      if (data.fullName) updates.fullName = data.fullName;
      if (data.phone) updates.phone = data.phone;
      if (data.parentPhone !== undefined) updates.parentPhone = data.parentPhone;
      if (file) updates.photo = '/uploads/' + file.filename;
      StudentRepo.update(userId, updates);
      var updated = StudentRepo.findById(userId);
      if (updated.photo) updated.photo = updated.photo;
      return updated;
    }
    throw new AuthError('المستخدم غير موجود');
  }
};

module.exports = AuthService;
