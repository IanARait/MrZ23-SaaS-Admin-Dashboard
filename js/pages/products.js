window.FB = window.FB || {};
(() => {
  "use strict";
  let viewMode = "grid";

  function stockStatus(p) {
    if (p.stock === 0) return "outofstock";
    if (p.stock < 20) return "lowstock";
    return "instock";
  }

  function renderGrid(mount) {
    const q = (document.getElementById("prodSearch")?.value || "").toLowerCase();
    const cats = document.getElementById("prodCatFilter")?.value || "all";
    let prods = [...FB.products];
    if (q) prods = prods.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    if (cats !== "all") prods = prods.filter((p) => p.category === cats);

    if (!prods.length) {
      mount.innerHTML = `<div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-box-open"></i></span><div class="empty-title">No products found</div><p class="empty-text">Try adjusting your search or filters.</p></div>`;
      return;
    }
    mount.innerHTML = `<div class="grid-3" style="margin-bottom:var(--sp-4)">
      ${prods.map((p) => `<div class="card card-hover" style="cursor:pointer" data-pid="${p.id}">
        <div style="height:120px;display:grid;place-items:center;background:${p.color}18;border-radius:var(--radius-lg) var(--radius-lg) 0 0">
          <i class="fa-solid ${p.icon}" style="font-size:32px;color:${p.color}"></i>
        </div>
        <div class="card-body" style="padding:var(--sp-3) var(--sp-4)">
          <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
            <div><div class="cell-name">${FB.util.escapeHtml(p.name)}</div><div class="cell-sub">${FB.util.escapeHtml(p.sku)} Â· ${FB.util.escapeHtml(p.category)}</div></div>
            ${FB.util.statusBadge(stockStatus(p))}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--sp-3)">
            <span class="cell-strong">${FB.util.money(p.price)}</span>
            <span class="muted small">${p.sold} sold</span>
          </div>
        </div>
      </div>`).join("")}
    </div>`;
    mount.querySelectorAll("[data-pid]").forEach((el) => {
      el.addEventListener("click", () => showProduct(el.dataset.pid));
    });
  }

  function renderTable(mount) {
    mount.innerHTML = `<div id="prodTable"></div>`;
    FB.dataTable({
      mount: document.getElementById("prodTable"), data: () => FB.products,
      columns: [
        { key: "name", label: "Product", render: (r) => `<div class="cell-user"><span class="avatar sm" style="background:${r.color}"><i class="fa-solid ${r.icon}" style="font-size:10px"></i></span><div class="cell-user-main"><div class="cell-name">${FB.util.escapeHtml(r.name)}</div><div class="cell-sub">${FB.util.escapeHtml(r.sku)}</div></div></div>` },
        { key: "category", label: "Category" },
        { key: "price", label: "Price", sortable: true, render: (r) => FB.util.money(r.price) },
        { key: "stock", label: "Stock", sortable: true, render: (r) => `<span class="cell-strong">${r.stock}</span>` },
        { key: "sold", label: "Sales", sortable: true },
        { key: "status", label: "Status", render: (r) => FB.util.statusBadge(stockStatus(r)) },
      ],
      search: "Search productsâ€¦",
      searchKeys: ["name", "sku"],
      filters: [{ key: "category", label: "Category", options: [
        ...[...new Set(FB.products.map((p) => p.category))].map((c) => ({ value: c, label: c })),
      ]}],
      rowActions: (r) => `<button class="btn btn-ghost btn-sm" data-view="${r.id}"><i class="fa-solid fa-eye"></i></button>
        <button class="btn btn-ghost btn-sm" data-del="${r.id}"><i class="fa-solid fa-trash"></i></button>`,
      pageSize: 10, exportName: "products",
    });
  }

  function render(mount) {
    if (viewMode === "grid") {
      const filterBar = `<div style="display:flex;gap:var(--sp-3);margin-bottom:var(--sp-4);flex-wrap:wrap">
        <div class="input-wrap" style="flex:1;min-width:200px"><i class="fa-solid fa-magnifying-glass lead"></i><input class="input" id="prodSearch" placeholder="Search productsâ€¦"/></div>
        <select class="select" id="prodCatFilter" style="min-width:160px"><option value="all">All Categories</option>
          ${[...new Set(FB.products.map((p) => p.category))].map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select>
      </div>`;
      mount.innerHTML = filterBar + '<div id="prodGrid"></div>';
      renderGrid(document.getElementById("prodGrid"));
      document.getElementById("prodSearch").addEventListener("input", () => renderGrid(document.getElementById("prodGrid")));
      document.getElementById("prodCatFilter").addEventListener("change", () => renderGrid(document.getElementById("prodGrid")));
    } else {
      renderTable(mount);
    }
  }

  function showProduct(id) {
    const p = FB.db.find("products", id);
    if (!p) return;
    FB.drawer.open(p.name, `
      <div style="text-align:center;padding:var(--sp-5);background:${p.color}12;border-radius:var(--radius);margin-bottom:var(--sp-4)">
        <i class="fa-solid ${p.icon}" style="font-size:48px;color:${p.color}"></i>
      </div>
      <div class="section-gap">
        <div class="form-row"><div class="form-group"><div class="form-label">SKU</div><span>${p.sku}</span></div><div class="form-group"><div class="form-label">Category</div><span>${p.category}</span></div></div>
        <div class="form-row"><div class="form-group"><div class="form-label">Price</div><span class="cell-strong">${FB.util.money(p.price)}</span></div><div class="form-group"><div class="form-label">Cost</div><span>${FB.util.money(p.cost)}</span></div></div>
        <div class="form-row"><div class="form-group"><div class="form-label">Stock</div><span>${p.stock}</span></div><div class="form-group"><div class="form-label">Sold</div><span>${p.sold}</span></div></div>
        <div class="form-group"><div class="form-label">Status</div>${FB.util.statusBadge(stockStatus(p))}</div>
        <div class="form-group"><div class="form-label">Rating</div><span>â­ ${p.rating}/5.0</span></div>
      </div>`);
  }

  function openAddModal() {
    const cats = [...new Set(FB.products.map((p) => p.category))];
    FB.modal.open({
      title: "Add Product",
      body: `<form class="form-grid" id="addProdForm">
        <div class="form-group"><label class="form-label">Name <span class="req">*</span></label><input class="input" name="name" required/></div>
        <div class="form-row"><div class="form-group"><label class="form-label">SKU</label><input class="input" name="sku" value="PRD-${Math.floor(Math.random()*9000+1000)}"/></div>
        <div class="form-group"><label class="form-label">Category</label><select class="select" name="category">${cats.map((c) => `<option>${c}</option>`).join("")}</select></div></div>
        <div class="form-row"><div class="form-group"><label class="form-label">Price</label><input class="input" type="number" name="price" step="0.01" value="29.99"/></div>
        <div class="form-group"><label class="form-label">Stock</label><input class="input" type="number" name="stock" value="100"/></div></div>
      </form>`,
      footer: `<button class="btn btn-secondary" onclick="FB.modal.close()">Cancel</button><button class="btn btn-primary" id="saveProdBtn">Create</button>`,
    });
    document.getElementById("saveProdBtn").addEventListener("click", () => {
      const f = document.getElementById("addProdForm");
      if (!f.name.value.trim()) { f.name.focus(); return; }
      FB.db.add("products", {
        id: `PRD-${7000 + FB.products.length + 1}`, name: f.name.value.trim(), sku: f.sku.value,
        category: f.category.value, price: +f.price.value, cost: +(f.price.value * 0.45).toFixed(2),
        stock: +f.stock.value, sold: 0, rating: 4.5, icon: "fa-box-open", color: "#6366F1",
        createdAt: new Date().toISOString(),
      });
      FB.modal.close();
      FB.toast.success("Product created");
      location.reload();
    });
  }

  function init() {
    FB.app.ready({ active: "products", crumb: ["Products"], title: "Products" });
    const mount = document.getElementById("productView");
    render(mount);
    document.getElementById("viewToggle").addEventListener("click", () => {
      viewMode = viewMode === "grid" ? "table" : "grid";
      document.getElementById("viewToggle").innerHTML = `<i class="fa-solid ${viewMode === "grid" ? "fa-table-columns" : "fa-list"}"></i>`;
      render(mount);
    });
    document.getElementById("addProductBtn").addEventListener("click", openAddModal);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
