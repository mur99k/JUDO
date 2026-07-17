const bcrypt = require('bcryptjs');
const UserRepo = require('../repositories/user.repo');
const { NotFoundError, ValidationError } = require('../utils/errors');

const CoachService = {
  list() { return UserRepo.findByRole('coach'); },

  getById(id) {
    const coach = UserRepo.findById(id);
    if (!coach || coach.role !== 'coach') throw new NotFoundError('المدرب غير موجود');
    return coach;
  },

  create(data, file) {
    const existing = UserRepo.findByEmail(data.email);
    if (existing) throw new ValidationError('البريد الإلكتروني مستخدم مسبقاً');
    const hash = bcrypt.hashSync(data.password, 10);
    const profileImage = file ? '/uploads/coaches/' + file.filename : null;
    const result = UserRepo.create({ ...data, password: hash, role: 'coach', profileImage });
    return result;
  },

  update(id, data, file) {
    const coach = UserRepo.findById(id);
    if (!coach || coach.role !== 'coach') throw new NotFoundError('المدرب غير موجود');
    const { password, ...profileData } = data;
    if (file) profileData.profileImage = '/uploads/coaches/' + file.filename;
    if (Object.keys(profileData).length > 0) UserRepo.updateProfile(id, profileData);
    if (password) {
      UserRepo.updatePassword(id, bcrypt.hashSync(password, 10));
    }
    return UserRepo.findById(id);
  },

  delete(id) {
    const coach = UserRepo.findById(id);
    if (!coach || coach.role !== 'coach') throw new NotFoundError('المدرب غير موجود');
    UserRepo.delete(id);
  }
};

module.exports = CoachService;
