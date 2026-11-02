window.FB = window.FB || {};
(() => {
  "use strict";

  function init() {
    var shell = FB.app.ready({ active: "customers", crumb: ["Manage", "Customers"], title: "Customers" });

    var esc = FB.util.escapeHtml;

    function customerFormHtml(c) {
      var v = c || {};
      var nameParts = (v.name || "").split(" ");
      return '<div class="form-grid">' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">First Name <span class="req">*</span></label><input class="input" name="firstName" value="' + esc(nameParts[0] || "") + '" required/></div>' +
          '<div class="form-group"><label class="form-label">Last Name <span class="req">*</span></label><input class="input" name="lastName" value="' + esc(nameParts.slice(1).join(" ")) + '" required/></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Email <span class="req">*</span></label><input class="input" type="email" name="email" value="' + esc(v.email || "") + '" required/></div>' +
          '<div class="form-group"><label class="form-label">Phone</label><input class="input" name="phone" value="' + esc(v.phone || "") + '"/></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Company</label><input class="input" name="company" value="' + esc(v.company || "") + '"/></div>' +
          '<div class="form-group"><label class="form-label">Location</label><input class="input" name="location" value="' + esc(v.location || "") + '"/></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Status</label>' +
          '<select class="select" name="status">' +
            ["active","inactive","lead"].map(function (s) { return '<option value="' + s + '"' + (v.status === s ? " selected" : "") + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>'; }).join("") +
          '</select></div>' +
      '</div>';
    }

    function validateForm(panel) {
      var valid = true;
      panel.querySelectorAll("[required]").forEach(function (inp) {
        var group = inp.closest(".form-group");
        if (!inp.value.trim()) { group.classList.add("error"); valid = false; }
        else if (inp.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)) { group.classList.add("error"); valid = false; }
        else { group.classList.remove("error"); }
      });
      return valid;
    }

    function openCustomerModal(customer) {
      var isEdit = !!customer;
      FB.modal.open({
        title: isEdit ? "Edit Customer" : "Add Customer",
        sub: isEdit ? "Update customer details" : "Add a new customer to your records",
        body: customerFormHtml(customer),
        footer: '<button class="btn btn-secondary" data-act="cancel">Cancel</button><button class="btn btn-primary" data-act="save">' + (isEdit ? "Save Changes" : "Add Customer") + '</button>',
      });
      document.querySelector(".modal-footer").addEventListener("click", function (e) {
        var btn = e.target.closest("[data-act]");
        if (!btn) return;
        if (btn.dataset.act === "cancel") { FB.modal.close(); return; }
        var panel = document.querySelector(".modal");
        if (!validateForm(panel)) return;
        var data = {};
        panel.querySelectorAll("input, select").forEach(function (el) { data[el.name] = el.value; });
        var fullName = data.firstName + " " + data.lastName;
        if (isEdit) {
          FB.db.update("customers", customer.id, { name: fullName, email: data.email, phone: data.phone, company: data.company, location: data.location, status: data.status });
          FB.toast.success("Customer updated successfully");
        } else {
          var colors = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#06B6D4","#3B82F6"];
          FB.db.add("customers", {
            id: FB.util.uid("CU"),
            name: fullName,
            email: data.email,
            phone: data.phone,
            company: data.company || "",
            location: data.location || "",
            orders: 0,
            totalSpent: 0,
            status: data.status || "lead",
            joined: new Date().toISOString(),
            color: colors[Math.floor(Math.random() * colors.length)],
          });
          FB.toast.success("Customer added successfully");
        }
        FB.modal.close();
        table.refresh();
      });
    }

    document.getElementById("addCustBtn").addEventListener("click", function () { openCustomerModal(null); });

    function customerDrawer(c) {
      var rows = [
        ["Company", c.company || "\u2014"],
        ["Phone", c.phone || "\u2014"],
        ["Location", c.location || "\u2014"],
        ["Orders", String(c.orders)],
        ["Total Spent", FB.util.money(c.totalSpent)],
        ["Status", c.status],
        ["Joined", FB.util.fmtDate(c.joined)],
      ];
      var detailRows = rows.map(function (pair) {
        var label = pair[0];
        var value = pair[1];
        var valHtml = label === "Status" ? FB.util.statusBadge(c.status) : esc(value);
        return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">' + esc(label) + '</span><span style="font-weight:600;font-size:var(--fs-md)">' + valHtml + '</span></div>';
      }).join("");

      var html = '<div style="display:flex;flex-direction:column;gap:var(--sp-5)">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-4)">' +
          FB.util.avatarHtml(c, "lg") +
          '<div><div style="font-weight:700;font-size:var(--fs-lg)">' + esc(c.name) + '</div><div style="color:var(--muted);font-size:var(--fs-md)">' + esc(c.email) + '</div>' +
          '<div style="margin-top:6px">' + FB.util.statusBadge(c.status) + '</div></div>' +
        '</div>' +
        '<div style="display:grid;gap:0">' + detailRows + '</div>' +
      '</div>';
      FB.drawer.open("Customer Profile", html);
    }

    var table = FB.dataTable({
      mount: document.getElementById("customersTable"),
      data: function () { return FB.customers; },
      columns: [
        { key: "name", label: "Customer", sortable: true, render: function (r) {
          return '<div class="cell-user">' + FB.util.avatarHtml(r) +
            '<div class="cell-user-main"><div class="cell-name">' + esc(r.name) + '</div><div class="cell-sub">' + esc(r.company) + '</div></div></div>';
        }},
        { key: "company", label: "Company", sortable: true, export: true },
        { key: "phone", label: "Phone", sortable: false, export: true },
        { key: "orders", label: "Orders", sortable: true },
        { key: "totalSpent", label: "Total Spent", sortable: true, render: function (r) { return FB.util.money(r.totalSpent); }, export: function (r) { return r.totalSpent; } },
        { key: "status", label: "Status", sortable: true, render: function (r) { return FB.util.statusBadge(r.status); }, export: function (r) { return r.status; } },
        { key: "joined", label: "Last Activity", sortable: true, render: function (r) { return FB.util.timeAgo(r.joined); }, export: function (r) { return FB.util.fmtDate(r.joined); } },
      ],
      search: "Search customers…",
      searchKeys: ["name", "company", "email"],
      filters: [
        { key: "status", label: "Status", options: [{ value: "active", label: "Active" },{ value: "inactive", label: "Inactive" },{ value: "lead", label: "Lead" }] },
      ],
      selectable: true,
      bulkActions: [
        { label: "Export", icon: "fa-download", action: function () { document.querySelector(".dt-export")?.click(); } },
        { label: "Delete", icon: "fa-trash", class: "btn-danger", action: async function (rows) {
          if (await FB.modal.confirm({ title: "Delete customers?", message: "This will remove " + rows.length + " customer(s) permanently.", confirmText: "Delete", danger: true })) {
            rows.forEach(function (r) { FB.db.remove("customers", r.id); });
            FB.toast.success(rows.length + " customer(s) deleted");
            table.refresh();
          }
        }},
      ],
      rowActions: function (r) {
        return '<button class="btn-icon" data-tip="View" data-action="view"><i class="fa-solid fa-eye"></i></button>' +
          '<button class="btn-icon" data-tip="Edit" data-action="edit"><i class="fa-solid fa-pen"></i></button>' +
          '<button class="btn-icon" data-tip="Delete" data-action="delete"><i class="fa-solid fa-trash"></i></button>';
      },
      pageSize: 10,
      exportName: "customers",
      emptyIcon: "fa-users",
      emptyTitle: "No customers found",
      emptyText: "Try adjusting your search or filter criteria.",
    });

    document.getElementById("customersTable").addEventListener("click", function (e) {
      var actionBtn = e.target.closest("[data-action]");
      if (!actionBtn) return;
      var tr = actionBtn.closest("tr");
      if (!tr) return;
      var customer = FB.db.find("customers", tr.dataset.id);
      if (!customer) return;
      var action = actionBtn.dataset.action;
      if (action === "view") { customerDrawer(customer); }
      else if (action === "edit") { openCustomerModal(customer); }
      else if (action === "delete") {
        FB.modal.confirm({ title: "Delete customer?", message: "Are you sure you want to delete " + esc(customer.name) + "? This cannot be undone.", confirmText: "Delete", danger: true }).then(function (ok) {
          if (ok) { FB.db.remove("customers", customer.id); FB.toast.success("Customer deleted"); table.refresh(); }
        });
      }
    });

    document.getElementById("exportCustBtn").addEventListener("click", function () {
      document.querySelector(".dt-export")?.click();
    });

    var params = new URLSearchParams(location.search);
    var q = params.get("q");
    if (q) table.setQuery(q);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
