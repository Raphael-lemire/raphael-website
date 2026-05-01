const siteConfig = {
  listedUrl: `https://listed.inc/listings?presented-by=d8bb886f39d34c61942cf59e609cff2e&lat_lon=46.0891,-64.7751&title=Moncton,%20NB`,
  calendarUrl: "https://api.leadconnectorhq.com/widget/booking/m1nSKgK0Zc86d2PxUSiq",
  slotsEndpoint: "/api/highlevel-slots",
  bookingEndpoint: "/api/highlevel-book-appointment",
  highLevelEndpoint: "/api/highlevel-lead",
  timezone: "America/Halifax",
  appointmentMinutes: 60,
};

const header = document.querySelector("[data-elevate]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-menu]");
const miniForm = document.querySelector("[data-mini-form]");
const consultationDialog = document.querySelector("[data-consultation-dialog]");
const consultationSteps = document.querySelectorAll("[data-consultation-step]");
const slotStatus = document.querySelector("[data-slot-status]");
const dateList = document.querySelector("[data-date-list]");
const slotList = document.querySelector("[data-slot-list]");
const calendarFrame = document.querySelector("[data-calendar-frame]");
const calendarFallbackLink = document.querySelector("[data-calendar-fallback-link]");
const consultationContactForm = document.querySelector("[data-consultation-contact]");
const selectedSlotSummary = document.querySelector("[data-selected-slot]");
const toast = document.querySelector("[data-toast]");
let toastTimer;
let consultationDraft = {
  answers: {},
  slot: null,
  slots: [],
  selectedDateKey: "",
};

const consultationFieldParams = {
  intent: ["intent", "hsXnTsP8vjCKtgEtkqSR"],
  timeline: ["timeline", "z9OkdeXN9YcA70o0x8Ft"],
  area: ["area", "location", "8sMD8z7vEw1WZTj2Q4dS"],
  budget: ["budget", "notes", "WingGOKNAdhVqoYmzM27", "HqjHgWIanPmKk1oFrHeu"],
};

function canUseWebsiteApi() {
  return window.location.protocol === "http:" || window.location.protocol === "https:";
}

function setHeaderElevation() {
  header.classList.toggle("is-elevated", window.scrollY > 12);
}

function closeMenu() {
  document.body.classList.remove("menu-open");
  mobileMenu.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3800);
}

function setSubmitting(form, isSubmitting) {
  const button = form.querySelector("button[type='submit']");
  if (!button) return;

  if (isSubmitting) {
    button.dataset.label = button.textContent;
    button.textContent = "Sending...";
    button.disabled = true;
    return;
  }

  button.textContent = button.dataset.label || button.textContent;
  button.disabled = false;
}

async function submitLead(data, leadType) {
  const response = await fetch(siteConfig.highLevelEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      leadType,
      pageUrl: window.location.href,
    }),
  });

  if (!response.ok) {
    throw new Error("Lead submission failed");
  }

  return response.json().catch(() => ({}));
}

function setConsultationStep(step) {
  consultationDialog?.classList.toggle("is-calendar-step", step === "calendar");

  consultationSteps.forEach((item) => {
    item.hidden = item.dataset.consultationStep !== step;
  });
}

function resetConsultationFlow() {
  consultationDraft = {
    answers: {},
    slot: null,
    slots: [],
    selectedDateKey: "",
  };
  if (selectedSlotSummary) {
    selectedSlotSummary.textContent = "";
  }
  if (slotList) {
    slotList.textContent = "";
  }
  if (dateList) {
    dateList.textContent = "";
  }
  if (calendarFrame) {
    calendarFrame.hidden = true;
    calendarFrame.removeAttribute("src");
  }
  if (calendarFallbackLink) {
    calendarFallbackLink.hidden = true;
    calendarFallbackLink.removeAttribute("href");
  }
  document.querySelector("[data-consultation-form]")?.reset();
  consultationContactForm?.reset();
}

function showCalendarInDialog(calendarUrl = siteConfig.calendarUrl) {
  setConsultationStep("calendar");
  loadConsultationSlots();
  return true;
}

function shouldOpenCalendarDirectly() {
  return false;
}

