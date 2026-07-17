const StudentRepo = require('../repositories/student.repo');
const AttendanceRepo = require('../repositories/attendance.repo');
const SubscriptionRepo = require('../repositories/subscription.repo');
const UserRepo = require('../repositories/user.repo');

const ReportService = {
  async getDashboard() {
    const totalStudents = await StudentRepo.count();
    const activeStudents = await StudentRepo.count({ status: 'نشط' });
    const totalCoaches = (await UserRepo.findByRole('coach')).length;
    const activeSubscriptions = await SubscriptionRepo.getActiveCount();
    const revenue = await SubscriptionRepo.getTotalRevenue();
    const todayAttendance = await AttendanceRepo.getTodayCount();

    const recentStudents = (await StudentRepo.findAll()).slice(0, 5).map(s => ({
      id: s.id, fullName: s.fullName, status: s.status, createdAt: s.createdAt
    }));

    const now = new Date();
    const monthlyRevenue = await SubscriptionRepo.getMonthlyRevenue(now.getFullYear());

    return {
      totalStudents, activeStudents, totalCoaches,
      activeSubscriptions, revenue, todayAttendance,
      recentStudents, monthlyRevenue, attendanceData: { total: 0, present: 0 }
    };
  },

  async getStudentStats() {
    const total = await StudentRepo.count();
    const active = await StudentRepo.count({ status: 'نشط' });
    return { total, active, inactive: total - active };
  },

  async getSubscriptionStats() {
    return {
      active: await SubscriptionRepo.getActiveCount(),
      revenue: await SubscriptionRepo.getTotalRevenue()
    };
  }
};

module.exports = ReportService;
