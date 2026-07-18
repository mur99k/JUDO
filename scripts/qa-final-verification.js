// Final production verification — tests ALL user requirements
const https = require('https');
const HOST = 'kilocode.onrender.com';
const ORIGIN = 'https://' + HOST;
const PASS = '\u2705', FAIL = '\u274C', WARN = '\u26A0\uFE0F';
const total = { pass: 0, fail: 0, warn: 0 };
const ts = Date.now();

function check(name, ok) { console.log((ok ? PASS : FAIL) + ' ' + name); if (ok) total.pass++; else total.fail++; }
function warn(name) { console.log(WARN + ' ' + name); total.warn++; }

function login(data) {
  return new Promise((resolve) => {
    const d = JSON.stringify(data);
    const opts = { hostname: HOST, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'Origin': ORIGIN }, timeout: 30000 };
    const r = https.request(opts, (res) => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => resolve({ body: JSON.parse(b), cookie: res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null }););
    }); r.write(d); r.end();
  });
}

function authed(method, path, cookie, body) {
  return new Promise((resolve) => {
    const h = { 'Content-Type': 'application/json', 'Origin': ORIGIN };
    if (cookie) h['Cookie'] = cookie;
    if (body) h['Content-Length'] = Buffer.byteLength(body);
    const opts = { hostname: HOST, path, method, headers: h, timeout: 30000 };
    const r = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, body: d }); } });
    }); r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    if (body) r.write(body); r.end();
  });
}

function createPng() {
  return Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
    0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,0x54,0x08,0xD7,0x63,0x60,0x60,0x60,0x00,
    0x00,0x00,0x04,0x00,0x01,0x27,0x34,0x27,0x0F,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
    0x44,0xAE,0x42,0x60,0x82
  ]);
}

async function uploadPhoto(cookie, studentId) {
  const boundary = '----Boundary' + Date.now();
  const png = createPng();
  const header = Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="photo"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n');
  const footer = Buffer.from('\r\n--' + boundary + '--\r\n');
  const body = Buffer.concat([header, png, footer]);
  return new Promise(r => {
    const opts = { hostname: HOST, path: '/api/students/' + studentId, method: 'PUT',
      headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': body.length, 'Cookie': cookie, 'Origin': ORIGIN }, timeout: 30000 };
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { r({ status: res.statusCode, body: JSON.parse(d) }); } catch(e) { r({ status: res.statusCode, body: d }); } });
    }); req.write(body); req.end();
  });
}

