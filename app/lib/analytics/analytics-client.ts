'use client';

import {
  clearAnonymousId,
  getOrCreateAnonymousId,
  readAnalyticsConsent,
  readAnonymousId
} from './analytics-consent';
import {
  getVoyageRuntime,
  idSuffix,
  sanitizeAnalyticsProperties
} from './analytics-events';
import type {
  AnalyticsClient,
  AnalyticsDebugEvent,
  AnalyticsDebugSnapshot,
  AnalyticsEventName,
  AnalyticsProperties
} from './analytics-types';

const ALLOWED_EVENTS = new Set<AnalyticsEventName>([
  'voyage_started',
  'voyage_completed',
  'voyage_abandoned',
  'state_selected',
  'duration_selected',
  'atmosphere_layer_added',
  'atmosphere_layer_removed',
  'audio_load_failed',
  'audio_retry_used',
  'saved_space_created',
  'saved_space_restored',
  'thought_captured',
  'onboarding_started',
  'onboarding_completed',
  'onboarding_skipped',
  'feedback_submitted',
  'analytics_consent_updated',
  'returning_visit',
  'client_error_sanitized'
]);

const SAFE_POSTHOG_INFRASTRUCTURE_PROPERTIES = new Set([
  'distinct_id',
  '$insert_id',
  '$time',
  '$lib',
  '$lib_version'
]);

const SAFE_CUSTOM_PROPERTIES = new Set([
  'app_version',
  'environment',
  '$geoip_disable',
  'voyage_session_id',
  'state',
  'source',
  'duration_minutes',
  'duration_bucket',
  'has_intention',
  'restored_from_saved_space',
  'active_atmosphere_count',
  'planned_minutes',
  'active_minutes_bucket',
  'thoughts_captured_count',
  'atmosphere_layers_used_count',
  'elapsed_bucket',
  'exit_method',
  'layer_id',
  'layer_type',
  'session_active',
  'failure_code',
  'source_attempt',
  'audio_context_state',
  'atmosphere_count',
  'thought_number',
  'rating',
  'issue_area',
  'has_comment',
  'comment_length_bucket',
  'consent',
  'visit_gap_bucket',
  'error_code',
  'surface',
  'route'
]);

type PostHogClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  opt_in_capturing: (options?: Record<string, unknown>) => void;
  opt_out_capturing: () => void;
  reset: (resetDeviceId?: boolean) => void;
};

const MAX_DEBUG_EVENTS = 20;
const debugEvents: AnalyticsDebugEvent[] = [];
let provider: PostHogClient | null = null;
let providerInitialized = false;
let initializationPromise: Promise<void> | null = null;
let lastBlockedReason: string | null = null;

function analyticsEnabledByEnvironment(): boolean {
  return process.env.NEXT_PUBLIC_BETA_ANALYTICS_ENABLED === 'true';
}

function projectKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_KEY;
}

function apiHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
}

function redactDebugProperties(properties: AnalyticsProperties): AnalyticsProperties {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      if (key.endsWith('_id') && typeof value === 'string') return [key, `…${value.slice(-6)}`];
      return [key, value];
    })
  );
}

function publishQaSnapshot(): void {
  if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_ANALYTICS_QA_MODE !== 'true') return;
  window.__EV_ANALYTICS_QA__ = analyticsClient.debugSnapshot();
}

function recordDebug(
  name: AnalyticsEventName,
  properties: AnalyticsProperties,
  sent: boolean,
  blockedReason: string | null
): void {
  debugEvents.push({
    name,
    properties: redactDebugProperties(properties),
    sent,
    blockedReason,
    timestamp: Date.now()
  });
  if (debugEvents.length > MAX_DEBUG_EVENTS) debugEvents.shift();
  lastBlockedReason = blockedReason;
  publishQaSnapshot();
}

function stripAutomaticProperties(event: unknown): unknown {
  if (!event || typeof event !== 'object') return event;
  const candidate = event as { event?: string; properties?: Record<string, unknown> };
  if (!candidate.event || !ALLOWED_EVENTS.has(candidate.event as AnalyticsEventName)) return null;

  const properties = candidate.properties ?? {};
  const safeProperties: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (SAFE_POSTHOG_INFRASTRUCTURE_PROPERTIES.has(key) || SAFE_CUSTOM_PROPERTIES.has(key)) {
      safeProperties[key] = value;
    }
  }
  safeProperties.$geoip_disable = true;
  candidate.properties = safeProperties;
  return candidate;
}

