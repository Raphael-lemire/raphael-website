import { useEffect, useMemo, useState } from 'react';
import './ListingTracker.css';

const STORAGE_KEY = 'listing-tracker-v1';
const CLOSED_STATUSES = new Set(['Sold', 'Expired', 'Cancelled']);

const emptyForm = {
  id: '',
  address: '',
  seller: '',
  price: '',
  contractStart: '',
  contractEnd: '',
  status: 'For Sale',
  listingLink: '',
  notes: '',
};

function todayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatInputDate(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const date = typeof value === 'string' ? parseLocalDate(value) : value;
  if (!date) return 'Not set';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date, months) {
  const next = new Date(date);
  const originalDay = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(originalDay, lastDay));
  return next;
}

function daysBetween(start, end) {
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function money(value) {
  const amount = Number(value);
  if (!amount) return 'Not set';
  return `$${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)}`;
}

function getDefaultEndDate(startValue) {
  const start = parseLocalDate(startValue);
  return start ? formatInputDate(addMonths(start, 6)) : '';
}

function getReminders(listing) {
  const start = parseLocalDate(listing.contractStart);
  const end = parseLocalDate(listing.contractEnd) || (start ? addMonths(start, 6) : null);
  if (!start || !end) return [];

  const monthly = [1, 2, 3, 4, 5].map((month) => ({
    title: `${month} month listing check-in`,
    date: addMonths(start, month),
    description: 'Review the listing. If it is still for sale, make a change or update.',
  }));

  return [
    {
      title: '2 week listing check-in',
      date: addDays(start, 14),
      description: 'If this listing is still for sale, make a change or update.',
    },
    ...monthly,
    {
      title: 'Contract ending soon',
      date: addDays(end, -7),
      description: 'Change or extend the listing contract end date before it expires.',
    },
  ].sort((a, b) => a.date - b.date);
}

function nextAction(listing) {
  const today = todayStart();
  const reminders = getReminders(listing);
  const upcoming = reminders.find((reminder) => reminder.date >= today);
  const overdue = reminders.filter((reminder) => reminder.date < today);
  const end = parseLocalDate(listing.contractEnd);

  if (CLOSED_STATUSES.has(listing.status)) {
    return { type: 'closed', label: `${listing.status} listing` };
  }

  if (end && today > end) {
    return { type: 'overdue', label: `Contract expired ${Math.abs(daysBetween(today, end))} days ago` };
  }

  if (overdue.length > 0) {
    const latest = overdue[overdue.length - 1];
    return { type: 'overdue', label: `${latest.title} was due ${formatDisplayDate(latest.date)}` };
  }

  if (upcoming) {
    return { type: 'upcoming', label: `Next: ${upcoming.title} on ${formatDisplayDate(upcoming.date)}` };
  }

  return { type: 'none', label: 'No reminders scheduled' };
}

function progressFor(listing) {
  const start = parseLocalDate(listing.contractStart);
  const end = parseLocalDate(listing.contractEnd);
  if (!start || !end || end <= start) return 0;

  return clamp(Math.round((daysBetween(start, todayStart()) / daysBetween(start, end)) * 100), 0, 100);
}

function markerPercent(listing, date) {
  const start = parseLocalDate(listing.contractStart);
  const end = parseLocalDate(listing.contractEnd);
  if (!start || !end || end <= start) return 0;

  return clamp((daysBetween(start, date) / daysBetween(start, end)) * 100, 0, 100);
}

function daysRemaining(listing) {
  const end = parseLocalDate(listing.contractEnd);
  if (!end) return 'Not set';
  const days = daysBetween(todayStart(), end);
  if (days > 0) return `${days} days`;
  if (days === 0) return 'Ends today';
  return `${Math.abs(days)} days past`;
}

function normalizeUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function toIcsDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
}

function icsEscape(value) {
  return String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\n', '\\n');
}

