/* auth.js - shared behavior for auth/ pages: theme toggle, password
   visibility, validation helpers, fake session handling. */

window.FB = window.FB || {};

(() => {
  "use strict";

  const AUTH_KEY = "flowboard:auth";
  const DEMO = { email: "admin@flowboard.test", password: "password" };

  FB.authPage = {
    demo: DEMO,
    user() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; } },
    signIn(email, remember) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ email, at: Date.now(), remember: !!remember }));
      location.href = "../pages/dashboard.html";
    },
    signOut() { localStorage.removeItem(AUTH_KEY); },
    requireAuth() {
      // Used by login/register: bounce to dashboard if already signed in
      if (FB.authPage.user()) location.replace("../pages/dashboard.html");
    },
    guestOnly() { FB.authPage.requireAuth(); },
  };

  /* Password visibility toggles */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pw-toggle]");
    if (!btn) return;
    const input = btn.parentElement.querySelector("input");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.innerHTML = `<i class="fa-solid ${show ? "fa-eye-slash" : "fa-eye"}"></i>`;
  });

  /* Simple field validation helper */
  FB.validate = {
    email(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
    setError(input, msg) {
      const group = input.closest(".field");
      if (!group) return;
      group.classList.add("invalid");
      let err = group.querySelector(".field-error");
      if (!err) {
        err = document.createElement("div");
        err.className = "field-error";
        group.appendChild(err);
      }
      err.textContent = msg;
    },
    clearError(form) {
      form.querySelectorAll(".field.invalid").forEach((g) => {
        g.classList.remove("invalid");
      });
    },
  };

  /* Password strength meter */
  function scorePw(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 4);
  }

  document.addEventListener("input", (e) => {
    if (!e.target.matches("[data-pw-meter]")) return;
    const meter = e.target.closest(".form-group").querySelector(".pw-meter");
    if (!meter) return;
    const s = scorePw(e.target.value);
    meter.querySelectorAll(".pw-bar").forEach((b, i) => {
      b.classList.toggle("on", i < s);
      b.style.transitionDelay = `${i * 40}ms`;
    });
    meter.querySelector(".pw-hint").textContent =
      ["Too weak", "Could be stronger", "Good password", "Strong password", "Excellent password"][s];
  });

  /* Theme toggle on auth pages */
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    FB.theme.toggle();
    const i = document.querySelector("#themeToggle i");
    if (i) i.className = `fa-solid ${FB.theme.resolved() === "dark" ? "fa-sun" : "fa-moon"}`;
  });
})();
