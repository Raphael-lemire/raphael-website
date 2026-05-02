const storageKey = "raphael-realtor-outreach-v1";

const properties = [
  {
    id: "57-kervin",
    address: "57 Kervin Cres, Moncton",
    mls: "NB133396",
    brokerage: "EXIT Realty Associates",
    type: "New construction",
    isNew: true,
    occupancy: "New construction",
    contacts: [
      { name: "Chantal Albert", phone: "5068755626", displayPhone: "(506) 875-5626" },
      { name: "Marc-Andre Arsenault", phone: "5068781203", displayPhone: "(506) 878-1203" },
    ],
  },
  {
    id: "59-old-oak",
    address: "59 Old Oak, Moncton",
    mls: "NB137770",
    brokerage: "EXIT Realty Associates",
    type: "Resale / not new",
    isNew: false,
    occupancy: "Not publicly confirmed",
    contacts: [{ name: "Karine Dufresne", phone: "5068750499", displayPhone: "(506) 875-0499" }],
  },
  {
    id: "3-heros",
    address: "3 Heros Court, Moncton",
    mls: "NB137332",
    brokerage: "RE/MAX Quality Real Estate Inc.",
    type: "Resale / not new",
    isNew: false,
    occupancy: "Not publicly confirmed",
    contacts: [{ name: "Phil Albert", phone: "5068783948", displayPhone: "(506) 878-3948" }],
  },
  {
    id: "54-cudmore",
    address: "54 Cudmore St, Riverview",
    mls: "NB136408",
    brokerage: "eXp Realty",
    type: "New construction",
    isNew: true,
    occupancy: "New construction",
    contacts: [
      { name: "Huguette LeBlanc", phone: "5069610888", displayPhone: "(506) 961-0888" },
      { name: "Audrey Melanson", phone: "4288803800", displayPhone: "(428) 880-3800" },
    ],
  },
  {
    id: "113-oakfield",
    address: "113 Oakfield Dr, Riverview",
    mls: "NB134000",
    brokerage: "RE/MAX Avante",
    type: "New construction",
    isNew: true,
    occupancy: "New construction",
    contacts: [{ name: "Maurice LeBlanc", phone: "5065315934", displayPhone: "(506) 531-5934" }],
  },
  {
    id: "458-gaspe",
    address: "458 Gaspe St, Dieppe",
    mls: "NB134724",
    brokerage: "EXIT Realty Associates",
    type: "Resale / not new",
    isNew: false,
    occupancy: "Not publicly confirmed",
    contacts: [
      { name: "Chantal Albert", phone: "5068755626", displayPhone: "(506) 875-5626" },
      { name: "Marc-Andre Arsenault", phone: "5068781203", displayPhone: "(506) 878-1203" },
    ],
  },
  {
    id: "375-glengrove",
    address: "375 Glengrove Rd, Moncton",
    mls: "NB133057",
    brokerage: "Keller Williams Capital Realty",
    type: "Resale / not new",
    isNew: false,
    occupancy: "Not publicly confirmed",
    contacts: [{ name: "Eric Frenette", phone: "5063647653", displayPhone: "(506) 364-7653" }],
  },
  {
    id: "186-rachel",
    address: "186 Rachel St, Moncton",
    mls: "NB133119",
    brokerage: "PG Direct Realty Ltd.",
    type: "New construction / new build",
    isNew: true,
    occupancy: "New construction",
    contacts: [{ name: "Jonathan David / PG Direct", phone: "8777090027", displayPhone: "(877) 709-0027" }],
  },
  {
    id: "22-donat",
    address: "22 Donat Cres, Dieppe",
    mls: "NB129582",
    brokerage: "Royal LePage Atlantic",
    type: "Resale / not new",
    isNew: false,
    occupancy: "Not publicly confirmed",
    contacts: [{ name: "Danielle Johnson", phone: "5063816084", displayPhone: "(506) 381-6084" }],
  },
  {
    id: "94-adrienne",
    address: "94 Adrienne Court, Dieppe",
    mls: "NB133143",
    brokerage: "EXIT Realty Associates",
    type: "New construction",
    isNew: true,
    occupancy: "New construction",
    contacts: [
      { name: "Mike Doiron", phone: "5068507089", displayPhone: "(506) 850-7089" },
      { name: "Heather Doiron", phone: "5068506049", displayPhone: "(506) 850-6049" },
    ],
  },
  {
    id: "124-larochelle",
    address: "124 Larochelle St, Dieppe",
    mls: "NB133041",
    brokerage: "EXIT Realty Associates",
    type: "Resale / not new",
    isNew: false,
    occupancy: "Not publicly confirmed",
    contacts: [
      { name: "Mike Doiron", phone: "5068507089", displayPhone: "(506) 850-7089" },
      { name: "Heather Doiron", phone: "5068506049", displayPhone: "(506) 850-6049" },
    ],
  },
  {
    id: "1003-bourque",
    address: "1003 Bourque Rd, Dieppe",
    mls: "NB134336",
    brokerage: "EXIT Realty Associates",
    type: "Resale / not new",
    isNew: false,
    occupancy: "Not publicly confirmed",
    contacts: [{ name: "Joanne Maillet", phone: "5062954699", displayPhone: "(506) 295-4699" }],
  },
  {
    id: "50-doiron",
    address: "50 Doiron, Dieppe",
    mls: "NB138221",
    brokerage: "Platinum Atlantic Realty Inc.",
    type: "Resale / not new",
    isNew: false,
    occupancy: "Not publicly confirmed",
    contacts: [{ name: "Jesus Machado", phone: "5062334717", displayPhone: "(506) 233-4717" }],
  },
  {
    id: "92-satara",
    address: "92 Satara Dr, Moncton",
    mls: "NB136505",
    brokerage: "Keller Williams Capital Realty",
    type: "Resale / not new",
    isNew: false,
    occupancy: "Not publicly confirmed",
    contacts: [{ name: "Dennis Wilson", phone: "5068710223", displayPhone: "(506) 871-0223" }],
  },
];

