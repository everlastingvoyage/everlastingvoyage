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
  benefits: string[];
};

const frequencies: Frequency[] = [
  {
    id: 'alpha',
    name: 'Alpha',
    hz: '10 Hz',
    tag: 'Calm Focus',
    summary: 'A softer starting point for studying, planning, reading and steady attention.',
    detail:
      'Alpha is designed for the kind of work that should feel clear instead of frantic — ideal for class prep, admin tasks and quiet concentration.',
    benefits: ['Study sessions', 'Morning clarity', 'Low-pressure deep work']
  },
  {
    id: 'gamma',
    name: 'Gamma',
    hz: '40 Hz',
    tag: 'Deep Focus',
    summary: 'More intensity, more presence, and a sharper atmosphere for demanding mental work.',
    detail:
      'Gamma fits when you need full cognitive engagement — extended review, harder problem solving, research or focused production.',
    benefits: ['Exam review', 'Research blocks', 'Focused production']
  },
  {
    id: 'theta',
    name: 'Theta',
    hz: '4 Hz',
    tag: 'Creative Flow',
    summary: 'A more fluid, reflective mode for writing, ideation, visualization and slower thinking.',
    detail:
      'Theta is for the sessions that need imagination and space: journaling, sketching ideas, meditating or moving through a calmer flow state.',
    benefits: ['Writing flow', 'Meditation', 'Creative ideation']
  },
  {
    id: 'delta',
    name: 'Delta',
    hz: '2 Hz',
    tag: 'Deep Sleep',
    summary: 'A slower, darker atmosphere built to support decompression, recovery and night sessions.',
    detail:
      'Delta is reserved for bedtime, sleep support and full unwind mode — less stimulation, fewer visual distractions, more spacious calm.',
    benefits: ['Sleep rituals', 'Recovery', 'Night routine']
  },
  {
    id: 'abundance',
    name: '888',
    hz: '888 Hz',
    tag: 'Abundance',
    summary: 'A ceremonial atmosphere with brighter energy for manifestation, confidence and momentum.',
    detail:
      'The 888 space feels a little richer and more elevated — still on brand, but tuned to visualization, abundance and intentional repetition.',
    benefits: ['Manifestation', 'Confidence', 'Energy reset']
  }
];

const timeline = [
  ['9:00 AM', 'Consumer Behaviour', 'Fixed class commitment'],
  ['12:10 PM', 'Finance review · 40 minutes', 'Suggested focus window'],
  ['2:00 PM', 'Best Buy shift', 'Protected work block'],
  ['7:30 PM', 'Light review · 20 minutes', 'A realistic next step'],
  ['10:30 PM', 'Sleep protected', 'No tasks after this time']
] as const;

