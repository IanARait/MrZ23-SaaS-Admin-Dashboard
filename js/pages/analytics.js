window.FB = window.FB || {};
(() => {
  "use strict";

  function init() {
    const shell = FB.app.ready({ active: "analytics", crumb: ["Dashboard", "Analytics"], title: "Analytics" });

    const stats = [
      { label: "Page Views", value: 284592, icon: "fa-eye", color: "var(--accent)", trend: 18.3, trendNote: "vs last period", spark: { values: [18400,19200,21500,20800,23400,22100,25600,24200,27100,26400,28900,28450], color: "var(--accent)" } },
      { label: "Bounce Rate", value: 32.4, suffix: "%", decimals: 1, icon: "fa-arrow-right-from-bracket", color: "var(--danger)", trend: -5.1, trendNote: "vs last period", spark: { values: [38.2,37.5,36.1,35.8,34.9,34.2,33.8,33.5,33.1,32.8,32.6,32.4], color: "var(--danger)" } },
      { label: "Avg Session", value: 272, prefix: "", suffix: "", decimals: 0, icon: "fa-clock", color: "var(--success)", trend: 12.8, trendNote: "vs last period", spark: { values: [195,205,218,225,235,240,248,252,258,263,268,272], color: "var(--success)" } },
      { label: "Goal Completions", value: 1847, icon: "fa-bullseye", color: "var(--warning)", trend: 22.6, trendNote: "vs last period", spark: { values: [980,1050,1120,1180,1260,1340,1420,1510,1600,1690,1770,1847], color: "var(--warning)" } },
    ];

    const statsEl = document.getElementById("analyticsStats");
    if (statsEl) {
      statsEl.innerHTML = stats.map(function (s) {
        return FB.ui.statCard(s);
      }).join("");
      statsEl.classList.add("stagger");
      statsEl.querySelectorAll(":scope > *").forEach(function (el, i) { el.style.setProperty("--i", i); });
      FB.ui.bindStatCards(statsEl);
    }

    // Avg Session display fix: show as "4m 32s" format in the stat value after animation
    setTimeout(function () {
      var sessionCard = statsEl ? statsEl.children[2] : null;
      if (sessionCard) {
        var valEl = sessionCard.querySelector(".stat-value");
        if (valEl) valEl.textContent = "4m 32s";
      }
    }, 1100);

    // Traffic sources bar chart
    FB.charts.build("trafficChart", FB.charts.bars({
      labels: ["Direct", "Organic", "Referral", "Social", "Email"],
      series: [
        { label: "Visitors", values: [82400, 74200, 51300, 42100, 34600], color: "#6366F1" },
      ],
      yFmt: function (v) { return (v / 1000).toFixed(0) + "k"; },
    }));

    // User growth line chart
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    FB.charts.build("userGrowthChart", FB.charts.lineArea({
      labels: months,
      values: [820, 950, 880, 1120, 1050, 1340, 1280, 1520, 1450, 1680, 1620, 1890],
      color: "#8B5CF6",
    }));

    // Revenue vs Expenses
    var revData = [18200, 22400, 19800, 24600, 21300, 28500, 25800, 31200, 28900, 34500, 32100, 38200];
    var expData = [12400, 14200, 13100, 15800, 14600, 17200, 16100, 19400, 18200, 21100, 19800, 23500];
    var revChartRange = 12;

    function renderRevExpChart() {
      var lbls = months.slice(-revChartRange);
      var rev = revData.slice(-revChartRange);
      var exp = expData.slice(-revChartRange);
      FB.charts.build("revExpChart", FB.charts.multiLine({
        labels: lbls,
        series: [
          { label: "Revenue", values: rev, color: "#6366F1" },
          { label: "Expenses", values: exp, color: "#EF4444" },
        ],
        yFmt: function (v) { return "$" + (v / 1000).toFixed(0) + "k"; },
      }));
    }
    renderRevExpChart();

    document.getElementById("revRange").addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      btn.parentElement.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      revChartRange = parseInt(btn.dataset.range);
      renderRevExpChart();
    });

    // Sales by category donut
    var categories = {};
    FB.products.forEach(function (p) { categories[p.category] = (categories[p.category] || 0) + p.sold; });
    var catLabels = Object.keys(categories);
    var catValues = Object.values(categories);
    var catColors = ["#6366F1", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#06B6D4"];

    FB.charts.build("salesCatChart", FB.charts.donut({
      labels: catLabels,
      values: catValues,
      colors: catColors.slice(0, catLabels.length),
    }));

    var legendEl = document.getElementById("salesCatLegend");
    if (legendEl) {
      var total = catValues.reduce(function (a, b) { return a + b; }, 0);
      legendEl.innerHTML = catLabels.map(function (l, i) {
        var pct = ((catValues[i] / total) * 100).toFixed(1);
        return '<div class="donut-row"><span><span class="dr-dot" style="background:' + catColors[i] + '"></span>' + FB.util.escapeHtml(l) + '</span><span class="dr-val">' + pct + '%</span></div>';
      }).join("");
    }

    // Date range selector (cosmetic only)
    document.getElementById("dateRange").addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      btn.parentElement.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      FB.toast.info("Showing data for the last " + btn.textContent);
    });

    // Conversion Funnel
    var funnelData = [
      { label: "Visits", value: 284592, pct: 100, color: "#6366F1" },
      { label: "Sign-ups", value: 24892, pct: 8.7, color: "#8B5CF6" },
      { label: "Activated", value: 18234, pct: 6.4, color: "#EC4899" },
      { label: "Subscribed", value: 8249, pct: 2.9, color: "#10B981" },
    ];

    var funnelEl = document.getElementById("funnelContainer");
    if (funnelEl) {
      var maxVal = funnelData[0].value;
      funnelEl.innerHTML = funnelData.map(function (stage) {
        var widthPct = Math.max((stage.value / maxVal) * 100, 20);
        return '<div class="funnel-stage">' +
          '<div style="display:flex;justify-content:space-between;font-size:var(--fs-sm);font-weight:600">' +
            '<span>' + FB.util.escapeHtml(stage.label) + '</span>' +
            '<span style="color:var(--muted)">' + stage.value.toLocaleString() + ' (' + stage.pct + '%)</span>' +
          '</div>' +
          '<div class="funnel-bar" style="width:' + widthPct + '%;background:' + stage.color + '">' +
            stage.value.toLocaleString() +
          '</div>' +
        '</div>';
      }).join("");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
