(function () {
  const DATES_PER_PAGE = 7;

  function ensureCalendarPolishStyles() {
    if (document.querySelector("[data-calendar-polish-styles]")) return;

    const style = document.createElement("style");
    style.dataset.calendarPolishStyles = "true";
    style.textContent = `
      .calendar-host {
        align-items: center;
        display: flex;
        gap: 12px;
        min-width: 0;
      }

      .calendar-host-avatar {
        border: 2px solid white;
        border-radius: 999px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
        flex: 0 0 auto;
        height: 52px;
        object-fit: cover;
        object-position: center 18%;
        width: 52px;
      }

      .date-list {
        display: grid;
        gap: 10px;
        grid-template-columns: 1fr;
      }

      .date-toolbar {
        align-items: center;
        display: flex;
        gap: 10px;
        justify-content: space-between;
      }

      .date-range {
        color: var(--ink);
        flex: 1 1 auto;
        font-size: 15px;
        font-weight: 950;
        line-height: 1.2;
        text-align: center;
      }

      .date-nav {
        background: white;
        border: 1px solid var(--line);
        border-radius: 999px;
        color: var(--ink);
        cursor: pointer;
        flex: 0 0 auto;
        font: inherit;
        font-size: 13px;
        font-weight: 900;
        min-height: 40px;
        padding: 0 16px;
        transition:
          background 0.2s ease,
          border-color 0.2s ease,
          color 0.2s ease,
          opacity 0.2s ease;
      }

      .date-nav:hover,
      .date-nav:focus-visible {
        background: var(--ink);
        border-color: var(--ink);
        color: white;
        outline: none;
      }

      .date-nav:disabled {
        cursor: not-allowed;
        opacity: 0.38;
      }

      .date-week-range {
        color: var(--muted);
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0;
        line-height: 1.2;
        margin: -2px 0 0;
        text-align: center;
      }

      .date-grid {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(7, minmax(0, 1fr));
      }

      .date-button {
        gap: 5px;
        min-height: 66px;
      }

      @media (max-width: 640px) {
        .calendar-host-avatar {
          height: 46px;
          width: 46px;
        }

        .date-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .date-toolbar {
          gap: 8px;
        }

        .date-nav {
          font-size: 12px;
          min-height: 38px;
          padding: 0 12px;
        }

        .date-range {
          font-size: 13px;
        }
      }
    `;

    document.head.append(style);
  }

  function decorateCalendarHeader() {
    const headerContent = document.querySelector("[data-consultation-step='calendar'] .consult-form-header > div");

    if (!headerContent || headerContent.classList.contains("calendar-host")) {
      return;
    }

    const textWrap = document.createElement("div");

    while (headerContent.firstChild) {
      textWrap.append(headerContent.firstChild);
    }

    const avatar = document.createElement("img");
    avatar.className = "calendar-host-avatar";
    avatar.src = "./assets/raphael-lemire-exit.jpg";
    avatar.alt = "";

    headerContent.classList.add("calendar-host");
    headerContent.append(avatar, textWrap);
  }

  function getPolishedDateMeta(startTime) {
    const date = new Date(startTime);
    const parts = new Intl.DateTimeFormat("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: siteConfig.timezone,
    }).formatToParts(date);
    const dateParts = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const monthLabel = new Intl.DateTimeFormat("en-CA", {
      month: "long",
      year: "numeric",
      timeZone: siteConfig.timezone,
    }).format(date);

    return {
      weekday: dateParts.weekday || "",
      month: dateParts.month || "",
      monthLabel,
      day: dateParts.day || "",
    };
  }

  function getShortDateLabel(dayGroup) {
    return dayGroup?.label?.replace(/^[^,]+,\s*/, "") || "";
  }

  function getDateMonthLabel(dayGroups) {
    const labels = Array.from(new Set(dayGroups.map((dayGroup) => dayGroup.meta.monthLabel).filter(Boolean)));

    if (!labels.length) {
      return "Available dates";
    }

    return labels.join(" - ");
  }

  function getDatePageStart(dayGroups, selectedKey) {
    const selectedIndex = dayGroups.findIndex((dayGroup) => dayGroup.key === selectedKey);
    const maxStart = Math.max(0, Math.floor((dayGroups.length - 1) / DATES_PER_PAGE) * DATES_PER_PAGE);
    let pageStart = Math.min(Math.max(consultationDraft.datePageStart || 0, 0), maxStart);

    if (selectedIndex >= 0 && (selectedIndex < pageStart || selectedIndex >= pageStart + DATES_PER_PAGE)) {
      pageStart = Math.floor(selectedIndex / DATES_PER_PAGE) * DATES_PER_PAGE;
    }

    return Math.min(pageStart, maxStart);
  }

  function renderPolishedDatePicker(dayGroups, selectedKey) {
    if (!dateList) return;

    dateList.textContent = "";
    const pageStart = getDatePageStart(dayGroups, selectedKey);
    const pageEnd = Math.min(pageStart + DATES_PER_PAGE, dayGroups.length);
    const visibleGroups = dayGroups.slice(pageStart, pageEnd);
    consultationDraft.datePageStart = pageStart;

    const toolbar = document.createElement("div");
    toolbar.className = "date-toolbar";

    const previousButton = document.createElement("button");
    previousButton.className = "date-nav";
    previousButton.type = "button";
    previousButton.textContent = "Earlier";
    previousButton.disabled = pageStart === 0;
    previousButton.addEventListener("click", () => {
      const newStart = Math.max(0, pageStart - DATES_PER_PAGE);
      consultationDraft.datePageStart = newStart;
      consultationDraft.selectedDateKey = dayGroups[newStart]?.key || selectedKey;
      renderSlots(consultationDraft.slots);
    });

    const rangeLabel = document.createElement("span");
    rangeLabel.className = "date-range";
    rangeLabel.textContent = getDateMonthLabel(visibleGroups);

    const nextButton = document.createElement("button");
    nextButton.className = "date-nav";
    nextButton.type = "button";
    nextButton.textContent = "Later";
    nextButton.disabled = pageEnd >= dayGroups.length;
    nextButton.addEventListener("click", () => {
      const newStart = Math.min(dayGroups.length - 1, pageStart + DATES_PER_PAGE);
      consultationDraft.datePageStart = newStart;
      consultationDraft.selectedDateKey = dayGroups[newStart]?.key || selectedKey;
      renderSlots(consultationDraft.slots);
    });

    toolbar.append(previousButton, rangeLabel, nextButton);

    const weekRange = document.createElement("p");
    weekRange.className = "date-week-range";
    weekRange.textContent = `${getShortDateLabel(visibleGroups[0])} - ${getShortDateLabel(visibleGroups[visibleGroups.length - 1])}`;

    const grid = document.createElement("div");
    grid.className = "date-grid";

    visibleGroups.forEach((dayGroup) => {
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

      button.append(weekday, day);
      button.addEventListener("click", () => {
        consultationDraft.selectedDateKey = dayGroup.key;
        renderSlots(consultationDraft.slots);
      });
      grid.append(button);
    });

    dateList.append(toolbar, weekRange, grid);
  }

  ensureCalendarPolishStyles();
  decorateCalendarHeader();

  if (typeof getSlotDateMeta === "function") {
    getSlotDateMeta = getPolishedDateMeta;
  }

  if (typeof renderDatePicker === "function") {
    renderDatePicker = renderPolishedDatePicker;
  }
})();
