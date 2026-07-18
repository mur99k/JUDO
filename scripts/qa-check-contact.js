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
function authed(method, path, cookie) {
  return new Promise((resolve) => {
    const h = { 'Content-Type': 'application/json', 'Origin': ORIGIN };
    if (cookie) h['Cookie'] = cookie;
    const opts = { hostname: HOST, path, method, headers: h, timeout: 30000 };
    const r = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, body: d }); } });
    }); r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    r.end();
  });
}
(async () => {
  const a = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const c = a.cookie;
  for (const p of ['/api/contact', '/api/contact/messages', '/api/contacts', '/api/messages']) {
    const r = await authed('GET', p, c);
    console.log(p + ': ' + r.status + ' ' + JSON.stringify(r.body).substring(0, 120));
  }
  const att = await authed('GET', '/api/attendance/summary?month=7&year=2026', c);
  console.log('Attendance summary:', JSON.stringify(att.body).substring(0, 300));
  // Also try attendance for a specific student to see if any test records remain
  const attStu = await authed('GET', '/api/attendance/student/41/report?startDate=2026-01-01&endDate=2026-12-31', c);
  console.log('Attendance for student 41:', JSON.stringify(attStu.body).substring(0, 300));
})();
