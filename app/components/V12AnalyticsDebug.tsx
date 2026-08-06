'use client';

import { useEffect, useState } from 'react';
import { analyticsClient } from '../lib/analytics/analytics-client';
import type { AnalyticsDebugSnapshot } from '../lib/analytics/analytics-types';

export default function V12AnalyticsDebug() {
  const [enabled, setEnabled] = useState(false);
  const [snapshot, setSnapshot] = useState<AnalyticsDebugSnapshot>(() => analyticsClient.debugSnapshot());

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const query = new URLSearchParams(window.location.search);
    if (query.get('analyticsDebug') !== '1') return;
    setEnabled(true);
    const interval = window.setInterval(() => setSnapshot(analyticsClient.debugSnapshot()), 450);
    return () => window.clearInterval(interval);
  }, []);

  if (!enabled) return null;

  return (
    <aside className="v12AnalyticsDebug" aria-label="Development analytics inspector">
      <header>
        <strong>Analytics inspector</strong>
        <span>development only</span>
      </header>
      <dl>
        <div><dt>Consent</dt><dd>{snapshot.consent ?? 'not selected'}</dd></div>
        <div><dt>Provider</dt><dd>{snapshot.providerInitialized ? 'initialized' : 'inactive'}</dd></div>
        <div><dt>Anonymous ID</dt><dd>{snapshot.anonymousIdSuffix ? `…${snapshot.anonymousIdSuffix}` : 'none'}</dd></div>
        <div><dt>Voyage ID</dt><dd>{snapshot.voyageSessionIdSuffix ? `…${snapshot.voyageSessionIdSuffix}` : 'none'}</dd></div>
      </dl>
      <div className="v12DebugEvents">
        {snapshot.lastEvents.length ? snapshot.lastEvents.slice().reverse().map((event, index) => (
          <details key={`${event.timestamp}-${event.name}-${index}`}>
            <summary>{event.sent ? 'sent' : 'blocked'} · {event.name}</summary>
            <pre>{JSON.stringify(event.properties, null, 2)}</pre>
            {event.blockedReason ? <small>{event.blockedReason}</small> : null}
          </details>
        )) : <p>No events captured yet.</p>}
      </div>
    </aside>
  );
}
