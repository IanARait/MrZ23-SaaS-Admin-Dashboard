/* dashboard.js - Main dashboard page logic */
window.FB = window.FB || {};
(() => {
  "use strict";

  function init() {
    const shell = FB.app.ready({ active: "dashboard", crumb: ["Dashboard"], title: "Dashboard" });

    const totalRevenue = FB.invoices.reduce((s, i) => {
      const sub = i.items.reduce((a, it) => a + it.qty * it.rate, 0);
      return s + sub + sub * (i.taxRate || 0.1);
    }, 0);
    const paidRevenue = FB.invoices.filter((i) => i.status === "paid").reduce((s, i) => {
      const sub = i.items.reduce((a, it) => a + it.qty * it.rate, 0);
      return s + sub + sub * (i.taxRate || 0.1);
    }, 0);
    const activeUsers = FB.users.filter((u) => u.status === "active").length;
    const totalOrders = FB.customers.reduce((s, c) => s + c.orders, 0);
    const paidCount = FB.invoices.filter((i) => i.status === "paid").length;
    const convRate = FB.invoices.length > 0 ? ((paidCount / FB.invoices.length) * 100).toFixed(1) : "0";

    const stats = [
      { label: "Revenue", value: Math.round(paidRevenue), prefix: "$", icon: "fa-dollar-sign", color: "var(--success)", trend: 12.5, trendNote: "vs last month", spark: { values: [32, 45, 38, 52, 48, 61, 55, 72, 65, 80, 75, 89], color: "var(--success)" } },
      { label: "Users", value: activeUsers, icon: "fa-users", color: "var(--accent)", trend: 8.2, trendNote: "vs last month", spark: { values: [120, 145, 132, 160, 155, 178, 172, 195, 188, 210, 205, 225], color: "var(--accent)" } },
      { label: "Orders", value: totalOrders, icon: "fa-cart-shopping", color: "var(--warning)", trend: 15.4, trendNote: "vs last month", spark: { values: [200, 235, 210, 265, 245, 290, 275, 310, 298, 340, 325, 365], color: "var(--warning)" } },
      { label: "Conversion", value: parseFloat(convRate), suffix: "%", decimals: 1, icon: "fa-chart-line", color: "var(--info)", trend: 2.8, trendNote: "vs last month", spark: { values: [4.2, 4.8, 4.5, 5.1, 4.9, 5.6, 5.3, 6.0, 5.8, 6.2, 6.0, 6.4], color: "var(--info)" } },
    ];

    const statsEl = document.getElementById("statCards");
    if (statsEl) {
      statsEl.innerHTML = stats.map((s) => FB.ui.statCard(s)).join("");
      statsEl.classList.add("stagger");
      FB.ui.bindStatCards(statsEl);
    }

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const revenueData = [18200, 22400, 19800, 24600, 21300, 28500, 25800, 31200, 28900, 34500, 32100, 38200];
    const expenseData = [12400, 14200, 13100, 15800, 14600, 17200, 16100, 19400, 18200, 21100, 19800, 23500];

    let chartRange = 12;
    function renderRevenueChart() {
      const labels = months.slice(-chartRange);
      const rev = revenueData.slice(-chartRange);
      const exp = expenseData.slice(-chartRange);
      const profit = rev.map((v, i) => v - exp[i]);
      FB.charts.build("revenueChart", FB.charts.multiLine({
        labels,
        series: [
          { label: "Revenue", values: rev, color: "#818CF8" },
          { label: "Expenses", values: exp, color: "#F87171" },
          { label: "Profit", values: profit, color: "#34D399" },
        ],
        yFmt: (v) => "$" + (v / 1000).toFixed(0) + "k",
      }));
    }
    renderRevenueChart();

    document.querySelectorAll("[data-range]").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.closest("[role='tablist']")?.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
        btn.parentElement.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        chartRange = parseInt(btn.dataset.range);
        renderRevenueChart();
      });
    });

    const categories = {};
    FB.products.forEach((p) => { categories[p.category] = (categories[p.category] || 0) + p.sold; });
    const catLabels = Object.keys(categories);
    const catValues = Object.values(categories);
    const catColors = ["#818CF8", "#A78BFA", "#34D399", "#FBBF24", "#38BDF8", "#FB7185"];

    FB.charts.build("categoryChart", FB.charts.donut({
      labels: catLabels,
      values: catValues,
      colors: catColors.slice(0, catLabels.length),
    }));

    const legendEl = document.getElementById("categoryLegend");
    if (legendEl) {
      legendEl.innerHTML = catLabels.map((l, i) => {
        const pct = ((catValues[i] / catValues.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:var(--fs-sm)">
          <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:${catColors[i]};flex-shrink:0"></span>${FB.util.escapeHtml(l)}</span>
          <span style="font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--muted)">${pct}%</span>
        </div>`;
      }).join("");
    }

    const userMonths = months.slice(-12);
    const newUsers = [820, 950, 880, 1120, 1050, 1340, 1280, 1520, 1450, 1680, 1620, 1890];
    FB.charts.build("usersChart", FB.charts.lineArea({
      labels: userMonths,
      values: newUsers,
      color: "#818CF8",
    }));

    const feedEl = document.getElementById("activityFeed");
    if (feedEl) {
      const activities = [
        { icon: "fa-cart-shopping", type: "order", text: `<b>New order</b> from Acme Corp — $2,450`, time: "2 min ago" },
        { icon: "fa-user-plus", type: "user", text: `<b>${FB.users[3]?.name || "New user"}</b> joined workspace`, time: "15 min ago" },
        { icon: "fa-check-circle", type: "payment", text: `<b>Task completed</b> — ${FB.tasks[0]?.title || "Review design"}`, time: "1 hour ago" },
        { icon: "fa-credit-card", type: "order", text: `Payment <b>$1,200</b> from NovaTech`, time: "2 hours ago" },
        { icon: "fa-circle-exclamation", type: "alert", text: `Invoice INV-20260003 <b>overdue</b>`, time: "3 hours ago" },
      ];
      feedEl.innerHTML = `<div class="activity-list">${activities.map((a) => `
        <div class="activity-item">
          <span class="activity-icon ${a.type}"><i class="fa-solid ${a.icon}"></i></span>
          <div class="activity-text">${a.text}</div>
          <span class="activity-time">${a.time}</span>
        </div>`).join("")}</div>`;
    }

    const topEl = document.getElementById("topProducts");
    if (topEl) {
      const top = [...FB.products].sort((a, b) => b.sold - a.sold).slice(0, 5);
      topEl.innerHTML = `<div class="product-list">${top.map((p, i) => `
        <div class="product-item">
          <span class="product-rank">${i + 1}</span>
          <span class="avatar-sm" style="background:${p.color};border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;width:26px;height:26px;flex-shrink:0"><i class="fa-solid ${p.icon}"></i></span>
          <div class="product-info">
            <strong>${FB.util.escapeHtml(p.name)}</strong>
            <div style="font-size:var(--fs-xs);color:var(--muted)">${FB.util.escapeHtml(p.category)}</div>
          </div>
          <span class="product-revenue">${p.sold.toLocaleString()} sold</span>
        </div>`).join("")}</div>`;
    }

    const schedEl = document.getElementById("upcomingSchedule");
    if (schedEl) {
      const upcoming = FB.events.slice(0, 5);
      schedEl.innerHTML = upcoming.length ? `<div class="schedule-list">${upcoming.map((ev) => {
        const d = new Date(ev.date);
        return `<div class="schedule-item">
          <span style="width:8px;height:8px;border-radius:50%;background:${ev.color};flex-shrink:0"></span>
          <div class="schedule-info">
            <strong>${FB.util.escapeHtml(ev.title)}</strong>
            <div class="sub">${ev.date} · ${ev.time}</div>
          </div>
          <span class="badge badge-neutral">${ev.duration}</span>
        </div>`;
      }).join("")}</div>` : '<p style="font-size:var(--fs-sm);color:var(--muted);padding:var(--sp-3)">No upcoming events</p>';
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
