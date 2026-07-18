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
function authed(method, path, cookie) {
  return new Promise((resolve) => {
    const h = { 'Content-Type': 'application/json', 'Origin': ORIGIN };
    if (cookie) h['Cookie'] = cookie;
    const opts = { hostname: HOST, path, method, headers: h, timeout: 30000 };
    const r = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, body: d }); } });
    }); r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    r.end();
  });
}

(async () => {
  const a = await login({ email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const c = a.cookie;

  console.log('=== STUDENTS ===');
  const students = await authed('GET', '/api/students', c);
  if (students.body && students.body.students) {
    console.log('Total students: ' + students.body.students.length);
    students.body.students.forEach(s => {
      console.log('  ID=' + s.id + ' | ' + s.fullName + ' | nat=' + s.nationalId + ' | phone=' + (s.phone || 'null'));
    });
  } else {
    console.log('Could not list students: ' + JSON.stringify(students.body).substring(0, 200));
  }

  console.log('\n=== COACHES ===');
  const coaches = await authed('GET', '/api/coaches', c);
  if (coaches.body && coaches.body.coaches) {
    console.log('Total coaches: ' + coaches.body.coaches.length);
    coaches.body.coaches.forEach(co => {
      console.log('  ID=' + co.id + ' | ' + co.fullName + ' | email=' + (co.email || 'null') + ' | phone=' + (co.phone || 'null'));
    });
  } else {
    console.log('Could not list coaches: ' + JSON.stringify(coaches.body).substring(0, 200));
  }

  console.log('\n=== SUBSCRIPTIONS ===');
  const subs = await authed('GET', '/api/subscriptions', c);
  if (subs.body && subs.body.subscriptions) {
    console.log('Total subscriptions: ' + subs.body.subscriptions.length);
    subs.body.subscriptions.slice(0, 30).forEach(s => {
      console.log('  ID=' + s.id + ' | student=' + s.studentId + ' | amount=' + s.amount + ' | payment=' + (s.paymentMethod || 'null') + ' | status=' + s.status);
    });
    if (subs.body.subscriptions.length > 30) console.log('  ... (' + (subs.body.subscriptions.length - 30) + ' more)');
  } else {
    console.log('Could not list subscriptions: ' + JSON.stringify(subs.body).substring(0, 200));
  }

  console.log('\n=== CONTACT MESSAGES ===');
  const contact = await authed('GET', '/api/contact', c);
  if (contact.body && contact.body.messages) {
    console.log('Total messages: ' + contact.body.messages.length);
    contact.body.messages.forEach(m => {
      console.log('  ID=' + m.id + ' | ' + m.name + ' | ' + (m.phone || 'null') + ' | ' + (m.message || '').substring(0, 50));
    });
  } else {
    console.log('Contact endpoint response: ' + JSON.stringify(contact.body).substring(0, 200) + ' (status ' + contact.status + ')');
  }
})();
