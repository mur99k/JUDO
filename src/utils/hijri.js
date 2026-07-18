const UmAlQura = require('@umalqura/core').default;

// Enable Arabic-Indic numerals for all formatting.
try { UmAlQura.locale('ar'); } catch (e) { /* default locale */ }

const HIJRI_MONTHS = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

// Parse a Hijri YYYY-MM-DD string into { hy, hm, hd }.
function parseHijri(str) {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { hy: Number(m[1]), hm: Number(m[2]), hd: Number(m[3]) };
}

// Build a Hijri UmAlQura instance from a Hijri YYYY-MM-DD string.
function fromHijriString(str) {
  const p = parseHijri(str);
  if (!p) return null;
  return new UmAlQura(p.hy, p.hm, p.hd);
}

// Today's Hijri date as YYYY-MM-DD string (local time, Umm al-Qura).
function todayHijri() {
  const u = new UmAlQura(new Date());
  return `${u.hy}-${String(u.hm).padStart(2, '0')}-${String(u.hd).padStart(2, '0')}`;
}

// Format a Hijri YYYY-MM-DD string as "15 صفر 1448 هـ".
function formatHijri(str, withSuffix = true) {
  const u = fromHijriString(str);
  if (!u) return str;
  const monthName = HIJRI_MONTHS[u.hm - 1] || String(u.hm);
  const day = UmAlQura.localizeNum(u.hd);
  const year = UmAlQura.localizeNum(u.hy);
  return `${day} ${monthName} ${year}${withSuffix ? ' هـ' : ''}`;
}

// Short numeric form "1448-02-15" already stored; expose month name helper.
function hijriMonthName(monthNum) {
  return HIJRI_MONTHS[(Number(monthNum) - 1 + 12) % 12] || String(monthNum);
}

// Add N hijri days to a Hijri YYYY-MM-DD string, return new YYYY-MM-DD string.
function addHijriDays(str, days) {
  const u = fromHijriString(str);
  if (!u) return str;
  const r = u.add(Number(days), 'day');
  return `${r.hy}-${String(r.hm).padStart(2, '0')}-${String(r.hd).padStart(2, '0')}`;
}

// Add N hijri months to a Hijri YYYY-MM-DD string.
function addHijriMonths(str, months) {
  const u = fromHijriString(str);
  if (!u) return str;
  const r = u.add(Number(months), 'month');
  return `${r.hy}-${String(r.hm).padStart(2, '0')}-${String(r.hd).padStart(2, '0')}`;
}

// Number of days between two Hijri YYYY-MM-DD strings (b - a), hijri-aware.
function hijriDaysBetween(aStr, bStr) {
  const a = fromHijriString(aStr);
  const b = fromHijriString(bStr);
  if (!a || !b) return 0;
  // Use the underlying gregorian dates (1 day = 1 hijri day under umalqura mapping).
  const ms = b._date.getTime() - a._date.getTime();
  return Math.round(ms / 86400000);
}

// Days in a given Hijri month/year (returns 29 or 30).
function daysInHijriMonth(hy, hm) {
  const first = new UmAlQura(hy, hm, 1);
  const next = first.add(1, 'month');
  const ms = next._date.getTime() - first._date.getTime();
  return Math.round(ms / 86400000);
}

// Convert a Hijri YYYY-MM-DD string to a Gregorian ISO YYYY-MM-DD (internal use only).
function hijriToGregorianISO(str) {
  const u = fromHijriString(str);
  if (!u) return null;
  const d = u._date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Convert a Gregorian date to Hijri YYYY-MM-DD string (internal use only).
function gregorianToHijriISO(date) {
  const d = (date instanceof Date) ? date : new Date(date);
  const u = new UmAlQura(d);
  return `${u.hy}-${String(u.hm).padStart(2, '0')}-${String(u.hd).padStart(2, '0')}`;
}

module.exports = {
  UmAlQura,
  HIJRI_MONTHS,
  parseHijri,
  fromHijriString,
  todayHijri,
  formatHijri,
  hijriMonthName,
  addHijriDays,
  addHijriMonths,
  hijriDaysBetween,
  daysInHijriMonth,
  hijriToGregorianISO,
  gregorianToHijriISO
};
