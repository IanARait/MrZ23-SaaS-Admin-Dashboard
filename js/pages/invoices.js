window.FB = window.FB || {};
(() => {
  "use strict";
  function calcTotal(inv) {
    const sub = inv.items.reduce((s, it) => s + it.qty * it.rate, 0);
    const tax = sub * (inv.taxRate || 0.1);
    return sub + tax;
  }

  function init() {
    FB.app.ready({ active: "invoices", crumb: ["Invoices"], title: "Invoices" });
    const mount = document.getElementById("invoiceTable");
    const params = new URLSearchParams(location.search);
    if (params.get("q")) mount.dataset.q = params.get("q");

    FB.dataTable({
      mount, data: () => FB.invoices,
      columns: [
        { key: "id", label: "Invoice", sortable: true, render: (r) => `<span class="cell-strong">${r.id}</span>` },
        { key: "customerId", label: "Customer", render: (r) => { const c = FB.db.find("customers", r.customerId); return c ? `<div class="cell-user">${FB.util.avatarHtml(c)}<div class="cell-user-main"><div class="cell-name">${FB.util.escapeHtml(c.name)}</div><div class="cell-sub">${FB.util.escapeHtml(c.company)}</div></div></div>` : "â€”"; } },
        { key: "issueDate", label: "Date", render: (r) => FB.util.fmtDate(r.issueDate) },
        { key: "dueDate", label: "Due Date", render: (r) => FB.util.fmtDate(r.dueDate) },
        { key: "amount", label: "Amount", sortable: true, render: (r) => `<span class="cell-strong">${FB.util.money(calcTotal(r))}</span>`, export: (r) => calcTotal(r) },
        { key: "status", label: "Status", render: (r) => FB.util.statusBadge(r.status) },
      ],
      search: "Search invoicesâ€¦",
      searchKeys: ["id"],
      filters: [{ key: "status", label: "Status", options: [
        { value: "paid", label: "Paid" }, { value: "pending", label: "Pending" },
        { value: "overdue", label: "Overdue" }, { value: "draft", label: "Draft" }, { value: "refunded", label: "Refunded" },
      ]}],
      rowActions: (r) => `<button class="btn btn-ghost btn-sm" data-view="${r.id}" data-tip="View"><i class="fa-solid fa-eye"></i></button>
        <button class="btn btn-ghost btn-sm" data-del="${r.id}" data-tip="Delete"><i class="fa-solid fa-trash"></i></button>`,
      pageSize: 10, exportName: "invoices", emptyTitle: "No invoices found", emptyText: "Create your first invoice to get started.",
    });

    mount.addEventListener("click", async (e) => {
      const viewBtn = e.target.closest("[data-view]");
      if (viewBtn) { showInvoice(viewBtn.dataset.view); return; }
      const delBtn = e.target.closest("[data-del]");
      if (delBtn) {
        if (await FB.modal.confirm({ title: "Delete invoice?", message: "This action cannot be undone.", confirmText: "Delete", danger: true })) {
          FB.db.remove("invoices", delBtn.dataset.id);
          mount.querySelector(".dt-search")?.dispatchEvent(new Event("input"));
          FB.toast.success("Invoice deleted");
        }
      }
    });

    document.getElementById("createInvoiceBtn").addEventListener("click", openCreateModal);

    const q = mount.dataset.q;
    if (q) setTimeout(() => { const s = mount.querySelector(".dt-search"); if (s) { s.value = q; s.dispatchEvent(new Event("input")); } }, 100);
  }

  function showInvoice(id) {
    const inv = FB.db.find("invoices", id);
    if (!inv) return;
    const c = FB.db.find("customers", inv.customerId);
    const sub = inv.items.reduce((s, it) => s + it.qty * it.rate, 0);
    const tax = sub * (inv.taxRate || 0.1);
    const total = sub + tax;
    FB.modal.open({
      title: inv.id,
      size: "lg",
      body: `<div class="invoice-sheet">
        <div class="invoice-brand-row">
          <div><div style="font-family:var(--font-display);font-weight:800;font-size:var(--fs-xl)">FlowBoard</div><div class="muted small">Invoice</div></div>
          <div style="text-align:right"><div class="cell-strong">${inv.id}</div><div class="muted small">Issued: ${FB.util.fmtDate(inv.issueDate)}</div><div class="muted small">Due: ${FB.util.fmtDate(inv.dueDate)}</div></div>
        </div>
        <div class="form-row" style="margin-bottom:var(--sp-5)">
          <div><div class="form-label">Bill To</div><div class="bold">${c ? FB.util.escapeHtml(c.name) : "â€”"}</div><div class="muted small">${c ? FB.util.escapeHtml(c.company) + " Â· " + FB.util.escapeHtml(c.email) : ""}</div></div>
          <div style="text-align:right"><div class="form-label">Status</div>${FB.util.statusBadge(inv.status)}</div>
        </div>
        <table class="data-table" style="margin-bottom:var(--sp-4)"><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>
          ${inv.items.map((it) => `<tr><td>${FB.util.escapeHtml(it.desc)}</td><td>${it.qty}</td><td>${FB.util.money(it.rate)}</td><td style="text-align:right;font-weight:600">${FB.util.money(it.qty * it.rate)}</td></tr>`).join("")}
        </tbody></table>
        <div class="invoice-totals">
          <div class="it-row"><span>Subtotal</span><span>${FB.util.money(sub)}</span></div>
          <div class="it-row"><span>Tax (10%)</span><span>${FB.util.money(tax)}</span></div>
          <div class="it-row grand"><span>Total</span><span>${FB.util.money(total)}</span></div>
        </div>`,
      footer: `<button class="btn btn-secondary" onclick="FB.modal.close()">Close</button><button class="btn btn-primary" onclick="window.print()"><i class="fa-solid fa-print"></i> Print</button>`,
    });
  }

  function openCreateModal() {
    const cOpts = FB.customers.map((c) => `<option value="${c.id}">${FB.util.escapeHtml(c.name)}</option>`).join("");
    FB.modal.open({
      title: "Create Invoice", size: "lg",
      body: `<form class="form-grid" id="createInvForm">
        <div class="form-group"><label class="form-label">Customer</label><select class="select" name="customerId">${cOpts}</select></div>
        <div class="form-row"><div class="form-group"><label class="form-label">Issue Date</label><input class="input" type="date" name="issueDate" value="${new Date().toISOString().slice(0,10)}"/></div>
        <div class="form-group"><label class="form-label">Due Date</label><input class="input" type="date" name="dueDate" value="${new Date(Date.now()+30*86400000).toISOString().slice(0,10)}"/></div></div>
        <div class="form-group"><label class="form-label">Notes</label><textarea class="textarea" name="notes" rows="2">Thank you for your business.</textarea></div>
      </form>`,
      footer: `<button class="btn btn-secondary" onclick="FB.modal.close()">Cancel</button><button class="btn btn-primary" id="saveInvBtn">Create</button>`,
    });
    document.getElementById("saveInvBtn").addEventListener("click", () => {
      const f = document.getElementById("createInvForm");
      FB.db.add("invoices", {
        id: `INV-${20260000 + FB.invoices.length + 1}`, customerId: f.customerId.value,
        issueDate: new Date(f.issueDate.value).toISOString(), dueDate: new Date(f.dueDate.value).toISOString(),
        status: "draft", taxRate: 0.1, notes: f.notes.value,
        items: [{ desc: "UI/UX Design Sprint", qty: 1, rate: 4800 }, { desc: "Frontend Development", qty: 1, rate: 6800 }],
      });
      FB.modal.close();
      FB.toast.success("Invoice created");
      location.reload();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
