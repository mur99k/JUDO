const SubscriptionRepo = require('../repositories/subscription.repo');
const { NotFoundError } = require('../utils/errors');
const { withTransaction } = require('../utils/transaction');

const SubscriptionService = {
  async list(filters) {
    return SubscriptionRepo.findAll(filters);
  },

  async getById(id) {
    const sub = await SubscriptionRepo.findById(id);
    if (!sub) throw new NotFoundError('الاشتراك غير موجود');
    return sub;
  },

  async create(data) {
    return withTransaction(async (conn) => {
      return SubscriptionRepo.create(data, conn);
    });
  },

  async update(id, data) {
    const sub = await SubscriptionRepo.findById(id);
    if (!sub) throw new NotFoundError('الاشتراك غير موجود');
    await SubscriptionRepo.update(id, data);
    return SubscriptionRepo.findById(id);
  },

  async delete(id) {
    return withTransaction(async (conn) => {
      const sub = await SubscriptionRepo.findById(id);
      if (!sub) throw new NotFoundError('الاشتراك غير موجود');
      await SubscriptionRepo.delete(id, conn);
    });
  },

  async getStats() {
    const active = await SubscriptionRepo.getActiveCount();
    const revenue = await SubscriptionRepo.getTotalRevenue();
    const year = new Date().getFullYear();
    const monthlyRevenue = await SubscriptionRepo.getMonthlyRevenue(year);
    return { active, revenue, monthlyRevenue };
  },

  async syncExpired() {
    return SubscriptionRepo.expireOverdue();
  }
};

module.exports = SubscriptionService;
