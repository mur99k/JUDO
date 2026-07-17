const Toast = {
  show(title, message, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-content"><div class="toast-title">' + title + '</div><div class="toast-message">' + (message || '') + '</div></div>';
    container.appendChild(toast);

    setTimeout(function() {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
  },

  success(title, message) { this.show(title, message, 'success'); },
  error(title, message) { this.show(title, message, 'error'); },
  warning(title, message) { this.show(title, message, 'warning'); },
  info(title, message) { this.show(title, message, 'info'); }
};
