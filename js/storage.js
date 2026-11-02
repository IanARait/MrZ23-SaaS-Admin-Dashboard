/* ==========================================================================
   storage.js - FlowBoard mock-data engine.
   Deterministic seeded generation (mulberry32, seed 42) persisted to
   LocalStorage so edits survive refreshes. No backend needed; works over
   file:// (no fetch of JSON - see README).
   ========================================================================== */

window.FB = window.FB || {};

(() => {
  "use strict";

  const DATA_VERSION = 1;
  const KEY = (c) => `flowboard:v${DATA_VERSION}:${c}`;
  const SEED = 42;

  /* ---------------- Seeded RNG ---------------- */
  let s = SEED;
  const rnd = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const ri = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const chance = (p) => rnd() < p;

  /* ---------------- Pools ---------------- */
  const FIRST = ["James","Mary","Robert","Patricia","John","Jennifer","Michael","Linda","David","Elizabeth","William","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Christopher","Karen","Charles","Lisa","Daniel","Nancy","Matthew","Betty","Anthony","Margaret","Mark","Sandra","Donald","Ashley","Steven","Kimberly","Paul","Emily","Andrew","Donna","Joshua","Michelle","Kenneth","Carol","Kevin","Amanda","Brian","Melissa","George","Deborah","Timothy","Stephanie","Ronald","Rebecca","Jason","Sharon","Edward","Laura","Jeffrey","Cynthia","Ryan","Amy","Jacob","Kathleen","Gary","Angela","Nicholas","Shirley","Eric","Brenda","Jonathan","Emma","Stephen","Anna","Larry","Pamela","Justin","Nicole","Scott","Samantha","Brandon","Katherine","Benjamin","Christine","Samuel","Helen","Gregory","Debra","Alexander","Rachel","Patrick","Olivia","Frank","Carolyn","Raymond","Janet","Jack","Maria","Dennis","Heather","Jerry","Diane","Tyler","Sophia"];
  const LAST = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Anderson","Taylor","Thomas","Moore","Jackson","Martin","Lee","Thompson","White","Harris","Clark","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Gomez","Phillips","Evans","Turner","Parker","Collins","Edwards","Stewart","Morris","Murphy","Cook","Rogers","Morgan","Peterson","Cooper","Reed","Bailey","Bell","Howard","Ward","Cox","Richardson","Wood","Watson","Brooks","Bennett","Gray","James","Reyes","Cruz","Hughes","Price","Myers","Long","Foster","Sanders","Ross","Morales","Powell","Sullivan","Russell","Ortiz","Jenkins","Gutierrez","Perry","Butler","Barnes","Fisher","Henderson","Coleman","Simmons","Patterson","Jordan","Reynolds","Hamilton","Graham","Kimberly"];
  const COMPANIES = ["Acme Corp","Globex Industries","Initech Solutions","Umbrella Health","Stark Enterprises","Wayne Logistics","Hooli Cloud","Pied Piper Labs","Vandelay Imports","Cyberdyne Systems","Massive Dynamic","Aperture Science","Tyrell Data","Wonka Confections","Gringotts Finance","Stark & Co","Oceanic Freight","Blue Sun Energy","Soylent Foods","Nakatomi Trading"];
  const CITIES = ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","Austin","Seattle","Denver","Boston","Miami","Atlanta","Portland","Nashville","Detroit","Minneapolis","Las Vegas"];
  const DEPTS = ["Engineering","Design","Marketing","Sales","Finance","Operations","Support","HR"];
  const ROLES = ["Admin","Manager","Editor","Viewer"];
  const AVATAR_COLORS = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#06B6D4","#3B82F6","#14B8A6","#A855F7"];

  const PROJECT_WORDS_A = ["Website","Mobile App","Brand","Marketing","Cloud Migration","Dashboard","E-commerce","API Platform","CRM","Analytics","Onboarding","Payments","Redesign","Automation","Security","Infrastructure","AI Integration","Customer Portal","Data Warehouse","Design System"];
  const PROJECT_WORDS_B = ["Revamp","Launch","Overhaul","Expansion","Optimization","Rollout","Migration","Upgrade","Audit","Build"];
  const TASK_VERBS = ["Update","Review","Fix","Design","Implement","Refactor","Test","Document","Optimize","Prepare","Draft","Schedule","Migrate","Deploy","Research"];
  const TASK_OBJS = ["landing page","checkout flow","user profile","API endpoints","database schema","onboarding emails","pricing table","navigation menu","search filters","auth flow","dashboard widgets","export feature","notification system","billing page","mobile layout"];
  const TAG_POOL = ["design","frontend","backend","bug","research","urgent","docs","review","feature","infra","ux","qa"];
  const PRODUCT_CATS = ["Electronics","Clothing","Home & Garden","Sports","Books","Toys"];
  const PRODUCTS_BY_CAT = {
    "Electronics": ["Wireless Headphones","Smart Watch Pro","Bluetooth Speaker","4K Action Camera","Noise-Cancel Earbuds","Portable Charger","Mechanical Keyboard","HD Webcam"],
    "Clothing": ["Classic Denim Jacket","Merino Wool Sweater","Running Leggings","Oxford Dress Shirt","Windbreaker Lite","Graphic Tee Pack"],
    "Home & Garden": ["Ceramic Planter Set","Memory Foam Pillow","LED Desk Lamp","Espresso Machine","Linen Bed Sheets","Air Purifier Mini"],
    "Sports": ["Yoga Mat Premium","Adjustable Dumbbells","Trail Running Shoes","Cycling Helmet","Resistance Band Kit","Insulated Bottle"],
    "Books": ["Deep Work Hardcover","Design of Everyday Things","Atomic Habits","Lean Startup Guide","Remote Work Handbook"],
    "Toys": ["Building Blocks Deluxe","RC Racing Car","Puzzle Set 1000pc","Plush Bear Classic","STEM Robot Kit"]
  };

  const NOTIF_TEMPLATES = [
    { type: "order",   icon: "fa-cart-shopping", color: "var(--success)", bg: "var(--success-bg)" },
    { type: "user",    icon: "fa-user-plus",     color: "var(--info)",    bg: "var(--info-bg)" },
    { type: "payment", icon: "fa-credit-card",   color: "var(--warning)", bg: "var(--warning-bg)" },
    { type: "system",  icon: "fa-server",        color: "var(--accent)",  bg: "var(--primary-bg)" },
    { type: "message", icon: "fa-comment",       color: "var(--secondary)", bg: "color-mix(in srgb, var(--secondary) 12%, transparent)" },
  ];
  const NOTIF_TEXTS = [
    ["New order received", "placed an order worth"],
    ["New customer registered", "just created an account"],
    ["Payment confirmed", "completed a payment of"],
    ["Server deployed", "production build v2."],
    ["Unread message", "sent you a direct message"],
    ["Invoice paid", "settled invoice"],
    ["Task completed", "marked a task as done"],
    ["Report ready", "your weekly report is ready"],
    ["Low stock alert", "is running low on stock"],
    ["Team update", "joined your workspace"],
  ];

  /* ---------------- Date helpers (seeded, relative to now) ---------------- */
  const NOW = Date.now();
  const DAY = 86400000;
  const daysAgoISO = (d) => new Date(NOW - d * DAY).toISOString();
  const daysAheadISO = (d) => new Date(NOW + d * DAY).toISOString();
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  /* ---------------- Generators ---------------- */
  const genName = () => `${pick(FIRST)} ${pick(LAST)}`;
  const emailFor = (name) => `${name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".")}@${pick(["gmail.com","outlook.com","company.com","workmail.com"])}`;

  function genUsers(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const name = genName();
      const r = rnd();
      out.push({
        id: `U-${1001 + i}`,
        name,
        email: emailFor(name),
        role: i === 0 ? "Admin" : pick(ROLES),
        department: pick(DEPTS),
        status: r < 0.72 ? "active" : r < 0.92 ? "inactive" : "suspended",
        phone: `(${ri(201, 989)}) ${ri(200, 999)}-${String(ri(0, 9999)).padStart(4, "0")}`,
        location: pick(CITIES),
        joined: daysAgoISO(ri(5, 900)),
        lastActive: daysAgoISO(ri(0, 60)),
        color: pick(AVATAR_COLORS),
      });
    }
    return out;
  }

  function genCustomers(n, users) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const name = genName();
      const orders = ri(1, 42);
      out.push({
        id: `CU-${2001 + i}`,
        name,
        email: emailFor(name),
        company: pick(COMPANIES),
        phone: `(${ri(201, 989)}) ${ri(200, 999)}-${String(ri(0, 9999)).padStart(4, "0")}`,
        location: pick(CITIES),
        orders,
        totalSpent: Math.round(orders * (rnd() * 850 + 120)),
        status: chance(0.78) ? "active" : chance(0.5) ? "inactive" : "lead",
        joined: daysAgoISO(ri(10, 800)),
        color: pick(AVATAR_COLORS),
      });
    }
    return out;
  }

  function genProjects(n, users) {
    const STATUSES = ["Planning", "In Progress", "In Progress", "On Hold", "Completed", "Archived"];
    const out = [];
    for (let i = 0; i < n; i++) {
      const team = [];
      const tsize = ri(2, 5);
      while (team.length < tsize) {
        const u = pick(users);
        if (!team.includes(u.id)) team.push(u.id);
      }
      const status = pick(STATUSES);
      out.push({
        id: `PRJ-${3001 + i}`,
        name: `${pick(PROJECT_WORDS_A)} ${pick(PROJECT_WORDS_B)}`,
        client: pick(COMPANIES),
        description: "Key deliverables include discovery, implementation, QA and rollout across all business units.",
        status,
        priority: pick(["low", "medium", "medium", "high"]),
        progress: status === "Completed" ? 100 : ri(5, 92),
        budget: ri(15, 140) * 1000,
        spent: ri(4, 90) * 1000,
        startDate: daysAgoISO(ri(30, 300)),
        dueDate: daysAheadISO(ri(-40, 180)),
        team,
        tags: [...new Set([pick(TAG_POOL), pick(TAG_POOL)])],
        createdAt: daysAgoISO(ri(35, 310)),
      });
    }
    return out;
  }

  const TASK_STATUSES = ["todo", "in-progress", "review", "done"];

  function genTasks(n, projects, users) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const created = ri(0, 120);
      out.push({
        id: `TSK-${4001 + i}`,
        title: `${pick(TASK_VERBS)} ${pick(TASK_OBJS)}`,
        projectId: pick(projects).id,
        assignee: pick(users.slice(0, 24)).id,
        status: pick(["todo", "todo", "in-progress", "in-progress", "review", "done"]),
        priority: pick(["high", "high", "medium", "medium", "medium", "low"]),
        dueDate: daysAheadISO(ri(-14, 45)),
        createdAt: daysAgoISO(created),
        tags: [...new Set([pick(TAG_POOL), pick(TAG_POOL)])].slice(0, ri(1, 2)),
        subtasksDone: ri(0, 4),
        subtasksTotal: ri(4, 8),
        comments: ri(0, 14),
        attachments: ri(0, 4),
        description: "Break the work down, validate against acceptance criteria and coordinate with the design team before shipping.",
      });
    }
    return out;
  }

  function genInvoices(n, customers) {
    const STATUSES = ["paid", "paid", "pending", "pending", "overdue", "draft", "refunded"];
    const ITEMS_POOL = [
      ["UI/UX Design Sprint", 4800], ["Frontend Development", 6800], ["Backend Development", 7200],
      ["Monthly Subscription - Pro", 49], ["Consulting Hours (10h)", 1500], ["Cloud Infrastructure", 320],
      ["Brand Identity Package", 2600], ["QA & Testing Cycle", 1900], ["SEO Optimization Retainer", 850],
    ];
    const out = [];
    for (let i = 0; i < n; i++) {
      const items = [];
      const icount = ri(2, 4);
      for (let j = 0; j < icount; j++) {
        const [desc, rate] = ITEMS_POOL[ri(0, ITEMS_POOL.length - 1)];
        if (items.some((it) => it.desc === desc)) continue;
        items.push({ desc, qty: ri(1, 3), rate });
      }
      const issued = daysAgoISO(ri(1, 240));
      out.push({
        id: `INV-${20260001 + i}`,
        customerId: pick(customers).id,
        issueDate: issued,
        dueDate: new Date(new Date(issued).getTime() + ri(7, 45) * DAY).toISOString(),
        status: pick(STATUSES),
        taxRate: 0.1,
        notes: "Thank you for your business. Payment is due within the stated terms.",
        items,
      });
    }
    return out;
  }

  const METHODS = ["Visa", "Mastercard", "PayPal", "Bank Transfer", "Stripe", "Apple Pay"];

  function genTransactions(n, invoices, customers) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const inv = pick(invoices);
      out.push({
        id: `TXN-${60001 + i}`,
        date: daysAgoISO(ri(0, 180)),
        customer: pick(customers).name,
        description: pick(["Invoice payment", "Subscription renewal", "Product purchase", "Service fee", "Plan upgrade"]),
        invoiceId: inv.id,
        amount: inv.items.reduce((s, it) => s + it.qty * it.rate, 0) * (chance(0.85) ? 1 : 0.25),
        method: pick(METHODS),
        status: pick(["succeeded", "succeeded", "succeeded", "pending", "failed", "refunded"]),
        card: `•••• ${ri(1000, 9999)}`,
      });
    }
    return out.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function genProducts(n) {
    const out = [];
    let i = 0;
    const cats = Object.keys(PRODUCTS_BY_CAT);
    while (out.length < n) {
      const cat = cats[i % cats.length];
      const names = PRODUCTS_BY_CAT[cat];
      const name = names[Math.floor(i / cats.length) % names.length] ?? null;
      if (!name) { i++; continue; }
      const stock = ri(0, 220);
      out.push({
        id: `PRD-${7001 + out.length}`,
        name,
        sku: `${cat.slice(0, 3).toUpperCase()}-${ri(1000, 9999)}`,
        category: cat,
        price: +(rnd() * 480 + 12).toFixed(2),
        cost: +(rnd() * 240 + 8).toFixed(2),
        stock,
        sold: ri(0, 900),
        rating: +(rnd() * 1.5 + 3.5).toFixed(1),
        icon: pick(["fa-box-open", "fa-bolt", "fa-shirt", "fa-seedling", "fa-book", "fa-gamepad", "fa-headphones", "fa-camera"]),
        color: pick(AVATAR_COLORS),
        createdAt: daysAgoISO(ri(30, 700)),
      });
      i++;
      if (i > n * 12) break; // safety
    }
    return out;
  }

  function genNotifications(n, users) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = NOTIF_TEMPLATES[i % NOTIF_TEMPLATES.length];
      const [title, tail] = pick(NOTIF_TEXTS);
      out.push({
        id: `N-${i + 1}`,
        ...t,
        title,
        actor: pick(users).name,
        detail: tail,
        amount: `$${ri(20, 2400)}`,
        time: daysAgoISO(rnd() * 6),
        read: chance(0.45),
      });
    }
    return out.sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  const CHAT_SEEDS = [
    "Hey! Did you get a chance to look at the designs?", "Sure thing, reviewing them now.",
    "The new dashboard looks amazing 🔥", "Thanks! Wait till you see dark mode.",
    "Can we move the sync to Friday instead?", "Works for me.",
    "Client approved phase two 🎉", "Fantastic news!",
    "Deployment finished without issues.", "Great, updating the changelog.",
    "Do we have the Q3 numbers ready?", "Almost, finishing the summary today.",
    "I pushed the fix for the login bug.", "Legend. Confirming it works here.",
    "Meeting moved to 3pm, FYI.", "Noted, thanks!",
    "Could you send the latest mockups?", "Sending them right away.",
  ];

  function genConversations(n, users) {
    const out = [];
    const people = users.slice(0, n);
    people.forEach((u, idx) => {
      const msgs = [];
      const count = ri(3, 8);
      let base = ri(1, 48) * 3600000;
      for (let m = 0; m < count; m++) {
        msgs.push({
          mine: m % 2 === 1,
          text: CHAT_SEEDS[(idx * 3 + m) % CHAT_SEEDS.length],
          time: new Date(NOW - base).toISOString(),
        });
        base -= ri(20, 240) * 60000;
      }
      out.push({
        id: `CNV-${8001 + idx}`,
        userId: u.id,
        messages: msgs.reverse(),
        unread: chance(0.35) ? ri(1, 4) : 0,
        online: chance(0.55),
      });
    });
    return out.sort((a, b) => new Date(b.messages[0].time) - new Date(a.messages[0].time));
  }

  const EVENT_TYPES = [
    { type: "meeting",   label: "Meeting",   color: "#6366F1" },
    { type: "deadline",  label: "Deadline",  color: "#EF4444" },
    { type: "reminder",  label: "Reminder",  color: "#F59E0B" },
    { type: "event",     label: "Event",     color: "#10B981" },
  ];

  function genEvents(n) {
    const TITLES = {
      meeting: ["Team Standup", "Client Call", "Design Review", "Sprint Planning", "1:1 Sync"],
      deadline: ["Invoice Due", "Release Cutoff", "Contract Renewal", "Report Deadline"],
      reminder: ["Send Weekly Update", "Renew Domain", "Follow up with Acme", "Submit Expenses"],
      event: ["Webinar: Growth", "Product Launch", "Company Offsite", "Hackathon Kickoff"],
    };
    const out = [];
    const monthStart = new Date();
    for (let i = 0; i < n; i++) {
      const t = EVENT_TYPES[i % EVENT_TYPES.length];
      out.push({
        id: `EV-${9001 + i}`,
        title: pick(TITLES[t.type]),
        type: t.type,
        color: t.color,
        date: new Date(monthStart.getTime() + ri(-12, 18) * DAY).toISOString().slice(0, 10),
        time: `${String(ri(8, 17)).padStart(2, "0")}:${pick(["00", "15", "30", "45"])}`,
        duration: pick(["30m", "45m", "1h", "2h"]),
        attendees: ri(1, 12),
      });
    }
    return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  /* ---------------- Persistence ---------------- */
  const COLLECTIONS = ["users","customers","projects","tasks","invoices","transactions","products","notifications","conversations","events"];

  const defaults = {};
  function buildAll(users) {
    defaults.users = users;
    defaults.customers = genCustomers(50, users);
    defaults.projects = genProjects(30, users);
    defaults.tasks = genTasks(150, defaults.projects, users);
    defaults.invoices = genInvoices(50, defaults.customers);
    defaults.transactions = genTransactions(100, defaults.invoices, defaults.customers);
    defaults.products = genProducts(50);
    defaults.notifications = genNotifications(30, users);
    defaults.conversations = genConversations(20, users);
    defaults.events = genEvents(20);
  }

  function loadCollection(name) {
    try {
      const raw = localStorage.getItem(KEY(name));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function init() {
    const existingUsers = loadCollection("users");
    if (!existingUsers) {
      buildAll(genUsers(100));
      COLLECTIONS.forEach((c) => localStorage.setItem(KEY(c), JSON.stringify(defaults[c])));
    }
    COLLECTIONS.forEach((c) => { FB[c] = loadCollection(c) || defaults[c] || []; });
  }

  function persist(name) {
    try { localStorage.setItem(KEY(name), JSON.stringify(FB[name])); } catch {}
  }

  function reset() {
    COLLECTIONS.forEach((c) => localStorage.removeItem(KEY(c)));
    init();
  }

  /* ---------------- Public store API ---------------- */
  FB.db = {
    init, persist, reset,
    all: (c) => FB[c] || [],
    find: (c, id) => (FB[c] || []).find((x) => x.id === id),
    add: (c, item) => { FB[c].unshift(item); persist(c); return item; },
    update: (c, id, patch) => {
      const it = FB.db.find(c, id);
      if (it) Object.assign(it, patch);
      persist(c);
      return it;
    },
    remove: (c, id) => {
      FB[c] = FB[c].filter((x) => x.id !== id);
      persist(c);
    },
    removeMany: (c, ids) => {
      FB[c] = FB[c].filter((x) => !ids.includes(x.id));
      persist(c);
    },
  };

  /* ---------------- Settings (separate, not seeded) ---------------- */
  const SETTINGS_KEY = "flowboard:settings";
  FB.settings = Object.assign({
    profile: {
      name: "Alex Rivera",
      email: "admin@flowboard.test",
      phone: "+1 (555) 010-2030",
      location: "San Francisco, CA",
      timezone: "(GMT-08:00) Pacific Time",
      bio: "Product-minded admin. Coffee, keyboards, clean dashboards.",
      color: AVATAR_COLORS[0],
    },
    notifications: { email: true, push: true, sms: false, marketing: false, digest: true },
    security: { twoFactor: true, sessionsAlerts: true },
  }, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
  FB.saveSettings = () => localStorage.setItem(SETTINGS_KEY, JSON.stringify(FB.settings));

  /* ---------------- Shared utils ---------------- */
  FB.util = {
    fmtDate,
    fmtDateTime: (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    money: (n, cents = true) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }),
    initials: (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
    escapeHtml: (str) => String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    timeAgo(iso) {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.round(diff / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.round(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const d = Math.round(hrs / 24);
      if (d < 7) return `${d}d ago`;
      return fmtDate(iso);
    },
    uid: (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase(),
    avatarHtml(person, size = "") {
      return `<span class="avatar ${size}" style="background:${person.color}">${FB.util.initials(person.name)}</span>`;
    },
    statusBadge(status) {
      const map = {
        active: "badge-success", paid: "badge-success", completed: "badge-success", succeeded: "badge-success", done: "badge-success", instock: "badge-success",
        pending: "badge-warning", processing: "badge-warning", review: "badge-warning", lowstock: "badge-warning", lead: "badge-info",
        failed: "badge-danger", overdue: "badge-danger", outofstock: "badge-danger", suspended: "badge-danger", cancelled: "badge-danger",
        shipped: "badge-info", "in-progress": "badge-primary", planning: "badge-neutral", draft: "badge-neutral", archived: "badge-neutral",
        inactive: "badge-neutral", refunded: "badge-neutral", "on-hold": "badge-warning", todo: "badge-neutral",
      };
      const key = String(status).toLowerCase().replace(/\s+/g, "-");
      const cls = map[key.replace("in-progress", "in-progress")] || (key === "in-stock" ? "badge-success" : "");
      const label = String(status).replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      return `<span class="badge ${cls}">${label}</span>`;
    },
    prioBadge(p) {
      const map = { high: "prio-high", medium: "prio-medium", low: "prio-low" };
      return `<span class="prio-dot ${map[p]}">${p[0].toUpperCase()}${p.slice(1)}</span>`;
    },
  };

  init();
})();
