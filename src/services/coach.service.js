const fs = require('fs');
const bcrypt = require('bcryptjs');
const UserRepo = require('../repositories/user.repo');
const storage = require('../storage');
const { NotFoundError, ValidationError } = require('../utils/errors');

async function persistPhoto(file, subDir) {
  if (!file) return null;
  const key = subDir + '/' + file.filename;
  const buffer = fs.readFileSync(file.path);
  const { url } = await storage.upload(key, buffer, file.mimetype);
  try { fs.unlinkSync(file.path); } catch {}
  return storage.normalizeDbValue(url);
}

const CoachService = {
  async list() { return UserRepo.findByRole('coach'); },

  async getById(id) {
    const coach = await UserRepo.findById(id);
    if (!coach || coach.role !== 'coach') throw new NotFoundError('المدرب غير موجود');
    coach.profileImage = storage.normalizeDbValue(coach.profileImage);
    return coach;
  },

  async create(data, file) {
    const existing = await UserRepo.findByEmail(data.email);
    if (existing) throw new ValidationError('البريد الإلكتروني مستخدم مسبقاً');
    const hash = bcrypt.hashSync(data.password, 10);
    const profileImage = file ? await persistPhoto(file, 'coaches') : null;
    const result = await UserRepo.create({ ...data, password: hash, role: 'coach', profileImage });
    return result;
  },

  async update(id, data, file) {
    const coach = await UserRepo.findById(id);
    if (!coach || coach.role !== 'coach') throw new NotFoundError('المدرب غير موجود');
    const { password, ...profileData } = data;
    if (file) profileData.profileImage = await persistPhoto(file, 'coaches');
    if (Object.keys(profileData).length > 0) await UserRepo.updateProfile(id, profileData);
    if (password) {
      await UserRepo.updatePassword(id, bcrypt.hashSync(password, 10));
    }
    const updated = await UserRepo.findById(id);
    updated.profileImage = storage.normalizeDbValue(updated.profileImage);
    return updated;
  },

  async delete(id) {
    const coach = await UserRepo.findById(id);
    if (!coach || coach.role !== 'coach') throw new NotFoundError('المدرب غير موجود');
    if (coach.profileImage) { try { await storage.remove(storage.keyFromUrl(coach.profileImage)); } catch {} }
    await UserRepo.delete(id);
  }
};

module.exports = CoachService;
