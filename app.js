const STORAGE_KEY = "tekstil-hesap-customers";
const ORDER_STORAGE_KEY = "tekstil-hesap-orders";
const CONFIG_STORAGE_KEY = "tekstil-hesap-config";
const COLOR_SPLIT_MATERIAL_KEYWORDS = ["ceplik", "kemer astarı", "diz astarı", "biye"];

const nowIso = () => new Date().toISOString();

const defaultCustomers = [
  {
    id: crypto.randomUUID(),
    name: "Veli",
    workshopName: "Genel Atölye",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    materials: [
      { name: "Ceplik", unit: "metre", value: 0.4 },
      { name: "Kemer astarı", unit: "metre", value: 1.25 },
      { name: "2,5 cm Biye Siyah", unit: "metre", value: 3 },
      { name: "Tela 5 cm", unit: "metre", value: 2 },
      { name: "Tarlatan", unit: "metre", value: 2 },
      { name: "Fermuar", unit: "adet", value: 1 }
    ]
  },
  {
    id: crypto.randomUUID(),
    name: "X Tekstil",
    workshopName: "A Atölyesi",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    materials: [
      { name: "Ceplik", unit: "metre", value: 0.4 }
    ]
  }
];

let appConfig = loadConfig();
let customers = loadCustomers();
let orders = loadOrders();
let editingId = null;
let selectedOrderDetailId = null;
let currentMode = hasCloudConfig() ? "cloud" : "local";

const screens = {
  calculate: document.querySelector("#calculate-screen"),
  save: document.querySelector("#save-screen"),
  list: document.querySelector("#list-screen"),
  reports: document.querySelector("#reports-screen"),
  settings: document.querySelector("#settings-screen")
};

const tabs = document.querySelectorAll(".tab");
const customerForm = document.querySelector("#customer-form");
const customerName = document.querySelector("#customer-name");
const workshopName = document.querySelector("#workshop-name");
const materialEditor = document.querySelector("#material-editor");
const materialTemplate = document.querySelector("#material-template");
const customerSelect = document.querySelector("#customer-select");
const workshopSelect = document.querySelector("#workshop-select");
const whiteQuantityInput = document.querySelector("#white-quantity-input");
const blackQuantityInput = document.querySelector("#black-quantity-input");
const quantityInput = document.querySelector("#quantity-input");
const orderDateInput = document.querySelector("#order-date-input");
const operatorInput = document.querySelector("#operator-input");
const calculateButton = document.querySelector("#calculate-button");
const resultPanel = document.querySelector("#result-panel");
const resultTitle = document.querySelector("#result-title");
const resultList = document.querySelector("#result-list");
const emptyResult = document.querySelector("#empty-result");
const customerList = document.querySelector("#customer-list");
const customerCount = document.querySelector("#customer-count");
const searchInput = document.querySelector("#search-input");
const historyList = document.querySelector("#history-list");
const orderDetail = document.querySelector("#order-detail");
const orderDetailBackdrop = document.querySelector("#order-detail-backdrop");
const orderDetailClose = document.querySelector("#order-detail-close");
const orderDetailDone = document.querySelector("#order-detail-done");
const orderDetailCopy = document.querySelector("#order-detail-copy");
const orderDetailTitle = document.querySelector("#order-detail-title");
const orderDetailMeta = document.querySelector("#order-detail-meta");
const orderDetailSummary = document.querySelector("#order-detail-summary");
const orderDetailMaterials = document.querySelector("#order-detail-materials");
const reportMonthInput = document.querySelector("#report-month");
const yearWheel = document.querySelector("#year-wheel");
const monthWheel = document.querySelector("#month-wheel");
const selectedReportMonth = document.querySelector("#selected-report-month");
const reportButton = document.querySelector("#report-button");
const reportTitle = document.querySelector("#report-title");
const reportList = document.querySelector("#report-list");
const reportTotal = document.querySelector("#report-total");
const syncStatus = document.querySelector("#sync-status");
const settingsForm = document.querySelector("#settings-form");
const supabaseUrlInput = document.querySelector("#supabase-url");
const supabaseKeyInput = document.querySelector("#supabase-key");
const defaultOperatorInput = document.querySelector("#default-operator");
const toast = document.querySelector("#toast");

document.querySelector("#add-material").addEventListener("click", () => addMaterialRow());
document.querySelector("#reset-form").addEventListener("click", resetForm);
document.querySelector("#new-customer").addEventListener("click", () => {
  resetForm();
  switchScreen("save");
});
document.querySelector("#copy-result").addEventListener("click", copyResult);
document.querySelector("#export-history").addEventListener("click", exportHistoryCsv);
orderDetailBackdrop?.addEventListener("click", closeOrderDetail);
orderDetailClose?.addEventListener("click", closeOrderDetail);
orderDetailDone?.addEventListener("click", closeOrderDetail);
orderDetailCopy?.addEventListener("click", copySelectedOrderDetail);
document.querySelector("#test-connection").addEventListener("click", testConnection);
document.querySelector("#refresh-cloud").addEventListener("click", refreshFromCloud);
document.querySelector("#upload-local").addEventListener("click", uploadLocalData);
document.querySelector("#seed-samples").addEventListener("click", seedSampleCustomers);
document.querySelector("#local-mode").addEventListener("click", clearCloudConfig);
calculateButton.addEventListener("click", calculateOrder);
customerSelect.addEventListener("change", () => {
  renderWorkshopSelect(customerSelect.value);
  clearCalculationResult();
});
if (reportButton) reportButton.addEventListener("click", renderReport);
document.querySelector("#export-report")?.addEventListener("click", exportReportCsv);
selectedReportMonth?.addEventListener("click", () => renderReport());
searchInput.addEventListener("input", renderCustomers);
if (reportMonthInput) reportMonthInput.addEventListener("change", renderReport);
whiteQuantityInput?.addEventListener("input", updateTotalQuantityFromColors);
blackQuantityInput?.addEventListener("input", updateTotalQuantityFromColors);

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchScreen(tab.dataset.screen));
});

customerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveCustomer();
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSettings();
});

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || "{}");
    return {
      supabaseUrl: saved.supabaseUrl || "",
      supabaseKey: saved.supabaseKey || "",
      defaultOperator: saved.defaultOperator || ""
    };
  } catch {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    return { supabaseUrl: "", supabaseKey: "", defaultOperator: "" };
  }
}

function saveConfig() {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(appConfig));
}

function hasCloudConfig() {
  return Boolean(appConfig.supabaseUrl && appConfig.supabaseKey);
}

function loadCustomers() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultCustomers;

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.map((customer) => ({
        ...customer,
        workshopName: customer.workshopName || "Genel Atölye",
        createdAt: customer.createdAt || nowIso(),
        updatedAt: customer.updatedAt || customer.createdAt || nowIso()
      }));
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return defaultCustomers;
}

function loadOrders() {
  const saved = localStorage.getItem(ORDER_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.map((order) => ({
        ...order,
        workshopName: order.workshopName || "Genel Atölye"
      }));
    }
  } catch {
    localStorage.removeItem(ORDER_STORAGE_KEY);
  }

  return [];
}

function persistCustomers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

function persistOrders() {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
}

function switchScreen(screenName) {
  Object.entries(screens).forEach(([name, screen]) => {
    screen.classList.toggle("active", name === screenName);
  });

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.screen === screenName);
  });

  if (screenName === "reports") renderReport();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function addMaterialRow(material = {}) {
  const fragment = materialTemplate.content.cloneNode(true);
  const item = fragment.querySelector(".material-item");
  const nameInput = fragment.querySelector(".material-name");
  const unitSelect = fragment.querySelector(".material-unit");
  const valueInput = fragment.querySelector(".material-value");

  item.dataset.materialId = material.id || "";
  nameInput.value = material.name || "";
  unitSelect.value = material.unit || "metre";
  valueInput.value = material.value ?? "";

  fragment.querySelector(".remove-material").addEventListener("click", () => {
    if (materialEditor.children.length === 1) {
      showToast("En az bir malzeme olmalı.");
      return;
    }
    item.remove();
  });

  materialEditor.append(fragment);
}

function readMaterialsFromForm() {
  return [...materialEditor.querySelectorAll(".material-item")]
    .map((item) => ({
      id: item.dataset.materialId || crypto.randomUUID(),
      name: item.querySelector(".material-name").value.trim(),
      unit: item.querySelector(".material-unit").value,
      value: Number(item.querySelector(".material-value").value)
    }))
    .filter((material) => material.name && Number.isFinite(material.value) && material.value >= 0);
}

async function saveCustomer() {
  const name = customerName.value.trim();
  const workshop = workshopName.value.trim();
  const materials = readMaterialsFromForm();

  if (!name) {
    showToast("Müşteri adını yazın.");
    return;
  }

  if (!workshop) {
    showToast("Atölye adını yazın.");
    return;
  }

  if (!materials.length) {
    showToast("En az bir malzeme ekleyin.");
    return;
  }

  try {
    if (currentMode === "cloud") {
      await saveCustomerToCloud({ id: editingId || crypto.randomUUID(), name, workshopName: workshop, materials });
      await refreshFromCloud({ silent: true });
      showToast(editingId ? "Müşteri bulutta güncellendi." : "Müşteri buluta kaydedildi.");
    } else if (editingId) {
      customers = customers.map((customer) =>
        customer.id === editingId ? { ...customer, name, workshopName: workshop, materials, updatedAt: nowIso() } : customer
      );
      persistCustomers();
      showToast("Müşteri güncellendi.");
    } else {
      customers.unshift({
        id: crypto.randomUUID(),
        name,
        workshopName: workshop,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        materials
      });
      persistCustomers();
      showToast("Müşteri kaydedildi.");
    }

    renderAll();
    resetForm();
    switchScreen("list");
  } catch (error) {
    showToast(`Kayıt yapılamadı: ${error.message}`);
  }
}

function resetForm() {
  editingId = null;
  customerName.value = "";
  workshopName.value = "";
  materialEditor.innerHTML = "";
  addMaterialRow();
  customerForm.querySelector(".primary-action").textContent = "Müşteriyi Kaydet";
}

function editCustomer(id) {
  const customer = customers.find((item) => item.id === id);
  if (!customer) return;

  editingId = id;
  customerName.value = customer.name;
  workshopName.value = customer.workshopName || "Genel Atölye";
  materialEditor.innerHTML = "";
  customer.materials.forEach((material) => addMaterialRow(material));
  customerForm.querySelector(".primary-action").textContent = "Müşteriyi Güncelle";
  switchScreen("save");
}

