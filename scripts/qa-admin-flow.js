// Full admin flow test on production
const https = require('https');
const HOST = 'kilocode.onrender.com';
const ORIGIN = 'https://' + HOST;
const PASS = '\u2705', FAIL = '\u274C', WARN = '\u26A0\uFE0F';
const total = { pass: 0, fail: 0, warn: 0 };
const ts = Date.now();

function check(name, ok, detail) {
  const icon = ok ? PASS : FAIL;
  console.log(icon + ' ' + name + (ok ? '' : ' -- FAILED') + (detail ? ' (' + detail + ')' : ''));
  if (ok) total.pass++; else total.fail++;
}

function warn(name, detail) {
  console.log(WARN + ' ' + name + ' (' + detail + ')');
  total.warn++;
}

function login(data) {
  return new Promise((resolve) => {
    const d = JSON.stringify(data);
    const opts = {
      hostname: HOST, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'Origin': ORIGIN },
      timeout: 30000
    };
    const r = https.request(opts, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({
        body: JSON.parse(b),
        cookie: res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null,
        headers: res.headers
      }));
    });
    r.write(d);
    r.end();
  });
}

function authedReq(method, path, cookie, body) {
  return new Promise((resolve) => {
    const h = { 'Content-Type': 'application/json', 'Origin': ORIGIN };
    if (cookie) h['Cookie'] = cookie;
    if (body) h['Content-Length'] = Buffer.byteLength(body);
    const opts = { hostname: HOST, path, method, headers: h, timeout: 30000 };
    const r = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d), headers: res.headers }); }
        catch (e) { resolve({ status: res.statusCode, body: d, headers: res.headers }); }
      });
    });
    r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    if (body) r.write(body);
    r.end();
  });
}

