(function() {
  var ids = {
    totalStudents: document.getElementById('statTotalStudents'),
    activeSubs: document.getElementById('statActiveSubs'),
    coaches: document.getElementById('statCoaches'),
    todayAtt: document.getElementById('statTodayAttendance'),
    recentList: document.getElementById('recentStudentsList'),
    alertsList: document.getElementById('alertsList')
  };
  var isAdmin = window.__userRole === 'admin';

  async function loadOverview() {
    try {
      var calls = [API.get('/api/students'), API.get('/api/attendance/today')];
      if (isAdmin) {
        calls.push(API.get('/api/reports/dashboard'));
        calls.push(API.get('/api/subscriptions'));
      }
      var results = await Promise.all(calls);
      var studentsRes = results[0];
      var todayRes = results[1];
      var dash = isAdmin ? (results[2] || {}) : {};
      var subs = isAdmin ? (results[3] || {}).subscriptions || [] : [];

      var students = studentsRes.students || [];

      if (ids.totalStudents) ids.totalStudents.textContent = dash.totalStudents || students.length || 0;
      if (ids.activeSubs) ids.activeSubs.textContent = dash.activeSubscriptions || 0;
      if (ids.coaches) ids.coaches.textContent = dash.totalCoaches || 0;
      if (ids.todayAtt) ids.todayAtt.textContent = (todayRes && todayRes.count) || 0;

      if (ids.recentList && students.length) {
        var recent = students.slice(0, 5);
        var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
        for (var i = 0; i < recent.length; i++) {
          var s = recent[i];
          html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:#f8fafc;">';
          html += '  <div style="width:32px;height:32px;border-radius:50%;background:var(--color-navy);color:var(--color-gold-light);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;">' + (s.fullName ? s.fullName.charAt(0) : '?') + '</div>';
          html += '  <div style="flex:1;"><div style="font-weight:600;font-size:0.88rem;color:var(--color-navy);">' + (s.fullName || '') + '</div><div style="font-size:0.75rem;color:#718096;">' + (s.nationalId || '') + '</div></div>';
          html += '  <span class="tag tag-success">' + (s.status || 'نشط') + '</span>';
          html += '</div>';
        }
        html += '</div>';
        ids.recentList.innerHTML = html;
      } else if (ids.recentList) {
        ids.recentList.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg><h3>لا يوجد طلاب</h3><p>سجل أول طالب في النادي</p></div>';
      }

      if (ids.alertsList) {
        var alertsHtml = '';
        if (isAdmin && subs.length) {
          var expiring = subs.filter(function(s) { return s.remainingDays <= 7 && s.remainingDays > 0; });
          if (expiring.length > 0) {
            alertsHtml += '<div class="alert alert-warning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>هناك <strong>' + expiring.length + '</strong> اشتراك على وشك الانتهاء</span></div>';
          }
        }
        if (students.length === 0) {
          alertsHtml += '<div class="alert alert-info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><span>مرحباً بك! ابدأ بإضافة الطلاب.</span></div>';
        }
        if (!alertsHtml) {
          alertsHtml = '<div class="alert alert-success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>كل شيء على ما يرام. لا توجد تنبيهات.</span></div>';
        }
        ids.alertsList.innerHTML = alertsHtml;
      }
    } catch (err) {
      if (ids.totalStudents) ids.totalStudents.textContent = '0';
      if (ids.activeSubs) ids.activeSubs.textContent = '0';
      if (ids.coaches) ids.coaches.textContent = '0';
      if (ids.todayAtt) ids.todayAtt.textContent = '0';
    }
  }

  if (document.getElementById('statTotalStudents')) loadOverview();
})();