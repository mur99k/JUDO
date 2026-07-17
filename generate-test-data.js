const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(__dirname, 'data', 'club.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const categories = ['براعم', 'أشبال', 'ناشئين', 'شباب', 'فريق أول'];
const firstNames = ['محمد', 'أحمد', 'عبدالله', 'خالد', 'سعد', 'فهد', 'عمر', 'يوسف', 'إبراهيم', 'حسن', 'علي', 'عبدالرحمن', 'سلطان', 'ماجد', 'نواف', 'تركي', 'بندر', 'مشعل', 'عبدالعزيز', 'صالح', 'وليد', 'راكان', 'فيصل', 'طلال'];
const lastNames = ['الغامدي', 'العتيبي', 'القحطاني', 'الشمري', 'الحربي', 'الدوسري', 'المطيري', 'الزهراني', 'البلوي', 'العنزي', 'السبيعي', 'الرشيدي', 'الجهني', 'الثبيتي', 'العمري', 'السهلي', 'الخالدي', 'المالكي', 'الاحمدي', 'القرشي'];
const cities = ['جدة', 'الرياض', 'مكة', 'المدينة', 'الدمام', 'تبوك', 'أبها', 'الطائف', 'نجران', 'جازان'];

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function generatePhone() { return '05' + randomInt(10000000, 99999999); }
function generateNationalId() { return '1' + randomInt(100000000, 999999999); }
function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function generateDate(yearsAgo) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsAgo);
  d.setMonth(randomInt(0, 11));
  d.setDate(randomInt(1, 28));
  return ymd(d);
}

console.log('جاري إنشاء بيانات الاختبار...');

// Clear existing test data (keep admin user id=1)
db.prepare('DELETE FROM attendance').run();
db.prepare('DELETE FROM subscriptions').run();
db.prepare('DELETE FROM students WHERE id != 1').run();
db.prepare("DELETE FROM users WHERE role = 'coach' AND id != 1").run();
db.prepare('DELETE FROM contact_messages').run();
db.pragma('synchronous = OFF');

