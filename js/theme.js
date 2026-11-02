/* theme.js - dark mode + accent + density with LocalStorage persistence. */

window.FB = window.FB || {};

(() => {
  "use strict";

  const THEME_KEY = "flowboard:theme";       // 'light' | 'dark' | null (system)
  const ACCENT_KEY = "flowboard:accent";     // indigo|violet|emerald|amber|rose|cyan
  const DENSITY_KEY = "flowboard:density";   // comfortable|compact

  function systemDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function apply() {
    let pref = localStorage.getItem(THEME_KEY) || "dark";
    if (pref === "system") pref = systemDark() ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", pref);

    const accent = localStorage.getItem(ACCENT_KEY);
    if (accent) document.documentElement.setAttribute("data-accent", accent);

    const density = localStorage.getItem(DENSITY_KEY);
    if (density) document.documentElement.setAttribute("data-density", density);
  }

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || "light";
  }

  /** effective resolved theme after system fallback */
  function resolved() {
    return getTheme() === "dark" || (getTheme() === "system" && systemDark()) ? "dark" : "light";
  }

  function toggle() {
    localStorage.setItem(THEME_KEY, resolved() === "dark" ? "light" : "dark");
    apply();
    document.dispatchEvent(new CustomEvent("fb:themechange", { detail: { theme: resolved() } }));
  }

  function setAccent(name) {
    localStorage.setItem(ACCENT_KEY, name);
    apply();
    document.dispatchEvent(new CustomEvent("fb:themechange"));
  }

  function setDensity(mode) {
    localStorage.setItem(DENSITY_KEY, mode);
    apply();
  }

  // React to OS changes while on "system"
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getTheme() === "system") { apply(); document.dispatchEvent(new CustomEvent("fb:themechange")); }
  });

  apply();

  FB.theme = { toggle, setAccent, setDensity, resolved, getTheme };
})();
