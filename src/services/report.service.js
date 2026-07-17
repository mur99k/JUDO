const StudentRepo = require('../repositories/student.repo');
const AttendanceRepo = require('../repositories/attendance.repo');
const SubscriptionRepo = require('../repositories/subscription.repo');
const UserRepo = require('../repositories/user.repo');

const ReportService = {
  getDashboard() {
    const totalStudents = StudentRepo.count();
    const activeStudents = StudentRepo.count({ status: 'نشط' });
    const totalCoaches = UserRepo.findByRole('coach').length;
    const activeSubscriptions = SubscriptionRepo.getActiveCount();
    const revenue = SubscriptionRepo.getTotalRevenue();
    const todayAttendance = AttendanceRepo.getTodayCount();

    const recentStudents = StudentRepo.findAll().slice(0, 5).map(s => ({
      id: s.id, fullName: s.fullName, status: s.status, createdAt: s.createdAt
    }));

    const now = new Date();
    const monthlyRevenue = SubscriptionRepo.getMonthlyRevenue(now.getFullYear());

    const attendanceData = {
      total: 0, present: 0
    };

    return {
      totalStudents, activeStudents, totalCoaches,
      activeSubscriptions, revenue, todayAttendance,
      recentStudents, monthlyRevenue, attendanceData
    };
  },

  getStudentStats() {
    const total = StudentRepo.count();
    const active = StudentRepo.count({ status: 'نشط' });
    return { total, active, inactive: total - active };
  },

  getSubscriptionStats() {
    return {
      active: SubscriptionRepo.getActiveCount(),
      revenue: SubscriptionRepo.getTotalRevenue()
    };
  }
};

module.exports = ReportService;
