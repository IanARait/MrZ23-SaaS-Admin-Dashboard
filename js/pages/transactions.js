window.FB = window.FB || {};
(() => {
  "use strict";
  function init() {
    FB.app.ready({ active: "transactions", crumb: ["Transactions"], title: "Transactions" });
    const mount = document.getElementById("txnTable");
    FB.dataTable({
      mount, data: () => FB.transactions,
      columns: [
        { key: "id", label: "Transaction", sortable: true, render: (r) => `<span class="cell-strong">${r.id}</span>` },
        { key: "customer", label: "Customer", render: (r) => FB.util.escapeHtml(r.customer) },
        { key: "description", label: "Description", render: (r) => FB.util.escapeHtml(r.description) },
        { key: "date", label: "Date", sortable: true, render: (r) => FB.util.fmtDate(r.date) },
        { key: "amount", label: "Amount", sortable: true, render: (r) => `<span class="cell-strong">${FB.util.money(r.amount)}</span>` },
        { key: "method", label: "Method", render: (r) => `<span class="badge badge-neutral">${r.method}</span>` },
        { key: "status", label: "Status", render: (r) => FB.util.statusBadge(r.status) },
      ],
      search: "Search transactions…",
      searchKeys: ["id", "customer", "description"],
      filters: [
        { key: "status", label: "Status", options: [
          { value: "succeeded", label: "Succeeded" }, { value: "pending", label: "Pending" },
          { value: "failed", label: "Failed" }, { value: "refunded", label: "Refunded" },
        ]},
        { key: "method", label: "Method", options: [
          { value: "Visa", label: "Visa" }, { value: "Mastercard", label: "Mastercard" },
          { value: "PayPal", label: "PayPal" }, { value: "Bank Transfer", label: "Bank Transfer" },
          { value: "Stripe", label: "Stripe" }, { value: "Apple Pay", label: "Apple Pay" },
        ]},
      ],
      pageSize: 12, exportName: "transactions", emptyTitle: "No transactions found", emptyText: "Transaction history will appear here.",
    });
  }
  document.addEventListener("DOMContentLoaded", init);
})();
