window.FB = window.FB || {};
(() => {
  "use strict";

  function init() {
    var shell = FB.app.ready({ active: "users", crumb: ["Manage", "Users"], title: "Users" });

    var esc = FB.util.escapeHtml;

    var userFormHtml = function (u) {
      var v = u || {};
      return '<div class="form-grid">' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">First Name <span class="req">*</span></label><input class="input" name="firstName" value="' + esc((v.name || "").split(" ")[0] || "") + '" required/></div>' +
          '<div class="form-group"><label class="form-label">Last Name <span class="req">*</span></label><input class="input" name="lastName" value="' + esc((v.name || "").split(" ").slice(1).join(" ") || "") + '" required/></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Email <span class="req">*</span></label><input class="input" type="email" name="email" value="' + esc(v.email || "") + '" required/></div>' +
          '<div class="form-group"><label class="form-label">Phone</label><input class="input" name="phone" value="' + esc(v.phone || "") + '"/></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Role <span class="req">*</span></label>' +
            '<select class="select" name="role" required>' +
              ["Admin","Manager","Editor","Viewer"].map(function (r) { return '<option value="' + r + '"' + (v.role === r ? ' selected' : '') + '>' + r + '</option>'; }).join("") +
            '</select></div>' +
          '<div class="form-group"><label class="form-label">Department</label>' +
            '<select class="select" name="department">' +
              ["Engineering","Design","Marketing","Sales","Finance","Operations","Support","HR"].map(function (d) { return '<option value="' + d + '"' + (v.department === d ? ' selected' : '') + '>' + d + '</option>'; }).join("") +
            '</select></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Status</label>' +
          '<select class="select" name="status">' +
            ["active","inactive","suspended"].map(function (s) { return '<option value="' + s + '"' + (v.status === s ? ' selected' : '') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>'; }).join("") +
          '</select></div>' +
      '</div>';
    };

    function validateForm(panel) {
      var valid = true;
      panel.querySelectorAll("[required]").forEach(function (inp) {
        var group = inp.closest(".field");
        if (!inp.value.trim()) { group.classList.add("invalid"); valid = false; }
        else if (inp.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)) { group.classList.add("invalid"); valid = false; }
        else { group.classList.remove("invalid"); }
      });
      return valid;
    }

    function openUserModal(user) {
      var isEdit = !!user;
      FB.modal.open({
        title: isEdit ? "Edit User" : "Add User",
        body: userFormHtml(user),
        footer: '<button class="btn btn-secondary" data-act="cancel">Cancel</button><button class="btn btn-primary" data-act="save">' + (isEdit ? "Save Changes" : "Add User") + '</button>',
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
          FB.db.update("users", user.id, { name: fullName, email: data.email, phone: data.phone, role: data.role, department: data.department, status: data.status });
          FB.toast.success("User updated successfully");
        } else {
          var colors = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#06B6D4","#3B82F6"];
          FB.db.add("users", {
            id: FB.util.uid("U"),
            name: fullName,
            email: data.email,
            phone: data.phone,
            role: data.role,
            department: data.department,
            status: data.status,
            location: "",
            joined: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            color: colors[Math.floor(Math.random() * colors.length)],
          });
          FB.toast.success("User added successfully");
        }
        FB.modal.close();
        table.refresh();
      });
    }

    document.getElementById("addUserBtn").addEventListener("click", function () { openUserModal(null); });

    function userDrawer(user) {
      var html = '<div style="display:flex;flex-direction:column;gap:var(--sp-5)">' +
        '<div style="display:flex;align-items:center;gap:var(--sp-4)">' +
          FB.util.avatarHtml(user, "lg") +
          '<div><div style="font-weight:700;font-size:var(--fs-lg)">' + esc(user.name) + '</div><div style="color:var(--muted);font-size:var(--fs-md)">' + esc(user.email) + '</div>' +
          '<div style="margin-top:6px">' + FB.util.statusBadge(user.status) + '</div></div>' +
        '</div>' +
        '<div style="display:grid;gap:var(--sp-3)">' +
          '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">Phone</span><span style="font-weight:600;font-size:var(--fs-md)">' + esc(user.phone || "â€”") + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">Role</span><span style="font-weight:600;font-size:var(--fs-md)">' + esc(user.role) + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">Department</span><span style="font-weight:600;font-size:var(--fs-md)">' + esc(user.department || "â€”") + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">Location</span><span style="font-weight:600;font-size:var(--fs-md)">' + esc(user.location || "â€”") + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">Joined</span><span style="font-weight:600;font-size:var(--fs-md)">' + FB.util.fmtDate(user.joined) + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:10px 0"><span style="color:var(--muted);font-size:var(--fs-sm)">Last Active</span><span style="font-weight:600;font-size:var(--fs-md)">' + FB.util.timeAgo(user.lastActive) + '</span></div>' +
        '</div>' +
      '</div>';
      FB.drawer.open("User Details", html);
    }

    var table = FB.dataTable({
      mount: document.getElementById("usersTable"),
      data: function () { return FB.users; },
      columns: [
        { key: "name", label: "User", sortable: true, render: function (r) {
          return '<div class="cell-user">' + FB.util.avatarHtml(r) +
            '<div class="cell-user-main"><div class="cell-name">' + esc(r.name) + '</div><div class="cell-sub">' + esc(r.email) + '</div></div></div>';
        }},
        { key: "role", label: "Role", sortable: true },
        { key: "department", label: "Department", sortable: true, export: function (r) { return r.department || ""; } },
        { key: "status", label: "Status", sortable: true, render: function (r) { return FB.util.statusBadge(r.status); }, export: function (r) { return r.status; } },
        { key: "lastActive", label: "Last Active", sortable: true, render: function (r) { return FB.util.timeAgo(r.lastActive); }, export: function (r) { return FB.util.fmtDate(r.lastActive); } },
      ],
      search: "Search usersâ€¦",
      searchKeys: ["name", "email"],
      filters: [
        { key: "role", label: "Role", options: [{ value: "Admin", label: "Admin" },{ value: "Manager", label: "Manager" },{ value: "Editor", label: "Editor" },{ value: "Viewer", label: "Viewer" }], match: function (r, v) { return r.role === v; } },
        { key: "status", label: "Status", options: [{ value: "active", label: "Active" },{ value: "inactive", label: "Inactive" },{ value: "suspended", label: "Suspended" }] },
      ],
      selectable: true,
      bulkActions: [
        { label: "Activate", icon: "fa-check", class: "btn-success", action: function (rows) { rows.forEach(function (r) { FB.db.update("users", r.id, { status: "active" }); }); FB.toast.success(rows.length + " user(s) activated"); table.refresh(); } },
        { label: "Suspend", icon: "fa-ban", class: "btn-danger", action: function (rows) { rows.forEach(function (r) { FB.db.update("users", r.id, { status: "suspended" }); }); FB.toast.warning(rows.length + " user(s) suspended"); table.refresh(); } },
        { label: "Delete", icon: "fa-trash", class: "btn-danger", action: async function (rows) {
          if (await FB.modal.confirm({ title: "Delete users?", message: "This will remove " + rows.length + " user(s) permanently.", confirmText: "Delete", danger: true })) {
            rows.forEach(function (r) { FB.db.remove("users", r.id); });
            FB.toast.success(rows.length + " user(s) deleted");
            table.refresh();
          }
        }},
        { label: "Export", icon: "fa-download", action: function () { document.querySelector(".dt-export")?.click(); } },
      ],
      rowActions: function (r) {
        return '<button class="btn-icon" data-tip="View" data-action="view"><i class="fa-solid fa-eye"></i></button>' +
          '<button class="btn-icon" data-tip="Edit" data-action="edit"><i class="fa-solid fa-pen"></i></button>' +
          '<button class="btn-icon" data-tip="Delete" data-action="delete"><i class="fa-solid fa-trash"></i></button>';
      },
      pageSize: 10,
      exportName: "users",
      emptyIcon: "fa-users",
      emptyTitle: "No users found",
      emptyText: "Try adjusting your search or filter criteria.",
    });

    document.getElementById("usersTable").addEventListener("click", function (e) {
      var actionBtn = e.target.closest("[data-action]");
      if (!actionBtn) return;
      var tr = actionBtn.closest("tr");
      if (!tr) return;
      var user = FB.db.find("users", tr.dataset.id);
      if (!user) return;
      var action = actionBtn.dataset.action;
      if (action === "view") { userDrawer(user); }
      else if (action === "edit") { openUserModal(user); }
      else if (action === "delete") {
        FB.modal.confirm({ title: "Delete user?", message: "Are you sure you want to delete " + esc(user.name) + "? This cannot be undone.", confirmText: "Delete", danger: true }).then(function (ok) {
          if (ok) { FB.db.remove("users", user.id); FB.toast.success("User deleted"); table.refresh(); }
        });
      }
    });

    // Export button in header
    document.getElementById("exportUsersBtn").addEventListener("click", function () {
      document.querySelector(".dt-export")?.click();
    });

    // Prefill search from ?q=
    var params = new URLSearchParams(location.search);
    var q = params.get("q");
    if (q) table.setQuery(q);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
