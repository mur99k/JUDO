#!/usr/bin/env node
/**
 * Full system test after cleanup.
 * Tests every workflow without creating test data that persists.
 * We delete every student we create at the end.
 */
const https = require('https');
const BASE = process.argv[2] || 'https://kilocode.onrender.com';
const ADMIN = { email: 'Matoq701@gmail.com', password: 'Ma123456' };

let sessionCookie = null;
let coachCookie = null;
let studentId = null;
let coachId = null;
const results = [];

function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`);
  if (!ok && detail) console.log(`         ${detail}`);
}

function req(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method, hostname: 'kilocode.onrender.com', port: 443, path,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      },
      rejectUnauthorized: false
    };
    const r = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({
        status: res.statusCode, body: d, type: res.headers['content-type'] || '',
        cookie: res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null
      }));
    });
    r.on('error', reject);
    r.setTimeout(30000, () => { r.destroy(); reject(new Error('timeout')); });
    if (data) r.write(data);
    r.end();
  });
}

function jparse(body) { try { return JSON.parse(body); } catch { return {}; } }

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  FULL SYSTEM TEST');
  console.log('  Target: ' + BASE);
  console.log('═══════════════════════════════════════\n');

  // ─── 1. Admin Login ───
  console.log('─── 1. Admin Login ───');
  const login = await req('POST', '/api/auth/login', ADMIN);
  check('Admin login', login.status === 200, `status ${login.status}`);
  if (login.cookie) sessionCookie = login.cookie;
  check('Admin has session', !!sessionCookie);

  const me1 = await req('GET', '/api/auth/me', null, sessionCookie);
  check('Admin me endpoint', me1.status === 200, jparse(me1.body).user?.role);
  
  const adminRole = jparse(me1.body).user?.role;
  check('Admin role is admin', adminRole === 'admin', adminRole);

  // ─── 2. Create Coach ───
  console.log('\n─── 2. Create Coach ───');
  const coachData = {
    fullName: 'مدرب اختبار',
    email: 'testcoach_' + Date.now() + '@test.com',
    password: 'Test123456',
    phone: '0555555555'
  };
  const coachCreate = await req('POST', '/api/coaches', coachData, sessionCookie);
  check('Create coach', coachCreate.status === 200, `status ${coachCreate.status}`);
  coachId = jparse(coachCreate.body).id;
  check('Coach has ID', !!coachId, String(coachId));

  // ─── 3. Coach Login ───
  console.log('\n─── 3. Coach Login ───');
  const coachLogin = await req('POST', '/api/auth/login', {
    email: coachData.email, password: coachData.password
  });
  check('Coach login', coachLogin.status === 200, `status ${coachLogin.status}`);
  if (coachLogin.cookie) coachCookie = coachLogin.cookie;
  check('Coach has session', !!coachCookie);

  const meCoach = await req('GET', '/api/auth/me', null, coachCookie);
  check('Coach me endpoint', meCoach.status === 200, `role: ${jparse(meCoach.body).user?.role}`);
  check('Coach role is coach', jparse(meCoach.body).user?.role === 'coach');

  // ─── 4. Create Student ───
  console.log('\n─── 4. Create Student ───');
  const nationalId = '1' + Date.now().toString().slice(-9);
  const studentData = {
    fullName: 'طالب اختبار نهائي',
    nationalId: nationalId,
    age: 15,
    phone: '0566666666',
    parentPhone: '0577777777',
    category: 'براعم',
    status: 'نشط'
  };
  const studentCreate = await req('POST', '/api/students', studentData, sessionCookie);
  check('Create student', studentCreate.status === 200, `status ${studentCreate.status}`);
  studentId = jparse(studentCreate.body).id || jparse(studentCreate.body).student?.id;
  check('Student has ID', !!studentId, String(studentId));

  // ─── 5. List Students ───
  console.log('\n─── 5. List Students ───');
  const listStudents = await req('GET', '/api/students', null, sessionCookie);
  check('List students', listStudents.status === 200);
  const students = jparse(listStudents.body).students || [];
  check('Student appears in list', students.some(s => s.id === studentId), `found ${students.length} students`);
  check('Student fullName is correct', students.some(s => s.fullName === studentData.fullName));

  // ─── 6. Get Single Student ───
  console.log('\n─── 6. Get Single Student ───');
  const getStudent = await req('GET', '/api/students/' + studentId, null, sessionCookie);
  check('Get student by ID', getStudent.status === 200, `status ${getStudent.status}`);
  const student = jparse(getStudent.body).student || {};
  check('Student name matches', student.fullName === studentData.fullName, student.fullName);
  check('Student category matches', student.category === studentData.category, student.category);
  check('Student status is active', student.status === 'نشط', student.status);
  check('Student has attendance stats', student.attendance !== undefined);
  check('Student has subscriptions list', student.subscriptions !== undefined);

  // Check the me endpoint returns full student data too
  const meStudent = await req('GET', '/api/auth/me', null, sessionCookie);
  check('Admin me still works', meStudent.status === 200);

  // ─── 7. Coach can see student ───
  console.log('\n─── 7. Coach Access ───');
  const coachListStudents = await req('GET', '/api/students', null, coachCookie);
  check('Coach can list students', coachListStudents.status === 200);
  const coachStudents = jparse(coachListStudents.body).students || [];
  check('Coach sees student', coachStudents.some(s => s.id === studentId));

  const coachGetStudent = await req('GET', '/api/students/' + studentId, null, coachCookie);
  check('Coach can view student', coachGetStudent.status === 200);

  // ─── 8. Update Student ───
  console.log('\n─── 8. Update Student ───');
  const updateData = {
    fullName: 'طالب معدل',
    age: 16,
    category: 'أشبال',
    status: 'نشط'
  };
  const updateStudent = await req('PUT', '/api/students/' + studentId, updateData, sessionCookie);
  check('Update student', updateStudent.status === 200, `status ${updateStudent.status}`);

  const getUpdated = await req('GET', '/api/students/' + studentId, null, sessionCookie);
  check('Updated name persists', jparse(getUpdated.body).student?.fullName === 'طالب معدل');
  check('Updated category persists', jparse(getUpdated.body).student?.category === 'أشبال');

  // ─── 9. Add Subscription ───
  console.log('\n─── 9. Add Subscription ───');
  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const subData = {
    studentId: studentId,
    type: 'شهري',
    days: 30,
    amount: 300,
    startDate: today,
    endDate: endDate,
    status: 'نشط',
    paymentMethod: 'نقداً'
  };
  const createSub = await req('POST', '/api/subscriptions', subData, sessionCookie);
  check('Create subscription', createSub.status === 200, `status ${createSub.status}`);

  const listSubs = await req('GET', '/api/subscriptions', null, sessionCookie);
  check('List subscriptions', listSubs.status === 200);
  const subs = jparse(listSubs.body).subscriptions || [];
  check('Subscription appears in list', subs.some(s => s.studentId === studentId));
  check('Subscription has studentName', subs.some(s => s.studentName === 'طالب معدل'), subs.map(s=>s.studentName).join(','));

  // Check student shows subscription
  const getStudentWithSubs = await req('GET', '/api/students/' + studentId, null, sessionCookie);
  const sWithSubs = jparse(getStudentWithSubs.body).student || {};
  check('Student has subscription in getById', (sWithSubs.subscriptions || []).length > 0);

  // ─── 10. Mark Attendance ───
  console.log('\n─── 10. Mark Attendance ───');
  const attData = {
    records: [{ studentId: studentId, date: today, status: 'حاضر', notes: '' }]
  };
  const saveAtt = await req('POST', '/api/attendance', attData, sessionCookie);
  check('Save attendance', saveAtt.status === 200, `status ${saveAtt.status}`);

  const listAtt = await req('GET', '/api/attendance?date=' + today, null, sessionCookie);
  check('List attendance', listAtt.status === 200, `status ${listAtt.status}`);
  const attRecords = jparse(listAtt.body).records || [];
  check('Attendance shows student', attRecords.some(r => r.studentId === studentId));
  check('Attendance status is حاضر', attRecords.some(r => r.status === 'حاضر'));

  // ─── 11. Student Report ───
  console.log('\n─── 11. Student Report ───');
  const report = await req('GET', '/api/attendance/student/' + studentId + '/report?startDate=' + today + '&endDate=' + today, null, sessionCookie);
  check('Student report', report.status === 200, `status ${report.status}`);
  const repData = jparse(report.body);
  check('Report has present count', repData.present !== undefined);
  check('Report shows 1 present', repData.present === 1, String(repData.present));
  check('Present is number', typeof repData.present === 'number');

  // ─── 12. Dashboard Reports ───
  console.log('\n─── 12. Dashboard Reports ───');
  const dashReport = await req('GET', '/api/reports/dashboard', null, sessionCookie);
  check('Dashboard report', dashReport.status === 200, `status ${dashReport.status}`);
  const dash = jparse(dashReport.body);
  check('Dashboard shows 1 student', dash.totalStudents == 1, `got ${dash.totalStudents}`);
  check('Dashboard shows 1 active sub', dash.activeSubscriptions >= 1, `got ${dash.activeSubscriptions}`);

  const stuReport = await req('GET', '/api/reports/students', null, sessionCookie);
  check('Students report', stuReport.status === 200);

  const subReport = await req('GET', '/api/reports/subscriptions', null, sessionCookie);
  check('Subscriptions report', subReport.status === 200);

  // ─── 13. Attendance Stats ───
  console.log('\n─── 13. Attendance Stats ───');
  const stats = await req('GET', '/api/attendance/student/' + studentId + '/stats', null, sessionCookie);
  check('Student stats', stats.status === 200, `status ${stats.status}`);

  const todayAtt = await req('GET', '/api/attendance/today', null, sessionCookie);
  check('Today attendance', todayAtt.status === 200);

  // ─── 14. Settings ───
  console.log('\n─── 14. Settings ───');
  const settings = await req('GET', '/api/settings', null, sessionCookie);
  check('List settings', settings.status === 200);

  // ─── 15. Health Check ───
  console.log('\n─── 15. Health Check ───');
  const health = await req('GET', '/api/health');
  check('Health endpoint', health.status === 200);

  // ─── 16. Delete Student (tests cascade) ───
  console.log('\n─── 16. Delete Student (cascade test) ───');
  const delStudent = await req('DELETE', '/api/students/' + studentId, null, sessionCookie);
  check('Delete student', delStudent.status === 200, `status ${delStudent.status}`);

  // Verify student is gone
  const getDeleted = await req('GET', '/api/students/' + studentId, null, sessionCookie);
  check('Deleted student returns 404', getDeleted.status === 404, `status ${getDeleted.status}`);
  
  // Verify subscription cascade
  const subsAfter = await req('GET', '/api/subscriptions', null, sessionCookie);
  const subsList = jparse(subsAfter.body).subscriptions || [];
  check('Subscription cascade deleted', !subsList.some(s => s.studentId === studentId));

  // Verify attendance cascade
  const attAfter = await req('GET', '/api/attendance?date=' + today, null, sessionCookie);
  const attList = jparse(attAfter.body).records || [];
  check('Attendance cascade deleted', !attList.some(r => r.studentId === studentId));

  // ─── 17. Delete Coach ───
  console.log('\n─── 17. Cleanup Coach ───');
  const delCoach = await req('DELETE', '/api/coaches/' + coachId, null, sessionCookie);
  check('Delete coach', delCoach.status === 200, `status ${delCoach.status}`);

  const getDelCoach = await req('GET', '/api/coaches/' + coachId, null, sessionCookie);
  check('Deleted coach 404', getDelCoach.status === 404);

  // ─── RESULTS ───
  console.log('\n═══════════════════════════════════════');
  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  console.log(`  RESULTS: ${passed}/${total} passed`);
  console.log(`  SCORE: ${Math.round(passed/total*100)}%`);
  results.filter(r => !r.ok).forEach(r => console.log(`  FAIL: ${r.name} — ${r.detail}`));
  console.log('═══════════════════════════════════════\n');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
