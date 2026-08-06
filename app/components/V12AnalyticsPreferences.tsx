'use client';

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { analyticsClient } from '../lib/analytics/analytics-client';
import {
  readAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsPreferences
} from '../lib/analytics/analytics-consent';
import type { AnalyticsConsent } from '../lib/analytics/analytics-types';

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function V12AnalyticsPreferences() {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => subscribeToAnalyticsPreferences(() => {
    setConsent(readAnalyticsConsent());
    setOpen(true);
  }), []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  const grant = async () => {
    setAnalyticsConsent('granted');
    setConsent('granted');
    await analyticsClient.enable();
    analyticsClient.capture('analytics_consent_updated', { consent: 'granted' });
  };

  const deny = () => {
    setAnalyticsConsent('denied');
    analyticsClient.disable();
    setConsent('denied');
  };

  if (!open) return null;

  return (
    <div className="v12ModalBackdrop" role="presentation" onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => event.target === event.currentTarget && setOpen(false)}>
      <section
        className="v12PreferencesDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="v12-preferences-title"
        ref={dialogRef}
      >
        <header>
          <div>
            <span>Privacy controls</span>
            <h2 id="v12-preferences-title">Analytics preferences</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close analytics preferences">×</button>
        </header>
        <p>
          Anonymous analytics is <strong>{consent === 'granted' ? 'allowed' : 'off'}</strong>. The Voyage works completely either way.
        </p>
        <div className="v12PreferenceChoices">
          <button type="button" className={consent !== 'granted' ? 'selected' : ''} onClick={deny}>
            <strong>Essential only</strong>
            <span>Keep all product activity on this browser.</span>
          </button>
          <button type="button" className={consent === 'granted' ? 'selected' : ''} onClick={() => void grant()}>
            <strong>Allow anonymous analytics</strong>
            <span>Share structured feature usage and sanitized failure codes.</span>
          </button>
        </div>
        <p className="v12PreferenceNote">
          Turning analytics off immediately disables capture and clears the local anonymous analytics identifier.
        </p>
      </section>
    </div>
  );
}
