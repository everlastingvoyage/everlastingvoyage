import V12LegalPage from '../components/V12LegalPage';

export const metadata = { title: 'Privacy · Everlasting Voyage' };

export default function PrivacyPage() {
  return (
    <V12LegalPage
      eyebrow="Privacy"
      title="Your inner space stays yours."
      intro="Everlasting Voyage is designed so the personal content of a session remains on your device in the current private beta."
    >
      <section>
        <h2>What stays in your browser</h2>
        <p>
          Saved Spaces, their names and intentions, Notes, captured thoughts, the active session, volume preferences and Atmosphere mixes are stored locally in your browser. Accounts and cloud synchronization do not exist in this version.
        </p>
      </section>

      <section>
        <h2>Optional anonymous analytics</h2>
        <p>
          Anonymous product analytics is off until you explicitly allow it. When allowed, Everlasting Voyage records structured actions such as a selected state, broad duration, session start or completion, Atmosphere layer use, sanitized audio failure codes and feedback categories.
        </p>
        <p>
          Analytics never includes your intention, thought text, Notes, Saved Space names, feedback comment text, raw error messages, stack traces, source URLs, email address or full page URLs. Session replay, automatic click capture, heatmaps and automatic text capture are disabled. Geographic enrichment is disabled on events sent by the application.
        </p>
      </section>

      <section>
        <h2>Anonymous identifiers</h2>
        <p>
          After consent, the browser creates a random analytics identifier used only to understand returning use on that browser. Each Voyage also receives a temporary random session identifier used to prevent duplicate lifecycle events. We do not use advertising identifiers, hardware identifiers or fingerprinting, and we do not attempt cross-device tracking.
        </p>
      </section>

      <section>
        <h2>Changing your choice</h2>
        <p>
          Use <strong>Analytics Preferences</strong> in the footer at any time. Turning analytics off stops capture and clears the local anonymous analytics identifier. The timer, audio, Saved Spaces and Notes continue working normally.
        </p>
      </section>

      <section>
        <h2>Private beta feedback</h2>
        <p>
          Ratings and issue categories may be sent as anonymous structured analytics after consent. Optional written feedback is sent only when the private beta feedback destination is configured and you choose to submit a note. Please do not include sensitive information.
        </p>
      </section>

      <section>
        <h2>Service providers and retention</h2>
        <p>
          PostHog is the planned product-analytics provider for the private beta. Analytics is initialized only after consent and only when the project environment is configured. Retention settings must be finalized in the private analytics project before public launch. Data is not sold to advertisers.
        </p>
      </section>

      <section>
        <h2>Questions or requests</h2>
        <p>
          The Contact page provides the configured support route for privacy requests. This notice will be updated when accounts, cloud storage or additional processors are introduced.
        </p>
      </section>
    </V12LegalPage>
  );
}
