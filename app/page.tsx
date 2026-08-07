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
    state: 'Gamma Clarity',
    frequency: 'Gamma',
    hz: '40 Hz',
    purpose: 'Demanding work, research and high-attention sessions.',
    technical: 'Left 220 Hz · Right 260 Hz · 40 Hz difference',
    note: 'Headphones recommended'
  },
  {
    id: 'theta',
    state: 'Reflective Space',
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
    title: 'Pure frequencies',
    text: 'Clean tones with transparent frequency information.'
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

function SignalHumanoidGraphic() {
  return (
    <svg viewBox="0 0 560 560" className="signalFigureGraphic" aria-hidden="true">
      <defs>
        <linearGradient id="signalStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9ae8ff" />
          <stop offset="45%" stopColor="#3bbcff" />
          <stop offset="100%" stopColor="#165bff" />
        </linearGradient>
        <radialGradient id="signalGlowFill" cx="50%" cy="44%" r="48%">
          <stop offset="0%" stopColor="#65d5ff" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#2470bb" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="strongGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="280" cy="280" r="146" fill="url(#signalGlowFill)" />
      <circle cx="280" cy="280" r="176" fill="none" stroke="url(#signalStroke)" strokeWidth="11" filter="url(#softGlow)" opacity="0.95" />
      <circle cx="280" cy="280" r="212" fill="none" stroke="url(#signalStroke)" strokeWidth="9" filter="url(#softGlow)" opacity="0.82" />
      <circle cx="280" cy="280" r="226" fill="none" stroke="url(#signalStroke)" strokeWidth="1.5" opacity="0.36" />

      <path d="M280 40 L280 88" stroke="url(#signalStroke)" strokeWidth="8" strokeLinecap="round" filter="url(#softGlow)" />
      <path d="M280 472 L280 520" stroke="url(#signalStroke)" strokeWidth="8" strokeLinecap="round" filter="url(#softGlow)" />
      <path d="M40 280 L88 280" stroke="url(#signalStroke)" strokeWidth="8" strokeLinecap="round" filter="url(#softGlow)" />
      <path d="M472 280 L520 280" stroke="url(#signalStroke)" strokeWidth="8" strokeLinecap="round" filter="url(#softGlow)" />

      <path d="M70 281 h42 l14 -22 l16 39 l16 -18 h27" fill="none" stroke="url(#signalStroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="url(#softGlow)" />
      <path d="M365 281 h34 l16 -25 l16 43 l16 -21 h43" fill="none" stroke="url(#signalStroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="url(#softGlow)" />

      <path d="M280 120 C220 120 186 154 178 222 C171 281 191 374 280 432 C369 374 389 281 382 222 C374 154 340 120 280 120 Z" fill="rgba(1,7,18,0.95)" stroke="url(#signalStroke)" strokeWidth="5" filter="url(#strongGlow)" />
      <path d="M214 226 C233 208 252 201 280 201 C308 201 327 208 346 226" fill="none" stroke="url(#signalStroke)" strokeWidth="4" opacity="0.42" />
      <path d="M230 290 C246 278 261 272 280 272 C299 272 314 278 330 290" fill="none" stroke="url(#signalStroke)" strokeWidth="3" opacity="0.38" />
      <path d="M263 314 C271 322 289 322 297 314" fill="none" stroke="url(#signalStroke)" strokeWidth="3.5" strokeLinecap="round" opacity="0.82" />
      <path d="M214 348 C236 362 256 368 280 368 C304 368 324 362 346 348" fill="none" stroke="url(#signalStroke)" strokeWidth="5" strokeLinecap="round" filter="url(#softGlow)" />
      <path d="M247 323 C258 334 270 340 280 340 C290 340 302 334 313 323" fill="none" stroke="url(#signalStroke)" strokeWidth="3" opacity="0.52" />
      <path d="M258 229 C248 237 240 245 236 253" fill="none" stroke="url(#signalStroke)" strokeWidth="3.5" opacity="0.5" />
      <path d="M302 229 C312 237 320 245 324 253" fill="none" stroke="url(#signalStroke)" strokeWidth="3.5" opacity="0.5" />
      <path d="M261 220 C272 214 288 214 299 220" fill="none" stroke="url(#signalStroke)" strokeWidth="3.5" opacity="0.44" />

      <ellipse cx="236" cy="270" rx="24" ry="10" fill="#95ebff" filter="url(#strongGlow)" />
      <ellipse cx="324" cy="270" rx="24" ry="10" fill="#95ebff" filter="url(#strongGlow)" />
      <ellipse cx="236" cy="270" rx="10" ry="4" fill="#effcff" />
      <ellipse cx="324" cy="270" rx="10" ry="4" fill="#effcff" />
      <path d="M211 206 C192 216 181 234 179 255" fill="none" stroke="url(#signalStroke)" strokeWidth="5" strokeLinecap="round" opacity="0.82" filter="url(#softGlow)" />
      <path d="M349 206 C368 216 379 234 381 255" fill="none" stroke="url(#signalStroke)" strokeWidth="5" strokeLinecap="round" opacity="0.82" filter="url(#softGlow)" />
    </svg>
  );
}

export default function Home() {
  const [selectedId, setSelectedId] = useState<StateId>('alpha');
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [intention, setIntention] = useState('');
  const [spaceSaved, setSpaceSaved] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState('');
  const [libraryOpenId, setLibraryOpenId] = useState<StateId | null>(null);

  const [sessionOpen, setSessionOpen] = useState(false);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [thought, setThought] = useState('');
  const [thoughts, setThoughts] = useState<string[]>([]);

  const selectedState = useMemo(
    () => voyageStates.find((item) => item.id === selectedId) ?? voyageStates[0],
    [selectedId]
  );

  const libraryOpenState = useMemo(
    () => voyageStates.find((item) => item.id === libraryOpenId) ?? null,
    [libraryOpenId]
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

  const scrollToBuilder = () => {
    document.getElementById('session-builder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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


        <aside className="youtubeOrigin" aria-label="Everlasting Voyage YouTube origin">
<span className="youtubeOriginQuote" aria-hidden="true">“</span>
<div className="youtubeOriginIcon" aria-hidden="true"><svg viewBox="0 0 28 20" role="presentation"><rect x="0.5" y="0.5" width="27" height="19" rx="5" fill="#ff0033" /><path d="M11 5.5 19 10l-8 4.5z" fill="#fff" /></svg></div>
<blockquote><p>Born from the Everlasting Voyage YouTube channel — expanded into a more personal and immersive frequency experience for the community.</p><cite>Everlasting Voyage · YouTube</cite></blockquote>
        </aside>

        <article className="sessionBuilder glassCard" id="session-builder">
          <div className="builderHeader">
            <div>
              <p className="eyebrow">Build your voyage</p>
              <h2>What do you need right now?</h2>
            </div>
            <span className={`signalBadge ${selectedState.id}`}>
              {selectedState.frequency} · {selectedState.hz}
            </span>
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
                <i className="selectionMark" aria-hidden="true">
                  ✓
                </i>
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
              <span className="fieldLabel">
                Set an intention <em>optional</em>
              </span>
              <input
                value={intention}
                onChange={(event) => setIntention(event.target.value)}
                placeholder="What will you complete during this voyage?"
                maxLength={120}
              />
            </label>
          </div>

          <div className={`selectedSummary ${selectedState.id}`}>
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
          <p>No setup marathon. Choose the state, choose the time and enter a focused environment.</p>
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
            <h2>Pure frequencies with nothing hidden.</h2>
          </div>
          <p>
            Tap a frequency around the frequency figure to open a focused pop-up, inspect the tone and jump back into the builder.
          </p>
        </div>

        <article className="signalExperience glassCard">
          <div className="signalExperienceTop">
            <div className="carouselHint compactHint" aria-hidden="true">
              <span>Tap a frequency to explore the experience</span>
              <span className="hintArrow">→</span>
            </div>
          </div>

          <div className={`signalStage ${libraryOpenState ? 'popupOpen' : ''}`} aria-label="Interactive frequency map">
            {voyageStates.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`signalNode ${item.id} ${libraryOpenId === item.id ? 'active' : ''}`}
                onClick={() => setLibraryOpenId(item.id)}
                aria-pressed={libraryOpenId === item.id}
              >
                <span>{item.frequency}</span>
                <strong>{item.hz}</strong>
              </button>
            ))}

            <div className="signalFigure" aria-hidden="true">
              <div className="signalFigureHalo haloOuter" />
              <div className="signalFigureHalo haloMid" />
              <div className="signalFigureHalo haloInner" />
              <div className="signalSparkles">
                {Array.from({ length: 8 }).map((_, index) => (
                  <span key={`sparkle-${index}`} className={`sparkle sparkle${index + 1}`} />
                ))}
              </div>
              <SignalHumanoidGraphic />
            </div>

            {libraryOpenState ? (
              <article className={`signalPopupOverlay ${libraryOpenState.id}`}>
                <div className="signalPopupMeta">
                  <span className="signalPopupEyebrow">
                    {libraryOpenState.frequency} · {libraryOpenState.hz}
                  </span>
                  <button
                    type="button"
                    className="signalPopupClose"
                    onClick={() => setLibraryOpenId(null)}
                    aria-label="Close frequency details"
                  >
                    ×
                  </button>
                </div>

                <div className="signalPopupBody">
                  <div>
                    <h3>{libraryOpenState.state}</h3>
                    <p>{libraryOpenState.purpose}</p>
                  </div>

                  <div className="signalPopupTechnical">
                    <span>{libraryOpenState.technical}</span>
                    <span>{libraryOpenState.note}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="signalPopupAction"
                  onClick={() => {
                    setSelectedId(libraryOpenState.id);
                    setLibraryOpenId(null);
                    scrollToBuilder();
                  }}
                >
                  Use this state <span aria-hidden="true">→</span>
                </button>
              </article>
            ) : null}
          </div>
        </article>
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
            <button type="submit" className="primaryButton">
              Join early access →
            </button>
          </form>

          <p className="successMessage" aria-live="polite">
            {waitlistMessage}
          </p>
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
              <span>
                {selectedState.frequency} · {selectedState.hz}
              </span>
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

      <style jsx global>{`
        .fieldLabel {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          color: #ecf7ff;
          font-size: 1rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          font-weight: 900;
        }

        .fieldLabel em {
          color: #8ba4bc;
          font-style: normal;
          font-weight: 600;
          font-size: 0.82em;
        }

        .durationRow button {
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
        }

        .durationRow button.active {
          color: white;
          border-color: rgba(139, 230, 255, 0.72);
          background: linear-gradient(180deg, rgba(74, 145, 197, 0.72), rgba(20, 49, 77, 0.94));
          box-shadow: inset 0 0 0 1px rgba(165, 236, 255, 0.28), 0 18px 34px rgba(24, 86, 129, 0.18);
        }

        .selectionMark {
          opacity: 0;
          pointer-events: none;
          position: absolute;
          top: 12px;
          right: 12px;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid rgba(139, 230, 255, 0.65);
          background: rgba(129, 224, 255, 0.92);
          color: #02101c;
          font-style: normal;
          font-weight: 900;
          transform: scale(0.9);
          transition: opacity 0.18s ease, transform 0.18s ease;
        }

        .stateChoice {
          position: relative;
          overflow: hidden;
        }

        .stateChoice.active .selectionMark {
          opacity: 1;
          transform: scale(1);
        }

        .saveButton {
          border-color: rgba(119, 108, 255, 0.44);
          background: linear-gradient(180deg, rgba(56, 49, 123, 0.94), rgba(35, 29, 82, 0.98));
          color: #e6e2ff;
          box-shadow: inset 0 0 0 1px rgba(140, 134, 255, 0.18), 0 14px 30px rgba(36, 28, 98, 0.24);
        }

        .selectedSummary {
          border-color: rgba(108, 188, 240, 0.18);
          background: linear-gradient(180deg, rgba(8, 22, 39, 0.9), rgba(3, 11, 21, 0.94));
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
        }

        .selectedSummary.alpha,
        .selectedSummary.gamma,
        .selectedSummary.theta,
        .selectedSummary.delta {
          border-color: rgba(117, 216, 255, 0.32);
          background: linear-gradient(180deg, rgba(18, 54, 79, 0.72), rgba(5, 16, 31, 0.95));
          box-shadow: inset 0 0 0 1px rgba(150, 232, 255, 0.08), 0 18px 48px rgba(5, 18, 32, 0.24);
        }

        .selectedSummary.abundance {
          border-color: rgba(216, 176, 106, 0.38);
          background: linear-gradient(180deg, rgba(63, 45, 17, 0.7), rgba(16, 12, 5, 0.96));
          box-shadow: inset 0 0 0 1px rgba(255, 225, 169, 0.06), 0 18px 48px rgba(30, 17, 0, 0.24);
        }

        .selectedSummary.alpha .summaryLabel,
        .selectedSummary.gamma .summaryLabel,
        .selectedSummary.theta .summaryLabel,
        .selectedSummary.delta .summaryLabel {
          color: #8be6ff;
        }

        .selectedSummary.abundance .summaryLabel {
          color: #f2d9a2;
        }

        .signalExperience {
          margin-top: 32px;
          padding: 26px;
          overflow: hidden;
        }

        .signalExperienceTop {
          display: flex;
          justify-content: flex-end;
        }

        .compactHint {
          margin-bottom: 18px;
        }

        .signalStage {
          position: relative;
          min-height: 760px;
          border: 1px solid rgba(108, 188, 240, 0.14);
          border-radius: 30px;
          background:
            radial-gradient(circle at 50% 44%, rgba(40, 101, 153, 0.18), transparent 34%),
            linear-gradient(180deg, rgba(5, 16, 29, 0.7), rgba(3, 11, 20, 0.9));
          overflow: hidden;
        }

        .signalStage::before,
        .signalStage::after {
          content: '';
          position: absolute;
          inset: 11% 18%;
          border-radius: 50%;
          border: 1px solid rgba(117, 216, 255, 0.08);
          pointer-events: none;
        }

        .signalStage::after {
          inset: 20% 28%;
        }

        .signalStage.popupOpen .signalFigureGraphic,
        .signalStage.popupOpen .signalFigureHalo,
        .signalStage.popupOpen .signalSparkles {
          filter: saturate(0.9) brightness(0.92);
        }

        .signalFigure {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .signalFigureHalo {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(117, 216, 255, 0.14);
          filter: drop-shadow(0 0 24px rgba(78, 190, 255, 0.18));
        }

        .haloOuter {
          width: min(36rem, 70%);
          height: min(36rem, 76%);
          animation: signalPulse 6s ease-in-out infinite;
        }

        .haloMid {
          width: min(28rem, 56%);
          height: min(28rem, 62%);
          animation: signalPulse 5.1s ease-in-out infinite reverse;
        }

        .haloInner {
          width: min(21rem, 44%);
          height: min(21rem, 48%);
          animation: signalPulse 4.2s ease-in-out infinite;
        }

        .signalFigureGraphic {
          position: relative;
          width: min(23rem, 74%);
          height: auto;
          animation: signalFloat 6s ease-in-out infinite;
          filter: drop-shadow(0 0 22px rgba(63, 176, 255, 0.18)) drop-shadow(0 0 44px rgba(15, 72, 119, 0.3));
        }

        .signalSparkles {
          position: absolute;
          inset: 0;
        }

        .sparkle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #e8fbff, #96e5ff 62%, rgba(112, 214, 255, 0));
          box-shadow: 0 0 16px rgba(120, 224, 255, 0.55);
          animation: sparklePulse 3.6s ease-in-out infinite;
        }

        .sparkle1 { top: 22%; left: 28%; }
        .sparkle2 { top: 28%; right: 24%; animation-delay: 0.8s; }
        .sparkle3 { top: 43%; left: 22%; animation-delay: 1.6s; }
        .sparkle4 { top: 46%; right: 19%; animation-delay: 0.4s; }
        .sparkle5 { bottom: 28%; left: 27%; animation-delay: 1.2s; }
        .sparkle6 { bottom: 30%; right: 25%; animation-delay: 2s; }
        .sparkle7 { bottom: 18%; left: 44%; animation-delay: 0.9s; }
        .sparkle8 { top: 17%; left: 50%; animation-delay: 2.2s; }

        .signalNode {
          position: absolute;
          z-index: 2;
          min-width: 144px;
          min-height: 110px;
          padding: 1rem 1rem 0.95rem;
          border-radius: 24px;
          border: 1px solid rgba(108, 188, 240, 0.22);
          background: linear-gradient(180deg, rgba(4, 16, 28, 0.92), rgba(2, 10, 20, 0.96));
          text-align: center;
          color: #dceafa;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
          backdrop-filter: blur(12px);
        }

        .signalNode span,
        .signalNode strong {
          display: block;
        }

        .signalNode span {
          font-size: 0.95rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #87d9ff;
          margin-bottom: 10px;
          font-weight: 800;
        }

        .signalNode strong {
          font-size: 1.85rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .signalNode:hover,
        .signalNode.active {
          transform: translateY(-2px);
          border-color: rgba(139, 230, 255, 0.7);
          background: linear-gradient(180deg, rgba(54, 113, 160, 0.9), rgba(11, 26, 48, 0.98));
          box-shadow: 0 20px 40px rgba(7, 30, 52, 0.28), inset 0 0 0 1px rgba(166, 238, 255, 0.18);
        }

        .signalNode.abundance span {
          color: #efd9aa;
        }

        .signalNode.abundance:hover,
        .signalNode.abundance.active {
          border-color: rgba(216, 176, 106, 0.56);
          background: linear-gradient(180deg, rgba(91, 69, 28, 0.94), rgba(20, 14, 7, 0.98));
          box-shadow: 0 20px 40px rgba(30, 18, 3, 0.34), inset 0 0 0 1px rgba(255, 222, 163, 0.14);
        }

        .signalNode.alpha {
          left: 6%;
          top: 10%;
        }

        .signalNode.gamma {
          right: 6%;
          top: 10%;
        }

        .signalNode.delta {
          left: 6%;
          bottom: 22%;
        }

        .signalNode.theta {
          right: 6%;
          bottom: 22%;
        }

        .signalNode.abundance {
          left: 50%;
          bottom: 9%;
          transform: translateX(-50%);
          min-width: 160px;
        }

        .signalNode.abundance:hover,
        .signalNode.abundance.active {
          transform: translateX(-50%) translateY(-2px);
        }

        .signalPopupOverlay {
          position: absolute;
          z-index: 4;
          left: 50%;
          top: 50%;
          width: min(440px, calc(100% - 56px));
          padding: 22px;
          border-radius: 28px;
          border: 1px solid rgba(108, 188, 240, 0.28);
          background: linear-gradient(180deg, rgba(7, 21, 36, 0.96), rgba(4, 11, 22, 0.985));
          box-shadow: 0 28px 80px rgba(2, 10, 21, 0.56), inset 0 0 0 1px rgba(166, 238, 255, 0.06);
          transform: translate(-50%, -50%);
          animation: signalPopupIn 0.26s ease;
          backdrop-filter: blur(18px);
        }

        .signalPopupOverlay.alpha,
        .signalPopupOverlay.gamma,
        .signalPopupOverlay.theta,
        .signalPopupOverlay.delta {
          border-color: rgba(139, 230, 255, 0.34);
        }

        .signalPopupOverlay.abundance {
          border-color: rgba(216, 176, 106, 0.42);
          box-shadow: 0 28px 80px rgba(18, 10, 2, 0.46), inset 0 0 0 1px rgba(255, 222, 163, 0.06);
        }

        .signalPopupMeta {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 18px;
        }

        .signalPopupEyebrow {
          color: #8be6ff;
          font-size: 0.82rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 900;
        }

        .signalPopupOverlay.abundance .signalPopupEyebrow {
          color: #efd9aa;
        }

        .signalPopupClose {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(117, 216, 255, 0.2);
          background: rgba(4, 14, 25, 0.76);
          color: white;
          font-size: 1.7rem;
          line-height: 1;
          display: grid;
          place-items: center;
        }

        .signalPopupBody {
          display: grid;
          gap: 16px;
          margin-top: 16px;
        }

        .signalPopupBody h3 {
          margin: 0 0 10px;
          font-size: clamp(2rem, 4vw, 2.35rem);
          letter-spacing: -0.05em;
          line-height: 0.95;
        }

        .signalPopupBody p {
          margin: 0;
          color: #a7b8cb;
          line-height: 1.75;
          font-size: 1rem;
        }

        .signalPopupTechnical {
          display: grid;
          gap: 8px;
          color: #bfd1e0;
          font-size: 0.92rem;
        }

        .signalPopupAction {
          margin-top: 18px;
          min-height: 54px;
          padding: 0 22px;
          border-radius: 999px;
          border: 1px solid rgba(139, 230, 255, 0.54);
          background: linear-gradient(180deg, rgba(184, 243, 255, 0.96), rgba(123, 216, 255, 0.92));
          color: #03121f;
          font-weight: 900;
        }

        .signalPopupOverlay.abundance .signalPopupAction {
          border-color: rgba(230, 197, 130, 0.46);
          background: linear-gradient(180deg, rgba(241, 215, 158, 0.98), rgba(207, 160, 86, 0.95));
          color: #241300;
        }

        @keyframes signalFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes signalPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        @keyframes sparklePulse {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes signalPopupIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -48%) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @media (max-width: 980px) {
          .signalStage {
            min-height: 740px;
          }
        }

        @media (max-width: 720px) {
          .signalExperience {
            padding: 18px;
          }

          .signalStage {
            min-height: 760px;
          }

          .signalFigureGraphic {
            width: min(20rem, 76%);
          }

          .signalNode {
            min-width: 122px;
            min-height: 98px;
            padding: 0.85rem 0.85rem 0.8rem;
          }

          .signalNode span {
            font-size: 0.86rem;
          }

          .signalNode strong {
            font-size: 1.6rem;
          }

          .signalNode.alpha {
            left: 4.5%;
            top: 10%;
          }

          .signalNode.gamma {
            right: 4.5%;
            top: 10%;
          }

          .signalNode.delta {
            left: 4.5%;
            bottom: 21%;
          }

          .signalNode.theta {
            right: 4.5%;
            bottom: 21%;
          }

          .signalNode.abundance {
            bottom: 7.5%;
          }

          .signalPopupOverlay {
            width: min(420px, calc(100% - 34px));
            top: 52%;
            padding: 20px;
          }

          .selectedSummary {
            grid-template-columns: 1fr;
          }

          .technicalSummary {
            text-align: left;
          }
        }

        @media (max-width: 520px) {
          .fieldLabel {
            font-size: 0.92rem;
            letter-spacing: 0.22em;
          }

          .signalStage {
            min-height: 790px;
          }

          .signalFigureGraphic {
            width: min(18rem, 82%);
          }

          .signalNode {
            min-width: 104px;
            max-width: 41%;
            min-height: 90px;
            border-radius: 20px;
          }

          .signalNode span {
            font-size: 0.72rem;
            letter-spacing: 0.16em;
            margin-bottom: 8px;
          }

          .signalNode strong {
            font-size: 1.42rem;
          }

          .signalNode.alpha {
            left: 4%;
            top: 9%;
          }

          .signalNode.gamma {
            right: 4%;
            top: 9%;
          }

          .signalNode.delta {
            left: 4%;
            bottom: 23%;
          }

          .signalNode.theta {
            right: 4%;
            bottom: 23%;
          }

          .signalNode.abundance {
            min-width: 136px;
            bottom: 8%;
          }

          .signalPopupOverlay {
            width: calc(100% - 28px);
            top: 50%;
            padding: 18px;
          }

          .signalPopupBody h3 {
            font-size: 1.82rem;
          }

          .signalPopupBody p {
            font-size: 0.96rem;
            line-height: 1.7;
          }
        }
      `}</style>
    </main>
  );
}
