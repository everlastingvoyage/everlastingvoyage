import V12LegalPage from '../components/V12LegalPage';

export const metadata = { title: 'Contact · Everlasting Voyage' };

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <V12LegalPage
      eyebrow="Contact"
      title="Tell us what needs attention."
      intro="Use the appropriate subject so private-beta feedback can be handled without asking for unnecessary personal information."
    >
      <section>
        <h2>Contact categories</h2>
        <div className="v12ContactGrid">
          {[
            ['Technical problem', 'Include the device, browser and what you were trying to do. Do not send your intention or captured thoughts.'],
            ['Privacy request', 'Ask about analytics preferences, optional feedback or data handling.'],
            ['General feedback', 'Share what felt useful, confusing or missing from the Voyage.'],
            ['Audio licensing question', 'Name the customer-facing Atmosphere sound and the licensing concern.']
          ].map(([title, copy]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2>Support address</h2>
        {supportEmail ? (
          <p><a className="v12SupportEmail" href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
        ) : (
          <p className="v12LegalNotice">
            The public support address is being configured for the private beta. No personal email has been hardcoded into the application.
          </p>
        )}
      </section>
      <section>
        <h2>Before sending</h2>
        <p>
          Never include passwords, financial information, medical information, private intentions, Notes or captured thoughts. A screenshot may help with a layout issue, but review it for sensitive content first.
        </p>
      </section>
    </V12LegalPage>
  );
}
