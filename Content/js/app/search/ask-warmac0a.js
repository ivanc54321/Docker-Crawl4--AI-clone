// Natural-language search helpers (FTR-100 follow-up, 2026-09-09).
//
// 1. askWarm(text, rent): while someone is still typing a described home ("3 bed house
//    with a garden near the beach"), ask the server to interpret it NOW so the answer is
//    already in the 12h cache when they press Search - the redirect then takes
//    milliseconds instead of two to four seconds. Debounced 650ms, only for phrases that
//    read like a request (same gate as the server), never repeated for the same phrase.
// 2. askWait(button, url): on submit, if the URL carries ask=, swap the button for an
//    "Understanding your search..." state with a spinner so the model's wait reads as the
//    site working rather than a stalled click.
//
// Loaded by _Layout after polo.common.js; the homepage dock, header dialog and 404 page
// call these guarded (window.askWarm && ...). ASCII-only.
(function () {
  var timer = null, last = '', ctrl = null;
  var HINT = /\b(bed|beds|bedroom|bedrooms|house|flat|apartment|bungalow|home|homes|cottage|garden|parking|garage|rent|renting|buy|buying|under|over|upto|up to|max|budget|near|close|within|walking|sea|view|views|detached|terraced|semi|maisonette|studio|pcm|chain)\b/i;
  var POSTCODE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d?[A-Za-z]{0,2}$/;

  function natural(v) {
    v = (v || '').replace(/\s+/g, ' ').trim();
    if (!v || v.length > 200 || POSTCODE.test(v)) { return false; }
    var words = v.split(' ').length;
    return words >= 4 || (words >= 2 && HINT.test(v));
  }

  function warm(v, rent) {
    v = (v || '').replace(/\s+/g, ' ').trim();
    if (!natural(v)) { return; }
    var key = (rent ? 'r:' : 'b:') + v.toLowerCase();
    if (key === last) { return; }
    last = key;
    if (ctrl) { try { ctrl.abort(); } catch (e) { } }
    ctrl = ('AbortController' in window) ? new AbortController() : null;
    try {
      fetch('/Search/Warm?ask=' + encodeURIComponent(v) + (rent ? '&let=true' : ''), { credentials: 'same-origin', signal: ctrl ? ctrl.signal : undefined }).catch(function () { });
    } catch (e) { }
  }

  window.askWarm = function (v, rent) {
    clearTimeout(timer);
    timer = setTimeout(function () { warm(v, rent); }, 650);
  };

  var styled = false;
  function style() {
    if (styled) { return; }
    styled = true;
    var s = document.createElement('style');
    s.textContent = '.ask-wait{pointer-events:none!important;opacity:.92}.ask-wait .ask-spin{display:inline-block;width:.95em;height:.95em;margin-right:.5em;vertical-align:-.15em;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:askSpin .8s linear infinite}@keyframes askSpin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.ask-wait .ask-spin{animation:none}}';
    document.head.appendChild(s);
  }

  // Returns true when the wait state was applied (an ask= search), false for a plain one.
  window.askWait = function (btn, url) {
    if (!btn || !/[?&]ask=/.test(url || '')) { return false; }
    style();
    btn.classList.add('ask-wait');
    btn.setAttribute('aria-busy', 'true');
    if (btn.tagName === 'BUTTON') { btn.disabled = true; }
    btn.innerHTML = '<span class="ask-spin" aria-hidden="true"></span>Understanding your search...';
    return true;
  };
})();
