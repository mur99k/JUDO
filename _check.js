const https = require('https');
function req(method, path, body, cookie) {
  return new Promise((ok, no) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method, hostname: 'kilocode.onrender.com', port: 443, path,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
      rejectUnauthorized: false
    };
    const r = https.request(opts, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => ok({ s: x.statusCode, b: d, ck: x.headers['set-cookie'] })); });
    r.on('error', no); if (data) r.write(data); r.end();
  });
}
(async () => {
  const login = await req('POST', '/api/auth/login', { email: 'Matoq701@gmail.com', password: 'Ma123456' });
  const cookie = login.ck ? login.ck[0].split(';')[0] : '';
  if (!cookie) { console.log('no cookie'); return; }

  // Get health page and parse R2 status
  const health = await req('GET', '/dashboard/system-health', null, cookie);
  const body = health.b;
  
  // Find R2/Storage status in the page
  const r2Match = body.match(/(?:R2|Storage|التخزين)[^<]*?(?:connected|error|local|status)[^<]*/ig);
  console.log('R2 matches:', r2Match || 'none');
  
  // Find Database status
  const dbMatch = body.match(/(?:Database|قاعدة|DB|db)[^<]*?(?:connected|error|status|Latency)[^<]*/ig);
  console.log('DB matches:', dbMatch || 'none');
  
  // Just look for status indicators
  const indicators = body.match(/connected|error|local|running|active|Latency|\d+ms|صحة|التخزين|قاعدة|R2|storage|DB|database/ig);
  console.log('Indicators found:', indicators ? indicators.slice(0, 30) : 'none');

  // Health info appears in specific divs
  const sections = body.match(/(?:<div[^>]*class="[^"]*(?:health|stat|metric|status)[^"]*"[^>]*>)([\s\S]*?)<\/div>/gi);
  if (sections) sections.slice(0, 5).forEach(s => console.log('Section:', s.substring(0, 200)));
  else console.log('No health sections found');

  // Try to find any relevant container
  const containers = body.match(/<section[^>]*>[\s\S]*?<\/section>/gi);
  if (containers) containers.forEach(c => console.log('Container:', c.substring(0, 300)));
})();
