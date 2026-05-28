const HIGHLEVEL_BASE_URL = "https://services.leadconnectorhq.com";
const LOCATION_ID = process.env.HIGHLEVEL_LOCATION_ID || "2LNw0pwcDBoCxk3TGiSY";
const DEFAULT_CALENDAR_ID = "m1nSKgK0Zc86d2PxUSiq";
const CONTACTS_API_VERSION = "2021-07-28";
const OPPORTUNITIES_API_VERSION = "2023-02-21";
const PIPELINES_API_VERSION = "2021-07-28";
const CALENDAR_API_VERSION = "2023-02-21";
const CALENDAR_SLOTS_API_VERSION = "2021-04-15";
const DEFAULT_CLIENT_JOURNEY_PIPELINE_ID = "HjlpGqRjfF84myk6eI3h";
const DEFAULT_CLIENT_JOURNEY_APPOINTMENT_STAGE_ID = "af295347-1e81-4e76-b5d0-4e659a4a0412";
const DEFAULT_WEBSITE_PIPELINE_NAME = "Client Journey";
const DEFAULT_NEW_LEAD_STAGE_NAME = "New Lead";
const DEFAULT_APPOINTMENT_STAGE_NAME = "Appointment Booked";

const CUSTOM_FIELDS = {
  intent: "hsXnTsP8vjCKtgEtkqSR",
  timeline: "z9OkdeXN9YcA70o0x8Ft",
  budget: "WingGOKNAdhVqoYmzM27",
  area: "8sMD8z7vEw1WZTj2Q4dS",
  appointmentArea: "KR9c2RArZICZP3ZJco3J",
  propertyAddress: "vah7vOKAUvKWSuZyWGml",
  notes: "HqjHgWIanPmKk1oFrHeu",
};

function getString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeName(value) {
  return getString(value).toLowerCase().replace(/\s+/g, " ");
}

function splitName(name) {
  const parts = getString(name).split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {};
  }

  if (parts.length === 1) {
    return { firstName: parts[0] };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1),
  };
}

function normalizePhone(value) {
  const phone = getString(value);
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return phone;
}

function addCustomField(fields, id, value) {
  const cleanValue = getString(value);

  if (cleanValue) {
    fields.push({ id, value: cleanValue });
  }
}

function getIntentValue(body) {
  const intent = getString(body.intent || body.goal);

  if (intent.toLowerCase().includes("buy") && intent.toLowerCase().includes("sell")) {
    return "Buy & Sell";
  }

  if (intent.toLowerCase().includes("explor")) {
    return "Just exploring";
  }

  return intent;
}

function getTimelineValue(body) {
  const timeline = getString(body.timeline);
  const normalized = timeline.toLowerCase();

  if (normalized.includes("asap")) {
    return "0-3 months";
  }

  if (normalized.includes("12+") || normalized.includes("explor")) {
    return "Unknown";
  }

  return timeline;
}

function getBudgetValue(body) {
  return getString(body.budget || body.priceRange || body.maxPrice);
}

function getAreaValue(body) {
  return getString(body.area || body.city || body.neighbourhood);
}

function getPropertyAddressValue(body) {
  return getString(body.address || body.propertyAddress);
}

function getAppointmentTimeLabel(body) {
  const start = new Date(body.startTime);

  if (Number.isNaN(start.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Halifax",
  }).format(start);
}

function getMeetingMethodValue(body) {
  const meetingMethod = getString(body.meetingMethod);
  const normalized = meetingMethod.toLowerCase();

  if (normalized.includes("phone")) {
    return "Phone call";
  }

  if (normalized.includes("google") || normalized.includes("meet") || normalized.includes("video")) {
    return "Google Meet video call";
  }

  if (normalized.includes("person") || normalized.includes("office") || normalized.includes("champlain")) {
    return "In person at 260 Champlain St, Dieppe";
  }

  return meetingMethod;
}

function getMeetingMethodShort(body) {
  const meetingMethod = getMeetingMethodValue(body);
  const normalized = meetingMethod.toLowerCase();

  if (normalized.includes("phone")) {
    return "Phone call";
  }

  if (normalized.includes("google") || normalized.includes("meet") || normalized.includes("video")) {
    return "Google Meet";
  }

  if (normalized.includes("person") || normalized.includes("office") || normalized.includes("champlain")) {
    return "In person";
  }

  return meetingMethod;
}

