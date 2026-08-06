'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { openAnalyticsPreferences } from '../lib/analytics/analytics-consent';

function LegalLinks({ compact = false }: { compact?: boolean }) {
  return (
    <nav className={`v12LegalLinks ${compact ? 'compact' : ''}`} aria-label="Everlasting Voyage information">
      <Link href="/privacy">Privacy</Link>
      <Link href="/terms">Terms</Link>
      <Link href="/wellness">Wellness</Link>
      <Link href="/audio-licenses">Audio Licenses</Link>
      <Link href="/contact">Contact</Link>
      <button type="button" onClick={openAnalyticsPreferences}>Analytics Preferences</button>
    </nav>
  );
}

export default function V12LegalFooter() {
  const pathname = usePathname();
  const [completionMount, setCompletionMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (pathname !== '/voyage') {
      setCompletionMount(null);
      return;
    }

    const syncMount = () => {
      const completion = document.querySelector<HTMLElement>('.v10Completion');
      if (!completion) {
        setCompletionMount(null);
        return;
      }
      let root = completion.querySelector<HTMLElement>('#ev-v12-completion-legal-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'ev-v12-completion-legal-root';
        completion.appendChild(root);
      }
      setCompletionMount(root);
    };

    syncMount();
    const observer = new MutationObserver(syncMount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <>
      <footer className="v12BetaLegalFooter">
        <div>
          <img src="/brand-infinity.png" alt="" />
          <span>Everlasting Voyage · Private beta</span>
        </div>
        <LegalLinks />
      </footer>
      {completionMount ? createPortal(<LegalLinks compact />, completionMount) : null}
    </>
  );
}
