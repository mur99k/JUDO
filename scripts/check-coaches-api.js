const https = require('https');
function req(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { method, hostname: 'kilocode.onrender.com', port: 443, path,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      rejectUnauthorized: false };
    const r = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, setCookie: res.headers['set-cookie'] }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}
async function main() {
  const login = await req('POST', '/api/auth/login', { email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const cookie = login.setCookie ? login.setCookie[0].split(';')[0] : null;
  console.log('Login:', login.status, 'Cookie:', !!cookie);
  const r = await req('GET', '/api/coaches', null, cookie);
  console.log('Coaches API:', r.status);
  try {
    const data = JSON.parse(r.body);
    console.log('Count:', (data.coaches || []).length);
    (data.coaches || []).forEach(c => console.log(`  ID=${c.id} ${c.fullName} (${c.email}) role=${c.role}`));
  } catch(e) { console.log('Error:', e.message, r.body.substring(0, 300)); }
}
main();
