window.FB = window.FB || {};
(() => {
  "use strict";

  function init() {
    var shell = FB.app.ready({ active: "projects", crumb: ["Manage", "Projects"], title: "Projects" });

    var esc = FB.util.escapeHtml;
    var currentView = "grid";
    var statusFilter = "all";

    function projectFormHtml(p) {
      var v = p || {};
      var statusOpts = ["Planning","In Progress","On Hold","Completed","Archived"];
      var prioOpts = ["low","medium","high"];
      return '<div class="form-grid">' +
        '<div class="form-group"><label class="form-label">Project Name <span class="req">*</span></label><input class="input" name="name" value="' + esc(v.name || "") + '" required/></div>' +
        '<div class="form-group"><label class="form-label">Client</label><input class="input" name="client" value="' + esc(v.client || "") + '"/></div>' +
        '<div class="form-group"><label class="form-label">Description</label><textarea class="textarea" name="description" rows="3">' + esc(v.description || "") + '</textarea></div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Status</label><select class="select" name="status">' +
            statusOpts.map(function (s) { return '<option value="' + s + '"' + (v.status === s ? " selected" : "") + '>' + s + '</option>'; }).join("") +
          '</select></div>' +
          '<div class="form-group"><label class="form-label">Priority</label><select class="select" name="priority">' +
            prioOpts.map(function (p2) { return '<option value="' + p2 + '"' + (v.priority === p2 ? " selected" : "") + '>' + p2.charAt(0).toUpperCase() + p2.slice(1) + '</option>'; }).join("") +
          '</select></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Budget ($)</label><input class="input" type="number" name="budget" value="' + (v.budget || "") + '"/></div>' +
          '<div class="form-group"><label class="form-label">Due Date</label><input class="input" type="date" name="dueDate" value="' + (v.dueDate ? v.dueDate.slice(0, 10) : "") + '"/></div>' +
        '</div>' +
      '</div>';
    }

    function validateForm(panel) {
      var valid = true;
      panel.querySelectorAll("[required]").forEach(function (inp) {
        var group = inp.closest(".form-group");
        if (!inp.value.trim()) { group.classList.add("error"); valid = false; }
        else { group.classList.remove("error"); }
      });
      return valid;
    }

    function progressForStatus(status) {
      if (status === "Completed") return 100;
      if (status === "Archived") return 100;
      if (status === "Planning") return 10;
      if (status === "On Hold") return 35;
      return 55;
    }

    function openProjectModal(project) {
      var isEdit = !!project;
      FB.modal.open({
        title: isEdit ? "Edit Project" : "Add Project",
        sub: isEdit ? "Update project details" : "Create a new project",
        body: projectFormHtml(project),
        footer: '<button class="btn btn-secondary" data-act="cancel">Cancel</button><button class="btn btn-primary" data-act="save">' + (isEdit ? "Save Changes" : "Add Project") + '</button>',
      });
      document.querySelector(".modal-footer").addEventListener("click", function (e) {
        var btn = e.target.closest("[data-act]");
        if (!btn) return;
        if (btn.dataset.act === "cancel") { FB.modal.close(); return; }
        var panel = document.querySelector(".modal");
        if (!validateForm(panel)) return;
        var data = {};
        panel.querySelectorAll("input, select, textarea").forEach(function (el) { data[el.name] = el.value; });
        var patch = {
          name: data.name,
          client: data.client,
          description: data.description,
          status: data.status,
          priority: data.priority,
          budget: parseInt(data.budget) || 0,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          progress: progressForStatus(data.status),
        };
        if (isEdit) {
          FB.db.update("projects", project.id, patch);
          FB.toast.success("Project updated successfully");
        } else {
          FB.db.add("projects", Object.assign({
            id: FB.util.uid("PRJ"),
            team: [],
            tags: [],
            spent: 0,
            startDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }, patch));
          FB.toast.success("Project created successfully");
        }
        FB.modal.close();
        renderGrid();
        if (table) table.refresh();
      });
    }

    document.getElementById("addProjectBtn").addEventListener("click", function () { openProjectModal(null); });

    function projectDrawer(project) {
      var teamUsers = (project.team || []).map(function (uid) { return FB.db.find("users", uid); }).filter(Boolean);
      var teamHtml = teamUsers.map(function (u) {
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">' +
          FB.util.avatarHtml(u, "sm") +
          '<div><div style="font-weight:600;font-size:var(--fs-md)">' + esc(u.name) + '</div><div style="font-size:var(--fs-xs);color:var(--muted)">' + esc(u.role) + ' · ' + esc(u.department || "") + '</div></div></div>';
      }).join("");

      var projectTasks = FB.tasks.filter(function (t) { return t.projectId === project.id; });
      var tasksHtml = projectTasks.slice(0, 10).map(function (t) {
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">' +
          '<div style="min-width:0;flex:1"><div style="font-weight:600;font-size:var(--fs-md)">' + esc(t.title) + '</div>' +
          '<div style="font-size:var(--fs-xs);color:var(--muted)">' + FB.util.statusBadge(t.status) + ' ' + FB.util.prioBadge(t.priority) + '</div></div></div>';
      }).join("");
      if (!tasksHtml) tasksHtml = '<p style="color:var(--muted);font-size:var(--fs-md);padding:16px 0">No tasks found for this project.</p>';

      var tabsHtml = '<div class="tabs" id="drawerTabs">' +
        '<button class="tab active" data-tab="overview">Overview</button>' +
        '<button class="tab" data-tab="tasks">Tasks <span class="count">' + projectTasks.length + '</span></button>' +
        '<button class="tab" data-tab="team">Team <span class="count">' + teamUsers.length + '</span></button>' +
        '<button class="tab" data-tab="activity">Activity</button>' +
      '</div>';

      var overviewHtml = '<div style="display:grid;gap:var(--sp-3)">' +
        '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">Client</span><span style="font-weight:600;font-size:var(--fs-md)">' + esc(project.client) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">Status</span><span>' + FB.util.statusBadge(project.status) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">Priority</span><span>' + FB.util.prioBadge(project.priority) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">Budget</span><span style="font-weight:600;font-size:var(--fs-md)">' + FB.util.money(project.budget) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">Spent</span><span style="font-weight:600;font-size:var(--fs-md)">' + FB.util.money(project.spent || 0) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted);font-size:var(--fs-sm)">Due Date</span><span style="font-weight:600;font-size:var(--fs-md)">' + (project.dueDate ? FB.util.fmtDate(project.dueDate) : "\u2014") + '</span></div>' +
        '<div style="padding:10px 0"><div class="progress-label"><span>Progress</span><span>' + project.progress + '%</span></div><div class="progress"><span style="width:' + project.progress + '%"></span></div></div>' +
        '<div style="padding:4px 0;font-size:var(--fs-md);color:var(--muted)">' + esc(project.description || "No description provided.") + '</div>' +
      '</div>';

      var bodyHtml = '<div>' + tabsHtml + '<div id="drawerTabContent" style="padding-top:var(--sp-5)">' + overviewHtml + '</div></div>';

      FB.drawer.open(project.name, bodyHtml);

      var tabContent = document.getElementById("drawerTabContent");
      document.getElementById("drawerTabs").addEventListener("click", function (e) {
        var tab = e.target.closest(".tab");
        if (!tab) return;
        document.querySelectorAll("#drawerTabs .tab").forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        var which = tab.dataset.tab;
        if (which === "overview") { tabContent.innerHTML = overviewHtml; }
        else if (which === "tasks") { tabContent.innerHTML = tasksHtml; }
        else if (which === "team") { tabContent.innerHTML = teamHtml || '<p style="color:var(--muted);font-size:var(--fs-md);padding:16px 0">No team members assigned.</p>'; }
        else if (which === "activity") {
          var activityHtml = '<div style="display:grid;gap:var(--sp-3)">' +
            '<div style="font-size:var(--fs-md);color:var(--muted)">Created ' + FB.util.timeAgo(project.createdAt) + '</div>' +
            '<div style="font-size:var(--fs-md);color:var(--muted)">Due ' + (project.dueDate ? FB.util.fmtDate(project.dueDate) : "\u2014") + '</div>' +
            '<div style="font-size:var(--fs-md);color:var(--muted)">' + projectTasks.length + ' tasks total</div>' +
          '</div>';
          tabContent.innerHTML = activityHtml;
        }
      });
    }

    function renderGrid() {
      var gridEl = document.getElementById("gridView");
      var projects = FB.projects;
      if (statusFilter !== "all") {
        projects = projects.filter(function (p) { return p.status === statusFilter; });
      }

      var filterBar = '<div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-4);flex-wrap:wrap">' +
        '<span style="font-weight:600;font-size:var(--fs-sm);color:var(--muted)">Filter:</span>' +
        '<div class="segmented" role="tablist" id="projStatusFilter">' +
          ["all","Planning","In Progress","On Hold","Completed","Archived"].map(function (s) {
            return '<button class="' + (statusFilter === s ? "active" : "") + '" data-filter="' + s + '">' + (s === "all" ? "All" : s) + '</button>';
          }).join("") +
        '</div>' +
      '</div>';

      if (!projects.length) {
        gridEl.innerHTML = filterBar + '<div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-diagram-project"></i></span><div class="empty-title">No projects found</div><p class="empty-text">Try changing the filter or create a new project.</p></div>';
        wireFilter();
        return;
      }

      var cards = projects.map(function (p) {
        var teamUsers = (p.team || []).map(function (uid) { return FB.db.find("users", uid); }).filter(Boolean);
        var avatarStack = teamUsers.slice(0, 4).map(function (u) { return FB.util.avatarHtml(u, "sm"); }).join("");
        var extra = teamUsers.length > 4 ? '<span class="avatar sm" style="background:var(--surface-2);color:var(--muted);font-size:9px">+' + (teamUsers.length - 4) + '</span>' : "";

        return '<div class="card card-hover" style="cursor:pointer" data-project-id="' + esc(p.id) + '">' +
          '<div class="card-body" style="display:grid;gap:var(--sp-3)">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--sp-2)">' +
              '<div style="min-width:0;flex:1"><div style="font-weight:700;font-size:var(--fs-base);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.name) + '</div>' +
              '<div style="font-size:var(--fs-xs);color:var(--muted);margin-top:2px">' + esc(p.client) + '</div></div>' +
            '</div>' +
            '<div style="display:flex;gap:var(--sp-2);flex-wrap:wrap">' + FB.util.statusBadge(p.status) + ' ' + FB.util.prioBadge(p.priority) + '</div>' +
            '<div><div class="progress-label"><span>' + p.progress + '%</span></div><div class="progress"><span style="width:' + p.progress + '%"></span></div></div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
              '<div class="avatar-stack">' + avatarStack + extra + '</div>' +
              '<div style="text-align:right"><div style="font-size:var(--fs-xs);color:var(--muted)">' + (p.dueDate ? FB.util.fmtDate(p.dueDate) : "") + '</div>' +
              '<div style="font-weight:700;font-size:var(--fs-md)">' + FB.util.money(p.budget) + '</div></div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join("");

      gridEl.innerHTML = filterBar + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:var(--density-gap)">' + cards + '</div>';
      wireFilter();
      wireCards();
    }

    function wireFilter() {
      var filterBar = document.getElementById("projStatusFilter");
      if (!filterBar) return;
      filterBar.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        statusFilter = btn.dataset.filter;
        renderGrid();
      });
    }

    function wireCards() {
      document.querySelectorAll("[data-project-id]").forEach(function (card) {
        card.addEventListener("click", function () {
          var proj = FB.db.find("projects", card.dataset.projectId);
          if (proj) projectDrawer(proj);
        });
      });
    }

    // Table view
    var table = null;
    function initTable() {
      table = FB.dataTable({
        mount: document.getElementById("projectsTable"),
        data: function () { return FB.projects; },
        columns: [
          { key: "name", label: "Project", sortable: true, render: function (r) {
            return '<div><div class="cell-name">' + esc(r.name) + '</div><div class="cell-sub">' + esc(r.client) + '</div></div>';
          }},
          { key: "status", label: "Status", sortable: true, render: function (r) { return FB.util.statusBadge(r.status); }, export: function (r) { return r.status; } },
          { key: "priority", label: "Priority", sortable: true, render: function (r) { return FB.util.prioBadge(r.priority); }, export: function (r) { return r.priority; } },
          { key: "progress", label: "Progress", sortable: true, render: function (r) {
            return '<div class="cell-progress"><div class="progress-label"><span>' + r.progress + '%</span></div><div class="progress thin"><span style="width:' + r.progress + '%"></span></div></div>';
          }},
          { key: "budget", label: "Budget", sortable: true, render: function (r) { return FB.util.money(r.budget); }, export: function (r) { return r.budget; } },
          { key: "dueDate", label: "Due Date", sortable: true, render: function (r) { return r.dueDate ? FB.util.fmtDate(r.dueDate) : "\u2014"; }, export: function (r) { return r.dueDate ? FB.util.fmtDate(r.dueDate) : ""; } },
        ],
        search: "Search projects…",
        searchKeys: ["name", "client"],
        filters: [
          { key: "status", label: "Status", options: [{ value: "Planning", label: "Planning" },{ value: "In Progress", label: "In Progress" },{ value: "On Hold", label: "On Hold" },{ value: "Completed", label: "Completed" },{ value: "Archived", label: "Archived" }] },
        ],
        selectable: false,
        rowActions: function (r) {
          return '<button class="btn-icon" data-tip="View" data-action="view"><i class="fa-solid fa-eye"></i></button>' +
            '<button class="btn-icon" data-tip="Edit" data-action="edit"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="btn-icon" data-tip="Delete" data-action="delete"><i class="fa-solid fa-trash"></i></button>';
        },
        pageSize: 10,
        exportName: "projects",
        emptyIcon: "fa-diagram-project",
        emptyTitle: "No projects found",
        emptyText: "Try adjusting your search or filter criteria.",
      });
    }

    document.getElementById("projectsTable").addEventListener("click", function (e) {
      var actionBtn = e.target.closest("[data-action]");
      if (!actionBtn) return;
      var tr = actionBtn.closest("tr");
      if (!tr) return;
      var proj = FB.db.find("projects", tr.dataset.id);
      if (!proj) return;
      var action = actionBtn.dataset.action;
      if (action === "view") { projectDrawer(proj); }
      else if (action === "edit") { openProjectModal(proj); }
      else if (action === "delete") {
        FB.modal.confirm({ title: "Delete project?", message: "Are you sure you want to delete \"" + esc(proj.name) + "\"? This cannot be undone.", confirmText: "Delete", danger: true }).then(function (ok) {
          if (ok) { FB.db.remove("projects", proj.id); FB.toast.success("Project deleted"); renderGrid(); if (table) table.refresh(); }
        });
      }
    });

    // View toggle
    document.getElementById("viewToggle").addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      document.querySelectorAll("#viewToggle button").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentView = btn.dataset.view;
      if (currentView === "grid") {
        document.getElementById("gridView").style.display = "";
        document.getElementById("listView").style.display = "none";
        renderGrid();
      } else {
        document.getElementById("gridView").style.display = "none";
        document.getElementById("listView").style.display = "";
        if (!table) initTable();
        else table.refresh();
      }
    });

    renderGrid();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
