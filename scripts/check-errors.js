const https = require('https');
const pages = ['/', '/login', '/register', '/contact'];
let i = 0;
function check() {
  if (i >= pages.length) return;
  const p = pages[i++];
  https.get('https://kilocode.onrender.com' + p, { rejectUnauthorized: false }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log(`--- ${p} ---`);
      const matches = d.match(/.{0,60}(?:(?:[Ee]rror|Error|Cannot)\b).{0,60}/g) || [];
      console.log(`  contains "error": ${d.includes('error')}`);
      console.log(`  contains "Error": ${d.includes('Error')}`);
      console.log(`  contains "Cannot": ${d.includes('Cannot')}`);
      if (matches.length) {
        console.log(`  matches found:`);
        matches.forEach((m, j) => console.log(`  [${j}] ${m.trim()}`));
      }
      check();
    });
  });
}
check();
