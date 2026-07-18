// Stress test for KiloCode Judo Club management system.
// Tests the system at realistic scale: 500+ students, 20 coaches,
// thousands of attendance records and subscriptions.
//
// Usage: node scripts/stress-test.js

const path = require('path');
// Override DB path to a temp file so we don't corrupt the real database.
process.env.DB_PATH = './data/stress-test.db';
const { getConnection } = require('../src/database/connection');
const StudentRepo = require('../src/repositories/student.repo');
const AttendanceRepo = require('../src/repositories/attendance.repo');
const SubscriptionRepo = require('../src/repositories/subscription.repo');
const UserRepo = require('../src/repositories/user.repo');
const StudentService = require('../src/services/student.service');
const AttendanceService = require('../src/services/attendance.service');
const SubscriptionService = require('../src/services/subscription.service');
const bcrypt = require('bcryptjs');

const NUM_STUDENTS = 550;
const NUM_COACHES = 20;
const DAYS = 180; // 6 months of attendance
const CATEGORIES = ['براعم', 'أشبال', 'ناشئين', 'شباب', 'فريق أول'];
const STATUSES = ['نشط', 'منقطع', 'منتقل'];
const ATTEND_STATUSES = ['حاضر', 'غائب', 'معذر'];
const SUBSCRIPTION_TYPES = ['شهري', 'ثلاثة أشهر', 'ستة أشهر', 'سنوي'];
const PAYMENT_METHODS = ['نقداً', 'تحويل بنكي', 'إعفاء'];
const DAYS_MAP = { 'شهري': 30, 'ثلاثة أشهر': 90, 'ستة أشهر': 180, 'سنوي': 365 };

function pad(n) { return String(n).padStart(10, '0'); }

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    .toISOString().split('T')[0];
}

async function createSchema() {
  const fs = require('fs');
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, '..', 'data', 'stress-test.db');
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'database', 'schema-sqlite.sql'), 'utf8'
  );
  sqlite.exec(schema);
  sqlite.close();
  console.log('  ✓ Schema created');
}

async function seedCoaches() {
  const start = Date.now();
  const hash = bcrypt.hashSync('Coach123', 10);
  for (let i = 1; i <= NUM_COACHES; i++) {
    await UserRepo.create({
      fullName: 'مدرب اختبار ' + i,
      email: 'coach' + i + '@test.com',
      phone: '0555' + pad(i).slice(0, 7),
      password: hash,
      role: 'coach'
    });
  }
  console.log('  ✓ ' + NUM_COACHES + ' coaches created in ' + (Date.now() - start) + 'ms');
}

async function seedStudents() {
  const start = Date.now();
  const hash = bcrypt.hashSync('student123', 10);
  for (let i = 1; i <= NUM_STUDENTS; i++) {
    const nationalId = pad(i);
    const existing = await StudentRepo.findByNationalId(nationalId);
    if (existing) continue;
    await StudentRepo.create({
      fullName: 'طالب اختبار ' + i,
      nationalId: nationalId,
      age: Math.floor(Math.random() * 15) + 6,
      phone: '0555' + pad(i).slice(0, 7),
      parentPhone: '0566' + pad(i).slice(0, 7),
      category: randomItem(CATEGORIES),
      status: randomItem(STATUSES),
      password: hash
    });
  }
  console.log('  ✓ ' + NUM_STUDENTS + ' students created in ' + (Date.now() - start) + 'ms');
}

async function seedAttendance() {
  const start = Date.now();
  const students = await StudentRepo.findAll({});
  const now = new Date();
  let count = 0;
  for (const s of students) {
    // Each student has attendance for ~40% of days (varies)
    for (let d = 0; d < DAYS; d++) {
      if (Math.random() > 0.4) continue; // skip some days
      const date = new Date(now);
      date.setDate(date.getDate() - DAYS + d);
      // Skip Fridays
      if (date.getDay() === 5) continue;
      const dateStr = date.toISOString().split('T')[0];
      const existing = await AttendanceRepo.findByStudentAndDate(s.id, dateStr);
      if (existing) continue;
      await AttendanceRepo.upsert(s.id, dateStr, randomItem(ATTEND_STATUSES), null);
      count++;
      if (count % 1000 === 0) process.stdout.write('.');
    }
  }
  console.log('\n  ✓ ' + count + ' attendance records created in ' + (Date.now() - start) + 'ms');
}

