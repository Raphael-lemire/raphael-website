import './ToolsHome.css';

const tools = [
  {
    title: 'Listing Tracker',
    description: 'Track active listings, contract timelines, follow-up dates, and calendar reminders.',
    href: '/listing-tracker',
    status: 'Live',
  },
  {
    title: 'Closing Cost Calculator',
    description: 'Prepare buyer cash-to-close estimates with transfer tax, adjustments, equity, and insurance.',
    href: '/closing-cost-calculator/',
    status: 'Live',
  },
  {
    title: 'Tax Vault',
    description: 'Collect received invoices, receipt photos, and tax documents into a clean year-end package.',
    href: '/tax-vault/',
    status: 'Live',
  },
  {
    title: 'Realtor Outreach',
    description: 'Text listing agents, track replies, and classify which homes will work for the client.',
    href: '/realtor-outreach',
    status: 'Live',
  },
];

function ToolsHome() {
  return (
    <main className="tools-home">
      <header className="tools-hero">
        <p className="tools-eyebrow">Private workspace</p>
        <h1>Raphael&apos;s Tools</h1>
        <p>Quick access to the private tools you use to manage listings, prepare client numbers, and keep future ideas in one secure place.</p>
      </header>

      <section className="tools-grid" aria-label="Private tools">
        {tools.map((tool) => (
          <a className="tool-card" href={tool.href} key={tool.title}>
            <span>{tool.status}</span>
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
            <strong>Open</strong>
          </a>
        ))}

        <article className="tool-card future-card">
          <span>Next</span>
          <h2>Future Tool</h2>
          <p>Add your next private idea here, like a seller net sheet, lead tracker, showing log, or client follow-up dashboard.</p>
          <strong>Ready when you are</strong>
        </article>
      </section>
    </main>
  );
}

export default ToolsHome;
