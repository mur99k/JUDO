(function() {
  var sidebar = document.getElementById('dashSidebar');
  var overlay = document.getElementById('dashOverlay');
  var hamburger = document.getElementById('dashHamburger');
  var closeBtn = document.getElementById('dashSidebarClose');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  if (hamburger) hamburger.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  var logoutForm = document.getElementById('logoutForm');
  if (logoutForm) {
    logoutForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      try {
        await API.post('/api/auth/logout');
        window.location.href = '/';
      } catch (err) {
        if (typeof Toast !== 'undefined') Toast.error('خطأ', err.message);
      }
    });
  }
})();