const HIGHLEVEL_BASE_URL = "https://services.leadconnectorhq.com";
const LOCATION_ID = process.env.HIGHLEVEL_LOCATION_ID || "2LNw0pwcDBoCxk3TGiSY";
const CONTACTS_API_VERSION = "2021-07-28";
const OPPORTUNITIES_API_VERSION = "2023-02-21";
const PIPELINES_API_VERSION = "2021-07-28";
const DEFAULT_CALENDAR_URL = "https://api.leadconnectorhq.com/widget/booking/m1nSKgK0Zc86d2PxUSiq";
const DEFAULT_WEBSITE_PIPELINE_NAME = "website leads";
const DEFAULT_NEW_LEAD_STAGE_NAME = "New Website Lead";

const LEAD_SOURCE_LABELS = {
  consultation: "consultation",
  "home-value": "home value",
  "listed-funnel": "listed",
  newsletter: "newsletter",
};

const CUSTOM_FIELDS = {
  intent: "hsXnTsP8vjCKtgEtkqSR",
  timeline: "z9OkdeXN9YcA70o0x8Ft",
  budget: "WingGOKNAdhVqoYmzM27",
  area: "8sMD8z7vEw1WZTj2Q4dS",
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

function getContactMethods(body) {
  const contact = getString(body.contact);
  const email = getString(body.email) || (contact.includes("@") ? contact : "");
  const phone = getString(body.phone) || (contact && !contact.includes("@") ? contact : "");

  return {
    email,
    phone: normalizePhone(phone),
  };
}

function addCustomField(fields, id, value) {
  const cleanValue = getString(value);

  if (cleanValue) {
    fields.push({ id, value: cleanValue });
  }
}

function getLeadSourceLabel(body) {
  return LEAD_SOURCE_LABELS[body.leadType] || "website";
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

function getIntentValue(body) {
  return getString(body.intent || body.goal || body.leadType);
}

function getIntentTag(body) {
  const intent = getIntentValue(body).toLowerCase();

  if (intent.includes("buy") && intent.includes("sell")) {
    return "intent: buy-sell";
  }

  if (intent.includes("buy")) {
    return "intent: buyer";
  }

  if (intent.includes("sell")) {
    return "intent: seller";
  }

  if (intent.includes("explor")) {
    return "intent: exploring";
  }

  return "";
}

function addNoteLine(rows, label, value) {
  const cleanValue = getString(value);

  if (cleanValue) {
    rows.push(`${label}: ${cleanValue}`);
  }
}

function getLeadNoteTitle(body) {
  if (body.leadType === "newsletter") {
    return "Newsletter Signup";
  }

  if (body.leadType === "home-value") {
    return "Home Value Request";
  }

  if (body.leadType === "listed-funnel") {
    return "Listed Search Lead";
  }

  if (body.leadType === "consultation") {
    return "Consultation Request";
  }

  return "Website Lead";
}

function buildReadableSurveyNotes(body) {
  const { email, phone } = getContactMethods(body);
  const rawNote = getString(body.note || body.message || body.question);
  const contact = [phone, email].filter(Boolean).join(" / ");
  const rows = [getLeadNoteTitle(body)];

  addNoteLine(rows, "Name", body.name);
  addNoteLine(rows, "Contact", contact);
  addNoteLine(rows, "Interest", body.interest);
  addNoteLine(rows, "Looking to", body.intent || body.goal);
  addNoteLine(rows, "Timeline", body.timeline);
  addNoteLine(rows, "Area", getAreaValue(body));
  addNoteLine(rows, "Budget", getBudgetValue(body));
  addNoteLine(rows, "Property", getPropertyAddressValue(body));
  addNoteLine(rows, "Message", rawNote);

  return rows.join("\n");
}

function buildCustomFields(body) {
  const fields = [];

  addCustomField(fields, CUSTOM_FIELDS.intent, getIntentValue(body));
  addCustomField(fields, CUSTOM_FIELDS.timeline, body.timeline);
  addCustomField(fields, CUSTOM_FIELDS.budget, getBudgetValue(body));
  addCustomField(fields, CUSTOM_FIELDS.area, getAreaValue(body));
  addCustomField(fields, CUSTOM_FIELDS.propertyAddress, getPropertyAddressValue(body));
  addCustomField(fields, CUSTOM_FIELDS.notes, buildReadableSurveyNotes(body));

  return fields;
}

function isTestLead(body) {
  const name = getString(body.name).toLowerCase();
  const email = getString(body.email || body.contact).toLowerCase();

  return Boolean(body.testLead) || name.includes("test") || email.includes("test");
}

function buildTags(body) {
  const tags = new Set(["website lead", `source: ${getLeadSourceLabel(body)}`]);
  const intentTag = getIntentTag(body);

  if (intentTag) {
    tags.add(intentTag);
  }

  if (body.leadType === "consultation" || body.leadType === "listed-funnel") {
    tags.add("status: appointment not booked");
  }

  if (body.leadType === "newsletter") {
    tags.add("newsletter");
    tags.add("subscribe to my newsletter");
    tags.add("newsletter subscriber");
    tags.add("real estate market update list");
  }

  if (isTestLead(body)) {
    tags.add("test lead");
  }

  return Array.from(tags);
}

function getLeadSource(body) {
  if (body.leadType === "newsletter") {
    return "raphaellemire.com newsletter";
  }

  if (body.leadType === "home-value") {
    return "raphaellemire.com home value";
  }

  if (body.leadType === "consultation") {
    return "raphaellemire.com consultation";
  }

  if (body.leadType === "listed-funnel") {
    return "raphaellemire.com listed download";
  }

  return "raphaellemire.com website";
}

function buildHighLevelPayload(body) {
  const { email, phone } = getContactMethods(body);
  const name = getString(body.name);

  return {
    locationId: LOCATION_ID,
    ...(name ? splitName(name) : {}),
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    type: "lead",
    country: "CA",
    timezone: "America/Halifax",
    source: getLeadSource(body),
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

function getLegacyStageId(body) {
  const newLeadStageId = process.env.HIGHLEVEL_NEW_LEAD_STAGE_ID || process.env.HIGHLEVEL_WEBSITE_NEW_STAGE_ID;

  if (newLeadStageId) {
    return newLeadStageId;
  }

  if (body.leadType === "home-value") {
    return process.env.HIGHLEVEL_HOME_VALUE_STAGE_ID;
  }

  if (body.leadType === "consultation") {
    return process.env.HIGHLEVEL_CONSULT_STAGE_ID;
  }

  if (body.leadType === "listed-funnel") {
    return process.env.HIGHLEVEL_LISTED_STAGE_ID;
  }

  return "";
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
  return process.env.HIGHLEVEL_WEBSITE_PIPELINE_NAME || DEFAULT_WEBSITE_PIPELINE_NAME;
}

async function resolveOpportunityTarget(token, body) {
  const pipelineName = getWebsitePipelineName();
  const stageName = process.env.HIGHLEVEL_NEW_LEAD_STAGE_NAME || DEFAULT_NEW_LEAD_STAGE_NAME;

  try {
    const result = await highLevelGet(
      `/opportunities/pipelines?locationId=${encodeURIComponent(LOCATION_ID)}`,
      token,
      PIPELINES_API_VERSION
    );
    const pipelines = collectPipelines(result);
    const pipeline = pipelines.find(
      (item) => normalizeName(getPipelineName(item)) === normalizeName(pipelineName)
    );

    if (!pipeline) {
      return null;
    }

    const stage = findStage(pipeline, [stageName, DEFAULT_NEW_LEAD_STAGE_NAME]);
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

function getCalendarUrl(body) {
  if (body.leadType !== "consultation") {
    return "";
  }

  return process.env.HIGHLEVEL_CALENDAR_URL || DEFAULT_CALENDAR_URL;
}

function buildOpportunityPayload(body, contactId, target) {
  if (body.leadType === "newsletter") {
    return null;
  }

  const name = getString(body.name);
  const pipelineId = target?.pipelineId || process.env.HIGHLEVEL_WEBSITE_PIPELINE_ID;
  const pipelineStageId = target?.pipelineStageId || getLegacyStageId(body);

  if (!pipelineId || !pipelineStageId || !contactId) {
    return null;
  }

  return {
    locationId: LOCATION_ID,
    contactId,
    name: getOpportunityName(body, name),
    pipelineId,
    pipelineStageId,
    status: "open",
    monetaryValue: 0,
    source: getLeadSource(body),
  };
}

function getOpportunityName(body, name) {
  if (body.leadType === "home-value") {
    return `${name} - Home Value Request`;
  }

  if (body.leadType === "listed-funnel") {
    return `${name} - Listed Search Lead`;
  }

  return `${name} - Consultation Request`;
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

async function tryCreateContactNote(token, contactId, body) {
  if (!contactId) {
    return null;
  }

  try {
    return await highLevelRequest(
      `/contacts/${encodeURIComponent(contactId)}/notes`,
      token,
      { body: buildReadableSurveyNotes(body) },
      CONTACTS_API_VERSION
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
  const { email, phone } = getContactMethods(body);

  if (body.leadType === "newsletter" && !email) {
    return response.status(400).json({ error: "Email is required" });
  }

  if (body.leadType !== "newsletter" && (!name || (!email && !phone))) {
    return response.status(400).json({ error: "Name and email or phone are required" });
  }

  const token = process.env.HIGHLEVEL_ACCESS_TOKEN;

  if (!token) {
    return response.status(500).json({ error: "HighLevel is not configured" });
  }

  let contactResult;

  try {
    contactResult = await highLevelRequest(
      "/contacts/upsert",
      token,
      buildHighLevelPayload(body),
      CONTACTS_API_VERSION
    );
  } catch (error) {
    return response.status(error.status || 502).json({
      error: "HighLevel rejected the lead",
      details: error.details || {},
    });
  }

  const contactId = getContactId(contactResult);
  const opportunityTarget = body.leadType === "newsletter" ? null : await resolveOpportunityTarget(token, body);
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

  const noteResult = await tryCreateContactNote(token, contactId, body);

  return response.status(200).json({
    ok: true,
    contactId,
    noteSaved: Boolean(noteResult),
    opportunityId: opportunityResult?.opportunity?.id || opportunityResult?.id || null,
    opportunityConfigured: Boolean(opportunityPayload),
    opportunityPipeline: opportunityTarget?.pipelineName || null,
    opportunityStage: opportunityTarget?.stageName || null,
    calendarUrl: getCalendarUrl(body),
  });
}
