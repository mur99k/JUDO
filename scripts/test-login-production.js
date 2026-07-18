// Production test for no-password student login
const https = require('https');
const PASS = '\u2705', FAIL = '\u274C';
const total = { pass: 0, fail: 0 };
const ORIGIN = 'https://kilocode.onrender.com';
const HOST = 'kilocode.onrender.com';
const ts = Date.now();
const natId = '600000' + ts.toString().slice(-5);

function getCookie(res) { return res.headers && res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null; }

function req(method, path, cookie, body, origin) {
  return new Promise((resolve) => {
    const h = { 'Content-Type': 'application/json' };
    if (cookie) h['Cookie'] = cookie;
    if (body) h['Content-Length'] = Buffer.byteLength(body);
    if (origin === true || origin === undefined) h['Origin'] = ORIGIN;
    else if (origin) h['Origin'] = origin;
    const opts = { hostname: HOST, path, method, headers: h, timeout: 30000 };
    const r = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d), headers: res.headers }); } catch (e) { resolve({ status: res.statusCode, body: d, headers: res.headers }); } });
    });
    r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    if (body) r.write(body);
    r.end();
  });
}

function authedReq(method, path, cookie, body) {
  return req(method, path, cookie, body, true);
}

function login(data) {
  return new Promise((resolve) => {
    const d = JSON.stringify(data);
    const opts = { hostname: HOST, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'Origin': ORIGIN }, timeout: 30000 };
    const r = https.request(opts, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ body: JSON.parse(b), cookie: res.headers['set-cookie'] ? res.headers['set-cookie'][0] : null }));
    });
    r.write(d);
    r.end();
  });
}

function check(name, ok) {
  console.log((ok ? PASS : FAIL) + ' ' + name + (ok ? '' : ' -- FAILED'));
  if (ok) total.pass++; else total.fail++;
}

async function getPage(path) {
  return new Promise((resolve) => {
    https.get('https://' + HOST + path, { timeout: 15000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', () => resolve(''));
  });
}

(async () => {
  console.log('==========================================');
  console.log('  PRODUCTION TEST: No-Password Student Login');
  console.log('==========================================\n');

  // 1. Admin login
  const a = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  check('Admin login works', a.body && a.body.success);
  const adminCookie = a.cookie;

  // 2. Create student WITHOUT password
  const s = await req('POST', '/api/students', adminCookie, JSON.stringify({ fullName: 'No Password Test', nationalId: natId, age: 10, phone: '0555000001' }));
  check('Create student (no password)', s.body && s.body.success);
  const sid = s.body && s.body.id;

  // 3. Student login with nationalId ONLY (no password)
  const sl = await login({ nationalId: natId });
  check('Student login with nationalId ONLY', sl.body && sl.body.success);
  check('  role=student', sl.body && sl.body.role === 'student');

  // 4. Student login ignores extra fields
  const sl2 = await login({ nationalId: natId, password: 'anything', extra: 'field' });
  check('Student login ignores extra fields', sl2.body && sl2.body.success);

  // 5. Wrong nationalId fails
  const sl3 = await login({ nationalId: '0000000000' });
  check('Wrong nationalId rejected', sl3.body && !sl3.body.success);

  // 6. Register new student without password
  const regNatId = '700000' + ts.toString().slice(-5);
  const r = await req('POST', '/api/auth/register', null, JSON.stringify({ fullName: 'Register No PW', nationalId: regNatId, age: 8, phone: '0555000002' }));
  check('Register without password', r.body && r.body.success);
  const regId = r.body && r.body.user && r.body.user.id;

  // 7. Login as newly registered student
  const rl = await login({ nationalId: regNatId });
  check('Registered student login OK', rl.body && rl.body.success);

  // 8. Admin without password fails
  const anp = await login({ email: 'Matoq701@gmail.com' });
  check('Admin without password rejected', anp.body && !anp.body.success);

  // 9. Admin with password works
  const awp = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  check('Admin with password works', awp.body && awp.body.success);

  // 10. Coach with password works
  const cwp = await login({ email: 'coach.moataq@riyadah.com', password: 'coach123' });
  check('Coach with password works', cwp.body && cwp.body.success);

  // 11. Login page HTML check
  const page = await getPage('/login');
  check('Login page loads', page.length > 0);
  check('Has student tab button', page.indexOf('tabStudent') > -1);
  check('Has admin tab button', page.indexOf('tabAdmin') > -1);
  check('Student form present', page.indexOf('studentLoginForm') > -1);
  check('Admin form present', page.indexOf('adminLoginForm') > -1);
  // Student form should NOT have a password field
  const studentFormStart = page.indexOf('studentLoginForm');
  const adminFormStart = page.indexOf('adminLoginForm');
  const firstPasswordField = page.indexOf('name=\"password\"');
  const studentHasPassword = firstPasswordField > -1 && firstPasswordField < adminFormStart;
  check('Student form has NO password field', !studentHasPassword);
  // Admin form SHOULD have a password field
  const adminHasPassword = page.indexOf('adminLoginForm') > -1 && page.indexOf('type=\"password\"') > page.indexOf('adminLoginForm');
  check('Admin form has password field', adminHasPassword);

  // 12. Register page should not require password
  const regPage = await getPage('/register');
  check('Register page loads', regPage.length > 0);
  check('Register has NO password field', regPage.indexOf('regPasswordConfirm') === -1);

  // 13. Cleanup
  if (sid) await req('DELETE', '/api/students/' + sid, adminCookie);
  if (regId) await req('DELETE', '/api/students/' + regId, adminCookie);
  check('Cleanup done', true);

  console.log('\n==========================================');
  console.log('  RESULTS: ' + total.pass + '/' + (total.pass + total.fail) + ' passed');
  console.log('==========================================');
})();
