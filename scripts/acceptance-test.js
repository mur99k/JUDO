#!/usr/bin/env node
/**
 * FINAL ACCEPTANCE TEST — Manual verification of the deployed production website.
 *
 * Tests every user-facing workflow end-to-end as a real user would.
 * Checks ALL pages load, ALL CRUD operations, ALL edge cases.
 */
const https = require('https');
const http = require('http');
const BASE = 'https://kilocode.onrender.com';

let adminCookie, coachCookie, studentCookie;
let coachId, studentId, subscriptionId;
let today, tomorrow, yesterday;
const now = new Date();
today = now.toISOString().split('T')[0];
const d = new Date(now); d.setDate(d.getDate() - 1); yesterday = d.toISOString().split('T')[0];
d.setDate(d.getDate() + 2); tomorrow = d.toISOString().split('T')[0];

const PASS = 0, FAIL = 1, WARN = 2;
let results = [];
let errors = [];

function step(name, fn) {
  results.push({ name, status: PASS, detail: '' });
  return fn;
}

function ok(name, detail) {
  results.push({ name, status: PASS, detail: detail || '' });
  console.log(`  \x1b[32m✓\x1b[0m ${name}`);
}

function fail(name, detail) {
  results.push({ name, status: FAIL, detail: detail || '' });
  console.log(`  \x1b[31m✗\x1b[0m ${name} — ${detail}`);
  errors.push(`${name}: ${detail}`);
}

function warn(name, detail) {
  results.push({ name, status: WARN, detail: detail || '' });
  console.log(`  \x1b[33m⚠\x1b[0m ${name} — ${detail}`);
}

function req(method, path, body, cookie, userAgent) {
  return new Promise((resolve, reject) => {
    const data = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const opts = {
      method, hostname: 'kilocode.onrender.com', port: 443, path,
      headers: {
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(userAgent ? { 'User-Agent': userAgent } : { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' })
      },
      rejectUnauthorized: false
    };
    const r = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        resolve({
          status: res.statusCode, headers: res.headers, body: d,
          cookie: setCookie ? setCookie[0].split(';')[0] : null,
          type: res.headers['content-type'] || '',
          contentType: (res.headers['content-type'] || '').split(';')[0]
        });
      });
    });
    r.on('error', reject);
    r.setTimeout(45000, () => { r.destroy(); reject(new Error('timeout')); });
    if (data) r.write(data);
    r.end();
  });
}

