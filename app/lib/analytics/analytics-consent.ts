import type { AnalyticsConsent } from './analytics-types';

export const ANALYTICS_CONSENT_KEY = 'ev:analytics:consent:v1';
export const ANALYTICS_ANONYMOUS_ID_KEY = 'ev:analytics:anonymous-id:v1';
export const FIRST_VISIT_KEY = 'ev:visitor:first-visit:v1';
export const LAST_VISIT_KEY = 'ev:visitor:last-visit:v1';
export const RETURNING_EVENT_DAY_KEY = 'ev:visitor:returning-event-day:v1';
export const ANALYTICS_CONSENT_EVENT = 'ev:analytics-consent-change';
export const ANALYTICS_PREFERENCES_EVENT = 'ev:open-analytics-preferences';

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local-only preferences remain ephemeral when storage is unavailable.
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing else should depend on analytics storage.
  }
}

function makeUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

export function readAnalyticsConsent(): AnalyticsConsent | null {
  const value = safeGet(ANALYTICS_CONSENT_KEY);
  return value === 'granted' || value === 'denied' ? value : null;
}

export function setAnalyticsConsent(consent: AnalyticsConsent): void {
  safeSet(ANALYTICS_CONSENT_KEY, consent);
  if (consent === 'denied') safeRemove(ANALYTICS_ANONYMOUS_ID_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<AnalyticsConsent>(ANALYTICS_CONSENT_EVENT, { detail: consent }));
  }
}

export function getOrCreateAnonymousId(): string | null {
  if (readAnalyticsConsent() !== 'granted') return null;
  const existing = safeGet(ANALYTICS_ANONYMOUS_ID_KEY);
  if (existing) return existing;
  const id = makeUuid();
  safeSet(ANALYTICS_ANONYMOUS_ID_KEY, id);
  return id;
}

export function clearAnonymousId(): void {
  safeRemove(ANALYTICS_ANONYMOUS_ID_KEY);
}

export function readAnonymousId(): string | null {
  return safeGet(ANALYTICS_ANONYMOUS_ID_KEY);
}

export function subscribeToAnalyticsConsent(listener: (consent: AnalyticsConsent) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (event: Event) => listener((event as CustomEvent<AnalyticsConsent>).detail);
  window.addEventListener(ANALYTICS_CONSENT_EVENT, handler);
  return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handler);
}

export function openAnalyticsPreferences(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ANALYTICS_PREFERENCES_EVENT));
}

export function subscribeToAnalyticsPreferences(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(ANALYTICS_PREFERENCES_EVENT, listener);
  return () => window.removeEventListener(ANALYTICS_PREFERENCES_EVENT, listener);
}

export const analyticsStorage = {
  get: safeGet,
  set: safeSet,
  remove: safeRemove
};