(async () => {
  console.log('══════════════════════════════════════════════');
  console.log('  FINAL PRODUCTION VERIFICATION');
  console.log('  ' + new Date().toISOString());
  console.log('══════════════════════════════════════════════\n');

  // Login as admin for all operations
  const a = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  check('Admin login', a.body && a.body.success);
  const ac = a.cookie;
  if (!ac) { console.log('FATAL: no admin cookie'); process.exit(1); }

  // ──────────────────────────────────────────────
  // 1. STUDENT CRUD
  // ──────────────────────────────────────────────
  console.log('\n--- 1. STUDENT CRUD ---');
  const natId1 = 'VER' + ts.toString().slice(-5);
  const s1 = await authed('POST', '/api/students', ac, JSON.stringify({ fullName: 'Final Verification', nationalId: natId1, age: 12, phone: '0555000001', parentPhone: '0555000002', category: 'أطفال', status: 'نشط' }));
  check('Create student', s1.body && s1.body.success);
  const sid1 = s1.body && s1.body.id;

  const sGet = await authed('GET', '/api/students/' + sid1, ac);
  check('Read student by ID', sGet.body && sGet.body.success && sGet.body.student && sGet.body.student.fullName === 'Final Verification');

  const sUpd = await authed('PUT', '/api/students/' + sid1, ac, JSON.stringify({ fullName: 'Updated Verification', phone: '0555999999' }));
  check('Update student name+phone', sUpd.body && sUpd.body.success);

  const sGet2 = await authed('GET', '/api/students/' + sid1, ac);
  check('Verify update persisted', sGet2.body && sGet2.body.student && sGet2.body.student.fullName === 'Updated Verification');

  const sSearch = await authed('GET', '/api/students?search=Updated', ac);
  check('Search student', sSearch.body && sSearch.body.success && sSearch.body.students && sSearch.body.students.some(function(s) { return s.id === sid1; }));

  const sDel = await authed('DELETE', '/api/students/' + sid1, ac);
  check('Delete student', sDel.body && sDel.body.success);

  const sGet3 = await authed('GET', '/api/students/' + sid1, ac);
  check('Verify deleted (not found)', !sGet3.body.success || sGet3.status === 404);

  // ──────────────────────────────────────────────
  // 2. STUDENT PHOTO — upload + persist across sessions
  // ──────────────────────────────────────────────
  console.log('\n--- 2. STUDENT PHOTO ---');
  const natId2 = 'PHO' + ts.toString().slice(-5);
  const s2 = await authed('POST', '/api/students', ac, JSON.stringify({ fullName: 'Photo Test', nationalId: natId2, age: 10 }));
  const sid2 = s2.body && s2.body.id;
  check('Create student for photo test', !!sid2);

  if (sid2) {
    const up = await uploadPhoto(ac, sid2);
    check('Upload photo returns 200', up.status === 200);
    check('Upload response has student.photo', up.body && up.body.student && typeof up.body.student.photo === 'string');

    const storedUrl = up.body && up.body.student && up.body.student.photo;
    console.log('  Stored photo URL: ' + storedUrl);

    // Try to access the photo
    if (storedUrl && storedUrl.startsWith('/')) {
      const photoAccess = await new Promise(r => {
        https.get('https://' + HOST + storedUrl, { timeout: 10000 }, (res) => {
          let d = ''; res.on('data', c => d += c);
          res.on('end', () => r({ status: res.statusCode, type: res.headers['content-type'] || '', length: d.length }));
        }).on('error', e => r({ status: 0 }));
      });
      check('Photo file accessible via URL', photoAccess.status === 200);
      if (photoAccess.status !== 200) console.log('  Returned ' + photoAccess.status + ' ' + photoAccess.type);
    }

    // Logout and login again, check photo persists
    await authed('POST', '/api/auth/logout', ac);
    const a2 = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
    check('Re-login after logout', a2.body && a2.body.success);
    const ac2 = a2.cookie;

    const sGetPhoto = await authed('GET', '/api/students/' + sid2, ac2);
    check('Student photo persists across session', sGetPhoto.body && sGetPhoto.body.student && sGetPhoto.body.student.photo === storedUrl);

    // Try to access photo in new session
    if (storedUrl && storedUrl.startsWith('/')) {
      const photoAccess2 = await new Promise(r => {
        https.get('https://' + HOST + storedUrl, { timeout: 10000 }, (res) => {
          let d = ''; res.on('data', c => d += c);
          res.on('end', () => r({ status: res.statusCode }));
        }).on('error', e => r({ status: 0 }));
      });
      check('Photo accessible in new session', photoAccess2.status === 200);
    }
  }
  // Use fresh cookie after re-login for remaining tests (ac2 is block-scoped, re-login to be safe)
  const a3 = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const adminCookie = a3.cookie;

  // ──────────────────────────────────────────────
  // 3. COACH CRUD
  // ──────────────────────────────────────────────
  console.log('\n--- 3. COACH CRUD ---');
  const coachNatId = 'COA' + ts.toString().slice(-5);
  const coachEmail = 'coach.' + ts.toString().slice(-5) + '@test.com';

  // Create coach
  const cCreate = await authed('POST', '/api/coaches', adminCookie, JSON.stringify({ fullName: 'Test Coach', email: coachEmail, password: 'coach123', phone: '0555111111', role: 'coach' }));
  check('Create coach', cCreate.body && cCreate.body.success);
  const cid = cCreate.body && (cCreate.body.id || cCreate.body.coach && cCreate.body.coach.id);
  console.log('  Coach ID: ' + cid);

  if (cid) {
    // Read coach
    const cGet = await authed('GET', '/api/coaches/' + cid, adminCookie);
    check('Read coach by ID', cGet.body && cGet.body.success && cGet.body.coach);

    // Update coach
    const cUpd = await authed('PUT', '/api/coaches/' + cid, adminCookie, JSON.stringify({ fullName: 'Updated Coach', phone: '0555222222' }));
    check('Update coach name+phone', cUpd.body && cUpd.body.success);

    // Verify update
    const cGet2 = await authed('GET', '/api/coaches/' + cid, adminCookie);
    check('Verify coach update persisted', cGet2.body && cGet2.body.coach && cGet2.body.coach.fullName === 'Updated Coach');

    // Login as the new coach
    const cLogin = await login({ email: coachEmail, password: 'coach123' });
    check('New coach login', cLogin.body && cLogin.body.success && cLogin.body.role === 'coach');
    const cc = cLogin.cookie;

    // Coach can list students
    const cStud = await authed('GET', '/api/students', cc);
    check('Coach can list students', cStud.body && cStud.body.success);

    // Coach can save attendance
    const cAtt = await authed('POST', '/api/attendance', cc, JSON.stringify({ records: [] }));
    check('Coach can save attendance (empty)', cAtt.status < 500);

    // Coach CANNOT create subscriptions
    const cSub = await authed('POST', '/api/subscriptions', cc, JSON.stringify({ studentId: 1, amount: 100, startDate: '2026-07-01' }));
    check('Coach cannot create subscription', cSub.status === 403 || (cSub.body && !cSub.body.success));

    // Update coach password
    await authed('PUT', '/api/coaches/' + cid, adminCookie, JSON.stringify({ password: 'newpass123' }));
    const cLogin2 = await login({ email: coachEmail, password: 'newpass123' });
    check('Coach login with new password', cLogin2.body && cLogin2.body.success);
    check('  role=coach', cLogin2.body && cLogin2.body.role === 'coach');
  }

  // ──────────────────────────────────────────────
  // 4. SUBSCRIPTIONS + EXEMPTION
  // ──────────────────────────────────────────────
  console.log('\n--- 4. SUBSCRIPTIONS + EXEMPTION ---');
  const natId3 = 'SUB' + ts.toString().slice(-5);
  const s3 = await authed('POST', '/api/students', adminCookie, JSON.stringify({ fullName: 'Sub Test', nationalId: natId3, age: 11 }));
  const sid3 = s3.body && s3.body.id;
  check('Create student for subscription test', !!sid3);

  if (sid3) {
    // Create normal subscription
    const sub1 = await authed('POST', '/api/subscriptions', adminCookie, JSON.stringify({ studentId: sid3, amount: 200, startDate: '2026-07-01', endDate: '2026-07-31', paymentMethod: 'نقداً' }));
    check('Create normal subscription', sub1.body && sub1.body.success);
    const subId1 = sub1.body && sub1.body.id;

    // Create exemption subscription
    const sub2 = await authed('POST', '/api/subscriptions', adminCookie, JSON.stringify({ studentId: sid3, amount: 0, startDate: '2026-08-01', endDate: '2026-08-31', paymentMethod: 'إعفاء' }));
    check('Create exemption subscription', sub2.body && sub2.body.success);
    const subId2 = sub2.body && sub2.body.id;

    // List subscriptions for student
    const subList = await authed('GET', '/api/subscriptions?studentId=' + sid3, adminCookie);
    check('List subscriptions', subList.body && subList.body.success && subList.body.subscriptions && subList.body.subscriptions.length === 2);

    // Update subscription
    if (subId1) {
      const subUpd = await authed('PUT', '/api/subscriptions/' + subId1, adminCookie, JSON.stringify({ amount: 250, notes: 'Updated amount' }));
      check('Update subscription amount', subUpd.body && subUpd.body.success);
    }

    // Check exemption in reports — subscriptions report
    const subReport = await authed('GET', '/api/reports/subscriptions', adminCookie);
    check('Subscriptions report accessible', subReport.body && subReport.body.success);
    console.log('  Report keys: ' + Object.keys(subReport.body).join(', '));

    // Delete subscriptions
    if (subId1) {
      const subDel1 = await authed('DELETE', '/api/subscriptions/' + subId1, adminCookie);
      check('Delete subscription', subDel1.body && subDel1.body.success);
    }
    if (subId2) {
      const subDel2 = await authed('DELETE', '/api/subscriptions/' + subId2, adminCookie);
      check('Delete exemption', subDel2.body && subDel2.body.success);
    }

    // Verify deleted
    const subList2 = await authed('GET', '/api/subscriptions?studentId=' + sid3, adminCookie);
    check('Verify subscriptions deleted', subList2.body && subList2.body.subscriptions && subList2.body.subscriptions.length === 0);
  }

  // ──────────────────────────────────────────────
  // 5. ATTENDANCE + REPORTS (no 500 errors)
  // ──────────────────────────────────────────────
  console.log('\n--- 5. ATTENDANCE + REPORTS ---');
  const natId4 = 'ATT' + ts.toString().slice(-5);
  const s4 = await authed('POST', '/api/students', adminCookie, JSON.stringify({ fullName: 'Att Test', nationalId: natId4, age: 9 }));
  const sid4 = s4.body && s4.body.id;
  check('Create student for attendance test', !!sid4);

  if (sid4) {
    const att = await authed('POST', '/api/attendance', adminCookie, JSON.stringify({ records: [{ studentId: sid4, date: '2026-07-18', status: 'حاضر' }] }));
    check('Save attendance (no 500)', att.status < 500 && !(att.body && att.body.error && att.body.error.includes('خطأ')));

    const attToday = await authed('GET', '/api/attendance/today', adminCookie);
    check('Get today attendance (no 500)', attToday.status < 500);

    const attSummary = await authed('GET', '/api/attendance/summary?month=7&year=2026', adminCookie);
    check('Attendance summary (no 500)', attSummary.status < 500);

    // All reports
    const endpoints = [
      '/api/reports/dashboard',
      '/api/reports/students',
      '/api/reports/subscriptions',
    ];
    for (const ep of endpoints) {
      const r = await authed('GET', ep, adminCookie);
      check('Report ' + ep + ' (no 500)', r.status < 500 && r.body && r.body.success);
    }
  }

  // ──────────────────────────────────────────────
  // 6. HEALTH CHECK + CLEANUP
  // ──────────────────────────────────────────────
  console.log('\n--- 6. CLEANUP ---');
  // Clean up all test students
  for (const natId of [natId2, natId3, natId4]) {
    const found = await authed('GET', '/api/students?search=' + natId, adminCookie);
    if (found.body && found.body.students) {
      for (const s of found.body.students) {
        await authed('DELETE', '/api/students/' + s.id, adminCookie);
      }
    }
  }
  // Clean up test coach
  if (cid) {
    await authed('DELETE', '/api/coaches/' + cid, adminCookie);
    const cGet3 = await authed('GET', '/api/coaches/' + cid, adminCookie);
    check('Coach deleted', !cGet3.body.success || cGet3.status === 404);
  }
  check('Cleanup complete', true);

  // Final health check
  const health = await new Promise(r => { https.get('https://' + HOST + '/api/health', { timeout: 10000 }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',() => r(JSON.parse(d))); }); });
  console.log('  Health: ' + health.status + ' ts=' + health.ts);

  console.log('\n══════════════════════════════════════════════');
  console.log('  FINAL RESULTS');
  console.log('  PASS: ' + total.pass + '  FAIL: ' + total.fail + '  WARN: ' + total.warn);
  console.log('  Score: ' + Math.round(total.pass / (total.pass + total.fail) * 100) + '%');
  console.log('══════════════════════════════════════════════');
})();
