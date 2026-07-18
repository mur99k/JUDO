const https = require('https');
const HOST = 'kilocode.onrender.com';
const ORIGIN = 'https://' + HOST;
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

// Patterns that identify TEST data (not real club data)
function isTestStudent(s) {
  const nat = s.nationalId || '';
  // Real Saudi national IDs are 10 digits. Test ones use prefixes or fake repeated digits.
  if (/^(PHO|SCH|CSRF|VER|SUB|ATT|EXM|IMG|UPL|SRC|COA|CRF|QA|REG|DBG|RTE|DEP|COM|UPD|FINAL|NO|DEBUG|SEARCH|UPLOAD)\d/i.test(nat)) return true;
  if (/^(\d)\1{5,}$/.test(nat)) return true; // repeated digits like 9999999999
  if (['9999999999','4444220982','5555557778','0000000000'].includes(nat)) return true;
  if (/^(500000|300000|600000|700000|800000|900000)\d/i.test(nat)) return true;
  return false;
}
function isTestCoach(co) {
  const email = co.email || '';
  if (/@test\.com$/i.test(email)) return true;
  if (/^(Debug|Test) Coach/i.test(co.fullName || '')) return true;
  return false;
}

(async () => {
  const a = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const c = a.cookie;

  console.log('=== BEFORE CLEANUP ===');
  const students = await authed('GET', '/api/students', c);
  const allStudents = students.body.students || [];
  const coaches = await authed('GET', '/api/coaches', c);
  const allCoaches = coaches.body.coaches || [];

  const testStudents = allStudents.filter(isTestStudent);
  const realStudents = allStudents.filter(s => !isTestStudent(s));
  const testCoaches = allCoaches.filter(isTestCoach);
  const realCoaches = allCoaches.filter(co => !isTestCoach(co));

  console.log('Students: ' + allStudents.length + ' (test=' + testStudents.length + ', real=' + realStudents.length + ')');
  testStudents.forEach(s => console.log('  DELETE student ' + s.id + ' | ' + s.fullName + ' | ' + s.nationalId));
  realStudents.forEach(s => console.log('  KEEP student ' + s.id + ' | ' + s.fullName + ' | ' + s.nationalId));

  console.log('Coaches: ' + allCoaches.length + ' (test=' + testCoaches.length + ', real=' + realCoaches.length + ')');
  testCoaches.forEach(co => console.log('  DELETE coach ' + co.id + ' | ' + co.fullName + ' | ' + co.email));
  realCoaches.forEach(co => console.log('  KEEP coach ' + co.id + ' | ' + co.fullName + ' | ' + co.email));

  console.log('\n=== CLEANUP ===');
  let deletedStudents = 0, deletedCoaches = 0;
  for (const s of testStudents) {
    const r = await authed('DELETE', '/api/students/' + s.id, c);
    if (r.body && r.body.success) { deletedStudents++; console.log('  Deleted student ' + s.id); }
    else console.log('  FAILED student ' + s.id + ': ' + JSON.stringify(r.body));
  }
  for (const co of testCoaches) {
    const r = await authed('DELETE', '/api/coaches/' + co.id, c);
    if (r.body && r.body.success) { deletedCoaches++; console.log('  Deleted coach ' + co.id); }
    else console.log('  FAILED coach ' + co.id + ': ' + JSON.stringify(r.body));
  }

  console.log('\n=== AFTER CLEANUP ===');
  const students2 = await authed('GET', '/api/students', c);
  const coaches2 = await authed('GET', '/api/coaches', c);
  const subs2 = await authed('GET', '/api/subscriptions', c);
  console.log('Students remaining: ' + (students2.body.students || []).length);
  (students2.body.students || []).forEach(s => console.log('  ' + s.id + ' | ' + s.fullName + ' | ' + s.nationalId));
  console.log('Coaches remaining: ' + (coaches2.body.coaches || []).length);
  (coaches2.body.coaches || []).forEach(co => console.log('  ' + co.id + ' | ' + co.fullName + ' | ' + co.email));
  console.log('Subscriptions remaining: ' + ((subs2.body.subscriptions || []).length));

  // Verify real student's attendance intact
  const att = await authed('GET', '/api/attendance/student/41/report?startDate=2026-01-01&endDate=2026-12-31', c);
  console.log('Student 41 attendance records: ' + (att.body.records ? att.body.records.length : 'N/A'));

  console.log('\n=== SUMMARY ===');
  console.log('Deleted students: ' + deletedStudents + '/' + testStudents.length);
  console.log('Deleted coaches: ' + deletedCoaches + '/' + testCoaches.length);
  console.log('Kept students: ' + (students2.body.students || []).length);
  console.log('Kept coaches: ' + (coaches2.body.coaches || []).length);
})();
