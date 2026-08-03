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
                <i className="selectionMark" aria-hidden="true">
                  ✓
                </i>
              </button>
            ))}
          </div>

          <div className="builderLower">
            <div className="durationBlock">
              <span className="fieldLabel">
                Set your time
              </span>
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
            Tap a frequency around the signal figure to inspect the tone, intended use and headphone guidance before you begin.
          </p>
        </div>

        <article className="signalExperience glassCard">
          <div className="signalExperienceTop">
            <div className="carouselHint compactHint" aria-hidden="true">
              <span>Tap a frequency to expand the signal</span>
              <span className="hintArrow">→</span>
            </div>
          </div>

          <div className="signalStage" aria-label="Interactive frequency map">
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
              <div className="signalFigureHalo haloInner" />
              <div className="signalHumanoid">
                <span className="signalHumanoidHead" />
                <span className="signalHumanoidBody" />
                <span className="signalHumanoidAura" />
              </div>
            </div>
          </div>

          {libraryOpenState ? (
            <article className={`signalPopupCard ${libraryOpenState.id}`}>
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
          ) : (
            <div className="signalPlaceholder">
              <span className="summaryLabel">Signal preview</span>
              <strong>Select a frequency around the figure</strong>
              <p>The signal expands here with its purpose, technical details and a direct shortcut back into the builder.</p>
            </div>
          )}
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
          gap: 10px;
          margin-bottom: 12px;
          color: #d9ebf8;
          font-size: 0.9rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 900;
        }

        .fieldLabel em {
          color: #8ba4bc;
          font-style: normal;
          font-weight: 600;
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
          background: rgba(129, 224, 255, 0.9);
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
          min-height: 380px;
          border: 1px solid rgba(108, 188, 240, 0.14);
          border-radius: 28px;
          background:
            radial-gradient(circle at center, rgba(42, 101, 148, 0.18), transparent 42%),
            linear-gradient(180deg, rgba(5, 16, 29, 0.7), rgba(3, 11, 20, 0.88));
          overflow: hidden;
        }

        .signalStage::before,
        .signalStage::after {
          content: '';
          position: absolute;
          inset: 12% 18%;
          border-radius: 50%;
          border: 1px solid rgba(117, 216, 255, 0.08);
          pointer-events: none;
        }

        .signalStage::after {
          inset: 22% 30%;
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
          width: min(24rem, 68%);
          height: min(24rem, 68%);
          animation: signalPulse 5.4s ease-in-out infinite;
        }

        .haloInner {
          width: min(17rem, 48%);
          height: min(17rem, 48%);
          animation: signalPulse 4.2s ease-in-out infinite reverse;
        }

        .signalHumanoid {
          position: relative;
          width: 172px;
          height: 228px;
          animation: signalFloat 5.5s ease-in-out infinite;
        }

        .signalHumanoidHead {
          position: absolute;
          top: 20px;
          left: 50%;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle at 35% 30%, #d8f8ff, #78d7ff 62%, #2d7eb8 100%);
          box-shadow: 0 0 22px rgba(111, 214, 255, 0.42);
        }

        .signalHumanoidBody {
          position: absolute;
          left: 50%;
          top: 70px;
          width: 92px;
          height: 126px;
          border-radius: 999px 999px 34px 34px;
          transform: translateX(-50%);
          background: linear-gradient(180deg, rgba(145, 229, 255, 0.95), rgba(46, 122, 188, 0.82));
          box-shadow: 0 0 24px rgba(77, 191, 255, 0.26);
          clip-path: polygon(25% 0%, 75% 0%, 89% 26%, 76% 100%, 24% 100%, 11% 26%);
        }

        .signalHumanoidAura {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: radial-gradient(circle at center, rgba(74, 188, 255, 0.26), transparent 62%);
          filter: blur(20px);
        }

        .signalNode {
          position: absolute;
          min-width: 120px;
          padding: 0.9rem 1rem;
          border-radius: 20px;
          border: 1px solid rgba(108, 188, 240, 0.18);
          background: rgba(3, 13, 25, 0.92);
          text-align: left;
          color: #dceafa;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }

        .signalNode span,
        .signalNode strong {
          display: block;
        }

        .signalNode span {
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #87d9ff;
          margin-bottom: 8px;
        }

        .signalNode strong {
          font-size: 1rem;
          font-weight: 800;
        }

        .signalNode:hover,
        .signalNode.active {
          transform: translateY(-2px);
          border-color: rgba(139, 230, 255, 0.62);
          background: linear-gradient(180deg, rgba(42, 94, 135, 0.84), rgba(10, 24, 43, 0.96));
          box-shadow: 0 20px 40px rgba(7, 30, 52, 0.28), inset 0 0 0 1px rgba(166, 238, 255, 0.18);
        }

        .signalNode.abundance span {
          color: #efd9aa;
        }

        .signalNode.abundance:hover,
        .signalNode.abundance.active {
          border-color: rgba(216, 176, 106, 0.5);
          background: linear-gradient(180deg, rgba(91, 69, 28, 0.92), rgba(20, 14, 7, 0.98));
          box-shadow: 0 20px 40px rgba(30, 18, 3, 0.34), inset 0 0 0 1px rgba(255, 222, 163, 0.14);
        }

        .signalNode.alpha {
          left: 7%;
          top: 16%;
        }

        .signalNode.gamma {
          right: 7%;
          top: 16%;
        }

        .signalNode.theta {
          right: 10%;
          bottom: 24%;
        }

        .signalNode.delta {
          left: 10%;
          bottom: 24%;
        }

        .signalNode.abundance {
          left: 50%;
          bottom: 8%;
          transform: translateX(-50%);
        }

        .signalNode.abundance:hover,
        .signalNode.abundance.active {
          transform: translateX(-50%) translateY(-2px);
        }

        .signalPopupCard,
        .signalPlaceholder {
          margin-top: 18px;
          padding: 22px;
          border-radius: 24px;
          border: 1px solid rgba(108, 188, 240, 0.18);
          background: linear-gradient(180deg, rgba(8, 21, 36, 0.94), rgba(4, 11, 22, 0.98));
        }

        .signalPopupCard.alpha,
        .signalPopupCard.gamma,
        .signalPopupCard.theta,
        .signalPopupCard.delta {
          border-color: rgba(139, 230, 255, 0.34);
          box-shadow: inset 0 0 0 1px rgba(150, 232, 255, 0.08), 0 18px 42px rgba(6, 20, 35, 0.24);
        }

        .signalPopupCard.abundance {
          border-color: rgba(216, 176, 106, 0.38);
          box-shadow: inset 0 0 0 1px rgba(255, 222, 163, 0.06), 0 18px 42px rgba(30, 18, 3, 0.24);
        }

        .signalPopupMeta {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 18px;
        }

        .signalPopupEyebrow {
          color: #8be6ff;
          font-size: 0.78rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 800;
        }

        .signalPopupCard.abundance .signalPopupEyebrow {
          color: #efd9aa;
        }

        .signalPopupClose {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(117, 216, 255, 0.2);
          background: rgba(4, 14, 25, 0.76);
          color: white;
          font-size: 1.5rem;
          line-height: 1;
        }

        .signalPopupBody {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          margin-top: 16px;
          align-items: end;
        }

        .signalPopupBody h3 {
          margin: 0 0 8px;
          font-size: 1.9rem;
          letter-spacing: -0.04em;
        }

        .signalPopupBody p {
          margin: 0;
          color: #9fb0c2;
          line-height: 1.7;
        }

        .signalPopupTechnical {
          display: grid;
          gap: 8px;
          text-align: right;
          color: #aebed0;
          font-size: 0.86rem;
        }

        .signalPopupAction {
          margin-top: 18px;
          min-height: 52px;
          padding: 0 22px;
          border-radius: 999px;
          border: 1px solid rgba(139, 230, 255, 0.54);
          background: linear-gradient(180deg, rgba(184, 243, 255, 0.96), rgba(123, 216, 255, 0.92));
          color: #03121f;
          font-weight: 800;
        }

        .signalPlaceholder strong {
          display: block;
          margin-top: 8px;
          font-size: 1.1rem;
        }

        .signalPlaceholder p {
          margin: 8px 0 0;
          color: #9fb0c2;
          line-height: 1.65;
        }

        @keyframes signalFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
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

        @media (max-width: 980px) {
          .signalStage {
            min-height: 460px;
          }

          .signalPopupBody {
            grid-template-columns: 1fr;
          }

          .signalPopupTechnical {
            text-align: left;
          }
        }

        @media (max-width: 720px) {
          .signalExperience {
            padding: 18px;
          }

          .signalStage {
            min-height: 580px;
          }

          .signalHumanoid {
            width: 132px;
            height: 188px;
          }

          .signalHumanoidHead {
            width: 36px;
            height: 36px;
          }

          .signalHumanoidBody {
            top: 58px;
            width: 74px;
            height: 104px;
          }

          .signalNode {
            min-width: 118px;
            padding: 0.8rem 0.85rem;
          }

          .signalNode.alpha {
            left: 5%;
            top: 10%;
          }

          .signalNode.gamma {
            right: 5%;
            top: 10%;
          }

          .signalNode.delta {
            left: 5%;
            bottom: 28%;
          }

          .signalNode.theta {
            right: 5%;
            bottom: 28%;
          }

          .signalNode.abundance {
            bottom: 8%;
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
            font-size: 0.82rem;
          }

          .signalStage {
            min-height: 620px;
          }

          .signalNode {
            min-width: 100px;
            max-width: 42%;
          }

          .signalNode span {
            font-size: 0.68rem;
            letter-spacing: 0.14em;
          }

          .signalNode strong {
            font-size: 0.92rem;
          }

          .signalNode.alpha {
            left: 4%;
            top: 8%;
          }

          .signalNode.gamma {
            right: 4%;
            top: 8%;
          }

          .signalNode.delta {
            left: 4%;
            bottom: 28%;
          }

          .signalNode.theta {
            right: 4%;
            bottom: 28%;
          }

          .signalNode.abundance {
            bottom: 7%;
          }
        }
      `}</style>
    </main>
  );
}
