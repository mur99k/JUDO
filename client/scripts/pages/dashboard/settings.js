(function() {
  var form = document.getElementById('settingsForm');
  var adminNameInput = document.getElementById('settingsAdminName');

  function loadSettings() {
    API.get('/api/settings').then(function(res) {
      if (!res.success) throw new Error(res.error || 'فح تحميل الإعدادات');
      var data = res.settings || {};
      var map = {
        adminName: 'settingsAdminName',
        adminPhone: 'settingsAdminPhone',
        clubWhatsapp: 'settingsClubWhatsapp',
        aiProvider: 'settingsAiProvider',
        aiApiKey: 'settingsAiApiKey'
      };
      for (var key in map) {
        var el = document.getElementById(map[key]);
        if (el && data[key] !== undefined) el.value = data[key];
      }
    }).catch(function(err) {
      // silently ignore - settings endpoint may not exist
    });
  }

  function saveSettings() {
    if (!form) return;
    var data = {};
    var fields = form.querySelectorAll('input, select, textarea');
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].name) data[fields[i].name] = fields[i].value;
    }
    API.put('/api/settings', data).then(function(res) {
      if (!res.success) throw new Error(res.error || 'فشل حفظ الإعدادات');
      if (typeof Toast !== 'undefined') Toast.success('نجاح', 'تم حفظ الإعدادات');
    }).catch(function(err) {
      if (typeof Toast !== 'undefined') Toast.error('خطأ', err.message);
    });
  }

  var saveBtn = document.getElementById('saveSettingsBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }

  if (document.getElementById('settingsForm')) {
    loadSettings();
  }
})();
