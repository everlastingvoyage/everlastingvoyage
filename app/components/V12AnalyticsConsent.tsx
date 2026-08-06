'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsClient } from '../lib/analytics/analytics-client';
import {
  readAnalyticsConsent,
  setAnalyticsConsent
} from '../lib/analytics/analytics-consent';

export default function V12AnalyticsConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname !== '/voyage') {
      setVisible(false);
      return;
    }
    setVisible(readAnalyticsConsent() === null);
  }, [pathname]);

  const chooseEssentialOnly = () => {
    setAnalyticsConsent('denied');
    analyticsClient.disable();
    setVisible(false);
  };

  const allowAnalytics = async () => {
    setAnalyticsConsent('granted');
    setVisible(false);
    await analyticsClient.enable();
    analyticsClient.capture('analytics_consent_updated', { consent: 'granted' });
  };

  if (!visible || pathname !== '/voyage') return null;

  return (
    <aside className="v12AnalyticsConsent" aria-labelledby="v12-analytics-consent-title">
      <button
        type="button"
        className="v12ConsentDismiss"
        onClick={chooseEssentialOnly}
        aria-label="Dismiss and use essential storage only"
      >
        ×
      </button>
      <span>Help us improve the voyage</span>
      <strong id="v12-analytics-consent-title">Allow anonymous product analytics?</strong>
      <p>
        We measure which features work and where technical failures happen. We never collect your intentions, thoughts or Notes.
      </p>
      <div>
        <button type="button" onClick={chooseEssentialOnly}>Essential only</button>
        <button type="button" className="primary" onClick={() => void allowAnalytics()}>
          Allow anonymous analytics
        </button>
      </div>
    </aside>
  );
}
