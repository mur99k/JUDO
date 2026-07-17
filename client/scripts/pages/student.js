async function studentLogout() {
  try {
    await API.post('/api/auth/logout');
    window.location.href = '/';
  } catch (e) {
    window.location.href = '/';
  }
}

(function() {
  var container = document.getElementById('studentDashboard');
  if (!container) return;

  async function loadDashboard() {
    container.innerHTML = '<div style="padding:40px;text-align:center;"><div class="skeleton" style="width:100%;height:200px;border-radius:16px;"></div></div>';
    try {
      var me = await API.get('/api/auth/me');
      var user = me.user || {};

      var html = '';

      // === 1. PROFILE HEADER ===
      html += '<div style="background:linear-gradient(135deg,var(--color-navy),#1e3a5f);border-radius:20px;padding:28px 22px;color:#fff;margin-bottom:18px;">';
      html += '  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">';
      if (user.photo) {
        html += '<img src="'+user.photo+'" alt="" style="width:84px;height:84px;border-radius:50%;object-fit:cover;border:4px solid rgba(201,168,76,0.4);flex-shrink:0;">';
      } else {
        html += '<div style="width:84px;height:84px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:var(--color-gold-light);border:4px solid rgba(201,168,76,0.3);flex-shrink:0;">'+(user.fullName?user.fullName.charAt(0):'?')+'</div>';
      }
      html += '    <div style="flex:1;"><div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:4px;">'+(user.fullName||'')+'</div>';
      if (user.category) {
        html += '    <span style="display:inline-block;margin-top:4px;padding:3px 12px;border-radius:14px;font-size:0.73rem;font-weight:600;background:rgba(201,168,76,0.25);color:var(--color-gold-light);">'+user.category+'</span>';
      }
      html += '    </div>';
      html += '  </div>';
      // Info rows
      html += '  <div style="display:flex;flex-direction:column;gap:10px;font-size:0.9rem;">';
      html += '    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.07);border-radius:10px;"><span style="color:rgba(255,255,255,0.5);">رقم الهوية</span><span style="font-weight:600;">'+(user.nationalId||'')+'</span></div>';
      html += '    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.07);border-radius:10px;"><span style="color:rgba(255,255,255,0.5);">العمر</span><span style="font-weight:600;">'+(user.age||'—')+' سنة</span></div>';
      html += '    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.07);border-radius:10px;"><span style="color:rgba(255,255,255,0.5);">رقم الجوال</span><span style="font-weight:600;direction:ltr;">'+(user.phone||'غير مضبوط')+'</span></div>';
      html += '    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.07);border-radius:10px;"><span style="color:rgba(255,255,255,0.5);">ولي الأمر</span><span style="font-weight:600;direction:ltr;">'+(user.parentPhone||'غير مضبوط')+'</span></div>';
      html += '  </div>';
      // Buttons
      html += '  <div style="display:flex;gap:10px;margin-top:18px;">';
      html += '    <button style="flex:1;background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.25);border-radius:12px;padding:12px;font-size:0.9rem;cursor:pointer;font-family:var(--font-primary);font-weight:500;" onclick="Modal.open(\'editStudentModal\')">تعديل البيانات</button>';
      html += '    <button style="flex:1;background:rgba(239,68,68,0.15);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:12px;font-size:0.9rem;cursor:pointer;font-family:var(--font-primary);font-weight:500;" onclick="studentLogout()">تسجيل الخروج</button>';
      html += '  </div></div>';

      // === 2. STATS - big circles ===
      var stats = me.attendance || { total: 0, present: 0, rate: 0 };
      var ratePct = stats.rate || 0;
      html += '<div style="background:#fff;border-radius:20px;border:1px solid #e9edf2;padding:24px 20px;margin-bottom:18px;">';
      html += '  <div style="font-size:0.85rem;font-weight:600;color:#94a3b8;margin-bottom:16px;">إحصائيات الحضور</div>';
      html += '  <div style="display:flex;justify-content:space-around;align-items:center;">';
      // Present circle
      html += '    <div style="text-align:center;"><div style="width:90px;height:90px;border-radius:50%;border:4px solid var(--color-gold);display:flex;align-items:center;justify-content:center;background:#fffbeb;"><span style="font-size:32px;font-weight:800;color:var(--color-gold);">'+(stats.present||0)+'</span></div><div style="font-size:0.78rem;color:#94a3b8;margin-top:8px;">أيام الحضور</div></div>';
      // Rate circle with progress
      html += '    <div style="text-align:center;"><div style="width:90px;height:90px;border-radius:50%;border:4px solid #e2e8f0;display:flex;align-items:center;justify-content:center;background:#f8fafc;position:relative;"><span style="font-size:28px;font-weight:800;color:var(--color-navy);">'+ratePct+'%</span></div><div style="font-size:0.78rem;color:#94a3b8;margin-top:8px;">نسبة الحضور</div></div>';
      html += '  </div>';
      // Progress bar
      html += '  <div style="margin-top:16px;"><div style="height:8px;background:#f0f2f5;border-radius:4px;overflow:hidden;"><div style="height:100%;width:'+ratePct+'%;background:linear-gradient(90deg,var(--color-navy),var(--color-gold));border-radius:4px;transition:width 0.8s;"></div></div></div>';
      html += '</div>';

      // === 3. SUBSCRIPTION ===
      var subs = me.subscriptions || [];
      if (subs.length > 0) {
        var sub = subs[0], remaining = sub.remainingDays || 0;
        var total = sub.days || 30;
        var usedPct = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
        var rc = remaining > 30 ? '#059669' : (remaining > 7 ? '#f59e0b' : '#ef4444');
        html += '<div style="background:#fff;border-radius:20px;border:1px solid #e9edf2;padding:24px 20px;margin-bottom:18px;">';
        html += '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">';
        html += '    <div style="font-size:1rem;font-weight:700;color:var(--color-navy);">الاشتراك الحالي</div>';
        html += '    <div style="padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;background:'+(sub.status==='نشط'?'#dcfce7':'#fee2e2')+';color:'+(sub.status==='نشط'?'#059669':'#ef4444')+';">'+(sub.status||'نشط')+'</div>';
        html += '  </div>';
        // Remaining days - big number
        html += '  <div style="display:flex;flex-direction:column;align-items:center;padding:18px;border-radius:14px;background:linear-gradient(135deg,#f8fafc,#f1f5f9);margin-bottom:12px;">';
        html += '    <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:6px;">الأيام المتبقية</div>';
        html += '    <div style="font-size:42px;font-weight:900;color:'+rc+';line-height:1;">'+(remaining>0?remaining:'0')+'</div>';
        html += '    <div style="font-size:0.85rem;color:#94a3b8;margin-top:4px;">يوم</div>';
        html += '  </div>';
        // Progress bar
        html += '  <div style="margin-top:4px;"><div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#94a3b8;margin-bottom:6px;"><span>انتهى '+usedPct+'%</span><span>باقي '+(100-usedPct)+'%</span></div>';
        html += '  <div style="height:10px;background:#f0f2f5;border-radius:5px;overflow:hidden;"><div style="height:100%;width:'+usedPct+'%;background:linear-gradient(90deg,'+rc+','+rc+'aa);border-radius:5px;transition:width 0.6s;"></div></div></div>';
        // Dates
        function fmt(d) { if(!d) return '--'; var dt=new Date(d); if(isNaN(dt)) return '--'; return dt.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', { year: 'numeric', month: 'long', day: 'numeric' }); }
        html += '  <div style="display:flex;justify-content:space-between;margin-top:14px;font-size:0.82rem;">';
        html += '    <div style="color:#94a3b8;">تاريخ الانتهاء: <strong style="color:var(--color-navy);">'+fmt(sub.endDate)+'</strong></div>';
        html += '  </div></div>';
      } else {
        html += '<div style="background:#fff;border-radius:20px;border:1px solid #e9edf2;padding:36px 20px;text-align:center;margin-bottom:18px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><div style="font-size:0.95rem;color:#94a3b8;margin-top:12px;">لا يوجد اشتراك نشط</div></div>';
      }

      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = '<div class="card" style="padding:24px;text-align:center;"><div style="font-size:0.9rem;color:var(--danger);">' + (err.message || 'حدث خطأ') + '</div></div>';
    }
  }

  loadDashboard();

  // Load edit modal data
  var editModal = document.getElementById('editStudentModal');
  if (editModal) {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.type === 'attributes' && m.attributeName === 'class' && editModal.classList.contains('active')) {
          loadEditData();
        }
      });
    });
    observer.observe(editModal, { attributes: true });
  }

  var cropper = null;
  var croppedBlob = null;

  async function loadEditData() {
    try {
      var me = await API.get('/api/auth/me');
      var user = me.user || {};
      var form = document.getElementById('editStudentForm');
      if (!form) return;
      var nameInput = form.querySelector('input[name="fullName"]');
      var phoneInput = form.querySelector('input[name="phone"]');
      var parentInput = form.querySelector('input[name="parentPhone"]');
      var preview = document.getElementById('editPhotoPreview');
      var placeholder = document.getElementById('editPhotoPlaceholder');
      if (nameInput) nameInput.value = user.fullName || '';
      if (phoneInput) phoneInput.value = user.phone || '';
      if (parentInput) parentInput.value = user.parentPhone || '';
      if (user.photo && preview && placeholder) {
        preview.src = user.photo;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
      } else if (preview) {
        preview.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
      }
      croppedBlob = null;
    } catch (err) {
      // error handled silently
    }
  }

  // Photo crop
  var photoInput = document.getElementById('editPhotoInput');
  var cropArea = document.getElementById('cropArea');
  var cropImage = document.getElementById('cropImage');
  var preview = document.getElementById('editPhotoPreview');
  var placeholder = document.getElementById('editPhotoPlaceholder');
  var cropConfirm = document.getElementById('cropConfirm');
  var cropCancel = document.getElementById('cropCancel');
  var zoomRange = document.getElementById('cropZoomRange');
  var zoomIn = document.getElementById('cropZoomIn');
  var zoomOut = document.getElementById('cropZoomOut');

  if (photoInput) {
    photoInput.addEventListener('change', function() {
      var file = photoInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        cropImage.src = e.target.result;
        cropImage.onload = function() {
          cropArea.style.display = 'block';
          if (cropper) cropper.destroy();
          cropper = new Cropper(cropImage, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            cropBoxMovable: false,
            cropBoxResizable: false,
            toggleDragModeOnDblclick: false,
            background: false,
            zoomOnWheel: true
          });
        };
      };
      reader.readAsDataURL(file);
    });
  }

  if (zoomRange) {
    zoomRange.addEventListener('input', function() {
      if (cropper) {
        var ratio = parseFloat(this.value);
        cropper.zoomTo(ratio);
      }
    });
  }

  if (zoomIn) {
    zoomIn.addEventListener('click', function() {
      if (cropper) {
        cropper.zoom(0.1);
        updateZoomRange();
      }
    });
  }

  if (zoomOut) {
    zoomOut.addEventListener('click', function() {
      if (cropper) {
        cropper.zoom(-0.1);
        updateZoomRange();
      }
    });
  }

  function updateZoomRange() {
    if (cropper && zoomRange) {
      var data = cropper.getData();
      zoomRange.value = data.scaleX || 1;
    }
  }

  if (cropConfirm) {
    cropConfirm.addEventListener('click', function() {
      if (!cropper) return;
      var canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
      canvas.toBlob(function(blob) {
        croppedBlob = blob;
        var url = URL.createObjectURL(blob);
        if (preview) { preview.src = url; preview.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
        cropArea.style.display = 'none';
        if (cropper) { cropper.destroy(); cropper = null; }
      }, 'image/jpeg', 0.9);
    });
  }

  if (cropCancel) {
    cropCancel.addEventListener('click', function() {
      cropArea.style.display = 'none';
      if (cropper) { cropper.destroy(); cropper = null; }
      photoInput.value = '';
    });
  }

  // Edit form submit
  var editForm = document.getElementById('editStudentForm');
  if (editForm) {
    editForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = editForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'جاري...';
      try {
        var fd = new FormData();
        var nameInput = editForm.querySelector('input[name="fullName"]');
        var phoneInput = editForm.querySelector('input[name="phone"]');
        var parentInput = editForm.querySelector('input[name="parentPhone"]');
        if (nameInput) fd.append('fullName', nameInput.value);
        if (phoneInput) fd.append('phone', phoneInput.value);
        if (parentInput) fd.append('parentPhone', parentInput.value);
        if (croppedBlob) {
          fd.append('photo', croppedBlob, 'profile.jpg');
        }
        await API.formPut('/api/auth/profile', fd);
        Toast.success('تم', 'تم حفظ التعديلات');
        btn.disabled = false;
        btn.textContent = 'حفظ';
        croppedBlob = null;
        Modal.close('editStudentModal');
        loadDashboard();
      } catch (err) {
        Toast.error('خطأ', err.message);
        btn.disabled = false;
        btn.textContent = 'حفظ';
      }
    });
  }
})();