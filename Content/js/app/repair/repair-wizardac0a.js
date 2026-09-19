/**
 * Repair-report wizard (ported from "Request a Repair Design/app.js" and wired to
 * the server): postcode -> address lookup (/Repairs/Addresses, with a manual
 * fallback), category -> sub-item -> details, photo uploads to the existing
 * repair-photo store (/Repairs/UploadAttachment), and a real submit
 * (/Repairs/SubmitReport) that returns the branch email outcome + the reference.
 * Radio-style groups support arrow-key navigation. ASCII only.
 */
(function () {
  "use strict";

  var DATA = window.REPAIR_DATA;
  var root = document.getElementById("rr");
  var form = document.getElementById("repair-form");
  if (!DATA || !root || !form) return;

  var requestId = root.getAttribute("data-request-id");
  var branch = { name: root.getAttribute("data-branch-name") || "lettings", phone: root.getAttribute("data-branch-phone") || "" };
  var state = { step: 1, address: null, category: null, subitem: null, urgency: null, attachments: [] };

  var ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }

  // ---------- radio groups: click + arrow keys ----------
  function radioGroup(container, itemSelector, onSelect) {
    function items() { return Array.prototype.slice.call(container.querySelectorAll(itemSelector)); }
    function select(btn) {
      items().forEach(function (o) { o.setAttribute("aria-checked", "false"); o.setAttribute("tabindex", "-1"); });
      btn.setAttribute("aria-checked", "true"); btn.setAttribute("tabindex", "0");
      onSelect(btn);
    }
    container.addEventListener("click", function (e) { var b = e.target.closest(itemSelector); if (b && container.contains(b)) select(b); });
    container.addEventListener("keydown", function (e) {
      var list = items(); if (!list.length) return;
      var i = list.indexOf(document.activeElement); if (i < 0) return;
      var n = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") n = list[(i + 1) % list.length];
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = list[(i - 1 + list.length) % list.length];
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); select(list[i]); return; }
      if (n) { e.preventDefault(); n.focus(); select(n); }
    });
    return { select: select, reset: function () { items().forEach(function (o, k) { o.setAttribute("aria-checked", "false"); o.setAttribute("tabindex", k === 0 ? "0" : "-1"); }); } };
  }

  // ---------- step navigation ----------
  function goToStep(n) {
    state.step = n;
    Array.prototype.forEach.call(document.querySelectorAll("#rr .step"), function (el) { el.classList.toggle("active", Number(el.getAttribute("data-step")) === n); });
    Array.prototype.forEach.call(document.querySelectorAll("#rr .progress-dot"), function (dot) {
      var s = Number(dot.getAttribute("data-step"));
      dot.classList.toggle("done", s < n); dot.classList.toggle("current", s === n);
    });
    var card = document.querySelector("#rr .wizard-card");
    var top = card ? card.getBoundingClientRect().top + window.pageYOffset - 96 : 0;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    var h = document.querySelector('#rr .step[data-step="' + n + '"] .step-h1'); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  // Step 3 (sub-item) is skipped in both directions when the chosen category has only
  // one sub-item ("Something else ..."): renderSubitems has already selected it.
  function stepSkipped(n) { return n === 3 && !!state.category && state.category.subitems.length === 1; }
  function moveStep(dir) {
    var n = state.step + dir;
    if (stepSkipped(n)) n += dir;
    goToStep(Math.min(4, Math.max(1, n)));
  }
  Array.prototype.forEach.call(document.querySelectorAll("#rr [data-next]"), function (btn) { btn.addEventListener("click", function () { moveStep(1); }); });
  Array.prototype.forEach.call(document.querySelectorAll("#rr [data-prev]"), function (btn) { btn.addEventListener("click", function () { moveStep(-1); }); });

  // ---------- step 1: postcode / address type-ahead -> address -> details ----------
  // One box: as the tenant types, /Repairs/Suggest returns either every address for a
  // complete postcode (structured lines, final) or free type-ahead hits (udprn + text,
  // resolved to structured lines through /Repairs/Resolve when one is picked).
  var postcodeInput = $("postcode"), findBtn = $("btn-find-address"), addressBlock = $("address-block"), addressList = $("address-list");
  var manualBlock = $("manual-block"), detailsBlock = $("details-block"), postcodeError = $("postcode-error"), addressStatus = $("address-status"), step1Next = document.querySelector('#rr .step[data-step="1"] [data-next]');
  var statusDefault = addressStatus ? addressStatus.textContent : "";
  var lookupSeq = 0, lookupTimer = null, lastQuery = "";

  function setStatus(text, busy) {
    if (!addressStatus) return;
    addressStatus.textContent = text || statusDefault;
    addressStatus.classList.toggle("is-busy", !!busy);
  }
  var chosenCard = $("address-chosen"), chosenText = $("address-chosen-text");
  function applyAddress(a) {
    state.address = { line1: a.line1 || "", line2: a.line2 || "", town: a.town || "", postcode: (a.postcode || "").toUpperCase(), text: a.text || "" };
    // Collapse the list and show the pick as a card right under the box, then move on
    // to the details fields - otherwise the change happens below a long scroll box and
    // looks like nothing happened.
    addressBlock.hidden = true; manualBlock.hidden = true;
    chosenText.textContent = state.address.text; chosenCard.hidden = false;
    detailsBlock.hidden = false;
    $("s2-address-label").textContent = state.address.text;
    setStatus("Address selected. Now add your details below.", false);
    validateStep1();
    var name = $("fullName");
    if (name && !name.value) { try { name.focus({ preventScroll: true }); } catch (e) { name.focus(); } }
    try { chosenCard.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { /* older browsers */ }
  }
  $("btn-change-address").addEventListener("click", function () {
    chosenCard.hidden = true; detailsBlock.hidden = true; state.address = null; validateStep1();
    lastQuery = ""; setStatus("", false);
    postcodeInput.focus(); postcodeInput.select();
    findAddresses(true);
  });
  function parseSuggestion(text) {
    // "Flat 2, 52 Harbour Parade, Ramsgate, CT11" -> best-effort lines for the manual form
    var parts = text.split(",").map(function (p) { return p.trim(); }).filter(Boolean);
    var pc = parts.length > 1 ? parts[parts.length - 1] : "";
    var town = parts.length > 2 ? parts[parts.length - 2] : "";
    var l1 = parts.length ? parts[0] : text;
    if (parts.length > 3) l1 += ", " + parts.slice(1, parts.length - 2).join(", ");
    return { line1: l1, town: town, postcode: pc };
  }

  var addrGroup = radioGroup(addressList, ".addr-opt", function (btn) {
    var udprn = btn.getAttribute("data-udprn");
    if (!udprn) {
      // Postcode results already carry structured lines - final.
      applyAddress({ line1: btn.getAttribute("data-line1"), line2: btn.getAttribute("data-line2"), town: btn.getAttribute("data-town"), postcode: btn.getAttribute("data-postcode"), text: btn.getAttribute("data-text") });
      return;
    }
    // Type-ahead hit: fetch the full address (this is the one-credit step).
    var text = btn.getAttribute("data-text") || "";
    detailsBlock.hidden = true; state.address = null; validateStep1();
    setStatus("Checking " + text + "...", true);
    var seq = ++lookupSeq;
    fetch("/Repairs/Resolve?udprn=" + encodeURIComponent(udprn), { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (seq !== lookupSeq || btn.getAttribute("aria-checked") !== "true") return;
        setStatus("", false);
        if (json && json.success && json.address) { applyAddress(json.address); }
        else { var p = parseSuggestion(text); $("manual-line1").value = p.line1; $("manual-town").value = p.town; showManual(p.postcode, p.town); $("manual-postcode").focus(); }
      })
      .catch(function () { if (seq !== lookupSeq) return; setStatus("", false); var p = parseSuggestion(text); $("manual-line1").value = p.line1; $("manual-town").value = p.town; showManual(p.postcode, p.town); $("manual-postcode").focus(); });
  });

  function showManual(postcode, town) {
    addressBlock.hidden = true; chosenCard.hidden = true; manualBlock.hidden = false; detailsBlock.hidden = false;
    $("manual-postcode").value = postcode; if (town && !$("manual-town").value) $("manual-town").value = town;
    syncManual();
  }
  function syncManual() {
    var l1 = $("manual-line1").value.trim(), town = $("manual-town").value.trim(), pc = $("manual-postcode").value.trim();
    state.address = (l1 && town && pc) ? { line1: l1, line2: "", town: town, postcode: pc.toUpperCase(), text: l1 + ", " + town + ", " + pc.toUpperCase() } : null;
    if (state.address) $("s2-address-label").textContent = state.address.text;
    validateStep1();
  }
  ["manual-line1", "manual-town", "manual-postcode"].forEach(function (id) { $(id).addEventListener("input", syncManual); });
  $("btn-manual").addEventListener("click", function () { showManual(postcodeInput.value.trim(), ""); $("manual-line1").focus(); });

  findBtn.addEventListener("click", function () { findAddresses(true); });
  postcodeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); findAddresses(true); }
    else if (e.key === "ArrowDown" && !addressBlock.hidden) { e.preventDefault(); var first = addressList.querySelector(".addr-opt"); if (first) first.focus(); }
    else if (e.key === "Escape") { clearResults(); }
  });
  postcodeInput.addEventListener("input", function () {
    postcodeError.hidden = true;
    clearTimeout(lookupTimer);
    var q = postcodeInput.value.replace(/\s+/g, " ").trim();
    if (q.length < 3) { lookupSeq++; clearResults(); setStatus("", false); return; }
    lookupTimer = setTimeout(function () { findAddresses(false); }, 260);
  });

  function clearResults() {
    addressList.innerHTML = ""; $("address-foot").innerHTML = ""; addressBlock.hidden = true; lastQuery = "";
    if (!manualBlock.hidden) return;
    chosenCard.hidden = true; detailsBlock.hidden = true; state.address = null; validateStep1();
  }

  function renderOptions(items, isPostcodeMode, json, query) {
    addressList.innerHTML = "";
    items.forEach(function (a) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "addr-opt"; btn.setAttribute("role", "radio"); btn.setAttribute("aria-checked", "false"); btn.setAttribute("tabindex", "-1");
      if (isPostcodeMode) {
        btn.setAttribute("data-line1", a.line1 || ""); btn.setAttribute("data-line2", a.line2 || ""); btn.setAttribute("data-town", a.town || ""); btn.setAttribute("data-postcode", a.postcode || json.postcode || query);
      } else {
        btn.setAttribute("data-udprn", String(a.udprn));
      }
      btn.setAttribute("data-text", a.text || "");
      btn.innerHTML = '<span class="r"></span>' + escapeHtml(a.text);
      addressList.appendChild(btn);
    });
    var manual = document.createElement("button");
    manual.type = "button"; manual.className = "addr-manual"; manual.textContent = "My address isn't listed";
    manual.addEventListener("click", function () { showManual(isPostcodeMode ? (json.postcode || query) : "", isPostcodeMode ? (json.town || "") : ""); $("manual-line1").focus(); });
    var foot = $("address-foot"); foot.innerHTML = ""; foot.appendChild(manual); // outside the scroll box so it is always visible
    addressList.scrollTop = 0;
    addrGroup.reset();
    addressBlock.hidden = false; chosenCard.hidden = true; manualBlock.hidden = true; detailsBlock.hidden = true; state.address = null; validateStep1();
    var n = items.length;
    setStatus(isPostcodeMode ? (n + (n === 1 ? " address" : " addresses") + " found for " + (json.postcode || query) + ". Choose yours below.") : (n + (n === 1 ? " match" : " matches") + ". Choose yours below, or keep typing."), false);
  }

  // explicit = Find address / Enter (moves focus to the list and treats "nothing found" as
  // a cue to show the manual form); otherwise a quiet type-ahead refresh.
  function findAddresses(explicit) {
    var query = postcodeInput.value.replace(/\s+/g, " ").trim();
    clearTimeout(lookupTimer);
    if (!query || (query.length < 3 && !explicit)) { if (explicit) { postcodeError.hidden = false; postcodeInput.focus(); } return; }
    if (!explicit && query === lastQuery) return;
    postcodeError.hidden = true;
    lastQuery = query;
    var seq = ++lookupSeq;
    setStatus("Looking up " + query + "...", true);
    if (explicit) { findBtn.disabled = true; findBtn.textContent = "Looking up..."; }
    fetch("/Repairs/Suggest?query=" + encodeURIComponent(query), { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (seq !== lookupSeq) return;
        var isPostcode = json && json.mode === "postcode";
        var items = json && json.success ? (isPostcode ? json.addresses : json.suggestions) : null;
        if (items && items.length) {
          renderOptions(items, isPostcode, json, query);
          if (explicit) { var first = addressList.querySelector(".addr-opt"); if (first) first.focus(); }
        } else if (explicit || (json && json.message === "postcode_not_found")) {
          // Nothing found (or no provider): type the address instead.
          addressList.innerHTML = ""; addressBlock.hidden = true;
          setStatus(json && json.message === "postcode_not_found" ? "We couldn't find that postcode. Type your address below." : "No matches. Type your address below.", false);
          showManual(isPostcode && json.postcode ? json.postcode : (/^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/.test(query) ? query.toUpperCase() : ""), json ? (json.town || "") : "");
          $("manual-line1").focus();
        } else {
          addressList.innerHTML = ""; addressBlock.hidden = true;
          setStatus(json && json.message === "too_short" ? "" : "No matches yet. Keep typing, or choose Find address.", false);
        }
      })
      .catch(function () { if (seq !== lookupSeq) return; setStatus("", false); if (explicit) { showManual(query, ""); $("manual-line1").focus(); } })
      .then(function () { if (explicit) { findBtn.disabled = false; findBtn.textContent = "Find address"; } });
  }

  function setupYesNo(name) {
    var group = document.querySelector('#rr .yn-toggle[data-name="' + name + '"]'), hidden = $(name);
    Array.prototype.forEach.call(group.querySelectorAll("button"), function (btn) {
      btn.addEventListener("click", function () {
        Array.prototype.forEach.call(group.querySelectorAll("button"), function (b) { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); });
        btn.classList.add("on"); btn.setAttribute("aria-pressed", "true"); hidden.value = btn.getAttribute("data-value");
      });
    });
  }
  setupYesNo("IsVulnerable"); setupYesNo("CalledOfficeBefore"); setupYesNo("ContractorAttendedBefore");

  ["fullName", "email", "mobile"].forEach(function (id) { $(id).addEventListener("input", validateStep1); });
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function validateStep1() {
    var ok = !!state.address && $("fullName").value.trim() && validEmail($("email").value.trim()) && $("mobile").value.trim().replace(/\D/g, "").length >= 10;
    step1Next.disabled = !ok;
  }

  // ---------- step 2: category ----------
  var categoryGrid = $("category-grid"), step2Next = document.querySelector('#rr .step[data-step="2"] [data-next]');
  DATA.categories.forEach(function (cat, i) {
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "cat-tile"; btn.setAttribute("role", "radio"); btn.setAttribute("aria-checked", "false"); btn.setAttribute("tabindex", i === 0 ? "0" : "-1"); btn.setAttribute("data-id", cat.id);
    btn.innerHTML = '<span class="cat-ic" aria-hidden="true">' + (DATA.icons[cat.id] || DATA.icons.other) + '</span><span class="cat-label">' + escapeHtml(cat.label) + '</span>';
    categoryGrid.appendChild(btn);
  });
  radioGroup(categoryGrid, ".cat-tile", function (btn) {
    var cat = DATA.categories.filter(function (c) { return c.id === btn.getAttribute("data-id"); })[0];
    state.category = cat; state.subitem = null; step2Next.disabled = false; renderSubitems(cat);
  });

  // ---------- step 3: sub-item ----------
  var subitemList = $("subitem-list"), step3Next = document.querySelector('#rr .step[data-step="3"] [data-next]');
  var subGroup = radioGroup(subitemList, ".subitem", function (btn) {
    var item = state.category.subitems.filter(function (s) { return s.id === btn.getAttribute("data-id"); })[0];
    state.subitem = item; step3Next.disabled = false;
    $("s4-eyebrow").textContent = item.label; $("s4-tip").textContent = item.tip;
  });
  function renderSubitems(cat) {
    $("s3-category-label").textContent = cat.label;
    subitemList.innerHTML = ""; step3Next.disabled = true;
    cat.subitems.forEach(function (item, i) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "subitem"; btn.setAttribute("role", "radio"); btn.setAttribute("aria-checked", "false"); btn.setAttribute("tabindex", i === 0 ? "0" : "-1"); btn.setAttribute("data-id", item.id);
      btn.innerHTML = escapeHtml(item.label) + '<span class="chev" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>';
      subitemList.appendChild(btn);
    });
    subGroup.reset();
    // A single sub-item is not a choice: pre-select it so step 3 can be skipped.
    if (cat.subitems.length === 1) { var only = subitemList.querySelector(".subitem"); if (only) subGroup.select(only); }
  }

  // ---------- step 4: details, uploads, urgency ----------
  var urgencyRow = $("urgency-row"), urgencyHidden = $("Urgency"), submitBtn = $("btn-submit"), descriptionInput = $("description");
  DATA.urgency.forEach(function (u, i) {
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "urgency-opt"; btn.setAttribute("data-id", u.id); btn.setAttribute("role", "radio"); btn.setAttribute("aria-checked", i === 0 ? "true" : "false"); btn.setAttribute("tabindex", i === 0 ? "0" : "-1");
    btn.innerHTML = '<div class="u-name">' + escapeHtml(u.label) + '</div><div class="u-time">' + escapeHtml(u.time) + '</div>';
    urgencyRow.appendChild(btn);
  });
  radioGroup(urgencyRow, ".urgency-opt", function (btn) {
    state.urgency = DATA.urgency.filter(function (u) { return u.id === btn.getAttribute("data-id"); })[0];
    urgencyHidden.value = state.urgency.id; validateStep4();
  });
  state.urgency = DATA.urgency[0]; urgencyHidden.value = state.urgency.id;
  descriptionInput.addEventListener("input", validateStep4);
  function validateStep4() { submitBtn.disabled = !descriptionInput.value.trim() || uploading > 0; }

  // ---------- photo upload (instant, to the existing repair-photo store) ----------
  var attachmentsInput = $("attachments"), uploadRow = $("upload-row"), addTile = uploadRow.querySelector(".thumb-add"), uploadError = $("upload-error"), uploading = 0;
  attachmentsInput.addEventListener("change", function () {
    Array.prototype.slice.call(attachmentsInput.files).forEach(uploadFile);
    attachmentsInput.value = "";
  });
  function uploadFile(file) {
    uploadError.hidden = true;
    if (file.size > 16 * 1024 * 1024) { uploadError.textContent = "Photos need to be under 16MB each."; uploadError.hidden = false; return; }
    var tile = document.createElement("div"); tile.className = "thumb is-uploading";
    tile.innerHTML = '<span class="spin"></span>';
    uploadRow.insertBefore(tile, addTile);
    if (file.type.indexOf("image/") === 0 && file.type !== "image/heic" && file.type !== "image/heif") {
      var reader = new FileReader(); reader.onload = function (e) { tile.style.backgroundImage = "url(" + e.target.result + ")"; }; reader.readAsDataURL(file);
    }
    uploading++; validateStep4();
    var fd = new FormData(); fd.append("file", file, file.name);
    fetch("/Repairs/UploadAttachment?fixFlowRequestId=" + encodeURIComponent(requestId), { method: "POST", body: fd, credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (!json || !json.success) throw new Error("upload");
        tile.classList.remove("is-uploading"); tile.innerHTML = '<button type="button" class="rm" aria-label="Remove photo">&times;</button>';
        tile.style.backgroundImage = "url(" + json.url + ")";
        tile.setAttribute("data-id", json.id);
        state.attachments.push({ id: json.id, url: json.url });
        tile.querySelector(".rm").addEventListener("click", function () { removeAttachment(tile, json.id); });
      })
      .catch(function () { tile.parentNode.removeChild(tile); uploadError.textContent = "That photo could not be uploaded. Please try again or send it to the branch afterwards."; uploadError.hidden = false; })
      .then(function () { uploading--; validateStep4(); });
  }
  function removeAttachment(tile, id) {
    var fd = new FormData(); fd.append("repairId", requestId); fd.append("attachmentId", id);
    tile.classList.add("is-uploading");
    fetch("/Repairs/RemoveAttachment", { method: "POST", body: fd, credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function () { tile.parentNode.removeChild(tile); state.attachments = state.attachments.filter(function (a) { return a.id !== id; }); })
      .catch(function () { tile.classList.remove("is-uploading"); });
  }

  // ---------- submit ----------
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (submitBtn.disabled) return;
    var err = $("submit-error"); err.hidden = true;
    submitBtn.disabled = true; submitBtn.textContent = "Sending your report...";
    var fd = new FormData();
    fd.append("fixFlowRequestId", requestId);
    fd.append("postcode", state.address.postcode); fd.append("line1", state.address.line1); fd.append("line2", state.address.line2 || ""); fd.append("town", state.address.town); fd.append("addressText", state.address.text);
    fd.append("fullName", $("fullName").value.trim()); fd.append("email", $("email").value.trim()); fd.append("mobileNumber", $("mobile").value.trim());
    fd.append("homeNumber", $("homePhone").value.trim()); fd.append("workNumber", $("workPhone").value.trim());
    fd.append("isVulnerable", $("IsVulnerable").value);
    fd.append("categoryId", state.category.id); fd.append("categoryLabel", state.category.label);
    fd.append("subitemId", state.subitem.id); fd.append("subitemLabel", state.subitem.label);
    fd.append("description", descriptionInput.value.trim());
    fd.append("calledOfficeBefore", $("CalledOfficeBefore").value); fd.append("contractorAttendedBefore", $("ContractorAttendedBefore").value);
    fd.append("urgency", state.urgency.id);
    var dry = /[?&]dry=1/.test(location.search) ? "?dry=1" : "";
    fetch("/Repairs/SubmitReport" + dry, { method: "POST", body: fd, credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (!json || !json.success) throw new Error(json && json.message ? json.message : "submit");
        $("confirm-heading").textContent = "Thanks, " + firstName($("fullName").value) + " - we've got it";
        $("confirm-branch").textContent = "Your report has been emailed to our " + (json.branch || branch.name) + " team.";
        $("confirm-ref").textContent = "Ref " + json.reference;
        $("confirm-email").innerHTML = "A copy has also been sent to <b>" + escapeHtml($("email").value.trim()) + "</b> for your records.";
        if (json.dry) { $("confirm-email").innerHTML = "<b style='color:#a81c2e'>DRY RUN (?dry=1) - no emails were sent.</b> Remove ?dry=1 from the address to send them."; }
        else if (json.devOnly) { $("confirm-email").innerHTML += " <b>(dev: both emails went only to " + escapeHtml(json.devOnly) + ")</b>"; }
        var ph = $("confirm-phone"); if (ph) ph.textContent = json.phone || branch.phone;
        renderNextTable();
        Array.prototype.forEach.call(document.querySelectorAll("#rr .progress-dot"), function (d) { d.classList.add("done"); d.classList.remove("current"); });
        goToStep(5);
        window.rrReference = json.reference;
      })
      .catch(function () {
        err.hidden = false; submitBtn.disabled = false; submitBtn.innerHTML = "Submit report " + ARROW;
      });
  });

  function renderNextTable() {
    var table = $("next-table"); table.innerHTML = "";
    DATA.urgency.forEach(function (u) {
      var row = document.createElement("div");
      row.className = "nt-row" + (state.urgency && state.urgency.id === u.id ? " highlight" : "");
      row.innerHTML = '<span class="nt-tag ' + u.id + '">' + escapeHtml(u.label) + '</span><span class="nt-text">' + escapeHtml(u.responseText) + '</span>';
      table.appendChild(row);
    });
  }
  function firstName(full) { return (full.trim().split(" ")[0]) || "there"; }
})();
