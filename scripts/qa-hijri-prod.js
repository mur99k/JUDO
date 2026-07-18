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
    }); r.on('error', e => resolve({ body: { error: e.message }, cookie: null })); r.write(d); r.end();
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

(async () => {
  const a = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  if (!a.cookie) { console.log('LOGIN FAILED:', JSON.stringify(a.body)); process.exit(1); }
  const c = a.cookie;

  // 1) Verify migration: student 41's OLD gregorian attendance should now be Hijri (13xx-15xx)
  const att41 = await authed('GET', '/api/attendance/student/41/report?startDate=1440-01-01&endDate=1500-12-30', c);
  console.log('=== Student 41 attendance (after migration) ===');
  (att41.body.records || []).forEach(r => console.log('  ' + r.date + ' | ' + r.status));
  const stillGregorian = (att41.body.records || []).filter(r => /^20\d{2}-/.test(r.date));
  console.log('Records still in Gregorian format (should be 0): ' + stillGregorian.length);

  // 2) Verify Hijri range filtering on production
  const nat = 'HIJRI' + Date.now();
  const create = await authed('POST', '/api/students', c, JSON.stringify({ fullName: 'طالب تجربة هجري', nationalId: nat, parentPhone: '0550000000' }));
  const sid = create.body.student ? create.body.student.id : create.body.id;
  for (const dt of ['1448-02-05','1448-02-15','1448-02-29']) {
    await authed('POST', '/api/attendance', c, JSON.stringify({ records: [{ studentId: sid, date: dt, status: 'حاضر' }] }));
  }
  await authed('POST', '/api/attendance', c, JSON.stringify({ records: [{ studentId: sid, date: '1448-03-05', status: 'غائب' }] }));
  const rep = await authed('GET', '/api/attendance/student/' + sid + '/report?startDate=1448-02-01&endDate=1448-02-30', c);
  const recs = rep.body.records || [];
  const leak = recs.filter(r => r.date < '1448-02-01' || r.date > '1448-02-30');
  console.log('\n=== Production Safar range test ===');
  console.log('records in Safar report:', recs.length, '| leaked (should be 0):', leak.length);

  // 3) Subscription Hijri endDate
  const sub = await authed('POST', '/api/subscriptions', c, JSON.stringify({ studentId: sid, type: 'عادي', days: 30, amount: 100, startDate: '1448-02-15' }));
  const subGet = await authed('GET', '/api/subscriptions/' + sub.body.id, c);
  const s = subGet.body.subscription || {};
  console.log('\nSubscription: start=' + s.startDate + ' end=' + s.endDate + ' (expect 1448-03-15)');

  // cleanup
  await authed('DELETE', '/api/subscriptions/' + sub.body.id, c);
  await authed('DELETE', '/api/students/' + sid, c);

  const pass = stillGregorian.length === 0 && leak.length === 0 && s.endDate === '1448-03-15';
  console.log('\n=== RESULT: ' + (pass ? 'ALL HIJRI PROD CHECKS PASSED' : 'FAILED') + ' ===');
})();
