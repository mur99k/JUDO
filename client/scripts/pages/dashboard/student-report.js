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

  function gregorianToHijri(date) {
    // Umalqura algorithm (accurate for Saudi Arabia)
    var gy = date.getFullYear();
    var gm = date.getMonth() + 1;
    var gd = date.getDate();
    
    // Convert to Julian Day
    var jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4) +
             Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12) -
             Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4) +
             gd - 32075;
    
    // Umalqura epoch: 1 Muharram 1 AH = July 16, 622 CE (Julian Day 1948440)
    var l = jd - 1948440 + 10632;
    var n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    var j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
            Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
            Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    var m = Math.floor((24 * l) / 709);
    var d = l - Math.floor((709 * m) / 24);
    var y = 30 * n + j - 30;
    
    return { year: y, month: m, day: d };
  }

  function hijriToGregorian(hYear, hMonth, hDay) {
    var jd = Math.floor((11*hYear+3)/30)+354*hYear+30*hMonth-Math.floor((hMonth-1)/2)+hDay+1948440-385;
    var l=jd+68569, n=Math.floor(4*l/146097), l2=l-Math.floor((146097*n+3)/4);
    var i=Math.floor(4000*(l2+1)/1461001), l3=l2-Math.floor(1461*i/4)+31;
    var j=Math.floor(80*l3/2447), day=l3-Math.floor(2447*j/80);
    var l4=Math.floor(j/11), month=j+2-12*l4, year=100*(n-49)+i+l4;
    return new Date(year, month-1, day);
  }

  function formatHijri(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('ar-SA-u-ca-islamic-umalqura',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  }

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
    var now = new Date();
    var currentHijri = gregorianToHijri(now);
    var currentYear = currentHijri.year;
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
    var startDate = hijriToGregorian(hYear, hMonth, 1);
    var endDate = hijriToGregorian(hYear, hMonth + 1, 0);
    return 'startDate=' + startDate.toISOString().split('T')[0] + '&endDate=' + endDate.toISOString().split('T')[0];
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
    var startDate = hijriToGregorian(hYear, hMonth, 1);
    var endDate = hijriToGregorian(hYear, hMonth + 1, 0);
    var daysInHijriMonth = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    document.getElementById('srPresent').textContent = data.present||0;
    document.getElementById('srAbsent').textContent = data.absent||0;
    document.getElementById('srExcused').textContent = data.excused||0;
    document.getElementById('srRate').textContent = (data.rate||0)+'%';
    document.getElementById('srMonthLabel').textContent = HIJRI_MONTHS[hMonth-1] + ' ' + hYear + ' هـ';

    var recMap = {};
    (data.records||[]).forEach(function(r) { recMap[r.date] = r; });

    var html = '';
    for (var d = 1; d <= daysInHijriMonth; d++) {
      var gDate = hijriToGregorian(hYear, hMonth, d);
      var dateStr = gDate.getFullYear()+'-'+pad(gDate.getMonth()+1)+'-'+pad(gDate.getDate());
      var rec = recMap[dateStr];
      var status = rec ? rec.status : null;
      var cls = status === 'حاضر' ? 'present' : status === 'غائب' ? 'absent' : status === 'معذر' ? 'excused' : 'none';
      var label = status || '—';
      html += '<tr class="sr-day-row">'+
        '<td class="sr-day-num">'+d+'</td>'+
        '<td class="sr-day-date">'+formatHijri(dateStr)+'</td>'+
        '<td class="sr-day-status '+cls+'">'+label+'</td>'+
        '</tr>';
    }
    tableBody.innerHTML = html;
  }

  // Set current Hijri month as default BEFORE init
  var now = new Date();
  var currentHijri = gregorianToHijri(now);
  hijriMonthInput.value = currentHijri.month;
  hijriYearInput.value = currentHijri.year;
  hijriMonthText.textContent = HIJRI_MONTHS[currentHijri.month - 1];
  hijriYearText.textContent = currentHijri.year + ' هـ';

  initMonths();
  initYears();
  load();
})();