function buildCalendarUrlWithConsultationAnswers(data) {
  const calendarUrl = new URL(siteConfig.calendarUrl);

  Object.entries(consultationFieldParams).forEach(([fieldName, paramNames]) => {
    const value = data[fieldName]?.trim();

    if (!value) {
      return;
    }

    paramNames.forEach((paramName) => {
      calendarUrl.searchParams.set(paramName, value);
    });
  });

  return calendarUrl.toString();
}

function getAppointmentEndTime(startTime) {
  const start = new Date(startTime);

  if (Number.isNaN(start.getTime())) {
    return "";
  }

  return new Date(start.getTime() + siteConfig.appointmentMinutes * 60 * 1000).toISOString();
}

function formatSlotDate(startTime) {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: siteConfig.timezone,
  }).format(new Date(startTime));
}

function getSlotDateKey(startTime) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: siteConfig.timezone,
  }).formatToParts(new Date(startTime));
  const dateParts = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  if (!dateParts.year || !dateParts.month || !dateParts.day) {
    return "";
  }

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function getSlotDateMeta(startTime) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: siteConfig.timezone,
  }).formatToParts(new Date(startTime));
  const dateParts = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    weekday: dateParts.weekday || "",
    month: dateParts.month || "",
    day: dateParts.day || "",
  };
}

function formatSlotTime(startTime) {
  return new Intl.DateTimeFormat("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: siteConfig.timezone,
  }).format(new Date(startTime));
}

function formatSlotSummary(startTime) {
  return `${formatSlotDate(startTime)} at ${formatSlotTime(startTime)}`;
}

function setSlotStatus(message) {
  if (slotStatus) {
    slotStatus.textContent = message;
  }
}

function renderSlotFallback(message = "Open the booking calendar to choose a time.") {
  if (!slotStatus) return;

  const fallbackUrl = buildCalendarUrlWithConsultationAnswers(consultationDraft.answers || {});
  slotStatus.innerHTML = "";
  slotStatus.append(message);

  if (calendarFallbackLink) {
    calendarFallbackLink.href = fallbackUrl;
    calendarFallbackLink.hidden = false;
  }

  if (calendarFrame) {
    calendarFrame.hidden = true;
    calendarFrame.removeAttribute("src");
  }
}

function groupSlotsByDate(slots) {
  return slots.reduce((groups, slot) => {
    const key = getSlotDateKey(slot.startTime);

    if (!key) {
      return groups;
    }

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: formatSlotDate(slot.startTime),
        meta: getSlotDateMeta(slot.startTime),
        slots: [],
      });
    }

    groups.get(key).slots.push(slot);
    return groups;
  }, new Map());
}

