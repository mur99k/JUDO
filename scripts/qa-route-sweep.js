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
      res.on('end', () => resolve({ body: JSON.parse(b), cookie: res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null }););
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
function getPage(path, cookie) {
  return new Promise(r => {
    const opts = { hostname: HOST, path, headers: cookie ? { 'Cookie': cookie } : {}, timeout: 15000 };
    https.get(opts, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r({ status: res.statusCode }));
    }).on('error', () => r({ status: 0 }));
  });
}

(async () => {
  const admin = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const ac = admin.cookie;
  const coach = await login({ email: 'coach.moataq@riyadah.com', password: 'coach123' });
  const cc = coach.cookie;

  console.log('=== PAGE ROUTE SWEEP (expect 200 or 302) ===');
  const pages = [
    ['/', null], ['/login', null], ['/register', null], ['/about', null], ['/contact', null],
    ['/dashboard', ac], ['/dashboard/students', ac], ['/dashboard/attendance', ac],
    ['/dashboard/subscriptions', ac], ['/dashboard/reports', ac], ['/dashboard/coaches', ac],
    ['/dashboard/gallery', ac], ['/dashboard/settings', ac], ['/dashboard/profile', ac],
    ['/dashboard/system-health', ac], ['/coach', cc], ['/student', null]
  ];
  let bad = 0;
  for (const [p, cookie] of pages) {
    const r = await getPage(p, cookie);
    const ok = r.status === 200 || r.status === 302;
    if (!ok) { console.log('  BAD ' + p + ' -> ' + r.status); bad++; }
    else process.stdout.write('.');
  }
  console.log('  Pages OK: ' + (pages.length - bad) + '/' + pages.length);

  console.log('\n=== API ROUTE SWEEP (expect 200/401/403, no 500) ===');
  const apis = [
    ['/api/students', ac], ['/api/students?search=a', ac], ['/api/coaches', ac],
    ['/api/subscriptions', ac], ['/api/attendance/today', ac], ['/api/attendance/summary?month=7&year=2026', ac],
    ['/api/reports/dashboard', ac], ['/api/reports/students', ac], ['/api/reports/subscriptions', ac],
    ['/api/gallery', ac], ['/api/auth/me', ac], ['/api/settings', ac],
    // coach-accessible
    ['/api/students', cc], ['/api/attendance/today', cc], ['/api/reports/dashboard', cc],
    // student-protected (expect 401/403)
    ['/api/students', null], ['/api/subscriptions', null]
  ];
  let badApi = 0;
  for (const [p, cookie] of apis) {
    const r = await authed('GET', p, cookie);
    const ok = r.status !== 500;
    if (!ok) { console.log('  500! ' + p + ' -> ' + JSON.stringify(r.body).substring(0, 100)); badApi++; }
    else process.stdout.write('.');
  }
  console.log('  APIs OK: ' + (apis.length - badApi) + '/' + apis.length);

  console.log('\n=== RESULT ===');
  console.log('Bad pages: ' + bad + ', Bad APIs (500): ' + badApi);
  console.log(bad === 0 && badApi === 0 ? 'ALL ROUTES HEALTHY — NO 500 ERRORS' : 'ISSUES FOUND');
})();