const state = {
  filter: "all",
  search: "",
  records: loadRecords(),
};

const list = document.querySelector("[data-property-list]");
const template = document.querySelector("[data-property-template]");
const searchInput = document.querySelector("[data-search-input]");
const toast = document.querySelector("[data-toast]");
let toastTimer;

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch (error) {
    return {};
  }
}

function saveRecords() {
  localStorage.setItem(storageKey, JSON.stringify(state.records));
}

function getRecord(propertyId) {
  return state.records[propertyId] || { status: "pending", note: "" };
}

function updateRecord(propertyId, updates) {
  state.records[propertyId] = {
    ...getRecord(propertyId),
    ...updates,
  };
  saveRecords();
  render();
}

function statusText(status) {
  if (status === "works") return "Will work";
  if (status === "notWork") return "Won't work";
  return "Pending";
}

function buildMessage(property, contact) {
  if (property.isNew) {
    return `Hi ${contact.name}, this is Raphael Lemire. I am checking ${property.address}, MLS ${property.mls}, for a client. Is it still available, and can you confirm the builder, HST/rebate details, and expected possession?`;
  }

  return `Hi ${contact.name}, this is Raphael Lemire. I am checking ${property.address}, MLS ${property.mls}, for a client. Is it still available, and can you confirm if it is owner-occupied, vacant, or tenant-occupied, plus any possession notes?`;
}

function smsLink(phone, message) {
  return `sms:+1${phone}?&body=${encodeURIComponent(message)}`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Text copied.");
  } catch (error) {
    showToast("Could not copy. Use the text message button instead.");
  }
}

function visibleProperties() {
  const query = state.search.trim().toLowerCase();

  return properties.filter((property) => {
    const record = getRecord(property.id);
    const matchesStatus = state.filter === "all" || record.status === state.filter;
    const haystack = [
      property.address,
      property.mls,
      property.brokerage,
      property.type,
      property.occupancy,
      ...property.contacts.flatMap((contact) => [contact.name, contact.displayPhone]),
    ]
      .join(" ")
      .toLowerCase();

    return matchesStatus && (!query || haystack.includes(query));
  });
}