function addSlotStartTime(slots, value) {
  if (!value) return;

  if (typeof value === "string") {
    const start = new Date(value);

    if (!Number.isNaN(start.getTime())) {
      slots.push(start.toISOString());
    }

    return;
  }

  if (typeof value !== "object") return;

  const startTime = value.startTime || value.start || value.time;

  if (startTime) {
    const start = new Date(startTime);

    if (!Number.isNaN(start.getTime())) {
      slots.push(start.toISOString());
    }
  }
}

function collectSlotStartTimes(value, slots = []) {
  if (!value) return slots;

  if (Array.isArray(value)) {
    value.forEach((item) => {
      addSlotStartTime(slots, item);
      collectSlotStartTimes(item, slots);
    });
    return slots;
  }

  if (typeof value === "string") {
    addSlotStartTime(slots, value);
    return slots;
  }

  if (typeof value !== "object") return slots;

  addSlotStartTime(slots, value);

  Object.entries(value).forEach(([key, child]) => {
    if (key === "traceId") return;
    collectSlotStartTimes(child, slots);
  });

  return slots;
}

function isSameSlot(slotStartTime, requestedStartTime) {
  const slotStart = new Date(slotStartTime).getTime();
  const requestedStart = new Date(requestedStartTime).getTime();

  if (!Number.isFinite(slotStart) || !Number.isFinite(requestedStart)) {
    return false;
  }

  return Math.abs(slotStart - requestedStart) < 60 * 1000;
}

function getAppointmentMinutes(body) {
  const startTime = new Date(body.startTime).getTime();
  const endTime = new Date(body.endTime).getTime();

  if (Number.isFinite(startTime) && Number.isFinite(endTime) && endTime > startTime) {
    return Math.max(15, Math.round((endTime - startTime) / 60000));
  }

  return 60;
}

function buildAppointmentNote(body) {
  const rows = [
    "Appointment lead summary",
    "",
    "Contact",
    `- Name: ${getString(body.name)}`,
    `- Phone: ${getString(body.phone)}`,
    `- Email: ${getString(body.email)}`,
    "",
    "Booking request",
    `- Looking to: ${getIntentValue(body) || "Not answered"}`,
    `- Time frame: ${getString(body.timeline) || "Not answered"}`,
    `- Location: ${getAreaValue(body) || "Not answered"}`,
    `- Budget / questions: ${getBudgetValue(body) || "Not answered"}`,
    "",
    "Appointment",
    `- Meeting preference: ${getMeetingMethodValue(body) || "Not answered"}`,
    `- Selected time: ${getAppointmentTimeLabel(body) || getString(body.startTime)}`,
    `- Original page: ${getString(body.pageUrl) || "Not captured"}`,
  ];

  return rows.join("\n");
}

function buildCustomFields(body) {
  const fields = [];
  const area = getAreaValue(body);

  addCustomField(fields, CUSTOM_FIELDS.intent, getIntentValue(body));
  addCustomField(fields, CUSTOM_FIELDS.timeline, getTimelineValue(body));
  addCustomField(fields, CUSTOM_FIELDS.budget, getBudgetValue(body));
  addCustomField(fields, CUSTOM_FIELDS.area, area);
  addCustomField(fields, CUSTOM_FIELDS.appointmentArea, area);
  addCustomField(fields, CUSTOM_FIELDS.propertyAddress, getPropertyAddressValue(body));
  addCustomField(fields, CUSTOM_FIELDS.notes, buildAppointmentNote(body));

  return fields;
}

function getDescriptorTags(body) {
  const intent = getIntentValue(body).toLowerCase();

  if (intent.includes("buy") && intent.includes("sell")) {
    return ["buyer", "seller"];
  }

  if (intent.includes("buy")) {
    return ["buyer"];
  }

  if (intent.includes("sell")) {
    return ["seller"];
  }

  if (intent.includes("explor")) {
    return ["exploring"];
  }

  return [];
}