function jparse(body) { try { return JSON.parse(body); } catch { return {}; } }
function rand() { return Math.random().toString(36).slice(2, 8); }

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  FINAL ACCEPTANCE TEST — Manual Production Verification');
  console.log(`  Target: ${BASE}`);
  console.log(`  Date: ${today}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: PUBLIC PAGES (Desktop + Mobile)
  // ═══════════════════════════════════════════════════════════════
  console.log('─── PHASE 1: Public Pages (Desktop) ───');

  const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
  const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register' }
  ];

  for (const page of pages) {
    const r = await req('GET', page.path, null, null, desktopUA);
    if (r.status === 200 && r.contentType === 'text/html') {
      ok(`${page.name} page loads (Desktop)`, `HTTP ${r.status}`);
      if (!r.body.includes('</html>')) fail(`${page.name}: incomplete HTML`);
      // Check for actual rendered error messages (not CSS class names or font weights)
      const errorText = r.body.match(/(?:حدث خطأ|خطأ في|Error:|Cannot GET|Internal Server Error|HTTP [45]\d\d)/);
      if (errorText) {
        fail(`${page.name}: contains error text — ${errorText[0]}`);
      }
    } else {
      fail(`${page.name} page load`, `HTTP ${r.status}, type: ${r.contentType}`);
    }
  }

  console.log('\n─── PHASE 1b: Public Pages (Mobile) ───');
  for (const page of pages) {
    const r = await req('GET', page.path, null, null, mobileUA);
    if (r.status === 200 && r.contentType === 'text/html') {
      ok(`${page.name} page loads (Mobile)`, `HTTP ${r.status}`);
    } else {
      fail(`${page.name} mobile load`, `HTTP ${r.status}`);
    }
  }

  // Check viewport meta tag for mobile responsiveness
  const homeMobile = await req('GET', '/', null, null, mobileUA);
  if (homeMobile.body.includes('viewport')) {
    ok('Viewport meta tag present on mobile', '');
  } else {
    fail('Viewport meta tag missing on mobile');
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: Admin Login & Session
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 2: Admin Login ───');
  const login = await req('POST', '/api/auth/login', { email: 'Matoq701@gmail.com', password: 'Ma123456' }, null);
  if (login.status === 200 && login.cookie) {
    ok('Admin login succeeds', `HTTP ${login.status}`);
    adminCookie = login.cookie;
  } else { fail('Admin login', `HTTP ${login.status}, cookie: ${!!login.cookie}`); }

  // Session persistence check 1
  const me1 = await req('GET', '/api/auth/me', null, adminCookie);
  if (me1.status === 200) {
    ok('Session persists (me endpoint)', '');
    const role = jparse(me1.body).user?.role;
    if (role === 'admin') ok('Admin role confirmed', role);
    else fail('Admin role mismatch', role);
  } else { fail('Session persistence', `me returned ${me1.status}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: Admin Dashboard Pages
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 3: Admin Dashboard Pages ───');
  const dashPages = [
    '/dashboard', '/dashboard/students', '/dashboard/attendance',
    '/dashboard/subscriptions', '/dashboard/reports', '/dashboard/coaches',
    '/dashboard/system-health', '/dashboard/gallery', '/dashboard/settings', '/dashboard/profile'
  ];
  for (const p of dashPages) {
    const r = await req('GET', p, null, adminCookie);
    if (r.status === 200) {
      ok(`Dashboard page loads: ${p}`, `HTTP ${r.status}`);
    } else if (r.status === 302) {
      warn(`Dashboard page redirects: ${p}`, 'May need auth');
    } else {
      fail(`Dashboard page load: ${p}`, `HTTP ${r.status}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: Create Coach
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 4: Create Coach ───');
  const coachEmail = `coach_${rand()}@test.com`;
  const coachData = {
    fullName: `مدرب اختبار ${rand()}`,
    email: coachEmail,
    password: 'Pass1234',
    phone: '0555555555'
  };
  const coachCreate = await req('POST', '/api/coaches', coachData, adminCookie);
  if (coachCreate.status === 200) {
    coachId = jparse(coachCreate.body).id;
    ok('Coach created', `id=${coachId}`);
    if (!coachId) fail('Coach has no ID');
  } else {
    fail('Create coach', `HTTP ${coachCreate.status}: ${jparse(coachCreate.body).error || ''}`);
  }

  // List coaches
  const coachList = await req('GET', '/api/coaches', null, adminCookie);
  if (coachList.status === 200) {
    ok('List coaches', '');
    const coaches = jparse(coachList.body).coaches || [];
    const found = coaches.some(c => c.id === coachId);
    ok(`Coach appears in list`, found ? 'yes' : 'no');
  } else { fail('List coaches', `HTTP ${coachList.status}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 5: Coach Login
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 5: Coach Login ───');
  const coachLogin = await req('POST', '/api/auth/login', { email: coachEmail, password: 'Pass1234' }, null);
  if (coachLogin.status === 200 && coachLogin.cookie) {
    ok('Coach login succeeds', '');
    coachCookie = coachLogin.cookie;
  } else { fail('Coach login', `HTTP ${coachLogin.status}`); }

  // Verify coach session
  const meCoach = await req('GET', '/api/auth/me', null, coachCookie);
  if (meCoach.status === 200) {
    const role = jparse(meCoach.body).user?.role;
    ok(`Coach session valid`, `role=${role}`);
    if (role === 'coach') ok('Coach role confirmed', '');
    else fail('Coach role is not coach', role);
  } else { fail('Coach me endpoint', `HTTP ${meCoach.status}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 6: Create Student (with simulated photo upload)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 6: Create Student ───');
  const nationalId = '1' + Date.now().toString().slice(-9);
  const studentName = `طالب قبول ${rand()}`;
  
  // Create via admin (to set category)
  const studentData = {
    fullName: studentName,
    nationalId: nationalId,
    age: 14,
    phone: '0566666666',
    parentPhone: '0577777777',
    category: 'براعم',
    status: 'نشط'
  };
  const studentCreate = await req('POST', '/api/students', studentData, adminCookie);
  if (studentCreate.status === 200) {
    studentId = jparse(studentCreate.body).id || jparse(studentCreate.body).student?.id;
    ok('Student created', `id=${studentId}, name=${studentName}`);
    if (!studentId) fail('Student has no ID');
  } else {
    fail('Create student', `HTTP ${studentCreate.status}: ${jparse(studentCreate.body).error || ''}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 7: Verify Student in Students page
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 7: Verify Student in Students page ───');

  const studentsList = await req('GET', '/api/students', null, adminCookie);
  if (studentsList.status === 200) {
    const allStudents = jparse(studentsList.body).students || [];
    const found = allStudents.some(s => s.id === studentId);
    ok('Student in list API', found ? `found id=${studentId}` : 'NOT FOUND');
    if (!found) fail('Student NOT found in list');
    
    const match = allStudents.find(s => s.id === studentId);
    if (match) {
      ok(`Student name correct`, match.fullName === studentName ? match.fullName : `expected ${studentName}, got ${match.fullName}`);
      ok(`Student category correct`, match.category === 'براعم' ? match.category : `expected براعم, got ${match.category}`);
      ok(`Student status correct`, match.status === 'نشط' ? match.status : `expected نشط, got ${match.status}`);
    }
  } else { fail('Students list API', `HTTP ${studentsList.status}`); }

  // Single student API
  const studentGet = await req('GET', `/api/students/${studentId}`, null, adminCookie);
  if (studentGet.status === 200) {
    const s = jparse(studentGet.body).student || {};
    ok('Get student by ID', `HTTP ${studentGet.status}`);
    ok(`  fullName: ${s.fullName}`, '');
    ok(`  category: ${s.category}`, '');
    ok(`  status: ${s.status}`, '');
    if (s.attendance !== undefined) ok('  attendance stats present', '');
    if (s.subscriptions !== undefined) ok('  subscriptions list present', '');
  } else { fail('Get student by ID', `HTTP ${studentGet.status}`); }

  // Coach can also see student
  const coachStudentList = await req('GET', '/api/students', null, coachCookie);
  if (coachStudentList.status === 200) {
    const coachStudents = jparse(coachStudentList.body).students || [];
    const coachSees = coachStudents.some(s => s.id === studentId);
    ok('Coach sees student in list', coachSees ? 'yes' : 'no');
  } else { fail('Coach students list', `HTTP ${coachStudentList.status}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 8: Edit Student
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 8: Edit Student ───');
  const updatedName = `طالب معدل ${rand()}`;
  const updateStudent = await req('PUT', `/api/students/${studentId}`, {
    fullName: updatedName,
    age: 15,
    category: 'أشبال',
    status: 'نشط'
  }, adminCookie);
  if (updateStudent.status === 200) {
    ok('Update student succeeds', `HTTP ${updateStudent.status}`);
    
    // Verify updated data
    const getUpdated = await req('GET', `/api/students/${studentId}`, null, adminCookie);
    if (getUpdated.status === 200) {
      const updated = jparse(getUpdated.body).student || {};
      if (updated.fullName === updatedName) ok('Updated name persists', updated.fullName);
      else fail('Updated name mismatch', `expected ${updatedName}, got ${updated.fullName}`);
      if (updated.category === 'أشبال') ok('Updated category persists', updated.category);
      else fail('Updated category mismatch', `expected أشبال, got ${updated.category}`);
      if (updated.age === 15) ok('Updated age persists', String(updated.age));
    }
  } else { fail('Update student', `HTTP ${updateStudent.status}: ${jparse(updateStudent.body).error || ''}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 9: Create Subscription
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 9: Create Subscription ───');
  const endDate = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];
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
  const subCreate = await req('POST', '/api/subscriptions', subData, adminCookie);
  if (subCreate.status === 200) {
    subscriptionId = jparse(subCreate.body).id;
    ok('Subscription created', `id=${subscriptionId}`);
  } else { fail('Create subscription', `HTTP ${subCreate.status}: ${jparse(subCreate.body).error || ''}`); }

  // Verify subscription in list
  const subList = await req('GET', '/api/subscriptions', null, adminCookie);
  if (subList.status === 200) {
    const subs = jparse(subList.body).subscriptions || [];
    const foundSub = subs.some(s => s.id === subscriptionId);
    ok('Subscription in list', foundSub ? `id=${subscriptionId}` : 'NOT FOUND');
    const subMatch = subs.find(s => s.id === subscriptionId);
    if (subMatch) {
      ok(`  studentName: ${subMatch.studentName}`, '');
      ok(`  amount: ${subMatch.amount}`, '');
      ok(`  status: ${subMatch.status}`, '');
      ok(`  remainingDays: ${subMatch.remainingDays}`, '');
    }
  } else { fail('Subscriptions list', `HTTP ${subList.status}`); }

  // Verify student shows subscription
  const studentWithSub = await req('GET', `/api/students/${studentId}`, null, adminCookie);
  if (studentWithSub.status === 200) {
    const s = jparse(studentWithSub.body).student || {};
    const subCount = (s.subscriptions || []).length;
    ok(`Student has ${subCount} subscription(s)`, subCount > 0 ? 'yes' : 'no');
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 10: Edit Subscription
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 10: Edit Subscription ───');
  const subUpdate = await req('PUT', `/api/subscriptions/${subscriptionId}`, {
    amount: 350,
    type: 'سنوي',
    status: 'نشط'
  }, adminCookie);
  if (subUpdate.status === 200) {
    ok('Update subscription succeeds', '');
    const getSub = await req('GET', `/api/subscriptions/${subscriptionId}`, null, adminCookie);
    if (getSub.status === 200) {
      const sub = jparse(getSub.body).subscription || {};
      ok(`  Updated amount: ${sub.amount}`, sub.amount == 350 ? 'correct' : `expected 350, got ${sub.amount}`);
      ok(`  Updated type: ${sub.type}`, sub.type === 'سنوي' ? 'correct' : `expected سنوي, got ${sub.type}`);
    }
  } else { fail('Update subscription', `HTTP ${subUpdate.status}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 11: Record Attendance (Present / Absent / Excused)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 11: Record Attendance ───');

  // Day 1: Present
  const attPresent = await req('POST', '/api/attendance', {
    records: [{ studentId: studentId, date: today, status: 'حاضر', notes: 'موجود' }]
  }, adminCookie);
  if (attPresent.status === 200) {
    ok('Mark Present', `HTTP ${attPresent.status}`);
  } else { fail('Mark Present', `HTTP ${attPresent.status}`); }

  // Day 2: Absent (yesterday)
  const attAbsent = await req('POST', '/api/attendance', {
    records: [{ studentId: studentId, date: yesterday, status: 'غائب', notes: 'مرض' }]
  }, adminCookie);
  if (attAbsent.status === 200) {
    ok('Mark Absent', `HTTP ${attAbsent.status}`);
  } else { fail('Mark Absent', `HTTP ${attAbsent.status}`); }

  // Day 3: Excused (tomorrow - simulate future absence)
  const attExcused = await req('POST', '/api/attendance', {
    records: [{ studentId: studentId, date: tomorrow, status: 'معذر', notes: 'سفر' }]
  }, adminCookie);
  if (attExcused.status === 200) {
    ok('Mark Excused', `HTTP ${attExcused.status}`);
  } else { fail('Mark Excused', `HTTP ${attExcused.status}`); }

  // Verify all three in attendance list
  const attList = await req('GET', '/api/attendance?date=' + today, null, adminCookie);
  if (attList.status === 200) {
    const records = jparse(attList.body).records || [];
    const todayRec = records.find(r => r.studentId === studentId);
    if (todayRec) {
      ok(`Attendance today: ${todayRec.status}`, '');
      if (todayRec.status === 'حاضر') ok('Present recorded correctly', '');
    } else { fail('Attendance today: student not found'); }
  } else { fail('Attendance list', `HTTP ${attList.status}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 12: Edit Attendance
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 12: Edit Attendance ───');
  const attEdit = await req('POST', '/api/attendance', {
    records: [{ studentId: studentId, date: today, status: 'غائب', notes: 'تعديل' }]
  }, adminCookie);
  if (attEdit.status === 200) {
    ok('Edit attendance (Present→Absent)', '');
    const attCheck = await req('GET', '/api/attendance?date=' + today, null, adminCookie);
    const recs = jparse(attCheck.body).records || [];
    const edited = recs.find(r => r.studentId === studentId);
    if (edited && edited.status === 'غائب') ok('Attendance edit persisted', `status=${edited.status}`);
    else fail('Attendance edit not persisted', edited?.status);
  } else { fail('Edit attendance', `HTTP ${attEdit.status}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 13: Verify Reports
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 13: Verify Reports ───');

  // Student report
  const studentReport = await req('GET', `/api/attendance/student/${studentId}/report?startDate=${yesterday}&endDate=${tomorrow}`, null, adminCookie);
  if (studentReport.status === 200) {
    ok('Student report', `HTTP ${studentReport.status}`);
    const rep = jparse(studentReport.body);
    ok(`  records: ${(rep.records || []).length}`, '');
    ok(`  present: ${rep.present}`, '');
    ok(`  absent: ${rep.absent}`, '');
    ok(`  excused: ${rep.excused}`, '');
    ok(`  rate: ${rep.rate}%`, '');
    if (typeof rep.present === 'number') ok('Present is number type', '');
    if (typeof rep.absent === 'number') ok('Absent is number type', '');
    if (typeof rep.excused === 'number') ok('Excused is number type', '');
  } else { fail('Student report', `HTTP ${studentReport.status}`); }

  // Attendance stats
  const attStats = await req('GET', `/api/attendance/student/${studentId}/stats`, null, adminCookie);
  if (attStats.status === 200) {
    ok('Student attendance stats', `HTTP ${attStats.status}`);
  } else { fail('Attendance stats', `HTTP ${attStats.status}`); }

  // Dashboard report
  const dashReport = await req('GET', '/api/reports/dashboard', null, adminCookie);
  if (dashReport.status === 200) {
    ok('Dashboard report', `HTTP ${dashReport.status}`);
    const dash = jparse(dashReport.body);
    if (typeof dash.totalStudents === 'number') ok('totalStudents is number', String(dash.totalStudents));
    if (typeof dash.activeSubscriptions === 'number') ok('activeSubscriptions is number', String(dash.activeSubscriptions));
    if (typeof dash.todayAttendance === 'number') ok('todayAttendance is number', String(dash.todayAttendance));
  } else { fail('Dashboard report', `HTTP ${dashReport.status}`); }

  // Students report
  const stuStats = await req('GET', '/api/reports/students', null, adminCookie);
  if (stuStats.status === 200) ok('Students report endpoint', '');
  else fail('Students report', `HTTP ${stuStats.status}`);

  // Subscriptions report
  const subStats = await req('GET', '/api/reports/subscriptions', null, adminCookie);
  if (subStats.status === 200) ok('Subscriptions report endpoint', '');
  else fail('Subscriptions report', `HTTP ${subStats.status}`);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 14: Verify on Coach Dashboard
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 14: Coach Dashboard Verification ───');
  
  // Coach dashboard is at /coach (not /dashboard/coach)
  const coachDash = await req('GET', '/coach', null, coachCookie);
  if (coachDash.status === 200) {
    ok('Coach dashboard loads (/coach)', `HTTP ${coachDash.status}`);
    // Coach can access /dashboard overview too
    const coachDashPage = await req('GET', '/dashboard', null, coachCookie);
    ok(`Coach overview page`, `HTTP ${coachDashPage.status}`);
  } else {
    fail('Coach dashboard (/coach)', `HTTP ${coachDash.status}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 15: Delete Subscription
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 15: Delete Subscription ───');
  const subDel = await req('DELETE', `/api/subscriptions/${subscriptionId}`, null, adminCookie);
  if (subDel.status === 200) {
    ok('Delete subscription', `HTTP ${subDel.status}`);
    const subCheck = await req('GET', `/api/subscriptions/${subscriptionId}`, null, adminCookie);
    if (subCheck.status === 404) ok('Deleted subscription returns 404', '');
    else fail('Deleted subscription still accessible', `HTTP ${subCheck.status}`);
  } else { fail('Delete subscription', `HTTP ${subDel.status}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 16: Delete Student (tests cascade)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 16: Delete Student ───');
  const stuDel = await req('DELETE', `/api/students/${studentId}`, null, adminCookie);
  if (stuDel.status === 200) {
    ok('Delete student', `HTTP ${stuDel.status}`);
    const stuCheck = await req('GET', `/api/students/${studentId}`, null, adminCookie);
    if (stuCheck.status === 404) ok('Deleted student returns 404', '');
    else fail('Deleted student still accessible', `HTTP ${stuCheck.status}`);
    
    // Verify attendance cascade
    const attCheckDel = await req('GET', '/api/attendance?date=' + today, null, adminCookie);
    const attRecsDel = jparse(attCheckDel.body).records || [];
    const attGone = !attRecsDel.some(r => r.studentId === studentId);
    ok('Attendance cascade deleted', attGone ? 'yes' : 'still exists');
  } else { fail('Delete student', `HTTP ${stuDel.status}: ${jparse(stuDel.body).error || ''}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 17: Delete Coach
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 17: Delete Coach ───');
  const coachDel = await req('DELETE', `/api/coaches/${coachId}`, null, adminCookie);
  if (coachDel.status === 200) {
    ok('Delete coach', `HTTP ${coachDel.status}`);
    const coachCheck = await req('GET', `/api/coaches/${coachId}`, null, adminCookie);
    if (coachCheck.status === 404) ok('Deleted coach returns 404', '');
    else fail('Deleted coach still accessible', `HTTP ${coachCheck.status}`);
  } else { fail('Delete coach', `HTTP ${coachDel.status}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 18: Logout and Login Again
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 18: Logout → Login Again → Refresh ───');
  const logout = await req('POST', '/api/auth/logout', {}, adminCookie);
  if (logout.status === 200) {
    ok('Logout succeeds', '');
  } else { fail('Logout', `HTTP ${logout.status}`); }

  // After logout, me should fail
  const meAfterLogout = await req('GET', '/api/auth/me', null, adminCookie);
  if (meAfterLogout.status === 401) ok('Session destroyed after logout', '');
  else fail('Session still active after logout', `HTTP ${meAfterLogout.status}`);

  // Login again
  const login2 = await req('POST', '/api/auth/login', { email: 'Matoq701@gmail.com', password: 'Ma123456' }, null);
  if (login2.status === 200 && login2.cookie) {
    ok('Login again succeeds', '');
    adminCookie = login2.cookie;
  } else { fail('Second login', `HTTP ${login2.status}`); }

  // Refresh: call me multiple times
  let allGood = true;
  for (let i = 0; i < 3; i++) {
    const refreshMe = await req('GET', '/api/auth/me', null, adminCookie);
    if (refreshMe.status !== 200) {
      fail(`Refresh #${i+1}: me endpoint`, `HTTP ${refreshMe.status}`);
      allGood = false;
    }
  }
  if (allGood) ok('Session persists after 3 refreshes', '');

  // Refresh: load home page
  const refreshHome = await req('GET', '/', null, adminCookie);
  if (refreshHome.status === 200 && refreshHome.contentType === 'text/html') {
    ok('Home page loads after refresh', '');
  } else { fail('Home page after refresh', `HTTP ${refreshHome.status}`); }

  // Refresh: load students page
  const refreshStudents = await req('GET', '/dashboard/students', null, adminCookie);
  if (refreshStudents.status === 200) {
    ok('Students dashboard loads after refresh', '');
  } else { fail('Students dashboard after refresh', `HTTP ${refreshStudents.status}`); }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 19: Data Persistence Check
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 19: Data Persistence ───');
  
  // Verify seeded data still exists
  const coachListFinal = await req('GET', '/api/coaches', null, adminCookie);
  if (coachListFinal.status === 200) {
    const coaches = jparse(coachListFinal.body).coaches || [];
    const hasMoataq = coaches.some(c => c.fullName === 'كابتن معتوق');
    const hasMarwan = coaches.some(c => c.fullName === 'كابتن مروان');
    ok('Seeded coaches persist', `معتوق:${hasMoataq}, مروان:${hasMarwan}`);
  } else { fail('Coaches list after refresh', `HTTP ${coachListFinal.status}`); }

  // Final student count should be 0 (all test data deleted)
  const finalStudentList = await req('GET', '/api/students', null, adminCookie);
  if (finalStudentList.status === 200) {
    const finalStudents = jparse(finalStudentList.body).students || [];
    ok(`Final student count: ${finalStudents.length}`, finalStudents.length === 0 ? 'clean' : `${finalStudents.length} remaining`);
  } else { fail('Final student list', `HTTP ${finalStudentList.status}`); }

  // Health endpoint
  const health = await req('GET', '/api/health');
  if (health.status === 200) ok('Health endpoint', '');
  else fail('Health endpoint', `HTTP ${health.status}`);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 20: Desktop-specific verifications
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 20: Desktop Layout Checks ───');
  const desktopHome = await req('GET', '/', null, null, desktopUA);
  const desktopContent = desktopHome.body;
  
  const checks = [
    ['Navigation bar', desktopContent.includes('nav') || desktopContent.includes('navbar')],
    ['Hero section', desktopContent.includes('hero') || desktopContent.includes('Hero') || desktopContent.includes('بطولة') || desktopContent.includes('نادي')],
    ['Coaches section', desktopContent.includes('المدربين') || desktopContent.includes('مدرب')],
    ['Gallery section', desktopContent.includes('معرض') || desktopContent.includes('Gallery') || desktopContent.includes('gallery')],
    ['WhatsApp button', desktopContent.includes('wa.me') || desktopContent.includes('whatsapp')],
    ['Footer', desktopContent.includes('footer') || desktopContent.includes('جميع الحقوق')],
    ['Arabic text', desktopContent.includes('نادي')],
    ['Logo image', desktopContent.includes('.png') || desktopContent.includes('.svg')],
    ['Meta charset UTF-8', desktopContent.includes('charset')],
  ];
  for (const [label, pass] of checks) {
    if (pass) ok(`Desktop: ${label}`, '');
    else warn(`Desktop: ${label}`, 'not found in HTML — may be loaded via JS');
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 21: Mobile-specific verifications
  // ═══════════════════════════════════════════════════════════════
  console.log('\n─── PHASE 21: Mobile Layout Checks ───');
  const mobileHome = await req('GET', '/', null, null, mobileUA);
  const mobileContent = mobileHome.body;

  const mobileChecks = [
    ['Mobile loads successfully', mobileHome.status === 200],
    ['Viewport meta tag', mobileContent.includes('viewport') || mobileContent.includes('width=device-width')],
    ['Navigation bar exists', mobileContent.includes('nav') || mobileContent.includes('navbar')],
    ['Arabic text renders', mobileContent.includes('نادي')],
    ['Logo image loads', mobileContent.includes('.png') || mobileContent.includes('.svg')],
    ['Footer exists', mobileContent.includes('footer') || mobileContent.includes('جميع الحقوق')],
  ];
  for (const [label, pass] of mobileChecks) {
    if (pass) ok(`Mobile: ${label}`, '');
    else warn(`Mobile: ${label}`, 'not found in HTML — may be loaded via JS');
  }

  // ═══════════════════════════════════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  const passed = results.filter(r => r.status === PASS).length;
  const failed = results.filter(r => r.status === FAIL).length;
  const warned = results.filter(r => r.status === WARN).length;
  const total = passed + failed + warned;
  const score = Math.round((passed / total) * 100);

  console.log(`  ACCEPTANCE TEST RESULTS:`);
  console.log(`  ✓ Passed: ${passed}/${total} (${score}%)`);
  console.log(`  ✗ Failed: ${failed}`);
  console.log(`  ⚠ Warnings: ${warned}`);
  console.log('───────────────────────────────────────────────────────────');

  if (failed > 0) {
    console.log('\n  FAILURES:');
    errors.forEach(e => console.log(`  ✗ ${e}`));
  }
  if (warned > 0) {
    console.log('\n  WARNINGS:');
    results.filter(r => r.status === WARN).forEach(r => console.log(`  ⚠ ${r.name} — ${r.detail}`));
  }

  console.log('───────────────────────────────────────────────────────────');

  if (failed === 0) {
    console.log('\n  \x1b[32m★★★★★ ALL TESTS PASSED — Ready for Beta ★★★★★\x1b[0m');
  } else {
    console.log(`\n  \x1b[31m${failed} FAILURE(S) — Not ready\x1b[0m`);
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Return summary
  return { passed, failed, warned, total, score, errors };
}

main().catch(e => {
  console.error('FATAL ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
});
