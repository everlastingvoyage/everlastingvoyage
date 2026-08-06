'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsClient } from '../lib/analytics/analytics-client';
import { analyticsStorage, readAnalyticsConsent } from '../lib/analytics/analytics-consent';

const ONBOARDING_KEY = 'ev:onboarding:v12.2';
const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
const steps = [
  {
    eyebrow: '1 · Choose your state',
    title: 'Select how you want to feel or focus.',
    copy: 'Move between Alpha, Gamma, Theta, Delta and Pure Tone without committing to a session yet.'
  },
  {
    eyebrow: '2 · Set your time',
    title: 'Choose a session length that fits your moment.',
    copy: 'Add an intention only when it helps. It remains local and is never included in analytics.'
  },
  {
    eyebrow: '3 · Enter the voyage',
    title: 'Add atmosphere whenever you like.',
    copy: 'Begin with the pure signal, then layer rain, noise or field recordings without restarting the timer.'
  }
] as const;

export default function V12BetaOnboarding() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (pathname !== '/voyage') {
      setOpen(false);
      return;
    }
    const status = analyticsStorage.get(ONBOARDING_KEY);
    if (status === 'completed' || status === 'skipped') return;
    const timer = window.setTimeout(() => {
      setOpen(true);
      if (readAnalyticsConsent() === 'granted') analyticsClient.capture('onboarding_started');
    }, 220);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('v12-onboarding-open', open);
    if (!open) return () => document.body.classList.remove('v12-onboarding-open');

    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        finish('skipped');
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
      document.body.classList.remove('v12-onboarding-open');
      previousFocus?.focus();
    };
  // finish is intentionally stable for this modal lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const finish = (result: 'completed' | 'skipped') => {
    analyticsStorage.set(ONBOARDING_KEY, result);
    if (readAnalyticsConsent() === 'granted') {
      analyticsClient.capture(result === 'completed' ? 'onboarding_completed' : 'onboarding_skipped');
    }
    setOpen(false);
    if (result === 'completed') {
      window.setTimeout(() => document.getElementById('session-builder')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    }
  };

  if (!open || pathname !== '/voyage') return null;
  const current = steps[step];

  return (
    <div className="v12OnboardingBackdrop" role="presentation">
      <section
        className="v12Onboarding"
        role="dialog"
        aria-modal="true"
        aria-labelledby="v12-onboarding-title"
        ref={dialogRef}
      >
        <div className="v12OnboardingProgress" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((_, index) => <span key={index} className={index <= step ? 'active' : ''} />)}
        </div>
        <div className="v12OnboardingCopy" key={step}>
          <span>{current.eyebrow}</span>
          <h2 id="v12-onboarding-title">{current.title}</h2>
          <p>{current.copy}</p>
        </div>
        <div className="v12OnboardingActions">
          <button type="button" onClick={() => finish('skipped')}>Skip</button>
          {step < steps.length - 1 ? (
            <button type="button" className="primary" onClick={() => setStep((value) => value + 1)}>Next</button>
          ) : (
            <button type="button" className="primary" onClick={() => finish('completed')}>Enter the voyage</button>
          )}
        </div>
      </section>
    </div>
  );
}
