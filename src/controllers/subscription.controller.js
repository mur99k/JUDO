const { success, error } = require('../utils/response');
const SubscriptionService = require('../services/subscription.service');

const SubscriptionController = {
  async list(req, res, next) {
    try {
      const { status, studentId } = req.query;
      const subscriptions = await SubscriptionService.list({ status, studentId });
      return success(res, { subscriptions });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const subscription = await SubscriptionService.getById(req.params.id);
      return success(res, { subscription });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { studentId, type, days, amount, startDate, endDate, paymentMethod, notes } = req.body;
      if (!studentId || amount === undefined || amount === null || !startDate) return error(res, 'الطالب والمبلغ وتاريخ البداية مطلوبون');
      const d = Number(days) || 30;
      var computedEndDate = endDate;
      if (!computedEndDate && startDate) {
        const dt = new Date(startDate);
        dt.setDate(dt.getDate() + d);
        computedEndDate = dt.toISOString().split('T')[0];
      }
      const result = await SubscriptionService.create({ studentId: Number(studentId), type: type || 'عادي', days: d, amount: Number(amount) || 0, startDate, endDate: computedEndDate, paymentMethod, notes });
      return success(res, { id: result.id });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { type, days, amount, startDate, endDate, status, paymentMethod, notes } = req.body;
      const sub = {};
      if (type !== undefined) sub.type = type;
      if (days !== undefined) sub.days = Number(days);
      if (amount !== undefined) sub.amount = Number(amount);
      if (startDate !== undefined) sub.startDate = startDate;
      if (endDate !== undefined) sub.endDate = endDate;
      if (status !== undefined) sub.status = status;
      if (paymentMethod !== undefined) sub.paymentMethod = paymentMethod;
      if (notes !== undefined) sub.notes = notes;
      const subscription = await SubscriptionService.update(req.params.id, sub);
      return success(res, { subscription });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await SubscriptionService.delete(req.params.id);
      return success(res);
    } catch (err) {
      next(err);
    }
  },

  async stats(req, res, next) {
    try {
      const data = await SubscriptionService.getStats();
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = SubscriptionController;
