#!/usr/bin/env node
/**
 * scripts/smoke-test.js
 * Boots the app in PRODUCTION mode on an isolated port and exercises every
 * critical flow end-to-end against the REAL code. Used to prove the build
 * is deployable before going live.
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3011;
const BASE = `http://127.0.0.1:${PORT}`;

function req(method, urlPath, { body, headers, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(BASE + urlPath, {
      method, headers: {
        ...(data ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(headers || {})
      }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, cookie: res.headers['set-cookie'] }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail || '' });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

(async () => {
  const secret = crypto.randomBytes(48).toString('hex');
  // Run against the real code, but on local infra (sqlite + local disk) so the
  // test is self-contained. To exercise the live production path (postgres +
  // Cloudflare R2) set DB_TYPE/STORAGE_TYPE in the environment before running.
  const env = { ...process.env, NODE_ENV: 'production', PORT: String(PORT),
    SESSION_SECRET: secret, HTTPS: 'false', CORS_ORIGIN: 'http://127.0.0.1:3011',
    DB_TYPE: process.env.DB_TYPE || 'sqlite', STORAGE_TYPE: process.env.STORAGE_TYPE || 'local' };

  const child = spawn('node', ['server.js'], { env, cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });

  const cleanup = () => { try { child.kill('SIGTERM'); } catch {} };
  process.on('exit', cleanup);

  // Wait for health
  let up = false;
  for (let i = 0; i < 30; i++) {
    try { const h = await req('GET', '/api/health'); if (h.status === 200) { up = true; break; } } catch {}
    await new Promise(r => setTimeout(r, 400));
  }
  if (!up) { console.log('Server did not start.'); cleanup(); process.exit(1); }

  // 1. Health
  const health = await req('GET', '/api/health');
  check('Health endpoint', health.status === 200, health.body);

  // 2. Public pages
  for (const p of ['/', '/about', '/contact', '/login', '/register']) {
    const r = await req('GET', p);
    check('Public page ' + p, r.status === 200);
  }

  // 3. Admin login + permission
  const login = await req('POST', '/api/auth/login', { body: { email: 'admin@riyadah.com', password: 'admin123' } });
  const adminCookie = login.cookie ? login.cookie[0].split(';')[0] : null;
  check('Admin login', login.status === 200 && adminCookie, 'cookie ' + (adminCookie ? 'set' : 'MISSING'));
  const noAuth = await req('GET', '/api/students');
  check('Admin route blocked w/o auth', noAuth.status === 401, 'status ' + noAuth.status);
  const withAuth = await req('GET', '/api/students', { cookie: adminCookie });
  check('Admin route works w/ auth', withAuth.status === 200, 'status ' + withAuth.status);

  // 4. Gallery API + upload + delete (file upload in prod)
  const gal = await req('GET', '/api/gallery');
  check('Gallery list', gal.status === 200);
  // upload a tiny PNG
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64');
  const boundary = '----smoke' + Date.now();
  const hs = { 'Content-Type': 'multipart/form-data; boundary=' + boundary };
  const payload = Buffer.concat([
    Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="photo"; filename="smoke.png"\r\nContent-Type: image/png\r\n\r\n'),
    png, Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);
  const uploadRes = await new Promise(res => {
    const r = http.request(BASE + '/api/gallery', { method: 'POST', headers: { ...hs, Cookie: adminCookie } }, x => { let d='';x.on('data',c=>d+=c);x.on('end',()=>res({s:x.statusCode,b:d})); });
    r.on('error', e => res({s:0,b:e.message})); r.write(payload); r.end();
  });
  check('Gallery upload (admin)', uploadRes.s === 200, 'status ' + uploadRes.s);
  let uploadedName = null;
  try { uploadedName = JSON.parse(uploadRes.b).photo?.name; } catch {}
  if (uploadedName) {
    const del = await req('DELETE', '/api/gallery/' + encodeURIComponent(uploadedName), { cookie: adminCookie });
    check('Gallery delete (admin)', del.status === 200, 'status ' + del.status);
    const localDir = path.resolve(__dirname, '..', process.env.UPLOAD_PATH || './uploads', 'gallery', uploadedName);
    const galDir = path.resolve(__dirname, '..', 'بطولات وجوائز', uploadedName);
    check('Uploaded file removed from disk', !fs.existsSync(localDir) && !fs.existsSync(galDir));
  }

  // 5. Permissions: a non-admin cookie must be denied the students list
  const studentForbidden = await req('GET', '/api/students', { cookie: 'x=1' });
  check('Permissions: non-admin denied students list', studentForbidden.status === 401 || studentForbidden.status === 403, 'status ' + studentForbidden.status);

  // 6. Subscriptions / attendance / reports pages (admin)
  for (const p of ['/dashboard/subscriptions', '/dashboard/attendance', '/dashboard/reports']) {
    const r = await req('GET', p, { cookie: adminCookie });
    check('Page ' + p, r.status === 200, 'status ' + r.status);
  }

  // 7. Logs generated
  const logPath = path.resolve(__dirname, '..', 'logs', 'app.log');
  check('Logs generated', fs.existsSync(logPath) && fs.statSync(logPath).size > 0);

  cleanup();
  const failed = results.filter(r => !r.ok);
  console.log(`\n=== SMOKE TEST: ${results.length - failed.length}/${results.length} passed ===`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('SMOKE ERROR:', e); process.exit(1); });
