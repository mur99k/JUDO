// Debug failures found in Phase 2
const https = require('https');
const HOST = 'kilocode.onrender.com';
const ORIGIN = 'https://' + HOST;
const ts = Date.now();

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
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    if (body) r.write(body);
    r.end();
  });
}

(async () => {
  const a = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  console.log('Login:', a.body.success);
  const c = a.cookie;

  // 1. Dashboard stats
  const db = await authedReq('GET', '/api/dashboard/stats', c);
  console.log('Dashboard stats:', JSON.stringify(db.body).substring(0, 500));

  // 2. Search students
  const ss = await authedReq('GET', '/api/students?search=QA', c);
  console.log('Search students:', JSON.stringify(ss.body).substring(0, 500));

  // 3. Create subscription (with more detail)
  const natId = 'DBG' + ts.toString().slice(-5);
  const s = await authedReq('POST', '/api/students', c, JSON.stringify({ fullName: 'Debug', nationalId: natId, age: 10 }));
  console.log('Create student:', JSON.stringify(s.body));
  const sid = s.body && s.body.id;

  if (sid) {
    const sub = await authedReq('POST', '/api/subscriptions', c, JSON.stringify({ studentId: sid, amount: 200, month: 7, year: 2026 }));
    console.log('Create subscription:', JSON.stringify(sub.body));

    const att = await authedReq('POST', '/api/attendance', c, JSON.stringify({ studentId: sid, date: '2026-07-18', status: 'حاضر' }));
    console.log('Create attendance:', JSON.stringify(att.body));

    // 4. Profile
    const pf = await authedReq('GET', '/api/profile', c);
    console.log('Profile:', JSON.stringify(pf.body).substring(0, 500));

    // Cleanup
    await authedReq('DELETE', '/api/students/' + sid, c);
  }

  // 5. Check "null" text on homepage context
  const homePage = await new Promise(r => {
    https.get('https://' + HOST + '/', { timeout: 10000 }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r(d));
    });
  });
  // Find all null occurrences
  let idx = -1;
  let count = 0;
  while ((idx = homePage.indexOf('null', idx + 1)) !== -1) {
    const ctx = homePage.substring(Math.max(0, idx - 50), idx + 50).replace(/\n/g, ' ');
    console.log('null #' + (++count) + ' at ' + idx + ': ...' + ctx + '...');
    if (count > 5) break;
  }
  console.log('Total null occurrences: ' + count);

  // Also check for "undefined"
  idx = -1;
  count = 0;
  while ((idx = homePage.indexOf('undefined', idx + 1)) !== -1) {
    const ctx = homePage.substring(Math.max(0, idx - 50), idx + 50).replace(/\n/g, ' ');
    console.log('undefined #' + (++count) + ' at ' + idx + ': ...' + ctx + '...');
    if (count > 5) break;
  }
  console.log('Total undefined occurrences: ' + count);
})();
