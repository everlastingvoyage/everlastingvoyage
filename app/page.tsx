'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

type FrequencyId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';

type Frequency = {
  id: FrequencyId;
  name: string;
  hz: string;
  tag: string;
  summary: string;
  detail: string;
  uses: string[];
};

const frequencies: Frequency[] = [
  {
    id: 'alpha',
    name: 'Alpha',
    hz: '10 Hz',
    tag: 'Calm Focus',
    summary: 'A softer starting point for steady concentration and low-pressure clarity.',
    detail: 'Best for studying, reading, planning and entering work gently without mental noise.',
    uses: ['Study', 'Planning', 'Morning clarity']
  },
  {
    id: 'gamma',
    name: 'Gamma',
    hz: '40 Hz',
    tag: 'Deep Focus',
    summary: 'A sharper state with more intensity for full mental engagement.',
    detail: 'Designed for demanding sessions, higher attention work and longer focus windows.',
    uses: ['Deep work', 'Research', 'High attention']
  },
  {
    id: 'theta',
    name: 'Theta',
    hz: '4 Hz',
    tag: 'Creative Flow',
    summary: 'A more fluid mode for reflection, ideas, visualization and inner space.',
    detail: 'Useful when the session should feel imaginative, reflective and less structured.',
    uses: ['Meditation', 'Creativity', 'Journaling']
  },
  {
    id: 'delta',
    name: 'Delta',
    hz: '2 Hz',
    tag: 'Deep Sleep',
    summary: 'A slower atmosphere dedicated to release, recovery and night rituals.',
    detail: 'Built for wind-down sessions, decompression and transitions into sleep.',
    uses: ['Sleep', 'Recovery', 'Night routine']
  },
  {
    id: 'abundance',
    name: '888',
    hz: '888 Hz',
    tag: 'Abundance',
    summary: 'A brighter ceremonial state with a richer tone and elevated energy.',
    detail: 'Made for visualization, abundance rituals and more intentional mindset work.',
    uses: ['Manifestation', 'Confidence', 'Energy reset']
  }
];

const promiseCards = [
  {
    title: 'Premium atmosphere',
    text: 'A darker navy system, cleaner spacing and restrained glow give the product a more elevated presence.'
  },
  {
    title: 'Horizontal rhythm',
    text: 'Wider compositions reduce visual fatigue and make the page easier to scan from left to right.'
  },
  {
    title: 'Clearer sections',
    text: 'Every block now has a more defined role so the story feels ordered instead of cluttered.'
  },
  {
    title: 'Brand as entity',
    text: 'The product is presented as Everlasting Voyage itself, not as a personal dashboard or profile.'
  }
];

