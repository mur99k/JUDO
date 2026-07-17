const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  },

  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  },

  init() {
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.classList.remove('active');
      });
      overlay.querySelectorAll('.modal-close').forEach(function(btn) {
        btn.addEventListener('click', function() { overlay.classList.remove('active'); });
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', Modal.init);
