// Hijri date conversion utilities
const HIJRI_MONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];

function hijriToGregorian(hYear, hMonth, hDay) {
  // Approximate conversion
  const jd = Math.floor((11 * hYear + 3) / 30) + 354 * hYear + 30 * hMonth - Math.floor((hMonth - 1) / 2) + hDay + 1948440 - 385;
  const l = jd + 68569;
  const n = Math.floor(4 * l / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor(4000 * (l2 + 1) / 1461001);
  const l3 = l2 - Math.floor(1461 * i / 4) + 31;
  const j = Math.floor(80 * l3 / 2447);
  const day = l3 - Math.floor(2447 * j / 80);
  const l4 = Math.floor(j / 11);
  const month = j + 2 - 12 * l4;
  const year = 100 * (n - 49) + i + l4;
  return new Date(year, month - 1, day);
}

function gregorianToHijri(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const jd = Math.floor((1461 * (year + 4800 + Math.floor((month - 14) / 12))) / 4) + 
             Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14) / 12))) / 12) - 
             Math.floor((3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100)) / 4) + 
             day - 32075;
  
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hMonth = Math.floor((24 * l3) / 709);
  const hDay = l3 - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;
  
  return { year: hYear, month: hMonth, day: hDay };
}

function formatHijriDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getHijriMonthName(monthNum) {
  return HIJRI_MONTHS[monthNum - 1] || '';
}

function getCurrentHijriYear() {
  const now = new Date();
  const hijri = gregorianToHijri(now);
  return hijri.year;
}

module.exports = { hijriToGregorian, gregorianToHijri, formatHijriDate, getHijriMonthName, getCurrentHijriYear, HIJRI_MONTHS };
