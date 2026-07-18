const https = require('https');
const pages = ['/', '/about', '/contact', '/login', '/register'];
let i = 0;
function check() {
  if (i >= pages.length) return;
  const p = pages[i++];
  https.get('https://kilocode.onrender.com' + p, { rejectUnauthorized: false }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log(`--- ${p} ---`);
      // Find '500' with context
      const idx = d.indexOf('500');
      if (idx > -1) {
        console.log(`  '500' found at position ${idx}`);
        console.log(`  context: ...${d.substring(Math.max(0,idx-60), idx+60)}...`);
      }
      // Find 'Error:' 
      const idx2 = d.indexOf('Error:');
      if (idx2 > -1) {
        console.log(`  'Error:' at pos ${idx2}: ...${d.substring(Math.max(0,idx2-60), idx2+60)}...`);
      }
      check();
    });
  });
}
check();
