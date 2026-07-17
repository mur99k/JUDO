const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const GalleryService = require('../services/gallery.service');
const UserRepo = require('../repositories/user.repo');
const SettingsRepo = require('../repositories/settings.repo');
const storage = require('../storage');
const V = path.resolve(__dirname, '..', 'views');

// Featured coaches shown on the public home page (معتوق + مروان).
async function listFeaturedCoaches() {
  try {
    const rows = await UserRepo.findByRole('coach');
    const coaches = [];
    for (const r of rows) {
      const bioRow = await SettingsRepo.get('coachBio_' + r.id);
      coaches.push({ id: r.id, name: r.fullName, photo: storage.normalizeDbValue(r.profileImage) || null, bio: bioRow || '' });
    }
    return coaches;
  } catch { return []; }
}

function listBackgrounds() {
  const dir = path.resolve(__dirname, '..', '..', 'backgrounds');
  const extraDir = path.resolve(__dirname, '..', '..', 'background-photos');
  var out = [];
  try {
    if (fs.existsSync(dir)) {
      out = out.concat(fs.readdirSync(dir)
        .filter(f => ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(f).toLowerCase()))
        .map(f => {
          var stat = fs.statSync(path.join(dir, f));
          return { name: f, url: '/backgrounds/' + encodeURIComponent(f) + '?v=' + stat.mtime.getTime() };
        }));
    }
    if (fs.existsSync(extraDir)) {
      out = out.concat(fs.readdirSync(extraDir)
        .filter(f => ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(f).toLowerCase()))
        .map(f => {
          var stat = fs.statSync(path.join(extraDir, f));
          return { name: f, url: '/background-photos/' + encodeURIComponent(f) + '?v=' + stat.mtime.getTime() };
        }));
    }
    return out;
  } catch { return []; }
}

function renderPublic(view, opts, cb) {
  ejs.renderFile(path.join(V, view), opts, { views: [V] }, function(e, h) {
    if (e) return cb(e);
    opts.body = h;
    ejs.renderFile(path.join(V, 'layouts/public.ejs'), opts, { views: [V] }, function(e2, f) {
      if (e2) return cb(e2);
      cb(null, f);
    });
  });
}

function renderDash(view, opts, cb) {
  opts.breadcrumbs = opts.breadcrumbs || [{label: opts.title}];
  ejs.renderFile(path.join(V, view), opts, { views: [V] }, function(e, h) {
    if (e) return cb(e);
    opts.body = h;
    ejs.renderFile(path.join(V, 'layouts/dashboard.ejs'), opts, { views: [V] }, function(e2, f) {
      if (e2) return cb(e2);
      cb(null, f);
    });
  });
}

