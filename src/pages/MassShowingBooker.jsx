import { useEffect, useMemo, useState } from 'react';
import './MassShowingBooker.css';

const STORAGE_KEY = 'mass-showing-booker-v1';
const SCHEDULE_SEED_KEY = 'mass-showing-booker-showing-schedule-2026-05-04-seeded';
const API_ENDPOINT = '/api/showing-workspace';
const DASHBOARD_URL = 'https://raphael-home-dashboard.vercel.app/dashboard';
const REPORT_LOGO_URL = '/closing-cost-calculator/assets/exit-realty-associates.jpeg';
const REPORT_LOGO_WIDTH = 1170;
const REPORT_LOGO_HEIGHT = 603;
const AGENT_PHONE_DISPLAY = '(506) 227-5702';
const AGENT_EMAIL = 'raphael@exitmoncton.ca';

const statuses = [
  { value: 'need', label: 'Need to request' },
  { value: 'requested', label: 'Request sent' },
  { value: 'accepted', label: 'Confirmed' },
  { value: 'denied', label: 'Not available' },
  { value: 'change', label: 'Need to change' },
];

const quickStatuses = [
  { value: 'requested', label: 'Request sent' },
  { value: 'accepted', label: 'Confirmed' },
  { value: 'denied', label: 'Not available' },
  { value: 'change', label: 'Need to change' },
];

const offerChoices = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'maybe', label: 'Maybe' },
];

const listingDetails = {
  '57-kervin': {
    mls: 'NB133396',
    realtor: 'Chantal Albert / Marc-Andre Arsenault',
    phone: '5068755626',
    brokerage: 'EXIT Realty Associates',
  },
  '64-amity': {
    mls: 'NB135672',
    realtor: 'Tracey Mullin',
    phone: '5068666954',
    brokerage: '3 Percent Realty Atlantic Inc.',
  },
  '3-heros': {
    mls: 'NB137332',
    realtor: 'Phil Albert',
    phone: '5068783948',
    brokerage: 'RE/MAX Quality Real Estate Inc.',
  },
  '92-satara': {
    mls: 'NB136505',
    realtor: 'Dennis Wilson',
    phone: '5068710223',
    brokerage: 'Keller Williams Capital Realty',
  },
  '60-crowbush': {
    mls: 'NB136153',
    realtor: 'Marley Churchill / Talia Hughes / Karlee Guenther / Shane Moore',
    phone: '5068638078',
    brokerage: 'Creativ Realty',
  },
  '54-cudmore': {
    mls: 'NB136408',
    realtor: 'Huguette LeBlanc / Audrey Melanson',
    phone: '5069610888',
    brokerage: 'eXp Realty',
  },
  '113-oakfield': {
    mls: 'NB134000',
    realtor: 'Maurice LeBlanc',
    phone: '5065315934',
    brokerage: 'RE/MAX Avante',
  },
  '50-doiron': {
    mls: 'NB138221',
    realtor: 'Jesus Machado',
    phone: '5062334717',
    brokerage: 'Platinum Atlantic Realty Inc.',
  },
  '1003-bourque': {
    mls: 'NB134336',
    realtor: 'Joanne Maillet',
    phone: '5062954699',
    brokerage: 'EXIT Realty Associates',
  },
  '124-larochelle': {
    mls: 'NB133041',
    realtor: 'Mike Doiron / Heather Doiron',
    phone: '5068507089',
    brokerage: 'EXIT Realty Associates',
  },
  '94-adrienne': {
    mls: 'NB133143',
    realtor: 'Mike Doiron / Heather Doiron',
    phone: '5068507089',
    brokerage: 'EXIT Realty Associates',
  },
  '458-gaspe': {
    mls: 'NB134724',
    realtor: 'Chantal Albert / Marc-Andre Arsenault',
    phone: '5068755626',
    brokerage: 'EXIT Realty Associates',
  },
  '59-old-oak': {
    mls: 'NB137770',
    realtor: 'Karine Dufresne',
    phone: '5068750499',
    brokerage: 'EXIT Realty Associates',
  },
  '375-glengrove': {
    mls: 'NB133057',
    realtor: 'Eric Frenette',
    phone: '5063647653',
    brokerage: 'Keller Williams Capital Realty',
  },
  '109-doiron': {
    mls: 'NB132353',
    realtor: 'Jonathan David',
    phone: '8777090027',
    brokerage: 'PG Direct Realty Ltd.',
  },
};

let toastTimer;

function createId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayValue() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
}

function createHome(overrides = {}) {
  const details = listingDetails[overrides.listingId] || {};

  return {
    id: createId(),
    listingId: overrides.listingId || '',
    address: '',
    mls: '',
    realtor: '',
    brokerage: '',
    phone: '',
    status: 'need',
    time: '',
    endTime: '',
    notes: '',
    instructions: '',
    feedbackScore: '',
    liked: '',
    disliked: '',
    offerInterest: '',
    sellingAgentQuestion: '',
    ...details,
    ...overrides,
  };
}

function createPlan(overrides = {}) {
  return {
    id: createId(),
    clientName: 'New buyer',
    showingDate: todayValue(),
    startLocation: '',
    generalNotes: '',
    homes: [],
    ...overrides,
  };
}

