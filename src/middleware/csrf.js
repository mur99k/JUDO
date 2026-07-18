function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const allowed = (req.get('Host') || '').toLowerCase();
  const isAllowed = (val) => {
    if (!val) return false;
    try {
      const h = new URL(val).hostname.toLowerCase();
      return h === allowed || h.endsWith('.' + allowed) || h === 'localhost' || h.endsWith('.localhost');
    } catch { return false; }
  };
  if (origin && isAllowed(origin)) return next();
  if (!origin && referer && isAllowed(referer)) return next();
  return res.status(403).json({ error: 'طلب مرفوض: مصدر غير مصرح' });
}

module.exports = { csrfProtection };
