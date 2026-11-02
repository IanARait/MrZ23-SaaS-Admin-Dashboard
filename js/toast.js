/* toast.js - toast notifications. FB.toast.success(msg) etc. */

window.FB = window.FB || {};

(() => {
  "use strict";

  let region;

  function ensureRegion() {
    if (!region) {
      region = document.createElement("div");
      region.className = "toast-container";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    return region;
  }

  const ICONS = { success: "fa-check", error: "fa-xmark", warning: "fa-triangle-exclamation", info: "fa-circle-info" };

  function show(message, type = "info", timeout = 3500) {
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `
      <i class="fa-solid ${ICONS[type] || ICONS.info}" style="flex-shrink:0"></i>
      <span style="flex:1;font-size:var(--fs-sm)">${FB.util.escapeHtml(message)}</span>
      <button aria-label="Dismiss" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:2px;font-size:var(--fs-xs)"><i class="fa-solid fa-xmark"></i></button>`;
    ensureRegion().appendChild(el);

    let timer = setTimeout(close, timeout);
    function close() {
      clearTimeout(timer);
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      el.style.transition = "all 0.2s var(--ease)";
      setTimeout(() => el.remove(), 200);
    }
    el.querySelector("[aria-label='Dismiss']").addEventListener("click", close);
    return close;
  }

  FB.toast = {
    success: (m, t) => show(m, "success", t),
    error: (m, t) => show(m, "error", t),
    warning: (m, t) => show(m, "warning", t),
    info: (m, t) => show(m, "info", t),
  };
})();
