/* charts.js - Chart.js theming + lifecycle helpers. */

window.FB = window.FB || {};

(() => {
  "use strict";

  const registry = new Map(); // canvasId -> { chart, build }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function palette() {
    return {
      text: cssVar("--muted") || "#64748B",
      grid: document.documentElement.getAttribute("data-theme") === "dark"
        ? "rgba(148,163,184,0.12)" : "rgba(100,116,139,0.12)",
      accent: cssVar("--accent") || "#6366F1",
    };
  }

  function applyDefaults() {
    if (!window.Chart) return;
    const p = palette();
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 11.5;
    Chart.defaults.color = p.text;
    Chart.defaults.borderColor = p.grid;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = "circle";
    Chart.defaults.plugins.legend.labels.boxWidth = 7;
    Chart.defaults.plugins.legend.labels.boxHeight = 7;
    Chart.defaults.plugins.tooltip.backgroundColor =
      document.documentElement.getAttribute("data-theme") === "dark" ? "#0B1222" : "#0F172A";
    Chart.defaults.plugins.tooltip.padding = 11;
    Chart.defaults.plugins.tooltip.cornerRadius = 9;
    Chart.defaults.plugins.tooltip.titleFont = { weight: "700", size: 12 };
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.tooltip.boxPadding = 5;
  }

  function build(canvasId, configFactory) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    destroy(canvasId);
    applyDefaults();
    const chart = new Chart(canvas, configFactory(palette()));
    registry.set(canvasId, { chart, build: () => build(canvasId, configFactory) });
    return chart;
  }

  function destroy(canvasId) {
    const entry = registry.get(canvasId);
    if (entry) { entry.chart.destroy(); registry.delete(canvasId); }
  }

  function destroyAll() { [...registry.keys()].forEach(destroy); }

  // Rebuild every registered chart when the theme flips
  document.addEventListener("fb:themechange", () => {
    const builds = [...registry.values()].map((e) => e.build);
    destroyAll();
    builds.forEach((b) => b());
  });

  /* --- common config factories --- */
  function lineArea({ labels, values, color = "#6366F1", yFmt = (v) => v }) {
    return (p) => ({
      type: "line",
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: p.accent,
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height || 200);
            g.addColorStop(0, hexA(color, 0.28));
            g.addColorStop(1, hexA(color, 0));
            return g;
          },
          fill: true,
          tension: 0.42,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: p.accent,
        }],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: { ticks: { callback: (v) => yFmt(v) }, border: { display: false }, grid: { color: p.grid } },
        },
      },
    });
  }

  function multiLine({ labels, series, yFmt = (v) => v }) {
    return (p) => ({
      type: "line",
      data: { labels, datasets: series.map((s) => ({
        label: s.label, data: s.values, borderColor: s.color,
        backgroundColor: s.color, tension: 0.4, borderWidth: 2.5,
        pointRadius: 0, pointHoverRadius: 4,
      })) },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", align: "end" } },
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: { ticks: { callback: (v) => yFmt(v) }, border: { display: false }, grid: { color: p.grid } },
        },
      },
    });
  }

  function bars({ labels, series, stacked = false, yFmt = (v) => v }) {
    return (p) => ({
      type: "bar",
      data: { labels, datasets: series.map((s) => ({
        label: s.label, data: s.values, backgroundColor: s.color,
        borderRadius: 6, maxBarThickness: s.thickness || 26, stack: s.stack || "a",
      })) },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", align: "end" } },
        scales: {
          x: { stacked, grid: { display: false }, border: { display: false } },
          y: { stacked, beginAtZero: true, ticks: { callback: (v) => yFmt(v) }, border: { display: false }, grid: { color: p.grid } },
        },
      },
    });
  }

  function donut({ labels, values, colors }) {
    return (p) => ({
      type: "doughnut",
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 8, spacing: 3 }] },
      options: {
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: { legend: { display: false } },
      },
    });
  }

  function hexA(hex, a) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  FB.charts = { build, destroy, destroyAll, palette, lineArea, multiLine, bars, donut, hexA };
})();