function BrainVisual({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 620 430" className={className} aria-hidden="true" fill="none">
      <ellipse cx="310" cy="216" rx="186" ry="124" fill="var(--brain-fill)" opacity="0.72" />
      <ellipse cx="310" cy="216" rx="220" ry="150" stroke="var(--brain-outline-soft)" strokeWidth="1.5" />
      <ellipse cx="310" cy="216" rx="160" ry="104" stroke="var(--brain-outline-soft)" strokeWidth="1" opacity="0.75" />

      <path
        d="M301 106C270 72 214 67 171 92C123 120 107 173 126 217C102 253 109 312 149 343C191 374 245 371 288 338C309 322 319 301 319 274"
        stroke="var(--brain-main)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M319 106C350 72 406 67 449 92C497 120 513 173 494 217C518 253 511 312 471 343C429 374 375 371 332 338C311 322 301 301 301 274"
        stroke="var(--brain-main)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path d="M309 138V286" stroke="var(--brain-soft)" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
      <circle cx="310" cy="216" r="11" fill="var(--brain-soft)" />

      <path d="M286 138C257 124 224 126 198 143" stroke="var(--brain-soft)" strokeWidth="5" strokeLinecap="round" />
      <path d="M274 177C243 164 208 166 182 188" stroke="var(--brain-soft)" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      <path d="M274 218C242 210 212 214 188 235" stroke="var(--brain-soft)" strokeWidth="5" strokeLinecap="round" opacity="0.82" />
      <path d="M286 258C256 260 229 273 208 295" stroke="var(--brain-soft)" strokeWidth="5" strokeLinecap="round" opacity="0.78" />

      <path d="M334 138C363 124 396 126 422 143" stroke="var(--brain-soft)" strokeWidth="5" strokeLinecap="round" />
      <path d="M346 177C377 164 412 166 438 188" stroke="var(--brain-soft)" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      <path d="M346 218C378 210 408 214 432 235" stroke="var(--brain-soft)" strokeWidth="5" strokeLinecap="round" opacity="0.82" />
      <path d="M334 258C364 260 391 273 412 295" stroke="var(--brain-soft)" strokeWidth="5" strokeLinecap="round" opacity="0.78" />
    </svg>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<FrequencyId>('alpha');
  const [message, setMessage] = useState('');

  const activeFrequency = useMemo(
    () => frequencies.find((item) => item.id === selected) ?? frequencies[0],
    [selected]
  );

  const joinWaitlist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') || '')
      .trim()
      .toLowerCase();

    if (!email) return;

    const current = JSON.parse(localStorage.getItem('ev-waitlist') || '[]') as string[];
    if (!current.includes(email)) {
      current.push(email);
      localStorage.setItem('ev-waitlist', JSON.stringify(current));
    }

    form.reset();
    setMessage('You are on the early access list.');
  };

  return (
    <main className="pageShell" id="top">
      <div className="pageNoise" />
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />

      <header className="topbar">
        <a href="#top" className="brandLockup" aria-label="Everlasting Voyage home">
          <img src="/brand-infinity.png" alt="Everlasting Voyage infinity logo" className="brandMark" />
          <img src="/brand-wordmark.png" alt="Everlasting Voyage" className="brandWordmarkSmall" />
        </a>

        <nav className="navLinks">
          <a href="#experience">Experience</a>
          <a href="#frequencies">Frequencies</a>
          <a href="#join">Early Access</a>
        </nav>

        <a href="#join" className="navButton">
          Join Early Access
        </a>
      </header>

      <section className="heroSection">
        <div className="heroGrid">
          <div className="heroCopyCol">
            <p className="eyebrow">Immersive focus · meditation · brainwave sync</p>
            <h1>One clear next step, without the pressure.</h1>
            <p className="heroCopy">
              Everlasting Voyage is a premium digital atmosphere built around focus, meditation and guided brainwave states.
              Less noise. Better attention. A more cinematic ritual.
            </p>

            <div className="heroActions">
              <a href="#frequencies" className="primaryButton">
                Enter the experience
              </a>
              <a href="#experience" className="secondaryButton">
                View the system
              </a>
            </div>

            <div className="heroPills">
              {frequencies.map((item) => (
                <span key={item.id} className={`heroPill ${item.id === 'abundance' ? 'gold' : ''}`}>
                  {item.name} · {item.hz}
                </span>
              ))}
            </div>
          </div>

          <article className="glassCard heroPreviewCard">
            <div className="previewHead">
              <span>Everlasting Voyage signal preview</span>
              <strong>Five guided states</strong>
            </div>

            <BrainVisual className="heroBrainVisual" />

            <div className="previewFoot">
              <div>
                <span className="miniLabel">Design language</span>
                <p>Quiet, premium, immersive</p>
              </div>
              <div>
                <span className="miniLabel">Core modes</span>
                <p>Focus, rest, creativity, abundance</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section sectionSeparated" id="experience">
        <div className="sectionHeaderSplit">
          <div>
            <p className="eyebrow">A clearer product story</p>
            <h2>Cleaner sections, less clutter, more identity.</h2>
          </div>
          <p className="sectionCopy compact">
            Everlasting Voyage should read like a premium entity. The layout stays wider, the hierarchy stays calmer and the message stays easier to absorb.
          </p>
        </div>

        <div className="promiseGrid">
          {promiseCards.map((item) => (
            <article className="glassCard promiseCard" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section sectionSeparated" id="frequencies">
        <div className="sectionHeaderSplit">
          <div>
            <p className="eyebrow">Everlasting Voyage library</p>
            <h2>Choose how the session should feel.</h2>
          </div>
          <p className="sectionCopy compact">
            The experience remains quiet while the selected state becomes the hero. Shorter copy, stronger visuals and a more horizontal composition keep the page easier to navigate.
          </p>
        </div>

        <div className="frequencyRail" role="tablist" aria-label="Frequency options">
          {frequencies.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`frequencyRailItem ${item.id} ${selected === item.id ? 'active' : ''}`}
              onClick={() => setSelected(item.id)}
            >
              <span className="railMeta">{item.hz}</span>
              <strong>{item.name}</strong>
              <p>{item.tag}</p>
            </button>
          ))}
        </div>

        <article className={`glassCard stageCard ${activeFrequency.id}`}>
          <div className="stageCopyCol">
            <div className="stageLabelRow">
              <span>{activeFrequency.name}</span>
              <strong>{activeFrequency.hz}</strong>
            </div>

            <h3>{activeFrequency.tag}</h3>
            <p className="stageLead">{activeFrequency.summary}</p>
            <p className="stageDetail">{activeFrequency.detail}</p>

            <div className="chipRow">
              {activeFrequency.uses.map((chip) => (
                <span className="benefitChip" key={chip}>
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="stageVisualCol">
            <span className="stageOrbit stageOrbitTopLeft">Brainwave sync</span>
            <span className="stageOrbit stageOrbitTopRight">Focused immersion</span>
            <span className="stageOrbit stageOrbitBottomLeft">Calmer interface</span>
            <span className="stageOrbit stageOrbitBottomRight">Premium atmosphere</span>
            <BrainVisual className="stageBrainVisual" />
          </div>
        </article>
      </section>

      <section className="section sectionSeparated joinSection" id="join">
        <article className="glassCard joinCard">
          <div className="joinText">
            <p className="eyebrow">Early access</p>
            <h2>Enter the voyage.</h2>
            <p>
              Follow the evolution of Everlasting Voyage and be among the first to experience a more polished, more immersive and more refined release.
            </p>
          </div>

          <form className="waitlistForm" onSubmit={joinWaitlist}>
            <input type="email" name="email" placeholder="Your email address" required aria-label="Email address" />
            <button type="submit" className="primaryButton">
              Join early access
            </button>
          </form>

          <p className="successMessage" aria-live="polite">
            {message}
          </p>
        </article>
      </section>
    </main>
  );
}
