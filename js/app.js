/* ==========================================================================
   app.js - application shell: auth guard, sidebar/topbar injection, dropdowns,
   global search (Ctrl+K), notifications, demo controls, DataTable component,
   shared widgets (stat cards, sparklines, count-up).
   Every protected page calls: FB.app.ready({ active, crumb, title }) then
   renders into `.page-content`.
   ========================================================================== */

window.FB = window.FB || {};

(() => {
  "use strict";

  /* ---------------- Paths ---------------- */
  const AUTH_KEY = "flowboard:auth";

  function rootPath() {
    const p = decodeURIComponent(location.pathname).replace(/\\/g, "/");
    const m = p.match(/^(.*\/SaaS-Admin-Dashboard\/)/);
    if (m) return m[1];
    // Fallback: assume we're one level deep
    return p.replace(/[^/]*$/, "../");
  }
  const ROOT = rootPath();
  FB.root = ROOT;
  const go = (path) => { location.href = ROOT + path; };

  /* ---------------- Auth ---------------- */
  FB.auth = {
    user() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; } },
    require() {
      if (!FB.auth.user()) go("auth/login.html");
    },
    logout() {
      localStorage.removeItem(AUTH_KEY);
      go("auth/login.html");
    },
  };

  /* ---------------- Icons / nav definition ---------------- */
  const NAV = [
    { label: "Overview", items: [
      { id: "dashboard", icon: "fa-gauge-high", text: "Dashboard", href: "pages/dashboard.html" },
      { id: "analytics", icon: "fa-chart-line", text: "Analytics", href: "pages/analytics.html" },
      { id: "reports", icon: "fa-file-lines", text: "Reports", href: "pages/reports.html" },
    ]},
    { label: "Manage", items: [
      { id: "projects", icon: "fa-diagram-project", text: "Projects", href: "pages/projects.html" },
      { id: "tasks", icon: "fa-list-check", text: "Tasks", href: "pages/tasks.html" },
      { id: "users", icon: "fa-users-gear", text: "Users", href: "pages/users.html" },
      { id: "customers", icon: "fa-users", text: "Customers", href: "pages/customers.html" },
    ]},
    { label: "Commerce", items: [
      { id: "invoices", icon: "fa-file-invoice-dollar", text: "Invoices", href: "pages/invoices.html" },
      { id: "transactions", icon: "fa-right-left", text: "Transactions", href: "pages/transactions.html" },
      { id: "products", icon: "fa-box-open", text: "Products", href: "pages/products.html" },
    ]},
    { label: "Workspace", items: [
      { id: "messages", icon: "fa-comments", text: "Messages", href: "pages/messages.html", badge: () => FB.conversations.reduce((s, c) => s + c.unread, 0) },
      { id: "calendar", icon: "fa-calendar-days", text: "Calendar", href: "pages/calendar.html" },
    ]},
  ];

  const esc = (s) => FB.util.escapeHtml(s);

  /* ---------------- Shell builders ---------------- */
  function sidebarHtml(activeId) {
    const sections = NAV.map((sec) => `
      <div class="nav-section">
        <div class="nav-section-title">${sec.label}</div>
        ${sec.items.map((it) => {
          let badge = "";
          if (it.badge) {
            const n = it.badge();
            if (n > 0) badge = `<span class="nav-badge">${n > 99 ? "99+" : n}</span>`;
          }
          return `<a class="nav-link ${activeId === it.id ? "active" : ""}" href="${ROOT}${it.href}">
            <i class="fa-solid ${it.icon}"></i><span>${it.text}</span>${badge}</a>`;
        }).join("")}
      </div>`).join("");
    return `
      <div class="sidebar-brand">
        <a href="${ROOT}pages/dashboard.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit">
          <svg class="logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="var(--accent)"/>
            <path d="M7 8h10M7 12h6M7 16h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="brand-text">FlowBoard</span>
        </a>
      </div>
      <nav class="sidebar-nav">${sections}</nav>
      <div class="sidebar-footer">
        <button class="sidebar-collapse-btn" id="sidebarCollapseBtn">
          <i class="fa-solid fa-chevrons-left"></i>
          <span>Collapse</span>
        </button>
      </div>`;
  }

  function notifIcon(n) {
    return `<span class="notif-icon" style="background:${n.bg};color:${n.color}"><i class="fa-solid ${n.icon}"></i></span>`;
  }

  function notifText(n) {
    switch (n.type) {
      case "order": return `<b>${esc(n.actor)}</b> ${esc(n.detail)} <b>${n.amount}</b>`;
      case "payment": return `Payment of <b>${n.amount}</b> received from <b>${esc(n.actor)}</b>`;
      case "message": return `<b>${esc(n.actor)}</b> sent you a message`;
      case "system": return `<b>${esc(n.title)}</b> — deployed successfully`;
      default: return `<b>${esc(n.actor)}</b> ${esc(n.detail)}`;
    }
  }

  function topbarHtml(cfg) {
    const unread = FB.notifications.filter((n) => !n.read).length;
    const crumbs = (cfg.crumb || []).map((c, i, arr) =>
      i === arr.length - 1
        ? `<span style="color:var(--text);font-weight:500">${esc(c)}</span>`
        : `<a href="${ROOT}pages/${c.toLowerCase().replace(/\s+/g, "-")}.html" style="color:var(--muted)">${esc(c)}</a><span style="color:var(--muted);margin:0 4px">/</span>`).join("");

    return `
      <span class="topbar-title" style="display:flex;align-items:center;gap:var(--sp-2)">
        <button class="topbar-icon-btn" id="mobileMenuBtn" aria-label="Open menu" style="display:none"><i class="fa-solid fa-bars"></i></button>
        <span class="breadcrumbs" style="font-size:var(--fs-sm)">${crumbs}</span>
      </span>
      <div class="topbar-right">
        <button class="topbar-search" id="searchTrigger">
          <i class="fa-solid fa-magnifying-glass" style="font-size:var(--fs-xs)"></i>
          <span>Search…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button class="topbar-icon-btn" id="searchTriggerMobile" aria-label="Search" style="display:none"><i class="fa-solid fa-magnifying-glass"></i></button>
        <button class="topbar-icon-btn" id="themeToggle" aria-label="Toggle dark mode">
          <i class="fa-solid ${FB.theme.resolved() === "dark" ? "fa-sun" : "fa-moon"}"></i>
        </button>
        <div class="dropdown" id="notifDropdown" style="position:relative">
          <button class="topbar-icon-btn" data-dd-toggle aria-label="Notifications">
            <i class="fa-regular fa-bell"></i>${unread ? `<span class="dot"></span>` : ""}
          </button>
          <div class="dropdown-menu" style="width:320px;padding:0">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--border)">
              <div>
                <div style="font-size:var(--fs-sm);font-weight:600">Notifications</div>
                <div style="font-size:var(--fs-xs);color:var(--muted)">${unread} unread</div>
              </div>
              <button class="btn btn-ghost btn-sm" id="markAllRead">Mark all read</button>
            </div>
            <div style="max-height:300px;overflow-y:auto" id="notifList">
              ${FB.notifications.slice(0, 5).map((n) => `
                <div style="display:flex;gap:var(--sp-2);padding:var(--sp-2) var(--sp-4);${n.read ? "" : "background:var(--primary-bg)"}">
                  <span style="width:28px;height:28px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:var(--fs-xs);background:${n.bg};color:${n.color}"><i class="fa-solid ${n.icon}"></i></span>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:var(--fs-sm);line-height:1.4">${notifText(n)}</div>
                    <div style="font-size:var(--fs-xs);color:var(--muted);margin-top:2px">${FB.util.timeAgo(n.time)}</div>
                  </div>
                </div>`).join("") || '<p style="padding:var(--sp-4);font-size:var(--fs-sm);color:var(--muted)">No notifications</p>'}
            </div>
            <div style="padding:var(--sp-2) var(--sp-4);border-top:1px solid var(--border)">
              <a class="btn btn-secondary btn-sm" href="${ROOT}pages/notifications.html" style="width:100%">View all</a>
            </div>
          </div>
        </div>
        <div class="dropdown" id="userDropdown" style="position:relative">
          <button data-dd-toggle aria-label="Account menu" style="background:none;border:none;cursor:pointer;padding:0">
            <span class="topbar-avatar" style="background:${FB.settings.profile.color};display:flex;align-items:center;justify-content:center;font-size:var(--fs-xs);font-weight:600;color:#fff">${FB.util.initials(FB.settings.profile.name)}</span>
          </button>
          <div class="dropdown-menu">
            <div style="padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--border)">
              <div style="font-size:var(--fs-sm);font-weight:600">${esc(FB.settings.profile.name)}</div>
              <div style="font-size:var(--fs-xs);color:var(--muted)">${esc(FB.settings.profile.email)}</div>
            </div>
            <div style="padding:var(--sp-1)">
              <a class="dropdown-item" href="${ROOT}pages/profile.html"><i class="fa-solid fa-user"></i>My Profile</a>
              <a class="dropdown-item" href="${ROOT}pages/settings.html"><i class="fa-solid fa-gear"></i>Settings</a>
              <a class="dropdown-item" href="${ROOT}pages/invoices.html"><i class="fa-solid fa-credit-card"></i>Billing</a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" id="logoutBtn" style="color:var(--danger)"><i class="fa-solid fa-arrow-right-from-bracket"></i>Log out</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function searchOverlayHtml() {
    return `
      <div class="search-box" role="dialog" aria-label="Global search">
        <div class="search-input-row">
          <i class="fa-solid fa-magnifying-glass muted"></i>
          <input type="text" id="globalSearchInput" placeholder="Search users, projects, tasks, invoices…" autocomplete="off"/>
          <kbd>Esc</kbd>
        </div>
        <div class="search-results" id="searchResults"></div>
        <div class="search-hints"><span><kbd>↑↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
      </div>`;
  }

  /* ---------------- Search ---------------- */
  function searchSources(q) {
    const ql = q.toLowerCase();
    const match = (s) => s.toLowerCase().includes(ql);
    const out = [];
    FB.users.slice(0, 100).forEach((u) => { if (match(u.name) || match(u.email)) out.push({ group: "Users", icon: "fa-user", title: u.name, sub: `${u.role} · ${u.email}`, href: `pages/users.html?q=${encodeURIComponent(u.name)}` }); });
    FB.customers.forEach((c) => { if (match(c.name) || match(c.company)) out.push({ group: "Customers", icon: "fa-users", title: c.name, sub: c.company, href: `pages/customers.html?q=${encodeURIComponent(c.name)}` }); });
    FB.projects.forEach((p) => { if (match(p.name)) out.push({ group: "Projects", icon: "fa-diagram-project", title: p.name, sub: p.client, href: `pages/project-details.html?id=${p.id}` }); });
    FB.tasks.slice(0, 60).forEach((t) => { if (match(t.title)) out.push({ group: "Tasks", icon: "fa-list-check", title: t.title, sub: t.id, href: `pages/tasks.html?q=${encodeURIComponent(t.title)}` }); });
    FB.invoices.forEach((i2) => { if (match(i2.id)) out.push({ group: "Invoices", icon: "fa-file-invoice", title: i2.id, sub: FB.util.fmtDate(i2.issueDate), href: `pages/invoice-details.html?id=${i2.id}` }); });
    FB.products.forEach((p) => { if (match(p.name) || match(p.sku)) out.push({ group: "Products", icon: "fa-box", title: p.name, sub: p.sku, href: `pages/products.html?q=${encodeURIComponent(p.name)}` }); });
    return out.slice(0, 12);
  }

  function wireSearchOverlay(overlay) {
    const input = overlay.querySelector("#globalSearchInput");
    const resultsEl = overlay.querySelector("#searchResults");
    let results = [];
    let sel = -1;

    const render = () => {
      if (!input.value.trim()) {
        resultsEl.innerHTML = `<div class="search-empty"><i class="fa-solid fa-arrow-pointer" style="font-size:20px;display:block;margin-bottom:8px;color:var(--muted)"></i>Type to search across the workspace…</div>`;
        return;
      }
      results = searchSources(input.value.trim());
      sel = results.length ? 0 : -1;
      if (!results.length) {
        resultsEl.innerHTML = `<div class="search-empty">No results for "<b>${esc(input.value)}</b>"<br/><small>Try a different term.</small></div>`;
        return;
      }
      let lastGroup = "";
      resultsEl.innerHTML = results.map((r, i) => {
        const g = r.group !== lastGroup ? `<div class="search-group-label">${r.group}</div>` : "";
        lastGroup = r.group;
        return g + `<div class="search-result ${i === sel ? "selected" : ""}" data-i="${i}">
          <i class="fa-solid ${r.icon} muted" style="width:18px;text-align:center"></i>
          <div class="sr-main"><div class="sr-title">${esc(r.title)}</div><div class="sr-sub">${esc(r.sub)}</div></div>
          <i class="fa-solid fa-arrow-right muted sr-type" style="font-size:11px"></i></div>`;
      }).join("");
    };

    const commit = (i) => { if (results[i]) go(results[i].href); };
    const openSel = () => commit(sel);

    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); render(); scrollSel(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); scrollSel(); }
      else if (e.key === "Enter") openSel();
    });
    const scrollSel = () => resultsEl.querySelector(".search-result.selected")?.scrollIntoView({ block: "nearest" });

    resultsEl.addEventListener("click", (e) => {
      const item = e.target.closest(".search-result");
      if (item) commit(+item.dataset.i);
    });
    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) closeSearch(overlay); });

    render();
    setTimeout(() => input.focus(), 50);
  }

  function closeSearch(overlay) { overlay.classList.remove("open"); setTimeout(() => overlay.remove(), 200); }

  function openSearch() {
    if (document.querySelector(".search-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "search-overlay open";
    overlay.innerHTML = searchOverlayHtml();
    document.body.appendChild(overlay);
    wireSearchOverlay(overlay);
  }

  /* ---------------- Notifications helpers ---------------- */
  function refreshBadges(shell) {
    const unread = FB.notifications.filter((n) => !n.read).length;
    const dot = shell.querySelector("#notifDropdown .dot");
    if (dot) {
      dot.classList.toggle("hidden", unread === 0);
      dot.textContent = Math.min(unread, 9) + "+";
    }
    const sub = shell.querySelector("#notifDropdown .dropdown-head-sub");
    if (sub) sub.textContent = `${unread} unread`;
    const msgBadge = shell.querySelector('.nav-link[href*="messages"] .nav-badge');
    const msgCount = FB.conversations.reduce((s, c) => s + c.unread, 0);
    if (msgBadge) { if (msgCount) { msgBadge.textContent = msgCount; } else msgBadge.remove(); }
  }

  /* ---------------- Init shell ---------------- */
  function ready(cfg = {}) {
    FB.auth.require();

    const body = document.body;
    const pageContent = body.querySelector(".page-content") || (() => {
      const d = document.createElement("div");
      d.className = "page-content";
      while (body.firstChild) d.appendChild(body.firstChild);
      body.appendChild(d);
      return d;
    })();

    const app = document.createElement("div");
    app.className = "app-shell";
    app.dataset.sidebar = localStorage.getItem("flowboard:sidebar") || "expanded";
    app.innerHTML = `
      <aside class="sidebar" id="appSidebar">${sidebarHtml(cfg.active)}</aside>
      <div class="mobile-overlay" id="mobileOverlay"></div>
      <div class="main">
        <header class="topbar">${topbarHtml(cfg)}</header>
        <main class="content"><div class="page page-content" id="pageRoot"></div></main>
      </div>`;
    pageContent.replaceWith(app);
    // move original page markup into the shell's content area
    const pr = app.querySelector("#pageRoot");
    while (pageContent.firstChild) pr.appendChild(pageContent.firstChild);

    const shell = app;

    /* --- sidebar toggle (desktop collapse / mobile drawer) --- */
    const isMobile = () => window.innerWidth <= 1024;
    const closeDrawer = () => { app.querySelector("#mobileOverlay").classList.remove("open"); app.querySelector(".sidebar").classList.remove("mobile-open"); };
    shell.querySelector("#mobileMenuBtn")?.addEventListener("click", () => {
      app.querySelector("#mobileOverlay").classList.add("open");
      app.querySelector(".sidebar").classList.add("mobile-open");
    });
    shell.querySelector("#mobileOverlay").addEventListener("click", closeDrawer);

    shell.querySelector("#sidebarCollapseBtn").addEventListener("click", () => {
      app.querySelector(".sidebar").classList.toggle("collapsed");
      localStorage.setItem("flowboard:sidebar", app.querySelector(".sidebar").classList.contains("collapsed") ? "collapsed" : "expanded");
    });
    // restore collapsed state
    if (app.dataset.sidebar === "collapsed") app.querySelector(".sidebar").classList.add("collapsed");

    /* --- dropdowns --- */
    shell.querySelectorAll("[data-dd-toggle]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const dd = btn.closest(".dropdown");
        const wasOpen = dd.classList.contains("open");
        shell.querySelectorAll(".dropdown.open").forEach((d) => d.classList.remove("open"));
        if (!wasOpen) dd.classList.add("open");
      });
    });
    document.addEventListener("click", () => shell.querySelectorAll(".dropdown.open").forEach((d) => d.classList.remove("open")));

    /* --- theme --- */
    shell.querySelector("#themeToggle").addEventListener("click", () => {
      FB.theme.toggle();
      const i = shell.querySelector("#themeToggle i");
      i.className = `fa-solid ${FB.theme.resolved() === "dark" ? "fa-sun" : "fa-moon"}`;
    });
    document.addEventListener("fb:themechange", () => {
      const i = shell.querySelector("#themeToggle i");
      if (i) i.className = `fa-solid ${FB.theme.resolved() === "dark" ? "fa-sun" : "fa-moon"}`;
    });

    /* --- notifications --- */
    shell.querySelector("#markAllRead").addEventListener("click", (e) => {
      e.stopPropagation();
      FB.notifications.forEach((n) => (n.read = true));
      FB.db.persist("notifications");
      shell.querySelectorAll(".notif-item.unread").forEach((el) => el.classList.remove("unread"));
      refreshBadges(shell);
      FB.toast.success("All notifications marked as read");
    });

    shell.querySelector("#logoutBtn").addEventListener("click", () => FB.auth.logout());

    /* --- search --- */
    shell.querySelector("#searchTrigger").addEventListener("click", openSearch);
    shell.querySelector("#searchTriggerMobile").addEventListener("click", openSearch);
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
    });

    /* --- demo chip --- */
    const chip = document.createElement("div");
    chip.className = "demo-chip no-print";
    chip.innerHTML = `<span class="live-dot"></span> Portfolio Demo
      <button class="btn btn-secondary btn-sm" id="resetDemoBtn" title="Reset demo data">Reset Data</button>`;
    document.body.appendChild(chip);
    chip.querySelector("#resetDemoBtn").addEventListener("click", async () => {
      if (await FB.modal.confirm({
        title: "Reset demo data?",
        message: "All local changes will be discarded and the original seeded dataset restored.",
        confirmText: "Reset",
        danger: true,
      })) { FB.db.reset(); location.reload(); }
    });

    refreshBadges(shell);

    /* --- prefill search from ?q= handled by pages themselves --- */
    return shell;
  }

  /* ==========================================================================
     Widgets
     ========================================================================== */

  function animateCount(el, to, { prefix = "", suffix = "", decimals = 0, duration = 900 } = {}) {
    const start = performance.now();
    const step = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Number(to * eased).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function sparkline(values, color = "#6366F1", { w = 96, h = 34 } = {}) {
    const max = Math.max(...values), min = Math.min(...values);
    const range = max - min || 1;
    const pts = values.map((v, i) =>
      `${(i / (values.length - 1)) * (w - 4) + 2},${h - 3 - ((v - min) / range) * (h - 6)}`).join(" ");
    const gid = "sg" + Math.random().toString(36).slice(2, 7);
    return `<svg class="stat-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity=".35"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polygon points="2,${h} ${pts} ${w - 2},${h}" fill="url(#${gid})"/></svg>`;
  }

  function statCard({ label, value, prefix = "", suffix = "", decimals = 0, icon, color, trend, trendNote, spark, animate = true }) {
    const trendCls = trend >= 0 ? "up" : "down";
    const trendIcon = trend >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down";
    return `<div class="card stat-card card-hover">
      <div class="stat-top">
        <span class="stat-label">${esc(label)}</span>
        <span class="stat-icon" style="background:${color}22;color:${color}"><i class="fa-solid ${icon}"></i></span>
      </div>
      <div class="stat-value" data-count="${value}" data-prefix="${prefix}" data-suffix="${suffix}" data-decimals="${decimals}" data-animate="${animate}">${prefix}${Number(value).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}</div>
      <div class="stat-foot">
        ${trend !== undefined ? `<span class="trend ${trendCls}"><i class="fa-solid ${trendIcon}"></i>${Math.abs(trend).toFixed(1)}%</span>${trendNote ? `<span class="trend-note">${esc(trendNote)}</span>` : ""}` : ""}
      </div>
      ${spark ? sparkline(spark.values, spark.color || color) : ""}
    </div>`;
  }

  function bindStatCards(scope = document) {
    scope.querySelectorAll(".stat-value[data-animate='true']").forEach((el) => {
      animateCount(el, parseFloat(el.dataset.count), {
        prefix: el.dataset.prefix, suffix: el.dataset.suffix, decimals: +el.dataset.decimals,
      });
      el.dataset.animate = "false";
    });
  }

  /* ==========================================================================
     DataTable component
     ==========================================================================
     cfg = {
       mount,               // element
       data: () => rows,
       columns: [{ key|render, label, sortable, export, width }],
       search: true|string placeholder,
       searchKeys: [..],
       filters: [{ key, label, options:[{value,label}] , match:(row,val)}],
       selectable: bool,
       bulkActions: [{ label, icon, class, action(selectedRows) }],
       rowActions: (row) => html,
       onRowClick: (row),
       pageSize: 10,
       emptyIcon, emptyTitle, emptyText,
       exportName: 'users',
     }
   */
  function dataTable(cfg) {
    const state = { q: "", sortKey: null, sortDir: "asc", page: 1, filters: {}, selected: new Set(), size: cfg.pageSize || 10 };

    const getVal = (row, key) => typeof key === "function" ? key(row) : row[key];

    function filtered() {
      let rows = [...cfg.data()];
      if (state.q) {
        const q = state.q.toLowerCase();
        rows = rows.filter((r) => cfg.searchKeys.some((k) => String(getVal(r, k)).toLowerCase().includes(q)));
      }
      (cfg.filters || []).forEach((f) => {
        const v = state.filters[f.key];
        if (v && v !== "all") {
          rows = rows.filter((r) => f.match ? f.match(r, v) : String(getVal(r, f.key)).toLowerCase() === v.toLowerCase());
        }
      });
      if (state.sortKey) {
        const dir = state.sortDir === "asc" ? 1 : -1;
        rows.sort((a, b) => {
          const va = getVal(a, state.sortKey), vb = getVal(b, state.sortKey);
          if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
          return String(va ?? "").localeCompare(String(vb ?? ""), undefined, { numeric: true }) * dir;
        });
      }
      return rows;
    }

    function render() {
      const rows = filtered();
      const totalPages = Math.max(1, Math.ceil(rows.length / state.size));
      if (state.page > totalPages) state.page = totalPages;
      const pageRows = rows.slice((state.page - 1) * state.size, state.page * state.size);

      const toolbar = [];
      if (cfg.search !== false || cfg.filters?.length || cfg.exportName) {
        toolbar.push(`<div class="table-toolbar">
          <div class="table-toolbar-left">
            ${cfg.search !== false ? `<div class="table-search"><i class="fa-solid fa-magnifying-glass"></i>
              <input class="dt-search" placeholder="${typeof cfg.search === "string" ? esc(cfg.search) : "Search…"}" value="${esc(state.q)}"/></div>` : ""}
            ${(cfg.filters || []).map((f) => `<select class="table-filter-btn" data-filter="${f.key}">
              <option value="all">${f.label}: All</option>
              ${f.options.map((o) => `<option value="${esc(o.value)}" ${state.filters[f.key] === o.value ? "selected" : ""}>${o.label}</option>`).join("")}
            </select>`).join("")}
          </div>
          <div class="table-toolbar-right">
            <span class="table-count">${rows.length.toLocaleString()} rows</span>
            ${cfg.exportName ? `<button class="btn btn-secondary btn-sm dt-export"><i class="fa-solid fa-download"></i> CSV</button>` : ""}
          </div>
        </div>`);
      }

      if (cfg.selectable) {
        toolbar.push(`<div class="bulk-bar ${state.selected.size ? "show" : ""}">
          <span class="bulk-count">${state.selected.size} selected</span>
          ${(cfg.bulkActions || []).map((b, i) => `<button class="btn btn-sm ${b.class || "btn-secondary"}" data-bulk="${i}"><i class="fa-solid ${b.icon}"></i> ${b.label}</button>`).join("")}
          <button class="btn btn-ghost btn-sm" data-clear-selection>Clear</button>
        </div>`);
      }

      if (!rows.length) {
        cfg.mount.innerHTML = toolbar.join("") + `
          <div class="empty-state">
            <i class="fa-solid ${cfg.emptyIcon || "fa-inbox"}"></i>
            <h3>${esc(cfg.emptyTitle || "Nothing here")}</h3>
            <p>${esc(cfg.emptyText || "Try adjusting your search or filters.")}</p>
          </div>`;
        wireToolbar();
        return;
      }

      cfg.mount.innerHTML = toolbar.join("") + `
        <div class="table-scroll"><table class="data-table">
          <thead><tr>
            ${cfg.selectable ? `<th class="col-check"><input type="checkbox" class="checkbox dt-select-all" aria-label="Select page"/></th>` : ""}
            ${cfg.columns.map((c) => `<th class="${c.sortable !== false && c.key ? "sortable" : ""} ${state.sortKey === (c.sortKey || c.key) ? "sorted " + state.sortDir : ""}"
              ${c.width ? `style="width:${c.width}"` : ""} data-sort="${c.sortable !== false && c.key ? (c.sortKey || c.key) : ""}">
              ${esc(c.label)}${c.sortable !== false && c.key ? `<i class="sort-icon fa-solid fa-sort"></i>` : ""}</th>`).join("")}
            ${cfg.rowActions ? `<th style="width:90px;text-align:right">Actions</th>` : ""}
          </tr></thead>
          <tbody>
            ${pageRows.map((r) => `<tr data-id="${esc(r.id)}" class="${state.selected.has(r.id) ? "selected" : ""}">
              ${cfg.selectable ? `<td class="col-check"><input type="checkbox" class="checkbox dt-row-check" data-id="${esc(r.id)}" ${state.selected.has(r.id) ? "checked" : ""}/></td>` : ""}
              ${cfg.columns.map((c) => `<td data-label="${esc(c.label)}">${c.render ? c.render(r) : esc(getVal(r, c.key))}</td>`).join("")}
              ${cfg.rowActions ? `<td class="cell-actions"><div class="row-actions">${cfg.rowActions(r)}</div></td>` : ""}
            </tr>`).join("")}
          </tbody>
        </table></div>
        <div class="table-footer">
          <span class="table-footer-left">${rows.length === 0 ? 0 : (state.page - 1) * state.size + 1}–${Math.min(state.page * state.size, rows.length)} of ${rows.length.toLocaleString()}</span>
          <div class="pagination table-footer-right">
            <button class="page-btn" data-page="prev" ${state.page === 1 ? "disabled" : ""}><i class="fa-solid fa-chevron-left"></i></button>
            ${pageNumbers(totalPages)}
            <button class="page-btn" data-page="next" ${state.page === totalPages ? "disabled" : ""}><i class="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>`;

      wireToolbar();
      wireTable(pageRows, rows);
    }

    function pageNumbers(total) {
      const cur = state.page;
      const want = [...new Set([1, 2, cur - 1, cur, cur + 1, total - 1, total].filter((p) => p >= 1 && p <= total))].sort((a, b) => a - b);
      let html = "", prev = 0;
      for (const p of want) {
        if (p - prev > 1) html += `<span class="page-btn" style="cursor:default">…</span>`;
        html += `<button class="page-btn ${p === cur ? "active" : ""}" data-page="${p}">${p}</button>`;
        prev = p;
      }
      return html;
    }

    function wireToolbar() {
      const search = cfg.mount.querySelector(".dt-search");
      if (search) {
        let deb;
        search.addEventListener("input", () => {
          clearTimeout(deb);
          deb = setTimeout(() => { state.q = search.value; state.page = 1; render(); focusSearch(); }, 180);
        });
      }
      cfg.mount.querySelectorAll("[data-filter]").forEach((sel) => {
        sel.addEventListener("change", () => {
          state.filters[sel.dataset.filter] = sel.value; state.page = 1;
          render();
        });
      });
      const exp = cfg.mount.querySelector(".dt-export");
      if (exp) exp.addEventListener("click", exportCsv);
      cfg.mount.querySelectorAll("[data-bulk]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const act = cfg.bulkActions[+btn.dataset.bulk];
          const rows = cfg.data().filter((r) => state.selected.has(r.id));
          Promise.resolve(act.action(rows)).then(() => { state.selected.clear(); render(); });
        });
      });
      cfg.mount.querySelector("[data-clear-selection]")?.addEventListener("click", () => { state.selected.clear(); render(); });
    }

    let lastSearchInput;
    function focusSearch() {
      const inp = cfg.mount.querySelector(".dt-search");
      if (inp && lastSearchInput === document.activeElement) { inp.focus(); inp.selectionStart = inp.value.length; }
      lastSearchInput = inp;
    }

    function wireTable(pageRows) {
      cfg.mount.querySelectorAll("th[data-sort]").forEach((th) => {
        th.addEventListener("click", () => {
          const k = th.dataset.sort;
          if (!k) return;
          if (state.sortKey === k) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
          else { state.sortKey = k; state.sortDir = "asc"; }
          render();
        });
      });

      cfg.mount.querySelectorAll(".dt-row-check").forEach((cb) => {
        cb.addEventListener("change", () => {
          cb.checked ? state.selected.add(cb.dataset.id) : state.selected.delete(cb.dataset.id);
          render();
        });
      });
      const all = cfg.mount.querySelector(".dt-select-all");
      if (all) {
        all.checked = pageRows.length > 0 && pageRows.every((r) => state.selected.has(r.id));
        all.indeterminate = !all.checked && pageRows.some((r) => state.selected.has(r.id));
        all.addEventListener("change", () => {
          pageRows.forEach((r) => (all.checked ? state.selected.add(r.id) : state.selected.delete(r.id)));
          render();
        });
      }

      cfg.mount.querySelectorAll(".page-btn[data-page]").forEach((b) => {
        b.addEventListener("click", () => {
          const p = b.dataset.page;
          if (p === "prev") state.page--;
          else if (p === "next") state.page++;
          else state.page = +p;
          render();
        });
      });

      if (cfg.onRowClick) {
        cfg.mount.querySelectorAll("tbody tr").forEach((tr) => {
          tr.addEventListener("click", (e) => {
            if (e.target.closest(".checkbox, .row-actions, .badge")) return;
            const row = cfg.data().find((r) => r.id === tr.dataset.id);
            row && cfg.onRowClick(row);
          });
        });
      }
    }

    function exportCsv() {
      const rows = filtered();
      const cols = cfg.columns.filter((c) => c.export !== false);
      const line = (arr) => arr.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",");
      const csv = [line(cols.map((c) => c.label))]
        .concat(rows.map((r) => line(cols.map((c) => (typeof c.export === "function" ? c.export(r) : getVal(r, c.key))))))
        .join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${cfg.exportName}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      FB.toast.success(`Exported ${rows.length} rows`);
    }

    render();
    return {
      refresh: render,
      setQuery: (q) => { state.q = q; state.page = 1; render(); },
      state,
    };
  }

  /* ---------------- boot ---------------- */
  document.addEventListener("DOMContentLoaded", () => {});

  FB.app = { ready, NAV, refreshBadges };
  FB.ui = { statCard, bindStatCards, sparkline, animateCount };
  FB.dataTable = dataTable;
})();
