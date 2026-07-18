const https = require('https');
function req(method, path, body, cookie) {
  return new Promise((ok, no) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method, hostname: 'kilocode.onrender.com', port: 443, path,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
      rejectUnauthorized: false
    };
    const r = https.request(opts, x => {
      let d = ''; x.on('data', c => d += c);
      x.on('end', () => ok({ s: x.statusCode, b: d, ck: x.headers['set-cookie'] }));
    });
    r.on('error', no); if (data) r.write(data); r.end();
  });
}
(async () => {
  // Login
  const login = await req('POST', '/api/auth/login', { email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const cookie = login.ck ? login.ck[0].split(';')[0] : '';
  console.log('Login:', login.s, '| Cookie:', !!cookie);
  if (!cookie) { console.log('NO COOKIE'); process.exit(1); }

  // Test coaches API
  const c = await req('GET', '/api/coaches', null, cookie);
  console.log('\nCoaches:', c.s, c.b.substring(0, 500));

  // Test attendance
  const a = await req('GET', '/api/attendance', null, cookie);
  console.log('\nAttendance:', a.s, a.b.substring(0, 200));

  // Test reports
  const r1 = await req('GET', '/api/reports/dashboard', null, cookie);
  console.log('\nReports/dashboard:', r1.s, r1.b.substring(0, 200));

  // Test gallery
  const g = await req('GET', '/api/gallery', null, cookie);
  console.log('\nGallery:', g.s, g.b.substring(0, 200));
})();
