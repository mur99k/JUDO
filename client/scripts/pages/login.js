(function() {
  var tabs = document.querySelectorAll('.auth-tab');
  var errorEl = document.getElementById('errorDisplay');
  var backBtn = document.getElementById('backToStudent');

  function fetchWithTimeout(url, opts, timeout) {
    return new Promise(function(resolve, reject) {
      var ctrl = new AbortController();
      var timer = setTimeout(function() { ctrl.abort(); }, timeout || 15000);
      opts.signal = ctrl.signal;
      fetch(url, opts).then(function(res) {
        clearTimeout(timer);
        resolve(res);
      }).catch(function(err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') reject(new Error('انتهت مهلة الاتصال'));
        else reject(err);
      });
    });
  }

  function switchForm(formId) {
    var forms = document.querySelectorAll('.auth-form');
    forms.forEach(function(f) { f.style.display = 'none'; });
    var target = document.getElementById(formId);
    if (target) target.style.display = 'flex';
    hideError();
  }

  if (tabs.length) {
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        tabs.forEach(function(t) {
          t.style.background = 'var(--gray-50)';
          t.style.color = 'var(--text-muted)';
        });
        tab.style.background = 'var(--color-navy)';
        tab.style.color = 'white';
        switchForm(tab.getAttribute('data-form'));
      });
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', function() {
      var studentTab = document.getElementById('tabStudent');
      if (studentTab) studentTab.click();
    });
  }

  function showError(msg) {
    if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
  }
  function hideError() { if (errorEl) errorEl.style.display = 'none'; }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    var text = btn.querySelector('.btn-text');
    if (!text) return;
    if (!text.dataset.orig) text.dataset.orig = text.textContent;
    text.textContent = loading ? 'جاري...' : text.dataset.orig;
  }

  var adminForm = document.getElementById('adminLoginForm');
  var studentForm = document.getElementById('studentLoginForm');

  if (adminForm) {
    adminForm.addEventListener('submit', async function(e) {
      e.preventDefault(); hideError();
      var btn = adminForm.querySelector('button[type="submit"]');
      setLoading(btn, true);
      try {
        var fd = new FormData(adminForm); var data = {};
        fd.forEach(function(v, k) { data[k] = v; });
        var res = await fetchWithTimeout('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        var json = await res.json();
        if (json.success) {
          if (json.role === 'coach') window.location.href = '/coach';
          else window.location.href = '/dashboard';
        } else { throw new Error(json.error || 'خطأ في الدخول'); }
      } catch (err) { showError(err.message); setLoading(btn, false); }
    });
  }

  if (studentForm) {
    studentForm.addEventListener('submit', async function(e) {
      e.preventDefault(); hideError();
      var btn = studentForm.querySelector('button[type="submit"]');
      setLoading(btn, true);
      try {
        var fd = new FormData(studentForm); var data = {};
        fd.forEach(function(v, k) { data[k] = v; });
        var res = await fetchWithTimeout('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        var json = await res.json();
        if (json.success && json.role === 'student') window.location.href = '/student';
        else throw new Error(json.error || 'بيانات الدخول غير صحيحة');
      } catch (err) { showError(err.message); setLoading(btn, false); }
    });
  }

  if (errorEl) {
    var allInputs = document.querySelectorAll('.auth-form input');
    allInputs.forEach(function(inp) { inp.addEventListener('input', hideError); });
  }
})();