async function deleteCustomer(id) {
  const customer = customers.find((item) => item.id === id);
  if (!customer) return;

  const confirmed = confirm(`${formatCustomerLabel(customer)} silinsin mi?`);
  if (!confirmed) return;

  try {
    if (currentMode === "cloud") {
      await apiDelete(`customers?id=eq.${encodeURIComponent(id)}`);
      await refreshFromCloud({ silent: true });
      showToast("Müşteri buluttan silindi.");
    } else {
      customers = customers.filter((item) => item.id !== id);
      persistCustomers();
      showToast("Müşteri silindi.");
    }
    renderAll();
  } catch (error) {
    showToast(`Silinemedi: ${error.message}`);
  }
}

async function calculateOrder() {
  const customer = getSelectedWorkshopCustomer();
  const quantities = getOrderQuantities();
  const quantity = quantities.total;
  const orderDate = orderDateInput.value || getTodayDateValue();
  const operator = operatorInput.value.trim() || appConfig.defaultOperator || "Belirtilmedi";

  if (!customerSelect.value) {
    showToast("Önce müşteri seçin.");
    return;
  }

  if (!customer) {
    showToast("Atölye seçin.");
    return;
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    showToast("Beyaz veya siyah iş adedini girin.");
    return;
  }

  const calculatedMaterials = calculateMaterials(customer.materials, quantities);

  const order = {
    id: crypto.randomUUID(),
    createdAt: makeOrderDateIso(orderDate),
    customerId: customer.id,
    customerName: customer.name,
    workshopName: customer.workshopName || "Genel Atölye",
    quantity,
    colorQuantities: {
      white: quantities.white,
      black: quantities.black
    },
    operator,
    materials: calculatedMaterials
  };

  try {
    if (currentMode === "cloud") {
      await saveOrderToCloud(order);
      await refreshOrdersFromCloud();
    } else {
      orders.unshift(order);
      persistOrders();
    }

    renderResult(customer, quantities, calculatedMaterials);
    renderHistory();
    renderReport();
    showToast(currentMode === "cloud" ? "Hesaplama buluta kaydedildi." : "Hesaplama tarihli kayıt olarak saklandı.");
  } catch (error) {
    showToast(`Hesaplama kaydedilemedi: ${error.message}`);
  }
}

function renderResult(customer, quantities, calculatedMaterials) {
  resultTitle.textContent = `${formatCustomerLabel(customer)} · ${formatOrderQuantitySummary({ quantity: quantities.total, colorQuantities: quantities })}`;
  resultList.innerHTML = "";

  calculatedMaterials.forEach((material) => {
    const row = document.createElement("div");
    row.className = "result-row";
    row.innerHTML = `
      <strong>${escapeHtml(material.name)}</strong>
      <span>${formatNumber(material.total)} ${escapeHtml(material.unit)}</span>
    `;
    resultList.append(row);
  });

  emptyResult.classList.add("hidden");
  resultPanel.classList.remove("hidden");
}

function updateTotalQuantityFromColors() {
  const quantities = getOrderQuantities();
  quantityInput.value = quantities.total > 0 ? quantities.total : "";
  clearCalculationResult();
}

function getOrderQuantities() {
  const white = getQuantityInputValue(whiteQuantityInput);
  const black = getQuantityInputValue(blackQuantityInput);

  return {
    white,
    black,
    total: white + black
  };
}

