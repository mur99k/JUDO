const { getConnection } = require('../database/connection');
const StudentRepo = require('../repositories/student.repo');
const UserRepo = require('../repositories/user.repo');
const SubscriptionRepo = require('../repositories/subscription.repo');
const storage = require('../storage');
const pkg = require('../../package.json');

const SystemService = {
  async getHealth() {
    const results = {};

    // App version
    results.version = pkg.version || '2.0.0';

    // Render service status (self-check: app is running)
    results.serviceStatus = 'running';

    // Database check + latency
    const dbStart = Date.now();
    try {
      const db = getConnection();
      await db.query('SELECT 1 as ping');
      results.dbLatency = Date.now() - dbStart;
      results.dbStatus = 'connected';
    } catch (e) {
      results.dbLatency = null;
      results.dbStatus = 'error: ' + e.message;
    }

    // R2 check
    try {
      if (storage.isRemote()) {
        const items = await storage.list('');
        results.r2Status = 'connected';
        results.r2Objects = items.length;
      } else {
        results.r2Status = 'local (dev)';
        results.r2Objects = null;
      }
    } catch (e) {
      results.r2Status = 'error: ' + e.message;
      results.r2Objects = null;
    }

    // Student count
    try {
      results.studentCount = await StudentRepo.count();
    } catch { results.studentCount = '?'; }

    // Coach count
    try {
      const coaches = await UserRepo.findByRole('coach');
      results.coachCount = coaches.length;
    } catch { results.coachCount = '?'; }

    // Active subscriptions
    try {
      results.activeSubscriptions = await SubscriptionRepo.getActiveCount();
    } catch { results.activeSubscriptions = '?'; }

    // Storage usage (R2) — approximate from list
    try {
      if (storage.isRemote()) {
        results.storageUsage = 'see R2 dashboard';
      } else {
        results.storageUsage = 'local (dev)';
      }
    } catch { results.storageUsage = '?'; }

    // Last backup
    results.lastBackup = 'غير مفعل';

    return results;
  }
};

module.exports = SystemService;
