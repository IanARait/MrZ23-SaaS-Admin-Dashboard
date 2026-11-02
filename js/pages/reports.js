window.FB = window.FB || {};
(() => {
  "use strict";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let activeReport = "revenue";

  const REPORTS = [
    { id: "revenue", label: "Revenue Report", icon: "fa-dollar-sign", color: "var(--success)", desc: "Track revenue trends over time" },
    { id: "users", label: "User Growth", icon: "fa-users", color: "var(--accent)", desc: "Monitor user acquisition" },
    { id: "sales", label: "Sales Report", icon: "fa-cart-shopping", color: "var(--warning)", desc: "Analyze sales performance" },
    { id: "customers", label: "Customer Report", icon: "fa-user-group", color: "var(--info)", desc: "Understand customer metrics" },
    { id: "projects", label: "Project Performance", icon: "fa-diagram-project", color: "var(--secondary)", desc: "Track project delivery" },
    { id: "expenses", label: "Expense Report", icon: "fa-receipt", color: "var(--danger)", desc: "Monitor spending patterns" },
  ];

  function getReportData(id) {
    switch (id) {
      case "revenue": return {
        labels: months, values: [18200,22400,19800,24600,21300,28500,25800,31200,28900,34500,32100,38200],
        table: months.map((m, i) => ({ label: m, value: [18200,22400,19800,24600,21300,28500,25800,31200,28900,34500,32100,38200][i] })),
      };
      case "users": return {
        labels: months, values: [820,950,880,1120,1050,1340,1280,1520,1450,1680,1620,1890],
        table: months.map((m, i) => ({ label: m, value: [820,950,880,1120,1050,1340,1280,1520,1450,1680,1620,1890][i] })),
      };
      case "sales": return {
        labels: months, values: [320,380,350,410,390,450,420,480,460,520,500,560],
        table: months.map((m, i) => ({ label: m, value: [320,380,350,410,390,450,420,480,460,520,500,560][i] })),
      };
      case "customers": {
        const statuses = {};
        FB.customers.forEach((c) => { statuses[c.status] = (statuses[c.status] || 0) + 1; });
        return { labels: Object.keys(statuses), values: Object.values(statuses), isDonut: true,
          table: Object.entries(statuses).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: v })) };
      }
      case "projects": {
        const statuses = {};
        FB.projects.forEach((p) => { statuses[p.status] = (statuses[p.status] || 0) + 1; });
        return { labels: Object.keys(statuses), values: Object.values(statuses), isDonut: true,
          table: Object.entries(statuses).map(([k, v]) => ({ label: k, value: v })) };
      }
      case "expenses": return {
        labels: months, values: [12400,14200,13100,15800,14600,17200,16100,19400,18200,21100,19800,23500],
        table: months.map((m, i) => ({ label: m, value: [12400,14200,13100,15800,14600,17200,16100,19400,18200,21100,19800,23500][i] })),
      };
    }
  }

  function render() {
    const data = getReportData(activeReport);
    document.getElementById("reportTitle").textContent = REPORTS.find((r) => r.id === activeReport).label;

    if (data.isDonut) {
      const colors = ["#6366F1","#10B981","#F59E0B","#EF4444","#06B6D4","#8B5CF6"];
      FB.charts.build("reportChart", FB.charts.donut({ labels: data.labels, values: data.values, colors: colors.slice(0, data.labels.length) }));
    } else {
      FB.charts.build("reportChart", FB.charts.bars({ labels: data.labels, series: [{ label: "Value", values: data.values, color: "#6366F1" }] }));
    }

    const fmt = activeReport === "revenue" || activeReport === "expenses" ? (v) => FB.util.money(v) : (v) => v.toLocaleString();
    document.getElementById("reportTableWrap").innerHTML = `<table class="data-table"><thead><tr><th>Period</th><th style="text-align:right">Value</th></tr></thead><tbody>
      ${data.table.map((r) => `<tr><td>${r.label}</td><td style="text-align:right;font-weight:700">${fmt(r.value)}</td></tr>`).join("")}
    </tbody></table>`;
  }

  function init() {
    FB.app.ready({ active: "reports", crumb: ["Reports"], title: "Reports" });
    const cardsEl = document.getElementById("reportCards");
    cardsEl.innerHTML = REPORTS.map((r) => `<div class="card card-hover report-card" data-rid="${r.id}">
      <i class="rc-big fa-solid ${r.icon}" style="background:${r.color}18;color:${r.color}"></i>
      <h4>${r.label}</h4><p>${r.desc}</p>
    </div>`).join("");
    cardsEl.querySelectorAll(".report-card").forEach((el) => {
      el.addEventListener("click", () => { activeReport = el.dataset.rid; render(); });
    });
    render();

    document.getElementById("exportReportBtn").addEventListener("click", () => {
      const data = getReportData(activeReport);
      const fmt = activeReport === "revenue" || activeReport === "expenses" ? (v) => "$" + v : (v) => v;
      const csv = ["Period,Value"].concat(data.table.map((r) => `"${r.label}",${fmt(r.value)}`)).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${activeReport}-report.csv`;
      a.click();
      FB.toast.success("Report exported");
    });
  }
  document.addEventListener("DOMContentLoaded", init);
})();
