(function() {
  var cards = {
    totalStudents: document.getElementById('repTotalStudents'),
    activeSubs: document.getElementById('repActiveSubscriptions'),
    totalCoaches: document.getElementById('repTotalCoaches'),
    todayAttendance: document.getElementById('repTodayAttendance')
  };
  var barContainer = document.getElementById('repStudentsBar');
  var pieContainer = document.getElementById('repSubsPie');

  function loadReports() {
    for (var k in cards) { if (cards[k]) cards[k].textContent = '--'; }
    if (barContainer) barContainer.innerHTML = '<p style="color:#a0aec0;">جاري التحميل...</p>';
    if (pieContainer) pieContainer.innerHTML = '<p style="color:#a0aec0;">جاري التحميل...</p>';

    Promise.all([
      API.get('/api/reports/dashboard'),
      API.get('/api/reports/students'),
      API.get('/api/reports/subscriptions')
    ]).then(function(results) {
      var dash = results[0], students = results[1], subs = results[2];
      if (cards.totalStudents) cards.totalStudents.textContent = dash.totalStudents || 0;
      if (cards.activeSubs) cards.activeSubs.textContent = dash.activeSubscriptions || 0;
      if (cards.totalCoaches) cards.totalCoaches.textContent = dash.totalCoaches || 0;
      if (cards.todayAttendance) cards.todayAttendance.textContent = dash.todayAttendance || 0;

      // Student chart
      if (barContainer && students) {
        var sTotal = students.total || 0;
        var sActive = students.active || 0;
        var sInactive = students.inactive || 0;
        renderBarChart(barContainer, [
          { label: 'نشط', count: sActive, color: 'var(--color-navy)' },
          { label: 'غير نشط', count: sInactive, color: '#94a3b8' }
        ], sTotal);
      }

      // Subscription chart
      if (pieContainer && subs) {
        var sAct = subs.active || 0;
        var total = (sAct || 0) + 1; // avoid divide by zero
        renderBarChart(pieContainer, [
          { label: 'نشطة', count: sAct, color: '#059669' },
          { label: 'غير نشطة', count: 0, color: '#94a3b8' }
        ], total);
        if (subs.revenue !== undefined) {
          pieContainer.innerHTML += '<div style="margin-top:12px;text-align:center;font-weight:700;color:var(--color-navy);">إجمالي الإيرادات: ' + (subs.revenue||0) + ' ر.س</div>';
        }
      }
    }).catch(function(err) {
      for (var k in cards) { if (cards[k]) cards[k].textContent = '0'; }
    });
  }

  function renderBarChart(container, items, total) {
    if (!container) return;
    if (!items || !items.length) { container.innerHTML = '<p style="color:#a0aec0;text-align:center;">لا توجد بيانات</p>'; return; }
    var t = total || 1;
    var html = '<div style="display:flex;flex-direction:column;gap:10px;">';
    for (var i = 0; i < items.length; i++) {
      var pct = Math.round((items[i].count / t) * 100);
      html += '<div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-size:0.82rem;color:#475569;">' + items[i].label + '</span><span style="font-size:0.82rem;font-weight:600;">' + items[i].count + '</span></div>' +
        '<div style="height:8px;background:#f0f2f5;border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:' + (items[i].color||'var(--color-navy)') + ';border-radius:4px;transition:width 0.6s;"></div></div>' +
        '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  if (document.getElementById('repTotalStudents')) loadReports();
})();