function buildTags(body) {
  const tags = new Set(["website lead"]);

  getDescriptorTags(body).forEach((tag) => tags.add(tag));

  if (getString(body.name).toLowerCase().includes("test") || getString(body.email).toLowerCase().includes("test")) {
    tags.add("test lead");
  }

  return Array.from(tags);
}

function buildContactPayload(body) {
  const name = getString(body.name);
  const phone = normalizePhone(body.phone);
  const email = getString(body.email);

  return {
    locationId: LOCATION_ID,
    ...splitName(name),
    name,
    email,
    phone,
    type: "lead",
    country: "CA",
    timezone: "America/Halifax",
    source: "raphaellemire.com consultation",
    tags: buildTags(body),
    customFields: buildCustomFields(body),
    ...(process.env.HIGHLEVEL_ASSIGNED_USER_ID
      ? { assignedTo: process.env.HIGHLEVEL_ASSIGNED_USER_ID }
      : {}),
  };
}

function getContactId(result) {
  return (
    getString(result.contact?.id) ||
    getString(result.id) ||
    getString(result.contactId)
  );
}

function getAppointmentId(result) {
  return (
    getString(result.appointment?.id) ||
    getString(result.event?.id) ||
    getString(result.id)
  );
}

function getLegacyStageId() {
  return (
    process.env.HIGHLEVEL_NEW_LEAD_STAGE_ID ||
    process.env.HIGHLEVEL_WEBSITE_NEW_STAGE_ID ||
    process.env.HIGHLEVEL_CONSULT_STAGE_ID ||
    ""
  );
}

function getConfiguredPipelineId() {
  return process.env.HIGHLEVEL_CLIENT_JOURNEY_PIPELINE_ID || DEFAULT_CLIENT_JOURNEY_PIPELINE_ID;
}

function getConfiguredAppointmentStageId() {
  return process.env.HIGHLEVEL_CLIENT_JOURNEY_APPOINTMENT_STAGE_ID || DEFAULT_CLIENT_JOURNEY_APPOINTMENT_STAGE_ID;
}

function getPipelineName(pipeline) {
  return getString(pipeline.name || pipeline.title);
}

function getStageName(stage) {
  return getString(stage.name || stage.title);
}

function getStageIdFromStage(stage) {
  return getString(stage.id || stage.stageId || stage.pipelineStageId);
}

function collectPipelines(value, pipelines = []) {
  if (!value) {
    return pipelines;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectPipelines(item, pipelines));
    return pipelines;
  }

  if (typeof value !== "object") {
    return pipelines;
  }

  if (getString(value.id) && getPipelineName(value) && Array.isArray(value.stages)) {
    pipelines.push(value);
    return pipelines;
  }

  Object.entries(value).forEach(([key, child]) => {
    if (key === "traceId") {
      return;
    }

    collectPipelines(child, pipelines);
  });

  return pipelines;
}

function findStage(pipeline, stageNames) {
  const normalizedNames = stageNames.map(normalizeName).filter(Boolean);
  const stages = Array.isArray(pipeline.stages) ? pipeline.stages : [];

  return (
    stages.find((stage) => normalizedNames.includes(normalizeName(getStageName(stage)))) ||
    stages[0] ||
    null
  );
}

function getWebsitePipelineName() {
  return process.env.HIGHLEVEL_CLIENT_JOURNEY_PIPELINE_NAME || DEFAULT_WEBSITE_PIPELINE_NAME;
}

