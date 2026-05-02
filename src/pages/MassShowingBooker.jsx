import { useMemo, useState } from 'react';
import './MassShowingBooker.css';

const STORAGE_KEY = 'mass-showing-booker-v1';

const statuses = [
  { value: 'need', label: 'Need to book' },
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'skipped', label: 'Skipped' },
];

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
  return {
    id: createId(),
    address: '',
    mls: '',
    realtor: '',
    brokerage: '',
    phone: '',
    status: 'need',
    time: '',
    notes: '',
    instructions: '',
    ...overrides,
  };
}

function createPlan(overrides = {}) {
  return {
    id: createId(),
    clientName: 'New client',
    showingDate: todayValue(),
    startLocation: '',
    generalNotes: '',
    homes: [],
    ...overrides,
  };
}

function loadWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.plans?.length) {
      return saved;
    }
  } catch {
    // Start fresh if the saved browser data is unreadable.
  }

  const plan = createPlan();
  return { activePlanId: plan.id, plans: [plan] };
}

function saveWorkspace(plans, activePlanId) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ activePlanId, plans }));
}

function statusLabel(value) {
  return statuses.find((status) => status.value === value)?.label || 'Need to book';
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
    .filter((home) => home.address.trim() && home.status !== 'unavailable' && home.status !== 'skipped')
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
  const timeText = home.time ? ` around ${formatTime(home.time)}` : '';
  const mlsText = home.mls.trim() ? `, MLS ${home.mls.trim()}` : '';
  const questionText = home.notes.trim() ? ` Also, ${home.notes.trim()}` : '';

  return `${greeting} this is Raphael Lemire. I would like to request a showing for ${home.address.trim()}${mlsText}${dateText}${timeText}. Please let me know if that works.${questionText}`;
}

function makeClientUpdate(plan) {
  const name = plan.clientName.trim();
  const opener = name
    ? `Hi ${name}, here is the showing plan for ${formatDate(plan.showingDate)}:`
    : `Here is the showing plan for ${formatDate(plan.showingDate)}:`;
  const lines = plan.homes.map((home, index) => {
    const time = home.time ? formatTime(home.time) : 'Time pending';
    const note = home.notes.trim() ? ` - ${home.notes.trim()}` : '';
    return `${index + 1}. ${time} - ${home.address || 'Address needed'} - ${statusLabel(home.status)}${note}`;
  });

  return [opener, '', ...lines].join('\n');
}

function parseListingLine(line) {
  const separator = line.includes('|') ? '|' : '\t';
  const parts = line.split(separator).map((part) => part.trim());

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

    if (next.length <= maxChars) {
      lines[lines.length - 1] = next;
      return;
    }

    lines.push(word);
  });

  return lines.length ? lines : [''];
}

