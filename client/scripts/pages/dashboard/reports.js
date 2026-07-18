(function() {
  var cards = {
    totalStudents: document.getElementById('repTotalStudents'),
    activeSubs: document.getElementById('repActiveSubscriptions'),
    totalCoaches: document.getElementById('repTotalCoaches'),
    todayAttendance: document.getElementById('repTodayAttendance'),
    revenue: document.getElementById('repRevenue'),
    exemptions: document.getElementById('repExemptions')
  };
  var containers = {
    students: document.getElementById('repStudentsBar'),
    categories: document.getElementById('repCategoriesBar'),
    subsStatus: document.getElementById('repSubsStatus'),
    attendance: document.getElementById('repAttendance')
  };

  function loadReports() {
    for (var k in cards) { if (cards[k]) cards[k].textContent = '--'; }
    for (var k in containers) { if (containers[k]) containers[k].innerHTML = '<p style="color:#a0aec0;text-align:center;">جاري التحميل...</p>'; }

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
      if (cards.revenue) cards.revenue.textContent = (dash.revenue || 0) + ' ر.س';
      if (cards.exemptions) cards.exemptions.textContent = dash.exemptions || 0;

      // Student status chart
      if (containers.students && students) {
        var sItems = [];
        if (students.statusBreakdown && students.statusBreakdown.length) {
          for (var i = 0; i < students.statusBreakdown.length; i++) {
            var sb = students.statusBreakdown[i];
            var color = '#94a3b8';
            if (sb.status === 'نشط') color = 'var(--color-navy)';
            else if (sb.status === 'غير نشط') color = '#f59e0b';
            sItems.push({ label: sb.status, count: sb.count, color: color });
          }
        } else {
          sItems = [
            { label: 'نشط', count: students.active || 0, color: 'var(--color-navy)' },
            { label: 'غير نشط', count: students.inactive || 0, color: '#94a3b8' }
          ];
        }
        renderBarChart(containers.students, sItems, students.total || 1);
      }

      // Category breakdown
      if (containers.categories && students && students.categoryBreakdown) {
        var catItems = [];
        var catColors = ['#059669','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
        for (var i = 0; i < students.categoryBreakdown.length; i++) {
          var c = students.categoryBreakdown[i];
          catItems.push({ label: c.category, count: c.count, color: catColors[i % catColors.length] });
        }
        renderBarChart(containers.categories, catItems, students.total || 1);
      }

      // Subscription status breakdown
      if (containers.subsStatus && subs && subs.statusBreakdown) {
        var stItems = [];
        var stColors = { 'نشط':'#059669', 'منتهي':'#94a3b8', 'موقوف':'#f59e0b', 'ملغي':'#ef4444', 'بانتظار الدفع':'#3b82f6' };
        var totalSubs = 0;
        for (var i = 0; i < subs.statusBreakdown.length; i++) {
          totalSubs += subs.statusBreakdown[i].count;
        }
        for (var i = 0; i < subs.statusBreakdown.length; i++) {
          var s = subs.statusBreakdown[i];
          stItems.push({ label: s.status, count: s.count, color: stColors[s.status] || '#94a3b8' });
        }
        renderBarChart(containers.subsStatus, stItems, totalSubs || 1);
        if (subs.exemptions !== undefined) {
          var exHtml = '<div style="margin-top:12px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:0.85rem;"><span style="color:#475569;">إجمالي الإيرادات</span><span style="font-weight:700;color:var(--color-navy);">' + (subs.revenue||0) + ' ر.س</span></div>';
          containers.subsStatus.innerHTML += exHtml;
        }
      }

      // Attendance today
      if (containers.attendance && dash.todayStats) {
        var ats = dash.todayStats;
        var atItems = [
          { label: 'حاضر', count: ats.present||0, color: '#059669' },
          { label: 'غائب', count: ats.absent||0, color: '#ef4444' },
          { label: 'معذر', count: ats.excused||0, color: '#f59e0b' }
        ];
        renderBarChart(containers.attendance, atItems, ats.total || 1);
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