async function resolveOpportunityTarget(token) {
  const pipelineId = getConfiguredPipelineId();
  const pipelineName = getWebsitePipelineName();
  const configuredStageId = getConfiguredAppointmentStageId();
  const stageName = process.env.HIGHLEVEL_APPOINTMENT_STAGE_NAME || DEFAULT_APPOINTMENT_STAGE_NAME;

  try {
    const result = await highLevelGet(
      `/opportunities/pipelines?locationId=${encodeURIComponent(LOCATION_ID)}`,
      token,
      PIPELINES_API_VERSION
    );
    const pipelines = collectPipelines(result);
    const pipeline =
      pipelines.find((item) => getString(item.id) === pipelineId) ||
      pipelines.find((item) => normalizeName(getPipelineName(item)) === normalizeName(pipelineName)) ||
      pipelines.find(
        (item) => normalizeName(getPipelineName(item)) === normalizeName(process.env.HIGHLEVEL_WEBSITE_PIPELINE_NAME)
      );

    if (!pipeline) {
      return null;
    }

    const stage =
      (pipeline.stages || []).find((item) => getStageIdFromStage(item) === configuredStageId) ||
      findStage(pipeline, [stageName, DEFAULT_APPOINTMENT_STAGE_NAME, DEFAULT_NEW_LEAD_STAGE_NAME, "New Website Lead"]);
    const pipelineStageId = getStageIdFromStage(stage);

    if (!pipelineStageId) {
      return null;
    }

    return {
      pipelineId: getString(pipeline.id),
      pipelineStageId,
      pipelineName: getPipelineName(pipeline),
      stageName: getStageName(stage),
    };
  } catch (error) {
    return null;
  }
}

function getCalendarIds(body = {}) {
  const selectedCalendarId = getString(body.calendarId);
  const configuredId = process.env.HIGHLEVEL_CALENDAR_ID;
  const ids = [
    selectedCalendarId,
    configuredId,
    DEFAULT_CALENDAR_ID,
    `appointments_${DEFAULT_CALENDAR_ID}`,
  ].filter(Boolean);

  return Array.from(new Set(ids));
}

async function fetchFreeSlotsForCalendar(calendarId, token, body) {
  const startTime = new Date(body.startTime);
  const startDate = startTime.getTime() - 60 * 1000;
  const endDate = startTime.getTime() + getAppointmentMinutes(body) * 60 * 1000 + 60 * 1000;
  const url = new URL(`${HIGHLEVEL_BASE_URL}/calendars/${calendarId}/free-slots`);

  url.searchParams.set("startDate", String(startDate));
  url.searchParams.set("endDate", String(endDate));
  url.searchParams.set("timezone", "America/Halifax");

  const highLevelResponse = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      Version: CALENDAR_SLOTS_API_VERSION,
    },
  });

  const result = await highLevelResponse.json().catch(() => ({}));

  return {
    ok: highLevelResponse.ok,
    status: highLevelResponse.status,
    result,
  };
}

async function findAvailableCalendarId(body, token) {
  let lastResult = null;

  for (const calendarId of getCalendarIds(body)) {
    lastResult = await fetchFreeSlotsForCalendar(calendarId, token, body);

    if (!lastResult.ok) {
      continue;
    }

    const availableStarts = collectSlotStartTimes(lastResult.result);

    if (availableStarts.some((slotStartTime) => isSameSlot(slotStartTime, body.startTime))) {
      return calendarId;
    }
  }

  const error = new Error("Selected appointment time is no longer available");
  error.status = lastResult?.status && lastResult.status !== 200 ? lastResult.status : 409;
  error.details = lastResult?.result || {};
  throw error;
}

function buildOpportunityPayload(body, contactId, target) {
  const pipelineId = target?.pipelineId || getConfiguredPipelineId() || process.env.HIGHLEVEL_WEBSITE_PIPELINE_ID;
  const pipelineStageId = target?.pipelineStageId || getConfiguredAppointmentStageId() || getLegacyStageId();

  if (!pipelineId || !pipelineStageId || !contactId) {
    return null;
  }

  return {
    locationId: LOCATION_ID,
    contactId,
    name: `${getString(body.name)} - Consultation Request`,
    pipelineId,
    pipelineStageId,
    status: "open",
    monetaryValue: 0,
    source: "raphaellemire.com consultation",
  };
}

function buildAppointmentPayload(body, contactId, calendarId) {
  const meetingMethod = getMeetingMethodShort(body);
  const title = [getString(body.name), meetingMethod].filter(Boolean).join(" - ");

  return {
    locationId: LOCATION_ID,
    calendarId,
    contactId,
    startTime: getString(body.startTime),
    endTime: getString(body.endTime),
    title: title || getString(body.name),
    appointmentStatus: "confirmed",
    toNotify: true,
    ...(process.env.HIGHLEVEL_ASSIGNED_USER_ID
      ? { assignedUserId: process.env.HIGHLEVEL_ASSIGNED_USER_ID }
      : {}),
  };
}

