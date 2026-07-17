(function() {
  var tableBody = document.getElementById('coachesBody');
  var addBtn = document.getElementById('addCoachBtn');
  var saveBtn = document.getElementById('saveCoachBtn');
  var form = document.getElementById('coachForm');
  var nameEl = document.getElementById('coachName');
  var emailEl = document.getElementById('coachEmail');
  var phoneEl = document.getElementById('coachPhone');
  var passEl = document.getElementById('coachPass');
  var toggleBtn = document.getElementById('togglePass');
  var eyeVisible = document.getElementById('eyeVisible');
  var eyeHidden = document.getElementById('eyeHidden');
  var modal = document.getElementById('coachModal');
  var modalTitle = document.querySelector('#coachModal .modal-title');
  var editingId = null;

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      var isPassword = passEl.type === 'password';
      passEl.type = isPassword ? 'text' : 'password';
      if (eyeVisible) eyeVisible.style.display = isPassword ? 'none' : '';
      if (eyeHidden) eyeHidden.style.display = isPassword ? '' : 'none';
    });
  }

  function loadCoaches() {
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#a0aec0;">جاري التحميل...</td></tr>';
    API.get('/api/coaches').then(function(res) {
      if (!res.success) throw new Error(res.error||'فشل');
      renderTable(res.coaches||[]);
    }).catch(function(err) {
      if (tableBody) tableBody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:20px;color:#ef4444;">'+err.message+'</td></tr>';
    });
  }

  function renderTable(coaches) {
    if (!tableBody) return;
    if (!coaches||!coaches.length) { tableBody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:30px;color:#a0aec0;">لا يوجد مدربون</td></tr>'; return; }
    var html='';
    for (var i=0;i<coaches.length;i++) {
      var c=coaches[i];
      var pwd = c.password_plain || null;
      var avatar = c.profileImage ? '<img src="'+c.profileImage+'" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">' : '<div style="width:30px;height:30px;border-radius:50%;background:var(--color-navy);color:var(--color-gold-light);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;">'+(c.fullName||c.name||'?').charAt(0)+'</div>';
      html+='<tr>'+
        '<td><div style="display:flex;align-items:center;gap:8px;">'+avatar+'<span style="font-weight:600;">'+(c.fullName||c.name||'')+'</span></div></td>'+
        '<td style="color:#718096;">'+(c.email||'')+'</td>'+
        '<td style="color:#718096;direction:ltr;text-align:right;">'+(c.phone||'')+'</td>'+
        '<td style="direction:ltr;text-align:center;font-family:monospace;font-size:0.85rem;">'+
          (pwd ? '<span class="pwd-text" data-pwd="'+pwd+'">••••••••</span> <button onclick="togglePwd(this)" style="background:none;border:none;cursor:pointer;padding:2px 4px;color:#94a3b8;vertical-align:middle;" title="إظهار/إخفاء">👁️</button>' : '<span style="color:#a0aec0;font-size:0.78rem;">غير متاحة</span>')+
        '</td>'+
        '<td><div style="display:flex;gap:4px;">'+
          '<button onclick="editCoach('+c.id+')" style="padding:4px 10px;border-radius:6px;border:1px solid #dbeafe;background:#eff6ff;color:#3b82f6;font-size:0.75rem;cursor:pointer;font-family:var(--font-primary);">تعديل</button>'+
          '<button onclick="delCoach('+c.id+')" style="padding:4px 10px;border-radius:6px;border:1px solid #fee2e2;background:#fff;color:#ef4444;font-size:0.75rem;cursor:pointer;font-family:var(--font-primary);">حذف</button>'+
        '</div></td></tr>';
    }
    tableBody.innerHTML=html;
  }

  window.togglePwd = function(btn) {
    var span = btn.previousElementSibling;
    if (span.tagName === 'SPAN' && span.classList.contains('pwd-text')) {
      var isHidden = span.textContent === '••••••••';
      span.textContent = isHidden ? span.getAttribute('data-pwd') : '••••••••';
      btn.textContent = isHidden ? '🙈' : '👁️';
    }
  };

  // Photo preview
  var photoInput = document.getElementById('coachPhoto');
  var photoPreview = document.getElementById('coachPhotoPreview');
  var photoPlaceholder = document.getElementById('coachPhotoPlaceholder');
  if (photoInput) {
    photoInput.addEventListener('change', function() {
      var file = photoInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        if (photoPreview) { photoPreview.src = e.target.result; photoPreview.style.display = 'block'; }
        if (photoPlaceholder) photoPlaceholder.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  window.editCoach = function(id) {
    editingId=id;
    if (modalTitle) modalTitle.textContent='تعديل بيانات المدرب';
    if (passEl) {
      passEl.parentElement.style.display='block';
      passEl.required=false;
      passEl.value='';
      passEl.placeholder='جاري التحميل...';
      passEl.type='password';
      if (eyeVisible) eyeVisible.style.display = '';
      if (eyeHidden) eyeHidden.style.display = 'none';
    }
    // Reset photo preview
    if (photoPreview) { photoPreview.style.display = 'none'; photoPreview.src = ''; }
    if (photoPlaceholder) photoPlaceholder.style.display = 'flex';
    if (photoInput) photoInput.value = '';
    API.get('/api/coaches/'+id).then(function(res) {
      if (!res.success) throw new Error(res.error||'فشل');
      var c=res.coach||{};
      if (nameEl) nameEl.value=c.fullName||c.name||'';
      if (emailEl) emailEl.value=c.email||'';
      if (phoneEl) phoneEl.value=c.phone||'';
      if (passEl) {
        if (c.password_plain) {
          passEl.value = c.password_plain;
          passEl.type = 'text';
          passEl.placeholder = '';
          if (eyeVisible) eyeVisible.style.display = 'none';
          if (eyeHidden) eyeHidden.style.display = '';
        } else {
          passEl.value = '';
          passEl.type = 'password';
          passEl.placeholder = 'غير متاحة حالياً - اكتب كلمة جديدة';
          if (eyeVisible) eyeVisible.style.display = '';
          if (eyeHidden) eyeHidden.style.display = 'none';
        }
      }
      // Show existing photo
      if (c.profileImage && photoPreview && photoPlaceholder) {
        photoPreview.src = c.profileImage;
        photoPreview.style.display = 'block';
        photoPlaceholder.style.display = 'none';
      }
      if (modal) modal.classList.add('active');
    }).catch(function(err){alert(err.message)});
  };

  window.delCoach = function(id) {
    if (!confirm('حذف المدرب؟')) return;
    API.del('/api/coaches/'+id).then(function(){loadCoaches()}).catch(function(e){alert(e.message)});
  };

  function showAddForm() {
    editingId=null;
    if (modalTitle) modalTitle.textContent='إضافة مدرب جديد';
    if (passEl) {
      passEl.parentElement.style.display='block';
      passEl.required=true;
      passEl.placeholder='كلمة المرور';
      passEl.value='';
      passEl.type='password';
    }
    if (form) form.reset();
    // Reset photo preview
    if (photoPreview) { photoPreview.style.display = 'none'; photoPreview.src = ''; }
    if (photoPlaceholder) photoPlaceholder.style.display = 'flex';
    if (photoInput) photoInput.value = '';
    if (modal) modal.classList.add('active');
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      var data={}, fields=form.querySelectorAll('input,select,textarea');
      for (var i=0;i<fields.length;i++) { if (fields[i].name) data[fields[i].name]=fields[i].value; }
      if (!data.fullName) { alert('الاسم مطلوب'); return; }
      if (!data.email) { alert('البريد مطلوب'); return; }
      if (!editingId && !data.password) { alert('كلمة المرور مطلوبة'); return; }
      if (editingId && !data.password) delete data.password;
      var self=this;
      self.disabled=true; self.textContent='جاري...';
      var photoInput = document.getElementById('coachPhoto');
      var photoFile = photoInput && photoInput.files[0];
      var prom;
      if (photoFile) {
        var fd = new FormData();
        for (var key in data) fd.append(key, data[key]);
        fd.append('photo', photoFile);
        prom = editingId ? API.formPut('/api/coaches/'+editingId, fd) : API.formPost('/api/coaches', fd);
      } else {
        prom = editingId ? API.put('/api/coaches/'+editingId, data) : API.post('/api/coaches', data);
      }
      prom.then(function(r) {
        if (!r.success) throw new Error(r.error||'فشل');
        if (modal) modal.classList.remove('active');
        loadCoaches();
      }).catch(function(e){alert(e.message)}).finally(function(){
        self.disabled=false; self.textContent='حفظ';
      });
    });
  }

  if (addBtn) addBtn.addEventListener('click', showAddForm);
  if (document.getElementById('coachesBody')) loadCoaches();
})();