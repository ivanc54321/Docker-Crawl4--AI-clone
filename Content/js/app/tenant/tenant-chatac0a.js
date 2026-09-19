/**
 * "Could I rent this home?" chat sheet (FTR-116). Talks to /TenantChat/Start, /Message
 * and /Handoff. Opens from any [data-tenant-chat] control on a To Let listing; the
 * property id comes from data-property-id on #ta27. Same behaviour as the valuation
 * sheet (valuation-chat.js) minus the address step. ASCII only.
 */
(function () {
  "use strict";

  var sheet = document.getElementById("ta27"), scrim = document.getElementById("ta27-scrim");
  if (!sheet || !scrim) return;
  var $ = function (id) { return document.getElementById(id); };
  var log = $("ta27-log"), chipsEl = $("ta27-chips"), form = $("ta27-form"), input = $("ta27-input"), sendBtn = $("ta27-send");
  var propertyId = parseInt(sheet.getAttribute("data-property-id"), 10) || 0;
  var state = { id: null, ask: null, done: false, busy: false, lastFocus: null };

  function escapeHtml(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function post(url, data) {
    var fd = new FormData();
    Object.keys(data || {}).forEach(function (k) { if (data[k] != null) fd.append(k, data[k]); });
    return fetch(url, { method: "POST", body: fd, credentials: "same-origin" }).then(function (r) { return r.json(); });
  }
  function scrollLog() { log.scrollTop = log.scrollHeight; }
  var AI_NAME = "AI lettings assistant";
  function addMsg(text, who) {
    var el = document.createElement("div"); el.className = "ta-msg " + (who || "bot");
    var at = (who === "bot" && text) ? text.indexOf(AI_NAME) : -1;
    if (at < 0) { el.textContent = text; }
    else {
      el.appendChild(document.createTextNode(text.slice(0, at)));
      var b = document.createElement("span"); b.className = "ta-ai-name"; b.textContent = AI_NAME; el.appendChild(b);
      el.appendChild(document.createTextNode(text.slice(at + AI_NAME.length)));
    }
    log.appendChild(el); scrollLog(); return el;
  }
  var typingEl = null;
  function typing(on) {
    if (on && !typingEl) { typingEl = document.createElement("div"); typingEl.className = "ta-typing"; typingEl.innerHTML = "<span></span><span></span><span></span>"; log.appendChild(typingEl); scrollLog(); }
    else if (!on && typingEl) { typingEl.parentNode.removeChild(typingEl); typingEl = null; }
  }
  function setBusy(b) { state.busy = b; sendBtn.disabled = b; input.disabled = b; }

  function renderChips(chips) {
    chipsEl.innerHTML = "";
    (chips || []).forEach(function (c) {
      var b = document.createElement("button"); b.type = "button"; b.className = "ta-chip"; b.textContent = c;
      b.addEventListener("click", function () {
        if (state.ask === "consent" && /^yes/i.test(c)) { sendStructured("consent", { nocall: /no phone|email only/i.test(c) }, c); }
        else { send(c); }
      });
      chipsEl.appendChild(b);
    });
  }

  function apply(json) {
    typing(false);
    if (!json || !json.ok) {
      var why = json && json.reason;
      if (why === "expired") { addMsg("Sorry, that conversation timed out. Let's start again.", "sys"); state.id = null; start(); return; }
      addMsg(why === "finished" ? "This conversation is complete. Close the sheet and open it again to start a new one." : "Sorry, something went wrong on our side. Please try again, or use Request a viewing instead.", "sys");
      setBusy(false); return;
    }
    if (json.reply) addMsg(json.reply, "bot");
    state.ask = json.ask;
    renderChips(json.chips);
    if (json.done) { state.done = true; renderCard(json); form.hidden = true; }
    else { setTimeout(function () { input.focus(); }, 50); }
    setBusy(false);
  }

  function start() {
    if (state.busy) return;
    log.innerHTML = ""; chipsEl.innerHTML = ""; form.hidden = false; state.done = false; state.ask = null;
    setBusy(true); typing(true);
    post("/TenantChat/Start", { propertyId: propertyId, page: location.pathname + location.search })
      .then(function (json) {
        if (json && json.ok === false) { typing(false); setBusy(false); addMsg("Sorry, the assistant isn't available for this home right now. Please use Request a viewing or Ask a question instead.", "sys"); return; }
        state.id = json.id;
        apply(json);
      })
      .catch(function () { typing(false); setBusy(false); addMsg("Sorry, I can't start right now. Please use Request a viewing instead.", "sys"); });
  }

  function send(text) {
    text = (text || "").trim();
    if (!text || state.busy || !state.id || state.done) return;
    addMsg(text, "me"); input.value = ""; autosize(); chipsEl.innerHTML = "";
    setBusy(true); typing(true);
    post("/TenantChat/Message", { id: state.id, text: text }).then(apply).catch(function () { typing(false); setBusy(false); addMsg("Sorry, that didn't go through. Please try again.", "sys"); });
  }

  function sendStructured(kind, data, echo) {
    if (state.busy || !state.id || state.done) return;
    if (echo) addMsg(echo, "me");
    chipsEl.innerHTML = "";
    setBusy(true); typing(true);
    post("/TenantChat/Message", { id: state.id, kind: kind, data: data ? JSON.stringify(data) : "" }).then(apply).catch(function () { typing(false); setBusy(false); addMsg("Sorry, that didn't go through. Please try again.", "sys"); });
  }

  function renderCard(json) {
    var s = json.summary || {}, br = json.branch || {};
    var card = document.createElement("div"); card.className = "ta-card";
    var labels = { good: "Looks affordable", guarantor: "Possible with a guarantor", review: "The team will advise" };
    var html = '<div class="lbl">Your quick guide</div>';
    html += '<div><span class="verdict ' + escapeHtml(json.verdict || "review") + '">' + escapeHtml(labels[json.verdict] || labels.review) + '</span></div>';
    html += '<p class="vt">' + escapeHtml(json.verdictText || "") + '</p>';
    html += '<div class="rows">';
    html += '<div><span>Rent</span><b>' + escapeHtml(s.rent || "") + '</b></div>';
    html += '<div><span>Household income</span><b>' + escapeHtml(s.income || "") + '</b></div>';
    html += '<div><span>Moving in</span><b>' + escapeHtml(s.moveIn || "") + '</b></div>';
    html += '<div><span>Household</span><b>' + escapeHtml(s.household || "") + '</b></div>';
    html += '<div><span>Pets</span><b>' + escapeHtml(s.pets || "") + '</b></div>';
    if (s.guarantor) html += '<div><span>Guarantor</span><b>' + escapeHtml(s.guarantor) + '</b></div>';
    html += '<div><span>Viewing</span><b>' + (s.viewing ? "Requested" : "Not yet") + '</b></div>';
    html += '</div>';
    html += '<div class="note">A rule-of-thumb guide from what you told me, not a referencing decision. The ' + escapeHtml(br.office || "lettings") + ' team has your details.</div>';
    html += '<div class="ta-acts">';
    if (br.phone) { html += '<a class="ta-btn red" id="ta27-call" href="tel:' + escapeHtml(String(br.phone).replace(/\s+/g, "")) + '"><svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>Call ' + escapeHtml(br.office || "the team") + ' ' + escapeHtml(br.phone) + '</a>'; }
    html += '<button type="button" class="ta-btn ghost" id="ta27-done">Done</button>';
    html += '</div>';
    card.innerHTML = html;
    log.appendChild(card); scrollLog();
    var call = $("ta27-call"); if (call) call.addEventListener("click", function () { post("/TenantChat/Handoff", { id: state.id, how: "call" }); });
    var done = $("ta27-done"); if (done) done.addEventListener("click", closeSheet);
  }

  function autosize() { input.style.height = "auto"; input.style.height = Math.min(120, input.scrollHeight) + "px"; }
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); } });
  form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });

  function openSheet() {
    state.lastFocus = document.activeElement;
    document.body.classList.add("show-ta");
    sheet.setAttribute("aria-hidden", "false");
    if (!state.id || state.done) { start(); } else { setTimeout(function () { input.focus(); }, 50); }
  }
  function closeSheet() {
    document.body.classList.remove("show-ta");
    sheet.setAttribute("aria-hidden", "true");
    if (state.id && !state.done) { post("/TenantChat/Handoff", { id: state.id, how: "close" }); }
    if (state.lastFocus && state.lastFocus.focus) { try { state.lastFocus.focus(); } catch (e) { } }
  }
  $("ta27-close").addEventListener("click", closeSheet);
  scrim.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("show-ta")) closeSheet(); });
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-tenant-chat]") : null;
    if (!t || sheet.contains(t)) return;
    e.preventDefault(); openSheet();
  });
  window.TenantChat = { open: openSheet, close: closeSheet };
})();
