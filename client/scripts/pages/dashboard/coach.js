(function() {
  var container = document.getElementById('coachAttendanceContainer');
  var saveBtn = document.getElementById('saveCoachAttendance');
  var statsEl = document.getElementById('coachStats');
  if (!container) return;

  function getToday() { return Hijri.today(); }

  function displayArabicDate() {
    var el = document.getElementById('coachDateDisplay');
    if (el) el.textContent = Hijri.format(getToday());
  }
  displayArabicDate();

  async function loadStats() {
    try {
      var students = await API.get('/api/students');
      var todayAtt = await API.get('/api/attendance/today');
      var subs = await API.get('/api/subscriptions/summary');
      var doc = document;
      var total = (students.students || []).length;
      var today = todayAtt.count || 0;
      var subsEl = doc.getElementById('coachActiveSubs');
      if (subsEl) subsEl.textContent = (subs.active != null ? subs.active : '—');
      var totalEl = doc.getElementById('coachTotalStudents');
      if (totalEl) totalEl.textContent = total;
      var attEl = doc.getElementById('coachTodayAttendance');
      if (attEl) attEl.textContent = today;
    } catch (e) { console.log('Stats error:', e.message); }
  }

  async function loadAttendance() {
    container.innerHTML = '<div class="skeleton" style="height:48px;margin-bottom:8px;"></div><div class="skeleton" style="height:48px;margin-bottom:8px;"></div><div class="skeleton" style="height:48px;"></div>';
    try {
      var students = await API.get('/api/students');
      var today = getToday();
      var records = [];
      try { var att = await API.get('/api/attendance?date=' + today); records = att.records || []; } catch(e) { records = []; }

      var html = '';
      (students.students || students || []).forEach(function(s) {
        var existing = (records || []).find(function(r) { return r.studentId == s.id; });
        var status = existing ? existing.status : 'غير مسجل';
        html += '<div class="attendance-row" data-student-id="' + s.id + '" style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray-100);">';
        html += '  <div style="flex:1;font-weight:600;">' + s.fullName + '</div>';
        html += '  <div class="attendance-status" style="display:flex;gap:4px;">';
        html += '    <button class="btn btn-sm ' + (status === 'حاضر' ? 'btn-success' : 'btn-ghost') + '" data-status="حاضر">حاضر</button>';
        html += '    <button class="btn btn-sm ' + (status === 'غائب' ? 'btn-danger' : 'btn-ghost') + '" data-status="غائب">غائب</button>';
        html += '    <button class="btn btn-sm ' + (status === 'معذر' ? 'btn-warning' : 'btn-ghost') + '" data-status="معذر">معذر</button>';
        html += '  </div></div>';
      });
      container.innerHTML = html;

      container.querySelectorAll('.attendance-status button').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var parent = this.closest('.attendance-status');
          parent.querySelectorAll('button').forEach(function(b) {
            b.className = 'btn btn-sm btn-ghost';
          });
          this.className = 'btn btn-sm btn-' + (this.dataset.status === 'حاضر' ? 'success' : this.dataset.status === 'غائب' ? 'danger' : 'warning');
        });
      });
    } catch (err) {
      container.innerHTML = '<div class="empty-state"><p>فشل تحميل بيانات الحضور</p></div>';
    }
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async function() {
      var today = getToday();
      var rows = container.querySelectorAll('.attendance-row');
      var records = [];
      rows.forEach(function(row) {
        var activeBtn = row.querySelector('.attendance-status .btn-success, .attendance-status .btn-danger, .attendance-status .btn-warning');
        if (activeBtn) {
          records.push({ studentId: row.dataset.studentId, date: today, status: activeBtn.dataset.status });
        }
      });
      if (records.length === 0) { Toast.warning('تنبيه', 'لم يتم تحديد أي حالة'); return; }
      saveBtn.disabled = true; saveBtn.textContent = 'جاري الحفظ...';
      try {
        await API.post('/api/attendance', { records: records });
        Toast.success('تم', 'تم حفظ الحضور');
      } catch (err) { Toast.error('خطأ', err.message); }
      saveBtn.disabled = false; saveBtn.textContent = 'حفظ الحضور';
    });
  }

  loadStats();
  loadAttendance();
})();