const dirs = ['uploads/students', 'uploads/coaches', 'uploads/admins', 'بطولات وجوائز', 'backgrounds'];
dirs.forEach(d => { const dir = path.join(__dirname, d); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

// ---------- Students ----------
const insertStudent = db.prepare(`
  INSERT INTO students (fullName, nationalId, age, phone, parentPhone, photo, password, category, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const students = [];
const TOTAL_STUDENTS = 457;
for (let i = 0; i < TOTAL_STUDENTS; i++) {
  const fullName = `${randomItem(firstNames)} ${randomItem(lastNames)} ${randomItem(lastNames)}`;
  const nationalId = generateNationalId();
  const age = randomInt(6, 25);
  const phone = generatePhone();
  const parentPhone = generatePhone();
  const category = randomItem(categories);
  const status = Math.random() > 0.09 ? 'نشط' : 'غير نشط';
  const createdAt = generateDate(randomInt(1, 5));
  try {
    const result = insertStudent.run(fullName, nationalId, age, phone, parentPhone, null, null, category, status, createdAt, createdAt);
    students.push({ id: result.lastInsertRowid, fullName, category, status });
  } catch (e) { /* skip dup */ }
}
console.log('تم إنشاء ' + students.length + ' طالب');

// ---------- Coaches (as users with role=coach so the app uses them) ----------
const insertCoachUser = db.prepare(`
  INSERT INTO users (fullName, email, phone, password, role, profileImage, createdAt)
  VALUES (?, ?, ?, ?, 'coach', ?, ?)
`);
const specializations = ['جودو', 'دفاع عن النفس', 'لياقة بدنية', 'تدريب ناشئين', 'تدريب أبطال'];
const grades = ['حزام أسود دان 1', 'حزام أسود دان 2', 'حزام أسود دان 3', 'مدرب معتمد', 'مدرب دولي'];
const usedEmails = new Set();
const coachCount = 10;
for (let i = 0; i < coachCount; i++) {
  let email;
  do { email = `coach${i + 1}@riyadah.com`; } while (usedEmails.has(email));
  usedEmails.add(email);
  const fullName = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
  const phone = generatePhone();
  const hash = bcrypt.hashSync('coach123', 10);
  const createdAt = generateDate(randomInt(2, 8));
  try {
    insertCoachUser.run(fullName, email, phone, hash, null, createdAt);
  } catch (e) { /* skip */ }
}
console.log('تم إنشاء ' + coachCount + ' مدرب');

// ---------- Attendance (varied per-student patterns) ----------
const insertAttendance = db.prepare(`INSERT OR IGNORE INTO attendance (studentId, date, status, notes) VALUES (?, ?, ?, ?)`);
const statuses = ['حاضر', 'غائب', 'معذر'];
const today = new Date();
const DAYS = 120;

// Assign each student an attendance profile
students.forEach(s => {
  const r = Math.random();
  if (r < 0.30) s.attProfile = 'excellent';      // ~85% present
  else if (r < 0.60) s.attProfile = 'good';        // ~65% present
  else if (r < 0.80) s.attProfile = 'average';     // ~45% present
  else if (r < 0.92) s.attProfile = 'poor';         // ~25% present
  else s.attProfile = 'inconsistent';               // random
});

const insertAttendanceTx = db.transaction(() => {
  for (let dayOffset = 0; dayOffset < DAYS; dayOffset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);
    if (d.getDay() === 4 || d.getDay() === 5) continue; // skip Thu/Fri
    const dateStr = ymd(d);
    students.forEach(s => {
      if (s.status !== 'نشط' && Math.random() > 0.15) return; // inactive rarely attend
      let roll = Math.random();
      let presentProb = 0.85;
      if (s.attProfile === 'excellent') presentProb = 0.9;
      else if (s.attProfile === 'good') presentProb = 0.7;
      else if (s.attProfile === 'average') presentProb = 0.5;
      else if (s.attProfile === 'poor') presentProb = 0.28;
      else presentProb = 0.6;
      if (roll > presentProb) {
        const sr = Math.random();
        const status = sr < 0.7 ? 'غائب' : 'معذر';
        insertAttendance.run(s.id, dateStr, status, status === 'معذر' ? 'عذر طبي' : null);
      } else {
        insertAttendance.run(s.id, dateStr, 'حاضر', null);
      }
    });
  }
});
insertAttendanceTx();
console.log('تم إنشاء سجلات الحضور');

// ---------- Subscriptions (realistic statuses) ----------
const insertSub = db.prepare(`
  INSERT INTO subscriptions (studentId, type, days, amount, startDate, endDate, status, paymentMethod, notes, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const subPlans = [
  { type: 'شهر', days: 30, amount: 150 },
  { type: 'ربع سنوي', days: 90, amount: 400 },
  { type: 'نصف سنة', days: 180, amount: 750 },
  { type: 'سنة', days: 365, amount: 1200 }
];

const insertSubTx = db.transaction(() => {
  students.forEach(s => {
    if (Math.random() > 0.82) return; // ~18% have no subscription
    const plan = randomItem(subPlans);
    const roll = Math.random();
    let startDate, endDate, status;
    if (roll < 0.62) {
      startDate = generateRecentDate(0, 60);
      endDate = addDays(startDate, plan.days);
      status = 'نشط';
    } else if (roll < 0.78) {
      startDate = generateRecentDate(120, 400);
      endDate = addDays(startDate, plan.days);
      status = 'منتهي';
    } else if (roll < 0.90) {
      startDate = generateRecentDate(10, 90);
      endDate = addDays(startDate, plan.days);
      status = 'موقوف';
    } else {
      startDate = ymd(today);
      endDate = addDays(startDate, plan.days);
      status = 'بانتظار الدفع';
    }
    const payment = randomItem(['نقدي', 'تحويل', 'بطاقة']);
    insertSub.run(s.id, plan.type, plan.days, plan.amount, startDate, endDate, status, payment, null, startDate);
  });
});
insertSubTx();

function generateRecentDate(minDaysAgo, maxDaysAgo) {
  const d = new Date(today);
  d.setDate(d.getDate() - randomInt(minDaysAgo, maxDaysAgo));
  return ymd(d);
}
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return ymd(d);
}
console.log('تم إنشاء الاشتراكات');

// ---------- Contact messages ----------
const insertContact = db.prepare(`INSERT INTO contact_messages (name, phone, message, createdAt) VALUES (?, ?, ?, ?)`);
const messages = ['أبي أسجل ابني في النادي', 'كم سعر الاشتراك الشهري؟', 'هل عندكم تدريب للبنات؟', 'أبي أعرف مواعيد التدريب', 'هل المدربون معتمدون؟', 'أبي أحجز حصة تجريبية', 'كم عمر الطفل اللي يقدر يبدأ؟', 'هل عندكم بطولات قادمة؟', 'ممكن استفسار عن الاشتراك السنوي', 'هل يوجد تجهيزات كافية؟'];
for (let i = 0; i < 50; i++) {
  insertContact.run(`${randomItem(firstNames)} ${randomItem(lastNames)}`, generatePhone(), randomItem(messages), generateDate(randomInt(0, 2)));
}
console.log('تم إنشاء رسائل التواصل');

// ---------- Summary ----------
const sc = db.prepare('SELECT COUNT(*) c FROM students').get().c;
const cc = db.prepare("SELECT COUNT(*) c FROM users WHERE role='coach'").get().c;
const ac = db.prepare('SELECT COUNT(*) c FROM attendance').get().c;
const subc = db.prepare('SELECT COUNT(*) c FROM subscriptions').get().c;
const pending = db.prepare("SELECT COUNT(*) c FROM subscriptions WHERE status='بانتظار الدفع'").get().c;
const paused = db.prepare("SELECT COUNT(*) c FROM subscriptions WHERE status='موقوف'").get().c;
const expired = db.prepare("SELECT COUNT(*) c FROM subscriptions WHERE status='منتهي'").get().c;
const active = db.prepare("SELECT COUNT(*) c FROM subscriptions WHERE status='نشط'").get().c;
const cmc = db.prepare('SELECT COUNT(*) c FROM contact_messages').get().c;
console.log('\nملخص البيانات:');
console.log('  الطلاب: ' + sc);
console.log('  المدربون: ' + cc);
console.log('  سجلات الحضور: ' + ac);
console.log('  الاشتراكات: ' + subc + ' (نشط:' + active + ' منتهي:' + expired + ' موقوف:' + paused + ' بانتظار الدفع:' + pending + ')');
console.log('  رسائل التواصل: ' + cmc);
db.close();
console.log('\nتم إنشاء بيانات الاختبار بنجاح!');