function buildShowingPdf(plan, internal = false) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 46;
  const usableWidth = pageWidth - margin * 2;
  const pages = [[]];
  let y = pageHeight - margin;

  function currentPage() {
    return pages[pages.length - 1];
  }

  function addPage() {
    pages.push([]);
    y = pageHeight - margin;
  }

  function ensureSpace(height) {
    if (y - height < margin) {
      addPage();
    }
  }

  function text(value, x, size = 10, font = 'F1', leading = 13) {
    currentPage().push(`BT /${font} ${size} Tf ${x} ${y} Td (${pdfText(value)}) Tj ET`);
    y -= leading;
  }

  function wrapped(value, x, width, size = 10, font = 'F1', leading = 13) {
    const maxChars = Math.max(20, Math.floor(width / (size * 0.52)));
    wrapText(value, maxChars).forEach((line) => text(line, x, size, font, leading));
  }

  const title = internal ? 'Internal Showing Plan' : 'Client Showing Plan';
  text(title, margin, 22, 'F2', 27);
  text(`${plan.clientName || 'Client'} - ${formatDate(plan.showingDate)}`, margin, 11, 'F2', 18);

  if (plan.startLocation.trim()) {
    wrapped(`Start: ${plan.startLocation.trim()}`, margin, usableWidth, 10, 'F1', 13);
  }

  if (plan.generalNotes.trim()) {
    wrapped(`Plan notes: ${plan.generalNotes.trim()}`, margin, usableWidth, 10, 'F1', 18);
  } else {
    y -= 6;
  }

  plan.homes.forEach((home, index) => {
    ensureSpace(internal ? 116 : 82);
    text(`${index + 1}. ${home.time ? formatTime(home.time) : 'Time pending'} - ${home.address || 'Address needed'}`, margin, 12, 'F2', 15);
    wrapped(`${statusLabel(home.status)}${home.mls ? ` | MLS ${home.mls}` : ''}`, margin + 14, usableWidth - 14, 9.5, 'F1', 12);

    if (home.notes.trim()) {
      wrapped(`Notes: ${home.notes.trim()}`, margin + 14, usableWidth - 14, 9.5, 'F1', 12);
    }

    if (internal) {
      const contact = [
        home.realtor ? `Realtor: ${home.realtor}` : '',
        home.brokerage ? `Brokerage: ${home.brokerage}` : '',
        home.phone ? `Phone: ${displayPhone(home.phone)}` : '',
      ].filter(Boolean).join(' | ');

      if (contact) {
        wrapped(contact, margin + 14, usableWidth - 14, 9.5, 'F1', 12);
      }

      if (home.instructions.trim()) {
        wrapped(`Instructions: ${home.instructions.trim()}`, margin + 14, usableWidth - 14, 9.5, 'F1', 12);
      }
    }

    y -= 7;
  });

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  const pageRefs = [];

  pages.forEach((ops) => {
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = objects.length + 2;
    pageRefs.push(`${pageObjectNumber} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    const stream = ops.join('\n');
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageRefs.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

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

  const activePlan = plans.find((plan) => plan.id === activePlanId) || plans[0];
  const activeRouteUrl = routeUrl(activePlan);
  const counts = statuses.reduce((summary, status) => {
    summary[status.value] = activePlan.homes.filter((home) => home.status === status.value).length;
    return summary;
  }, {});

  function persist(nextPlans, nextActivePlanId = activePlanId) {
    setPlans(nextPlans);
    setActivePlanId(nextActivePlanId);
    saveWorkspace(nextPlans, nextActivePlanId);
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
    const plan = createPlan({ clientName: `Client ${plans.length + 1}` });
    persist([...plans, plan], plan.id);
    showToast('New showing plan created.');
  }

  function duplicatePlan() {
    const plan = {
      ...activePlan,
      id: createId(),
      clientName: `${activePlan.clientName || 'Client'} copy`,
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
        home.id === id ? { ...home, ...updates } : home
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

  function downloadPlanPdf(internal = false) {
    const pdf = buildShowingPdf(activePlan, internal);
    const date = activePlan.showingDate || todayValue();
    const name = (activePlan.clientName || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = `${name || 'client'}-${internal ? 'internal' : 'client'}-showing-plan-${date}.pdf`;

    downloadBlob(new Blob([pdf], { type: 'application/pdf' }), filename);
    showToast(`${internal ? 'Internal' : 'Client'} PDF downloaded.`);
  }

  return (
    <main className="showing-booker-page">
      <header className="showing-topbar">
        <div>
          <p className="showing-eyebrow">Private showing workspace</p>
          <h1>Mass Showing Booker</h1>
          <p className="showing-intro">Build one plan per client, track booking status, add showing times, and export a clean client summary.</p>
        </div>
        <div className="showing-top-actions">
          <a className="showing-secondary" href="/tools">Tools Home</a>
          <button className="showing-secondary" type="button" onClick={duplicatePlan}>Duplicate</button>
          <button className="showing-danger" type="button" onClick={deletePlan}>Delete plan</button>
          <button className="showing-primary" type="button" onClick={addPlan}>New plan</button>
        </div>
      </header>

      <section className="showing-plan-strip" aria-label="Showing plan selector">
        <label>
          Plan
          <select value={activePlan.id} onChange={(event) => persist(plans, event.target.value)}>
            {plans.map((plan) => (
              <option value={plan.id} key={plan.id}>{plan.clientName || 'Unnamed client'} - {formatDate(plan.showingDate)}</option>
            ))}
          </select>
        </label>
        <label>
          Client name
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
              placeholder="Ex: client only has 1-4 PM, wants newer homes, no basements..."
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
              placeholder="One per line. Optional format: Address | MLS | Realtor | Brokerage | Phone"
            />
          </label>
          <button type="button" className="showing-secondary" onClick={importListings}>Import listings</button>

          <div className="showing-export-actions">
            <button type="button" className="showing-report" onClick={() => downloadPlanPdf(false)}>Client PDF</button>
            <button type="button" className="showing-report secondary-report" onClick={() => downloadPlanPdf(true)}>Internal PDF</button>
            <button type="button" className="showing-secondary" onClick={() => copyValue(makeClientUpdate(activePlan), 'Client update copied.')}>Copy client update</button>
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
                  Status
                  <select value={home.status} onChange={(event) => updateHome(home.id, { status: event.target.value })}>
                    {statuses.map((status) => (
                      <option value={status.value} key={status.value}>{status.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Showing time
                  <input type="time" value={home.time} onChange={(event) => updateHome(home.id, { time: event.target.value })} />
                </label>
                <label>
                  Realtor
                  <input value={home.realtor} onChange={(event) => updateHome(home.id, { realtor: event.target.value })} />
                </label>
                <label>
                  Brokerage
                  <input value={home.brokerage} onChange={(event) => updateHome(home.id, { brokerage: event.target.value })} />
                </label>
                <label>
                  Phone
                  <input value={home.phone} onChange={(event) => updateHome(home.id, { phone: event.target.value })} placeholder="506..." />
                </label>
                <label className="wide">
                  Questions / notes
                  <textarea value={home.notes} onChange={(event) => updateHome(home.id, { notes: event.target.value })} placeholder="Anything to ask or tell the client about this home." />
                </label>
                <label className="wide">
                  Showing instructions
                  <textarea value={home.instructions} onChange={(event) => updateHome(home.id, { instructions: event.target.value })} placeholder="Door code, lockbox, lights, parking, seller instructions..." />
                </label>
              </div>

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
