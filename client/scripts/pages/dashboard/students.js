(function() {
  var tableBody = document.getElementById('studentsBody');
  var searchInput = document.getElementById('searchInput');
  var statusFilter = document.getElementById('statusFilter');
  var categoryFilter = document.getElementById('categoryFilter');
  var addBtn = document.getElementById('addStudentBtn');
  var addModal = document.getElementById('addStudentModal');
  var addForm = document.getElementById('addStudentForm');
  var editModal = document.getElementById('editStudentModal');
  var editForm = document.getElementById('editStudentForm');
  var currentStatus = '';
  var currentCategory = '';
  var searchTimer = null;
  var editingId = null;
  var isAdmin = window.__userRole === 'admin';

  // Custom Select Functions
  window.toggleCustomSelect = function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.getAttribute('data-disabled') === 'true') return;
    // Close all other selects
    document.querySelectorAll('.custom-select.open').forEach(function(s) {
      if (s.id !== id) s.classList.remove('open');
    });
    el.classList.toggle('open');
  };

  window.selectOption = function(selectId, value, text) {
    var el = document.getElementById(selectId);
    if (!el) return;
    var hiddenInput = el.querySelector('input[type="hidden"]');
    var trigger = el.querySelector('.custom-select-text');
    if (hiddenInput) hiddenInput.value = value;
    if (trigger) trigger.textContent = text;
    el.querySelectorAll('.custom-select-option').forEach(function(opt) {
      opt.classList.remove('active');
      if (opt.getAttribute('data-value') === value) opt.classList.add('active');
    });
    el.classList.remove('open');
  };

  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-select')) {
      document.querySelectorAll('.custom-select.open').forEach(function(s) {
        s.classList.remove('open');
      });
    }
  });

  // Filter dropdown selection
  window.selectFilterOption = function(selectId, value, text) {
    var el = document.getElementById(selectId);
    if (!el) return;
    var hiddenInput = el.querySelector('input[type="hidden"]');
    var trigger = el.querySelector('.custom-select-text');
    if (hiddenInput) hiddenInput.value = value;
    if (trigger) trigger.textContent = text;
    el.querySelectorAll('.custom-select-option').forEach(function(opt) {
      opt.classList.remove('active');
      if (opt.getAttribute('data-value') === value) opt.classList.add('active');
    });
    el.classList.remove('open');
    // Update filter and reload
    if (selectId === 'categoryFilterSelect') {
      currentCategory = value || '';
      loadStudents();
    } else if (selectId === 'statusFilterSelect') {
      // Map to Arabic values used in DB
      var arabicStatus = value === 'active' ? 'نشط' : value === 'inactive' ? 'غير نشط' : '';
      currentStatus = arabicStatus;
      loadStudents();
    }
  };

  function loadStudents() {
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted);">جاري التحميل...</td></tr>';
    var filters = {};
    if (searchInput && searchInput.value) filters.search = searchInput.value;
    if (currentStatus) filters.status = currentStatus;
    if (currentCategory) filters.category = currentCategory;
    var params = [];
    if (filters.search) params.push('search=' + encodeURIComponent(filters.search));
    if (filters.status) params.push('status=' + encodeURIComponent(filters.status));
    if (filters.category) params.push('category=' + encodeURIComponent(filters.category));
    var qs = params.length ? '?' + params.join('&') : '';
    API.get('/api/students' + qs).then(function(res) {
      if (!res.success) throw new Error(res.error || 'فشل');
      renderTable(res.students || []);
    }).catch(function(err) {
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--danger);">' + err.message + '</td></tr>';
    });
  }

  var catColors = {
    'براعم': {bg:'#e8f5e9',color:'#2e7d32'},
    'أشبال': {bg:'#e3f2fd',color:'#1565c0'},
    'ناشئين': {bg:'#fff3e0',color:'#e65100'},
    'شباب': {bg:'#fce4ec',color:'#c62828'},
    'فريق أول': {bg:'#f3e5f5',color:'#6a1b9a'}
  };

  function catTag(category) {
    if (!category) return '<span style="color:#cbd5e1;">—</span>';
    var c = catColors[category] || {bg:'#f1f5f9',color:'#64748b'};
    return '<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:0.73rem;font-weight:600;background:'+c.bg+';color:'+c.color+';">'+category+'</span>';
  }

  function renderTable(students) {
    if (!tableBody) return;
    if (!students || !students.length) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#a0aec0;font-size:0.9rem;">لا يوجد طلاب</td></tr>';
      return;
    }
    var html = '';
    for (var i = 0; i < students.length; i++) {
      var s = students[i];
      var statusClass = 'tag-success';
      if (s.status === 'غير نشط') statusClass = 'tag-danger';
      var avatarHtml = s.photo
        ? '<img src="' + s.photo + '" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.onerror=null;this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
          '<div style="width:30px;height:30px;border-radius:50%;background:var(--color-navy);color:var(--color-gold-light);display:none;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;flex-shrink:0;">' + (s.fullName ? s.fullName.charAt(0) : '?') + '</div>'
        : '<div style="width:30px;height:30px;border-radius:50%;background:var(--color-navy);color:var(--color-gold-light);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;flex-shrink:0;">' + (s.fullName ? s.fullName.charAt(0) : '?') + '</div>';
      html += '<tr>' +
        '<td><div style="display:flex;align-items:center;gap:8px;">' + avatarHtml + '<span style="font-weight:600;">' + (s.fullName || '') + '</span></div></td>' +
        '<td>' + catTag(s.category) + '</td>' +
        '<td style="color:#718096;">' + (s.nationalId || '') + '</td>' +
        '<td style="color:#718096;">' + (s.age || '') + '</td>' +
        '<td style="direction:ltr;text-align:right;color:#718096;">' + (s.phone || '') + '</td>' +
        '<td><span class="tag ' + statusClass + '">' + (s.status || '') + '</span></td>' +
        '<td><div style="display:flex;gap:4px;">' +
        '<button onclick="window.open(\'/dashboard/attendance/student/' + s.id + '\',\'_self\')" style="padding:4px 10px;border-radius:6px;border:1px solid #dbeafe;background:#e8f0fe;color:var(--color-navy);font-size:0.75rem;cursor:pointer;font-family:var(--font-primary);font-weight:500;">تقرير</button> ' +
        '<button onclick="showEditStudent(' + s.id + ')" style="padding:4px 10px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;color:var(--color-navy);font-size:0.75rem;cursor:pointer;font-family:var(--font-primary);font-weight:500;">تعديل</button> ' +
        (isAdmin ? '<button onclick="if(confirm(\'حذف الطالب؟\')){API.del(\'/api/students/' + s.id + '\').then(function(){loadStudents()}).catch(function(e){alert(e.message)})}" style="padding:4px 10px;border-radius:6px;border:1px solid #fee2e2;background:#fff;color:#ef4444;font-size:0.75rem;cursor:pointer;font-family:var(--font-primary);font-weight:500;">حذف</button>' : '') +
        '</div></td></tr>';
    }
    tableBody.innerHTML = html;
  }

  window.showEditStudent = function(id) {
    editingId = id;
    editCroppedBlob = null;
    API.get('/api/students/' + id).then(function(res) {
      if (!res.success) throw new Error(res.error || 'فشل');
      var s = res.student || {};
      var fields = ['editFullName', 'editNationalId', 'editAge', 'editPhone', 'editParentPhone'];
      var dataFields = ['fullName', 'nationalId', 'age', 'phone', 'parentPhone'];
      for (var i = 0; i < fields.length; i++) {
        var el = document.getElementById(fields[i]);
        if (el) el.value = s[dataFields[i]] || '';
      }
      // Set category in custom select
      var catValue = s.category || '';
      var catText = catValue || 'بدون تصنيف';
      var catHidden = document.getElementById('editCategoryValue');
      var catTrigger = document.querySelector('#editCategorySelect .custom-select-text');
      if (catHidden) catHidden.value = catValue;
      if (catTrigger) catTrigger.textContent = catText;
      document.querySelectorAll('#editCategorySelect .custom-select-option').forEach(function(opt) {
        opt.classList.remove('active');
        if (opt.getAttribute('data-value') === catValue) opt.classList.add('active');
      });
      document.getElementById('editStudentId').value = id;
      // Load photo preview
      var preview = document.getElementById('editPhotoPreview');
      var placeholder = document.getElementById('editPhotoPlaceholder');
      if (s.photo && preview && placeholder) {
        preview.src = s.photo;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        preview.onerror = function(){ this.style.display='none'; if(placeholder) placeholder.style.display='flex'; };
      } else if (preview) {
        preview.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
      }
      if (editModal) editModal.classList.add('active');
    }).catch(function(err) { alert(err.message); });
  };

  if (addBtn) {
    addBtn.addEventListener('click', function() {
      editingId = null;
      if (addForm) addForm.reset();
      if (addModal) addModal.classList.add('active');
    });
  }

  if (addForm) {
    addForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var fields = addForm.querySelectorAll('input,select');
      var data = {};
      for (var i = 0; i < fields.length; i++) {
        if (fields[i].name) data[fields[i].name] = fields[i].value;
      }
      API.post('/api/students', data).then(function(res) {
        if (!res.success) throw new Error(res.error || 'فشل');
        if (addModal) addModal.classList.remove('active');
        loadStudents();
      }).catch(function(err) {
        alert(err.message);
      });
    });
  }

  // Photo cropper for edit modal
  var editCropper = null;
  var editCroppedBlob = null;
  var editPhotoInput = document.getElementById('editPhotoInput');
  var editCropArea = document.getElementById('editCropArea');
  var editCropImage = document.getElementById('editCropImage');
  var editPreview = document.getElementById('editPhotoPreview');
  var editPlaceholder = document.getElementById('editPhotoPlaceholder');
  var editCropConfirm = document.getElementById('editCropConfirm');
  var editCropCancel = document.getElementById('editCropCancel');
  var editZoomRange = document.getElementById('editCropZoomRange');
  var editZoomIn = document.getElementById('editCropZoomIn');
  var editZoomOut = document.getElementById('editCropZoomOut');

  if (editPhotoInput) {
    editPhotoInput.addEventListener('change', function() {
      var file = editPhotoInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        editCropImage.src = e.target.result;
        editCropImage.onload = function() {
          editCropArea.style.display = 'block';
          if (editCropper) editCropper.destroy();
          editCropper = new Cropper(editCropImage, {
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

  if (editZoomRange) {
    editZoomRange.addEventListener('input', function() {
      if (editCropper) editCropper.zoomTo(parseFloat(this.value));
    });
  }
  if (editZoomIn) {
    editZoomIn.addEventListener('click', function() {
      if (editCropper) { editCropper.zoom(0.1); if (editZoomRange) editZoomRange.value = editCropper.getData().scaleX || 1; }
    });
  }
  if (editZoomOut) {
    editZoomOut.addEventListener('click', function() {
      if (editCropper) { editCropper.zoom(-0.1); if (editZoomRange) editZoomRange.value = editCropper.getData().scaleX || 1; }
    });
  }
  if (editCropConfirm) {
    editCropConfirm.addEventListener('click', function() {
      if (!editCropper) return;
      var canvas = editCropper.getCroppedCanvas({ width: 300, height: 300 });
      canvas.toBlob(function(blob) {
        editCroppedBlob = blob;
        var url = URL.createObjectURL(blob);
        if (editPreview) { editPreview.src = url; editPreview.style.display = 'block'; }
        if (editPlaceholder) editPlaceholder.style.display = 'none';
        editCropArea.style.display = 'none';
        if (editCropper) { editCropper.destroy(); editCropper = null; }
      }, 'image/jpeg', 0.9);
    });
  }
  if (editCropCancel) {
    editCropCancel.addEventListener('click', function() {
      editCropArea.style.display = 'none';
      if (editCropper) { editCropper.destroy(); editCropper = null; }
      editPhotoInput.value = '';
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = editForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'جاري...';
      var id = document.getElementById('editStudentId').value;
      var fd = new FormData();
      var nameInput = editForm.querySelector('input[name="fullName"]');
      var nationalInput = editForm.querySelector('input[name="nationalId"]');
      var ageInput = editForm.querySelector('input[name="age"]');
      var phoneInput = editForm.querySelector('input[name="phone"]');
      var parentInput = editForm.querySelector('input[name="parentPhone"]');
      var catInput = editForm.querySelector('input[name="category"]');
      if (nameInput) fd.append('fullName', nameInput.value);
      if (nationalInput) fd.append('nationalId', nationalInput.value);
      if (ageInput) fd.append('age', ageInput.value);
      if (phoneInput) fd.append('phone', phoneInput.value);
      if (parentInput) fd.append('parentPhone', parentInput.value);
      if (catInput) fd.append('category', catInput.value);
      if (editCroppedBlob) fd.append('photo', editCroppedBlob, 'profile.jpg');
      API.formPut('/api/students/' + id, fd).then(function(res) {
        if (!res.success) throw new Error(res.error || 'فشل');
        if (editModal) editModal.classList.remove('active');
        editCroppedBlob = null;
        loadStudents();
        btn.disabled = false;
        btn.textContent = 'تحديث';
      }).catch(function(err) {
        alert(err.message);
        btn.disabled = false;
        btn.textContent = 'تحديث';
      });
    });
  }

  loadStudents();
})();

function resetStudentPassword() {
  var id = document.getElementById('editStudentId').value;
  var name = document.getElementById('editFullName').value;
  if (!confirm('إعادة تعيين كلمة المرور للطالب "' + name + '" إلى "' + id + '"؟')) return;
  API.post('/api/students/' + id + '/reset-password', {}).then(function(res) {
    if (!res.success) throw new Error(res.error || 'فشل');
    Toast.success('تم', 'تم إعادة تعيين كلمة المرور إلى ' + id);
  }).catch(function(err) {
    Toast.error('خطأ', err.message);
  });
}