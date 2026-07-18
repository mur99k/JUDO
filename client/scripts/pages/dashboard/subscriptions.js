(function() {
  var tableBody = document.getElementById('subscriptionsBody');
  var modal = document.getElementById('addSubModal');
  var form = document.getElementById('addSubForm');
  var studentSelect = document.getElementById('subStudent');
  var studentSearch = document.getElementById('subStudentSearch');
  var durationInput = document.getElementById('subDuration');
  var customDurationInput = document.getElementById('subCustomDuration');
  var amountInput = document.getElementById('subAmount');
  var exemptCheck = document.getElementById('subExempt');
  var endDateInput = document.getElementById('subEndDate');
  var endDateHijri = document.getElementById('subEndDateHijri');
  var modalTitle = document.getElementById('addSubTitle');
  var editingId = null;
  var manualDate = false;
  var allStudents = [];

  function todayStr() { var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function calcEnd(startStr, days) { var d=new Date(startStr); d.setDate(d.getDate()+(days||0)); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function formatArabic(dateStr) {
    if (!dateStr) return '--';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  window.toggleCustomSelect = function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    document.querySelectorAll('.custom-select.open').forEach(function(s) {
      if (s.id !== id) s.classList.remove('open');
    });
    el.classList.toggle('open');
  };
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-select')) {
      document.querySelectorAll('.custom-select.open').forEach(function(s) { s.classList.remove('open'); });
    }
  });

  window.selectSubDuration = function(val, text) {
    durationInput.value = val;
    document.getElementById('subDurationText').textContent = text;
    var el = document.getElementById('subDurationSelect');
    el.querySelectorAll('.custom-select-option').forEach(function(opt) {
      opt.classList.remove('active');
      if (opt.getAttribute('data-value') == val) opt.classList.add('active');
    });
    el.classList.remove('open');
    if (val === 'custom') {
      customDurationInput.style.display = 'block';
      customDurationInput.focus();
    } else {
      customDurationInput.style.display = 'none';
    }
    manualDate = false;
    updatePreview();
  };

  function updatePreview() {
    var start = todayStr();
    document.getElementById('subStartDate').value = start;
    if (endDateInput && !manualDate) {
      var days;
      if (durationInput.value === 'custom') {
        days = parseInt(customDurationInput.value) || 0;
      } else {
        days = parseInt(durationInput.value) || 0;
      }
      if (days < 1) days = 30;
      endDateInput.value = calcEnd(start, days);
    }
    if (endDateInput && endDateHijri) {
      endDateHijri.textContent = formatArabic(endDateInput.value);
    }
  }

  if (endDateInput) endDateInput.addEventListener('change', function() { manualDate = true; if (endDateHijri) endDateHijri.textContent = formatArabic(endDateInput.value); });

  if (customDurationInput) customDurationInput.addEventListener('input', function() {
    manualDate = false;
    updatePreview();
  });

  if (exemptCheck) exemptCheck.addEventListener('change', function() {
    if (exemptCheck.checked) {
      amountInput.value = '';
      amountInput.placeholder = 'معفى';
      amountInput.disabled = true;
      amountInput.style.background = '#f1f5f9';
    } else {
      amountInput.value = '0';
      amountInput.placeholder = '';
      amountInput.disabled = false;
      amountInput.style.background = '';
    }
  });

  var exemptCard = document.querySelector('.sub-exempt-card');
  if (exemptCard) exemptCard.addEventListener('click', function() {
    if (exemptCheck) exemptCheck.click();
  });

  if (studentSearch) studentSearch.addEventListener('input', function() {
    var q = studentSearch.value.trim().toLowerCase();
    var opts = studentSelect.querySelectorAll('option');
    for (var i=0; i<opts.length; i++) {
      var opt = opts[i];
      if (!opt.value) { opt.style.display = ''; continue; }
      opt.style.display = opt.text.toLowerCase().includes(q) ? '' : 'none';
    }
  });

  function loadSubscriptions() {
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" style="padding:20px;text-align:center;color:#a0aec0;">جاري التحميل...</td></tr>';
    API.get('/api/subscriptions').then(function(res) {
      if (!res.success) throw new Error(res.error||'فشل');
      renderTable(res.subscriptions||[]);
      updateStats(res.subscriptions||[]);
    }).catch(function(e) { if (tableBody) tableBody.innerHTML='<tr><td colspan="7" style="padding:20px;text-align:center;color:#ef4444;">'+e.message+'</td></tr>'; });
  }

  function updateStats(subs) {
    var active = subs.filter(function(s) { return s.status === 'نشط'; });
    var expiring = active.filter(function(s) { return s.remainingDays <= 7; });
    var revenue = 0;
    for (var i=0; i<subs.length; i++) revenue += parseFloat(subs[i].amount||0);
    var el = document.getElementById('statActiveSubs'); if (el) el.textContent = active.length;
    el = document.getElementById('statExpiring'); if (el) el.textContent = expiring.length;
    el = document.getElementById('statRevenue'); if (el) el.textContent = revenue.toFixed(0) + ' ر.س';
  }

  function renderTable(subs) {
    if (!tableBody) return;
    if (!subs||!subs.length) { tableBody.innerHTML='<tr><td colspan="7" style="padding:30px;text-align:center;color:#a0aec0;">لا توجد اشتراكات</td></tr>'; return; }
    var html='';
    for (var i=0;i<subs.length;i++) {
      var s=subs[i]; var rem=s.remainingDays||0;
      var remCls='tag-success'; if (rem<7) remCls='tag-danger'; else if (rem<=30) remCls='tag-warning';
      var stCls = s.status==='نشط'?'tag-success':(s.status==='موقوف'?'tag-warning':(s.status==='ملغي'?'tag-danger':(s.status==='بانتظار الدفع'?'tag-info':'tag-danger')));
      html+='<tr>'+
        '<td style="font-weight:600;">'+(s.studentName||'')+'</td>'+
        '<td>'+s.days+' يوم</td>'+
        '<td style="color:#718096;">'+formatArabic(s.startDate)+'</td>'+
        '<td style="color:#718096;">'+formatArabic(s.endDate)+'</td>'+
        '<td><span class="tag '+remCls+'">'+(rem>0?rem+' يوم':'منتهي')+'</span></td>'+
        '<td><span class="tag '+stCls+'">'+(s.status||'نشط')+'</span></td>'+
        '<td><div style="display:flex;gap:3px;flex-wrap:wrap;">'+
        acBtn(s.id,'edit','تعديل','#3b82f6','#dbeafe')+
        acBtn(s.id,'renew','تجديد','#059669','#dcfce7')+
        acBtn(s.id,'pause','إيقاف','#f59e0b','#fef3c7')+
        acBtn(s.id,'cancel','إلغاء','#ef4444','#fee2e2')+
        acBtn(s.id,'delete','حذف','#6b7280','#f3f4f6')+
        '</div></td></tr>';
    }
    tableBody.innerHTML=html;
  }

  function acBtn(id,action,label,color,bg) {
    return '<button onclick="subAction('+id+',\''+action+'\')" style="padding:3px 8px;border-radius:5px;border:1px solid '+color+';background:'+bg+';color:'+color+';font-size:0.72rem;cursor:pointer;font-family:var(--font-primary);white-space:nowrap;">'+label+'</button>';
  }

  window.subAction = function(id, action) {
    if (action==='delete') { if (confirm('حذف الاشتراك نهائياً؟')) { API.del('/api/subscriptions/'+id).then(function(r){ loadSubscriptions() }).catch(function(e){alert(e.message)}) } return; }
    if (action==='edit') {
      editingId=id;
      manualDate=true;
      if (modalTitle) modalTitle.textContent='تعديل الاشتراك';
      API.get('/api/subscriptions/'+id).then(function(res) {
        if (!res.success) throw new Error(res.error||'فشل');
        var s=res.subscription||{};
        loadStudentSelect(s.studentId);
        var durLabels = {'30':'شهر','90':'ربع سنوي (90 يوم)','180':'نصف سنة (6 شهور)','365':'سنة'};
        if (durLabels[s.days]) {
          selectSubDuration(s.days, durLabels[s.days]);
        } else {
          selectSubDuration('custom', 'مدة مخصصة');
          if (customDurationInput) customDurationInput.value = s.days;
        }
        if (amountInput) { amountInput.value = s.amount||'0'; amountInput.disabled=false; amountInput.style.background=''; }
        if (exemptCheck) { exemptCheck.checked = false; amountInput.disabled=false; amountInput.style.background=''; }
        document.getElementById('subStartDate').value=s.startDate||todayStr();
        if (endDateInput) { endDateInput.value=s.endDate||calcEnd(s.startDate||todayStr(), s.days||30); if (endDateHijri) endDateHijri.textContent = formatArabic(endDateInput.value); }
        if (modal) modal.classList.add('active');
      }).catch(function(e){alert(e.message)});
      return;
    }
    var newStatus = action==='renew'?'نشط':(action==='pause'?'موقوف':'ملغي');
    var msg = 'تأكيد '+(action==='renew'?'التجديد':(action==='pause'?'الإيقاف':'الإلغاء'));
    if (!confirm(msg+'؟')) return;
    var data = { status: newStatus };
    if (action==='renew') {
      var days = parseInt(prompt('المدة بالأيام:', '30'))||30;
      data.startDate = todayStr();
      data.endDate = calcEnd(data.startDate, days);
      data.days = days;
    }
    API.put('/api/subscriptions/'+id, data).then(function(r) {
      if (!r.success) throw new Error(r.error||'فشل');
      if (typeof Toast!=='undefined') Toast.success('تم','تم بنجاح');
      loadSubscriptions();
    }).catch(function(e){alert(e.message)});
  };

  function showAddForm() {
    editingId=null;
    manualDate=false;
    if (modalTitle) modalTitle.textContent='إضافة اشتراك';
    if (form) form.reset();
    document.getElementById('subStartDate').value='';
    if (endDateInput) endDateInput.value='';
    if (endDateHijri) endDateHijri.textContent='';
    selectSubDuration(30, 'شهر');
    if (customDurationInput) { customDurationInput.value = ''; customDurationInput.style.display = 'none'; }
    if (amountInput) { amountInput.value = '0'; amountInput.disabled = false; amountInput.style.background = ''; }
    if (exemptCheck) exemptCheck.checked = false;
    if (studentSearch) studentSearch.value = '';
    updatePreview();
    loadStudentSelect();
    if (modal) modal.classList.add('active');
  }

  function loadStudentSelect(selectedId) {
    if (!studentSelect) return;
    API.get('/api/students').then(function(r) {
      if (!r.success) return;
      allStudents = r.students||[];
      var h='<option value="">اختر طالب...</option>';
      for (var i=0;i<allStudents.length;i++) h+='<option value="'+allStudents[i].id+'"'+(allStudents[i].id===selectedId?' selected':'')+'>'+allStudents[i].fullName+'</option>';
      studentSelect.innerHTML=h;
    });
  }

  var submitBtn = document.getElementById('saveSubBtn');
  if (submitBtn) submitBtn.addEventListener('click', function() {
    var data={}, fields=form.querySelectorAll('input,select');
    for (var i=0;i<fields.length;i++) { if (fields[i].name) data[fields[i].name]=fields[i].value; }
    data.startDate = todayStr();

    var dur;
    if (durationInput.value === 'custom') {
      dur = parseInt(customDurationInput && customDurationInput.value) || 0;
    } else {
      dur = parseInt(durationInput.value) || 0;
    }
    data.days = dur || 30;
    data.type = data.duration || 'عادي';

    if (endDateInput && endDateInput.value) {
      data.endDate = endDateInput.value;
    } else {
      data.endDate = calcEnd(data.startDate, data.days);
    }

    if (parseInt(data.days) < 1) data.days = 30;
    if (!data.studentId) { alert('اختر طالباً'); return; }

    if (exemptCheck && exemptCheck.checked) {
      data.amount = '0';
      data.notes = 'إعفاء كامل من رسوم الاشتراك';
      data.paymentMethod = 'إعفاء';
    }

    var self=this;
    self.disabled=true; self.textContent='جاري...';
    var p = editingId ? API.put('/api/subscriptions/'+editingId, data) : API.post('/api/subscriptions', data);
    p.then(function(r) {
      if (!r.success) throw new Error(r.error||'فشل');
      if (modal) modal.classList.remove('active');
      loadSubscriptions();
    }).catch(function(e){alert(e.message)}).finally(function(){self.disabled=false;self.textContent='حفظ الاشتراك'});
  });

  var addSubBtn = document.getElementById('addSubBtn');
  if (addSubBtn) addSubBtn.addEventListener('click', showAddForm);
  if (document.getElementById('subscriptionsBody')) loadSubscriptions();
})();