function createShowingSchedulePlans() {
  const sharedNotes = 'Proposed schedule from Showing schedule PDF. Showing length is about 45 minutes per property. Times are subject to listing-side confirmation. Thursday, May 7, 2026 stays open for a second viewing.';

  return [
    createPlan({
      id: 'showing-schedule-2026-05-05-moncton',
      clientName: 'Showing schedule - Moncton cluster',
      showingDate: '2026-05-05',
      generalNotes: `${sharedNotes} Tuesday route is grouped in Moncton to limit travel time.`,
      homes: [
        createHome({ id: 'showing-57-kervin', listingId: '57-kervin', address: '57 Kervin Cres', time: '13:00', endTime: '13:45', notes: 'Moncton cluster.' }),
        createHome({ id: 'showing-64-amity', listingId: '64-amity', address: '64 Amity Street', time: '14:00', endTime: '14:45', notes: 'Moncton cluster.' }),
        createHome({ id: 'showing-3-heros', listingId: '3-heros', address: '3 Heros Court', time: '15:00', endTime: '15:45', notes: 'Moncton cluster.' }),
        createHome({ id: 'showing-92-satara', listingId: '92-satara', address: '92 Satara Dr', time: '15:45', endTime: '16:30', notes: 'Very close to 60 Crowbush Crescent; can be booked back-to-back.' }),
        createHome({ id: 'showing-60-crowbush', listingId: '60-crowbush', address: '60 Crowbush Crescent', time: '16:30', endTime: '17:15', notes: 'Very close to 92 Satara Dr.' }),
      ],
    }),
    createPlan({
      id: 'showing-schedule-2026-05-06-riverview-dieppe',
      clientName: 'Showing schedule - Riverview + Dieppe',
      showingDate: '2026-05-06',
      generalNotes: `${sharedNotes} Wednesday route starts in Riverview, moves to Dieppe, reserves lunch from 12:00 PM to 12:45 PM, then finishes near East Moncton. 109 Doiron Street stays pending until quick-closing confirmation is received.`,
      homes: [
        createHome({ id: 'showing-54-cudmore', listingId: '54-cudmore', address: '54 Cudmore St', time: '09:00', endTime: '09:45', notes: 'Riverview.' }),
        createHome({ id: 'showing-113-oakfield', listingId: '113-oakfield', address: '113 Oakfield Dr', time: '10:00', endTime: '10:45', notes: 'Riverview.' }),
        createHome({ id: 'showing-50-doiron', listingId: '50-doiron', address: '50 Doiron', time: '11:15', endTime: '12:00', notes: 'Dieppe.' }),
        createHome({ id: 'showing-1003-bourque', listingId: '1003-bourque', address: '1003 Bourque Rd', time: '12:45', endTime: '13:30', notes: 'After reserved lunch break.' }),
        createHome({ id: 'showing-124-larochelle', listingId: '124-larochelle', address: '124 Larochelle St', time: '13:30', endTime: '14:15', notes: 'Dieppe.' }),
        createHome({ id: 'showing-94-adrienne', listingId: '94-adrienne', address: '94 Adrienne Court', time: '14:30', endTime: '15:15', notes: 'Dieppe.' }),
        createHome({ id: 'showing-458-gaspe', listingId: '458-gaspe', address: '458 Gaspe St', time: '15:15', endTime: '16:00', notes: 'Dieppe.' }),
        createHome({ id: 'showing-59-old-oak', listingId: '59-old-oak', address: '59 Old Oak', time: '16:15', endTime: '17:00', notes: 'East Moncton / near Dieppe.' }),
        createHome({ id: 'showing-375-glengrove', listingId: '375-glengrove', address: '375 Glengrove Rd', time: '17:00', endTime: '17:45', notes: 'East Moncton.' }),
        createHome({ id: 'showing-109-doiron', listingId: '109-doiron', address: '109 Doiron Street', status: 'change', notes: 'Pending: add at the end only once quick-closing confirmation is received.' }),
      ],
    }),
  ];
}

function normalizeStatus(value) {
  const replacements = {
    confirmed: 'accepted',
    unavailable: 'denied',
    skipped: 'change',
  };

  const nextValue = replacements[value] || value || 'need';
  return statuses.some((status) => status.value === nextValue) ? nextValue : 'need';
}

function listingIdForHome(home) {
  if (home.listingId && listingDetails[home.listingId]) return home.listingId;
  if (typeof home.id === 'string' && home.id.startsWith('showing-')) {
    const inferredId = home.id.replace(/^showing-/, '');
    if (listingDetails[inferredId]) return inferredId;
  }

  return '';
}

function normalizeHome(home) {
  const listingId = listingIdForHome(home);
  const details = listingDetails[listingId] || {};

  return {
    ...home,
    listingId,
    mls: home.mls || details.mls || '',
    realtor: home.realtor || details.realtor || '',
    brokerage: home.brokerage || details.brokerage || '',
    phone: home.phone || details.phone || '',
    status: normalizeStatus(home.status),
    endTime: home.endTime || '',
    feedbackScore: String(home.feedbackScore || ''),
    liked: String(home.liked || ''),
    disliked: String(home.disliked || ''),
    offerInterest: String(home.offerInterest || ''),
    sellingAgentQuestion: String(home.sellingAgentQuestion || ''),
  };
}

function normalizePlan(plan) {
  return {
    ...plan,
    homes: Array.isArray(plan.homes) ? plan.homes.map(normalizeHome) : [],
  };
}

function normalizeWorkspace(workspace) {
  if (!workspace?.plans?.length) return null;

  const plans = workspace.plans.map(normalizePlan);
  const activePlanId = plans.some((plan) => plan.id === workspace.activePlanId)
    ? workspace.activePlanId
    : plans[0].id;
  const updatedAt = typeof workspace.updatedAt === 'string' ? workspace.updatedAt : '';

  return { activePlanId, plans, updatedAt };
}

function workspaceHasMeaningfulData(workspace) {
  if (!workspace?.plans?.length) return false;

  const seedPlanNames = new Map([
    ['showing-schedule-2026-05-05-moncton', 'Showing schedule - Moncton cluster'],
    ['showing-schedule-2026-05-06-riverview-dieppe', 'Showing schedule - Riverview + Dieppe'],
  ]);

  return workspace.plans.some((plan) => {
    if (!seedPlanNames.has(plan.id)) return true;
    if (plan.clientName !== seedPlanNames.get(plan.id)) return true;
    if (plan.startLocation?.trim()) return true;

    return plan.homes.some((home) => {
      const isDefaultPendingHome = home.id === 'showing-109-doiron' && normalizeStatus(home.status) === 'change';
      return Boolean(
        home.instructions?.trim()
        || home.feedbackScore?.trim()
        || home.liked?.trim()
        || home.disliked?.trim()
        || home.offerInterest?.trim()
        || home.sellingAgentQuestion?.trim()
        || (normalizeStatus(home.status) !== 'need' && !isDefaultPendingHome)
      );
    });
  });
}

