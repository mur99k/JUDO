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
function authed(method, path, cookie, body) {
  return new Promise((resolve) => {
    const h = { 'Content-Type': 'application/json', 'Origin': ORIGIN };
    if (cookie) h['Cookie'] = cookie;
    if (body) h['Content-Length'] = Buffer.byteLength(body);
    const opts = { hostname: HOST, path, method, headers: h, timeout: 30000 };
    const r = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, body: d }); } });
    }); r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    if (body) r.write(body); r.end();
  });
}
function getPage(path, ua) {
  return new Promise(r => {
    const opts = { hostname: HOST, path, headers: { 'User-Agent': ua }, timeout: 15000 };
    https.get(opts, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r({ status: res.statusCode, body: d }));
    }).on('error', e => r({ status: 0 }));
  });
}

(async () => {
  const a = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const c = a.cookie;
  const ts = Date.now();

  console.log('=== EXEMPTION IN REPORT ===');
  const natId = 'EXM' + ts.toString().slice(-5);
  const s = await authed('POST', '/api/students', c, JSON.stringify({ fullName: 'Exempt Student', nationalId: natId, age: 10 }));
  const sid = s.body && s.body.id;
  const sub = await authed('POST', '/api/subscriptions', c, JSON.stringify({ studentId: sid, amount: 0, startDate: '2026-07-01', endDate: '2026-07-31', paymentMethod: 'إعفاء' }));
  const subId = sub.body && sub.body.id;

  const report = await authed('GET', '/api/reports/subscriptions', c);
  console.log('Exemptions count:', JSON.stringify(report.body.exemptions));
  console.log('Status breakdown:', JSON.stringify(report.body.statusBreakdown));

  if (subId) await authed('DELETE', '/api/subscriptions/' + subId, c);
  if (sid) await authed('DELETE', '/api/students/' + sid, c);

  console.log('\n=== MOBILE RESPONSIVE ===');
  const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
  const pages = ['/', '/login', '/register', '/about', '/contact'];
  for (const p of pages) {
    const pg = await getPage(p, mobileUA);
    const hasViewport = pg.body.includes('name="viewport"');
    const deviceWidth = pg.body.includes('width=device-width');
    console.log('  ' + p + ': viewport=' + hasViewport + ', device-width=' + deviceWidth + ', status=' + pg.status);
    const fixedWidths = pg.body.match(/width:\s*\d{3,4}px/g) || [];
    if (fixedWidths.length > 0) console.log('    Fixed widths: ' + fixedWidths.slice(0, 5).join(', '));
  }

  console.log('\n=== DESKTOP ===');
  const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
  for (const p of ['/', '/login']) {
    const pg = await getPage(p, desktopUA);
    console.log('  ' + p + ': status=' + pg.status + ', bytes=' + pg.body.length);
  }
})();
