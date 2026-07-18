const U = require('@umalqura/core').default;
const names = Object.getOwnPropertyNames(U).filter(n => !['length','name','prototype','constructor'].includes(n));
console.log('static names:', names);
console.log('locale fn:', typeof U.locale);
try { U.locale('ar'); } catch(e){ console.log('locale ar err', e.message); }
const u = new U(1448, 2, 15);
console.log('format d M yyyy:', u.format('d M yyyy'));
console.log('format dd MM yyyy:', u.format('dd MM yyyy'));
console.log('format MMMM yyyy:', u.format('MMMM yyyy'));
console.log('format dddd:', u.format('dddd'));
// gregorian accessors
console.log('_date:', u._date);
console.log('date methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(u)).filter(n => typeof u[n] === 'function'));