function renderContacts(property, container) {
  container.innerHTML = "";

  property.contacts.forEach((contact) => {
    const row = document.createElement("div");
    row.className = "contact-row";

    const details = document.createElement("div");
    details.innerHTML = `
      <span class="contact-name"></span>
      <span class="contact-phone"></span>
    `;
    details.querySelector(".contact-name").textContent = contact.name;
    details.querySelector(".contact-phone").textContent = contact.displayPhone;

    const link = document.createElement("a");
    link.className = "sms-button";
    link.href = smsLink(contact.phone, buildMessage(property, contact));
    link.textContent = "Text";

    row.append(details, link);
    container.append(row);
  });
}

function renderSummary() {
  const counts = properties.reduce(
    (acc, property) => {
      const status = getRecord(property.id).status;
      acc.total += 1;
      acc[status] += 1;
      return acc;
    },
    { total: 0, pending: 0, works: 0, notWork: 0 }
  );

  document.querySelector("[data-count-total]").textContent = counts.total;
  document.querySelector("[data-count-pending]").textContent = counts.pending;
  document.querySelector("[data-count-works]").textContent = counts.works;
  document.querySelector("[data-count-not-work]").textContent = counts.notWork;
}

function render() {
  renderSummary();
  list.innerHTML = "";

  const items = visibleProperties();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No homes match this filter.";
    list.append(empty);
    return;
  }

  items.forEach((property) => {
    const record = getRecord(property.id);
    const node = template.content.firstElementChild.cloneNode(true);
    const primaryContact = property.contacts[0];

    node.dataset.status = record.status;
    node.querySelector("[data-status-label]").textContent = statusText(record.status);
    node.querySelector("[data-address]").textContent = property.address;
    node.querySelector("[data-mls]").textContent = property.mls;
    node.querySelector("[data-brokerage]").textContent = property.brokerage;
    node.querySelector("[data-occupancy]").textContent = property.occupancy;

    const type = node.querySelector("[data-type]");
    type.textContent = property.type;
    type.classList.toggle("is-new", property.isNew);

    renderContacts(property, node.querySelector("[data-contact-list]"));

    node.querySelector("[data-copy-message]").addEventListener("click", () => {
      copyText(buildMessage(property, primaryContact));
    });

    node.querySelectorAll("[data-set-status]").forEach((button) => {
      button.addEventListener("click", () => {
        updateRecord(property.id, { status: button.dataset.setStatus });
        showToast(`${property.address} marked ${statusText(button.dataset.setStatus).toLowerCase()}.`);
      });
    });

    const note = node.querySelector("[data-note]");
    note.value = record.note || "";
    note.addEventListener("input", () => {
      state.records[property.id] = {
        ...getRecord(property.id),
        note: note.value,
      };
      saveRecords();
    });

    list.append(node);
  });
}

function exportCsv() {
  const header = ["Address", "MLS", "Brokerage", "Contacts", "Type", "Occupancy", "Status", "Note"];
  const lines = properties.map((property) => {
    const record = getRecord(property.id);
    const contacts = property.contacts
      .map((contact) => `${contact.name} ${contact.displayPhone}`)
      .join(" / ");
    return [
      property.address,
      property.mls,
      property.brokerage,
      contacts,
      property.type,
      property.occupancy,
      statusText(record.status),
      record.note || "",
    ];
  });

  const csv = [header, ...lines]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "realtor-outreach-tracker.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  render();
});

document.querySelectorAll("[data-status-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.statusFilter;
    document.querySelectorAll("[data-status-filter]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    render();
  });
});

document.querySelector("[data-export-csv]").addEventListener("click", exportCsv);

document.querySelector("[data-reset-status]").addEventListener("click", () => {
  if (!window.confirm("Reset all statuses and notes?")) {
    return;
  }

  state.records = {};
  saveRecords();
  render();
  showToast("Tracker reset.");
});

render();
