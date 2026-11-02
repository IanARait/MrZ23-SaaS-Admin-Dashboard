window.FB = window.FB || {};
(() => {
  "use strict";
  let activeSection = "profile";
  const p = FB.settings.profile;

  const SECTIONS = {
    profile() {
      return `<div class="card"><div class="card-body">
        <h3 style="font-family:var(--font-display);font-weight:800;margin-bottom:var(--sp-4)">Profile Settings</h3>
        <form class="form-grid" id="profileForm">
          <div class="form-row">
            <div class="form-group"><label class="form-label">First Name</label><input class="input" name="firstName" value="${FB.util.escapeHtml(p.name.split(" ")[0])}"/></div>
            <div class="form-group"><label class="form-label">Last Name</label><input class="input" name="lastName" value="${FB.util.escapeHtml(p.name.split(" ")[1] || "")}"/></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Email</label><input class="input" type="email" name="email" value="${FB.util.escapeHtml(p.email)}"/></div>
            <div class="form-group"><label class="form-label">Phone</label><input class="input" name="phone" value="${FB.util.escapeHtml(p.phone)}"/></div>
          </div>
          <div class="form-group"><label class="form-label">Job Title</label><input class="input" name="title" value="Workspace Admin"/></div>
          <div class="form-group"><label class="form-label">Bio</label><textarea class="textarea" name="bio" rows="3">${FB.util.escapeHtml(p.bio)}</textarea></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Timezone</label><select class="select" name="timezone"><option selected>${FB.util.escapeHtml(p.timezone)}</option><option>(GMT-05:00) Eastern Time</option><option>(GMT+00:00) UTC</option></select></div>
            <div class="form-group"><label class="form-label">Language</label><select class="select" name="lang"><option selected>English (US)</option><option>Spanish</option><option>French</option><option>German</option></select></div>
          </div>
          <div><button class="btn btn-primary" type="submit">Save Changes</button></div>
        </form>
      </div></div>`;
    },
    security() {
      const sess = FB.settings.security;
      return `<div class="card"><div class="card-body">
        <h3 style="font-family:var(--font-display);font-weight:800;margin-bottom:var(--sp-4)">Security Settings</h3>
        <form class="form-grid" id="pwForm">
          <div class="form-group"><label class="form-label">Current Password</label><input class="input" type="password" name="current" required/></div>
          <div class="form-group"><label class="form-label">New Password</label><input class="input" type="password" name="newPw" required/></div>
          <div class="form-group"><label class="form-label">Confirm Password</label><input class="input" type="password" name="confirm" required/></div>
          <div><button class="btn btn-primary" type="submit">Update Password</button></div>
        </form>
      </div></div>
      <div class="card" style="margin-top:var(--density-gap)"><div class="card-body">
        <h3 style="font-family:var(--font-display);font-weight:800;margin-bottom:var(--sp-4)">Two-Factor Authentication</h3>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-weight:600">Enable 2FA</div><div class="muted small">Add an extra layer of security to your account</div></div>
          <label class="switch"><input type="checkbox" ${sess.twoFactor ? "checked" : ""} id="toggle2fa"/><span class="switch-track"></span></label>
        </div>
      </div></div>
      <div class="card" style="margin-top:var(--density-gap)"><div class="card-body">
        <h3 style="font-family:var(--font-display);font-weight:800;margin-bottom:var(--sp-4)">Login Sessions</h3>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
          <div><div style="font-weight:600">Current Session</div><div class="muted small">Chrome on Windows Â· Active now</div></div>
          <span class="badge badge-success">Active</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0">
          <div><div style="font-weight:600">Safari on iPhone</div><div class="muted small">Last active 2 hours ago</div></div>
          <button class="btn btn-ghost btn-sm" style="color:var(--danger)">Revoke</button>
        </div>
      </div></div>`;
    },
    notifications() {
      const n = FB.settings.notifications;
      return `<div class="card"><div class="card-body">
        <h3 style="font-family:var(--font-display);font-weight:800;margin-bottom:var(--sp-4)">Notification Preferences</h3>
        <div class="section-gap">
          ${[
            { key: "email", label: "Email notifications", desc: "Receive email updates about your account" },
            { key: "push", label: "Push notifications", desc: "Receive browser push notifications" },
            { key: "sms", label: "SMS notifications", desc: "Get text messages for important alerts" },
            { key: "marketing", label: "Marketing emails", desc: "Receive product updates and offers" },
            { key: "digest", label: "Weekly digest", desc: "Get a weekly summary of your activity" },
          ].map((item) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
            <div><div style="font-weight:600">${item.label}</div><div class="muted small">${item.desc}</div></div>
            <label class="switch"><input type="checkbox" data-nkey="${item.key}" ${n[item.key] ? "checked" : ""}/><span class="switch-track"></span></label>
          </div>`).join("")}
        </div>
      </div></div>`;
    },
    appearance() {
      const theme = FB.theme.getTheme();
      const accent = localStorage.getItem("flowboard:accent") || "indigo";
      return `<div class="card"><div class="card-body">
        <h3 style="font-family:var(--font-display);font-weight:800;margin-bottom:var(--sp-4)">Appearance</h3>
        <div class="section-gap">
          <div class="form-group"><label class="form-label">Theme</label>
            <div class="radio-cards">${["light","dark","system"].map((t) => `<label class="radio-card ${theme === t ? "selected" : ""}" data-theme-pick="${t}">
              <input type="radio" name="theme" value="${t}" class="radio" ${theme === t ? "checked" : ""}/>
              <div class="rc-main"><div class="rc-title">${t.charAt(0).toUpperCase() + t.slice(1)}</div></div>
            </label>`).join("")}</div>
          </div>
          <div class="form-group"><label class="form-label">Accent Color</label>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              ${[{ name: "indigo", color: "#6366F1" }, { name: "violet", color: "#8B5CF6" }, { name: "emerald", color: "#10B981" }, { name: "rose", color: "#F43F5E" }, { name: "amber", color: "#F59E0B" }, { name: "sky", color: "#0EA5E9" }].map((a) => `<button class="btn-icon" data-accent="${a.name}" style="width:36px;height:36px;border-radius:99px;background:${a.color};${accent === a.name ? "outline:3px solid var(--text);outline-offset:3px" : ""}" title="${a.name}"></button>`).join("")}
            </div>
          </div>
        </div>
      </div></div>`;
    },
    billing() {
      return `<div class="card" style="border:2px solid var(--accent)"><div class="card-body">
        <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:var(--sp-3)">
          <div><div class="muted small">Current Plan</div><div style="font-family:var(--font-display);font-weight:800;font-size:var(--fs-xl)">Professional</div><div style="font-size:var(--fs-lg);font-weight:700;margin-top:4px">$49<small class="muted">/month</small></div></div>
          <button class="btn btn-secondary">Manage Subscription</button>
        </div>
      </div></div>
      <div class="grid-3" style="margin-top:var(--density-gap)">
        ${[
          { name: "Users", used: 24, limit: 50, icon: "fa-users" },
          { name: "Projects", used: 18, limit: 30, icon: "fa-diagram-project" },
          { name: "Storage", used: 12.5, limit: 50, icon: "fa-hard-drive", unit: "GB" },
        ].map((u) => `<div class="card card-body">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:var(--sp-3)"><i class="fa-solid ${u.icon}" style="color:var(--accent)"></i><span style="font-weight:700">${u.name}</span></div>
          <div class="progress-label"><span>${u.used}${u.unit || ""}</span><span>${u.limit}${u.unit || ""}</span></div>
          <div class="progress"><span style="width:${(u.used / u.limit) * 100}%"></span></div>
        </div>`).join("")}
      </div>
      <div class="card" style="margin-top:var(--density-gap)"><div class="card-body">
        <h3 style="font-family:var(--font-display);font-weight:800;margin-bottom:var(--sp-4)">Available Plans</h3>
        <div class="grid-3">
          ${[
            { name: "Free", price: "$0", features: ["3 users", "5 projects", "1GB storage"] },
            { name: "Starter", price: "$19", features: ["10 users", "15 projects", "10GB storage"] },
            { name: "Enterprise", price: "$99", features: ["Unlimited users", "Unlimited projects", "100GB storage"] },
          ].map((plan) => `<div class="card card-hover" style="text-align:center">
            <div class="card-body"><div style="font-weight:800;margin-bottom:4px">${plan.name}</div><div style="font-family:var(--font-display);font-weight:800;font-size:var(--fs-2xl);margin-bottom:var(--sp-3)">${plan.price}<small class="muted" style="font-size:var(--fs-sm)">/mo</small></div>
            <ul style="list-style:none;padding:0;display:grid;gap:8px;text-align:left;margin-bottom:var(--sp-4)">${plan.features.map((f) => `<li style="display:flex;align-items:center;gap:8px"><i class="fa-solid fa-check" style="color:var(--success);font-size:12px"></i><span class="muted small">${f}</span></li>`).join("")}</ul>
            <button class="btn btn-secondary btn-sm btn-block">Choose Plan</button></div>
          </div>`).join("")}
        </div>
      </div></div>`;
    },
  };

  function render() {
    const content = document.getElementById("settingsContent");
    content.innerHTML = SECTIONS[activeSection]();
    wireEvents();
  }

  function wireEvents() {
    document.getElementById("profileForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      FB.settings.profile.name = `${f.firstName.value} ${f.lastName.value}`.trim();
      FB.settings.profile.email = f.email.value;
      FB.settings.profile.phone = f.phone.value;
      FB.settings.profile.bio = f.bio.value;
      FB.saveSettings();
      FB.toast.success("Profile updated successfully");
    });
    document.getElementById("pwForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      if (f.newPw.value !== f.confirm.value) { FB.toast.error("Passwords do not match"); return; }
      FB.toast.success("Password updated successfully");
      f.reset();
    });
    document.getElementById("toggle2fa")?.addEventListener("change", (e) => {
      FB.settings.security.twoFactor = e.target.checked;
      FB.saveSettings();
      FB.toast.success("Two-factor authentication " + (e.target.checked ? "enabled" : "disabled"));
    });
    document.querySelectorAll("[data-nkey]").forEach((sw) => {
      sw.addEventListener("change", (e) => {
        FB.settings.notifications[sw.dataset.nkey] = e.target.checked;
        FB.saveSettings();
        FB.toast.success("Notification preference saved");
      });
    });
    document.querySelectorAll("[data-theme-pick]").forEach((card) => {
      card.addEventListener("click", () => {
        const val = card.dataset.themePick;
        FB.theme.setAccent ? localStorage.setItem("flowboard:theme", val) : null;
        if (val === "dark" || val === "light" || val === "system") {
          localStorage.setItem("flowboard:theme", val);
          document.documentElement.setAttribute("data-theme", val === "dark" ? "dark" : "light");
          document.dispatchEvent(new CustomEvent("fb:themechange"));
        }
        render();
      });
    });
    document.querySelectorAll("[data-accent]").forEach((btn) => {
      btn.addEventListener("click", () => {
        FB.theme.setAccent(btn.dataset.accent);
        render();
      });
    });
  }

  function init() {
    FB.app.ready({ active: "settings", crumb: ["Settings"], title: "Settings" });
    const hash = location.hash.replace("#", "");
    if (hash && SECTIONS[hash]) activeSection = hash;
    render();
    document.getElementById("settingsNav").addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;
      e.preventDefault();
      activeSection = link.getAttribute("href").replace("#", "");
      document.querySelectorAll("#settingsNav a").forEach((a) => a.classList.remove("active"));
      link.classList.add("active");
      render();
    });
  }
  document.addEventListener("DOMContentLoaded", init);
})();
