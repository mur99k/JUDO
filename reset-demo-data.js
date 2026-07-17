/**
 * reset-demo-data.js
 * Safely removes ALL demo/test data while preserving:
 *   - Database structure (tables, indexes, migrations)
 *   - Admin account(s) (users with role = 'admin')
 *   - System configuration (settings table)
 *   - Uploaded gallery images and user photos are OPTIONALLY cleared.
 *
 * Usage:
 *   node reset-demo-data.js            # clears data, keeps gallery + uploads
 *   node reset-demo-data.js --wipe-media # also deletes gallery photos + uploaded images
 *
 * This does NOT touch the schema. After running, the system is empty
 * and ready for the real production launch.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const wipeMedia = args.includes('--wipe-media');

const dbPath = path.join(__dirname, 'data', 'club.db');
if (!fs.existsSync(dbPath)) {
  console.log('❌ قاعدة البيانات غير موجودة: ' + dbPath);
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function count(table, where) {
  const sql = where ? `SELECT COUNT(*) c FROM ${table} WHERE ${where}` : `SELECT COUNT(*) c FROM ${table}`;
  return db.prepare(sql).get().c;
}

console.log('🧹 بدء تنظيف بيانات التجربة...');
console.log('   (يتم الحفاظ على الهيكل، حساب المدير، والإعدادات)\n');

const tx = db.transaction(() => {
  // 1. Attendance records (all)
  const att = count('attendance');
  db.prepare('DELETE FROM attendance').run();

  // 2. Subscriptions (all)
  const subs = count('subscriptions');
  db.prepare('DELETE FROM subscriptions').run();

  // 3. Students (all) — keep nothing demo
  const stu = count('students');
  db.prepare('DELETE FROM students').run();

  // 4. Coaches (demo users with role = 'coach')
  const coaches = count("users WHERE role = 'coach'");
  db.prepare("DELETE FROM users WHERE role = 'coach'").run();

  // 5. Contact messages (all)
  const msgs = count('contact_messages');
  db.prepare('DELETE FROM contact_messages').run();

  return { att, subs, stu, coaches, msgs };
});

const result = tx();

// 6. Reset autoincrement sequences so IDs start clean
try { db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('attendance','subscriptions','students','users','contact_messages')").run(); } catch (e) { /* table may not exist */ }

console.log('✅ تم حذف بيانات التجربة:');
console.log('   سجلات الحضور : ' + result.att);
console.log('   الاشتراكات   : ' + result.subs);
console.log('   الطلاب       : ' + result.stu);
console.log('   المدربون     : ' + result.coaches);
console.log('   رسائل التواصل: ' + result.msgs);

// 7. Media cleanup (optional)
let mediaCount = 0;
if (wipeMedia) {
  console.log('\n🗑  حذف الوسائط (--wipe-media)...');
  const dirs = [
    path.join(__dirname, 'بطولات وجوائز'),
    path.join(__dirname, 'uploads', 'students'),
    path.join(__dirname, 'uploads', 'coaches'),
    path.join(__dirname, 'uploads', 'admins')
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
      const fp = path.join(dir, f);
      try { if (fs.statSync(fp).isFile()) { fs.unlinkSync(fp); mediaCount++; } } catch (e) {}
    });
  });
  console.log('   تم حذف ' + mediaCount + ' ملف وسائط');
} else {
  console.log('\nℹ️  لم يتم حذف الصور. للحذف الكامل استخدم: node reset-demo-data.js --wipe-media');
}

// 8. Preserved summary
const admins = count("users WHERE role = 'admin'");
const settings = count('settings');
console.log('\n🔒 ما زال محفوظاً:');
console.log('   حسابات المدير: ' + admins);
console.log('   إعدادات النظام: ' + settings + ' مفتاح');
console.log('   هيكل قاعدة البيانات: ✅');

db.close();
console.log('\n✅ اكتمل التنظيف. النظام جاهز للإطلاق الفعلي.');
