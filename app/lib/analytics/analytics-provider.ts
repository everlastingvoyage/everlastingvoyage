'use client';

import { analyticsClient } from './analytics-client';
import {
  analyticsStorage,
  FIRST_VISIT_KEY,
  LAST_VISIT_KEY,
  readAnalyticsConsent,
  RETURNING_EVENT_DAY_KEY,
  subscribeToAnalyticsConsent
} from './analytics-consent';

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

function dateKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function visitGapBucket(milliseconds: number): string {
  const days = milliseconds / (24 * 60 * 60 * 1000);
  if (days < 1) return 'same_day';
  if (days < 3) return '1_2_days';
  if (days < 8) return '3_7_days';
  if (days < 31) return '8_30_days';
  return '31_plus_days';
}

function registerVisit(): void {
  const now = Date.now();
  const firstVisit = Number(analyticsStorage.get(FIRST_VISIT_KEY));
  const previousVisit = Number(analyticsStorage.get(LAST_VISIT_KEY));

  if (!Number.isFinite(firstVisit) || firstVisit <= 0) {
    analyticsStorage.set(FIRST_VISIT_KEY, String(now));
  }

  if (
    readAnalyticsConsent() === 'granted' &&
    Number.isFinite(previousVisit) &&
    previousVisit > 0 &&
    now - previousVisit >= TWELVE_HOURS &&
    analyticsStorage.get(RETURNING_EVENT_DAY_KEY) !== dateKey(now)
  ) {
    analyticsClient.capture('returning_visit', {
      visit_gap_bucket: visitGapBucket(now - previousVisit)
    });
    analyticsStorage.set(RETURNING_EVENT_DAY_KEY, dateKey(now));
  }

  analyticsStorage.set(LAST_VISIT_KEY, String(now));
}

export function startAnalyticsProvider(): () => void {
  if (typeof window === 'undefined') return () => undefined;

  if (readAnalyticsConsent() === 'granted') void analyticsClient.enable();
  registerVisit();

  const unsubscribeConsent = subscribeToAnalyticsConsent((consent) => {
    if (consent === 'granted') {
      void analyticsClient.enable().then(registerVisit);
    } else {
      analyticsClient.disable();
    }
  });

  const updateLastVisit = () => analyticsStorage.set(LAST_VISIT_KEY, String(Date.now()));
  window.addEventListener('pagehide', updateLastVisit);

  return () => {
    unsubscribeConsent();
    window.removeEventListener('pagehide', updateLastVisit);
    updateLastVisit();
  };
}
