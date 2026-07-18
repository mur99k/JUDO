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
      x.on('end', () => ok({ s: x.statusCode, b: d, c: x.headers['set-cookie'] }));
    });
    r.on('error', no);
    if (data) r.write(data);
    r.end();
  });
}
(async () => {
  const login = await req('POST', '/api/auth/login', { email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const cookie = login.c ? login.c[0].split(';')[0] : '';
  console.log('Login:', login.s, cookie ? 'cookie ok' : 'NO COOKIE');
  
  const dash = await req('GET', '/dashboard', null, cookie);
  console.log('Dashboard:', dash.s);
  if (dash.s === 500) console.log('Error:', dash.b.substring(0, 500));
  
  const subs = await req('GET', '/dashboard/subscriptions', null, cookie);
  console.log('Subscriptions:', subs.s);
  if (subs.s === 500) console.log('Error:', subs.b.substring(0, 500));
})();
