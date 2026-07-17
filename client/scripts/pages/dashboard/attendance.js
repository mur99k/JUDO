(function() {
  var tableBody = document.getElementById('attendanceBody');
  var dateInput = document.getElementById('attendanceDate');
  var arabicDateEl = document.getElementById('arabicDate');
  var saveBtn = document.getElementById('saveAttendanceBtn');
  var allStudents = [];

  function today() { var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function fmtAr(ds) {
    if(!ds) return '';
    var d=new Date(ds);
    if(isNaN(d.getTime())) return ds;
    return d.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function load() {
    var date = dateInput ? dateInput.value : today(); if(!date) date=today();
    if(arabicDateEl) arabicDateEl.textContent = fmtAr(date);
    if(tableBody) tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#a0aec0;">جاري التحميل...</td></tr>';
    API.get('/api/attendance?date='+date).then(function(r){
      if(!r.success) throw new Error(r.error||'فشل');
      allStudents = r.records || [];
      render();
    }).catch(function(e){
      if(tableBody) tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#ef4444;">خطأ: '+e.message+'</td></tr>';
    });
  }

  function render() {
    if(!tableBody) return;
    if(!allStudents.length) { tableBody.innerHTML='<tr><td colspan="4" style="text-align:center;padding:30px;color:#a0aec0;">لا يوجد طلاب مسجلين</td></tr>'; updateCounters(); return; }
    var rows=''; var pres=0, abs=0, exc=0;
    for (var i=0; i<allStudents.length; i++) {
      var s=allStudents[i];
      var noSet = !s.status || s.status==='null';
      var st = noSet ? 'حاضر' : s.status;
      if(st==='حاضر') pres++; else if(st==='غائب') abs++; else if(st==='معذر') exc++;
      rows += '<tr>'+
        '<td style="color:#718096;width:36px;">'+(i+1)+'</td>'+
        '<td style="font-weight:600;">'+(s.studentName||'')+'</td>'+
        '<td><div class="att-row-btns" data-sid="'+s.studentId+'">'+
          attBtn(st==='حاضر','حاضر','#059669')+
          attBtn(st==='غائب','غائب','#dc2626')+
          attBtn(st==='معذر','معذر','#b8860b')+
        '</div></td>'+
        '<td style="text-align:center;"><a href="/dashboard/attendance/student/'+s.studentId+'" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:var(--color-blue-soft);color:var(--color-navy);text-decoration:none;font-size:0.8rem;" title="تقرير الطالب">📋</a></td>'+
        '</tr>';
    }
    tableBody.innerHTML = rows;
    updateCounters(pres,abs,exc,allStudents.length);
  }

  function attBtn(active, label, color) {
    var bgColor = active ? color : '#f0f2f5';
    var txtColor = active ? '#fff' : '#718096';
    var bdColor = active ? color : '#e2e8f0';
    return '<button onclick="toggleAtt(this)" style="'+
      'background:'+bgColor+';color:'+txtColor+';'+
      'padding:5px 12px;border-radius:6px;border:1px solid '+bdColor+
      ';font-size:0.78rem;cursor:pointer;font-family:var(--font-primary);margin:0 2px;">'+label+'</button>';
  }

  window.toggleAtt = function(btn) {
    var rowDiv = btn.parentElement;
    var allBtns = rowDiv.querySelectorAll('button');
    var label = btn.textContent.trim();
    var color = label==='حاضر' ? '#059669' : (label==='غائب' ? '#dc2626' : '#b8860b');
    for(var i=0; i<allBtns.length; i++) {
      allBtns[i].style.background='#f0f2f5';
      allBtns[i].style.color='#718096';
      allBtns[i].style.borderColor='#e2e8f0';
    }
    btn.style.background=color;
    btn.style.color='#fff';
    btn.style.borderColor=color;
    recalcStats();
  };

  function recalcStats() {
    var pres=0, abs=0, exc=0;
    var rows = tableBody ? tableBody.querySelectorAll('tr') : [];
    for(var i=0; i<rows.length; i++) {
      var btns = rows[i].querySelectorAll('.att-row-btns button');
      if(btns.length < 3) continue;
      var activeLabel = '';
      for(var j=0; j<btns.length; j++) {
        if(btns[j].style.background && btns[j].style.background !== '' && btns[j].style.background !== 'rgb(240, 242, 245)') {
          activeLabel = btns[j].textContent.trim();
        }
      }
      if(activeLabel==='حاضر') pres++;
      else if(activeLabel==='غائب') abs++;
      else if(activeLabel==='معذر') exc++;
    }
    updateCounters(pres,abs,exc,allStudents.length);
  }

  function updateCounters(pres,abs,exc,tot) {
    var e=document.getElementById('statPresent'); if(e) e.textContent=pres||0;
    e=document.getElementById('statAbsent'); if(e) e.textContent=abs||0;
    e=document.getElementById('statExcused'); if(e) e.textContent=exc||0;
    e=document.getElementById('statTotal'); if(e) e.textContent=tot||allStudents.length;
  }

  if(saveBtn) {
    saveBtn.addEventListener('click', function(){
      var date = dateInput ? dateInput.value : today();
      var rows = tableBody ? tableBody.querySelectorAll('tr') : [];
      var records = [];
      for(var i=0; i<rows.length; i++) {
        var div = rows[i].querySelector('.att-row-btns');
        if(!div) continue;
        var sid = parseInt(div.getAttribute('data-sid'));
        var btns = div.querySelectorAll('button');
        if(btns.length < 3) continue;
        var status = 'معذر';
        for(var k=0; k<btns.length; k++) {
          if(btns[k].style.background && btns[k].style.background !== '' && btns[k].style.background !== 'rgb(240, 242, 245)') {
            status = btns[k].textContent.trim();
          }
        }
        records.push({studentId:sid, date:date, status:status});
      }
      if(!records.length) { alert('لا يوجد طلاب'); return; }
      saveBtn.disabled=true; saveBtn.textContent='جاري الحفظ...';
      API.post('/api/attendance',{records:records}).then(function(r){
        if(!r.success) throw new Error(r.error||'فشل');
        if(typeof Toast!=='undefined') Toast.success('تم','تم حفظ الحضور');
        load();
      }).catch(function(e){alert(e.message)}).finally(function(){saveBtn.disabled=false;saveBtn.textContent='حفظ الحضور'});
    });
  }

  if(dateInput) { dateInput.value=today(); dateInput.addEventListener('change',load); }
  if(document.getElementById('attendanceBody')) load();
})();