async function initializeProvider(): Promise<void> {
  if (providerInitialized || initializationPromise) return initializationPromise ?? Promise.resolve();
  if (typeof window === 'undefined') return;
  if (readAnalyticsConsent() !== 'granted') return;
  if (!analyticsEnabledByEnvironment()) return;

  const key = projectKey();
  if (!key) return;
  const anonymousId = getOrCreateAnonymousId();
  if (!anonymousId) return;

  initializationPromise = (async () => {
    try {
      const module = await import('posthog-js');
      const posthog = module.default;
      posthog.init(key, {
        api_host: apiHost(),
        defaults: '2026-05-30',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_dead_clicks: false,
        capture_exceptions: false,
        capture_heatmaps: false,
        capture_performance: false,
        disable_session_recording: true,
        disable_surveys: true,
        advanced_disable_feature_flags: true,
        advanced_disable_feature_flags_on_first_load: true,
        enable_recording_console_log: false,
        rageclick: false,
        mask_all_text: true,
        mask_all_element_attributes: true,
        respect_dnt: true,
        persistence: 'localStorage',
        person_profiles: 'identified_only',
        opt_out_capturing_by_default: true,
        opt_out_persistence_by_default: true,
        bootstrap: {
          distinctID: anonymousId,
          isIdentifiedID: false
        },
        property_denylist: [
          '$current_url',
          '$host',
          '$pathname',
          '$referrer',
          '$referring_domain',
          '$browser',
          '$browser_version',
          '$os',
          '$os_version',
          '$device_type',
          '$device_id',
          '$screen_height',
          '$screen_width',
          '$viewport_height',
          '$viewport_width',
          '$user_agent'
        ],
        before_send: stripAutomaticProperties as never,
        loaded: (loadedProvider: PostHogClient) => {
          loadedProvider.opt_in_capturing({ captureEventName: false });
        }
      } as Parameters<typeof posthog.init>[1]);
      provider = {
        capture: (event, properties) => posthog.capture(event, properties),
        opt_in_capturing: (options) => (posthog.opt_in_capturing as (value?: Record<string, unknown>) => void)(options),
        opt_out_capturing: () => posthog.opt_out_capturing(),
        reset: (resetDeviceId) => posthog.reset(resetDeviceId)
      };
      providerInitialized = true;
      (posthog.opt_in_capturing as (options?: Record<string, unknown>) => void)({ captureEventName: false });
      publishQaSnapshot();
    } catch {
      provider = null;
      providerInitialized = false;
      lastBlockedReason = 'provider_initialization_failed';
      publishQaSnapshot();
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

export const analyticsClient: AnalyticsClient = {
  capture(event: AnalyticsEventName, properties: AnalyticsProperties = {}): void {
    const sanitized = sanitizeAnalyticsProperties(event, properties);
    const consent = readAnalyticsConsent();

    if (consent !== 'granted') {
      recordDebug(event, sanitized, false, 'consent_not_granted');
      return;
    }

    if (!analyticsEnabledByEnvironment()) {
      recordDebug(event, sanitized, false, 'analytics_disabled_by_environment');
      return;
    }

    if (!projectKey()) {
      recordDebug(event, sanitized, false, 'provider_not_configured');
      return;
    }

    if (!providerInitialized || !provider) {
      void initializeProvider().then(() => {
        if (providerInitialized && provider) {
          try {
            provider.capture(event, sanitized);
            recordDebug(event, sanitized, true, null);
          } catch {
            recordDebug(event, sanitized, false, 'capture_failed');
          }
        } else {
          recordDebug(event, sanitized, false, 'provider_unavailable');
        }
      });
      return;
    }

    try {
      provider.capture(event, sanitized);
      recordDebug(event, sanitized, true, null);
    } catch {
      recordDebug(event, sanitized, false, 'capture_failed');
    }
  },

  async enable(): Promise<void> {
    if (readAnalyticsConsent() !== 'granted') return;
    getOrCreateAnonymousId();
    await initializeProvider();
  },

  disable(): void {
    try {
      provider?.opt_out_capturing();
      provider?.reset(true);
    } catch {
      // Revoking analytics must not affect the application.
    }
    provider = null;
    providerInitialized = false;
    initializationPromise = null;
    if (typeof window !== 'undefined') {
      try {
        for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
          const key = window.localStorage.key(index);
          if (key?.startsWith('ph_')) window.localStorage.removeItem(key);
        }
      } catch {
        // Provider persistence is best-effort and never blocks the product.
      }
    }
    clearAnonymousId();
    publishQaSnapshot();
  },

  reset(): void {
    this.disable();
    debugEvents.splice(0, debugEvents.length);
    lastBlockedReason = null;
    publishQaSnapshot();
  },

  debugSnapshot(): AnalyticsDebugSnapshot {
    return {
      consent: readAnalyticsConsent(),
      providerInitialized,
      anonymousIdSuffix: idSuffix(readAnonymousId()),
      voyageSessionIdSuffix: idSuffix(getVoyageRuntime()?.voyageSessionId),
      lastEvents: [...debugEvents],
      lastBlockedReason
    };
  }
};

declare global {
  interface Window {
    __EV_ANALYTICS_QA__?: AnalyticsDebugSnapshot;
  }
}
