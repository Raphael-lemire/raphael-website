import { useState } from 'react';
import './RealtorOutreach.css';

const STORAGE_KEY = 'realtor-outreach-v1';

const properties = [
  {
    id: '57-kervin',
    address: '57 Kervin Cres, Moncton',
    mls: 'NB133396',
    brokerage: 'EXIT Realty Associates',
    category: 'New construction',
    isNew: true,
    occupancy: 'New construction',
    contacts: [
      { name: 'Chantal Albert', phone: '5068755626', displayPhone: '(506) 875-5626' },
      { name: 'Marc-Andre Arsenault', phone: '5068781203', displayPhone: '(506) 878-1203' },
    ],
  },
  {
    id: '59-old-oak',
    address: '59 Old Oak, Moncton',
    mls: 'NB137770',
    brokerage: 'EXIT Realty Associates',
    category: 'Resale / not new',
    isNew: false,
    occupancy: 'Not publicly confirmed',
    contacts: [{ name: 'Karine Dufresne', phone: '5068750499', displayPhone: '(506) 875-0499' }],
  },
  {
    id: '3-heros',
    address: '3 Heros Court, Moncton',
    mls: 'NB137332',
    brokerage: 'RE/MAX Quality Real Estate Inc.',
    category: 'Resale / not new',
    isNew: false,
    occupancy: 'Not publicly confirmed',
    contacts: [{ name: 'Phil Albert', phone: '5068783948', displayPhone: '(506) 878-3948' }],
  },
  {
    id: '54-cudmore',
    address: '54 Cudmore St, Riverview',
    mls: 'NB136408',
    brokerage: 'eXp Realty',
    category: 'New construction',
    isNew: true,
    occupancy: 'New construction',
    contacts: [
      { name: 'Huguette LeBlanc', phone: '5069610888', displayPhone: '(506) 961-0888' },
      { name: 'Audrey Melanson', phone: '4288803800', displayPhone: '(428) 880-3800' },
    ],
  },
  {
    id: '113-oakfield',
    address: '113 Oakfield Dr, Riverview',
    mls: 'NB134000',
    brokerage: 'RE/MAX Avante',
    category: 'New construction',
    isNew: true,
    occupancy: 'New construction',
    contacts: [{ name: 'Maurice LeBlanc', phone: '5065315934', displayPhone: '(506) 531-5934' }],
  },
  {
    id: '458-gaspe',
    address: '458 Gaspe St, Dieppe',
    mls: 'NB134724',
    brokerage: 'EXIT Realty Associates',
    category: 'Resale / not new',
    isNew: false,
    occupancy: 'Not publicly confirmed',
    contacts: [
      { name: 'Chantal Albert', phone: '5068755626', displayPhone: '(506) 875-5626' },
      { name: 'Marc-Andre Arsenault', phone: '5068781203', displayPhone: '(506) 878-1203' },
    ],
  },
  {
    id: '375-glengrove',
    address: '375 Glengrove Rd, Moncton',
    mls: 'NB133057',
    brokerage: 'Keller Williams Capital Realty',
    category: 'Resale / not new',
    isNew: false,
    occupancy: 'Not publicly confirmed',
    contacts: [{ name: 'Eric Frenette', phone: '5063647653', displayPhone: '(506) 364-7653' }],
  },
  {
    id: '186-rachel',
    address: '186 Rachel St, Moncton',
    mls: 'NB133119',
    brokerage: 'PG Direct Realty Ltd.',
    category: 'New construction / new build',
    isNew: true,
    occupancy: 'New construction',
    contacts: [{ name: 'Jonathan David / PG Direct', phone: '8777090027', displayPhone: '(877) 709-0027' }],
  },
  {
    id: '22-donat',
    address: '22 Donat Cres, Dieppe',
    mls: 'NB129582',
    brokerage: 'Royal LePage Atlantic',
    category: 'Resale / not new',
    isNew: false,
    occupancy: 'Not publicly confirmed',
    contacts: [{ name: 'Danielle Johnson', phone: '5063816084', displayPhone: '(506) 381-6084' }],
  },
  {
    id: '94-adrienne',
    address: '94 Adrienne Court, Dieppe',
    mls: 'NB133143',
    brokerage: 'EXIT Realty Associates',
    category: 'New construction',
    isNew: true,
    occupancy: 'New construction',
    contacts: [
      { name: 'Mike Doiron', phone: '5068507089', displayPhone: '(506) 850-7089' },
      { name: 'Heather Doiron', phone: '5068506049', displayPhone: '(506) 850-6049' },
    ],
  },
  {
    id: '124-larochelle',
    address: '124 Larochelle St, Dieppe',
    mls: 'NB133041',
    brokerage: 'EXIT Realty Associates',
    category: 'Resale / not new',
    isNew: false,
    occupancy: 'Not publicly confirmed',
    contacts: [
      { name: 'Mike Doiron', phone: '5068507089', displayPhone: '(506) 850-7089' },
      { name: 'Heather Doiron', phone: '5068506049', displayPhone: '(506) 850-6049' },
    ],
  },
  {
    id: '1003-bourque',
    address: '1003 Bourque Rd, Dieppe',
    mls: 'NB134336',
    brokerage: 'EXIT Realty Associates',
    category: 'Resale / not new',
    isNew: false,
    occupancy: 'Not publicly confirmed',
    contacts: [{ name: 'Joanne Maillet', phone: '5062954699', displayPhone: '(506) 295-4699' }],
  },
  {
    id: '50-doiron',
    address: '50 Doiron, Dieppe',
    mls: 'NB138221',
    brokerage: 'Platinum Atlantic Realty Inc.',
    category: 'Resale / not new',
    isNew: false,
    occupancy: 'Not publicly confirmed',
    contacts: [{ name: 'Jesus Machado', phone: '5062334717', displayPhone: '(506) 233-4717' }],
  },
  {
    id: '92-satara',
    address: '92 Satara Dr, Moncton',
    mls: 'NB136505',
    brokerage: 'Keller Williams Capital Realty',
    category: 'Resale / not new',
    isNew: false,
    occupancy: 'Not publicly confirmed',
    contacts: [{ name: 'Dennis Wilson', phone: '5068710223', displayPhone: '(506) 871-0223' }],
  },
];

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function statusLabel(status) {
  if (status === 'works') return 'Will work';
  if (status === 'notWork') return "Won't work";
  return 'Pending';
}

