const StudentRepo = require('../repositories/student.repo');
const AttendanceRepo = require('../repositories/attendance.repo');
const SubscriptionRepo = require('../repositories/subscription.repo');
const UserRepo = require('../repositories/user.repo');
const hijri = require('../utils/hijri');

const ReportService = {
  async getDashboard() {
    const totalStudents = await StudentRepo.count();
    const activeStudents = await StudentRepo.count({ status: 'نشط' });
    const totalCoaches = (await UserRepo.findByRole('coach')).length;
    const activeSubscriptions = await SubscriptionRepo.getActiveCount();
    const revenue = await SubscriptionRepo.getTotalRevenue();
    const todayAttendance = await AttendanceRepo.getTodayCount();
    const exemptions = await SubscriptionRepo.getExemptionCount();
    const todayStats = await AttendanceRepo.getTodayStats();

    const recentStudents = (await StudentRepo.findAll()).slice(0, 5).map(s => ({
      id: s.id, fullName: s.fullName, status: s.status, createdAt: s.createdAt
    }));

    const now = hijri.parseHijri(hijri.todayHijri()).hy;
    const monthlyRevenue = await SubscriptionRepo.getMonthlyRevenue(now);

    return {
      totalStudents, activeStudents, totalCoaches,
      activeSubscriptions, revenue, todayAttendance,
      exemptions, todayStats,
      recentStudents, monthlyRevenue, attendanceData: { total: 0, present: 0 }
    };
  },

  async getStudentStats() {
    const total = await StudentRepo.count();
    const active = await StudentRepo.count({ status: 'نشط' });
    const statusBreakdown = await StudentRepo.getStatusBreakdown();
    const categoryBreakdown = await StudentRepo.getCategoryBreakdown();
    return { total, active, inactive: total - active, statusBreakdown, categoryBreakdown };
  },

  async getSubscriptionStats() {
    const active = await SubscriptionRepo.getActiveCount();
    const revenue = await SubscriptionRepo.getTotalRevenue();
    const statusBreakdown = await SubscriptionRepo.getStatusBreakdown();
    const typeBreakdown = await SubscriptionRepo.getTypeBreakdown();
    const exemptions = await SubscriptionRepo.getExemptionCount();
    return { active, revenue, statusBreakdown, typeBreakdown, exemptions };
  }
};

module.exports = ReportService;
