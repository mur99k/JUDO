const https = require('https');
https.get('https://kilocode.onrender.com', { rejectUnauthorized: false, headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const coachesSection = d.substring(d.indexOf('id="coaches"'), d.indexOf('id="coaches"') + 1000);
    console.log('=== COACHES SECTION ===');
    console.log(coachesSection);
    // Check if coaches array is empty or has data
    const emptyMsg = d.includes('سيتم إضافة بيانات المدربين قريباً');
    console.log(`\nEmpty message present: ${emptyMsg}`);
    const hasMoataq = d.includes('كابتن معتوق');
    const hasMarwan = d.includes('كابتن مروان');
    console.log(`Has كابتن معتوق: ${hasMoataq}`);
    console.log(`Has كابتن مروان: ${hasMarwan}`);
  });
});