(async () => {
  console.log('==========================================');
  console.log('  PHASE 2: ADMIN FULL FLOW');
  console.log('==========================================\n');

  // ── 1. LOGIN ──
  const a = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  check('Admin login success', a.body && a.body.success);
  check('  role=admin', a.body && a.body.role === 'admin');
  check('  has cookie', !!a.cookie);
  check('  has session cookie header', a.headers && a.headers['set-cookie'] && a.headers['set-cookie'][0].includes('connect.sid'));
  const c = a.cookie;

  // ── 2. WRONG PASSWORD ──
  const aw = await login({ email: 'Matoq701@gmail.com', password: 'wrongpassword' });
  check('Admin wrong password rejected', aw.body && !aw.body.success && aw.body.error);

  // ── 3. DASHBOARD ──
  const db = await authedReq('GET', '/api/dashboard/stats', c);
  check('Dashboard stats accessible', db.body && db.body.success);
  console.log('  Stats keys: ' + Object.keys(db.body.data || db.body).join(', '));
  check('  Has students count', db.body && (db.body.data && db.body.data.totalStudents !== undefined));
  
  // ── 4. LOGOUT ──
  const lo = await authedReq('POST', '/api/auth/logout', c);
  check('Logout works', lo.status < 400);
  
  // Verify session destroyed
  const db2 = await authedReq('GET', '/api/dashboard/stats', c);
  check('Session destroyed after logout', db2.status === 401 || (db2.body && !db2.body.success));

  // ── 5. RE-LOGIN ──
  const a2 = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  check('Re-login after logout OK', a2.body && a2.body.success);
  const c2 = a2.cookie;

  // ── 6. STUDENT MANAGEMENT ──
  const natId1 = 'QA' + ts.toString().slice(-6);
  const s = await authedReq('POST', '/api/students', c2, JSON.stringify({ fullName: 'QA Test Student', nationalId: natId1, age: 12, phone: '0555123456', parentPhone: '0555987654', category: 'أطفال', status: 'نشط' }));
  check('Create student', s.body && s.body.success);
  const sid = s.body && s.body.id;

  // List students
  const sl = await authedReq('GET', '/api/students', c2);
  check('List students', sl.body && sl.body.success && Array.isArray(sl.body.students));

  // Get single student
  const sg = await authedReq('GET', '/api/students/' + sid, c2);
  check('Get student by ID', sg.body && sg.body.success && sg.body.student);

  // Update student
  const su = await authedReq('PUT', '/api/students/' + sid, c2, JSON.stringify({ fullName: 'QA Updated Student', phone: '0555000000' }));
  check('Update student', su.body && su.body.success);

  // Search students
  const ss = await authedReq('GET', '/api/students?search=QA', c2);
  check('Search students', ss.body && ss.body.success && ss.body.students && ss.body.students.length > 0);

  // ── 7. SUBSCRIPTIONS ──
  const sub = await authedReq('POST', '/api/subscriptions', c2, JSON.stringify({ studentId: sid, amount: 200, month: 7, year: 2026 }));
  check('Create subscription', sub.body && sub.body.success);
  const subId = sub.body && (sub.body.id || sub.body.subscription && sub.body.subscription.id);

  // List subscriptions
  const subl = await authedReq('GET', '/api/subscriptions?studentId=' + sid, c2);
  check('List subscriptions', subl.body && subl.body.success);

  // Delete subscription
  if (subId) {
    const subd = await authedReq('DELETE', '/api/subscriptions/' + subId, c2);
    check('Delete subscription', subd.body && subd.body.success);
  }

  // ── 8. ATTENDANCE ──
  const att = await authedReq('POST', '/api/attendance', c2, JSON.stringify({ studentId: sid, date: '2026-07-18', status: 'حاضر' }));
  check('Create attendance', att.body && att.body.success);
  const attId = att.body && att.body.id;

  // Update attendance
  if (attId) {
    const attu = await authedReq('PUT', '/api/attendance/' + attId, c2, JSON.stringify({ status: 'غائب' }));
    check('Update attendance', attu.body && attu.body.success);
  }

  // ── 9. COACH MANAGEMENT ──
  const coachList = await authedReq('GET', '/api/coaches', c2);
  check('List coaches', coachList.body && coachList.body.success);
  if (coachList.body && coachList.body.coaches && coachList.body.coaches.length > 0) {
    const cid = coachList.body.coaches[0].id;
    const cg = await authedReq('GET', '/api/coaches/' + cid, c2);
    check('Get coach by ID', cg.body && cg.body.success);
  }

  // ── 10. REPORTS ──
  const rd = await authedReq('GET', '/api/reports/dashboard', c2);
  check('Report dashboard', rd.body && rd.body.success);

  const rs = await authedReq('GET', '/api/reports/students', c2);
  check('Report students', rs.body && rs.body.success);

  const rsub = await authedReq('GET', '/api/reports/subscriptions', c2);
  check('Report subscriptions', rsub.body && rsub.body.success);

  // ── 11. PROFILE ──
  const pf = await authedReq('GET', '/api/profile', c2);
  check('Profile accessible', pf.body && pf.body.success);

  // ── 12. NULL INVESTIGATION ──
  // Check homepage for null
  const homePage = await new Promise(r => {
    https.get('https://' + HOST + '/', { timeout: 10000 }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r(d));
    });
  });
  const nullMatches = homePage.match(/null/g);
  if (nullMatches) {
    // Find context around null
    const idx = homePage.indexOf('null');
    const ctx = homePage.substring(Math.max(0, idx - 100), idx + 100);
    warn('Found "null" in homepage around: "' + ctx.replace(/\n/g, ' ') + '"');
  }
  check('No null text in homepage', !nullMatches);

  // ── 13. CLEANUP ──
  if (sid) {
    const dd = await authedReq('DELETE', '/api/students/' + sid, c2);
    check('Delete student', dd.body && dd.body.success);
  }

  console.log('\n==========================================');
  console.log('  PHASE 2 RESULTS');
  console.log('  PASS: ' + total.pass + '  FAIL: ' + total.fail + '  WARN: ' + total.warn);
  console.log('==========================================');
})();
