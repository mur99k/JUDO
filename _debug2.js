const https = require('https');
function req(method, path, body, cookie) {
  return new Promise((ok, no) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method, hostname: 'kilocode.onrender.com', port: 443, path,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
      rejectUnauthorized: false
    };
    const r = https.request(opts, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => ok({ s: x.statusCode, b: d, ck: x.headers['set-cookie'] })); });
    r.on('error', no); if (data) r.write(data); r.end();
  });
}
(async () => {
  const login = await req('POST', '/api/auth/login', { email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const cookie = login.ck ? login.ck[0].split(';')[0] : '';
  console.log('Cookie:', !!cookie);

  // Check system health to see storage config
  const health = await req('GET', '/dashboard/system-health', null, cookie);
  console.log('\n=== SYSTEM HEALTH (HTML, first 3000 chars) ===');
  console.log(health.b.substring(0, 3000));

  // Try gallery list
  const gal = await req('GET', '/api/gallery', null, cookie);
  console.log('\n=== GALLERY ===');
  console.log(gal.b.substring(0, 500));
})();
