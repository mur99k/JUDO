(function (global) {
  'use strict';
  var U = global.umalqura;
  try { U.locale('ar'); } catch (e) {}

  var HIJRI_MONTHS = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // Parse a Hijri YYYY-MM-DD string.
  function parse(str) {
    if (!str) return null;
    var m = String(str).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return { hy: Number(m[1]), hm: Number(m[2]), hd: Number(m[3]) };
  }

  // Build a umalqura instance from a Hijri YYYY-MM-DD string.
  function fromStr(str) {
    var p = parse(str);
    if (!p) return null;
    return new U(p.hy, p.hm, p.hd);
  }

  function toStr(u) {
    return u.hy + '-' + pad(u.hm) + '-' + pad(u.hd);
  }

  // Today's Hijri date as YYYY-MM-DD (local time).
  function today() {
    var d = new Date();
    var u = new U(d);
    return toStr(u);
  }

  // Format a Hijri YYYY-MM-DD string as "15 صفر 1448 هـ".
  function format(str, withSuffix) {
    if (withSuffix === undefined) withSuffix = true;
    var u = fromStr(str);
    if (!u) return str;
    var monthName = HIJRI_MONTHS[u.hm - 1] || ('' + u.hm);
    var day = U.localizeNum(u.hd);
    var year = U.localizeNum(u.hy);
    return day + ' ' + monthName + ' ' + year + (withSuffix ? ' هـ' : '');
  }

  function monthName(num) {
    return HIJRI_MONTHS[(Number(num) - 1 + 12) % 12] || ('' + num);
  }

  // Add N hijri days/months to a Hijri YYYY-MM-DD string.
  function addDays(str, days) {
    var u = fromStr(str);
    if (!u) return str;
    return toStr(u.add(Number(days), 'day'));
  }
  function addMonths(str, months) {
    var u = fromStr(str);
    if (!u) return str;
    return toStr(u.add(Number(months), 'month'));
  }

  // Number of days between two Hijri YYYY-MM-DD strings (b - a).
  function daysBetween(aStr, bStr) {
    var a = fromStr(aStr), b = fromStr(bStr);
    if (!a || !b) return 0;
    return Math.round((b._date.getTime() - a._date.getTime()) / 86400000);
  }

  // Days in a Hijri month/year (29 or 30).
  function daysInMonth(hy, hm) {
    var first = new U(hy, hm, 1);
    var next = first.add(1, 'month');
    return Math.round((next._date.getTime() - first._date.getTime()) / 86400000);
  }

  // Convert Hijri YYYY-MM-DD -> Gregorian ISO YYYY-MM-DD (internal only).
  function toGregorianISO(str) {
    var u = fromStr(str);
    if (!u) return null;
    var d = u._date;
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // Convert a JS Date -> Hijri YYYY-MM-DD string (internal only).
  function fromDate(date) {
    var u = new U(date);
    return toStr(u);
  }

  global.Hijri = {
    U: U,
    HIJRI_MONTHS: HIJRI_MONTHS,
    parse: parse,
    fromStr: fromStr,
    today: today,
    format: format,
    monthName: monthName,
    addDays: addDays,
    addMonths: addMonths,
    daysBetween: daysBetween,
    daysInMonth: daysInMonth,
    toGregorianISO: toGregorianISO,
    fromDate: fromDate,
    pad: pad,
    toStr: toStr
  };
})(window);
