function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح بالوصول' });
  }
  next();
}

function requireAdminOrCoach(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }
  if (req.session.role !== 'admin' && req.session.role !== 'coach') {
    return res.status(403).json({ error: 'غير مصرح بالوصول' });
  }
  next();
}

function injectUser(req, res, next) {
  res.locals.user = req.session.userId ? {
    id: req.session.userId,
    name: req.session.userName,
    role: req.session.role
  } : null;
  next();
}

module.exports = { requireAuth, requireAdmin, requireAdminOrCoach, injectUser };
