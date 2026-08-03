'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

type StateId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';

type VoyageState = {
  id: StateId;
  state: string;
  frequency: string;
  hz: string;
  purpose: string;
  technical: string;
  note: string;
};

const voyageStates: VoyageState[] = [
  {
    id: 'alpha',
    state: 'Calm Focus',
    frequency: 'Alpha',
    hz: '10 Hz',
    purpose: 'Study, reading and steady concentration.',
    technical: 'Left 180 Hz · Right 190 Hz · 10 Hz difference',
    note: 'Headphones recommended'
  },
  {
    id: 'gamma',
    state: 'Deep Focus',
    frequency: 'Gamma',
    hz: '40 Hz',
    purpose: 'Demanding work, research and high-attention sessions.',
    technical: 'Left 220 Hz · Right 260 Hz · 40 Hz difference',
    note: 'Headphones recommended'
  },
  {
    id: 'theta',
    state: 'Creative Flow',
    frequency: 'Theta',
    hz: '4 Hz',
    purpose: 'Writing, reflection, meditation and ideation.',
    technical: 'Left 95 Hz · Right 99 Hz · 4 Hz difference',
    note: 'Headphones recommended'
  },
  {
    id: 'delta',
    state: 'Deep Rest',
    frequency: 'Delta',
    hz: '2 Hz',
    purpose: 'Wind-down rituals, recovery and sleep preparation.',
    technical: 'Left 70 Hz · Right 72 Hz · 2 Hz difference',
    note: 'Headphones recommended'
  },
  {
    id: 'abundance',
    state: 'Abundance',
    frequency: 'Pure Tone',
    hz: '888 Hz',
    purpose: 'Visualization, intention and ceremonial sessions.',
    technical: 'Pure 888 Hz tone · Clean uninterrupted loop',
    note: 'Speakers or headphones'
  }
];

const durations = [15, 25, 40, 60];

