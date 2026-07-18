const https = require('https');

function fetch(method, path, body, cookie) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({ method, hostname: 'riyadah-judo.onrender.com', port: 443, path,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(cookie ? { 'Cookie': cookie } : {})
      },
      rejectUnauthorized: false
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body, setCookie: res.headers['set-cookie'] }));
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const login = await fetch('POST', '/api/auth/login', { email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const cookie = login.setCookie ? login.setCookie[0].split(';')[0] : null;
  console.log('Login:', login.status, '| Cookie:', !!cookie);

  const coaches = await fetch('GET', '/api/coaches', null, cookie);
  console.log('Coaches API:', coaches.status);
  const data = JSON.parse(coaches.body);
  console.log('Count:', (data.coaches || []).length);
  (data.coaches || []).forEach(c => console.log('  -', c.fullName, '(' + c.email + ')'));

  const html = await fetch('GET', '/');
  console.log('\nHome page:');
  console.log('  Empty message:', html.body.includes('سيتم إضافة بيانات المدربين قريباً') ? 'YES (BAD)' : 'NO (GOOD)');
  console.log('  كابتن معتوق:', html.body.includes('كابتن معتوق') ? 'YES' : 'NO');
  console.log('  كابتن مروان:', html.body.includes('كابتن مروان') ? 'YES' : 'NO');
}
main();
