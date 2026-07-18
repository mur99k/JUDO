const https = require('https');
const HOST = 'kilocode.onrender.com';
const ORIGIN = 'https://' + HOST;

function login(data) {
  return new Promise((resolve) => {
    const d = JSON.stringify(data);
    const opts = {
      hostname: HOST, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'Origin': ORIGIN }, timeout: 30000
    };
    const r = https.request(opts, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ body: JSON.parse(b), cookie: res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null }));
    });
    r.write(d);
    r.end();
  });
}

function createPng() {
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xD7, 0x63, 0x60, 0x60, 0x60, 0x00,
    0x00, 0x00, 0x04, 0x00, 0x01, 0x27, 0x34, 0x27,
    0x0F, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
}

(async () => {
  console.log('=== IMAGE UPLOAD TEST ===\n');

  const a = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const c = a.cookie;
  console.log('Admin login: OK');

  // Create student
  const natId = 'IMG' + Date.now().toString().slice(-5);
  const sResult = await new Promise(r => {
    const d = JSON.stringify({ fullName: 'ImageTest', nationalId: natId, age: 10 });
    const opts = {
      hostname: HOST, path: '/api/students', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'Cookie': c, 'Origin': ORIGIN }, timeout: 30000
    };
    const req = https.request(opts, (res) => {
      let b = '';
      res.on('data', chunk => b += chunk);
      res.on('end', () => r(JSON.parse(b)));
    });
    req.write(d);
    req.end();
  });
  const sid = sResult.id;
  console.log('Student ID: ' + sid);

  // Upload profile photo
  const boundary = '----FormBoundary' + Date.now();
  const png = createPng();
  const header = Buffer.from(
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="photo"; filename="test.png"\r\n' +
    'Content-Type: image/png\r\n\r\n'
  );
  const footer = Buffer.from('\r\n--' + boundary + '--\r\n');
  const body = Buffer.concat([header, png, footer]);

  const upResult = await new Promise(r => {
    const opts = {
      hostname: HOST, path: '/api/students/' + sid, method: 'PUT',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length,
        'Cookie': c,
        'Origin': ORIGIN
      }, timeout: 30000
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => r({ status: res.statusCode, body: d.substring(0, 200) }));
    });
    req.write(body);
    req.end();
  });
  console.log('Upload response: ' + upResult.status + ' ' + upResult.body);

  // Get student to check photo URL
  const sg = await new Promise(r => {
    https.get('https://' + HOST + '/api/students/' + sid, { headers: { 'Cookie': c, 'Origin': ORIGIN } }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => r(JSON.parse(d)));
    });
  });
  const photoUrl = sg.student && sg.student.photo;
  console.log('Photo URL: ' + photoUrl);

  // Check if photo loads
  if (photoUrl && photoUrl.startsWith('/')) {
    const photoCheck = await new Promise(r => {
      https.get('https://' + HOST + photoUrl, { timeout: 10000 }, (res) => {
        r({ status: res.statusCode, type: res.headers['content-type'] });
      }).on('error', e => r({ status: 0 }));
    });
    console.log('Photo accessible: ' + photoCheck.status + ' ' + photoCheck.type);
  }

  // Upload invalid file type
  const badBoundary = '----BadBoundary' + Date.now();
  const badHeader = Buffer.from(
    '--' + badBoundary + '\r\n' +
    'Content-Disposition: form-data; name="photo"; filename="test.txt"\r\n' +
    'Content-Type: text/plain\r\n\r\n'
  );
  const badFooter = Buffer.from('\r\n--' + badBoundary + '--\r\n');
  const badBody = Buffer.concat([badHeader, Buffer.from('not an image'), badFooter]);
  const badResult = await new Promise(r => {
    const opts = {
      hostname: HOST, path: '/api/students/' + sid, method: 'PUT',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + badBoundary,
        'Content-Length': badBody.length,
        'Cookie': c,
        'Origin': ORIGIN
      }, timeout: 30000
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => r({ status: res.statusCode, body: d.substring(0, 200) }));
    });
    req.write(badBody);
    req.end();
  });
  console.log('Invalid file type rejected: ' + badResult.status + ' ' + badResult.body);

  // Cleanup
  await new Promise(r => {
    const opts = { hostname: HOST, path: '/api/students/' + sid, method: 'DELETE', headers: { 'Cookie': c, 'Origin': ORIGIN }, timeout: 30000 };
    const req = https.request(opts, (res) => { req.on('end', r); });
    req.end();
  });
  console.log('\nCleanup: OK');
})();