function getQuantityInputValue(input) {
  const value = Number(input?.value || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function calculateMaterials(materials, quantities) {
  return materials.flatMap((material) => {
    if (!isColorSplitMaterial(material.name)) {
      return [{
        name: material.name,
        unit: material.unit,
        unitValue: material.value,
        total: material.value * quantities.total
      }];
    }

    const baseName = getColorSplitBaseName(material.name);
    const rows = [];

    if (quantities.white > 0) {
      rows.push({
        name: `${baseName} - Beyaz`,
        unit: material.unit,
        unitValue: material.value,
        total: material.value * quantities.white
      });
    }

    if (quantities.black > 0) {
      rows.push({
        name: `${baseName} - Siyah`,
        unit: material.unit,
        unitValue: material.value,
        total: material.value * quantities.black
      });
    }

    return rows;
  });
}

function isColorSplitMaterial(name) {
  const normalized = normalizeMaterialName(name);
  return COLOR_SPLIT_MATERIAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function getColorSplitBaseName(name) {
  return String(name)
    .replace(/\s*[-–—]?\s*(beyaz|siyah)\s*$/i, "")
    .replace(/\s*(^|\s)(beyaz|siyah)(?=\s|$)\s*/ig, " ")
    .trim();
}

function normalizeMaterialName(name) {
  return String(name || "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function copyResult() {
  const customer = getSelectedWorkshopCustomer();
  const quantities = getOrderQuantities();
  if (!customer || quantities.total <= 0) return;

  const calculatedMaterials = calculateMaterials(customer.materials, quantities);

  const lines = [
    `${formatCustomerLabel(customer)} - ${formatOrderQuantitySummary({ quantity: quantities.total, colorQuantities: quantities })}`,
    ...calculatedMaterials.map((material) => `${material.name}: ${formatNumber(material.total)} ${material.unit}`)
  ];

  navigator.clipboard.writeText(lines.join("\n"))
    .then(() => showToast("Sonuç kopyalandı."))
    .catch(() => showToast("Kopyalama yapılamadı."));
}

function renderSelect() {
  customerSelect.innerHTML = "";
  renderWorkshopSelect("");

  if (!customers.length) {
    customerSelect.append(new Option("Önce müşteri kaydedin", ""));
    customerSelect.disabled = true;
    return;
  }

  customerSelect.disabled = false;
  customerSelect.append(new Option("Müşteri seçin", ""));
  getUniqueCustomerNames().forEach((name) => {
    customerSelect.append(new Option(name, name));
  });
}

function renderWorkshopSelect(customerNameValue) {
  workshopSelect.innerHTML = "";

  if (!customerNameValue) {
    workshopSelect.append(new Option("Önce müşteri seçin", ""));
    workshopSelect.disabled = true;
    return;
  }

  const workshopCustomers = getWorkshopCustomers(customerNameValue);

  if (!workshopCustomers.length) {
    workshopSelect.append(new Option("Atölye bulunamadı", ""));
    workshopSelect.disabled = true;
    return;
  }

  workshopSelect.disabled = false;
  workshopSelect.append(new Option("Atölye seçin", ""));
  workshopCustomers.forEach((customer) => {
    workshopSelect.append(new Option(customer.workshopName || "Genel Atölye", customer.id));
  });
}

function getSelectedWorkshopCustomer() {
  return customers.find((item) => item.id === workshopSelect.value);
}

function getUniqueCustomerNames() {
  return [...new Set(customers.map((customer) => customer.name))]
    .sort((a, b) => a.localeCompare(b, "tr"));
}

function getWorkshopCustomers(customerNameValue) {
  return customers
    .filter((customer) => customer.name === customerNameValue)
    .sort((a, b) => (a.workshopName || "").localeCompare(b.workshopName || "", "tr"));
}

function clearCalculationResult() {
  emptyResult.classList.remove("hidden");
  resultPanel.classList.add("hidden");
}

function renderCustomers() {
  const query = searchInput.value.trim().toLocaleLowerCase("tr-TR");
  const filtered = customers.filter((customer) => {
    const materialText = customer.materials.map((material) => material.name).join(" ");
    return `${customer.name} ${customer.workshopName || ""} ${materialText}`.toLocaleLowerCase("tr-TR").includes(query);
  });

  customerCount.textContent = `${customers.length} müşteri`;
  customerList.innerHTML = "";

  if (!filtered.length) {
    customerList.innerHTML = `<div class="empty-list">Kayıt bulunamadı.</div>`;
    return;
  }

  filtered.forEach((customer) => {
    const row = document.createElement("div");
    row.className = "customer-row";
    row.innerHTML = `
      <div class="customer-name-cell">
        <strong>${escapeHtml(customer.name)}</strong>
        <span>${escapeHtml(customer.workshopName || "Genel Atölye")}</span>
        <small>${customer.materials.length} kayıtlı malzeme · Güncelleme: ${formatDate(customer.updatedAt)}</small>
      </div>
      <div class="customer-materials-cell">
        <div class="material-tags">
          ${customer.materials.map((material) => `
            <span class="tag">
              ${escapeHtml(material.name)}
              <span>${formatNumber(material.value)} ${escapeHtml(material.unit)}</span>
            </span>
          `).join("")}
        </div>
      </div>
      <div class="customer-actions-cell">
        <button class="row-button edit" type="button">Düzenle</button>
        <button class="row-button delete" type="button">Sil</button>
      </div>
    `;

    row.querySelector(".edit").addEventListener("click", () => editCustomer(customer.id));
    row.querySelector(".delete").addEventListener("click", () => deleteCustomer(customer.id));
    customerList.append(row);
  });
}

function renderHistory() {
  historyList.innerHTML = "";

  if (!orders.length) {
    historyList.innerHTML = `<div class="empty-list">Henüz sipariş kaydı yok.</div>`;
    return;
  }

  getOrdersSortedByDateDesc().slice(0, 50).forEach((order) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <div class="history-top">
        <div class="history-meta">
          <strong>${escapeHtml(order.customerName)}</strong>
          <span>${escapeHtml(order.workshopName || "Genel Atölye")} · ${formatDateTime(order.createdAt)} · ${escapeHtml(formatOrderQuantitySummary(order))} · ${escapeHtml(order.operator || "Belirtilmedi")}</span>
        </div>
        <button class="row-button delete history-delete" type="button">Sil</button>
      </div>
      <div class="material-tags">
        ${order.materials.map((material) => `
          <span class="tag">
            ${escapeHtml(material.name)}
            <span>${formatNumber(material.total)} ${escapeHtml(material.unit)}</span>
          </span>
        `).join("")}
      </div>
    `;
    item.addEventListener("click", () => openOrderDetail(order.id));
    item.querySelector(".history-delete").addEventListener("click", (event) => {
      event.stopPropagation();
      deleteOrder(order.id);
    });
    historyList.append(item);
  });
}

function openOrderDetail(id) {
  const order = orders.find((item) => item.id === id);
  if (!order || !orderDetail) return;

  selectedOrderDetailId = id;
  orderDetailTitle.textContent = order.customerName;
  orderDetailMeta.innerHTML = `
    <div>
      <span>Atölye</span>
      <strong>${escapeHtml(order.workshopName || "Genel Atölye")}</strong>
    </div>
    <div>
      <span>Tarih / Saat</span>
      <strong>${formatDateTime(order.createdAt)}</strong>
    </div>
    <div>
      <span>İşlemi Yapan</span>
      <strong>${escapeHtml(order.operator || "Belirtilmedi")}</strong>
    </div>
  `;

  orderDetailSummary.innerHTML = renderOrderQuantityCards(order);
  orderDetailMaterials.innerHTML = order.materials.map((material) => `
    <div class="detail-material-row">
      <div>
        <strong>${escapeHtml(material.name)}</strong>
        <span>${formatNumber(material.unitValue)} ${escapeHtml(material.unit)} / iş</span>
      </div>
      <strong>${formatNumber(material.total)} ${escapeHtml(material.unit)}</strong>
    </div>
  `).join("");

  orderDetail.classList.remove("hidden");
  document.body.classList.add("detail-open");
}

function closeOrderDetail() {
  selectedOrderDetailId = null;
  orderDetail?.classList.add("hidden");
  document.body.classList.remove("detail-open");
}

function copySelectedOrderDetail() {
  const order = orders.find((item) => item.id === selectedOrderDetailId);
  if (!order) return;

  navigator.clipboard.writeText(getOrderDetailLines(order).join("\n"))
    .then(() => showToast("Sipariş detayı kopyalandı."))
    .catch(() => showToast("Kopyalama yapılamadı."));
}

function renderOrderQuantityCards(order) {
  const colors = getOrderColorQuantities(order);
  const cards = [
    ["Toplam", `${formatNumber(order.quantity)} iş`]
  ];

  if (colors.white > 0) cards.push(["Beyaz", `${formatNumber(colors.white)} iş`]);
  if (colors.black > 0) cards.push(["Siyah", `${formatNumber(colors.black)} iş`]);

  return cards.map(([label, value]) => `
    <div>
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function getOrderDetailLines(order) {
  return [
    `${order.customerName} / ${order.workshopName || "Genel Atölye"}`,
    `Tarih: ${formatDateTime(order.createdAt)}`,
    `İş: ${formatOrderQuantitySummary(order)}`,
    `İşlemi yapan: ${order.operator || "Belirtilmedi"}`,
    "",
    "Malzeme Dökümü:",
    ...order.materials.map((material) => `${material.name}: ${formatNumber(material.total)} ${material.unit}`)
  ];
}

async function deleteOrder(id) {
  const order = orders.find((item) => item.id === id);
  if (!order) return;

  const confirmed = confirm(`${order.customerName} / ${order.workshopName || "Genel Atölye"} için ${formatDateTime(order.createdAt)} tarihli sipariş silinsin mi?`);
  if (!confirmed) return;

  try {
    if (currentMode === "cloud") {
      await apiDelete(`orders?id=eq.${encodeURIComponent(id)}`);
      await refreshOrdersFromCloud();
      showToast("Sipariş buluttan silindi.");
    } else {
      orders = orders.filter((item) => item.id !== id);
      persistOrders();
      showToast("Sipariş silindi.");
    }

    renderHistory();
    renderReport();
  } catch (error) {
    showToast(`Sipariş silinemedi: ${error.message}`);
  }
}

function renderReport() {
  if (!reportMonthInput || !reportTitle || !reportList || !reportTotal) return;

  const selectedMonth = reportMonthInput.value || getCurrentMonthValue();
  reportMonthInput.value = selectedMonth;
  updateReportWheelSelection(selectedMonth);

  const filteredOrders = getOrdersForMonth(selectedMonth);
  const monthName = formatMonthTitle(selectedMonth);
  const totalQuantity = filteredOrders.reduce((total, order) => total + Number(order.quantity || 0), 0);

  reportTitle.textContent = `${monthName} Raporu`;
  reportList.innerHTML = "";
  reportTotal.innerHTML = "";

  if (!filteredOrders.length) {
    reportList.innerHTML = `<div class="empty-list">${monthName} için sipariş kaydı yok.</div>`;
    reportTotal.textContent = `Toplam: 0 iş`;
    return;
  }

  filteredOrders.forEach((order) => {
    const row = document.createElement("div");
    row.className = "report-row";
    row.innerHTML = `
      <div>
        <strong>${formatDate(order.createdAt)}</strong>
        <span>${escapeHtml(order.customerName)} · ${escapeHtml(order.workshopName || "Genel Atölye")} · ${escapeHtml(order.operator || "Belirtilmedi")}</span>
      </div>
      <strong>${escapeHtml(formatOrderQuantitySummary(order))}</strong>
    `;
    reportList.append(row);
  });

  reportTotal.innerHTML = `
    <span>Aylık toplam sipariş</span>
    <strong>${formatNumber(totalQuantity)} iş</strong>
  `;
}

function getOrdersForMonth(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);

  return orders
    .filter((order) => {
      const date = new Date(order.createdAt);
      return date.getFullYear() === year && date.getMonth() === month - 1;
    })
    .sort(compareOrdersByDateDesc);
}

function exportReportCsv() {
  const selectedMonth = reportMonthInput.value || getCurrentMonthValue();
  const filteredOrders = getOrdersForMonth(selectedMonth);

  if (!filteredOrders.length) {
    showToast("Dışa aktarılacak rapor kaydı yok.");
    return;
  }

  const rows = [["Tarih", "Müşteri", "Atölye", "Toplam İş", "Beyaz İş", "Siyah İş", "İşlemi Yapan"]];
  filteredOrders.forEach((order) => {
    const colors = getOrderColorQuantities(order);
    rows.push([
      formatDateTime(order.createdAt),
      order.customerName,
      order.workshopName || "Genel Atölye",
      order.quantity,
      colors.white || "",
      colors.black || "",
      order.operator || "Belirtilmedi"
    ]);
  });

  const totalQuantity = filteredOrders.reduce((total, order) => total + Number(order.quantity || 0), 0);
  rows.push(["", "AYLIK TOPLAM", "", totalQuantity, "", "", ""]);

  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ahenk-tekstil-aylik-rapor-${selectedMonth}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Aylık rapor CSV olarak hazırlandı.");
}

function initReportWheel() {
  if (!reportMonthInput || !yearWheel || !monthWheel) return;

  const selectedMonth = reportMonthInput.value || getCurrentMonthValue();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 9 }, (_, index) => currentYear - 5 + index);
  const months = getMonthNames();

  yearWheel.innerHTML = years.map((year) => `
    <button class="wheel-option" type="button" data-value="${year}">${year}</button>
  `).join("");

  monthWheel.innerHTML = months.map((month, index) => `
    <button class="wheel-option" type="button" data-value="${String(index + 1).padStart(2, "0")}">${month}</button>
  `).join("");

  yearWheel.querySelectorAll(".wheel-option").forEach((button) => {
    button.addEventListener("click", () => setReportWheelValue({ year: button.dataset.value }));
  });

  monthWheel.querySelectorAll(".wheel-option").forEach((button) => {
    button.addEventListener("click", () => setReportWheelValue({ month: button.dataset.value }));
  });

  bindWheelScroll(yearWheel, "year");
  bindWheelScroll(monthWheel, "month");
  reportMonthInput.value = selectedMonth;
  updateReportWheelSelection(selectedMonth);
}

function setReportWheelValue({ year, month }) {
  const [currentYear, currentMonth] = (reportMonthInput.value || getCurrentMonthValue()).split("-");
  reportMonthInput.value = `${year || currentYear}-${month || currentMonth}`;
  renderReport();
}

function updateReportWheelSelection(monthValue) {
  if (!yearWheel || !monthWheel || !monthValue) return;

  const [selectedYear, selectedMonth] = monthValue.split("-");
  updateWheelColumn(yearWheel, selectedYear);
  updateWheelColumn(monthWheel, selectedMonth);
  if (selectedReportMonth) selectedReportMonth.textContent = formatMonthTitle(monthValue);
}

function updateWheelColumn(column, value) {
  column.querySelectorAll(".wheel-option").forEach((button) => {
    button.classList.toggle("selected", button.dataset.value === value);
  });

  const selected = column.querySelector(`.wheel-option[data-value="${value}"]`);
  if (selected) {
    selected.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

function bindWheelScroll(column, type) {
  let scrollTimer;

  column.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const centered = getCenteredWheelOption(column);
      if (!centered) return;
      setReportWheelValue(type === "year" ? { year: centered.dataset.value } : { month: centered.dataset.value });
    }, 120);
  }, { passive: true });
}

function getCenteredWheelOption(column) {
  const columnRect = column.getBoundingClientRect();
  const center = columnRect.top + columnRect.height / 2;
  let closest = null;
  let closestDistance = Infinity;

  column.querySelectorAll(".wheel-option").forEach((button) => {
    const rect = button.getBoundingClientRect();
    const optionCenter = rect.top + rect.height / 2;
    const distance = Math.abs(optionCenter - center);
    if (distance < closestDistance) {
      closest = button;
      closestDistance = distance;
    }
  });

  return closest;
}

function exportHistoryCsv() {
  if (!orders.length) {
    showToast("Dışa aktarılacak kayıt yok.");
    return;
  }

  const rows = [
    ["Tarih", "Müşteri", "Atölye", "Toplam İş", "Beyaz İş", "Siyah İş", "İşlemi Yapan", "Malzeme", "Birim Değer", "Toplam", "Birim"]
  ];

  orders.forEach((order) => {
    const colors = getOrderColorQuantities(order);
    order.materials.forEach((material) => {
      rows.push([
        formatDateTime(order.createdAt),
        order.customerName,
        order.workshopName || "Genel Atölye",
        order.quantity,
        colors.white || "",
        colors.black || "",
        order.operator || "Belirtilmedi",
        material.name,
        material.unitValue,
        material.total,
        material.unit
      ]);
    });
  });

  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tekstil-siparis-kayitlari-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV dosyası hazırlandı.");
}

async function saveSettings() {
  appConfig = {
    supabaseUrl: normalizeSupabaseUrl(supabaseUrlInput.value),
    supabaseKey: supabaseKeyInput.value.trim(),
    defaultOperator: defaultOperatorInput.value.trim()
  };
  saveConfig();
  currentMode = hasCloudConfig() ? "cloud" : "local";
  operatorInput.value = appConfig.defaultOperator;
  updateSyncStatus("Bağlantı kaydedildi");

  if (currentMode === "cloud") {
    await refreshFromCloud();
  } else {
    renderAll();
  }
}

async function testConnection() {
  const draft = {
    supabaseUrl: normalizeSupabaseUrl(supabaseUrlInput.value),
    supabaseKey: supabaseKeyInput.value.trim()
  };

  if (!draft.supabaseUrl || !draft.supabaseKey) {
    showToast("URL ve anon key girin.");
    return;
  }

  try {
    await apiGet("customers?select=id&limit=1", draft);
    showToast("Bağlantı başarılı.");
  } catch (error) {
    showToast(`Bağlantı olmadı: ${error.message}`);
  }
}

async function refreshFromCloud(options = {}) {
  if (!hasCloudConfig()) {
    currentMode = "local";
    updateSyncStatus("Yerel kayıt");
    if (!options.silent) showToast("Bulut bağlantısı ayarlı değil.");
    return;
  }

  try {
    updateSyncStatus("Buluttan okunuyor...");
    const [remoteCustomers, remoteOrders] = await Promise.all([
      fetchCustomersFromCloud(),
      fetchOrdersFromCloud()
    ]);
    customers = remoteCustomers;
    orders = remoteOrders;
    currentMode = "cloud";
    persistCustomers();
    persistOrders();
    renderAll();
    updateSyncStatus("Bulut bağlı");
    if (!options.silent) showToast("Bulut verileri yenilendi.");
  } catch (error) {
    currentMode = "local";
    updateSyncStatus("Yerel kayıt");
    if (!options.silent) showToast(`Bulut okunamadı: ${error.message}`);
  }
}

async function refreshOrdersFromCloud() {
  if (currentMode !== "cloud") return;
  orders = await fetchOrdersFromCloud();
  orders = getOrdersSortedByDateDesc();
  persistOrders();
}

async function uploadLocalData() {
  if (!hasCloudConfig()) {
    showToast("Önce Supabase bağlantısını kaydedin.");
    return;
  }

  if (!customers.length && !orders.length) {
    showToast("Bu cihazda gönderilecek yerel kayıt yok.");
    return;
  }

  const confirmed = confirm("Bu cihazdaki müşteri ve sipariş kayıtları buluta gönderilsin mi?");
  if (!confirmed) return;

  try {
    updateSyncStatus("Buluta gönderiliyor...");
    for (const customer of customers) {
      await saveCustomerToCloud(customer);
    }
    for (const order of orders) {
      await saveOrderToCloud(order);
    }
    await refreshFromCloud({ silent: true });
    showToast("Yerel kayıtlar buluta gönderildi.");
  } catch (error) {
    updateSyncStatus("Bulut hatası");
    showToast(`Aktarım olmadı: ${error.message}`);
  }
}

async function seedSampleCustomers() {
  if (!hasCloudConfig()) {
    showToast("Önce Supabase bağlantısını kaydedin.");
    return;
  }

  const confirmed = confirm("Veli ve X Tekstil örnek müşterileri buluta yüklensin mi?");
  if (!confirmed) return;

  try {
    updateSyncStatus("Örnekler yükleniyor...");
    for (const customer of defaultCustomers) {
      await saveCustomerToCloud({
        ...customer,
        id: crypto.randomUUID(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        materials: customer.materials.map((material) => ({
          ...material,
          id: crypto.randomUUID()
        }))
      });
    }
    await refreshFromCloud({ silent: true });
    showToast("Örnek müşteriler buluta yüklendi.");
  } catch (error) {
    updateSyncStatus("Bulut hatası");
    showToast(`Örnekler yüklenemedi: ${error.message}`);
  }
}

function clearCloudConfig() {
  const confirmed = confirm("Bulut bağlantısı bu cihazdan kaldırılsın mı?");
  if (!confirmed) return;

  appConfig.supabaseUrl = "";
  appConfig.supabaseKey = "";
  saveConfig();
  currentMode = "local";
  renderSettings();
  updateSyncStatus("Yerel kayıt");
  renderAll();
  showToast("Yerel moda dönüldü.");
}

async function fetchCustomersFromCloud() {
  const rows = await apiGet("customers?select=id,name,workshop_name,created_at,updated_at,materials(id,name,unit,value)&order=updated_at.desc");
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    workshopName: row.workshop_name || "Genel Atölye",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    materials: (row.materials || []).map((material) => ({
      id: material.id,
      name: material.name,
      unit: material.unit,
      value: Number(material.value)
    }))
  }));
}

