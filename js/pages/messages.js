window.FB = window.FB || {};
(() => {
  "use strict";
  let activeConv = null;

  function renderList(container) {
    const listScroll = container.querySelector("#convListScroll");
    if (!listScroll) return;
    listScroll.innerHTML = FB.conversations.map((cv) => {
      const user = FB.db.find("users", cv.userId);
      if (!user) return "";
      const last = cv.messages[0];
      return `<div class="conv-item ${activeConv === cv.id ? "active" : ""}" data-cid="${cv.id}">
        <div class="online-wrap">${FB.util.avatarHtml(user)}${cv.online ? '<span class="online-dot"></span>' : ""}</div>
        <div style="min-width:0;flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="cell-name">${FB.util.escapeHtml(user.name)}</span>
            <span class="xsmall muted">${last ? FB.util.timeAgo(last.time) : ""}</span>
          </div>
          <div class="conv-preview">${last ? FB.util.escapeHtml(last.text) : "Start a conversation"}</div>
        </div>
        ${cv.unread ? `<span class="conv-unread">${cv.unread}</span>` : ""}
      </div>`;
    }).join("");
    listScroll.querySelectorAll(".conv-item").forEach((el) => {
      el.addEventListener("click", () => {
        activeConv = el.dataset.cid;
        renderChat(container);
      });
    });
  }

  function renderChat(container) {
    const cv = FB.conversations.find((c) => c.id === activeConv);
    const user = cv ? FB.db.find("users", cv.userId) : null;
    const win = container.querySelector("#chatWindow");
    if (!win || !cv || !user) {
      if (win) win.innerHTML = `<div class="empty-state" style="height:100%;place-items:center"><span class="empty-icon"><i class="fa-solid fa-comments"></i></span><div class="empty-title">Select a conversation</div><p class="empty-text">Choose from the list on the left to start messaging.</p></div>`;
      return;
    }
    cv.unread = 0;
    FB.db.persist("conversations");

    win.innerHTML = `
      <div class="chat-head">
        <div class="online-wrap">${FB.util.avatarHtml(user)}${cv.online ? '<span class="online-dot"></span>' : ""}</div>
        <div><div class="cell-name">${FB.util.escapeHtml(user.name)}</div><div class="xsmall muted">${cv.online ? "Online" : "Offline"}</div></div>
      </div>
      <div class="chat-scroll" id="chatScroll">
        ${cv.messages.slice().reverse().map((m) => `<div class="bubble-row ${m.mine ? "mine" : ""}">
          ${!m.mine ? FB.util.avatarHtml(user, "sm") : ""}
          <div class="bubble">${FB.util.escapeHtml(m.text)}<time>${FB.util.fmtDateTime(m.time)}</time></div>
        </div>`).join("")}
      </div>
      <div class="chat-input">
        <button class="btn-icon" aria-label="Emoji"><i class="fa-regular fa-face-smile"></i></button>
        <button class="btn-icon" aria-label="Attach"><i class="fa-solid fa-paperclip"></i></button>
        <input class="input" id="chatMsgInput" placeholder="Type a message…" autocomplete="off"/>
        <button class="btn btn-primary btn-sm" id="sendBtn"><i class="fa-solid fa-paper-plane"></i></button>
      </div>`;
    const scroll = win.querySelector("#chatScroll");
    scroll.scrollTop = scroll.scrollHeight;

    const input = win.querySelector("#chatMsgInput");
    const send = () => {
      const text = input.value.trim();
      if (!text) return;
      cv.messages.unshift({ mine: true, text, time: new Date().toISOString() });
      FB.db.persist("conversations");
      input.value = "";
      renderChat(container);
      FB.app.refreshBadges(document.querySelector(".app"));
    };
    win.querySelector("#sendBtn").addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    renderList(container);
  }

  function init() {
    FB.app.ready({ active: "messages", crumb: ["Messages"], title: "Messages" });
    const container = document.getElementById("chatContainer");
    container.innerHTML = `<div class="chat-layout" style="height:calc(100dvh - var(--topbar-h) - var(--density-gap)*2 - 70px)">
      <div class="chat-list">
        <div style="padding:var(--sp-3);border-bottom:1px solid var(--border)">
          <div class="input-wrap"><i class="fa-solid fa-magnifying-glass lead"></i><input class="input sm" id="convSearch" placeholder="Search conversations…"/></div>
        </div>
        <div class="chat-list-scroll" id="convListScroll"></div>
      </div>
      <div class="chat-window" id="chatWindow"></div>
    </div>`;
    renderList(container);
    renderChat(container);
    document.getElementById("convSearch").addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      container.querySelectorAll(".conv-item").forEach((el) => {
        const user = FB.db.find("users", FB.conversations.find((c) => c.id === el.dataset.cid)?.userId);
        el.style.display = !q || (user && user.name.toLowerCase().includes(q)) ? "" : "none";
      });
    });
  }
  document.addEventListener("DOMContentLoaded", init);
})();
