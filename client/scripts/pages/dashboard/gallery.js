(function() {
  var grid = document.getElementById('galleryGrid');
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var uploadInput = document.getElementById('galleryUpload');
  var addBtn = document.getElementById('addGalleryBtn');
  var countEl = document.getElementById('photoCount');

  function loadGallery() {
    if (grid) grid.innerHTML = '<div style="text-align:center;padding:30px;color:#a0aec0;">جاري التحميل...</div>';
    API.get('/api/gallery').then(function(res) {
      if (!res.success) throw new Error(res.error || 'فشل');
      renderGrid(res.photos || []);
      if (countEl) countEl.textContent = (res.photos || []).length;
    }).catch(function(err) {
      if (grid) grid.innerHTML = '<div style="text-align:center;padding:30px;color:#ef4444;">فشل التحميل</div>';
    });
  }

  function renderGrid(photos) {
    if (!grid) return;
    if (!photos || !photos.length) {
      grid.innerHTML = '<div style="text-align:center;padding:40px;color:#a0aec0;font-size:0.9rem;">لا توجد صور</div>';
      return;
    }
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">';
    for (var i = 0; i < photos.length; i++) {
      var p = photos[i];
      html += '<div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid #e9edf2;aspect-ratio:1;cursor:pointer;background:#f8fafc;" onclick="openLightbox(\'' + p.url + '\')">';
      html += '<img src="' + p.url + '" alt="" onerror="this.onerror=null;this.outerHTML=\'<div style=\\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f1f5f9;color:#94a3b8;font-size:0.75rem;\\\'>صورة</div>\'" style="width:100%;height:100%;object-fit:cover;" loading="lazy">';
      html += '<button type="button" onclick="event.stopPropagation();deletePhoto(\'' + p.name + '\')" title="حذف" style="position:absolute;top:6px;left:6px;width:26px;height:26px;border-radius:50%;border:none;background:rgba(220,38,38,0.9);color:#fff;cursor:pointer;font-size:0.9rem;line-height:1;display:flex;align-items:center;justify-content:center;">×</button>';
      html += '</div>';
    }
    html += '</div>';
    grid.innerHTML = html;
  }

  window.openLightbox = function(url) {
    if (lightbox && lightboxImg) {
      lightboxImg.src = url;
      lightboxImg.onerror = function(){ this.style.display='none'; };
      lightboxImg.onload = function(){ this.style.display=''; };
      lightbox.classList.add('active');
    }
  };

  window.deletePhoto = function(name) {
    if (!confirm('حذف هذه الصورة؟')) return;
    API.del('/api/gallery/' + encodeURIComponent(name)).then(function(res) {
      if (!res.success) throw new Error(res.error || 'فشل');
      if (typeof Toast !== 'undefined') Toast.success('تم', 'تم حذف الصورة');
      loadGallery();
    }).catch(function(err) {
      alert(err.message);
    });
  };

  function uploadPhoto(file) {
    var fd = new FormData();
    fd.append('photo', file);
    API.formPost('/api/gallery', fd).then(function(res) {
      if (!res.success) throw new Error(res.error || 'فشل');
      if (typeof Toast !== 'undefined') Toast.success('تم', 'تم رفع الصورة');
      loadGallery();
    }).catch(function(err) {
      alert(err.message);
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', function() {
      if (uploadInput) uploadInput.click();
    });
  }

  if (uploadInput) {
    uploadInput.addEventListener('change', function() {
      var file = uploadInput.files[0];
      if (file) uploadPhoto(file);
    });
  }

  if (document.getElementById('galleryGrid')) loadGallery();
})();