'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';

const featureCards = [
  {
    eyebrow: '01 · PLAN',
    title: 'Plan with breathing room',
    text: 'Organize classes, shifts and deadlines without turning your week into a wall of pressure.'
  },
  {
    eyebrow: '02 · FOCUS',
    title: 'Start the right session',
    text: 'Pair your task with a calmer atmosphere like Alpha, Gamma, Theta, Delta or 888.'
  },
  {
    eyebrow: '03 · ADAPT',
    title: 'Reset when life changes',
    text: 'When the day moves, the plan can move too. Everlasting Voyage keeps momentum without guilt.'
  }
];

const frequencies = [
  ['Alpha', '10 Hz', 'Calm concentration'],
  ['Gamma', '40 Hz', 'Deep focus'],
  ['Theta', '4 Hz', 'Creative flow'],
  ['Delta', '2 Hz', 'Deep sleep'],
  ['888', 'Hz', 'Abundance']
];

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.body.classList.toggle('locked', !entered);
    return () => document.body.classList.remove('locked');
  }, [entered]);

  const joinWaitlist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim().toLowerCase();
    if (!email) return;

    const existing = JSON.parse(localStorage.getItem('ev-waitlist') || '[]') as string[];
    if (!existing.includes(email)) {
      existing.push(email);
      localStorage.setItem('ev-waitlist', JSON.stringify(existing));
    }

    form.reset();
    setMessage('You are on the early access list.');
  };

  return (
    <>
      <div className={`intro ${entered ? 'introExit' : ''}`}>
        <div className="introAura" />
        <div className="introContent">
          <div className="introLogoWrap">
            <span className="freqLabel topLeft">Gamma · 40 Hz</span>
            <span className="freqLabel topRight">Delta · 2 Hz</span>
            <span className="freqLabel bottomLeft">Alpha · 10 Hz</span>
            <span className="freqLabel bottomRight">Theta · 4 Hz</span>
            <Image
              src="/brand-infinity.png"
              alt="Everlasting Voyage infinity logo"
              width={1024}
              height={1024}
              priority
              className="introInfinity"
            />
          </div>

          <Image
            src="/brand-wordmark.png"
            alt="Everlasting Voyage"
            width={1536}
            height={1024}
            priority
            className="introWordmark"
          />

          <p className="introTagline">Focus · Meditation · Brainwave Sync</p>

          <button className="enterButton" onClick={() => setEntered(true)}>
            Enter
          </button>
        </div>
      </div>

      <div className={`siteShell ${entered ? 'siteReady' : ''}`}>
        <header className="topbar">
          <a href="#top" className="miniBrand" aria-label="Everlasting Voyage home">
            <Image src="/brand-infinity.png" alt="" width={1024} height={1024} className="miniInfinity" />
            <div className="miniText">
              <span>Everlasting</span>
              <strong>Voyage</strong>
            </div>
          </a>

          <nav className="navLinks">
            <a href="#experience">Experience</a>
            <a href="#frequencies">Frequencies</a>
            <a href="#join">Early Access</a>
          </nav>

          <a href="#join" className="navButton">Join Early Access</a>
        </header>

        <main id="top">
          <section className="heroSection">
            <div className="heroGlow heroGlowOne" />
            <div className="heroGlow heroGlowTwo" />

            <div className="heroInner">
              <div className="eyebrow">A calmer digital experience</div>

              <Image
                src="/brand-infinity.png"
                alt=""
                width={1024}
                height={1024}
                className="heroInfinity"
                priority
              />

              <Image
                src="/brand-wordmark.png"
                alt="Everlasting Voyage"
                width={1536}
                height={1024}
                className="heroWordmark"
              />

              <p className="heroCopy">
                A cleaner, brand-first home for focus, meditation and brainwave sync — built to feel calm on desktop and mobile.
              </p>

              <div className="heroActions">
                <a href="#experience" className="primaryButton">See the experience</a>
                <a href="#join" className="secondaryButton">Join early access</a>
              </div>
            </div>
          </section>

          <section className="contentSection" id="experience">
            <div className="sectionHeader">
              <p className="eyebrow">Experience</p>
              <h2>Branding first. Less clutter. More calm.</h2>
              <p className="sectionCopy">
                The experience should feel premium and focused: real brand assets, more negative space, smoother motion and a cleaner story.
              </p>
            </div>

            <div className="featureGrid">
              {featureCards.map((card) => (
                <article className="featureCard" key={card.title}>
                  <p className="cardEyebrow">{card.eyebrow}</p>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="contentSection" id="frequencies">
            <div className="sectionHeader narrow">
              <p className="eyebrow">Frequency library</p>
              <h2>Choose the atmosphere that fits the moment.</h2>
            </div>

            <div className="frequencyGrid">
              {frequencies.map(([name, hz, desc]) => (
                <article className={`frequencyCard ${name === '888' ? 'goldCard' : ''}`} key={name}>
                  <strong>{name}</strong>
                  <span>{hz}</span>
                  <p>{desc}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="contentSection joinSection" id="join">
            <div className="sectionHeader narrow centered">
              <p className="eyebrow">Early access</p>
              <h2>Enter the voyage.</h2>
              <p className="sectionCopy">
                Join the first users and follow the evolution of the Everlasting Voyage web experience.
              </p>
            </div>

            <form className="waitlistForm" onSubmit={joinWaitlist}>
              <input type="email" name="email" placeholder="Your email address" required />
              <button type="submit" className="primaryButton">Join early access</button>
            </form>
            <p className="successMessage">{message}</p>
          </section>
        </main>
      </div>
    </>
  );
}