const qualityPoints = [
  {
    number: '01',
    title: 'Pure signals',
    text: 'Clean tones with transparent signal information.'
  },
  {
    number: '02',
    title: 'Built for sessions',
    text: 'Frequency, timer, intention and idea capture in one place.'
  },
  {
    number: '03',
    title: 'No forced setup',
    text: 'No calendar migration, complicated onboarding or required account.'
  },
  {
    number: '04',
    title: 'Saved spaces',
    text: 'Return to the state and duration that work for you in one tap.'
  }
];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function Home() {
  const [selectedId, setSelectedId] = useState<StateId>('alpha');
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [intention, setIntention] = useState('');
  const [spaceSaved, setSpaceSaved] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState('');

  const [sessionOpen, setSessionOpen] = useState(false);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [thought, setThought] = useState('');
  const [thoughts, setThoughts] = useState<string[]>([]);

  const selectedState = useMemo(
    () => voyageStates.find((item) => item.id === selectedId) ?? voyageStates[0],
    [selectedId]
  );

  useEffect(() => {
    if (!running) return;

    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    document.body.classList.toggle('session-is-open', sessionOpen);
    return () => document.body.classList.remove('session-is-open');
  }, [sessionOpen]);

  const beginSession = () => {
    setRemaining(selectedDuration * 60);
    setRunning(false);
    setThought('');
    setThoughts([]);
    setSessionOpen(true);
  };

  const saveSpace = () => {
    localStorage.setItem(
      'ev-saved-space',
      JSON.stringify({ state: selectedId, duration: selectedDuration, intention })
    );
    setSpaceSaved(true);
    window.setTimeout(() => setSpaceSaved(false), 2400);
  };

  const addThought = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanThought = thought.trim();
    if (!cleanThought) return;
    setThoughts((current) => [...current, cleanThought]);
    setThought('');
  };

  const joinWaitlist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get('email') || '')
      .trim()
      .toLowerCase();

    if (!email) return;

    const current = JSON.parse(localStorage.getItem('ev-waitlist') || '[]') as string[];
    if (!current.includes(email)) {
      current.push(email);
      localStorage.setItem('ev-waitlist', JSON.stringify(current));
    }

    form.reset();
    setWaitlistMessage('You are on the early access list.');
  };

  return (
    <main className="pageShell" id="top">
      <div className="pageNoise" />
      <div className="pageGlow glowOne" />
      <div className="pageGlow glowTwo" />

      <header className="topbar">
        <a href="#top" className="brandLockup" aria-label="Everlasting Voyage home">
          <img src="/brand-infinity.png" alt="Everlasting Voyage infinity logo" className="brandMark" />
          <img src="/brand-wordmark.png" alt="Everlasting Voyage" className="brandWordmark" />
        </a>

        <nav className="navLinks">
          <a href="#how">How it works</a>
          <a href="#library">Frequencies</a>
          <a href="#quality">Quality</a>
        </nav>

        <a href="#session-builder" className="navCta">
          Start a session <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="heroSection">
        <div className="heroCopyCol">
          <p className="eyebrow">Pure frequencies · immersive focus sessions</p>
          <h1>Choose your state. Set your time. Enter the voyage.</h1>
          <p className="heroCopy">
            Everlasting Voyage combines pure frequencies, a focused timer and one clear intention. Begin in seconds and stay inside the state you chose.
          </p>

          <div className="heroActions">
            <a href="#session-builder" className="primaryButton">
              Start a session <span aria-hidden="true">→</span>
            </a>
            <a href="#library" className="secondaryButton">
              Explore the library <span aria-hidden="true">↘</span>
            </a>
          </div>

          <div className="trustRow" aria-label="Product principles">
            <span>No account required</span>
            <span>Transparent frequencies</span>
            <span>Built for headphones</span>
          </div>
        </div>

        <article className="sessionBuilder glassCard" id="session-builder">
          <div className="builderHeader">
            <div>
              <p className="eyebrow">Build your voyage</p>
              <h2>What do you need right now?</h2>
            </div>
            <span className={`signalBadge ${selectedState.id}`}>{selectedState.frequency} · {selectedState.hz}</span>
          </div>

          <div className="carouselHint mobileOnly" aria-hidden="true">
            <span>Swipe to explore states</span>
            <span className="hintArrow">→</span>
          </div>

          <div className="stateScroller" role="tablist" aria-label="Choose a state">
            {voyageStates.map((item) => (
              <button
                type="button"
                key={item.id}
                role="tab"
                aria-selected={selectedId === item.id}
                className={`stateChoice ${item.id} ${selectedId === item.id ? 'active' : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <span>{item.frequency}</span>
                <strong>{item.state}</strong>
                <small>{item.hz}</small>
                <i className="selectionMark" aria-hidden="true">✓</i>
              </button>
            ))}
          </div>

          <div className="builderLower">
            <div className="durationBlock">
              <span className="fieldLabel">Set your time</span>
              <div className="durationRow">
                {durations.map((duration) => (
                  <button
                    type="button"
                    key={duration}
                    className={selectedDuration === duration ? 'active' : ''}
                    aria-pressed={selectedDuration === duration}
                    onClick={() => setSelectedDuration(duration)}
                  >
                    {duration} min
                  </button>
                ))}
              </div>
            </div>

            <label className="intentionField">
              <span className="fieldLabel">Set an intention <em>optional</em></span>
              <input
                value={intention}
                onChange={(event) => setIntention(event.target.value)}
                placeholder="What will you complete during this voyage?"
                maxLength={120}
              />
            </label>
          </div>

          <div className="selectedSummary">
            <div>
              <span className="summaryLabel">Selected state</span>
              <strong>{selectedState.state}</strong>
              <p>{selectedState.purpose}</p>
            </div>
            <div className="technicalSummary">
              <span>{selectedState.technical}</span>
              <span>{selectedState.note}</span>
            </div>
          </div>

          <div className="builderActions">
            <button type="button" className="primaryButton" onClick={beginSession}>
              Enter the voyage <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="saveButton" onClick={saveSpace}>
              {spaceSaved ? 'Space saved ✓' : 'Save this space'}
            </button>
          </div>
        </article>
      </section>

      <section className="section sectionBand" id="how">
        <div className="sectionIntro horizontalIntro">
          <div>
            <p className="eyebrow">The entire ritual</p>
            <h2>Three decisions. Then the world gets quieter.</h2>
          </div>
          <p>
            No setup marathon. Choose the state, choose the time and enter a focused environment.
          </p>
        </div>

        <div className="carouselHint mobileOnly" aria-hidden="true">
          <span>Swipe through the ritual</span>
          <span className="hintArrow">→</span>
        </div>

        <div className="stepsRow">
          <article>
            <span>01</span>
            <h3>Choose your state</h3>
            <p>Select the mental atmosphere that matches the moment.</p>
          </article>
          <div className="stepConnector" />
          <article>
            <span>02</span>
            <h3>Set your time</h3>
            <p>Pick a Pomodoro length and add one clear intention.</p>
          </article>
          <div className="stepConnector" />
          <article>
            <span>03</span>
            <h3>Enter the voyage</h3>
            <p>Timer, frequency and idea capture remain in one space.</p>
          </article>
        </div>
      </section>

      <section className="section" id="library">
        <div className="sectionIntro horizontalIntro">
          <div>
            <p className="eyebrow">Frequency library</p>
            <h2>Pure signals with nothing hidden.</h2>
          </div>
          <p>
            Every session explains the signal, intended use and headphone guidance before you begin.
          </p>
        </div>

        <div className="carouselHint mobileOnly" aria-hidden="true">
          <span>Swipe to explore frequencies</span>
          <span className="hintArrow">→</span>
        </div>

        <div className="frequencyCarousel">
          {voyageStates.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`frequencyCard glassCard ${item.id} ${selectedId === item.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedId(item.id);
                document.getElementById('session-builder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              <div className="frequencyTopline">
                <span>{item.frequency}</span>
                <strong>{item.hz}</strong>
              </div>
              <h3>{item.state}</h3>
              <p>{item.purpose}</p>
              <small>{item.technical}</small>
              <span className="useStateLabel">Use this state →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section sectionBand" id="quality">
        <div className="sectionIntro horizontalIntro">
          <div>
            <p className="eyebrow">Why Everlasting Voyage</p>
            <h2>More than audio. A place to remain focused.</h2>
          </div>
          <p>
            Frequency, timer, intention and idea capture live together without recommendations, comments or surrounding noise.
          </p>
        </div>

        <div className="qualityGrid">
          {qualityPoints.map((point) => (
            <article key={point.number} className="qualityPoint">
              <span>{point.number}</span>
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section joinSection" id="join">
        <article className="joinCard glassCard">
          <div>
            <p className="eyebrow">Early access</p>
            <h2>Your next session should be one click away.</h2>
            <p>Join the first release as the pure audio library and full session engine come online.</p>
          </div>

          <form className="waitlistForm" onSubmit={joinWaitlist}>
            <input type="email" name="email" placeholder="Your email address" required aria-label="Email address" />
            <button type="submit" className="primaryButton">Join early access →</button>
          </form>

          <p className="successMessage" aria-live="polite">{waitlistMessage}</p>
        </article>
      </section>

      {sessionOpen && (
        <div className={`sessionOverlay ${selectedState.id}`} role="dialog" aria-modal="true" aria-label="Voyage session preview">
          <div className="sessionAmbient ambientOne" />
          <div className="sessionAmbient ambientTwo" />

          <header className="sessionHeader">
            <div className="sessionBrand">
              <img src="/brand-infinity.png" alt="" />
              <span>Everlasting Voyage</span>
            </div>
            <button type="button" className="closeSession" onClick={() => setSessionOpen(false)} aria-label="Close session">
              Close
            </button>
          </header>

          <div className="sessionMain">
            <div className="sessionIdentity">
              <span>{selectedState.frequency} · {selectedState.hz}</span>
              <h2>{selectedState.state}</h2>
              <p>{intention || 'A focused session with no added pressure.'}</p>
            </div>

            <div className="timerDisplay">{formatTime(remaining)}</div>

            <div className="timerControls">
              <button type="button" className="primaryButton" onClick={() => setRunning((current) => !current)}>
                {running ? 'Pause' : remaining === 0 ? 'Complete' : 'Begin'}
              </button>
              <button
                type="button"
                className="secondaryButton"
                onClick={() => {
                  setRunning(false);
                  setRemaining(selectedDuration * 60);
                }}
              >
                Reset
              </button>
            </div>

            <form className="thoughtCapture" onSubmit={addThought}>
              <label htmlFor="thought">Capture a thought</label>
              <div>
                <input
                  id="thought"
                  value={thought}
                  onChange={(event) => setThought(event.target.value)}
                  placeholder="Write it down without leaving the voyage"
                  maxLength={160}
                />
                <button type="submit">Save</button>
              </div>
            </form>

            {thoughts.length > 0 && (
              <div className="thoughtList">
                {thoughts.map((item, index) => (
                  <span key={`${item}-${index}`}>{item}</span>
                ))}
              </div>
            )}
          </div>

          <footer className="sessionFooter">
            <span>{selectedState.technical}</span>
            <span>Pure audio engine · next release layer</span>
          </footer>
        </div>
      )}
    </main>
  );
}
