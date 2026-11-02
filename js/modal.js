/* modal.js + drawer helpers. FB.modal.open/close/confirm. */

window.FB = window.FB || {};

(() => {
  "use strict";

  let root;

  function ensureRoot() {
    if (!root) {
      root = document.createElement("div");
      root.className = "modal-overlay";
      root.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div><h3 class="modal-title"></h3></div>
            <button class="btn btn-ghost btn-icon" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body"></div>
          <div class="modal-footer" hidden></div>
        </div>`;
      document.body.appendChild(root);

      root.addEventListener("click", (e) => { if (e.target === root) close(); });
      root.querySelector("[aria-label='Close']").addEventListener("click", close);
    }
    return root;
  }

  function open({ title, body, footer }) {
    ensureRoot();
    root.querySelector(".modal-title").textContent = title || "";
    root.querySelector(".modal-body").innerHTML = body || "";
    const foot = root.querySelector(".modal-footer");
    foot.hidden = !footer;
    foot.innerHTML = footer || "";
    root.classList.add("open");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      root.querySelector("input, select, textarea, .btn-primary")?.focus();
    });
    return root.querySelector(".modal");
  }

  function close() {
    if (!root) return;
    root.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => { if (root) root.querySelector(".modal-body").innerHTML = ""; }, 250);
  }

  function confirm({ title = "Are you sure?", message = "", confirmText = "Confirm", cancelText = "Cancel", danger = false } = {}) {
    return new Promise((resolve) => {
      open({
        title,
        body: `<p style="font-size:var(--fs-sm);color:var(--muted);line-height:1.5">${message}</p>`,
        footer: `<button class="btn btn-secondary" data-act="no">${cancelText}</button>
                 <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-act="yes">${confirmText}</button>`,
      });
      root.querySelector(".modal-footer").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-act]");
        if (!btn) return;
        resolve(btn.dataset.act === "yes");
        close();
      }, { once: true });
    });
  }

  /* Drawer */
  let drawerRoot;

  function drawerOpen(title, bodyHtml) {
    if (!drawerRoot) {
      drawerRoot = document.createElement("div");
      drawerRoot.className = "drawer-overlay";
      drawerRoot.innerHTML = `
        <div class="drawer">
          <div class="drawer-header">
            <h3 style="font-size:var(--fs-base);font-weight:600"></h3>
            <button class="btn btn-ghost btn-icon" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="drawer-body"></div>
        </div>`;
      document.body.appendChild(drawerRoot);
      drawerRoot.addEventListener("click", (e) => { if (e.target === drawerRoot) drawerClose(); });
      drawerRoot.querySelector("[aria-label='Close']").addEventListener("click", drawerClose);
    }
    drawerRoot.querySelector("h3").textContent = title;
    drawerRoot.querySelector(".drawer-body").innerHTML = bodyHtml;
    drawerRoot.classList.add("open");
    document.body.style.overflow = "hidden";
    return drawerRoot;
  }

  function drawerClose() {
    if (!drawerRoot) return;
    drawerRoot.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { close(); drawerClose(); }
  });

  FB.modal = { open, close, confirm };
  FB.drawer = { open: drawerOpen, close: drawerClose };
})();