const immersionCards = [
  {
    title: 'Brand-first atmosphere',
    text: 'Real Everlasting Voyage branding, richer glow work, a darker palette and cleaner motion that feels intentional instead of generic.'
  },
  {
    title: 'Less pressure, more direction',
    text: 'The experience guides you into the right session without turning your day into a wall of aggressive productivity.'
  },
  {
    title: 'Built like an experience',
    text: 'This should feel closer to a premium product launch than a rough planner — cinematic, calm and immersive from the first second.'
  }
];

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
              Everlasting Voyage turns classes, shifts and deadlines into a calmer digital experience — a premium space
              for planning, focusing, meditating and entering the right state of mind.
            </p>

            <div className="heroActions">
              <a href="#experience" className="primaryButton">
                Enter the experience
              </a>
              <a href="#frequencies" className="secondaryButton">
                Explore frequencies
              </a>
            </div>

            <div className="heroStats">
              <div>
                <strong>5</strong>
                <span>Core frequency spaces</span>
              </div>
              <div>
                <strong>01</strong>
                <span>Immersive product story</span>
              </div>
              <div>
                <strong>∞</strong>
                <span>Brand-led identity</span>
              </div>
            </div>
          </div>

          <div className="heroVisualCol">
            <div className="signalField">
              <span className="signalLabel signalTopLeft">Gamma · 40 Hz</span>
              <span className="signalLabel signalTopRight">Delta · 2 Hz</span>
              <span className="signalLabel signalBottomLeft">Alpha · 10 Hz</span>
              <span className="signalLabel signalBottomRight">Theta · 4 Hz</span>

              <div className="signalRing signalRingOne" />
              <div className="signalRing signalRingTwo" />
              <div className="signalCoreGlow" />

              <img src="/brand-infinity.png" alt="Everlasting Voyage energy mark" className="heroInfinity" />
            </div>

            <div className="heroBrandPanel">
              <img src="/brand-wordmark.png" alt="Everlasting Voyage" className="heroWordmark" />
              <p>Focus · Meditation · Brainwave Sync</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section experienceSection" id="experience">
        <div className="sectionHeader">
          <p className="eyebrow">A calmer system for real life</p>
          <h2>Productivity without the clutter.</h2>
          <p className="sectionCopy">
            The page should not feel generic or unfinished. It should feel premium, intentional and alive — with a cleaner
            structure, stronger branding and a sense of immersion from the first scroll.
          </p>
        </div>

        <div className="experienceGrid">
          <article className="glassCard timelineCard">
            <div className="cardHeader">
              <span>Sample flow</span>
              <strong>One clear next step</strong>
            </div>

            <div className="timelineList">
              {timeline.map(([time, title, detail]) => (
                <div className="timelineItem" key={time + title}>
                  <div className="timelineTime">{time}</div>
                  <div className="timelineDot" />
                  <div className="timelineContent">
                    <h3>{title}</h3>
                    <p>{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="immersionStack">
            {immersionCards.map((item) => (
              <article className="glassCard featureCard" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section frequenciesSection" id="frequencies">
        <div className="sectionHeader narrow">
          <p className="eyebrow">Everlasting Voyage library</p>
          <h2>Choose how the session should feel.</h2>
          <p className="sectionCopy">
            Each frequency space carries its own atmosphere. The interface stays quiet — only the selected state comes alive.
          </p>
        </div>

        <div className="libraryLayout">
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
            <div className="stageBackground stageBackgroundOne" />
            <div className="stageBackground stageBackgroundTwo" />

            <div className="stageLabelRow">
              <span>{activeFrequency.name}</span>
              <strong>{activeFrequency.hz}</strong>
            </div>

            <div className="stageVisualWrap">
              <span className="stageOrbit stageOrbitTopLeft">Brainwave sync</span>
              <span className="stageOrbit stageOrbitTopRight">Focused immersion</span>
              <span className="stageOrbit stageOrbitBottomLeft">Calmer interface</span>
              <span className="stageOrbit stageOrbitBottomRight">Premium atmosphere</span>

              <img src="/brand-infinity.png" alt="Everlasting Voyage symbol" className="stageInfinity" />
            </div>

            <div className="stageBody">
              <h3>{activeFrequency.tag}</h3>
              <p className="stageLead">{activeFrequency.summary}</p>
              <p className="stageDetail">{activeFrequency.detail}</p>

              <div className="chipRow">
                {activeFrequency.benefits.map((chip) => (
                  <span className="benefitChip" key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section showcaseSection">
        <div className="showcasePanel glassCard">
          <div className="showcaseText">
            <p className="eyebrow">What this should feel like</p>
            <h2>Not another page. An actual arrival.</h2>
            <p>
              Darker background. Stronger blue energy. Better proportions. Better typography. More depth. More calm. More
              confidence. The kind of product page that feels intentional before the user even clicks anything.
            </p>
          </div>

          <div className="quoteCard">
            <span className="quoteSymbol">∞</span>
            <p>
              “The experience should feel premium, immersive and alive — never cluttered, never generic, never cringe.”
            </p>
          </div>
        </div>
      </section>

      <section className="section joinSection" id="join">
        <article className="joinCard glassCard">
          <div className="joinText">
            <p className="eyebrow">Early access</p>
            <h2>Enter the voyage.</h2>
            <p>
              Follow the evolution of Everlasting Voyage and be among the first to try the experience as it becomes more immersive,
              more polished and more powerful.
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
