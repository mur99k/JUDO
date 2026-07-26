const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const coachRoutes = require('./coach.routes');
const attendanceRoutes = require('./attendance.routes');
const subscriptionRoutes = require('./subscription.routes');
const reportRoutes = require('./report.routes');
const galleryRoutes = require('./gallery.routes');
const settingsRoutes = require('./settings.routes');
const pageRoutes = require('./page.routes');
const { notFound } = require('../middleware/error');

module.exports = function (app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/coaches', coachRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/gallery', galleryRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use(pageRoutes);

  app.use(notFound);
};