async function fetchOrdersFromCloud() {
  const rows = await apiGet("orders?select=id,created_at,customer_id,customer_name,workshop_name,quantity,operator,order_materials(name,unit,unit_value,total)&order=created_at.desc&limit=100");
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    customerId: row.customer_id,
    customerName: row.customer_name,
    workshopName: row.workshop_name || "Genel Atölye",
    quantity: Number(row.quantity),
    operator: row.operator,
    materials: (row.order_materials || []).map((material) => ({
      name: material.name,
      unit: material.unit,
      unitValue: Number(material.unit_value),
      total: Number(material.total)
    }))
  })).sort((a, b) => compareOrdersByDateDesc(a, b));
}

async function saveCustomerToCloud(customer) {
  const id = customer.id || crypto.randomUUID();
  const existing = customers.find((item) => item.id === id);
  const payload = {
    id,
    name: customer.name,
    workshop_name: customer.workshopName || "Genel Atölye",
    created_at: customer.createdAt || existing?.createdAt || nowIso(),
    updated_at: nowIso()
  };

  await apiPost("customers?on_conflict=id", payload, { upsert: true });
  await apiDelete(`materials?customer_id=eq.${encodeURIComponent(id)}`);

  if (customer.materials.length) {
    const materialRows = customer.materials.map((material) => ({
      id: material.id || crypto.randomUUID(),
      customer_id: id,
      name: material.name,
      unit: material.unit,
      value: material.value
    }));
    await apiPost("materials", materialRows);
  }
}

