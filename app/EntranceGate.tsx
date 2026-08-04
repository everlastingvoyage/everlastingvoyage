'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function EntranceGate() {
  const pathname = usePathname();
  const visible = pathname === '/';

  useEffect(() => {
    if (!visible) return;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const viewport = window.visualViewport;

    const previous = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyPosition: body.style.position,
      bodyInset: body.style.inset,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height
    };

    const syncViewportHeight = () => {
      const visibleHeight = viewport?.height ?? window.innerHeight;
      html.style.setProperty('--ev-entrance-vh', `${Math.round(visibleHeight)}px`);
    };

    syncViewportHeight();
    html.classList.add('ev-entrance-open');
    body.classList.add('ev-entrance-open');

    html.style.overflow = 'hidden';
    html.style.height = '100%';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.style.position = 'fixed';
    body.style.inset = '0';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.height = '100%';

    viewport?.addEventListener('resize', syncViewportHeight);
    viewport?.addEventListener('scroll', syncViewportHeight);
    window.addEventListener('orientationchange', syncViewportHeight);

    return () => {
      viewport?.removeEventListener('resize', syncViewportHeight);
      viewport?.removeEventListener('scroll', syncViewportHeight);
      window.removeEventListener('orientationchange', syncViewportHeight);

      html.classList.remove('ev-entrance-open');
      body.classList.remove('ev-entrance-open');
      html.style.removeProperty('--ev-entrance-vh');

      html.style.overflow = previous.htmlOverflow;
      html.style.height = previous.htmlHeight;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.bodyOverscroll;
      body.style.position = previous.bodyPosition;
      body.style.inset = previous.bodyInset;
      body.style.top = previous.bodyTop;
      body.style.width = previous.bodyWidth;
      body.style.height = previous.bodyHeight;

      window.scrollTo(0, scrollY);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <section className="evEntrance" aria-label="Enter Everlasting Voyage">
      <div className="evEntranceNoise" aria-hidden="true" />
      <div className="evEntranceAura evEntranceAuraOne" aria-hidden="true" />
      <div className="evEntranceAura evEntranceAuraTwo" aria-hidden="true" />

      <header className="evEntranceHeader">
        <div className="evEntranceBrand">
          <img src="/brand-infinity.png" alt="" className="evEntranceMark" />
          <img src="/brand-wordmark.png" alt="Everlasting Voyage" className="evEntranceWordmark" />
        </div>
        <a href="/voyage#about" className="evEntranceAbout">About</a>
      </header>

      <div className="evEntranceContent">
        <p className="eyebrow">Pure frequencies · immersive focus sessions</p>
        <h1>Choose your state.<br />Set your time.<br />Enter the voyage.</h1>
        <p className="evEntranceCopy">
          A focused environment for pure signals, intentional sessions and a quieter way to enter deep work, creativity or rest.
        </p>

        <div className="evEntranceActions">
          <a href="/voyage" className="evEntrancePrimary">
            Enter the voyage <span aria-hidden="true">→</span>
          </a>
          <a href="/voyage#library" className="evEntranceSecondary">
            Explore frequencies <span aria-hidden="true">↘</span>
          </a>
        </div>

        <div className="evEntranceTrust" aria-label="Product principles">
          <span>No account required</span>
          <span>Transparent frequencies</span>
          <span>Built for headphones</span>
        </div>
      </div>

      <footer className="evEntranceFooter">
        <span>Everlasting Voyage</span>
        <span>Choose your state · Set your time · Enter the voyage</span>
      </footer>
    </section>
  );
}