function workspaceTimestamp(workspace) {
  const timestamp = Date.parse(workspace?.updatedAt || '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function loadWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const normalizedSaved = normalizeWorkspace(saved);

    if (normalizedSaved) {

      if (!localStorage.getItem(SCHEDULE_SEED_KEY)) {
        const seedPlans = createShowingSchedulePlans();
        const existingIds = new Set(normalizedSaved.plans.map((plan) => plan.id));
        const newSeedPlans = seedPlans.filter((plan) => !existingIds.has(plan.id));

        if (newSeedPlans.length) {
          const next = {
            activePlanId: newSeedPlans[0].id,
            plans: [...newSeedPlans, ...normalizedSaved.plans],
            updatedAt: normalizedSaved.updatedAt,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          localStorage.setItem(SCHEDULE_SEED_KEY, 'true');
          return next;
        }

        localStorage.setItem(SCHEDULE_SEED_KEY, 'true');
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSaved));
      return normalizedSaved;
    }
  } catch {
    // Start fresh if the saved browser data is unreadable.
  }

  const seedPlans = createShowingSchedulePlans();
  localStorage.setItem(SCHEDULE_SEED_KEY, 'true');
  return { activePlanId: seedPlans[0].id, plans: seedPlans, updatedAt: '' };
}

function saveWorkspace(plans, activePlanId, updatedAt = '') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ activePlanId, plans, updatedAt }));
}

async function saveRemoteWorkspace(workspace) {
  const response = await fetch(API_ENDPOINT, {
    method: 'PUT',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workspace }),
  });

  if (!response.ok) throw new Error('Private storage save failed.');
  return response.json();
}

function statusLabel(value) {
  return statuses.find((status) => status.value === normalizeStatus(value))?.label || 'Need to request';
}

