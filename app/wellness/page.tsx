import V12LegalPage from '../components/V12LegalPage';

export const metadata = { title: 'Wellness & Audio Safety · Everlasting Voyage' };

export default function WellnessPage() {
  return (
    <V12LegalPage
      eyebrow="Wellness & audio safety"
      title="Use the signal gently."
      intro="Everlasting Voyage is an audio focus and relaxation experience. It is not medical treatment and should be used with ordinary listening safety."
    >
      <section>
        <h2>Not medical care</h2>
        <p>
          The frequencies, binaural differences, pure tones and Atmosphere layers are not a diagnosis, treatment or substitute for professional medical or mental-health care. Seek qualified help for health concerns.
        </p>
      </section>
      <section>
        <h2>Listen at a moderate volume</h2>
        <p>
          Begin quietly, keep the volume comfortable and stop if you experience pain, dizziness, anxiety, headache, ringing, disorientation or any other discomfort. Avoid prolonged exposure at high volume.
        </p>
      </section>
      <section>
        <h2>Headphones and binaural sessions</h2>
        <p>
          Headphones are required for the intended left–right difference in Alpha, Gamma, Theta and Delta sessions. The 888 Hz Pure Tone can be used with speakers or headphones. Never use headphones when they would make your surroundings unsafe.
        </p>
      </section>
      <section>
        <h2>Do not use while driving</h2>
        <p>
          Do not use Everlasting Voyage while driving, cycling in traffic, operating machinery or performing any activity that requires full environmental awareness.
        </p>
      </section>
      <section>
        <h2>Individual experiences vary</h2>
        <p>
          A frequency may feel helpful, neutral or unpleasant depending on the person and moment. No guaranteed medical, cognitive, emotional or financial result is claimed.
        </p>
      </section>
    </V12LegalPage>
  );
}