async function highLevelRequest(path, token, payload, version) {
  const highLevelResponse = await fetch(`${HIGHLEVEL_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Version: version,
    },
    body: JSON.stringify(payload),
  });

  const result = await highLevelResponse.json().catch(() => ({}));

  if (!highLevelResponse.ok) {
    const error = new Error("HighLevel rejected the request");
    error.status = highLevelResponse.status;
    error.details = result;
    throw error;
  }

  return result;
}

async function highLevelGet(path, token, version) {
  const highLevelResponse = await fetch(`${HIGHLEVEL_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      Version: version,
    },
  });

  const result = await highLevelResponse.json().catch(() => ({}));

  if (!highLevelResponse.ok) {
    const error = new Error("HighLevel rejected the request");
    error.status = highLevelResponse.status;
    error.details = result;
    throw error;
  }

  return result;
}

async function tryCreateAppointmentNote(token, appointmentId, body) {
  if (!appointmentId) {
    return null;
  }

  try {
    return await highLevelRequest(
      `/calendars/appointments/${appointmentId}/notes`,
      token,
      { body: buildAppointmentNote(body) },
      CALENDAR_API_VERSION
    );
  } catch (error) {
    return null;
  }
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const body = request.body || {};
  const name = getString(body.name);
  const email = getString(body.email);
  const phone = getString(body.phone);
  const startTime = getString(body.startTime);

  if (!name || !email || !phone || !startTime) {
    return response.status(400).json({ error: "Name, email, phone, and appointment time are required" });
  }

  if (Number.isNaN(new Date(startTime).getTime())) {
    return response.status(400).json({ error: "Appointment time is invalid" });
  }

  const token = process.env.HIGHLEVEL_ACCESS_TOKEN;

  if (!token) {
    return response.status(500).json({ error: "HighLevel is not configured" });
  }

  let calendarId;

  try {
    calendarId = await findAvailableCalendarId(body, token);
  } catch (error) {
    return response.status(error.status || 409).json({
      error: "Selected appointment time is no longer available",
      details: error.details || {},
    });
  }

  let contactResult;

  try {
    contactResult = await highLevelRequest(
      "/contacts/upsert",
      token,
      buildContactPayload(body),
      CONTACTS_API_VERSION
    );
  } catch (error) {
    return response.status(error.status || 502).json({
      error: "HighLevel rejected the contact",
      details: error.details || {},
    });
  }

  const contactId = getContactId(contactResult);
  const opportunityTarget = await resolveOpportunityTarget(token);
  const opportunityPayload = buildOpportunityPayload(body, contactId, opportunityTarget);
  let opportunityResult = null;

  if (opportunityPayload) {
    try {
      opportunityResult = await highLevelRequest(
        "/opportunities/upsert",
        token,
        opportunityPayload,
        OPPORTUNITIES_API_VERSION
      );
    } catch (error) {
      return response.status(error.status || 502).json({
        error: "HighLevel rejected the opportunity",
        details: error.details || {},
      });
    }
  }

  let appointmentResult;
  let appointmentError;

  for (const appointmentCalendarId of [calendarId]) {
    try {
      appointmentResult = await highLevelRequest(
        "/calendars/events/appointments",
        token,
        buildAppointmentPayload(body, contactId, appointmentCalendarId),
        CALENDAR_API_VERSION
      );
      appointmentError = null;
      break;
    } catch (error) {
      appointmentError = error;
    }
  }

  if (appointmentError || !appointmentResult) {
    return response.status(appointmentError?.status || 502).json({
      error: "HighLevel rejected the appointment",
      details: appointmentError?.details || {},
    });
  }

  const appointmentId = getAppointmentId(appointmentResult);
  const noteResult = await tryCreateAppointmentNote(token, appointmentId, body);

  return response.status(200).json({
    ok: true,
    contactId,
    appointmentId,
    noteSaved: Boolean(noteResult),
    opportunityId: opportunityResult?.opportunity?.id || opportunityResult?.id || null,
    opportunityPipeline: opportunityTarget?.pipelineName || null,
    opportunityStage: opportunityTarget?.stageName || null,
  });
}
