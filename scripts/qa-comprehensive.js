// Comprehensive end-to-end production test
const https = require('https');
const PASS = '\u2705', FAIL = '\u274C', WARN = '\u26A0\uFE0F';
const total = { pass: 0, fail: 0, warn: 0 };
const HOST = 'kilocode.onrender.com';
const ORIGIN = 'https://' + HOST;
const ts = Date.now();

function check(name, ok) {
  console.log((ok ? PASS : FAIL) + ' ' + name);
  if (ok) total.pass++; else total.fail++;
}

function warn(name) {
  console.log(WARN + ' ' + name);
  total.warn++;
}

function login(data) {
  return new Promise((resolve) => {
    const d = JSON.stringify(data);
    const opts = { hostname: HOST, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'Origin': ORIGIN }, timeout: 30000 };
    const r = https.request(opts, (res) => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => resolve({ body: JSON.parse(b), cookie: res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null }));
    }); r.write(d); r.end();
  });
}

function authed(method, path, cookie, body) {
  return new Promise((resolve) => {
    const h = { 'Content-Type': 'application/json', 'Origin': ORIGIN };
    if (cookie) h['Cookie'] = cookie; if (body) h['Content-Length'] = Buffer.byteLength(body);
    const opts = { hostname: HOST, path, method, headers: h, timeout: 30000 };
    const r = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d), headers: res.headers }); }
        catch (e) { resolve({ status: res.statusCode, body: d, headers: res.headers }); }
      });
    }); r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    if (body) r.write(body); r.end();
  });
}

function getPage(path) {
  return new Promise(r => {
    https.get('https://' + HOST + path, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r({ status: res.statusCode, body: d }));
    }).on('error', e => r({ status: 0, body: '' }));
  });
}