function makeMessage(property, contact) {
  if (property.isNew) {
    return `Hi ${contact.name}, this is Raphael Lemire. I am checking ${property.address}, MLS ${property.mls}, for a client. Is it still available, and can you confirm the builder, HST/rebate details, and expected possession?`;
  }

  return `Hi ${contact.name}, this is Raphael Lemire. I am checking ${property.address}, MLS ${property.mls}, for a client. Is it still available, and can you confirm if it is owner-occupied, vacant, or tenant-occupied, plus any possession notes?`;
}

function smsUrl(phone, message) {
  return `sms:+1${phone}?&body=${encodeURIComponent(message)}`;
}

function RealtorOutreach() {
  const [records, setRecords] = useState(loadRecords);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  function getRecord(id) {
    return records[id] || { status: 'pending', note: '' };
  }

  function saveRecords(next) {
    setRecords(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function updateRecord(id, updates) {
    saveRecords({
      ...records,
      [id]: {
        ...getRecord(id),
        ...updates,
      },
    });
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(''), 2400);
  }

  async function copyMessage(property, contact) {
    try {
      await navigator.clipboard.writeText(makeMessage(property, contact));
      showToast('Text copied.');
    } catch {
      showToast('Could not copy. Use the Text button instead.');
    }
  }

  function resetTracker() {
    if (!window.confirm('Reset all realtor outreach statuses and notes?')) return;
    saveRecords({});
    showToast('Realtor tracker reset.');
  }

  const counts = properties.reduce(
    (summary, property) => {
      const status = getRecord(property.id).status;
      summary.total += 1;
      summary[status] += 1;
      return summary;
    },
    { total: 0, pending: 0, works: 0, notWork: 0 },
  );

  const query = search.trim().toLowerCase();
  const visibleProperties = properties.filter((property) => {
    const record = getRecord(property.id);
    const matchesFilter = filter === 'all' || record.status === filter;
    const searchable = [
      property.address,
      property.mls,
      property.brokerage,
      property.category,
      property.occupancy,
      ...property.contacts.flatMap((contact) => [contact.name, contact.displayPhone]),
    ].join(' ').toLowerCase();

    return matchesFilter && (!query || searchable.includes(query));
  });

  return (
    <main className="realtor-outreach-page">
      <header className="realtor-topbar">
        <div>
          <p className="realtor-eyebrow">Private realtor workspace</p>
          <h1>Realtor Outreach</h1>
          <p className="realtor-intro">Text listing agents, then classify whether each home works for the client.</p>
        </div>
        <div className="realtor-top-actions">
          <a className="realtor-secondary" href="/tools">Tools Home</a>
          <button className="realtor-danger" type="button" onClick={resetTracker}>Reset</button>
        </div>
      </header>

      <section className="realtor-summary" aria-label="Realtor outreach summary">
        <article>
          <span>{counts.total}</span>
          <p>Total homes</p>
        </article>
        <article>
          <span>{counts.pending}</span>
          <p>Pending</p>
        </article>
        <article>
          <span>{counts.works}</span>
          <p>Will work</p>
        </article>
        <article>
          <span>{counts.notWork}</span>
          <p>Won&apos;t work</p>
        </article>
      </section>

      <section className="realtor-toolbar" aria-label="Filter realtor outreach">
        <label>
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Address, MLS, agent, brokerage..."
            type="search"
          />
        </label>
        <div className="realtor-filters" aria-label="Status filters">
          {[
            ['all', 'All'],
            ['pending', 'Pending'],
            ['works', 'Will work'],
            ['notWork', "Won't work"],
          ].map(([value, label]) => (
            <button
              className={filter === value ? 'active' : ''}
              key={value}
              type="button"
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="realtor-list" aria-label="Homes to contact">
        {visibleProperties.map((property) => {
          const record = getRecord(property.id);
          const primaryContact = property.contacts[0];

          return (
            <article className="realtor-card" data-status={record.status} key={property.id}>
              <div className="realtor-card-main">
                <div className="realtor-card-heading">
                  <div>
                    <span className="realtor-status">{statusLabel(record.status)}</span>
                    <h2>{property.address}</h2>
                  </div>
                  <span className={`realtor-type ${property.isNew ? 'new-build' : ''}`}>{property.category}</span>
                </div>

                <dl className="realtor-details">
                  <div>
                    <dt>MLS</dt>
                    <dd>{property.mls}</dd>
                  </div>
                  <div>
                    <dt>Brokerage</dt>
                    <dd>{property.brokerage}</dd>
                  </div>
                  <div>
                    <dt>Occupancy</dt>
                    <dd>{property.occupancy}</dd>
                  </div>
                </dl>

                <div className="realtor-contacts">
                  {property.contacts.map((contact) => (
                    <div className="realtor-contact" key={`${property.id}-${contact.phone}`}>
                      <div>
                        <strong>{contact.name}</strong>
                        <span>{contact.displayPhone}</span>
                      </div>
                      <a href={smsUrl(contact.phone, makeMessage(property, contact))}>Text</a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="realtor-actions">
                <button type="button" className="realtor-primary" onClick={() => copyMessage(property, primaryContact)}>
                  Copy text
                </button>
                <div className="realtor-status-buttons">
                  <button type="button" className="works" onClick={() => updateRecord(property.id, { status: 'works' })}>
                    Will work
                  </button>
                  <button type="button" className="not-work" onClick={() => updateRecord(property.id, { status: 'notWork' })}>
                    Won&apos;t work
                  </button>
                  <button type="button" onClick={() => updateRecord(property.id, { status: 'pending' })}>
                    Pending
                  </button>
                </div>
                <label>
                  Note
                  <textarea
                    rows="3"
                    value={record.note || ''}
                    onChange={(event) => updateRecord(property.id, { note: event.target.value })}
                    placeholder="Ex: vacant, possession flexible, client passed..."
                  />
                </label>
              </div>
            </article>
          );
        })}
      </section>

      {toast && <div className="realtor-toast">{toast}</div>}
    </main>
  );
}

export default RealtorOutreach;
