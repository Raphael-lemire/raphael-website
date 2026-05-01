const HIGHLEVEL_BASE_URL = "https://services.leadconnectorhq.com";
const DEFAULT_CALENDAR_ID = "m1nSKgK0Zc86d2PxUSiq";
const CALENDAR_API_VERSION = "2021-04-15";
const MAX_SLOT_RANGE_DAYS = 30;

function getNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function addSlot(slots, value) {
  if (!value) return;

  if (typeof value === "string") {
    const start = new Date(value);

    if (!Number.isNaN(start.getTime())) {
      slots.push({ startTime: start.toISOString() });
    }

    return;
  }

  if (typeof value !== "object") return;

  const startTime = value.startTime || value.start || value.time;
  const endTime = value.endTime || value.end;

  if (startTime) {
    const start = new Date(startTime);

    if (!Number.isNaN(start.getTime())) {
      slots.push({
        startTime: start.toISOString(),
        ...(endTime ? { endTime: new Date(endTime).toISOString() } : {}),
      });
    }
  }
}

function collectSlots(value, slots = []) {
  if (!value) return slots;

  if (Array.isArray(value)) {
    value.forEach((item) => {
      addSlot(slots, item);
      collectSlots(item, slots);
    });
    return slots;
  }

  if (typeof value === "string") {
    addSlot(slots, value);
    return slots;
  }

  if (typeof value !== "object") return slots;

  addSlot(slots, value);

  Object.entries(value).forEach(([key, child]) => {
    if (key === "traceId") return;
    collectSlots(child, slots);
  });

  return slots;
}

function normalizeSlots(payload, calendarId) {
  const now = Date.now();
  const seen = new Set();

  return collectSlots(payload)
    .filter((slot) => new Date(slot.startTime).getTime() > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .filter((slot) => {
      if (seen.has(slot.startTime)) return false;
      seen.add(slot.startTime);
      return true;
    })
    .map((slot) => ({
      ...slot,
      calendarId,
    }));
}

function getCalendarIds() {
  const configuredId = process.env.HIGHLEVEL_CALENDAR_ID;
  const ids = [
    configuredId,
    DEFAULT_CALENDAR_ID,
    `appointments_${DEFAULT_CALENDAR_ID}`,
  ].filter(Boolean);

  return Array.from(new Set(ids));
}

async function fetchSlotsForCalendar(calendarId, token, request) {
  const startDate = getNumber(request.query.startDate) || Date.now();
  const requestedEndDate = getNumber(request.query.endDate) || startDate + MAX_SLOT_RANGE_DAYS * 24 * 60 * 60 * 1000;
  const maxEndDate = startDate + MAX_SLOT_RANGE_DAYS * 24 * 60 * 60 * 1000;
  const endDate = Math.min(requestedEndDate, maxEndDate);
  const timezone = request.query.timezone || "America/Halifax";
  const url = new URL(`${HIGHLEVEL_BASE_URL}/calendars/${calendarId}/free-slots`);

  url.searchParams.set("startDate", String(startDate));
  url.searchParams.set("endDate", String(endDate));
  url.searchParams.set("timezone", timezone);

  const highLevelResponse = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      Version: CALENDAR_API_VERSION,
    },
  });

  const result = await highLevelResponse.json().catch(() => ({}));

  return {
    ok: highLevelResponse.ok,
    status: highLevelResponse.status,
    result,
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.HIGHLEVEL_ACCESS_TOKEN;

  if (!token) {
    return response.status(500).json({ error: "HighLevel is not configured" });
  }

  let lastResult = null;

  for (const calendarId of getCalendarIds()) {
    lastResult = await fetchSlotsForCalendar(calendarId, token, request);

    if (lastResult.ok) {
      return response.status(200).json({
        ok: true,
        calendarId,
        slots: normalizeSlots(lastResult.result, calendarId),
      });
    }
  }

  return response.status(lastResult?.status || 502).json({
    error: "HighLevel rejected the slots request",
    details: lastResult?.result || {},
  });
}
