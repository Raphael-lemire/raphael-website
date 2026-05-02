(function () {
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

      @media (max-width: 640px) {
        .calendar-host-avatar {
          height: 46px;
          width: 46px;
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

  ensureCalendarPolishStyles();
  decorateCalendarHeader();
})();