async function seedSubscriptions() {
  const start = Date.now();
  const students = await StudentRepo.findAll({});
  const now = new Date();
  let count = 0;
  for (const s of students) {
    // Each student has 1-3 subscriptions
    const numSubs = Math.floor(Math.random() * 3) + 1;
    for (let si = 0; si < numSubs; si++) {
      const type = randomItem(SUBSCRIPTION_TYPES);
      const days = DAYS_MAP[type];
      const startDate = randomDate(new Date(now.getTime() - 180 * 86400000), now);
      const sd = new Date(startDate);
      const endDate = new Date(sd.getTime() + days * 86400000);
      const status = endDate < now ? 'منتهي' : (Math.random() > 0.8 ? 'ملغي' : 'نشط');
      const amount = Math.floor(Math.random() * 500) + 100;
      await SubscriptionRepo.create({
        studentId: s.id,
        type: type,
        days: days,
        amount: amount,
        startDate: startDate,
        endDate: endDate.toISOString().split('T')[0],
        status: status,
        paymentMethod: randomItem(PAYMENT_METHODS),
        notes: null
      });
      count++;
    }
  }
  console.log('  ✓ ' + count + ' subscriptions created in ' + (Date.now() - start) + 'ms');
}

async function testOperations() {
  console.log('\n--- Functional tests ---\n');

  // 1. Search
  const t1 = Date.now();
  const searchResults = await StudentRepo.findAll({ search: 'اختبار 1' });
  console.log('  Search "اختبار 1": ' + searchResults.length + ' results in ' + (Date.now() - t1) + 'ms');

  // 2. Filter by category
  const t2 = Date.now();
  const catResults = await StudentRepo.findAll({ category: 'أشبال' });
  console.log('  Filter by أشبال: ' + catResults.length + ' results in ' + (Date.now() - t2) + 'ms');

  // 3. Filter by status
  const t3 = Date.now();
  const statusResults = await StudentRepo.findAll({ status: 'نشط' });
  console.log('  Filter by نشط: ' + statusResults.length + ' results in ' + (Date.now() - t3) + 'ms');

  // 4. Attendance today
  const t4 = Date.now();
  const todayAtt = await AttendanceService.getToday();
  console.log('  Today attendance: ' + todayAtt.length + ' students in ' + (Date.now() - t4) + 'ms');

  // 5. Monthly grid
  const t5 = Date.now();
  const grid = await AttendanceService.getMonthlyGrid();
  console.log('  Monthly grid: ' + (grid.students ? grid.students.length : 0) + ' students in ' + (Date.now() - t5) + 'ms');

  // 6. Student report
  const t6 = Date.now();
  const allStudents = await StudentRepo.findAll({});
  if (allStudents.length > 0) {
    const report = await AttendanceService.getStudentReport(allStudents[0].id, '2026-01-01', '2026-12-31');
    console.log('  Student report: ' + report.total + ' records in ' + (Date.now() - t6) + 'ms');
  }

  // 7. Subscriptions list
  const t7 = Date.now();
  const subs = await SubscriptionRepo.findAll({});
  console.log('  All subscriptions: ' + subs.length + ' in ' + (Date.now() - t7) + 'ms');

  // 8. Active subscriptions
  const t8 = Date.now();
  const activeSubs = await SubscriptionRepo.findAll({ status: 'نشط' });
  console.log('  Active subscriptions: ' + activeSubs.length + ' in ' + (Date.now() - t8) + 'ms');

  // 9. Stats
  const t9 = Date.now();
  const stats = await StudentService.getStats();
  console.log('  Student stats: ' + JSON.stringify(stats) + ' in ' + (Date.now() - t9) + 'ms');

  // 10. Revenue
  const t10 = Date.now();
  const revenue = await SubscriptionRepo.getTotalRevenue();
  console.log('  Revenue: ' + revenue + ' in ' + (Date.now() - t10) + 'ms');

  // 11. Monthly revenue
  const t11 = Date.now();
  const monthly = await SubscriptionRepo.getMonthlyRevenue(2026);
  console.log('  Monthly revenue (' + monthly.length + ' months) in ' + (Date.now() - t11) + 'ms');

  // 12. Create + update + delete a student (transaction test)
  const t12 = Date.now();
  try {
    const newStudent = await StudentService.create({ fullName: 'طالب مؤقت', nationalId: '9999999999', age: 10, phone: '0555555555' });
    console.log('  Create student: id=' + newStudent.id + ' in ' + (Date.now() - t12) + 'ms');
    const t12b = Date.now();
    await StudentService.delete(newStudent.id);
    console.log('  Delete student: success in ' + (Date.now() - t12b) + 'ms');
  } catch (e) {
    console.log('  Transaction test FAILED: ' + e.message);
  }

  // 13. Attendance batch save (transaction test)
  const t13 = Date.now();
  try {
    if (allStudents.length > 0) {
      const batch = allStudents.slice(0, 50).map(s => ({
        studentId: s.id,
        date: new Date().toISOString().split('T')[0],
        status: 'حاضر',
        notes: null
      }));
      await AttendanceService.save(batch);
      console.log('  Batch attendance save (50 records): OK in ' + (Date.now() - t13) + 'ms');
    }
  } catch (e) {
    console.log('  Batch attendance save FAILED: ' + e.message);
  }

  // 14. Subscription create + delete (transaction test)
  const t14 = Date.now();
  try {
    if (allStudents.length > 0) {
      const newSub = await SubscriptionService.create({ studentId: allStudents[0].id, type: 'شهري', days: 30, amount: 200, startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0] });
      const t14b = Date.now();
      await SubscriptionService.delete(newSub.id);
      console.log('  Subscription create+delete: OK in ' + (Date.now() - t14b) + 'ms');
    }
  } catch (e) {
    console.log('  Subscription transaction FAILED: ' + e.message);
  }

  // 15. Exemption count + breakdowns
  const t15 = Date.now();
  const exempt = await SubscriptionRepo.getExemptionCount();
  const statusBrk = await SubscriptionRepo.getStatusBreakdown();
  const typeBrk = await SubscriptionRepo.getTypeBreakdown();
  console.log('  Exemption count: ' + exempt + ' | Status breakdown: ' + statusBrk.length + ' types | Type breakdown: ' + typeBrk.length + ' types in ' + (Date.now() - t15) + 'ms');

  // 16. Student rate
  const t16 = Date.now();
  if (allStudents.length > 0) {
    const rate = await AttendanceService.getStudentRate(allStudents[0].id);
    console.log('  Student attendance rate: ' + rate.rate + '% in ' + (Date.now() - t16) + 'ms');
  }
}

async function cleanUp() {
  const fs = require('fs');
  const dbPath = path.join(__dirname, '..', 'data', 'stress-test.db');
  try { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); } catch {}
  try { if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal'); } catch {}
  try { if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm'); } catch {}
}

async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  KiloCode Stress Test');
  console.log('══════════════════════════════════════════\n');

  console.log('Cleaning up previous test database...');
  await cleanUp();
  console.log('Creating schema...');
  await createSchema();

  console.log('\n--- Seeding data ---\n');
  await seedCoaches();
  await seedStudents();
  await seedAttendance();
  await seedSubscriptions();

  console.log('\n--- Running performance & functional tests ---');
  await testOperations();

  console.log('\n--- Cleanup ---');
  await cleanUp();

  console.log('\n══════════════════════════════════════════');
  console.log('  Stress test complete!');
  console.log('══════════════════════════════════════════\n');
}

main().catch(e => {
  console.error('STRESS TEST FAILED:', e);
  process.exit(1);
});