async function saveOrderToCloud(order) {
  const orderPayload = {
    id: order.id,
    created_at: order.createdAt,
    customer_id: order.customerId,
    customer_name: order.customerName,
    workshop_name: order.workshopName || "Genel Atölye",
    quantity: order.quantity,
    operator: order.operator
  };

  await apiPost("orders?on_conflict=id", orderPayload, { upsert: true });
  await apiDelete(`order_materials?order_id=eq.${encodeURIComponent(order.id)}`);

  if (order.materials.length) {
    const materialRows = order.materials.map((material) => ({
      id: crypto.randomUUID(),
      order_id: order.id,
      name: material.name,
      unit: material.unit,
      unit_value: material.unitValue,
      total: material.total
    }));
    await apiPost("order_materials", materialRows);
  }
}

async function apiGet(path, config = appConfig) {
  return apiRequest(path, { method: "GET" }, config);
}

async function apiPost(path, body, options = {}) {
  return apiRequest(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      Prefer: options.upsert ? "resolution=merge-duplicates,return=minimal" : "return=minimal"
    }
  });
}

async function apiDelete(path) {
  return apiRequest(path, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" }
  });
}

async function apiRequest(path, options = {}, config = appConfig) {
  const baseUrl = normalizeSupabaseUrl(config.supabaseUrl);
  const key = config.supabaseKey;

  if (!baseUrl || !key) {
    throw new Error("Supabase bağlantısı eksik");
  }

  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // Keep the HTTP message.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function normalizeSupabaseUrl(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  try {
    const url = new URL(rawValue);
    return url.origin;
  } catch {
    return rawValue.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
  }
}

