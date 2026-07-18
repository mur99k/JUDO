#!/usr/bin/env node
const http = require('http');
const BASE = process.argv[2] || 'https://kilocode.onrender.com';
const https = BASE.startsWith('https') ? require('https') : http;

function req(method, urlPath, { body, headers, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + urlPath);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(headers || {})
      },
      rejectUnauthorized: false
    };
    const r = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, cookie: res.headers['set-cookie'], headers: res.headers }));
    });
    r.on('error', reject);
    r.setTimeout(30000, () => { r.destroy(); reject(new Error('timeout')); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail || '' });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

(async () => {
  console.log('Testing: ' + BASE + '\n');

  // 1. Health
  try {
    const h = await req('GET', '/api/health');
    check('Health endpoint', h.status === 200, h.body);
  } catch (e) { check('Health endpoint', false, e.message); }

  // 2. Public pages
  for (const p of ['/', '/about', '/contact', '/login', '/register']) {
    try {
      const r = await req('GET', p);
      check('Page ' + p, r.status === 200, 'status ' + r.status);
    } catch (e) { check('Page ' + p, false, e.message); }
  }

  // 3. Admin login
  try {
    const login = await req('POST', '/api/auth/login', { body: { email: 'Matoq701@gmail.com', password: 'Ma123456' } });
    const adminCookie = login.cookie ? login.cookie[0].split(';')[0] : null;
    check('Admin login', login.status === 200 && adminCookie, 'status ' + login.status);

    // 4. Admin route blocked w/o auth
    const noAuth = await req('GET', '/api/students');
    check('Students API blocked (no auth)', noAuth.status === 401 || noAuth.status === 403, 'status ' + noAuth.status);

    // 5. Admin route works w/ auth
    if (adminCookie) {
      const withAuth = await req('GET', '/api/students', { cookie: adminCookie });
      check('Students API (admin auth)', withAuth.status === 200, 'status ' + withAuth.status);

      // 6. Dashboard pages
      for (const p of ['/dashboard', '/dashboard/subscriptions', '/dashboard/attendance', '/dashboard/reports']) {
        try {
          const r = await req('GET', p, { cookie: adminCookie });
          check('Admin page ' + p, r.status === 200, 'status ' + r.status);
        } catch (e) { check('Admin page ' + p, false, e.message); }
      }

      // 7. Gallery API
      const gal = await req('GET', '/api/gallery', { cookie: adminCookie });
      check('Gallery API', gal.status === 200, 'status ' + gal.status);
    }
  } catch (e) { check('Admin flow', false, e.message); }

  // 8. Student registration
  try {
    const reg = await req('POST', '/api/auth/register', { body: { fullName: 'Smoke Test Student', email: 'smoke@test.com', phone: '0500000000', password: 'Test1234' } });
    check('Student registration', reg.status === 200 || reg.status === 201, 'status ' + reg.status);
  } catch (e) { check('Student registration', false, e.message); }

  // 9. Contact form (endpoint is /api/auth/contact)
  try {
    const msg = await req('POST', '/api/auth/contact', { body: { name: 'Smoke Test', phone: '0500000000', message: 'Production smoke test' } });
    check('Contact form', msg.status === 200 || msg.status === 201, 'status ' + msg.status + ' ' + msg.body.substring(0, 100));
  } catch (e) { check('Contact form', false, e.message); }

  // 10. HTTPS check
  if (BASE.startsWith('https')) {
    check('HTTPS active', true, 'URL is HTTPS');
  } else {
    check('HTTPS active', false, 'URL is not HTTPS');
  }

  // Summary
  const failed = results.filter(r => !r.ok);
  console.log(`\n=== SMOKE TEST: ${results.length - failed.length}/${results.length} passed ===`);
  if (failed.length) {
    console.log('\nFailed:');
    failed.forEach(f => console.log('  - ' + f.name + ': ' + f.detail));
  }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('SMOKE ERROR:', e); process.exit(1); });
