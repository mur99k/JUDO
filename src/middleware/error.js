function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }

  if (err.message && err.message.startsWith('نوع الملف')) {
    return res.status(400).json({ success: false, error: err.message });
  }

  if (err.status) {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  res.status(500).json({ success: false, error: 'حدث خطأ داخلي في الخادم' });
}

function notFound(req, res) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'الوصلة غير موجودة' });
  }
  res.status(404).render('pages/404', { title: 'الصفحة غير موجودة' });
}

module.exports = { errorHandler, notFound };