function exportCalendar(listing) {
  const reminders = getReminders(listing);
  const nowStamp = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
  const events = reminders.map((reminder, index) => {
    const start = toIcsDate(reminder.date);
    const end = toIcsDate(addDays(reminder.date, 1));

    return [
      'BEGIN:VEVENT',
      `UID:${listing.id}-${index}@listing-tracker`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${icsEscape(`${listing.address}: ${reminder.title}`)}`,
      `DESCRIPTION:${icsEscape(`${reminder.description}\nStatus: ${listing.status}\nContract ends: ${formatDisplayDate(listing.contractEnd)}`)}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT9H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsEscape(reminder.title)}`,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });

  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Listing Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([calendar], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${listing.address.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'listing'}-reminders.ics`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function makeInitialForm() {
  const start = formatInputDate(todayStart());

  return {
    ...emptyForm,
    contractStart: start,
    contractEnd: getDefaultEndDate(start),
  };
}

function ListingTracker() {
  const [listings, setListings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState(makeInitialForm);
  const [filter, setFilter] = useState('all');
  const [lastStartDefault, setLastStartDefault] = useState(form.contractEnd);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  }, [listings]);

  const activeListings = listings.filter((listing) => !CLOSED_STATUSES.has(listing.status));
  const attentionListings = activeListings.filter((listing) => nextAction(listing).type === 'overdue');
  const closingSoonListings = activeListings.filter((listing) => {
    const end = parseLocalDate(listing.contractEnd);
    if (!end) return false;
    const days = daysBetween(todayStart(), end);
    return days >= 0 && days <= 30;
  });

  const visibleListings = useMemo(() => listings
    .slice()
    .sort((a, b) => parseLocalDate(a.contractEnd) - parseLocalDate(b.contractEnd))
    .filter((listing) => {
      const isClosed = CLOSED_STATUSES.has(listing.status);
      if (filter === 'active') return !isClosed;
      if (filter === 'closed') return isClosed;
      if (filter === 'attention') return nextAction(listing).type === 'overdue';
      return true;
    }), [filter, listings]);

  function updateField(field, value) {
    if (field === 'contractStart') {
      const nextEnd = getDefaultEndDate(value);
      setForm((current) => ({
        ...current,
        contractStart: value,
        contractEnd: !current.contractEnd || current.contractEnd === lastStartDefault ? nextEnd : current.contractEnd,
      }));
      setLastStartDefault(nextEnd);
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    const next = makeInitialForm();
    setForm(next);
    setLastStartDefault(next.contractEnd);
  }

  function saveListing(event) {
    event.preventDefault();

    const id = form.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    const listing = {
      ...form,
      id,
      address: form.address.trim(),
      seller: form.seller.trim(),
      contractEnd: form.contractEnd || getDefaultEndDate(form.contractStart),
      listingLink: normalizeUrl(form.listingLink.trim()),
      notes: form.notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    setListings((current) => {
      const existingIndex = current.findIndex((item) => item.id === id);
      if (existingIndex === -1) return [...current, listing];
      return current.map((item) => (item.id === id ? listing : item));
    });
    resetForm();
  }

  function editListing(listing) {
    setForm(listing);
    setLastStartDefault('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteListing(listing) {
    if (!window.confirm(`Delete ${listing.address}?`)) return;
    setListings((current) => current.filter((item) => item.id !== listing.id));
    if (form.id === listing.id) resetForm();
  }

  return (
    <main className="listing-tracker-page">
      <header className="tracker-topbar">
        <div>
          <p className="tracker-eyebrow">Private listing workspace</p>
          <h1>Listing Tracker</h1>
        </div>
        <div className="tracker-top-actions">
          <a className="tracker-secondary" href="/closing-cost-calculator/">Closing Cost Calculator</a>
          <button className="tracker-primary" type="button" onClick={resetForm}>Add Listing</button>
        </div>
      </header>

      <section className="tracker-summary" aria-label="Listing summary">
        <article>
          <span>{activeListings.length}</span>
          <p>Active listings</p>
        </article>
        <article>
          <span>{attentionListings.length}</span>
          <p>Need attention</p>
        </article>
        <article>
          <span>{closingSoonListings.length}</span>
          <p>Ending in 30 days</p>
        </article>
      </section>

      <section className="tracker-workspace">
        <form className="tracker-form" onSubmit={saveListing}>
          <div className="tracker-form-heading">
            <h2>{form.id ? 'Edit listing' : 'Add a listing'}</h2>
            {form.id && (
              <button className="tracker-ghost" type="button" onClick={resetForm}>Cancel edit</button>
            )}
          </div>

          <label>
            Address or listing name
            <input value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="123 Main Street" required />
          </label>

          <div className="tracker-two-column">
            <label>
              Seller/contact
              <input value={form.seller} onChange={(event) => updateField('seller', event.target.value)} placeholder="Client name" />
            </label>
            <label>
              Asking price
              <input value={form.price} onChange={(event) => updateField('price', event.target.value)} type="number" min="0" step="1000" placeholder="499000" />
            </label>
          </div>

          <div className="tracker-two-column">
            <label>
              Contract start
              <input value={form.contractStart} onChange={(event) => updateField('contractStart', event.target.value)} type="date" required />
            </label>
            <label>
              Contract end
              <input value={form.contractEnd} onChange={(event) => updateField('contractEnd', event.target.value)} type="date" />
            </label>
          </div>

          <div className="tracker-two-column">
            <label>
              Status
              <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                <option>For Sale</option>
                <option>Conditional</option>
                <option>Sold</option>
                <option>Expired</option>
                <option>Cancelled</option>
              </select>
            </label>
            <label>
              MLS or listing link
              <input value={form.listingLink} onChange={(event) => updateField('listingLink', event.target.value)} placeholder="https://..." />
            </label>
          </div>

          <label>
            Notes and extra info
            <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} rows="5" placeholder="Updates, feedback, price-change ideas, showing notes..." />
          </label>

          <button className="tracker-primary tracker-full" type="submit">Save Listing</button>
        </form>

        <section className="tracker-listing-area" aria-live="polite">
          <div className="tracker-list-header">
            <div>
              <h2>Your listings</h2>
              <p>{listings.length ? 'Use the calendar export on each card to add reminders.' : 'Add your first listing to start tracking follow-ups.'}</p>
            </div>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter listings by status">
              <option value="all">All listings</option>
              <option value="active">Active only</option>
              <option value="closed">Sold, expired, cancelled</option>
              <option value="attention">Needs attention</option>
            </select>
          </div>

          <div className="tracker-listing-list">
            {visibleListings.length === 0 ? (
              <div className="tracker-empty-state">{listings.length ? 'No listings match this filter.' : 'No listings yet. Add one on the left.'}</div>
            ) : visibleListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onEdit={editListing}
                onDelete={deleteListing}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function ListingCard({ listing, onEdit, onDelete }) {
  const action = nextAction(listing);
  const reminders = getReminders(listing);
  const progress = progressFor(listing);
  const isClosed = CLOSED_STATUSES.has(listing.status);

  return (
    <article className={`tracker-card ${action.type === 'overdue' ? 'needs-attention' : ''} ${isClosed ? 'closed' : ''}`}>
      <div className="tracker-card-top">
        <div>
          <h3>{listing.address}</h3>
          <p>{listing.seller ? `Seller/contact: ${listing.seller}` : 'No seller/contact added'}</p>
        </div>
        <span className={`tracker-status status-${listing.status.toLowerCase().replaceAll(' ', '-')}`}>{listing.status}</span>
      </div>

      <dl className="tracker-meta">
        <div>
          <dt>Price</dt>
          <dd>{money(listing.price)}</dd>
        </div>
        <div>
          <dt>Contract</dt>
          <dd>{formatDisplayDate(listing.contractStart)} - {formatDisplayDate(listing.contractEnd)}</dd>
        </div>
        <div>
          <dt>Days left</dt>
          <dd>{daysRemaining(listing)}</dd>
        </div>
      </dl>

      <div className="tracker-progress-wrap">
        <div className="tracker-progress-label">
          <span>Contract progress</span>
          <strong>{progress}%</strong>
        </div>
        <div className="tracker-progress-track">
          <div className="tracker-progress-fill" style={{ width: `${progress}%` }} />
          {reminders.map((reminder) => (
            <span
              className="tracker-milestone"
              key={`${reminder.title}-${reminder.date.toISOString()}`}
              style={{ left: `${markerPercent(listing, reminder.date)}%` }}
              title={`${reminder.title}: ${formatDisplayDate(reminder.date)}`}
            />
          ))}
        </div>
      </div>

      <div className="tracker-next-reminder">{action.label}</div>

      <ul className="tracker-reminder-list">
        {reminders.map((reminder) => (
          <li className={reminder.date < todayStart() ? 'past' : ''} key={`${reminder.title}-${reminder.date.toISOString()}`}>
            <strong>{reminder.title}</strong>
            {formatDisplayDate(reminder.date)}
          </li>
        ))}
      </ul>

      <p className="tracker-notes">{listing.notes || 'No notes added.'}</p>

      <div className="tracker-card-actions">
        {listing.listingLink && (
          <a className="tracker-link-button" href={listing.listingLink} target="_blank" rel="noreferrer">Open link</a>
        )}
        <button className="tracker-secondary" type="button" onClick={() => exportCalendar(listing)}>Export calendar</button>
        <button className="tracker-secondary" type="button" onClick={() => onEdit(listing)}>Edit</button>
        <button className="tracker-danger" type="button" onClick={() => onDelete(listing)}>Delete</button>
      </div>
    </article>
  );
}

export default ListingTracker;
