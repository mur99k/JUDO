const https = require('https');
const HOST = 'kilocode.onrender.com';

function getPage(path) {
  return new Promise(r => {
    https.get('https://' + HOST + path, { timeout: 15000 }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r(d));
    }).on('error', () => r(''));
  });
}

(async () => {
  const html = await getPage('/login');
  const lines = html.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('width:440px') || line.includes('width:560px') || line.includes('width:200px')) {
      console.log('LINE ' + i + ': ' + line.trim().substring(0, 200));
    }
  });
  // Inline styles with width
  const styleMatches = html.match(/style="[^"]*width:[^"]*"/g) || [];
  styleMatches.forEach(m => console.log('INLINE: ' + m.substring(0, 150)));
  console.log('Total inline width styles:', styleMatches.length);
})();
