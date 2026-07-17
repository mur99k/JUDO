const SubscriptionRepo = require('../repositories/subscription.repo');
const { NotFoundError } = require('../utils/errors');

const SubscriptionService = {
  list(filters) {
    return SubscriptionRepo.findAll(filters);
  },

  getById(id) {
    const sub = SubscriptionRepo.findById(id);
    if (!sub) throw new NotFoundError('الاشتراك غير موجود');
    return sub;
  },

  create(data) {
    return SubscriptionRepo.create(data);
  },

  update(id, data) {
    const sub = SubscriptionRepo.findById(id);
    if (!sub) throw new NotFoundError('الاشتراك غير موجود');
    SubscriptionRepo.update(id, data);
    return SubscriptionRepo.findById(id);
  },

  delete(id) {
    const sub = SubscriptionRepo.findById(id);
    if (!sub) throw new NotFoundError('الاشتراك غير موجود');
    SubscriptionRepo.delete(id);
  },

  getStats() {
    const active = SubscriptionRepo.getActiveCount();
    const revenue = SubscriptionRepo.getTotalRevenue();
    const year = new Date().getFullYear();
    const monthlyRevenue = SubscriptionRepo.getMonthlyRevenue(year);
    return { active, revenue, monthlyRevenue };
  },

  syncExpired() {
    return SubscriptionRepo.expireOverdue();
  }
};

module.exports = SubscriptionService;
