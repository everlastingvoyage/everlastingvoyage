'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function V12SessionBrandFooter() {
  const [footerMount, setFooterMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const syncMount = () => {
      const footer = document.querySelector<HTMLElement>(
        '.v10SessionOverlay:not(.completed) .v10SessionFooter'
      );
      setFooterMount((current) => (current === footer ? current : footer));
    };

    syncMount();

    const observer = new MutationObserver(syncMount);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  if (!footerMount) return null;

  return createPortal(
    <a href="/" className="v12SessionFooterBrand" aria-label="Everlasting Voyage home">
      <img src="/brand-infinity.png" alt="" />
      <img src="/brand-wordmark.png" alt="Everlasting Voyage" />
    </a>,
    footerMount
  );
}
