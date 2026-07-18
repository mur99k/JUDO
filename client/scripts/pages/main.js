(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // HERO SLIDER — Crossfade every 5 seconds
  // ═══════════════════════════════════════════════════════════════

  var slides = document.querySelectorAll('.hero-slide');
  if (slides.length > 1) {
    var current = 0;
    var total = slides.length;

    setInterval(function() {
      slides[current].classList.remove('active');
      current = (current + 1) % total;
      slides[current].classList.add('active');
    }, 5000);
  }

  // ═══════════════════════════════════════════════════════════════
  // NAVBAR TOGGLE
  // ═══════════════════════════════════════════════════════════════

  var toggle = document.getElementById('navbarToggle');
  var menu = document.getElementById('mobileMenu');
  var closeBtn = document.getElementById('mobileMenuClose');
  var backdrop = document.getElementById('mobileBackdrop');

  function openMenu() { if (menu) menu.classList.add('open'); if (backdrop) backdrop.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeMenu() { if (menu) menu.classList.remove('open'); if (backdrop) backdrop.classList.remove('open'); document.body.style.overflow = ''; }

  if (toggle) toggle.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);
  if (menu) menu.querySelectorAll('.mobile-link').forEach(function(link) { link.addEventListener('click', closeMenu); });

  // ═══════════════════════════════════════════════════════════════
  // HERO SCROLL
  // ═══════════════════════════════════════════════════════════════

  var heroScroll = document.getElementById('heroScroll');
  if (heroScroll) {
    heroScroll.addEventListener('click', function() {
      var features = document.getElementById('features');
      if (features) features.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // COUNTER ANIMATION
  // ═══════════════════════════════════════════════════════════════

  var counterObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        counterObserver.unobserve(el);
        var target = parseInt(el.dataset.target) || 0;
        var duration = 1500;
        var start = performance.now();
        function update(now) {
          var progress = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target) + (target > 99 ? '+' : '');
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter').forEach(function(el) { counterObserver.observe(el); });

  // ═══════════════════════════════════════════════════════════════
  // REVEAL ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el) { revealObserver.observe(el); });

  // ═══════════════════════════════════════════════════════════════
  // GALLERY LIGHTBOX
  // ═══════════════════════════════════════════════════════════════

  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightboxImg');
  var lbClose = document.getElementById('lightboxClose');
  var lbPrev = document.getElementById('lightboxPrev');
  var lbNext = document.getElementById('lightboxNext');
  var currentIdx = 0;
  var images = [];

  document.querySelectorAll('.gallery-item').forEach(function(item, idx) {
    item.addEventListener('click', function() {
      var allItems = document.querySelectorAll('.gallery-item img');
      images = Array.from(allItems).map(function(i) { return i.src; });
      currentIdx = idx;
      lbImg.src = images[currentIdx];
      lbImg.onerror = function(){ this.style.display='none'; };
      lbImg.onload = function(){ this.style.display=''; };
      lb.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigateLightbox(dir) {
    if (images.length === 0) return;
    currentIdx = (currentIdx + dir + images.length) % images.length;
    lbImg.src = images[currentIdx];
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', function() { navigateLightbox(-1); });
  if (lbNext) lbNext.addEventListener('click', function() { navigateLightbox(1); });
  if (lb) lb.addEventListener('click', function(e) { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', function(e) {
    if (!lb || !lb.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  // ═══════════════════════════════════════════════════════════════
  // CONTACT FORM
  // ═══════════════════════════════════════════════════════════════

  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = contactForm.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'جاري الإرسال...';
      try {
        var fd = new FormData(contactForm);
        var data = {}; fd.forEach(function(v, k) { data[k] = v; });
        await API.post('/api/auth/contact', data);
        contactForm.innerHTML = '<div style="text-align:center;padding:24px;"><div style="font-size:48px;margin-bottom:12px;">✅</div><h3 style="font-weight:700;margin-bottom:4px;">تم إرسال رسالتك</h3><p style="color:var(--text-soft);">سنقوم بالتواصل معك قريباً</p></div>';
      } catch (err) { Toast.error('خطأ', err.message); btn.disabled = false; btn.textContent = 'إرسال'; }
    });
  }
})();
