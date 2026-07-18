const https = require('https');
const HOST = 'kilocode.onrender.com';

function getPage(path) {
  return new Promise(r => {
    https.get('https://' + HOST + path, { timeout: 15000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => r({ status: res.statusCode, headers: res.headers, body: d }));
    }).on('error', e => r({ status: 0, body: '', error: e.message }));
  });
}

async function fetchAll(urls) {
  const results = [];
  for (const u of urls) {
    const pg = await getPage(u);
    results.push({ url: u, ...pg });
  }
  return results;
}

(async () => {
  console.log('=== PHASE 1: PUBLIC PAGE SCAN ===');
  console.log('Fetching main pages...');
  const pages = await fetchAll(['/', '/login', '/register']);
  
  for (const pg of pages) {
    const s = pg.status;
    console.log('\n--- ' + pg.url + ' (status ' + s + ') ---');
    if (s !== 200) {
      console.log('  [ISSUE] Status ' + s);
      continue;
    }
    
    const body = pg.body;
    console.log('  Size: ' + body.length + ' bytes');
    
    // Check for common issues
    if (body.includes('undefined')) console.log('  [ISSUE] Contains "undefined" text');
    if (body.includes('NaN')) console.log('  [ISSUE] Contains "NaN" text');
    if (body.includes('null')) console.log('  [ISSUE] Contains "null" text');
    if (body.includes('Error:')) console.log('  [ISSUE] Contains error text');
    if (body.includes('Cannot')) console.log('  [ISSUE] Contains unexpected text');
    
    // Check for doctype
    if (!body.includes('<!DOCTYPE')) console.log('  [ISSUE] Missing DOCTYPE');
    
    // Check for viewport meta
    if (!body.includes('viewport')) console.log('  [ISSUE] Missing viewport meta tag');
    
    // Check the <title>
    const titleMatch = body.match(/<title>([^<]*)<\/title>/);
    console.log('  Title: ' + (titleMatch ? titleMatch[1] : '[MISSING]'));
    
    // Extract all linked assets (CSS, JS, images)
    const assets = [];
    const linkCSS = body.match(/<link[^>]*href="([^"]+\.css)[^>]*>/g) || [];
    const scripts = body.match(/<script[^>]*src="([^"]+\.js)[^"]*"[^>]*><\/script>/g) || [];
    const images = body.match(/<img[^>]*src="([^"]+)"[^>]*>/g) || [];
    
    console.log('  CSS files: ' + linkCSS.length);
    console.log('  JS files: ' + scripts.length);
    console.log('  Images: ' + images.length);
    
    // Extract all src/href values
    const allRefs = body.match(/(?:src|href)="([^"]+)"/g) || [];
    const internalRefs = allRefs.map(r => r.split('"')[1]).filter(r => r.startsWith('/'));
    // Add all internal links
    const internalLinks = [...new Set(internalRefs)];
    if (internalLinks.length > 0) {
      console.log('  Internal refs: ' + internalLinks.join(', '));
    }
    
    // Check for CSRF token presence in forms
    const forms = body.match(/<form[^>]*>/g) || [];
    console.log('  Forms: ' + forms.length);
    const csrfMeta = body.includes('name="_csrf"');
    if (forms.length > 0 && !csrfMeta) {
      // Check if forms are POST
      const postForms = forms.filter(f => f.includes('method="post"') || f.includes('method="POST"'));
      if (postForms.length > 0) {
        console.log('  [CHECK] ' + postForms.length + ' POST forms — verifying CSRF');
        // CSRF might be in a meta tag
        const csrfInput = body.match(/<input[^>]*name="_csrf"[^>]*>/g);
        console.log('  CSRF inputs: ' + (csrfInput ? csrfInput.length : 0));
      }
    }
  }
  
  // Now check all internal assets
  console.log('\n\nChecking all referenced static assets...');
  const body = pages[0].body + pages[1].body + pages[2].body;
  const allRefs = body.match(/(?:src|href)="([^"]+)"/g) || [];
  const uniqueRefs = [...new Set(allRefs.map(r => r.split('"')[1]))];
  const internalAssets = uniqueRefs.filter(r => r.startsWith('/') && !r.startsWith('//'));
  
  console.log('Found ' + internalAssets.length + ' unique internal references');
  for (const asset of internalAssets) {
    if (asset.includes('{{')) continue; // skip template variables
    const result = await getPage(asset);
    const ok = result.status >= 200 && result.status < 400;
    if (!ok) {
      console.log('  [BROKEN] ' + result.status + ' ' + asset);
    } else {
      console.log('  OK ' + result.status + ' ' + asset + ' (' + result.body.length + ' bytes)');
    }
  }
  
  console.log('\n=== PHASE 1 COMPLETE ===');
})();