(async () => {
  console.log('══════════════════════════════════════════════');
  console.log('  COMPREHENSIVE PRODUCTION TEST');
  console.log('══════════════════════════════════════════════\n');

  // ── SECTION 1: PUBLIC PAGES ──
  console.log('--- 1. PUBLIC PAGES ---');
  const pages = await Promise.all(['/', '/login', '/register', '/about', '/contact'].map(getPage));
  for (const [i, p] of ['/', '/login', '/register', '/about', '/contact'].entries()) {
    check(p + ' loads (200)', pages[i].status === 200);
  }

  // ── SECTION 2: AUTH ──
  console.log('\n--- 2. AUTHENTICATION ---');
  const adminLogin = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  check('Admin login', adminLogin.body && adminLogin.body.success);
  const ac = adminLogin.cookie;

  // wrong admin password
  const wl = await login({ email: 'Matoq701@gmail.com', password: 'wrong' });
  check('Admin wrong password', wl.body && !wl.body.success);

  // ── SECTION 3: ADMIN — STUDENTS CRUD ──
  console.log('\n--- 3. STUDENTS CRUD ---');
  const natId1 = '500000' + ts.toString().slice(-6);
  const s1 = await authed('POST', '/api/students', ac, JSON.stringify({ fullName: 'Comprehensive Test', nationalId: natId1, age: 11, phone: '0555000001', parentPhone: '0555000002', category: 'أطفال', status: 'نشط' }));
  check('Create student', s1.body && s1.body.success);
  const sid1 = s1.body && s1.body.id;

  const sList = await authed('GET', '/api/students', ac);
  check('List students', sList.body && sList.body.success && Array.isArray(sList.body.students));

  const sGet = await authed('GET', '/api/students/' + sid1, ac);
  check('Get student by ID', sGet.body && sGet.body.success && sGet.body.student);

  const sUpd = await authed('PUT', '/api/students/' + sid1, ac, JSON.stringify({ fullName: 'Comprehensive Updated', phone: '0555999999' }));
  check('Update student', sUpd.body && sUpd.body.success);

  const sSearch = await authed('GET', '/api/students?search=Comprehensive', ac);
  check('Search student', sSearch.body && sSearch.body.success && sSearch.body.students && sSearch.body.students.length > 0);

  // ── SECTION 4: SUBSCRIPTIONS ──
  console.log('\n--- 4. SUBSCRIPTIONS ---');
  // Use correct format: startDate + optional endDate
  const sub1 = await authed('POST', '/api/subscriptions', ac, JSON.stringify({ studentId: sid1, amount: 200, startDate: '2026-07-01', endDate: '2026-07-31', paymentMethod: 'نقداً' }));
  check('Create subscription with startDate+endDate', sub1.body && sub1.body.success);
  const subId1 = sub1.body && sub1.body.id;

  // Test auto-computed endDate
  const sub2 = await authed('POST', '/api/subscriptions', ac, JSON.stringify({ studentId: sid1, amount: 150, startDate: '2026-07-01', days: 15 }));
  check('Create subscription (auto-compute endDate)', sub2.body && sub2.body.success);
  const subId2 = sub2.body && sub2.body.id;

  const subList = await authed('GET', '/api/subscriptions?studentId=' + sid1, ac);
  check('List subscriptions', subList.body && subList.body.success && subList.body.subscriptions && subList.body.subscriptions.length >= 2);

  if (subId1) {
    const subDel = await authed('DELETE', '/api/subscriptions/' + subId1, ac);
    check('Delete subscription', subDel.body && subDel.body.success);
  }
  if (subId2) {
    const subDel2 = await authed('DELETE', '/api/subscriptions/' + subId2, ac);
    check('Delete subscription 2', subDel2.body && subDel2.body.success);
  }

  // ── SECTION 5: ATTENDANCE ──
  console.log('\n--- 5. ATTENDANCE ---');
  // Use correct format: records array
  const att = await authed('POST', '/api/attendance', ac, JSON.stringify({ records: [{ studentId: sid1, date: '2026-07-18', status: 'حاضر' }] }));
  check('Save attendance (records array)', att.body && att.body.success);

  const attGet = await authed('GET', '/api/attendance/today', ac);
  check('Get today attendance', attGet.status === 200);

  const attSummary = await authed('GET', '/api/attendance/summary?month=7&year=2026', ac);
  check('Attendance summary', attSummary.body && attSummary.body.success);

  // ── SECTION 6: REPORTS ──
  console.log('\n--- 6. REPORTS ---');
  const rDash = await authed('GET', '/api/reports/dashboard', ac);
  check('Report dashboard', rDash.body && rDash.body.success);

  const rStud = await authed('GET', '/api/reports/students', ac);
  check('Report students', rStud.body && rStud.body.success);

  const rSub = await authed('GET', '/api/reports/subscriptions', ac);
  check('Report subscriptions', rSub.body && rSub.body.success);

  // ── SECTION 7: PROFILE ──
  console.log('\n--- 7. PROFILE ---');
  const me = await authed('GET', '/api/auth/me', ac);
  check('Get profile (/api/auth/me)', me.body && me.body.success && me.body.user);

  // ── SECTION 8: COACH FLOW ──
  console.log('\n--- 8. COACH FLOW ---');
  const coachLogin = await login({ email: 'coach.moataq@riyadah.com', password: 'coach123' });
  check('Coach login', coachLogin.body && coachLogin.body.success);
  const cc = coachLogin.cookie;

  // Coach can view students
  const cStud = await authed('GET', '/api/students', cc);
  check('Coach: list students', cStud.body && cStud.body.success);

  // Coach can create attendance
  const cAtt = await authed('POST', '/api/attendance', cc, JSON.stringify({ records: [{ studentId: sid1, date: '2026-07-18', status: 'غائب' }] }));
  check('Coach: save attendance', cAtt.body && cAtt.body.success);

  // Coach CANNOT create subscriptions (admin only)
  const cSub = await authed('POST', '/api/subscriptions', cc, JSON.stringify({ studentId: sid1, amount: 100, startDate: '2026-07-01' }));
  check('Coach: subscription rejected', cSub.status === 403 || (cSub.body && !cSub.body.success));

  // Coach CANNOT delete students
  const cDel = await authed('DELETE', '/api/students/' + (sid1 + 9999), cc);
  check('Coach: delete student rejected', cDel.status === 403 || (cDel.body && !cDel.body.success));

  // ── SECTION 9: STUDENT FLOW ──
  console.log('\n--- 9. STUDENT FLOW ---');
  // Register student without password
  const regNatId = '300000' + ts.toString().slice(-6);
  const reg = await authed('POST', '/api/auth/register', null, JSON.stringify({ fullName: 'Student Flow Test', nationalId: regNatId, age: 9, phone: '0555123456' }));
  check('Register without password', reg.body && reg.body.success);
  const regCookie = reg.cookie || ((reg.headers && reg.headers['set-cookie']) ? reg.headers['set-cookie'][0].split(';')[0] : null);

  // Student login with nationalId ONLY
  const stuLogin = await login({ nationalId: regNatId });
  check('Student login (nationalId only)', stuLogin.body && stuLogin.body.success);
  const sc = stuLogin.cookie;

  // Student can view own profile
  const sMe = await authed('GET', '/api/auth/me', sc);
  check('Student: view profile', sMe.body && sMe.body.success && sMe.body.user);

  // Student CANNOT view admin APIs
  const sStudAll = await authed('GET', '/api/students', sc);
  check('Student: cannot list all students', sStudAll.status === 401 || sStudAll.status === 403 || !sStudAll.body.success);

  const sSubAll = await authed('POST', '/api/subscriptions', sc, JSON.stringify({ studentId: 1, amount: 100, startDate: '2026-07-01' }));
  check('Student: cannot create subscriptions', sSubAll.status === 401 || sSubAll.status === 403 || !sSubAll.body.success);

  const sAttAll = await authed('POST', '/api/attendance', sc, JSON.stringify({ records: [{ studentId: 1, date: '2026-07-18', status: 'حاضر' }] }));
  check('Student: cannot save attendance', sAttAll.status === 401 || sAttAll.status === 403 || !sAttAll.body.success);

  // Student profile page
  const stuPage = await getPage('/student');
  // Should redirect to login if not authenticated, or show dashboard if authenticated
  check('Student page accessible', stuPage.status < 500);

  // ── SECTION 10: CSRF PROTECTION ──
  console.log('\n--- 10. CSRF PROTECTION ---');
  // Test CSRF with raw request (authed always sends valid Origin)
  const csrfNatId = 'CSRF' + ts.toString().slice(-5);
  const csrf1 = await new Promise((resolve) => {
    const d = JSON.stringify({ fullName: 'CSRF Test', nationalId: csrfNatId, age: 10 });
    const opts = { hostname: HOST, path: '/api/students', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'Cookie': ac, 'Origin': 'https://evil.com' }, timeout: 30000 };
    const r = https.request(opts, (res) => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode }));
    }); r.write(d); r.end();
  });
  check('CSRF: blocks wrong origin', csrf1.status === 403);

  // ── SECTION 11: GALLERY ──
  console.log('\n--- 11. GALLERY ---');
  const gal = await authed('GET', '/api/gallery', ac);
  check('Gallery accessible', gal.status < 500);

  // ── SECTION 12: LOGOUT ──
  console.log('\n--- 12. LOGOUT & SESSION ---');
  const lo = await authed('POST', '/api/auth/logout', ac);
  check('Logout', lo.body && lo.body.success);

  const afterLogout = await authed('GET', '/api/auth/me', ac);
  check('Session destroyed after logout', afterLogout.status === 401 || (afterLogout.body && !afterLogout.body.success));

  // ── SECTION 13: CLEANUP ──
  console.log('\n--- 13. CLEANUP ---');
  if (sid1) {
    // Need to re-login as admin for cleanup
    const a2 = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
    await authed('DELETE', '/api/students/' + sid1, a2.cookie);
  }
  // Clean up registered student
  if (reg.body && reg.body.user && reg.body.user.id) {
    const a3 = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
    await authed('DELETE', '/api/students/' + reg.body.user.id, a3.cookie);
  }

  // ── RESULTS ──
  console.log('\n══════════════════════════════════════════════');
  console.log('  FINAL RESULTS');
  console.log('  PASS: ' + total.pass + '  FAIL: ' + total.fail + '  WARN: ' + total.warn);
  const pct = Math.round(total.pass / (total.pass + total.fail) * 100);
  console.log('  SCORE: ' + pct + '%');
  console.log('══════════════════════════════════════════════');
})();
