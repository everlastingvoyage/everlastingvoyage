export type AnalyticsEventName =
  | 'voyage_started'
  | 'voyage_completed'
  | 'voyage_abandoned'
  | 'state_selected'
  | 'duration_selected'
  | 'atmosphere_layer_added'
  | 'atmosphere_layer_removed'
  | 'audio_load_failed'
  | 'audio_retry_used'
  | 'saved_space_created'
  | 'saved_space_restored'
  | 'thought_captured'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'feedback_submitted'
  | 'analytics_consent_updated'
  | 'returning_visit'
  | 'client_error_sanitized';

export type AnalyticsPrimitive = string | number | boolean | null;
export type AnalyticsProperties = Record<string, AnalyticsPrimitive>;

export type AnalyticsConsent = 'granted' | 'denied';

export type AnalyticsDebugEvent = {
  name: AnalyticsEventName;
  properties: AnalyticsProperties;
  sent: boolean;
  blockedReason: string | null;
  timestamp: number;
};

export type AnalyticsDebugSnapshot = {
  consent: AnalyticsConsent | null;
  providerInitialized: boolean;
  anonymousIdSuffix: string | null;
  voyageSessionIdSuffix: string | null;
  lastEvents: AnalyticsDebugEvent[];
  lastBlockedReason: string | null;
};

export interface AnalyticsClient {
  capture(event: AnalyticsEventName, properties?: AnalyticsProperties): void;
  enable(): Promise<void>;
  disable(): void;
  reset(): void;
  debugSnapshot(): AnalyticsDebugSnapshot;
}