function renderSettings() {
  supabaseUrlInput.value = appConfig.supabaseUrl;
  supabaseKeyInput.value = appConfig.supabaseKey;
  defaultOperatorInput.value = appConfig.defaultOperator;
  if (!operatorInput.value) operatorInput.value = appConfig.defaultOperator;
}

function setDefaultOrderDate() {
  if (orderDateInput && !orderDateInput.value) {
    orderDateInput.value = getTodayDateValue();
  }
}

function updateSyncStatus(label) {
  syncStatus.textContent = label;
  syncStatus.classList.toggle("cloud", currentMode === "cloud");
}

function renderAll() {
  orders = getOrdersSortedByDateDesc();
  renderSelect();
  renderCustomers();
  renderHistory();
  renderReport();
  updateSyncStatus(currentMode === "cloud" ? "Bulut bağlı" : "Yerel kayıt");

  if (!workshopSelect.value || !customers.some((customer) => customer.id === workshopSelect.value)) {
    emptyResult.classList.remove("hidden");
    resultPanel.classList.add("hidden");
  }
}

function getOrdersSortedByDateDesc() {
  return [...orders].sort(compareOrdersByDateDesc);
}

function compareOrdersByDateDesc(a, b) {
  const dateDiff = new Date(b.createdAt) - new Date(a.createdAt);
  if (dateDiff !== 0) return dateDiff;
  return String(b.id || "").localeCompare(String(a.id || ""));
}

function getCurrentMonthValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getTodayDateValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function makeOrderDateIso(dateValue) {
  if (!dateValue) return nowIso();

  const [year, month, day] = dateValue.split("-").map(Number);
  const now = new Date();

  return new Date(
    year,
    month - 1,
    day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  ).toISOString();
}

function formatMonthTitle(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

function formatCustomerLabel(customer) {
  return `${customer.name} · ${customer.workshopName || "Genel Atölye"}`;
}

function getMonthNames() {
  return Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(new Date(2026, index, 1))
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2
  }).format(value);
}

function formatOrderQuantitySummary(order) {
  const total = Number(order.quantity || order.total || 0);
  const colors = getOrderColorQuantities(order);
  const parts = [];

  if (colors.white > 0) parts.push(`Beyaz ${formatNumber(colors.white)}`);
  if (colors.black > 0) parts.push(`Siyah ${formatNumber(colors.black)}`);

  return parts.length
    ? `${formatNumber(total)} iş (${parts.join(" · ")})`
    : `${formatNumber(total)} iş`;
}

function getOrderColorQuantities(order) {
  const explicit = order.colorQuantities || {};
  const white = Number(explicit.white || 0);
  const black = Number(explicit.black || 0);

  if (white > 0 || black > 0) {
    return { white, black };
  }

  return inferColorQuantitiesFromMaterials(order.materials || []);
}

function inferColorQuantitiesFromMaterials(materials) {
  return materials.reduce((totals, material) => {
    const unitValue = Number(material.unitValue || 0);
    const total = Number(material.total || 0);
    if (!unitValue || !total) return totals;

    const quantity = total / unitValue;
    const normalized = normalizeMaterialName(material.name);

    if (normalized.endsWith("beyaz")) {
      totals.white = Math.max(totals.white, quantity);
    }

    if (normalized.endsWith("siyah")) {
      totals.black = Math.max(totals.black, quantity);
    }

    return totals;
  }, { white: 0, black: 0 });
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let toastTimer;

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

async function initApp() {
  initReportWheel();
  renderSettings();
  setDefaultOrderDate();
  resetForm();
  renderAll();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  if (hasCloudConfig()) {
    await refreshFromCloud({ silent: true });
  }
}

initApp();
