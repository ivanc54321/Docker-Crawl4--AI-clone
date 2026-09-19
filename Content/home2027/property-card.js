/* property-card.js
   ----------------------------------------------------------------------------
   Photo-slider behaviour for .pfs-card / .pfs-popup-card / .pfs-dev-img.
   Auto-inits on DOMContentLoaded and exposes window.initPfsSlider for any
   surface that clones cards into a popup or other dynamic container.

   Loaded by _Layout2027 and _MicrositeLayout2027 — every page that renders
   _PropertyCard2027 inherits working sliders without duplicating this code.
*/
(function () {
  function initSlider(imgEl) {
    if (!imgEl || imgEl.__pfsSliderInit) return;
    imgEl.__pfsSliderInit = true;
    var slides = imgEl.querySelectorAll('.pfs-slide');
    if (slides.length < 2) return;
    var dots = imgEl.querySelectorAll('.pfs-slide-dots span');
    var prev = imgEl.querySelector('.pfs-slide-prev');
    var next = imgEl.querySelector('.pfs-slide-next');
    var current = 0;

    // Galleries can carry a dozen-plus photos; one dot each fills the whole
    // image edge-to-edge. Show a sliding window of at most MAX_DOTS, keeping
    // the active dot centred, and shrink the window-edge dots (when more exist
    // beyond) so it reads "there's more" without the clutter.
    var MAX_DOTS = 5;
    function updateDots(active) {
      var n = dots.length;
      if (n <= MAX_DOTS) return; // few enough to show them all as-is
      var half = (MAX_DOTS - 1) >> 1;
      var start = Math.min(Math.max(active - half, 0), n - MAX_DOTS);
      var end = start + MAX_DOTS - 1;
      for (var i = 0; i < n; i++) {
        var d = dots[i];
        if (i < start || i > end) {
          d.classList.add('pfs-dot-hidden');
          d.classList.remove('pfs-dot-sm');
        } else {
          d.classList.remove('pfs-dot-hidden');
          var edge = (i === start && start > 0) || (i === end && end < n - 1);
          d.classList.toggle('pfs-dot-sm', edge);
        }
      }
    }

    function go(idx) {
      if (idx < 0) idx = slides.length - 1;
      if (idx >= slides.length) idx = 0;
      slides[current].classList.remove('is-active');
      slides[idx].classList.add('is-active');
      if (dots[current]) dots[current].classList.remove('is-active');
      if (dots[idx])     dots[idx].classList.add('is-active');
      current = idx;
      updateDots(idx);
    }
    function stop(e) { e.preventDefault(); e.stopPropagation(); }
    if (prev) prev.addEventListener('click', function (e) { stop(e); go(current - 1); });
    if (next) next.addEventListener('click', function (e) { stop(e); go(current + 1); });
    Array.prototype.forEach.call(dots, function (d, i) {
      d.addEventListener('click', function (e) { stop(e); go(i); });
    });

    // Touch swipe for mobile — the prev/next arrows are hover-revealed and
    // useless on touch, so let a horizontal drag move through the photos.
    // A real swipe must not also fire the card's click (which opens the
    // listing/drawer), so we swallow the trailing click after a swipe.
    var startX = null, startY = null, swiped = false;
    imgEl.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { startX = null; return; }
      startX = e.touches[0].clientX; startY = e.touches[0].clientY; swiped = false;
    }, { passive: true });
    imgEl.addEventListener('touchmove', function (e) {
      if (startX === null) return;
      var dx = e.touches[0].clientX - startX, dy = e.touches[0].clientY - startY;
      if (!swiped && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) swiped = true;
    }, { passive: true });
    imgEl.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      var didSwipe = swiped && Math.abs(dx) > 40;
      startX = null;
      if (!didSwipe) return;
      go(dx < 0 ? current + 1 : current - 1);
      var swallow = function (ev) { ev.preventDefault(); ev.stopPropagation(); };
      imgEl.addEventListener('click', swallow, true);
      setTimeout(function () { imgEl.removeEventListener('click', swallow, true); }, 400);
    }, { passive: true });

    updateDots(0);
  }

  function initAll(root) {
    (root || document).querySelectorAll('.pfs-card-img, .pfs-dev-img').forEach(initSlider);
  }

  /* ---- Progressive high-res image upgrade ---------------------------------
     Cards and detail gallery tiles paint the ~22 KB /Property/Thumbs/ image
     first (unchanged) for a fast initial load. Once a tile scrolls near the
     viewport we fetch the full-res /Property/Photos/ version and swap it in —
     <img> via `data-src-hq` → src, CSS background tiles via `data-hq`. Nothing
     extra is requested up front, so search/page load speed is untouched; the
     sharp image just arrives before you reach it. Preloading via a detached
     Image() means the visible thumb never blanks during the swap.

     Re-invokable: pass a root to observe cards added after load (infinite
     scroll). A single shared observer keeps repeat calls idempotent, and each
     element drops its data-* attr once upgraded so re-scans skip it.            */
  var hqObserver = null;
  function upgradeHq(el) {
    var url = el.getAttribute('data-src-hq') || el.getAttribute('data-hq');
    if (!url) return;
    var isImg = el.hasAttribute('data-src-hq');
    el.removeAttribute('data-src-hq');
    el.removeAttribute('data-hq');

    // Only upgrade when the display box actually out-resolves the thumbnail.
    // The source Photos are ~3000px; forcing one into a ~340px card is a ~9x
    // object-fit:cover downscale, which shimmers (moire/aliasing) on detailed
    // textures - and the 800px thumb already covers a card crisply. So skip the
    // swap for boxes the thumb comfortably fills, and only sharpen genuinely
    // large boxes (e.g. the fullscreen/hero tile). For <img> we can compare the
    // thumb's own naturalWidth; for background tiles we fall back to box size.
    var dpr  = window.devicePixelRatio || 1;
    var needW = (el.clientWidth || 0) * dpr;
    if (needW > 0) {
      var haveW = isImg ? (el.naturalWidth || 0) : 0;
      // Skip if the thumb already covers the box, or the box just isn't large in
      // absolute terms (cards/popups, even full-width on a high-dpi phone). Only
      // boxes past ~1100 device px - a fullscreen/hero tile - are worth the swap.
      if ((haveW && haveW >= needW * 0.95) || needW < 1100) return;
    }

    var pre = new Image();
    pre.onload = function () {
      // Decode the preloaded bytes BEFORE swapping. onload fires when the bytes
      // are loaded but not yet decoded, so a bare `el.src = url` still leaves the
      // <img> blank for a frame while it decodes the new URL - that gap is the
      // visible "vanish" (the pink/grey container showing through). Waiting for
      // decode() means the element paints the already-decoded frame in one go.
      var apply = function () {
        if (isImg) el.src = url;
        else el.style.backgroundImage = 'url("' + url + '")';
      };
      if (pre.decode) { pre.decode().then(apply).catch(apply); }
      else { apply(); }
    };
    pre.src = url;
  }
  function onHqIntersect(entries, obs) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      obs.unobserve(entries[i].target);
      upgradeHq(entries[i].target);
    }
  }
  function initHqSwap(root) {
    var els = (root || document).querySelectorAll('[data-src-hq], [data-hq]');
    if (!('IntersectionObserver' in window)) {
      // No observer support — upgrade straight away; still deferred by decode.
      Array.prototype.forEach.call(els, upgradeHq);
      return;
    }
    if (!hqObserver) {
      hqObserver = new IntersectionObserver(onHqIntersect, { rootMargin: '300px 0px' });
    }
    Array.prototype.forEach.call(els, function (el) { hqObserver.observe(el); });
  }

  // Expose for callers that clone cards (popup re-init in PropertiesForSale2027).
  window.initPfsSlider = initSlider;
  window.initPfsSliders = initAll;
  window.initHqSwap = initHqSwap;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); initHqSwap(); });
  } else {
    initAll();
    initHqSwap();
  }
})();
