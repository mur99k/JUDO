(function() {
  var profileForm = document.getElementById('profileForm');
  var passwordForm = document.getElementById('passwordForm');

  function loadProfile() {
    API.get('/api/auth/me').then(function(res) {
      if (!res.success) throw new Error(res.error || 'فشل تحميل الملف الشخصي');
      var data = res.user || {};
      var nameEl = document.getElementById('profileName');
      var emailEl = document.getElementById('profileEmail');
      var phoneEl = document.getElementById('profilePhone');
      if (nameEl) nameEl.value = data.name || data.fullName || '';
      if (emailEl) emailEl.value = data.email || '';
      if (phoneEl) phoneEl.value = data.phone || '';
    }).catch(function(err) {
      if (typeof Toast !== 'undefined') Toast.error('خطأ', err.message);
    });
  }

  function saveProfile() {
    if (!profileForm) return;
    var formData = new FormData(profileForm);
    API.formPut('/api/auth/profile', formData).then(function(res) {
      if (!res.success) throw new Error(res.error || 'فشل حفظ الملف الشخصي');
      if (typeof Toast !== 'undefined') Toast.success('نجاح', 'تم تحديث الملف الشخصي');
    }).catch(function(err) {
      if (typeof Toast !== 'undefined') Toast.error('خطأ', err.message);
    });
  }

  function changePassword() {
    if (!passwordForm) return;
    var currentPw = document.getElementById('currentPassword');
    var newPw = document.getElementById('newPassword');
    var confirmPw = document.getElementById('confirmPassword');
    if (!currentPw || !newPw || !confirmPw) return;
    if (newPw.value !== confirmPw.value) {
      if (typeof Toast !== 'undefined') Toast.warning('تنبيه', 'كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (newPw.value.length < 6) {
      if (typeof Toast !== 'undefined') Toast.warning('تنبيه', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    API.put('/api/auth/password', {
      currentPassword: currentPw.value,
      newPassword: newPw.value
    }).then(function(res) {
      if (!res.success) throw new Error(res.error || 'فشل تغيير كلمة المرور');
      if (typeof Toast !== 'undefined') Toast.success('نجاح', 'تم تغيير كلمة المرور');
      passwordForm.reset();
    }).catch(function(err) {
      if (typeof Toast !== 'undefined') Toast.error('خطأ', err.message);
    });
  }

  var saveProfileBtn = document.getElementById('saveProfileBtn');
  if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
  var changePwBtn = document.getElementById('changePasswordBtn');
  if (changePwBtn) changePwBtn.addEventListener('click', changePassword);
  if (document.getElementById('profileForm')) loadProfile();
})();