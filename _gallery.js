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
  console.log('Login:', login.s, '| Cookie:', !!cookie);
  if (!cookie) { console.log('NO COOKIE'); return; }

  // Try gallery upload with multipart
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64');
  const boundary = '----boundary' + Date.now();
  const body = Buffer.concat([
    Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="photo"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n'),
    png,
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);
  const opts = {
    method: 'POST', hostname: 'kilocode.onrender.com', port: 443, path: '/api/gallery',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Cookie': cookie,
      'Content-Length': body.length
    },
    rejectUnauthorized: false
  };
  const result = await new Promise((resolve) => {
    const r = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', e => resolve({ status: 0, body: e.message }));
    r.write(body);
    r.end();
  });
  console.log('Upload:', result.status, result.body);
})();
