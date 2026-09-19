/**
 * Instant-valuation chat sheet (FTR-101). Talks to /ValuationChat/Start, /Message and
 * /Handoff; the address step reuses the repair wizard's Ideal Postcodes proxies
 * (/Repairs/Suggest + /Repairs/Resolve). Opens from every ".display-valuation-modal"
 * control, from any link to the old value-my-house page, and from the global
 * OpenValuationLink(); falls back to the LeadPro page
 * (data-classic on #va27) when the server says the assistant is off. ASCII only.
 */
(function () {
  "use strict";

  var sheet = document.getElementById("va27"), scrim = document.getElementById("va27-scrim");
  if (!sheet || !scrim) return;
  var $ = function (id) { return document.getElementById(id); };
  var log = $("va27-log"), chipsEl = $("va27-chips"), addrEl = $("va27-addr"), form = $("va27-form"), input = $("va27-input"), sendBtn = $("va27-send");
  var classicUrl = sheet.getAttribute("data-classic") || "https://value-my-house.cookeandco.com";
  var state = { id: null, ask: null, done: false, busy: false, opened: false, lastFocus: null, enabled: true };

  function escapeHtml(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function post(url, data) {
    var fd = new FormData();
    Object.keys(data || {}).forEach(function (k) { if (data[k] != null) fd.append(k, data[k]); });
    return fetch(url, { method: "POST", body: fd, credentials: "same-origin" }).then(function (r) { return r.json(); });
  }
  function scrollLog() { log.scrollTop = log.scrollHeight; }
  var AI_NAME = "AI valuation assistant";   // picked out in red in the greeting (text nodes + one span, never innerHTML)
  function addMsg(text, who) {
    var el = document.createElement("div"); el.className = "va-msg " + (who || "bot");
    var at = (who === "bot" && text) ? text.indexOf(AI_NAME) : -1;
    if (at < 0) { el.textContent = text; }
    else {
      el.appendChild(document.createTextNode(text.slice(0, at)));
      var b = document.createElement("span"); b.className = "va-ai-name"; b.textContent = AI_NAME; el.appendChild(b);
      el.appendChild(document.createTextNode(text.slice(at + AI_NAME.length)));
    }
    log.appendChild(el); scrollLog(); return el;
  }
  var typingEl = null;
  function typing(on) {
    if (on && !typingEl) { typingEl = document.createElement("div"); typingEl.className = "va-typing"; typingEl.innerHTML = "<span></span><span></span><span></span>"; log.appendChild(typingEl); scrollLog(); }
    else if (!on && typingEl) { typingEl.parentNode.removeChild(typingEl); typingEl = null; }
  }
  function setBusy(b) { state.busy = b; sendBtn.disabled = b; input.disabled = b; }
  function money(v) { return "\u00A3" + Number(v || 0).toLocaleString("en-GB"); }

  // ---------- chips ----------
  function renderChips(chips) {
    chipsEl.innerHTML = "";
    (chips || []).forEach(function (c) {
      var b = document.createElement("button"); b.type = "button"; b.className = "va-chip"; b.textContent = c;
      b.addEventListener("click", function () { if (state.ask === "consent" && /^yes/i.test(c)) { sendStructured("consent", { marketing: /market news/i.test(c), nocall: /no phone|email only/i.test(c) }, c); } else { send(c); } });
      chipsEl.appendChild(b);
    });
  }

  // ---------- turns ----------
  function apply(json, echoed) {
    typing(false);
    if (!json || !json.ok) {
      var why = json && json.reason;
      if (why === "expired") { addMsg("Sorry, that conversation timed out. Let's start again.", "sys"); state.id = null; start(); return; }
      addMsg(why === "finished" ? "This conversation is complete. Close the sheet and open it again to start a new one." : "Sorry, something went wrong on our side. You can try again, or use the quick form link below.", "sys");
      setBusy(false); return;
    }
    if (json.reply) addMsg(json.reply, "bot");
    state.ask = json.ask;
    renderChips(json.chips);
    addrEl.hidden = json.ask !== "address";
    if (json.ask === "address") { resetAddress(); setTimeout(function () { $("va27-pc").focus(); }, 50); }
    else if (!json.done) { setTimeout(function () { input.focus(); }, 50); }
    if (json.done) { state.done = true; renderEstimate(json); form.hidden = true; }
    setBusy(false);
  }

  function start() {
    if (state.busy) return;
    log.innerHTML = ""; chipsEl.innerHTML = ""; addrEl.hidden = true; form.hidden = false; state.done = false; state.ask = null;
    setBusy(true); typing(true);
    post("/ValuationChat/Start", { channel: "web", page: location.pathname + location.search })
      .then(function (json) {
        if (json && json.ok === false && json.enabled === false) { state.enabled = false; closeSheet(); window.open(json.classic || classicUrl, "_blank"); return; }
        state.id = json.id; try { sessionStorage.setItem("va27.id", json.id); } catch (e) { }
        apply(json);
      })
      .catch(function () { typing(false); setBusy(false); addMsg("Sorry, I can't start right now. The quick form below still works.", "sys"); });
  }

  function send(text) {
    text = (text || "").trim();
    if (!text || state.busy || !state.id || state.done) return;
    addMsg(text, "me"); input.value = ""; autosize(); chipsEl.innerHTML = "";
    setBusy(true); typing(true);
    post("/ValuationChat/Message", { id: state.id, text: text }).then(apply).catch(function () { typing(false); setBusy(false); addMsg("Sorry, that didn't go through. Please try again.", "sys"); });
  }

  function sendStructured(kind, data, echo) {
    if (state.busy || !state.id || state.done) return;
    if (echo) addMsg(echo, "me");
    chipsEl.innerHTML = ""; addrEl.hidden = true;
    setBusy(true); typing(true);
    post("/ValuationChat/Message", { id: state.id, kind: kind, data: data ? JSON.stringify(data) : "" }).then(apply).catch(function () { typing(false); setBusy(false); addMsg("Sorry, that didn't go through. Please try again.", "sys"); });
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); } });
  function autosize() { input.style.height = "auto"; input.style.height = Math.min(120, input.scrollHeight) + "px"; }
  input.addEventListener("input", autosize);

  // ---------- estimate card ----------
  function renderEstimate(json) {
    var est = json.estimate, br = json.branch || {}, s = json.summary || {};
    var card = document.createElement("div"); card.className = "va-card";
    var isLet = s.intent === "let";
    var html = "";
    if (est && !est.error) {
      var b = isLet ? est.rent : est.sale;
      html += '<div class="lbl">' + (isLet ? "Instant rental valuation" : "Instant valuation") + (est.stub ? " (dev stub)" : "") + '</div>';
      html += '<div class="big">' + escapeHtml(money(b.avg)) + (isLet ? ' <span style="font-size:16px;color:#62666c;font-family:FSAlbert,Segoe UI,Helvetica,Arial,sans-serif">a month</span>' : "") + '</div>';
      html += '<div class="range"><span class="rl">Likely range</span><span class="pill lo">' + escapeHtml(money(b.min)) + '</span><span class="sep">to</span><span class="pill hi">' + escapeHtml(money(b.max)) + '</span></div>';
      if (est.comparables && est.comparables.length) {
        html += '<div class="comps">';
        est.comparables.forEach(function (c) { html += '<div><span>' + escapeHtml(c.address) + (c.beds ? ' - ' + c.beds + ' bed' : '') + (c.date ? ', ' + escapeHtml(c.date) : '') + '</span><b>' + escapeHtml(money(c.price)) + '</b></div>'; });
        html += '</div>';
      }
      html += '<div class="note">An instant valuation is an automated figure from recent local sales. Your ' + escapeHtml(br.office || "local") + ' branch will confirm an accurate figure at a free in-person valuation.</div>';
    } else {
      html += '<div class="lbl">Details sent</div><div class="range">Your ' + escapeHtml(br.office || "local") + ' team will call you with the figures.</div>';
    }
    html += '<div class="va-acts">';
    if (br.phone) { html += '<a class="va-btn red" id="va27-call" href="tel:' + escapeHtml(String(br.phone).replace(/\s+/g, "")) + '"><svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>Call ' + escapeHtml(br.office || "the branch") + ' ' + escapeHtml(br.phone) + '</a>'; }
    html += '<button type="button" class="va-btn ghost" id="va27-done">Done</button>';
    html += '</div>';
    card.innerHTML = html;
    log.appendChild(card); scrollLog();
    var call = $("va27-call"); if (call) call.addEventListener("click", function () { post("/ValuationChat/Handoff", { id: state.id, how: "call" }); });
    var done = $("va27-done"); if (done) done.addEventListener("click", closeSheet);
  }

  // ---------- address step (Ideal Postcodes via the repair-wizard proxies) ----------
  var pcInput = $("va27-pc"), addrList = $("va27-addr-list"), addrHint = $("va27-addr-hint"), addrGrid = $("va27-addr-grid");
  var addrTimer = null, addrSeq = 0;
  function resetAddress() { pcInput.value = ""; addrList.innerHTML = ""; addrHint.textContent = "Matches appear as you type."; addrGrid.hidden = true; }
  pcInput.addEventListener("input", function () {
    clearTimeout(addrTimer);
    var q = pcInput.value.replace(/\s+/g, " ").trim();
    if (q.length < 3) { addrList.innerHTML = ""; addrHint.textContent = "Matches appear as you type."; return; }
    addrTimer = setTimeout(function () { lookup(q); }, 260);
  });
  pcInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); clearTimeout(addrTimer); lookup(pcInput.value.trim()); }
    else if (e.key === "ArrowDown") { var f = addrList.querySelector(".opt"); if (f) { e.preventDefault(); f.focus(); } }
  });
  addrList.addEventListener("keydown", function (e) {
    var opts = Array.prototype.slice.call(addrList.querySelectorAll(".opt")); var i = opts.indexOf(document.activeElement); if (i < 0) return;
    if (e.key === "ArrowDown" && opts[i + 1]) { e.preventDefault(); opts[i + 1].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (i === 0) pcInput.focus(); else opts[i - 1].focus(); }
  });
  function lookup(q) {
    var seq = ++addrSeq;
    addrHint.textContent = "Looking up " + q + "...";
    fetch("/Repairs/Suggest?query=" + encodeURIComponent(q), { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (json) {
      if (seq !== addrSeq) return;
      addrList.innerHTML = "";
      var isPc = json && json.mode === "postcode";
      var items = json && json.success ? (isPc ? json.addresses : json.suggestions) : [];
      if (!items || !items.length) { addrHint.textContent = json && json.message === "postcode_not_found" ? "We couldn't find that postcode. Keep typing, or use the link below." : "No matches yet. Keep typing, or use the link below."; return; }
      addrHint.textContent = items.length + (items.length === 1 ? " match" : " matches") + ". Choose yours.";
      items.forEach(function (a) {
        var b = document.createElement("button"); b.type = "button"; b.className = "opt"; b.setAttribute("role", "option"); b.textContent = a.text;
        b.addEventListener("click", function () {
          if (isPc) { chooseAddress({ line1: a.line1, line2: a.line2 || "", town: a.town, postcode: a.postcode || json.postcode, text: a.text }); }
          else {
            addrHint.textContent = "Checking " + a.text + "...";
            fetch("/Repairs/Resolve?udprn=" + encodeURIComponent(a.udprn), { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (res) {
              if (res && res.success && res.address) { chooseAddress(res.address); }
              else { addrHint.textContent = "Sorry, I couldn't fetch that address. Please type it below."; showManual(a.text); }
            }).catch(function () { showManual(a.text); });
          }
        });
        addrList.appendChild(b);
      });
    }).catch(function () { if (seq === addrSeq) addrHint.textContent = "Lookup failed. Please type your address below."; });
  }
  function chooseAddress(a) {
    sendStructured("address", { line1: a.line1, line2: a.line2 || "", town: a.town, postcode: a.postcode, text: a.text }, a.text);
  }
  function showManual(prefill) {
    addrGrid.hidden = false; addrList.innerHTML = "";
    if (prefill) { var parts = prefill.split(",").map(function (p) { return p.trim(); }); $("va27-m-line1").value = parts[0] || ""; $("va27-m-town").value = parts.length > 2 ? parts[parts.length - 2] : ""; $("va27-m-pc").value = parts.length > 1 ? parts[parts.length - 1] : ""; }
    $("va27-m-line1").focus();
  }
  $("va27-addr-manual").addEventListener("click", function () { showManual(""); if (/^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/.test(pcInput.value.trim())) $("va27-m-pc").value = pcInput.value.trim().toUpperCase(); });
  $("va27-m-use").addEventListener("click", function () {
    var l1 = $("va27-m-line1").value.trim(), town = $("va27-m-town").value.trim(), pc = $("va27-m-pc").value.trim().toUpperCase();
    if (!l1 || !pc) { addrHint.textContent = "Please add at least the first line and the postcode."; return; }
    if (!/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/.test(pc)) { addrHint.textContent = "That postcode doesn't look right."; return; }
    chooseAddress({ line1: l1, line2: "", town: town, postcode: pc, text: l1 + ", " + (town ? town + ", " : "") + pc });
  });

  // ---------- open / close ----------
  function openSheet() {
    if (!state.enabled) { window.open(classicUrl, "_blank"); return; }
    state.lastFocus = document.activeElement;
    document.body.classList.add("show-val");
    sheet.setAttribute("aria-hidden", "false");
    if (document.body.classList.contains("show-menu")) { var c = document.getElementById("close-button"); if (c) c.click(); }
    if (!state.id || state.done) { start(); } else { setTimeout(function () { input.focus(); }, 50); }
  }
  function closeSheet() {
    document.body.classList.remove("show-val");
    sheet.setAttribute("aria-hidden", "true");
    if (state.id && !state.done) { post("/ValuationChat/Handoff", { id: state.id, how: "close" }); }
    if (state.lastFocus && state.lastFocus.focus) { try { state.lastFocus.focus(); } catch (e) { } }
  }
  $("va27-close").addEventListener("click", closeSheet);
  scrim.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("show-val")) closeSheet(); });
  $("va27-classic").addEventListener("click", function () { if (state.id) post("/ValuationChat/Handoff", { id: state.id, how: "form" }); });

  // Take over every valuation control. polo.common.js binds ".display-valuation-modal"
  // clicks to the global OpenValuationLink(), so replacing the global is enough for those;
  // the capture listener also catches controls bound before this script ran.
  // polo.common.js loads AFTER this partial and redefines the global, so override it now
  // and again once the page has finished loading (the off-canvas menu calls it inline).
  var takeOver = function () { window.OpenValuationLink = function () { openSheet(); }; };
  takeOver();
  window.addEventListener("load", function () { takeOver(); setTimeout(takeOver, 500); });
  document.addEventListener("DOMContentLoaded", takeOver);
  // Links straight to the old LeadPro page count as valuation controls too - CMS copy and
  // older views still carry them, and every one of them should open the sheet (Barry).
  // The sheet's own "Prefer a quick form?" link is excluded by the sheet.contains() guard,
  // and a link left in the page still works if this script never runs.
  var SELECTOR = ".display-valuation-modal, .btn-valuation, [data-valuation-chat], a[href*='value-my-house.cookeandco.com']";
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest(SELECTOR) : null;
    if (!t || sheet.contains(t)) return;
    e.preventDefault(); e.stopPropagation(); openSheet();
  }, true);
  window.ValuationChat = { open: openSheet, close: closeSheet };
})();
