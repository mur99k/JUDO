const https = require('https');
const BASE = 'https://kilocode.onrender.com';

// First login to get cookie
function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
    const r = https.request(BASE + '/api/auth/login', {
      method: 'POST', hostname: 'kilocode.onrender.com', port: 443,
      path: '/api/auth/login',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      rejectUnauthorized: false
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null));
    });
    r.on('error', reject);
    r.write(data);
    r.end();
  });
}

function get(path, cookie) {
  return new Promise((resolve, reject) => {
    const r = https.request(BASE + path, {
      method: 'GET', hostname: 'kilocode.onrender.com', port: 443, path,
      headers: cookie ? { Cookie: cookie } : {},
      rejectUnauthorized: false
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'] }));
    });
    r.on('error', reject);
    r.end();
  });
}

async function main() {
  const cookie = await login();
  console.log('Cookie:', cookie ? 'yes' : 'no');

  const urls = [
    '/dashboard/system-health',
    '/coach',
    '/dashboard/health',
    '/dashboard/coach'
  ];

  for (const url of urls) {
    // Try with admin cookie first
    let r = await get(url, cookie);
    console.log(`${r.status} ${url} (as admin) - ${r.type}`);
    
    // Also try without cookie to check redirect
    let r2 = await get(url, null);
    if (r2.status !== r.status) {
      console.log(`  vs ${r2.status} (no auth)`);
    }
  }
}
main().catch(e => console.error(e));
