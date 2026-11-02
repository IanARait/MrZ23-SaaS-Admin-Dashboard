window.FB = window.FB || {};
(() => {
  "use strict";
  const COLS = [
    { key: "todo", label: "To Do", icon: "fa-circle" },
    { key: "in-progress", label: "In Progress", icon: "fa-spinner" },
    { key: "review", label: "In Review", icon: "fa-eye" },
    { key: "done", label: "Done", icon: "fa-check-circle" },
  ];

  function renderKanban(board) {
    const q = (document.getElementById("taskSearch")?.value || "").toLowerCase();
    board.innerHTML = COLS.map((col) => {
      const tasks = FB.tasks.filter((t) => t.status === col.key && (!q || t.title.toLowerCase().includes(q)));
      return `<div class="kanban-col" data-status="${col.key}">
        <div class="kanban-col-head">
          <span class="kanban-col-title"><i class="fa-solid ${col.icon}" style="margin-right:6px;font-size:11px"></i>${col.label}</span>
          <span class="kanban-count">${tasks.length}</span>
        </div>
        ${tasks.map((t) => {
          const assignee = FB.db.find("users", t.assignee);
          return `<div class="task-card" draggable="true" data-id="${t.id}">
            <div class="task-title">${FB.util.escapeHtml(t.title)}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">${FB.util.prioBadge(t.priority)}</div>
            <div class="task-tags">${(t.tags || []).map((tg) => `<span class="tag">${FB.util.escapeHtml(tg)}</span>`).join("")}</div>
            <div class="task-meta">
              <div style="display:flex;align-items:center;gap:6px">
                ${assignee ? `<span class="avatar sm" style="background:${assignee.color}">${FB.util.initials(assignee.name)}</span>` : ""}
                <span class="muted small">${FB.util.fmtDate(t.dueDate)}</span>
              </div>
              <span class="muted xsmall">${t.subtasksDone}/${t.subtasksTotal}</span>
            </div>
          </div>`;
        }).join("")}
      </div>`;
    }).join("");
    wireDrag(board);
    wireCards(board);
  }

  function wireDrag(board) {
    board.querySelectorAll(".task-card").forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", card.dataset.id);
        card.classList.add("dragging");
      });
      card.addEventListener("dragend", () => card.classList.remove("dragging"));
    });
    board.querySelectorAll(".kanban-col").forEach((col) => {
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("drag-over"); });
      col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
      col.addEventListener("drop", (e) => {
        e.preventDefault();
        col.classList.remove("drag-over");
        const taskId = e.dataTransfer.getData("text/plain");
        const newStatus = col.dataset.status;
        FB.db.update("tasks", taskId, { status: newStatus });
        renderKanban(board);
        FB.toast.success("Task moved to " + COLS.find((c) => c.key === newStatus).label);
      });
    });
  }

  function wireCards(board) {
    board.querySelectorAll(".task-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".task-card.dragging")) return;
        const task = FB.db.find("tasks", card.dataset.id);
        if (!task) return;
        const assignee = FB.db.find("users", task.assignee);
        const project = FB.db.find("projects", task.projectId);
        FB.drawer.open(task.title, `
          <div class="section-gap">
            <div class="form-group"><div class="form-label">Description</div><p class="muted small">${FB.util.escapeHtml(task.description)}</p></div>
            <div class="form-row">
              <div class="form-group"><div class="form-label">Status</div>${FB.util.statusBadge(task.status)}</div>
              <div class="form-group"><div class="form-label">Priority</div>${FB.util.prioBadge(task.priority)}</div>
            </div>
            <div class="form-row">
              <div class="form-group"><div class="form-label">Assignee</div><div style="display:flex;align-items:center;gap:8px">${assignee ? FB.util.avatarHtml(assignee) + " " + FB.util.escapeHtml(assignee.name) : "Unassigned"}</div></div>
              <div class="form-group"><div class="form-label">Project</div><span class="muted">${project ? FB.util.escapeHtml(project.name) : "â€”"}</span></div>
            </div>
            <div class="form-row">
              <div class="form-group"><div class="form-label">Due Date</div><span class="muted">${FB.util.fmtDate(task.dueDate)}</span></div>
              <div class="form-group"><div class="form-label">Subtasks</div><span class="muted">${task.subtasksDone}/${task.subtasksTotal} completed</span></div>
            </div>
            <div class="form-group"><div class="form-label">Tags</div><div style="display:flex;gap:6px;flex-wrap:wrap">${(task.tags || []).map((tg) => `<span class="tag">${FB.util.escapeHtml(tg)}</span>`).join("")}</div></div>
          </div>`);
      });
    });
  }

  function openAddModal() {
    const projectOpts = FB.projects.map((p) => `<option value="${p.id}">${FB.util.escapeHtml(p.name)}</option>`).join("");
    const userOpts = FB.users.slice(0, 30).map((u) => `<option value="${u.id}">${FB.util.escapeHtml(u.name)}</option>`).join("");
    FB.modal.open({
      title: "Add Task",
      body: `<form class="form-grid" id="addTaskForm">
        <div class="form-group"><label class="form-label">Title <span class="req">*</span></label><input class="input" name="title" required/></div>
        <div class="form-group"><label class="form-label">Description</label><textarea class="textarea" name="description" rows="3"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Project</label><select class="select" name="projectId">${projectOpts}</select></div>
          <div class="form-group"><label class="form-label">Assignee</label><select class="select" name="assignee">${userOpts}</select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Priority</label><select class="select" name="priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div>
          <div class="form-group"><label class="form-label">Due Date</label><input class="input" type="date" name="dueDate"/></div>
        </div>
        <div class="form-group"><label class="form-label">Tags</label><input class="input" name="tags" placeholder="comma separated"/></div>
      </form>`,
      footer: `<button class="btn btn-secondary" onclick="FB.modal.close()">Cancel</button><button class="btn btn-primary" id="saveTaskBtn">Create Task</button>`,
    });
    document.getElementById("saveTaskBtn").addEventListener("click", () => {
      const form = document.getElementById("addTaskForm");
      const title = form.title.value.trim();
      if (!title) { form.title.focus(); return; }
      FB.db.add("tasks", {
        id: FB.util.uid("TSK"), title, description: form.description.value,
        projectId: form.projectId.value, assignee: form.assignee.value,
        status: "todo", priority: form.priority.value,
        dueDate: form.dueDate.value ? new Date(form.dueDate.value).toISOString() : new Date().toISOString(),
        createdAt: new Date().toISOString(),
        tags: form.tags.value.split(",").map((t) => t.trim()).filter(Boolean),
        subtasksDone: 0, subtasksTotal: 4, comments: 0, attachments: 0,
      });
      FB.modal.close();
      FB.toast.success("Task created successfully");
      renderKanban(document.getElementById("kanbanBoard"));
    });
  }

  function init() {
    FB.app.ready({ active: "tasks", crumb: ["Tasks"], title: "Tasks" });
    const board = document.getElementById("kanbanBoard");
    renderKanban(board);
    document.getElementById("addTaskBtn").addEventListener("click", openAddModal);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
