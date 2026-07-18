(function() {
  var form = document.getElementById('registerForm');
  var errorEl = document.getElementById('registerError');
  var fileInput = document.getElementById('regPhoto');
  var preview = document.getElementById('regPhotoPreview');
  var placeholder = document.getElementById('regPhotoPlaceholder');
  var cropArea = document.getElementById('regCropArea');
  var cropImage = document.getElementById('regCropImage');
  var cropConfirm = document.getElementById('regCropConfirm');
  var cropCancel = document.getElementById('regCropCancel');
  var zoomRange = document.getElementById('regCropZoomRange');
  var zoomIn = document.getElementById('regCropZoomIn');
  var zoomOut = document.getElementById('regCropZoomOut');
  var cropper = null;
  var croppedBlob = null;

  function showError(msg) { if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; } }
  function hideError() { if (errorEl) errorEl.style.display = 'none'; }

  function fetchWithTimeout(url, opts, timeout) {
    return new Promise(function(resolve, reject) {
      var ctrl = new AbortController();
      var timer = setTimeout(function() { ctrl.abort(); }, timeout || 15000);
      opts.signal = ctrl.signal;
      fetch(url, opts).then(function(res) {
        clearTimeout(timer);
        resolve(res);
      }).catch(function(err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') reject(new Error('انتهت مهلة الاتصال'));
        else reject(err);
      });
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', function() {
      var file = fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        cropImage.src = e.target.result;
        cropImage.onload = function() {
          cropArea.style.display = 'block';
          if (cropper) cropper.destroy();
          cropper = new Cropper(cropImage, {
            aspectRatio: 1, viewMode: 1, dragMode: 'move',
            autoCropArea: 0.8, cropBoxMovable: false,
            cropBoxResizable: false, toggleDragModeOnDblclick: false,
            background: false, zoomOnWheel: true
          });
        };
      };
      reader.readAsDataURL(file);
    });
  }

  if (zoomRange) zoomRange.addEventListener('input', function() { if (cropper) cropper.zoomTo(parseFloat(this.value)); });
  if (zoomIn) zoomIn.addEventListener('click', function() { if (cropper) { cropper.zoom(0.1); updateZoom(); } });
  if (zoomOut) zoomOut.addEventListener('click', function() { if (cropper) { cropper.zoom(-0.1); updateZoom(); } });

  function updateZoom() {
    if (cropper && zoomRange) { var d = cropper.getData(); zoomRange.value = d.scaleX || 1; }
  }

  if (cropConfirm) {
    cropConfirm.addEventListener('click', function() {
      if (!cropper) return;
      var canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
      canvas.toBlob(function(blob) {
        croppedBlob = blob;
        var url = URL.createObjectURL(blob);
        if (preview) { preview.src = url; preview.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
        cropArea.style.display = 'none';
        if (cropper) { cropper.destroy(); cropper = null; }
      }, 'image/jpeg', 0.9);
    });
  }

  if (cropCancel) {
    cropCancel.addEventListener('click', function() {
      cropArea.style.display = 'none';
      if (cropper) { cropper.destroy(); cropper = null; }
      fileInput.value = '';
    });
  }

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      hideError();
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.querySelector('.btn-text').textContent = 'جاري...';

      try {
        var fd = new FormData();
        fd.append('fullName', form.querySelector('input[name="fullName"]').value);
        fd.append('nationalId', form.querySelector('input[name="nationalId"]').value);
        fd.append('age', form.querySelector('input[name="age"]').value);
        var phone = form.querySelector('input[name="phone"]').value;
        if (phone) fd.append('phone', phone);
        var parentPhone = form.querySelector('input[name="parentPhone"]').value;
        if (parentPhone) fd.append('parentPhone', parentPhone);
        if (croppedBlob) fd.append('photo', croppedBlob, 'profile.jpg');

        var res = await fetchWithTimeout('/api/auth/register', { method: 'POST', body: fd });
        var json = await res.json();

        if (json.success) {
          window.location.href = '/student';
        } else {
          throw new Error(json.error || 'حدث خطأ أثناء التسجيل');
        }
      } catch (err) {
        showError(err.message);
        btn.disabled = false;
        btn.querySelector('.btn-text').textContent = 'تسجيل';
      }
    });
  }
})();