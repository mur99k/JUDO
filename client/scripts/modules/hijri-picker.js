(function (global) {
  'use strict';
  var H = global.Hijri;

  // Day-of-week labels (starting Saturday as common in Saudi calendars).
  var WEEKDAYS = ['سب', 'أح', 'اث', 'ث', 'أر', 'خ', 'جم'];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // Attach a Hijri date picker to an <input type="text"> or any element.
  // opts: { value: 'YYYY-MM-DD', onChange: function(yyyymmdd), min, max }
  // Returns the picker controller.
  function createPicker(inputEl, opts) {
    opts = opts || {};
    var value = opts.value || H.today();
    var onChange = opts.onChange || function () {};

    var wrap = el('div', 'hijri-picker-wrap');
    inputEl.parentNode.insertBefore(wrap, inputEl);
    wrap.appendChild(inputEl);
    inputEl.classList.add('hijri-picker-input');
    inputEl.readOnly = true;
    inputEl.type = 'text';

    var popup = el('div', 'hijri-picker-popup');
    popup.style.display = 'none';
    document.body.appendChild(popup);

    var parsed = H.parse(value) || H.parse(H.today());
    var viewYear = parsed.hy;
    var viewMonth = parsed.hm;

    function positionPopup() {
      var rect = inputEl.getBoundingClientRect();
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var popupW = popup.offsetWidth || 280;
      var popupH = popup.offsetHeight || 350;
      var gap = 6;
      var edgePad = 8;

      // Default: right-aligned below input (RTL-friendly)
      var top = rect.bottom + gap;
      var right = vw - rect.right;

      // If popup overflows left edge, flip to left-aligned
      var popupLeft = vw - right - popupW;
      if (popupLeft < edgePad) {
        right = vw - rect.left - popupW;
        if (vw - right - popupW < edgePad) {
          // Still overflows: center it and use right of input
          right = Math.max(edgePad, vw - rect.right - popupW / 2);
        }
      }

      // If right edge overflows (negative right), clamp
      if (right < edgePad) right = edgePad;
      if (right + popupW > vw - edgePad) right = vw - popupW - edgePad;

      // If popup overflows bottom, show above
      if (top + popupH > vh - edgePad) {
        top = rect.top - popupH - gap;
        if (top < edgePad) top = edgePad;
      }

      popup.style.top = Math.max(edgePad, top) + 'px';
      popup.style.right = right + 'px';
      popup.style.left = 'auto';
    }

    function render() {
      var p = H.parse(value) || {};
      inputEl.value = H.format(value);
      inputEl.dataset.hijri = value;
      popup.innerHTML = '';

      var header = el('div', 'hijri-picker-header');
      var prev = el('button', 'hijri-nav', '‹');
      prev.type = 'button';
      prev.onclick = function (e) { e.stopPropagation(); step(-1); };
      var next = el('button', 'hijri-nav', '›');
      next.type = 'button';
      next.onclick = function (e) { e.stopPropagation(); step(1); };
      var title = el('div', 'hijri-picker-title', H.monthName(viewMonth) + ' ' + H.U.localizeNum(viewYear) + ' هـ');
      header.appendChild(prev);
      header.appendChild(title);
      header.appendChild(next);
      popup.appendChild(header);

      var grid = el('div', 'hijri-picker-grid');
      WEEKDAYS.forEach(function (w) {
        grid.appendChild(el('div', 'hijri-picker-dow', w));
      });
      var firstDow = new H.U(viewYear, viewMonth, 1)._date.getDay();
      // shift so week starts Saturday
      var offset = (firstDow + 1) % 7;
      for (var i = 0; i < offset; i++) grid.appendChild(el('div', 'hijri-picker-empty'));
      var dim = H.daysInMonth(viewYear, viewMonth);
      for (var d = 1; d <= dim; d++) {
        (function (day) {
          var cell = el('div', 'hijri-picker-day', H.U.localizeNum(day));
          var cellStr = viewYear + '-' + H.pad(viewMonth) + '-' + H.pad(day);
          if (cellStr === value) cell.classList.add('selected');
          cell.onclick = function (e) {
            e.stopPropagation();
            value = cellStr;
            inputEl.value = H.format(value);
            inputEl.dataset.hijri = value;
            popup.style.display = 'none';
            onChange(value);
          };
          grid.appendChild(cell);
        })(d);
      }
      popup.appendChild(grid);

      // Position after render so offsetHeight is computed
      if (popup.style.display !== 'none') {
        positionPopup();
      }
    }

    function step(dir) {
      var m = viewMonth + dir;
      var y = viewYear;
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      viewMonth = m; viewYear = y;
      render();
    }

    inputEl.onclick = function (e) {
      e.stopPropagation();
      var wasOpen = popup.style.display === 'block';
      document.querySelectorAll('.hijri-picker-popup').forEach(function (p) { p.style.display = 'none'; });
      if (wasOpen) return;
      popup.style.display = 'block';
      render();
    };

    document.addEventListener('click', function (e) {
      if (!popup.contains(e.target) && e.target !== inputEl) {
        popup.style.display = 'none';
      }
    });

    window.addEventListener('resize', function () {
      if (popup.style.display === 'block') positionPopup();
    });

    window.addEventListener('scroll', function () {
      if (popup.style.display === 'block') positionPopup();
    }, true);

    // expose programmatic setValue
    inputEl._hijriSet = function (v) { value = v; render(); };

    render();
    return {
      get value() { return value; },
      set value(v) { value = v; render(); },
      setValue: function (v) { value = v; render(); }
    };
  }

  global.HijriPicker = { create: createPicker };
})(window);
