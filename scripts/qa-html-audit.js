const https = require('https');
const HOST = 'kilocode.onrender.com';

function getPage(path) {
  return new Promise(r => {
    https.get('https://' + HOST + path, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => r(d));
    }).on('error', () => r(''));
  });
}

(async () => {
  console.log('=== HTML & RESPONSIVE AUDIT ===\n');

  const pages = ['/', '/login', '/register', '/about', '/contact'];
  for (const p of pages) {
    const html = await getPage(p);
    if (!html) { console.log('FAIL ' + p); continue; }

    const viewport = html.includes('name="viewport"');
    const rtl = html.includes('dir="rtl"');
    const langMatch = html.match(/lang="([^"]+)"/);
    const titleMatch = html.match(/<title>([^<]*)<\/title>/);
    const hasDoctype = html.includes('<!DOCTYPE');
    const hasCharset = html.includes('charset=');

    console.log(p + ':');
    console.log('  Title: ' + (titleMatch ? titleMatch[1] : 'MISSING'));
    console.log('  DOCTYPE: ' + hasDoctype);
    console.log('  Viewport: ' + viewport);
    console.log('  RTL: ' + rtl);
    console.log('  Lang: ' + (langMatch ? langMatch[1] : 'MISSING'));
    console.log('  Charset: ' + hasCharset);
  }

  // CSS responsive check
  console.log('\n=== CSS RESPONSIVE BREAKPOINTS ===');
  const cssPaths = ['/styles/base.css?v=5', '/styles/pages/home.css?v=5', '/styles/components/navbar.css?v=5'];
  for (const cp of cssPaths) {
    const css = await getPage(cp);
    if (css) {
      const mqs = css.match(/@media\s*[^{]+/g) || [];
      console.log(cp.split('?')[0] + ': ' + mqs.length + ' media queries');
      for (const mq of mqs) console.log('  ' + mq.trim().substring(0, 80));
    }
  }

  // Check image alt attributes on homepage
  console.log('\n=== IMAGE ALT ATTRIBUTES ===');
  const home = await getPage('/');
  const imgs = home.match(/<img[^>]*>/g) || [];
  let missingAlt = 0;
  for (const img of imgs) {
    if (!img.includes('alt=')) {
      console.log('  Missing alt: ' + img.substring(0, 80) + '...');
      missingAlt++;
    }
  }
  console.log('Images without alt: ' + missingAlt + '/' + imgs.length);

  // Check for common issues
  console.log('\n=== COMMON ISSUES ===');
  for (const p of pages) {
    const html = await getPage(p);
    // Check for broken image references (src that 404)
    const srcs = html.match(/src="([^"]+)"/g) || [];
    // Check for inline JS errors
    if (html.includes('console.error')) console.log(p + ': has console.error');
    if (html.includes('throw new Error')) console.log(p + ': has throw Error');
  }
  console.log('Done');
})();
