const https = require('https');
const http = require('http');
const HOST = 'localhost';
const PORT = 4000;
const ORIGIN = 'http://localhost:' + PORT;

function login(data) {
  return new Promise((resolve) => {
    const d = JSON.stringify(data);
    const opts = { hostname: HOST, port: PORT, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'Origin': ORIGIN }, timeout: 10000 };
    const r = (PORT === 443 ? https : http).request(opts, (res) => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => resolve({ body: JSON.parse(b), cookie: res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null }));
    }); r.on('error', e => resolve({ body: { error: e.message }, cookie: null })); r.write(d); r.end();
  });
}
function authed(method, path, cookie, body) {
  return new Promise((resolve) => {
    const h = { 'Content-Type': 'application/json', 'Origin': ORIGIN };
    if (cookie) h['Cookie'] = cookie;
    if (body) h['Content-Length'] = Buffer.byteLength(body);
    const opts = { hostname: HOST, port: PORT, path, method, headers: h, timeout: 10000 };
    const r = (PORT === 443 ? https : http).request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, body: d }); } });
    }); r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    if (body) r.write(body); r.end();
  });
}

(async () => {
  // Ensure server is up by retrying login
  let a = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  if (!a.cookie) { console.log('LOGIN FAILED (is server running on :4000?):', JSON.stringify(a.body)); process.exit(1); }
  const c = a.cookie;
  console.log('Logged in OK');

  // Create a test student
  const nat = 'HIJRI' + Date.now();
  const create = await authed('POST', '/api/students', c, JSON.stringify({ fullName: 'طالب تجربة هجري', nationalId: nat, parentPhone: '0550000000', birthDate: '1430-01-01' }));
  const sid = create.body.student ? create.body.student.id : (create.body.id);
  console.log('Created student id=' + sid);

  // Pick Safar 1448 as the test month. Days 5, 15, 29 are inside Safar.
  // Also intentionally NOT include any Rabi al-Awwal date.
  const safarDates = ['1448-02-05', '1448-02-15', '1448-02-29'];
  for (const dt of safarDates) {
    const r = await authed('POST', '/api/attendance', c, JSON.stringify({ records: [{ studentId: sid, date: dt, status: 'حاضر' }] }));
    if (!r.body.success) console.log('  save fail ' + dt + ': ' + JSON.stringify(r.body));
  }
  console.log('Saved attendance for Safar dates:', safarDates.join(', '));

  // Now query the student report for the FULL Safar range.
  const start = '1448-02-01', end = '1448-02-30';
  const rep = await authed('GET', '/api/attendance/student/' + sid + '/report?startDate=' + start + '&endDate=' + end, c);
  console.log('\n=== REPORT for Safar range ' + start + ' .. ' + end + ' ===');
  const recs = (rep.body.records || []);
  console.log('records returned:', recs.length);
  recs.forEach(r => console.log('  ' + r.date + ' | ' + r.status));
  const leaked = recs.filter(r => r.date < start || r.date > end);
  console.log('\nLEAKED (outside Safar): ' + leaked.length);
  if (leaked.length) leaked.forEach(r => console.log('  LEAK: ' + r.date));

  // Negative control: a Rabi al-Awwal date should NOT appear in Safar report.
  const rabDate = '1448-03-05';
  await authed('POST', '/api/attendance', c, JSON.stringify({ records: [{ studentId: sid, date: rabDate, status: 'غائب' }] }));
  const rep2 = await authed('GET', '/api/attendance/student/' + sid + '/report?startDate=' + start + '&endDate=' + end, c);
  const leak2 = (rep2.body.records || []).filter(r => r.date === rabDate);
  console.log('\nRabi date ' + rabDate + ' wrongly in Safar report? ' + (leak2.length > 0 ? 'YES (BUG!)' : 'NO (correct)'));

  // Attendance by single date (Hijri)
  const byDate = await authed('GET', '/api/attendance?date=' + safarDates[1], c);
  console.log('\nAttendance by date ' + safarDates[1] + ': ' + (byDate.body.records||[]).length + ' records');

  // Subscription Hijri endDate calc
  const sub = await authed('POST', '/api/subscriptions', c, JSON.stringify({ studentId: sid, type: 'عادي', days: 30, amount: 100, startDate: '1448-02-15' }));
  const subId = sub.body.id;
  const subGet = await authed('GET', '/api/subscriptions/' + subId, c);
  const s = subGet.body.subscription || {};
  console.log('\nSubscription start=' + s.startDate + ' endDate=' + s.endDate + ' (expect 1448-03-15 for +30 hijri days)');
  const correct = s.endDate === '1448-03-15';
  console.log('Hijri endDate correct? ' + (correct ? 'YES' : 'NO'));

  // Cleanup
  await authed('DELETE', '/api/subscriptions/' + subId, c);
  await authed('DELETE', '/api/students/' + sid, c);
  console.log('\nCleanup done. Test student + subscription removed.');

  console.log('\n=== RESULT ===');
  const pass = (leaked.length === 0) && (leak2.length === 0) && correct && recs.length === 3;
  console.log(pass ? 'ALL HIJRI CHECKS PASSED' : 'HIJRI CHECKS FAILED');
})();
