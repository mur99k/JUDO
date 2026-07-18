(function() {
  var studentId = window.__studentId;
  if (!studentId) { return; }

  var hijriMonthInput = document.getElementById('srHijriMonth');
  var hijriYearInput = document.getElementById('srHijriYear');
  var tableBody = document.getElementById('srTableBody');
  var hijriMonthText = document.getElementById('srHijriMonthText');
  var hijriYearText = document.getElementById('srHijriYearText');
  var hijriMonthOptions = document.getElementById('srHijriMonthOptions');
  var hijriYearOptions = document.getElementById('srHijriYearOptions');

  const HIJRI_MONTHS = ['محرم','صفر','ربيع الأول','ربيع الثاني','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];

  function pad(n) { return n<10?'0'+n:''+n; }

  // Build month options
  function initMonths() {
    if (!hijriMonthOptions) return;
    var html = '';
    HIJRI_MONTHS.forEach(function(name, i) {
      var val = i + 1;
      var active = val === parseInt(hijriMonthInput.value) ? ' active' : '';
      html += '<div class="custom-select-option'+active+'" data-value="'+val+'" onclick="selectReportMonth('+val+', \''+name+'\')">'+name+'</div>';
    });
    hijriMonthOptions.innerHTML = html;
  }

  // Build year options - from 1448 (start of registration) to 10 years ahead
  function initYears() {
    if (!hijriYearOptions) return;
    var t = Hijri.parse(Hijri.today());
    var currentYear = t.hy;
    var html = '';
    for (var y = 1448; y <= currentYear + 10; y++) {
      var active = y === parseInt(hijriYearInput.value) ? ' active' : '';
      html += '<div class="custom-select-option'+active+'" data-value="'+y+'" onclick="selectReportYear('+y+')">'+y+' هـ</div>';
    }
    hijriYearOptions.innerHTML = html;
  }

  window.selectReportMonth = function(val, name) {
    hijriMonthInput.value = val;
    hijriMonthText.textContent = name;
    // Update active states
    var opts = hijriMonthOptions.querySelectorAll('.custom-select-option');
    opts.forEach(function(o){ o.classList.remove('active'); if(parseInt(o.dataset.value)===val) o.classList.add('active'); });
    document.getElementById('srHijriMonthSelect').classList.remove('open');
    load();
  };

  window.selectReportYear = function(val) {
    hijriYearInput.value = val;
    hijriYearText.textContent = val + ' هـ';
    var opts = hijriYearOptions.querySelectorAll('.custom-select-option');
    opts.forEach(function(o){ o.classList.remove('active'); if(parseInt(o.dataset.value)===val) o.classList.add('active'); });
    document.getElementById('srHijriYearSelect').classList.remove('open');
    load();
  };

  window.toggleCustomSelect = function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var wasOpen = el.classList.contains('open');
    // Close all
    document.querySelectorAll('.custom-select.open').forEach(function(s){ s.classList.remove('open'); });
    if (!wasOpen) el.classList.add('open');
  };

  // Close on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-select')) {
      document.querySelectorAll('.custom-select.open').forEach(function(s){ s.classList.remove('open'); });
    }
  });

  function getParams() {
    var hMonth = parseInt(hijriMonthInput.value) || 1;
    var hYear = parseInt(hijriYearInput.value) || 1447;
    var dim = Hijri.daysInMonth(hYear, hMonth);
    var startDate = hYear + '-' + pad(hMonth) + '-01';
    var endDate = hYear + '-' + pad(hMonth) + '-' + pad(dim);
    return 'startDate=' + startDate + '&endDate=' + endDate;
  }

  async function load() {
    if (!studentId) return;
    var params = getParams();
    tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:30px;color:#a0aec0;">جاري التحميل...</td></tr>';
    try {
      var r = await API.get('/api/attendance/student/'+studentId+'/report?'+params);
      if (!r.success) throw new Error(r.error||'فشل');
      renderDaily(r);
      try {
        var student = await API.get('/api/students/'+studentId);
        if (student.success && student.student) {
          document.getElementById('srStudentName').textContent = student.student.fullName;
        }
      } catch(sErr) { console.log(sErr); }
    } catch(e) {
      tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:30px;color:#ef4444;">خطأ: '+e.message+'</td></tr>';
    }
  }

  function renderDaily(data) {
    var hMonth = parseInt(hijriMonthInput.value) || 1;
    var hYear = parseInt(hijriYearInput.value) || 1447;
    var dim = Hijri.daysInMonth(hYear, hMonth);

    document.getElementById('srPresent').textContent = data.present||0;
    document.getElementById('srAbsent').textContent = data.absent||0;
    document.getElementById('srExcused').textContent = data.excused||0;
    document.getElementById('srRate').textContent = (data.rate||0)+'%';
    document.getElementById('srMonthLabel').textContent = HIJRI_MONTHS[hMonth-1] + ' ' + hYear + ' هـ';

    var recMap = {};
    (data.records||[]).forEach(function(r) { recMap[r.date] = r; });

    var html = '';
    for (var d = 1; d <= dim; d++) {
      var dateStr = hYear + '-' + pad(hMonth) + '-' + pad(d);
      var rec = recMap[dateStr];
      var status = rec ? rec.status : null;
      var cls = status === 'حاضر' ? 'present' : status === 'غائب' ? 'absent' : status === 'معذر' ? 'excused' : 'none';
      var label = status || '—';
      html += '<tr class="sr-day-row">'+
        '<td class="sr-day-num">'+d+'</td>'+
        '<td class="sr-day-date">'+ Hijri.format(dateStr) +'</td>'+
        '<td class="sr-day-status '+cls+'">'+label+'</td>'+
        '</tr>';
    }
    tableBody.innerHTML = html;
  }

  // Set current Hijri month as default BEFORE init
  var t = Hijri.parse(Hijri.today());
  hijriMonthInput.value = t.hm;
  hijriYearInput.value = t.hy;
  hijriMonthText.textContent = HIJRI_MONTHS[t.hm - 1];
  hijriYearText.textContent = t.hy + ' هـ';

  initMonths();
  initYears();
  load();
})();
