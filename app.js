import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, addDoc, getDoc,
  onSnapshot, serverTimestamp, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const connStatus = document.getElementById("conn-status");
let inventory = {};   // { itemKey: {name, category, unit, qty, minStock} }
let transactions = []; // array, newest first

function keyOf(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

function showToast(msg, isError) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  t.classList.toggle("error", !!isError);
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.add("hidden"), 3200);
}

// ---------- Tabs ----------
document.getElementById("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
});

// ---------- Firestore listeners ----------
onSnapshot(collection(db, "inventory"), (snap) => {
  inventory = {};
  snap.forEach(d => { inventory[d.id] = d.data(); });
  connStatus.textContent = "Connected";
  connStatus.className = "conn-status conn-ok";
  renderInventory();
  renderIssueDropdown();
  renderDashboard();
}, (err) => {
  connStatus.textContent = "Connection error";
  connStatus.className = "conn-status conn-error";
  showToast("Firestore connect kore uthte parche na. firebase-config.js check korun.", true);
  console.error(err);
});

const txQuery = query(collection(db, "transactions"), orderBy("date", "desc"), limit(200));
onSnapshot(txQuery, (snap) => {
  transactions = [];
  snap.forEach(d => transactions.push({ id: d.id, ...d.data() }));
  renderTransactions();
  renderDashboard();
}, (err) => console.error(err));

