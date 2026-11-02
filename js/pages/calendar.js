window.FB = window.FB || {};
(() => {
  "use strict";
  let viewDate = new Date();
  let viewMode = "month";

  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function render() {
    const grid = document.getElementById("calGrid");
    const title = document.getElementById("calTitle");
    if (viewMode === "month") renderMonth(grid, title);
    else renderWeek(grid, title);
  }

  function renderMonth(grid, title) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    title.textContent = viewDate.toLocaleString("en-US", { month: "long", year: "numeric" });
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    let html = DAYS.map((d) => `<div class="cal-dow">${d}</div>`).join("");
    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      let dayNum, dateStr, isOther = false;
      if (i < startDay) {
        dayNum = prevDays - startDay + i + 1;
        dateStr = new Date(year, month - 1, dayNum).toISOString().slice(0, 10);
        isOther = true;
      } else if (i >= startDay + daysInMonth) {
        dayNum = i - startDay - daysInMonth + 1;
        dateStr = new Date(year, month + 1, dayNum).toISOString().slice(0, 10);
        isOther = true;
      } else {
        dayNum = i - startDay + 1;
        dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      }
      const isToday = dateStr === todayStr;
      const dayEvents = FB.events.filter((e) => e.date === dateStr);
      html += `<div class="cal-cell ${isOther ? "other" : ""} ${isToday ? "today" : ""}" data-date="${dateStr}">
        <span class="cal-day-num">${dayNum}</span>
        ${dayEvents.slice(0, 3).map((e) => `<div class="cal-event" style="background:${e.color}20;color:${e.color}" title="${FB.util.escapeHtml(e.title)}">${FB.util.escapeHtml(e.title)}</div>`).join("")}
        ${dayEvents.length > 3 ? `<span class="cal-more">+${dayEvents.length - 3} more</span>` : ""}
      </div>`;
    }
    grid.innerHTML = `<div class="calendar-grid">${html}</div>`;
    wireCells();
  }

  function renderWeek(grid, title) {
    const start = new Date(viewDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    title.textContent = `${start.toLocaleString("en-US", { month: "short", day: "numeric" })} â€“ ${end.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    let html = DAYS.map((d) => `<div class="cal-dow">${d}</div>`).join("");
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayEvents = FB.events.filter((e) => e.date === dateStr);
      const isToday = dateStr === todayStr;
      html += `<div class="cal-cell ${isToday ? "today" : ""}" data-date="${dateStr}" style="min-height:160px">
        <span class="cal-day-num">${d.getDate()}</span>
        ${dayEvents.map((e) => `<div class="cal-event" style="background:${e.color}20;color:${e.color}">${e.time} ${FB.util.escapeHtml(e.title)}</div>`).join("")}
      </div>`;
    }
    grid.innerHTML = `<div class="calendar-grid">${html}</div>`;
    wireCells();
  }

  function wireCells() {
    document.querySelectorAll(".cal-cell:not(.other)").forEach((cell) => {
      cell.addEventListener("click", () => {
        const date = cell.dataset.date;
        const dayEvts = FB.events.filter((e) => e.date === date);
        FB.drawer.open(date, `
          <div class="section-gap">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div class="card-title">${new Date(date + "T12:00:00").toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
              <button class="btn btn-ghost btn-sm" id="addEvtForDay"><i class="fa-solid fa-plus"></i></button>
            </div>
            ${dayEvts.length ? dayEvts.map((e) => `<div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);border-left:4px solid ${e.color}">
              <div><div style="font-weight:600">${FB.util.escapeHtml(e.title)}</div><div class="muted small">${e.time} Â· ${e.duration} Â· ${e.attendees} attendees</div></div>
            </div>`).join("") : '<div class="empty-state"><div class="empty-title">No events</div><p class="empty-text">No events scheduled for this day.</p></div>'}
          </div>`);
      });
    });
  }

  function openAddModal() {
    const evtTypes = [
      { value: "meeting", label: "Meeting" }, { value: "deadline", label: "Deadline" },
      { value: "reminder", label: "Reminder" }, { value: "event", label: "Event" },
    ];
    FB.modal.open({
      title: "Add Event",
      body: `<form class="form-grid" id="addEvtForm">
        <div class="form-group"><label class="form-label">Title <span class="req">*</span></label><input class="input" name="title" required/></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Date</label><input class="input" type="date" name="date" value="${new Date().toISOString().slice(0,10)}"/></div>
          <div class="form-group"><label class="form-label">Time</label><input class="input" type="time" name="time" value="09:00"/></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Duration</label><select class="select" name="duration"><option>30m</option><option>45m</option><option selected>1h</option><option>2h</option></select></div>
          <div class="form-group"><label class="form-label">Type</label><select class="select" name="type">${evtTypes.map((t) => `<option value="${t.value}">${t.label}</option>`).join("")}</select></div>
        </div>
      </form>`,
      footer: `<button class="btn btn-secondary" onclick="FB.modal.close()">Cancel</button><button class="btn btn-primary" id="saveEvtBtn">Create</button>`,
    });
    const colors = { meeting: "#6366F1", deadline: "#EF4444", reminder: "#F59E0B", event: "#10B981" };
    document.getElementById("saveEvtBtn").addEventListener("click", () => {
      const f = document.getElementById("addEvtForm");
      if (!f.title.value.trim()) { f.title.focus(); return; }
      FB.db.add("events", {
        id: FB.util.uid("EV"), title: f.title.value.trim(), type: f.type.value,
        color: colors[f.type.value] || "#6366F1", date: f.date.value, time: f.time.value,
        duration: f.duration.value, attendees: Math.floor(Math.random() * 8 + 1),
      });
      FB.modal.close();
      FB.toast.success("Event created");
      render();
    });
  }

  function init() {
    FB.app.ready({ active: "calendar", crumb: ["Calendar"], title: "Calendar" });
    render();
    document.getElementById("calPrev").addEventListener("click", () => {
      if (viewMode === "month") viewDate.setMonth(viewDate.getMonth() - 1);
      else viewDate.setDate(viewDate.getDate() - 7);
      render();
    });
    document.getElementById("calNext").addEventListener("click", () => {
      if (viewMode === "month") viewDate.setMonth(viewDate.getMonth() + 1);
      else viewDate.setDate(viewDate.getDate() + 7);
      render();
    });
    document.getElementById("calToday").addEventListener("click", () => { viewDate = new Date(); render(); });
    document.querySelectorAll(".segmented button").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        viewMode = btn.dataset.view;
        render();
      });
    });
    document.getElementById("addEventBtn").addEventListener("click", openAddModal);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