function renderDatePicker(dayGroups, selectedKey) {
  if (!dateList) return;

  dateList.textContent = "";

  dayGroups.forEach((dayGroup) => {
    const button = document.createElement("button");
    button.className = `date-button${dayGroup.key === selectedKey ? " is-active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-pressed", String(dayGroup.key === selectedKey));
    button.setAttribute("aria-label", `Show times for ${dayGroup.label}`);

    const weekday = document.createElement("span");
    weekday.className = "date-weekday";
    weekday.textContent = dayGroup.meta.weekday;

    const day = document.createElement("span");
    day.className = "date-number";
    day.textContent = dayGroup.meta.day;

    const month = document.createElement("span");
    month.className = "date-month";
    month.textContent = dayGroup.meta.month;

    button.append(weekday, day, month);
    button.addEventListener("click", () => {
      consultationDraft.selectedDateKey = dayGroup.key;
      renderSlots(consultationDraft.slots);
    });
    dateList.append(button);
  });
}

function renderSelectedDaySlots(dayGroup) {
  if (!slotList || !dayGroup) return;

  slotList.textContent = "";

  const day = document.createElement("section");
  day.className = "slot-day";

  const heading = document.createElement("h3");
  heading.textContent = dayGroup.label;
  day.append(heading);

  const buttons = document.createElement("div");
  buttons.className = "slot-buttons";

  dayGroup.slots.forEach((slot) => {
    const button = document.createElement("button");
    button.className = "slot-button";
    button.type = "button";
    button.textContent = formatSlotTime(slot.startTime);
    button.addEventListener("click", () => {
      consultationDraft.slot = slot;
      if (selectedSlotSummary) {
        selectedSlotSummary.textContent = `Selected time: ${formatSlotSummary(slot.startTime)}`;
      }
      setConsultationStep("contact");
      consultationContactForm?.querySelector("input[name='meetingMethod']")?.focus();
    });
    buttons.append(button);
  });

  day.append(buttons);
  slotList.append(day);
}

function renderSlots(slots) {
  if (!slotList) return;

  slotList.textContent = "";
  if (dateList) {
    dateList.textContent = "";
  }

  if (!slots.length) {
    renderSlotFallback("No quick time buttons were found. Open the booking calendar to choose a time.");
    return;
  }

  consultationDraft.slots = slots;
  const dayGroups = Array.from(groupSlotsByDate(slots).values());

  if (!dayGroups.length) {
    renderSlotFallback("No quick time buttons were found. Open the booking calendar to choose a time.");
    return;
  }

  if (calendarFallbackLink) {
    calendarFallbackLink.hidden = true;
    calendarFallbackLink.removeAttribute("href");
  }
  setSlotStatus("Choose a date, then pick a time.");

  const selectedKey = dayGroups.some((dayGroup) => dayGroup.key === consultationDraft.selectedDateKey)
    ? consultationDraft.selectedDateKey
    : dayGroups[0].key;
  consultationDraft.selectedDateKey = selectedKey;

  renderDatePicker(dayGroups, selectedKey);
  renderSelectedDaySlots(dayGroups.find((dayGroup) => dayGroup.key === selectedKey));
}

async function loadConsultationSlots() {
  if (!slotList || !slotStatus) return;

  slotList.textContent = "";
  if (dateList) {
    dateList.textContent = "";
  }
  if (calendarFrame) {
    calendarFrame.hidden = true;
    calendarFrame.removeAttribute("src");
  }
  if (calendarFallbackLink) {
    calendarFallbackLink.hidden = true;
    calendarFallbackLink.removeAttribute("href");
  }
  setSlotStatus("Loading available times...");

  if (!canUseWebsiteApi()) {
    renderSlotFallback("Open the booking calendar to choose a time.");
    return;
  }

  const startDate = Date.now();
  const endDate = startDate + 35 * 24 * 60 * 60 * 1000;
  const url = new URL(siteConfig.slotsEndpoint, window.location.origin);
  url.searchParams.set("startDate", String(startDate));
  url.searchParams.set("endDate", String(endDate));
  url.searchParams.set("timezone", siteConfig.timezone);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("Slots request failed");
    }

    const result = await response.json();
    renderSlots(result.slots || []);
  } catch (error) {
    renderSlotFallback("The quick time buttons did not load. Open the booking calendar to choose a time.");
  }
}

function openConsultationDialog(step = "questions") {
  closeMenu();
  if (step === "questions") {
    resetConsultationFlow();
  }
  setConsultationStep(step);
  consultationDialog?.showModal();

  if (step === "calendar" && !showCalendarInDialog()) {
    showToast("The calendar could not open. Please call or text me instead.");
  }
}

async function handleLeadForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());

  setSubmitting(form, true);

  try {
    await submitLead(data, "listed-funnel");
  } catch (error) {
    showToast("The form could not connect. Try opening Listed directly.");
    setSubmitting(form, false);
    return;
  }

  setSubmitting(form, false);
  form.reset();
  miniForm?.close();
  showToast("Got it. I will follow up soon.");
}

async function handleHomeValueForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const thanks = form.parentElement?.querySelector("[data-home-value-thanks]");
  const data = Object.fromEntries(new FormData(form).entries());

  setSubmitting(form, true);

  try {
    await submitLead(data, "home-value");
  } catch (error) {
    showToast("The home value form could not connect. Try booking a consultation instead.");
    setSubmitting(form, false);
    return;
  }

  setSubmitting(form, false);
  form.reset();

  if (thanks) {
    form.hidden = true;
    thanks.hidden = false;
    thanks.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  showToast("Thank you. I will gather the info and get back to you shortly.");
}

async function handleConsultationForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());

  if (!form.reportValidity()) {
    return;
  }

  consultationDraft = {
    answers: data,
    slot: null,
    slots: [],
    selectedDateKey: "",
  };

  const calendarUrl = buildCalendarUrlWithConsultationAnswers(data);

  if (shouldOpenCalendarDirectly()) {
    window.location.href = calendarUrl;
    return;
  }

  if (!showCalendarInDialog(calendarUrl)) {
    showToast("The calendar could not open. Please call or text me instead.");
  }
}

async function handleConsultationContactForm(event) {
  event.preventDefault();

  if (!consultationDraft.slot) {
    setConsultationStep("calendar");
    showToast("Please choose a time first.");
    return;
  }

  const form = event.currentTarget;

  if (!form.reportValidity()) {
    return;
  }

  const contactData = Object.fromEntries(new FormData(form).entries());
  const payload = {
    ...consultationDraft.answers,
    ...contactData,
    leadType: "consultation",
    calendarId: consultationDraft.slot.calendarId || "",
    startTime: consultationDraft.slot.startTime,
    endTime: consultationDraft.slot.endTime || getAppointmentEndTime(consultationDraft.slot.startTime),
    pageUrl: window.location.href,
  };

  setSubmitting(form, true);

  try {
    const response = await fetch(siteConfig.bookingEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      const error = new Error(result.error || "Booking failed");
      error.status = response.status;
      throw error;
    }
  } catch (error) {
    if (error.status === 409) {
      consultationDraft.slot = null;
      setConsultationStep("calendar");
      loadConsultationSlots();
      showToast("That time was just taken. Please choose another time.");
      setSubmitting(form, false);
      return;
    }

    showToast("The appointment could not be saved. Please try again or call/text me.");
    setSubmitting(form, false);
    return;
  }

  setSubmitting(form, false);
  form.reset();
  document.querySelector("[data-consultation-form]")?.reset();
  consultationDialog?.close();
  showToast("Booked. Your answers were saved with the appointment.");
}

window.addEventListener("scroll", setHeaderElevation, { passive: true });
setHeaderElevation();

document.querySelectorAll("[data-current-year]").forEach((item) => {
  item.textContent = new Date().getFullYear();
});

document.querySelectorAll("[data-listed-link]").forEach((link) => {
  if (siteConfig.listedUrl) {
    link.href = siteConfig.listedUrl;
    return;
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector("#listed")?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Add your live Listed URL in app.js so this button opens the app directly.");
  });
});

document.querySelectorAll("[data-preview-shot]").forEach((shot) => {
  shot.tabIndex = 0;
  const activateShot = () => {
    const preview = shot.closest(".listed-preview");
    const activeShot = shot.dataset.previewShot;

    preview.classList.toggle("is-map-active", activeShot === "map");
    preview.classList.toggle("is-card-active", activeShot === "card");
  };

  shot.addEventListener("click", activateShot);
  shot.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    activateShot();
  });
});

document.querySelectorAll("[data-calendar-link]").forEach((link) => {
  if (siteConfig.calendarUrl) {
    link.href = siteConfig.calendarUrl;
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();
    openConsultationDialog("calendar");
  });
});

document.querySelectorAll(`a[href="${siteConfig.calendarUrl}"], a[href*="/widget/booking/"]`).forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openConsultationDialog("calendar");
  });
});

document.querySelectorAll("[data-contact-placeholder]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showToast("Add your live phone and email links before publishing.");
  });
});
menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  if (isOpen) {
    closeMenu();
    return;
  }

  document.body.classList.add("menu-open");
  mobileMenu.hidden = false;
  menuToggle.setAttribute("aria-expanded", "true");
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.querySelectorAll("[data-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    document.querySelectorAll("[data-tab]").forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === target);
    });
  });
});

document.querySelector("[data-open-mini-form]")?.addEventListener("click", () => {
  miniForm?.showModal();
});

document.querySelector("[data-close-mini-form]")?.addEventListener("click", () => {
  miniForm?.close();
});

document.querySelectorAll("[data-open-consultation]").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openConsultationDialog("questions");
  });
});

document.querySelectorAll("[data-close-consultation]").forEach((button) => {
  button.addEventListener("click", () => {
    consultationDialog?.close();
  });
});

consultationDialog?.addEventListener("close", () => {
  setConsultationStep("questions");
  resetConsultationFlow();
});

document.querySelector("[data-consultation-back]")?.addEventListener("click", () => {
  setConsultationStep("questions");
});

document.querySelectorAll("[data-lead-form]").forEach((form) => {
  form.addEventListener("submit", handleLeadForm);
});

document.querySelectorAll("[data-consultation-form]").forEach((form) => {
  form.addEventListener("submit", handleConsultationForm);
});

consultationContactForm?.addEventListener("submit", handleConsultationContactForm);

document.querySelectorAll("[data-home-value-form]").forEach((form) => {
  form.addEventListener("submit", handleHomeValueForm);
});