// ---------- Stock In ----------
document.getElementById("form-stockin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("in-name").value.trim();
  const qty = parseFloat(document.getElementById("in-qty").value);
  if (!name) return showToast("Item name din.", true);
  if (!qty || qty <= 0) return showToast("Sothik quantity din.", true);

  const k = keyOf(name);
  const category = document.getElementById("in-category").value;
  const unit = document.getElementById("in-unit").value;
  const minInput = document.getElementById("in-min").value;
  const by = document.getElementById("in-by").value.trim() || "-";
  const note = document.getElementById("in-note").value.trim() || "-";

  try {
    const ref = doc(db, "inventory", k);
    const existing = inventory[k];
    const newQty = (existing ? existing.qty : 0) + qty;
    await setDoc(ref, {
      name: existing ? existing.name : name,
      category: existing ? existing.category : category,
      unit: existing ? existing.unit : unit,
      qty: newQty,
      minStock: minInput ? parseFloat(minInput) : (existing ? existing.minStock || 0 : 0),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    await addDoc(collection(db, "transactions"), {
      date: serverTimestamp(),
      type: "IN",
      itemKey: k,
      itemName: existing ? existing.name : name,
      qty, department: "Store", by, note
    });

    showToast(name + " stock-e add hoyeche (+" + qty + " " + unit + ")");
    document.getElementById("form-stockin").reset();
  } catch (err) {
    console.error(err);
    showToast("Save kora jayni. Abar try korun.", true);
  }
});

// ---------- Issue Item ----------
document.getElementById("form-issue").addEventListener("submit", async (e) => {
  e.preventDefault();
  const k = document.getElementById("out-item").value;
  const qty = parseFloat(document.getElementById("out-qty").value);
  const department = document.getElementById("out-dept").value;
  const by = document.getElementById("out-by").value.trim() || "-";
  const note = document.getElementById("out-note").value.trim() || "-";

  if (!k) return showToast("Item select korun.", true);
  if (!qty || qty <= 0) return showToast("Sothik quantity din.", true);

  try {
    const ref = doc(db, "inventory", k);
    const snap = await getDoc(ref);
    if (!snap.exists()) return showToast("Item pawa jayni.", true);
    const item = snap.data();
    if (qty > item.qty) {
      return showToast("Stock-e shudhu " + item.qty + " " + item.unit + " ache — eto issue kora jabe na.", true);
    }
    await setDoc(ref, { qty: item.qty - qty, lastUpdated: serverTimestamp() }, { merge: true });
    await addDoc(collection(db, "transactions"), {
      date: serverTimestamp(),
      type: "OUT",
      itemKey: k,
      itemName: item.name,
      qty, department, by, note
    });
    showToast(qty + " " + item.unit + " " + item.name + " → " + department + " ke issue kora hoyeche");
    document.getElementById("form-issue").reset();
  } catch (err) {
    console.error(err);
    showToast("Save kora jayni. Abar try korun.", true);
  }
});

// ---------- Render: Dashboard ----------
function renderDashboard() {
  const items = Object.entries(inventory).map(([k, v]) => ({ key: k, ...v }));
  document.getElementById("stat-items").textContent = items.length;
  document.getElementById("stat-qty").textContent = items.reduce((s, i) => s + (i.qty || 0), 0).toLocaleString();
  document.getElementById("stat-tx").textContent = transactions.length;

  const low = items.filter(i => i.minStock > 0 && i.qty <= i.minStock);
  document.getElementById("stat-low").textContent = low.length;

  const lowBlock = document.getElementById("low-stock-block");
  const lowList = document.getElementById("low-stock-list");
  if (low.length) {
    lowBlock.classList.remove("hidden");
    lowList.innerHTML = low.map(i => `
      <div class="row low-stock">
        <div><div class="row-main">${esc(i.name)}</div></div>
        <div class="row-qty">${i.qty} ${esc(i.unit)} (min ${i.minStock})</div>
      </div>`).join("");
  } else {
    lowBlock.classList.add("hidden");
  }

  const recent = transactions.slice(0, 8);
  document.getElementById("recent-list").innerHTML = recent.length ? recent.map(t => `
    <div class="row">
      <div>
        <div class="row-main">${esc(t.itemName)}</div>
        <div class="row-sub">${t.type === "IN" ? "Store-e ashlo" : "→ " + esc(t.department)}</div>
      </div>
      <div class="row-qty ${t.type === "IN" ? "in" : "out"}">${t.type === "IN" ? "+" : "-"}${t.qty}</div>
    </div>`).join("") : `<p class="hint">Ekhono kono transaction nei.</p>`;
}

// ---------- Render: Inventory list ----------
function renderInventory() {
  const search = (document.getElementById("search-inventory").value || "").toLowerCase();
  const items = Object.entries(inventory)
    .map(([k, v]) => ({ key: k, ...v }))
    .filter(i => !search || i.name.toLowerCase().includes(search))
    .sort((a, b) => a.name.localeCompare(b.name));

  document.getElementById("inventory-list").innerHTML = items.length ? items.map(i => {
    const low = i.minStock > 0 && i.qty <= i.minStock;
    return `
    <div class="row ${low ? "low-stock" : ""}">
      <div>
        <div class="row-main">${esc(i.name)}</div>
        <div class="row-sub">${esc(i.category)}</div>
      </div>
      <div class="row-qty">${i.qty} ${esc(i.unit)}</div>
    </div>`;
  }).join("") : `<p class="hint">Kono item nei.</p>`;
}
document.getElementById("search-inventory").addEventListener("input", renderInventory);

// ---------- Render: Issue dropdown ----------
function renderIssueDropdown() {
  const sel = document.getElementById("out-item");
  const current = sel.value;
  const items = Object.entries(inventory).map(([k, v]) => ({ key: k, ...v })).sort((a, b) => a.name.localeCompare(b.name));
  sel.innerHTML = `<option value="">-- Select item --</option>` + items.map(i =>
    `<option value="${i.key}">${esc(i.name)} (available: ${i.qty} ${esc(i.unit)})</option>`
  ).join("");
  if (items.find(i => i.key === current)) sel.value = current;
}

// ---------- Render: Transactions ----------
let txFilter = "all";
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    txFilter = btn.dataset.filter;
    renderTransactions();
  });
});

function renderTransactions() {
  const list = txFilter === "all" ? transactions : transactions.filter(t => t.type === txFilter);
  document.getElementById("tx-list").innerHTML = list.length ? list.map(t => `
    <div class="row" style="flex-direction:column;align-items:stretch;gap:4px;">
      <div style="display:flex;justify-content:space-between;">
        <span class="row-main">${esc(t.itemName)}</span>
        <span class="row-qty ${t.type === "IN" ? "in" : "out"}">${t.type === "IN" ? "+" : "-"}${t.qty}</span>
      </div>
      <div class="row-sub" style="display:flex;justify-content:space-between;">
        <span>${t.type === "IN" ? "Store entry · by " + esc(t.by) : "→ " + esc(t.department) + " · by " + esc(t.by)}</span>
        <span>${fmtDate(t.date)}</span>
      </div>
      ${t.note && t.note !== "-" ? `<div class="row-sub">${esc(t.note)}</div>` : ""}
    </div>`).join("") : `<p class="hint">Kono transaction nei.</p>`;
}

function fmtDate(ts) {
  if (!ts || !ts.toDate) return "just now";
  const d = ts.toDate();
  return d.toLocaleDateString("en-GB") + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
