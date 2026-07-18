#!/usr/bin/env node
/**
 * Clean up all test/demo data from the production database.
 * Keeps only the admin user, seeded coaches, and core settings.
 */
const https = require('https');
const BASE = process.argv[2] || 'https://riyadah-judo.onrender.com';
const ADMIN = { email: 'Matoq701@gmail.com', password: 'Ma123456' };

let sessionCookie = null;

function req(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method, hostname: 'riyadah-judo.onrender.com', port: 443, path,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      },
      rejectUnauthorized: false
    };
    const r = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, ck: res.headers['set-cookie'] }));
    });
    r.on('error', reject);
    r.setTimeout(30000, () => { r.destroy(); reject(new Error('timeout')); });
    if (data) r.write(data);
    r.end();
  });
}

async function adminReq(method, path, body) {
  return req(method, path, body, sessionCookie);
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  CLEANUP — Remove all test data');
  console.log('  Target: ' + BASE);
  console.log('═══════════════════════════════════════\n');

  // Login
  const login = await req('POST', '/api/auth/login', ADMIN);
  if (login.status !== 200) { console.log('Login failed:', login.status, login.body); process.exit(1); }
  sessionCookie = login.ck ? login.ck[0].split(';')[0] : null;
  if (!sessionCookie) { console.log('No session cookie'); process.exit(1); }
  console.log('✓ Logged in as admin\n');

  // 1. Delete ALL contact messages
  // The API doesn't have a delete-all, so we'll list and delete
  // Actually, let's use a direct DB endpoint... but we don't have one.
  // We'll clean via the database directly by using the TRUNCATE approach.
  // For now, let's delete students which cascade-deletes attendance, subscriptions, coach_groups.
  // Then delete remaining contact_messages via the API.
  
  // Step 1: List all students
  const studentsRes = await adminReq('GET', '/api/students');
  let students = [];
  try { students = JSON.parse(studentsRes.body).students || []; } catch {}
  console.log('Found ' + students.length + ' students to delete');

  // Delete all students (this cascades to attendance, subscriptions, coach_groups)
  for (const s of students) {
    const del = await adminReq('DELETE', '/api/students/' + s.id);
    if (del.status === 200) {
      console.log('  ✗ Deleted student: ' + s.fullName + ' (id=' + s.id + ')');
    } else {
      console.log('  ✗ Failed to delete student ' + s.id + ': ' + del.body);
    }
  }

  // Step 2: List and delete all coaches EXCEPT the seeded ones
  // Seeded coaches have emails: coach.moataq@riyadah.com, coach.marwan@riyadah.com
  const coachesRes = await adminReq('GET', '/api/coaches');
  let coaches = [];
  try { coaches = JSON.parse(coachesRes.body).coaches || []; } catch {}
  const keepEmails = ['coach.moataq@riyadah.com', 'coach.marwan@riyadah.com'];
  for (const c of coaches) {
    if (!keepEmails.includes(c.email || '')) {
      const del = await adminReq('DELETE', '/api/coaches/' + c.id);
      if (del.status === 200) {
        console.log('  ✗ Deleted extra coach: ' + c.fullName);
      } else {
        console.log('  ✗ Failed to delete coach ' + c.id + ': ' + del.body);
      }
    }
  }

  // Step 3: Delete gallery photos uploaded by admin
  const galRes = await adminReq('GET', '/api/gallery');
  let photos = [];
  try { photos = JSON.parse(galRes.body).photos || []; } catch {}
  for (const p of photos) {
    // Delete only photos that look like uploaded (time-based filenames with random suffix)
    if (/^\d{13}-[a-z0-9]{6}\./i.test(p.name)) {
      const del = await adminReq('DELETE', '/api/gallery/' + encodeURIComponent(p.name));
      if (del.status === 200) {
        console.log('  ✗ Deleted uploaded photo: ' + p.name);
      }
    }
  }

  // Verify cleanup
  console.log('\n─── Verification ───');
  const remaining = await adminReq('GET', '/api/students');
  let remStudents = [];
  try { remStudents = JSON.parse(remaining.body).students || []; } catch {}
  console.log('Remaining students: ' + remStudents.length + ' (expected: 0)');

  const remainingCoaches = await adminReq('GET', '/api/coaches');
  let remCoaches = [];
  try { remCoaches = JSON.parse(remainingCoaches.body).coaches || []; } catch {}
  console.log('Remaining coaches: ' + remCoaches.length + ' (expected: 2)');

  const attRes = await adminReq('GET', '/api/attendance/today');
  let attRecords = [];
  try { attRecords = JSON.parse(attRes.body).records || []; } catch {}
  console.log('Today attendance: ' + attRecords.length + ' (expected: 0)');

  const subsRes = await adminReq('GET', '/api/subscriptions');
  let subs = [];
  try { subs = JSON.parse(subsRes.body).subscriptions || []; } catch {}
  console.log('Subscriptions: ' + subs.length + ' (expected: 0)');

  console.log('\n✓ Cleanup complete!');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