function formatDate(value) {
  if (!value) return 'Date not set';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return 'Time not set';
  const [hour, minute] = value.split(':').map(Number);
  return new Date(2026, 0, 1, hour, minute).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTimeRange(home) {
  if (home.time && home.endTime) return `${formatTime(home.time)} - ${formatTime(home.endTime)}`;
  if (home.time) return formatTime(home.time);
  return 'Time pending';
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function displayPhone(value) {
  const digits = onlyDigits(value);

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return value || 'No phone';
}

function googleMapUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function appleMapUrl(address) {
  return `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
}

function routeUrl(plan) {
  const stops = plan.homes
    .filter((home) => home.address.trim() && !['denied', 'change'].includes(normalizeStatus(home.status)))
    .map((home) => home.address.trim());

  if (!stops.length) return '';

  const origin = plan.startLocation.trim() || stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = plan.startLocation.trim() ? stops.slice(0, -1) : stops.slice(1, -1);
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'driving',
  });

  if (waypoints.length) {
    params.set('waypoints', waypoints.join('|'));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

async function writeClipboard(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Use the older copy path when clipboard permissions are blocked.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.append(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Clipboard unavailable');
  }
}

function makeBookingText(plan, home) {
  const greeting = home.realtor.trim() ? `Hi ${home.realtor.trim()},` : 'Hi,';
  const dateText = plan.showingDate ? ` on ${formatDate(plan.showingDate)}` : '';
  const timeText = home.time && home.endTime
    ? ` from ${formatTime(home.time)} to ${formatTime(home.endTime)}`
    : home.time
      ? ` around ${formatTime(home.time)}`
      : '';
  const mlsText = home.mls.trim() ? `, MLS ${home.mls.trim()}` : '';

  return `${greeting} this is Raphael Lemire. I would like to request a showing for ${home.address.trim()}${mlsText}${dateText}${timeText}. Please let me know if that works.`;
}

function makeClientUpdate(plan) {
  const name = plan.clientName.trim();
  const opener = name
    ? `Hi ${name}, here is the showing plan for ${formatDate(plan.showingDate)}:`
    : `Here is the showing plan for ${formatDate(plan.showingDate)}:`;
  const lines = plan.homes.map((home, index) => {
    const time = formatTimeRange(home);
    const note = home.notes.trim() ? ` - ${home.notes.trim()}` : '';
    return `${index + 1}. ${time} - ${home.address || 'Address needed'} - ${statusLabel(home.status)}${note}`;
  });

  return [opener, '', ...lines].join('\n');
}

function offerLabel(value) {
  return offerChoices.find((choice) => choice.value === value)?.label || '';
}

function hasHomeFeedback(home) {
  return Boolean(
    home.feedbackScore?.trim()
    || home.liked?.trim()
    || home.disliked?.trim()
    || home.offerInterest?.trim()
    || home.sellingAgentQuestion?.trim()
  );
}

function makeFeedbackText(plan, home) {
  const lines = [
    `Showing feedback - ${home.address || 'Address needed'}`,
    plan.clientName?.trim() ? `Buyer: ${plan.clientName.trim()}` : '',
    plan.showingDate ? `Date: ${formatDate(plan.showingDate)}` : '',
    home.feedbackScore ? `Score: ${home.feedbackScore}/10` : '',
    home.liked?.trim() ? `Liked: ${home.liked.trim()}` : '',
    home.disliked?.trim() ? `Did not like: ${home.disliked.trim()}` : '',
    home.offerInterest ? `Offer: ${offerLabel(home.offerInterest)}` : '',
    home.sellingAgentQuestion?.trim() ? `Question for selling agent: ${home.sellingAgentQuestion.trim()}` : '',
  ].filter(Boolean);

  return lines.join('\n');
}

function makeFeedbackSummary(plan) {
  const homesWithFeedback = plan.homes.filter(hasHomeFeedback);
  const opener = `Showing feedback summary - ${plan.clientName || 'Buyer'} - ${formatDate(plan.showingDate)}`;
  const lines = homesWithFeedback.map((home, index) => {
    const parts = [
      `${index + 1}. ${home.address || 'Address needed'}`,
      home.feedbackScore ? `Score ${home.feedbackScore}/10` : '',
      home.offerInterest ? `Offer ${offerLabel(home.offerInterest)}` : '',
      home.sellingAgentQuestion?.trim() ? `Question: ${home.sellingAgentQuestion.trim()}` : '',
    ].filter(Boolean);

    return parts.join(' - ');
  });

  return [opener, '', ...(lines.length ? lines : ['No feedback entered yet.'])].join('\n');
}

function parseListingLine(line) {
  const separator = line.includes('|') ? '|' : '\t';
  const parts = line.split(separator).map((part) => part.trim());
  const hasTimeRange = /^\d{1,2}:\d{2}$/.test(parts[1] || '');

  if (hasTimeRange) {
    return createHome({
      address: parts[0] || '',
      time: parts[1] || '',
      endTime: /^\d{1,2}:\d{2}$/.test(parts[2] || '') ? parts[2] : '',
      mls: parts[3] || '',
      realtor: parts[4] || '',
      brokerage: parts[5] || '',
      phone: parts[6] || parts[5] || '',
    });
  }

  return createHome({
    address: parts[0] || '',
    mls: parts[1] || '',
    realtor: parts[2] || '',
    brokerage: parts[3] || '',
    phone: parts[4] || '',
  });
}

function pdfText(value) {
  return String(value)
    .replace(/[^\x20-\x7E]/g, '?')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)');
}

function wrapText(value, maxChars) {
  const words = String(value || '').split(/\s+/).filter(Boolean);
  const lines = [];

  words.forEach((word) => {
    const current = lines[lines.length - 1] || '';
    const next = current ? `${current} ${word}` : word;

    if (!current) {
      lines.push(word);
      return;
    }

    if (next.length <= maxChars) {
      lines[lines.length - 1] = next;
      return;
    }

    lines.push(word);
  });

  return lines.length ? lines : [''];
}

async function loadShowingLogo() {
  try {
    const response = await fetch(REPORT_LOGO_URL, { cache: 'force-cache' });
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function buildShowingPdf(plan, internal = false, logoBytes = null) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 42;
  const usableWidth = pageWidth - margin * 2;
  const pages = [{ ops: [], annots: [] }];
  let y = pageHeight - margin;

  function currentPage() {
    return pages[pages.length - 1];
  }

  function addPage() {
    pages.push({ ops: [], annots: [] });
    y = pageHeight - margin;
    paintPageBackground();
    drawHeader(false);
  }

  function ensureSpace(height) {
    if (y - height < margin) {
      addPage();
    }
  }

  function rgb(hex) {
    const clean = hex.replace('#', '');
    const red = parseInt(clean.slice(0, 2), 16) / 255;
    const green = parseInt(clean.slice(2, 4), 16) / 255;
    const blue = parseInt(clean.slice(4, 6), 16) / 255;
    return `${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)}`;
  }

  function op(value) {
    currentPage().ops.push(value);
  }

  function rect(x, bottom, width, height, fill = '', stroke = '') {
    op('q');
    if (fill) op(`${rgb(fill)} rg`);
    if (stroke) op(`${rgb(stroke)} RG`);
    op(`${x} ${bottom} ${width} ${height} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`);
    op('Q');
  }

  function paintPageBackground() {
    rect(0, 0, pageWidth, pageHeight, '#ffffff');
  }

  function textAt(value, x, yPosition, size = 10, font = 'F1', color = '#1d2520') {
    op(`${rgb(color)} rg`);
    op(`BT /${font} ${size} Tf ${x} ${yPosition} Td (${pdfText(value)}) Tj ET`);
  }

  function text(value, x, size = 10, font = 'F1', leading = 13, color = '#1d2520') {
    textAt(value, x, y, size, font, color);
    y -= leading;
  }

  function wrapped(value, x, width, size = 10, font = 'F1', leading = 13, color = '#1d2520') {
    const maxChars = Math.max(20, Math.floor(width / (size * 0.52)));
    wrapText(value, maxChars).forEach((line) => text(line, x, size, font, leading, color));
  }

  function linkText(label, url, x, size = 10, font = 'F2', leading = 13) {
    const width = Math.max(48, label.length * size * 0.55);
    textAt(label, x, y, size, font, '#245f89');
    currentPage().annots.push({
      rect: [x, y - 4, x + width, y + size + 2],
      url,
    });
    y -= leading;
  }

  function drawExitLogo(x, top, width, compact = false) {
    if (logoBytes) {
      const height = width * (REPORT_LOGO_HEIGHT / REPORT_LOGO_WIDTH);
      op('q');
      op(`${width} 0 0 ${height} ${x} ${top - height} cm /Logo Do`);
      op('Q');
      return height;
    }

    const logoSize = compact ? 20 : 28;
    textAt('EXIT', x, top - logoSize, logoSize, 'F2', '#078c95');
    if (!compact) {
      textAt('REALTY', x + 6, top - logoSize - 23, 6.5, 'F2', '#1d2520');
    }

    return compact ? 40 : 58;
  }

  function drawHeader(firstPage = true) {
    const logoWidth = firstPage ? 128 : 82;
    const headerTop = y;
    const logoHeight = drawExitLogo(margin, headerTop, logoWidth, !firstPage);
    const headerBottom = y - Math.max(logoHeight, firstPage ? 72 : 58) - 10;
    textAt('Raphael Lemire', margin + logoWidth + 18, y - 15, firstPage ? 18 : 13, 'F2', '#1d2520');
    textAt('EXIT Realty Associates', margin + logoWidth + 18, y - (firstPage ? 32 : 29), 9.5, 'F1', '#66717b');
    textAt(`${AGENT_PHONE_DISPLAY} | ${AGENT_EMAIL}`, margin + logoWidth + 18, y - (firstPage ? 46 : 42), 8.5, 'F1', '#66717b');
    textAt(internal ? 'Internal Showing Plan' : 'Showing Itinerary', margin + logoWidth + 18, y - (firstPage ? 61 : 54), firstPage ? 10 : 8.5, 'F2', '#0f766e');
    y = headerBottom - 22;
  }

  function drawClientStop(home, index) {
    const addressLines = wrapText(home.address || 'Address needed', 46);
    const cardHeight = 74 + Math.max(0, addressLines.length - 1) * 13;
    ensureSpace(cardHeight + 10);
    const top = y;
    const bottom = top - cardHeight;
    rect(margin, bottom, usableWidth, cardHeight, '#fbfcfa', '#d8e0d6');
    rect(margin, bottom, 5, cardHeight, '#0f766e');
    textAt(String(index + 1).padStart(2, '0'), margin + 16, top - 24, 15, 'F2', '#0f766e');
    textAt(formatTimeRange(home), margin + 58, top - 22, 12, 'F2', '#1d2520');
    addressLines.forEach((lineValue, lineIndex) => {
      textAt(lineValue, margin + 58, top - 41 - lineIndex * 13, 12.5, 'F2', '#1d2520');
    });

    const linkY = top - 63 - Math.max(0, addressLines.length - 1) * 13;
    y = linkY;
    linkText('Google Map', googleMapUrl(home.address), margin + 58, 9.5, 'F2', 0);
    y = linkY;
    linkText('Apple Maps', appleMapUrl(home.address), margin + 140, 9.5, 'F2', 0);
    y = bottom - 12;
  }

  paintPageBackground();
  drawHeader(true);

  const title = internal ? 'Internal Showing Plan' : 'Showing Itinerary';
  const subtitle = plan.clientName?.trim()
    ? `${plan.clientName.trim()} - ${formatDate(plan.showingDate)}`
    : formatDate(plan.showingDate);
  text(title, margin, 24, 'F2', 29, '#1d2520');
  text(subtitle, margin, 11, 'F2', 18, '#66717b');

  const activeRouteUrl = routeUrl(plan);

  if (!internal) {
    if (activeRouteUrl) {
      linkText('Open full Google route', activeRouteUrl, margin, 10.5, 'F2', 18);
    }

    text('Tap a map link under each stop for quick navigation.', margin, 9.5, 'F1', 20, '#66717b');

    plan.homes.forEach((home, index) => {
      drawClientStop(home, index);
    });
  } else {
    if (plan.startLocation.trim()) {
      wrapped(`Start: ${plan.startLocation.trim()}`, margin, usableWidth, 10, 'F1', 13);
    }

    if (plan.generalNotes.trim()) {
      wrapped(`Plan notes: ${plan.generalNotes.trim()}`, margin, usableWidth, 10, 'F1', 18);
    } else {
      y -= 6;
    }

    if (activeRouteUrl) {
      linkText('Open full Google route', activeRouteUrl, margin, 10.5, 'F2', 18);
    }

    plan.homes.forEach((home, index) => {
      ensureSpace(136);
      text(`${index + 1}. ${formatTimeRange(home)} - ${home.address || 'Address needed'}`, margin, 12, 'F2', 15);
      wrapped(`${statusLabel(home.status)}${home.mls ? ` | MLS ${home.mls}` : ''}`, margin + 14, usableWidth - 14, 9.5, 'F1', 12);

      if (home.notes.trim()) {
        wrapped(`Notes: ${home.notes.trim()}`, margin + 14, usableWidth - 14, 9.5, 'F1', 12);
      }

      const contact = [
        home.realtor ? `Realtor: ${home.realtor}` : '',
        home.phone ? `Phone: ${displayPhone(home.phone)}` : '',
      ].filter(Boolean).join(' | ');

      if (contact) {
        wrapped(contact, margin + 14, usableWidth - 14, 9.5, 'F1', 12);
      }

      if (home.address.trim()) {
        const mapLinkY = y;
        linkText('Google Map', googleMapUrl(home.address), margin + 14, 9.5, 'F2', 0);
        y = mapLinkY;
        linkText('Apple Maps', appleMapUrl(home.address), margin + 92, 9.5, 'F2', 0);
        y = mapLinkY - 13;
      }

      if (home.instructions.trim()) {
        wrapped(`Instructions: ${home.instructions.trim()}`, margin + 14, usableWidth - 14, 9.5, 'F1', 12);
      }

      if (hasHomeFeedback(home)) {
        const feedbackLines = [
          home.feedbackScore ? `Score: ${home.feedbackScore}/10` : '',
          home.liked?.trim() ? `Liked: ${home.liked.trim()}` : '',
          home.disliked?.trim() ? `Did not like: ${home.disliked.trim()}` : '',
          home.offerInterest ? `Offer: ${offerLabel(home.offerInterest)}` : '',
          home.sellingAgentQuestion?.trim() ? `Selling agent question: ${home.sellingAgentQuestion.trim()}` : '',
        ].filter(Boolean);

        feedbackLines.forEach((line) => {
          wrapped(line, margin + 14, usableWidth - 14, 9.5, 'F1', 12);
        });
      }

      y -= 7;
    });
  }

  pages.forEach((page, index) => {
    const footerY = 28;
    page.ops.push(`${rgb('#66717b')} rg`);
    page.ops.push(`BT /F1 8.5 Tf ${margin} ${footerY} Td (${pdfText(`Raphael Lemire | ${AGENT_PHONE_DISPLAY} | ${AGENT_EMAIL}`)}) Tj ET`);
    page.ops.push(`BT /F1 8.5 Tf ${pageWidth - margin - 118} ${footerY} Td (${pdfText(`Page ${index + 1}`)}) Tj ET`);
  });

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  let logoObjectNumber = null;

  if (logoBytes) {
    logoObjectNumber = objects.length + 1;
    objects.push({
      dictionary: `<< /Type /XObject /Subtype /Image /Width ${REPORT_LOGO_WIDTH} /Height ${REPORT_LOGO_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBytes.length} >>`,
      bytes: logoBytes,
    });
  }

  const pageRefs = [];
  const encoder = new TextEncoder();

  pages.forEach((page) => {
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = objects.length + 2;
    const annotObjectNumbers = page.annots.map((_, index) => objects.length + 3 + index);
    const annotRefs = annotObjectNumbers.length ? ` /Annots [${annotObjectNumbers.map((number) => `${number} 0 R`).join(' ')}]` : '';
    const xObjectResources = logoObjectNumber ? ` /XObject << /Logo ${logoObjectNumber} 0 R >>` : '';
    pageRefs.push(`${pageObjectNumber} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${xObjectResources} >> /Contents ${contentObjectNumber} 0 R${annotRefs} >>`);
    const stream = encoder.encode(page.ops.join('\n'));
    objects.push({
      dictionary: `<< /Length ${stream.length} >>`,
      bytes: stream,
    });
    page.annots.forEach((annot) => {
      objects.push(`<< /Type /Annot /Subtype /Link /Rect [${annot.rect.map((value) => Number(value).toFixed(2)).join(' ')}] /Border [0 0 0] /A << /S /URI /URI (${pdfText(annot.url)}) >> >>`);
    });
  });

  objects[1] = `<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageRefs.length} >>`;

  const chunks = [];
  let byteLength = 0;
  const offsets = [0];

  function appendBytes(bytes) {
    chunks.push(bytes);
    byteLength += bytes.length;
  }

  function appendAscii(value) {
    appendBytes(encoder.encode(value));
  }

  appendAscii('%PDF-1.4\n');

  objects.forEach((object, index) => {
    offsets.push(byteLength);
    appendAscii(`${index + 1} 0 obj\n`);

    if (typeof object === 'string') {
      appendAscii(`${object}\n`);
    } else {
      appendAscii(`${object.dictionary}\nstream\n`);
      appendBytes(object.bytes);
      appendAscii('\nendstream\n');
    }

    appendAscii('endobj\n');
  });

  const xrefOffset = byteLength;
  appendAscii(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach((offset) => {
    appendAscii(`${String(offset).padStart(10, '0')} 00000 n \n`);
  });
  appendAscii(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const pdf = new Uint8Array(byteLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    pdf.set(chunk, offset);
    offset += chunk.length;
  });

  return pdf;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function MassShowingBooker() {
  const saved = useMemo(() => loadWorkspace(), []);
  const [plans, setPlans] = useState(saved.plans);
  const [activePlanId, setActivePlanId] = useState(saved.activePlanId);
  const [quickListings, setQuickListings] = useState('');
  const [toast, setToast] = useState('');
  const [syncState, setSyncState] = useState('loading');
  const [syncMessage, setSyncMessage] = useState('Loading private storage...');
  const [hasRemoteStorage, setHasRemoteStorage] = useState(false);

  const activePlan = plans.find((plan) => plan.id === activePlanId) || plans[0];
  const activeRouteUrl = routeUrl(activePlan);
  const counts = statuses.reduce((summary, status) => {
    summary[status.value] = activePlan.homes.filter((home) => home.status === status.value).length;
    return summary;
  }, {});

  useEffect(() => {
    let cancelled = false;

    async function loadRemoteWorkspace() {
      try {
        const response = await fetch(API_ENDPOINT, { cache: 'no-store' });
        if (!response.ok) throw new Error(response.status === 503 ? 'Storage is not connected yet.' : 'Private storage could not be loaded.');
        const data = await response.json();
        if (cancelled) return;

        const remoteWorkspace = normalizeWorkspace(data.workspace);
        const localWorkspace = normalizeWorkspace(loadWorkspace()) || saved;
        const localHasData = workspaceHasMeaningfulData(localWorkspace);
        const remoteHasData = workspaceHasMeaningfulData(remoteWorkspace);
        const localIsNewer = workspaceTimestamp(localWorkspace) > workspaceTimestamp(remoteWorkspace);
        const nextWorkspace = remoteWorkspace && (remoteHasData || !localHasData) && !(localHasData && localIsNewer)
          ? remoteWorkspace
          : localWorkspace;

        setPlans(nextWorkspace.plans);
        setActivePlanId(nextWorkspace.activePlanId);
        saveWorkspace(nextWorkspace.plans, nextWorkspace.activePlanId, nextWorkspace.updatedAt);
        setHasRemoteStorage(true);
        setSyncState('synced');
        setSyncMessage('Saved to private storage');

        if (localHasData && (!remoteHasData || localIsNewer)) {
          await saveRemoteWorkspace(nextWorkspace);
        }
      } catch (error) {
        if (cancelled) return;
        setHasRemoteStorage(false);
        setSyncState('local');
        setSyncMessage(`${error.message} Using this browser until storage is connected.`);
      }
    }

    loadRemoteWorkspace();

    return () => {
      cancelled = true;
    };
  }, [saved]);

  function persist(nextPlans, nextActivePlanId = activePlanId) {
    const workspace = normalizeWorkspace({ activePlanId: nextActivePlanId, plans: nextPlans })
      || { activePlanId: nextActivePlanId, plans: nextPlans };
    workspace.updatedAt = new Date().toISOString();

    setPlans(workspace.plans);
    setActivePlanId(workspace.activePlanId);
    saveWorkspace(workspace.plans, workspace.activePlanId, workspace.updatedAt);

    if (!hasRemoteStorage) return;

    setSyncState('saving');
    setSyncMessage('Saving to private storage...');

    saveRemoteWorkspace(workspace)
      .then(() => {
        setSyncState('synced');
        setSyncMessage('Saved to private storage');
      })
      .catch((error) => {
        setSyncState('local');
        setSyncMessage(`${error.message} Your latest changes are saved in this browser.`);
      });
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => setToast(''), 2400);
  }

  function updatePlan(updates) {
    const nextPlans = plans.map((plan) => (
      plan.id === activePlan.id ? { ...plan, ...updates } : plan
    ));
    persist(nextPlans, activePlan.id);
  }

  function addPlan() {
    const plan = createPlan({ clientName: `Buyer ${plans.length + 1}` });
    persist([...plans, plan], plan.id);
    showToast('New showing plan created.');
  }

  function duplicatePlan() {
    const plan = {
      ...activePlan,
      id: createId(),
      clientName: `${activePlan.clientName || 'Buyer'} copy`,
      homes: activePlan.homes.map((home) => ({ ...home, id: createId() })),
    };

    persist([...plans, plan], plan.id);
    showToast('Showing plan duplicated.');
  }

  function deletePlan() {
    if (!window.confirm('Delete this showing plan?')) return;
    const nextPlans = plans.filter((plan) => plan.id !== activePlan.id);
    const fallbackPlan = nextPlans[0] || createPlan();
    persist(nextPlans.length ? nextPlans : [fallbackPlan], fallbackPlan.id);
    showToast('Showing plan deleted.');
  }

  function addHome(overrides = {}) {
    updatePlan({ homes: [...activePlan.homes, createHome(overrides)] });
    showToast('Home added.');
  }

  function updateHome(id, updates) {
    updatePlan({
      homes: activePlan.homes.map((home) => (
        home.id === id ? normalizeHome({ ...home, ...updates }) : home
      )),
    });
  }

  function removeHome(id) {
    updatePlan({ homes: activePlan.homes.filter((home) => home.id !== id) });
  }

  function moveHome(id, direction) {
    const index = activePlan.homes.findIndex((home) => home.id === id);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= activePlan.homes.length) return;

    const nextHomes = [...activePlan.homes];
    const [home] = nextHomes.splice(index, 1);
    nextHomes.splice(nextIndex, 0, home);
    updatePlan({ homes: nextHomes });
  }

  function sortByTime() {
    const nextHomes = [...activePlan.homes].sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
    updatePlan({ homes: nextHomes });
    showToast('Sorted by showing time.');
  }

  function importListings() {
    const homes = quickListings
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseListingLine);

    if (!homes.length) {
      showToast('Paste at least one listing first.');
      return;
    }

    updatePlan({ homes: [...activePlan.homes, ...homes] });
    setQuickListings('');
    showToast(`${homes.length} listing${homes.length === 1 ? '' : 's'} added.`);
  }

  async function copyValue(value, successMessage) {
    try {
      await writeClipboard(value);
      showToast(successMessage);
    } catch {
      showToast('Could not copy.');
    }
  }

  async function downloadPlanPdf(internal = false) {
    const logoBytes = await loadShowingLogo();
    const pdf = buildShowingPdf(activePlan, internal, logoBytes);
    const date = activePlan.showingDate || todayValue();
    const name = (activePlan.clientName || 'showing').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = internal
      ? `${name || 'showing'}-internal-showing-plan-${date}.pdf`
      : `${name || 'showing'}-showing-itinerary-${date}.pdf`;

    downloadBlob(new Blob([pdf], { type: 'application/pdf' }), filename);
    showToast(`${internal ? 'Internal' : 'Itinerary'} PDF downloaded.`);
  }

  return (
    <main className="showing-booker-page">
      <header className="showing-topbar">
        <div>
          <p className="showing-eyebrow">Private booking workspace</p>
          <h1>Showing Booking Tracker</h1>
          <p className="showing-intro">Use this after the client confirms the schedule. Keep the MLS, address, realtor, phone, time, and showing instructions in one place, then track seller-side replies fast.</p>
        </div>
        <div className="showing-top-actions">
          <a className="showing-secondary" href={DASHBOARD_URL}>Go back to dashboard</a>
          <button className="showing-secondary" type="button" onClick={duplicatePlan}>Duplicate</button>
          <button className="showing-danger" type="button" onClick={deletePlan}>Delete plan</button>
          <button className="showing-primary" type="button" onClick={addPlan}>New plan</button>
        </div>
      </header>

      <div className={`showing-sync-banner ${syncState}`} role="status" aria-live="polite">
        <strong>Save status</strong>
        <span>{syncMessage}</span>
      </div>

      <section className="showing-plan-strip" aria-label="Showing plan selector">
        <label>
          Plan
          <select value={activePlan.id} onChange={(event) => persist(plans, event.target.value)}>
            {plans.map((plan) => (
              <option value={plan.id} key={plan.id}>{plan.clientName || 'Unnamed buyer'} - {formatDate(plan.showingDate)}</option>
            ))}
          </select>
        </label>
        <label>
          Buyer name
          <input value={activePlan.clientName} onChange={(event) => updatePlan({ clientName: event.target.value })} />
        </label>
        <label>
          Showing date
          <input type="date" value={activePlan.showingDate} onChange={(event) => updatePlan({ showingDate: event.target.value })} />
        </label>
        <label>
          Start location
          <input value={activePlan.startLocation} onChange={(event) => updatePlan({ startLocation: event.target.value })} placeholder="Office, hotel, first address..." />
        </label>
      </section>

      <section className="showing-summary" aria-label="Showing status summary">
        {statuses.map((status) => (
          <article key={status.value} data-status={status.value}>
            <span>{counts[status.value] || 0}</span>
            <p>{status.label}</p>
          </article>
        ))}
      </section>

      <section className="showing-workspace">
        <aside className="showing-sidebar">
          <label>
            Plan notes
            <textarea
              rows="4"
              value={activePlan.generalNotes}
              onChange={(event) => updatePlan({ generalNotes: event.target.value })}
              placeholder="Ex: buyer only has 1-4 PM, wants newer homes, no basements..."
            />
          </label>

          <div className="showing-sidebar-actions">
            <button type="button" className="showing-primary" onClick={() => addHome()}>Add home</button>
            <button type="button" className="showing-secondary" onClick={sortByTime}>Sort by time</button>
            <a
              className={`showing-secondary ${activeRouteUrl ? '' : 'is-disabled'}`}
              href={activeRouteUrl || '#'}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                if (!activeRouteUrl) event.preventDefault();
              }}
            >
              Open Google route
            </a>
          </div>

          <label>
            Quick add listings
            <textarea
              rows="7"
              value={quickListings}
              onChange={(event) => setQuickListings(event.target.value)}
              placeholder="One per line. Format: Address | Start | End | MLS | Realtor | Phone"
            />
          </label>
          <button type="button" className="showing-secondary" onClick={importListings}>Import listings</button>

          <div className="showing-export-actions">
            <button type="button" className="showing-report" onClick={() => downloadPlanPdf(false)}>Download itinerary PDF</button>
            <button type="button" className="showing-report secondary-report" onClick={() => downloadPlanPdf(true)}>Internal PDF</button>
            <button type="button" className="showing-secondary" onClick={() => copyValue(makeClientUpdate(activePlan), 'Itinerary update copied.')}>Copy itinerary update</button>
            <button type="button" className="showing-secondary" onClick={() => copyValue(makeFeedbackSummary(activePlan), 'Feedback summary copied.')}>Copy feedback summary</button>
          </div>
        </aside>

        <section className="showing-list" aria-label="Homes in showing plan">
          {activePlan.homes.length === 0 && (
            <div className="showing-empty">
              <h2>No homes yet</h2>
              <p>Add homes manually or paste a list into quick add. This plan stays saved in this browser.</p>
            </div>
          )}

          {activePlan.homes.map((home, index) => (
            <article className="showing-card" data-status={home.status} key={home.id}>
              <div className="showing-card-header">
                <div>
                  <span>Stop {index + 1}</span>
                  <h2>{home.address || 'Address needed'}</h2>
                </div>
                <div className="showing-order-actions">
                  <button type="button" onClick={() => moveHome(home.id, -1)} disabled={index === 0}>Up</button>
                  <button type="button" onClick={() => moveHome(home.id, 1)} disabled={index === activePlan.homes.length - 1}>Down</button>
                </div>
              </div>

              <div className="showing-card-grid">
                <label className="wide">
                  Address
                  <input value={home.address} onChange={(event) => updateHome(home.id, { address: event.target.value })} placeholder="123 Main St, Moncton" />
                </label>
                <label>
                  MLS
                  <input value={home.mls} onChange={(event) => updateHome(home.id, { mls: event.target.value })} placeholder="NB123456" />
                </label>
                <label>
                  Showing time
                  <input type="time" value={home.time} onChange={(event) => updateHome(home.id, { time: event.target.value })} />
                </label>
                <label>
                  End time
                  <input type="time" value={home.endTime} onChange={(event) => updateHome(home.id, { endTime: event.target.value })} />
                </label>
                <label>
                  Realtor
                  <input value={home.realtor} onChange={(event) => updateHome(home.id, { realtor: event.target.value })} />
                </label>
                <label>
                  Phone
                  <input value={home.phone} onChange={(event) => updateHome(home.id, { phone: event.target.value })} placeholder="506..." />
                </label>
                <label className="wide">
                  Showing instructions
                  <textarea value={home.instructions} onChange={(event) => updateHome(home.id, { instructions: event.target.value })} placeholder="Door code, lockbox, lights, parking, seller instructions..." />
                </label>
              </div>

              <div className="showing-status-actions" aria-label={`Booking status for ${home.address || `stop ${index + 1}`}`}>
                {quickStatuses.map((status) => (
                  <button
                    className={normalizeStatus(home.status) === status.value ? 'active' : ''}
                    data-status={status.value}
                    key={status.value}
                    type="button"
                    onClick={() => updateHome(home.id, { status: status.value })}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              <section className="showing-feedback-panel" aria-label={`Client feedback for ${home.address || `stop ${index + 1}`}`}>
                <div className="showing-feedback-header">
                  <div>
                    <span>Client feedback</span>
                    <h3>After the showing</h3>
                  </div>
                  <button
                    type="button"
                    className="showing-secondary"
                    onClick={() => copyValue(makeFeedbackText(activePlan, home), 'Feedback copied.')}
                    disabled={!hasHomeFeedback(home)}
                  >
                    Copy feedback
                  </button>
                </div>

                <div className="showing-feedback-grid">
                  <label>
                    Score
                    <select value={home.feedbackScore} onChange={(event) => updateHome(home.id, { feedbackScore: event.target.value })}>
                      <option value="">Choose 1-10</option>
                      {Array.from({ length: 10 }, (_, scoreIndex) => String(scoreIndex + 1)).map((score) => (
                        <option value={score} key={score}>{score}/10</option>
                      ))}
                    </select>
                  </label>
                  <div className="showing-offer-field">
                    <span>Offer</span>
                    <div className="showing-offer-options" role="group" aria-label={`Offer interest for ${home.address || `stop ${index + 1}`}`}>
                      {offerChoices.map((choice) => (
                        <button
                          type="button"
                          key={choice.value}
                          className={home.offerInterest === choice.value ? 'active' : ''}
                          onClick={() => updateHome(home.id, { offerInterest: home.offerInterest === choice.value ? '' : choice.value })}
                        >
                          {choice.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label>
                    What did they like?
                    <textarea value={home.liked} onChange={(event) => updateHome(home.id, { liked: event.target.value })} placeholder="Layout, location, price, finishes..." />
                  </label>
                  <label>
                    What did they hate?
                    <textarea value={home.disliked} onChange={(event) => updateHome(home.id, { disliked: event.target.value })} placeholder="Repairs, smell, layout, traffic..." />
                  </label>
                  <label className="wide">
                    Question for the selling agent
                    <textarea value={home.sellingAgentQuestion} onChange={(event) => updateHome(home.id, { sellingAgentQuestion: event.target.value })} placeholder="What should I ask the listing agent before the next step?" />
                  </label>
                </div>
              </section>

              <div className="showing-card-actions">
                <button type="button" onClick={() => copyValue(makeBookingText(activePlan, home), 'Booking text copied.')}>Copy booking text</button>
                <button type="button" onClick={() => copyValue(displayPhone(home.phone), 'Phone number copied.')} disabled={!home.phone.trim()}>Copy phone</button>
                <a
                  href={home.address.trim() ? googleMapUrl(home.address) : '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={home.address.trim() ? '' : 'is-disabled'}
                  onClick={(event) => {
                    if (!home.address.trim()) event.preventDefault();
                  }}
                >
                  Google Map
                </a>
                <a
                  href={home.address.trim() ? appleMapUrl(home.address) : '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={home.address.trim() ? '' : 'is-disabled'}
                  onClick={(event) => {
                    if (!home.address.trim()) event.preventDefault();
                  }}
                >
                  Apple Map
                </a>
                <button type="button" className="showing-danger-text" onClick={() => removeHome(home.id)}>Remove</button>
              </div>
            </article>
          ))}
        </section>
      </section>

      {toast && <div className="showing-toast">{toast}</div>}
    </main>
  );
}

export default MassShowingBooker;
