import V12LegalPage from '../components/V12LegalPage';

export const metadata = { title: 'Terms · Everlasting Voyage' };

export default function TermsPage() {
  return (
    <V12LegalPage
      eyebrow="Terms"
      title="Private beta terms."
      intro="These draft terms describe responsible use of Everlasting Voyage while the product is being tested and refined."
      notice="Private beta draft — requires legal review before public launch."
    >
      <section>
        <h2>Using the service</h2>
        <p>
          You may use Everlasting Voyage for lawful personal focus, relaxation and creative sessions. Do not interfere with the service, attempt unauthorized access, misuse feedback endpoints or use the product to violate another person’s rights.
        </p>
      </section>
      <section>
        <h2>Beta availability</h2>
        <p>
          Features, sounds, storage formats and availability may change during the private beta. The service may be interrupted, modified or withdrawn, and uninterrupted access is not guaranteed.
        </p>
      </section>
      <section>
        <h2>Your local content</h2>
        <p>
          In the current version, intentions, captured thoughts, Notes and Saved Spaces remain in browser storage under your control. You are responsible for keeping any copies you need. Clearing browser data may remove that local content.
        </p>
      </section>
      <section>
        <h2>Intellectual property</h2>
        <p>
          The Everlasting Voyage name, interface, original visual design and original software are protected by applicable intellectual-property laws. Third-party recordings remain subject to the licenses listed on the Audio Licenses page.
        </p>
      </section>
      <section>
        <h2>No medical or performance guarantee</h2>
        <p>
          Everlasting Voyage is a wellness and focus experience, not medical treatment. Individual experiences vary. No medical, cognitive, productivity or financial outcome is promised.
        </p>
      </section>
      <section>
        <h2>Suspension and abuse</h2>
        <p>
          Access may be limited or suspended when reasonably necessary to protect the service, investigate abuse or comply with law. Account-specific termination terms will be added only if accounts are introduced later.
        </p>
      </section>
      <section>
        <h2>Liability and governing law</h2>
        <p>
          To the extent permitted by law, the service is provided on an “as available” basis and liability is limited for indirect or consequential loss. Governing law and venue remain a placeholder pending final legal review before public launch.
        </p>
      </section>
    </V12LegalPage>
  );
}
