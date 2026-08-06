'use client';

import { useEffect } from 'react';
import { analyticsClient } from './lib/analytics/analytics-client';

function routeWithoutQuery(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    analyticsClient.capture('client_error_sanitized', {
      error_code: 'EV_SESSION_RUNTIME_ERROR',
      surface: 'session',
      route: routeWithoutQuery()
    });
  }, []);

  return (
    <main className="v12ErrorPage">
      <span>Everlasting Voyage</span>
      <h1>The Voyage paused unexpectedly.</h1>
      <p>Your local Saved Spaces and Notes have not been deleted.</p>
      <div>
        <button type="button" onClick={reset}>Try again</button>
        <button type="button" onClick={() => window.location.assign('/voyage')}>Return home</button>
      </div>
    </main>
  );
}
