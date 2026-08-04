'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

export default function V10ProductFlow() {
  const pathname = usePathname();
  const active = pathname === '/voyage';
  const [aboutMount, setAboutMount] = useState<HTMLElement | null>(null);
  const [footerMount, setFooterMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    document.body.classList.toggle('ev-product-route', active);
    if (!active) return () => document.body.classList.remove('ev-product-route');

    const join = document.querySelector<HTMLElement>('.joinSection');
    if (!join) return;

    const aboutRoot = document.createElement('div');
    aboutRoot.id = 'ev-about-root';
    join.insertAdjacentElement('beforebegin', aboutRoot);

    const footerRoot = document.createElement('div');
    footerRoot.id = 'ev-footer-root';
    join.insertAdjacentElement('afterend', footerRoot);

    setAboutMount(aboutRoot);
    setFooterMount(footerRoot);

    return () => {
      document.body.classList.remove('ev-product-route');
      aboutRoot.remove();
      footerRoot.remove();
      setAboutMount(null);
      setFooterMount(null);
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      {aboutMount && createPortal(
        <section className="evAboutCompact section" id="about" aria-labelledby="ev-about-title">
          <div className="evAboutHeader">
            <div>
              <p className="eyebrow">About Everlasting Voyage</p>
              <h2 id="ev-about-title">Three choices. One focused environment.</h2>
            </div>
            <p>
              Pure frequencies, a precise timer and one clear intention live together without feeds, comments or setup friction.
            </p>
          </div>

          <div className="evAboutRitual" aria-label="How Everlasting Voyage works">
            <article><span>01</span><strong>Choose your state</strong><p>Select the atmosphere that matches the moment.</p></article>
            <i aria-hidden="true">→</i>
            <article><span>02</span><strong>Set your time</strong><p>Choose a session length and one intention.</p></article>
            <i aria-hidden="true">→</i>
            <article><span>03</span><strong>Enter the voyage</strong><p>Signal, timer and thought capture remain together.</p></article>
          </div>

          <div className="evAboutSignals">
            <span>Pure signals</span>
            <span>Built for sessions</span>
            <span>No forced setup</span>
            <span>Saved spaces</span>
          </div>
        </section>,
        aboutMount
      )}

      {footerMount && createPortal(
        <footer className="evProductFooter">
          <a href="/" className="evFooterBrand" aria-label="Everlasting Voyage entrance">
            <img src="/brand-infinity.png" alt="" />
            <img src="/brand-wordmark.png" alt="Everlasting Voyage" />
          </a>
          <nav aria-label="Footer navigation">
            <a href="#session-builder">Build a voyage</a>
            <a href="#library">Frequencies</a>
            <a href="#about">About</a>
            <a href="#join">Early access</a>
          </nav>
          <p>© 2026 Everlasting Voyage. Pure signals, clearly presented.</p>
        </footer>,
        footerMount
      )}
    </>
  );
}
