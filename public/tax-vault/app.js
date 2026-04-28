const DB_NAME = "raphael-tax-vault";
const STORE_NAME = "records";
const SETTINGS_STORE = "settings";
const DB_VERSION = 2;

const categories = [
  "Advertising",
  "Bank fees",
  "Equipment",
  "Insurance",
  "Meals",
  "Office supplies",
  "Phone and internet",
  "Professional fees",
  "Rent",
  "Software",
  "Subcontractors",
  "Travel",
  "Vehicle",
  "Utilities",
  "Received invoice / bill",
  "Other",
];

const els = {
  amount: document.querySelector("#amountInput"),
  autofill: document.querySelector("#autofillButton"),
  category: document.querySelector("#categoryInput"),
  clearForm: document.querySelector("#clearFormButton"),
  date: document.querySelector("#dateInput"),
  delete: document.querySelector("#deleteButton"),
  documentFile: document.querySelector("#documentFile"),
  emptyState: document.querySelector("#emptyState"),
  expenseTotal: document.querySelector("#expenseTotal"),
  exportCsv: document.querySelector("#exportCsvButton"),
  exportPackage: document.querySelector("#exportPackageButton"),
  fileHint: document.querySelector("#fileHint"),
  fileLabel: document.querySelector("#fileLabel"),
  folderImport: document.querySelector("#folderImport"),
  form: document.querySelector("#recordForm"),
  importFolder: document.querySelector("#importFolderButton"),
  documentCount: document.querySelector("#documentCount"),
  needsInfoCount: document.querySelector("#needsInfoCount"),
  notes: document.querySelector("#notesInput"),
  payment: document.querySelector("#paymentInput"),
  readyCount: document.querySelector("#readyCount"),
  recordId: document.querySelector("#recordId"),
  recordsList: document.querySelector("#recordsList"),
  search: document.querySelector("#searchInput"),
  status: document.querySelector("#statusInput"),
  statusFilter: document.querySelector("#statusFilter"),
  tax: document.querySelector("#taxInput"),
  taxYear: document.querySelector("#taxYearInput"),
  template: document.querySelector("#recordTemplate"),
  type: document.querySelector("#typeInput"),
  typeFilter: document.querySelector("#typeFilter"),
  vendor: document.querySelector("#vendorInput"),
  yearFilter: document.querySelector("#yearFilter"),
};

