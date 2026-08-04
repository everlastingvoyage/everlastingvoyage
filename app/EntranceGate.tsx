'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function EntranceGate() {
  const pathname = usePathname();
  const visible = pathname === '/';

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.classList.add('ev-entrance-open');
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.classList.remove('ev-entrance-open');
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
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