module.exports = {
  home: async function(req, res) {
    try {
      var d = { title: 'الرئيسية', user: res.locals.user, activePage: 'home', photos: await GalleryService.list(), backgrounds: listBackgrounds(), coaches: await listFeaturedCoaches() };
      renderPublic('pages/index.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
    } catch (e) { res.status(500).send(e.message); }
  },
  about: function(req, res) {
    var d = { title: 'عن النادي', user: res.locals.user, activePage: 'about', photos: GalleryService.list() };
    renderPublic('pages/about.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  contact: function(req, res) {
    var d = { title: 'اتصل بنا', user: res.locals.user, activePage: 'contact' };
    renderPublic('pages/contact.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  login: function(req, res) {
    if (req.session.userId) return res.redirect(req.session.role === 'student' ? '/student' : '/dashboard');
    var d = { title: 'تسجيل الدخول', user: null, activePage: 'login' };
    renderPublic('pages/login.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  register: function(req, res) {
    if (req.session.userId) return res.redirect(req.session.role === 'student' ? '/student' : '/dashboard');
    var d = { title: 'تسجيل جديد', user: null, activePage: 'register' };
    renderPublic('pages/register.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },

  /* ─── Dashboard ─── */
  dashboard: function(req, res) {
    if (!req.session.userId) return res.redirect('/login');
    if (req.session.role === 'student') return res.redirect('/student');
    var d = { title: 'لوحة التحكم', user: res.locals.user, activePage: 'overview', breadcrumbs: [{label:'لوحة التحكم'}] };
    renderDash('pages/dashboard/overview.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  dashboardStudents: function(req, res) {
    if (!req.session.userId) return res.redirect('/login');
    var d = { title: 'الطلاب', user: res.locals.user, activePage: 'students', breadcrumbs: [{url:'/dashboard',label:'لوحة التحكم'},{label:'الطلاب'}] };
    renderDash('pages/dashboard/students.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  dashboardCoaches: function(req, res) {
    if (!req.session.userId) return res.redirect('/login');
    if (req.session.role !== 'admin') return res.redirect('/dashboard');
    var d = { title: 'المدربون', user: res.locals.user, activePage: 'coaches', breadcrumbs: [{url:'/dashboard',label:'لوحة التحكم'},{label:'المدربون'}] };
    renderDash('pages/dashboard/coaches.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  dashboardAttendance: function(req, res) {
    if (!req.session.userId) return res.redirect('/login');
    var d = { title: 'الحضور', user: res.locals.user, activePage: 'attendance', breadcrumbs: [{url:'/dashboard',label:'لوحة التحكم'},{label:'الحضور'}] };
    renderDash('pages/dashboard/attendance.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  dashboardStudentReport: function(req, res) {
    if (!req.session.userId) return res.redirect('/login');
    var d = { title: 'تقرير طالب', user: res.locals.user, activePage: 'attendance', studentId: req.params.id, month: req.query.month, year: req.query.year, breadcrumbs: [{url:'/dashboard',label:'لوحة التحكم'},{url:'/dashboard/attendance',label:'الحضور'},{label:'تقرير الطالب'}] };
    renderDash('pages/dashboard/student-report.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  dashboardSubscriptions: function(req, res) {
    if (!req.session.userId) return res.redirect('/login');
    if (req.session.role !== 'admin') return res.redirect('/dashboard');
    var d = { title: 'الاشتراكات', user: res.locals.user, activePage: 'subscriptions', breadcrumbs: [{url:'/dashboard',label:'لوحة التحكم'},{label:'الاشتراكات'}] };
    renderDash('pages/dashboard/subscriptions.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  dashboardReports: function(req, res) {
    if (!req.session.userId) return res.redirect('/login');
    if (req.session.role !== 'admin') return res.redirect('/dashboard');
    var d = { title: 'التقارير', user: res.locals.user, activePage: 'reports', breadcrumbs: [{url:'/dashboard',label:'لوحة التحكم'},{label:'التقارير'}] };
    renderDash('pages/dashboard/reports.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  dashboardGallery: function(req, res) {
    if (!req.session.userId) return res.redirect('/login');
    var d = { title: 'معرض الصور', user: res.locals.user, activePage: 'gallery', photos: GalleryService.list(), breadcrumbs: [{url:'/dashboard',label:'لوحة التحكم'},{label:'معرض الصور'}] };
    renderDash('pages/dashboard/gallery.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  dashboardSettings: function(req, res) {
    if (!req.session.userId) return res.redirect('/login');
    if (req.session.role !== 'admin') return res.redirect('/dashboard');
    var d = { title: 'الإعدادات', user: res.locals.user, activePage: 'settings', breadcrumbs: [{url:'/dashboard',label:'لوحة التحكم'},{label:'الإعدادات'}] };
    renderDash('pages/dashboard/settings.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  dashboardProfile: function(req, res) {
    if (!req.session.userId) return res.redirect('/login');
    var d = { title: 'الملف الشخصي', user: res.locals.user, activePage: 'profile', breadcrumbs: [{url:'/dashboard',label:'لوحة التحكم'},{label:'الملف الشخصي'}] };
    renderDash('pages/dashboard/profile.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },

  /* ─── Student / Coach ─── */
  student: function(req, res) {
    if (!req.session.userId || req.session.role !== 'student') return res.redirect('/login');
    var d = { title: 'صفحتي', user: res.locals.user, activePage: 'student' };
    renderPublic('pages/student.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  },
  coach: function(req, res) {
    if (!req.session.userId || req.session.role !== 'coach') return res.redirect('/login');
    const UserRepo = require('../repositories/user.repo');
    const coach = UserRepo.findById(req.session.userId) || {};
    var d = { title: 'لوحة المدرب', user: res.locals.user, coach: coach, activePage: 'coach', breadcrumbs: [{label:'لوحة المدرب'}] };
    renderDash('pages/coach.ejs', d, function(e, f) { if (e) return res.status(500).send(e.message); res.send(f); });
  }
};