let db;
let records = [];
let selectedFileHints = null;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("taxYear", "taxYear");
        store.createIndex("date", "date");
        store.createIndex("type", "type");
        store.createIndex("status", "status");
      }
      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(mode = "readonly") {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

function settingsTx(mode = "readonly") {
  return db.transaction(SETTINGS_STORE, mode).objectStore(SETTINGS_STORE);
}

function getAllRecords() {
  return new Promise((resolve, reject) => {
    const request = tx().getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveRecord(record) {
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").put(record);
    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error);
  });
}

function removeRecord(id) {
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function getSetting(key) {
  return new Promise((resolve, reject) => {
    const request = settingsTx().get(key);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}

function saveSetting(key, value) {
  return new Promise((resolve, reject) => {
    const request = settingsTx("readwrite").put({ key, value });
    request.onsuccess = () => resolve(value);
    request.onerror = () => reject(request.error);
  });
}

function money(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(Number(value || 0));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currentYear() {
  return new Date().getFullYear();
}

function readFile(file, sourcePath = file.webkitRelativePath || file.name) {
  if (!file) return Promise.resolve(null);
  return file.arrayBuffer().then((buffer) => ({
    fileBlob: new Blob([buffer], { type: file.type || "application/octet-stream" }),
    fileName: file.name,
    sourcePath,
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
  }));
}

async function fingerprintFile(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cleanMoney(value) {
  const parsed = Number.parseFloat(String(value || "").replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDecimal(value) {
  return value ? value.toFixed(2) : "";
}

function statusLabel(status) {
  return {
    ready: "Ready",
    "needs-info": "Needs info",
    review: "Review",
  }[status] || "Review";
}

function typeLabel(type) {
  return {
    expense: "Receipt",
    "received-invoice": "Received invoice",
    "tax-doc": "Tax document",
    income: "Received invoice",
  }[type] || "Receipt";
}

function requiredMissingFields(record) {
  const missing = [];
  if (!record.date) missing.push("date");
  if (!record.vendor?.trim()) missing.push("vendor");
  if (!record.category?.trim()) missing.push("category");
  if (["expense", "received-invoice", "income"].includes(record.type) && Number(record.amount || 0) <= 0) {
    missing.push("amount");
  }
  return missing;
}

function smartStatus(record, preferredStatus = record.status) {
  const missing = requiredMissingFields(record);
  if (missing.length) return "needs-info";
  return preferredStatus === "review" ? "review" : "ready";
}

function normalizeRecord(record) {
  const upgraded = record.type === "income"
    ? {
        ...record,
        type: "received-invoice",
        category: record.category === "Income invoice" ? "Received invoice / bill" : record.category,
      }
    : { ...record };
  upgraded.status = smartStatus(upgraded, upgraded.status);
  return upgraded;
}

function recordsAreDifferent(left, right) {
  return left.type !== right.type || left.category !== right.category || left.status !== right.status;
}

function escapeCsv(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

function slug(value) {
  return String(value || "record")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 44) || "record";
}

function extensionFrom(record) {
  const name = record.fileName || "";
  const match = name.match(/\.[a-z0-9]+$/i);
  if (match) return match[0].toLowerCase();
  if (record.fileType === "application/pdf") return ".pdf";
  if (record.fileType?.includes("png")) return ".png";
  if (record.fileType?.includes("jpeg") || record.fileType?.includes("jpg")) return ".jpg";
  return ".bin";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.append(node);
  window.setTimeout(() => node.remove(), 3200);
}

function buildCsv(rows) {
  const headers = [
    "date",
    "tax_year",
    "type",
    "vendor_or_client",
    "category",
    "amount",
    "tax_paid",
    "payment_account",
    "status",
    "file_name",
    "source_path",
    "notes",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((record) =>
      [
        record.date,
        record.taxYear,
        typeLabel(record.type),
        record.vendor,
        record.category,
        record.amount,
        record.tax,
        record.payment,
        statusLabel(record.status),
        record.fileName,
        record.sourcePath,
        record.notes,
      ]
        .map(escapeCsv)
        .join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

function populateCategories() {
  els.category.innerHTML = "";
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.category.append(option);
  }
}

function availableYears() {
  const years = new Set(records.map((record) => Number(record.taxYear)));
  years.add(currentYear());
  return [...years].filter(Boolean).sort((a, b) => b - a);
}

function populateYears() {
  const selected = Number(els.yearFilter.value) || currentYear();
  els.yearFilter.innerHTML = "";
  for (const year of availableYears()) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    els.yearFilter.append(option);
  }
  els.yearFilter.value = String(availableYears().includes(selected) ? selected : currentYear());
}

function getFilteredRecords() {
  const year = Number(els.yearFilter.value);
  const query = els.search.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  const type = els.typeFilter.value;

  return records
    .filter((record) => Number(record.taxYear) === year)
    .filter((record) => status === "all" || record.status === status)
    .filter((record) => type === "all" || record.type === type)
    .filter((record) => {
      if (!query) return true;
      return [
        record.vendor,
        record.category,
        record.payment,
        record.notes,
        record.amount,
        record.tax,
        record.fileName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function renderSummary() {
  const year = Number(els.yearFilter.value);
  const yearRecords = records.filter((record) => Number(record.taxYear) === year);
  const expenseTotal = yearRecords
    .filter((record) => ["expense", "received-invoice", "income"].includes(record.type))
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);

  els.expenseTotal.textContent = money(expenseTotal);
  els.documentCount.textContent = String(yearRecords.length);
  els.readyCount.textContent = String(yearRecords.filter((record) => record.status === "ready").length);
  els.needsInfoCount.textContent = String(
    yearRecords.filter((record) => record.status !== "ready").length,
  );
}

function renderRecords() {
  const filtered = getFilteredRecords();
  els.recordsList.innerHTML = "";
  els.emptyState.style.display = filtered.length ? "none" : "block";

  for (const record of filtered) {
    const node = els.template.content.firstElementChild.cloneNode(true);
    const pill = node.querySelector(".pill");
    node.querySelector("h3").textContent = record.vendor || "Untitled";
    pill.textContent = statusLabel(record.status);
    pill.classList.toggle("needs-info", record.status === "needs-info");
    pill.classList.toggle("review", record.status === "review");
    node.querySelector(".record-meta").textContent = [
      record.date,
      typeLabel(record.type),
      record.category,
      record.fileName ? `File: ${record.fileName}` : "No file attached",
    ].join(" · ");
    node.querySelector(".record-amount").textContent = money(record.amount);
    node.querySelector(".record-notes").textContent = record.notes || "";
    const missing = requiredMissingFields(record);
    if (missing.length) {
      const missingNode = document.createElement("div");
      missingNode.className = "record-missing";
      for (const field of missing) {
        const chip = document.createElement("span");
        chip.className = "missing-chip";
        chip.textContent = `Missing ${field}`;
        missingNode.append(chip);
      }
      node.querySelector(".record-notes").after(missingNode);
    }

    const editButton = node.querySelector(".edit-button");
    const viewButton = node.querySelector(".view-button");
    viewButton.disabled = !record.fileBlob;
    viewButton.hidden = !record.fileBlob;

    editButton.addEventListener("click", () => fillForm(record));
    viewButton.addEventListener("click", () => openRecordFile(record));

    els.recordsList.append(node);
  }
}

function render() {
  populateYears();
  renderSummary();
  renderRecords();
}

function resetForm() {
  els.form.reset();
  els.recordId.value = "";
  selectedFileHints = null;
  els.date.value = todayIso();
  els.taxYear.value = String(currentYear());
  els.category.value = "Office supplies";
  els.status.value = "ready";
  els.fileLabel.textContent = "Upload a received invoice or take a receipt photo";
  els.fileHint.textContent = "Images and PDFs stay in this browser unless you export them.";
  els.autofill.hidden = true;
  els.delete.hidden = true;
}

function fillForm(record) {
  els.recordId.value = record.id;
  els.type.value = record.type;
  els.status.value = record.status;
  els.date.value = record.date;
  els.taxYear.value = record.taxYear;
  els.vendor.value = record.vendor;
  els.amount.value = record.amount;
  els.tax.value = record.tax || "";
  els.category.value = record.category;
  els.payment.value = record.payment || "";
  els.notes.value = record.notes || "";
  els.documentFile.value = "";
  els.fileLabel.textContent = record.fileName || "No file attached";
  els.fileHint.textContent = record.fileName
    ? "Choose a new file only if you want to replace the current one."
    : "Add a PDF or photo if you have one.";
  els.delete.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openRecordFile(record) {
  if (!record.fileBlob) return;
  const url = URL.createObjectURL(record.fileBlob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function plainTextFromBuffer(buffer) {
  return new TextDecoder("utf-8", { fatal: false })
    .decode(buffer)
    .replace(/[\r\n\t]/g, " ")
    .replace(/[^\x20-\x7E]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAmountAfter(text, labels) {
  for (const label of labels) {
    const pattern = new RegExp(`${label}[^0-9$-]{0,35}(\\$?\\s?\\d[\\d,]*\\.\\d{2})`, "i");
    const match = text.match(pattern);
    if (match) return cleanMoney(match[1]);
  }
  return 0;
}

function extractLargestMoney(text) {
  const matches = [...text.matchAll(/\$?\s?\d[\d,]*\.\d{2}/g)]
    .map((match) => cleanMoney(match[0]))
    .filter((value) => value > 0 && value < 1000000);
  return matches.length ? Math.max(...matches) : 0;
}

function extractDateFromText(text, fallbackYear) {
  const ymd = text.match(/(20\d{2})[-/ .](0?[1-9]|1[0-2])[-/ .]([0-2]?\d|3[01])/);
  if (ymd) {
    return `${ymd[1]}-${String(ymd[2]).padStart(2, "0")}-${String(ymd[3]).padStart(2, "0")}`;
  }

  const dmy = text.match(/([0-2]?\d|3[01])[-/ .](0?[1-9]|1[0-2])[-/ .](20\d{2})/);
  if (dmy) {
    return `${dmy[3]}-${String(dmy[2]).padStart(2, "0")}-${String(dmy[1]).padStart(2, "0")}`;
  }

  return "";
}

function extractVendorFromText(text, fallback) {
  const words = text
    .split(/\s{2,}|(?:invoice|receipt|bill|statement|date|total|hst|gst|pst)/i)
    .map((line) => line.trim())
    .filter((line) => /[A-Za-z]/.test(line) && line.length >= 3 && line.length <= 56);
  return words[0] || fallback;
}

async function getAutofillHints(file, sourcePath = file.webkitRelativePath || file.name) {
  const fallbackYear = Number(els.yearFilter.value) || currentYear();
  const buffer = await file.arrayBuffer();
  const text = plainTextFromBuffer(buffer);
  const filenameVendor = guessVendorFromFile(file);
  const date = extractDateFromText(text, fallbackYear) || guessDateFromFile(file, fallbackYear, sourcePath);
  const amount = extractAmountAfter(text, ["amount due", "balance due", "grand total", "total"]) || extractLargestMoney(text);
  const tax = extractAmountAfter(text, ["hst", "gst\\/hst", "gst", "pst", "sales tax", "tax"]);

  return {
    amount,
    date,
    tax,
    vendor: extractVendorFromText(text, filenameVendor),
  };
}

function applyHintsToForm(hints) {
  if (!hints) return;
  if (hints.date) {
    els.date.value = hints.date;
    els.taxYear.value = hints.date.slice(0, 4);
  }
  if (hints.vendor && (!els.vendor.value || els.vendor.value === "Imported document")) {
    els.vendor.value = hints.vendor;
  }
  if (hints.amount && !normalizeAmount(els.amount.value)) {
    els.amount.value = formatDecimal(hints.amount);
  }
  if (hints.tax && !normalizeAmount(els.tax.value)) {
    els.tax.value = formatDecimal(hints.tax);
  }
  els.status.value = smartStatus(
    {
      type: els.type.value,
      date: els.date.value,
      vendor: els.vendor.value,
      category: els.category.value,
      amount: normalizeAmount(els.amount.value),
    },
    els.status.value,
  );
}

function updateFormStatusFromFields() {
  if (els.status.value === "review") return;
  els.status.value = smartStatus(
    {
      type: els.type.value,
      date: els.date.value,
      vendor: els.vendor.value,
      category: els.category.value,
      amount: normalizeAmount(els.amount.value),
    },
    els.status.value,
  );
}

async function autofillSelectedFile() {
  const file = els.documentFile.files[0];
  if (!file) return;
  els.autofill.disabled = true;
  els.autofill.textContent = "Autofilling...";
  try {
    selectedFileHints = selectedFileHints || (await getAutofillHints(file));
    applyHintsToForm(selectedFileHints);
    toast("Autofill checked the file. Review anything still missing.");
  } finally {
    els.autofill.disabled = false;
    els.autofill.textContent = "Autofill";
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  const existing = records.find((record) => record.id === els.recordId.value);
  const file = await readFile(els.documentFile.files[0]);
  const date = els.date.value || todayIso();
  const record = {
    ...(existing || {}),
    ...(file || {}),
    id: existing?.id || crypto.randomUUID(),
    type: els.type.value,
    status: els.status.value,
    date,
    taxYear: Number(els.taxYear.value || date.slice(0, 4)),
    vendor: els.vendor.value.trim(),
    amount: normalizeAmount(els.amount.value),
    tax: normalizeAmount(els.tax.value),
    category: els.category.value,
    payment: els.payment.value.trim(),
    notes: els.notes.value.trim(),
    sourcePath: file?.sourcePath || existing?.sourcePath || "",
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  record.status = smartStatus(record, record.status);

  await saveRecord(record);
  await refreshRecords();
  els.yearFilter.value = String(record.taxYear);
  resetForm();
  render();
  toast("Record saved.");
}

async function handleDelete() {
  if (!els.recordId.value) return;
  const record = records.find((item) => item.id === els.recordId.value);
  const label = record?.vendor || "this record";
  if (!window.confirm(`Delete ${label}? This removes the saved file too.`)) return;
  await removeRecord(els.recordId.value);
  await refreshRecords();
  resetForm();
  render();
  toast("Record deleted.");
}

function guessVendorFromFile(file) {
  const name = file.name.replace(/\.[^.]+$/, "");
  return name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Imported document";
}

function guessDateFromFile(file, fallbackYear, sourcePath = file.webkitRelativePath || file.name) {
  const text = `${sourcePath} ${file.name}`;
  const ymd = text.match(/(20\d{2})[-_ ./]?(0[1-9]|1[0-2])[-_ ./]?([0-2]\d|3[01])/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  const dmy = text.match(/([0-2]\d|3[01])[-_ ./](0[1-9]|1[0-2])[-_ ./](20\d{2})/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  const yearOnly = text.match(/20\d{2}/)?.[0] || String(fallbackYear || currentYear());
  return `${yearOnly}-01-01`;
}

function isTaxDocument(file) {
  const type = file.type || "";
  const name = file.name.toLowerCase();
  return type.startsWith("image/") || type === "application/pdf" || /\.(pdf|png|jpe?g|webp|heic)$/i.test(name);
}

async function importFolderFiles(event) {
  const entries = [...event.target.files]
    .filter(isTaxDocument)
    .map((file) => ({ file, sourcePath: file.webkitRelativePath || file.name }));
  event.target.value = "";
  await importFileEntries(entries);
}

async function importFileEntries(entries, options = {}) {
  if (!entries.length) {
    toast("No receipt or invoice files were found in that folder.");
    return;
  }

  els.importFolder.disabled = true;
  els.importFolder.textContent = "Importing...";

  let imported = 0;
  let skipped = 0;
  const existingFingerprints = new Set(records.map((record) => record.fileFingerprint).filter(Boolean));
  const selectedYear = Number(els.yearFilter.value) || currentYear();

  try {
    for (const { file, sourcePath } of entries) {
      const fingerprint = await fingerprintFile(file);
      if (existingFingerprints.has(fingerprint)) {
        skipped += 1;
        continue;
      }

      const fileData = await readFile(file, sourcePath);
      const hints = await getAutofillHints(file, sourcePath);
      const date = hints.date || guessDateFromFile(file, selectedYear, sourcePath);
      const taxYear = Number(date.slice(0, 4)) || selectedYear;
      const importedRecord = {
        ...fileData,
        id: crypto.randomUUID(),
        type: "received-invoice",
        status: "needs-info",
        date,
        taxYear,
        vendor: hints.vendor || guessVendorFromFile(file),
        amount: hints.amount || 0,
        tax: hints.tax || 0,
        category: "Received invoice / bill",
        payment: "",
        notes: hints.amount
          ? "Autofilled from the imported file. Review before tax time."
          : "Imported from taxes folder. Add the amount and any unclear details.",
        fileFingerprint: fingerprint,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      importedRecord.status = smartStatus(importedRecord, importedRecord.status);
      await saveRecord(importedRecord);
      existingFingerprints.add(fingerprint);
      imported += 1;
    }

    await refreshRecords();
    render();
    if (!options.quiet || imported > 0) {
      toast(`Imported ${imported} document${imported === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}` : ""}.`);
    }
  } finally {
    els.importFolder.disabled = false;
    els.importFolder.textContent = "Connect Taxes Folder";
  }
}

async function collectHandleFiles(directoryHandle, prefix = directoryHandle.name) {
  const entries = [];
  for await (const [name, handle] of directoryHandle.entries()) {
    const sourcePath = `${prefix}/${name}`;
    if (handle.kind === "directory") {
      entries.push(...(await collectHandleFiles(handle, sourcePath)));
    } else {
      const file = await handle.getFile();
      if (isTaxDocument(file)) {
        entries.push({ file, sourcePath });
      }
    }
  }
  return entries;
}

async function importDirectoryHandle(directoryHandle, options = {}) {
  const entries = await collectHandleFiles(directoryHandle);
  await importFileEntries(entries, options);
}

async function connectTaxFolder() {
  if (!window.showDirectoryPicker) {
    els.folderImport.click();
    return;
  }

  try {
    const directoryHandle = await window.showDirectoryPicker({ mode: "read" });
    await saveSetting("taxFolderHandle", directoryHandle);
    await importDirectoryHandle(directoryHandle);
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error(error);
      toast("Could not connect that folder.");
    }
  }
}

async function syncConnectedTaxFolder() {
  if (!window.showDirectoryPicker) return;

  const directoryHandle = await getSetting("taxFolderHandle");
  if (!directoryHandle?.queryPermission) return;

  const permission = await directoryHandle.queryPermission({ mode: "read" });
  if (permission === "granted") {
    await importDirectoryHandle(directoryHandle, { quiet: true });
  }
}

function exportCsv() {
  const rows = getFilteredRecords();
  if (!rows.length) {
    toast("There are no records to export for this view.");
    return;
  }
  const year = els.yearFilter.value;
  downloadBlob(new Blob([buildCsv(rows)], { type: "text/csv;charset=utf-8" }), `tax-vault-${year}.csv`);
}

function writeText(buffer, offset, text, length) {
  const bytes = new TextEncoder().encode(text);
  buffer.set(bytes.slice(0, length), offset);
}

function writeOctal(buffer, offset, length, value) {
  const text = value.toString(8).padStart(length - 1, "0").slice(-(length - 1)) + "\0";
  writeText(buffer, offset, text, length);
}

function tarHeader(name, size) {
  const header = new Uint8Array(512);
  let normalizedName = name;
  let prefix = "";

  if (name.length > 100) {
    const splitAt = name.lastIndexOf("/", 155);
    if (splitAt > -1 && name.length - splitAt - 1 <= 100) {
      prefix = name.slice(0, splitAt);
      normalizedName = name.slice(splitAt + 1);
    } else {
      normalizedName = name.slice(-100);
    }
  }

  writeText(header, 0, normalizedName, 100);
  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, Math.floor(Date.now() / 1000));
  for (let index = 148; index < 156; index += 1) header[index] = 32;
  header[156] = "0".charCodeAt(0);
  writeText(header, 257, "ustar", 6);
  writeText(header, 263, "00", 2);
  writeText(header, 345, prefix, 155);

  let checksum = 0;
  for (const byte of header) checksum += byte;
  writeOctal(header, 148, 8, checksum);
  return header;
}

function pad512(size) {
  return (512 - (size % 512)) % 512;
}

async function buildTar(rows) {
  const parts = [];
  const addFile = async (name, content) => {
    const bytes =
      content instanceof Blob
        ? new Uint8Array(await content.arrayBuffer())
        : new TextEncoder().encode(String(content));
    parts.push(tarHeader(name, bytes.byteLength));
    parts.push(bytes);
    const padding = pad512(bytes.byteLength);
    if (padding) parts.push(new Uint8Array(padding));
  };

  const year = els.yearFilter.value;
  await addFile(`${year}-summary.csv`, buildCsv(rows));
  await addFile(
    `${year}-manifest.json`,
    JSON.stringify(
      rows.map(({ fileBlob, ...record }) => record),
      null,
      2,
    ),
  );

  for (const record of rows.filter((item) => item.fileBlob)) {
    const fileName = [
      String(record.date || year),
      slug(record.category),
      slug(record.vendor),
      record.id.slice(0, 8),
    ].join("-");
    const path = `documents/${record.taxYear}/${slug(record.category)}/${fileName}${extensionFrom(record)}`;
    await addFile(path, record.fileBlob);
  }

  parts.push(new Uint8Array(1024));
  return new Blob(parts, { type: "application/x-tar" });
}

async function exportPackage() {
  const year = els.yearFilter.value;
  const rows = records
    .filter((record) => Number(record.taxYear) === Number(year))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (!rows.length) {
    toast("There are no records in this tax year yet.");
    return;
  }

  els.exportPackage.disabled = true;
  els.exportPackage.textContent = "Preparing...";
  try {
    const blob = await buildTar(rows);
    downloadBlob(blob, `tax-vault-${year}-package.tar`);
    toast("Year package downloaded.");
  } finally {
    els.exportPackage.disabled = false;
    els.exportPackage.textContent = "Export Year Package";
  }
}

async function refreshRecords() {
  const loadedRecords = await getAllRecords();
  records = loadedRecords.map(normalizeRecord);
  const changedRecords = records.filter((record, index) => recordsAreDifferent(record, loadedRecords[index]));
  await Promise.all(changedRecords.map((record) => saveRecord(record)));
}

function bindEvents() {
  els.form.addEventListener("submit", handleSubmit);
  els.clearForm.addEventListener("click", resetForm);
  els.delete.addEventListener("click", handleDelete);
  els.exportCsv.addEventListener("click", exportCsv);
  els.exportPackage.addEventListener("click", exportPackage);
  els.importFolder.addEventListener("click", connectTaxFolder);
  els.folderImport.addEventListener("change", importFolderFiles);
  els.autofill.addEventListener("click", autofillSelectedFile);

  for (const element of [els.yearFilter, els.search, els.statusFilter, els.typeFilter]) {
    element.addEventListener("input", () => {
      renderSummary();
      renderRecords();
    });
  }

  for (const element of [els.date, els.vendor, els.amount, els.category, els.type]) {
    element.addEventListener("input", updateFormStatusFromFields);
  }

  els.documentFile.addEventListener("change", () => {
    const file = els.documentFile.files[0];
    if (!file) return;
    selectedFileHints = null;
    els.fileLabel.textContent = file.name;
    els.fileHint.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB selected`;
    els.autofill.hidden = false;
    autofillSelectedFile();
  });

  els.date.addEventListener("change", () => {
    if (!els.recordId.value && els.date.value) {
      els.taxYear.value = els.date.value.slice(0, 4);
    }
  });

  els.type.addEventListener("change", () => {
    if (els.type.value === "received-invoice") {
      els.category.value = "Received invoice / bill";
    }
  });
}

async function init() {
  populateCategories();
  resetForm();
  db = await openDb();
  await refreshRecords();
  await syncConnectedTaxFolder();
  populateYears();
  els.yearFilter.value = String(currentYear());
  bindEvents();
  renderSummary();
  renderRecords();
}

init().catch((error) => {
  console.error(error);
  toast("Something went wrong while opening the private vault.");
});
