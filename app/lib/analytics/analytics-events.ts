import { APP_VERSION } from '../app-version';
import type {
  AnalyticsEventName,
  AnalyticsPrimitive,
  AnalyticsProperties
} from './analytics-types';

export type VoyageAnalyticsRuntime = {
  voyageSessionId: string;
  state: string;
  plannedMinutes: number;
  started: boolean;
  completed: boolean;
  abandoned: boolean;
  activeStartedAt: number | null;
  activeMilliseconds: number;
  thoughtsCapturedCount: number;
  atmosphereLayersUsed: Set<string>;
  capturedEvents: Set<string>;
};

const EVENT_PROPERTY_ALLOWLIST: Record<AnalyticsEventName, ReadonlySet<string>> = {
  voyage_started: new Set([
    'voyage_session_id', 'state', 'duration_minutes', 'has_intention',
    'restored_from_saved_space', 'active_atmosphere_count'
  ]),
  voyage_completed: new Set([
    'voyage_session_id', 'state', 'planned_minutes', 'active_minutes_bucket',
    'thoughts_captured_count', 'atmosphere_layers_used_count'
  ]),
  voyage_abandoned: new Set([
    'voyage_session_id', 'state', 'elapsed_bucket', 'exit_method'
  ]),
  state_selected: new Set(['state', 'source']),
  duration_selected: new Set(['duration_minutes', 'duration_bucket']),
  atmosphere_layer_added: new Set(['layer_id', 'layer_type', 'session_active']),
  atmosphere_layer_removed: new Set(['layer_id', 'layer_type', 'session_active']),
  audio_load_failed: new Set([
    'layer_id', 'layer_type', 'failure_code', 'source_attempt', 'audio_context_state'
  ]),
  audio_retry_used: new Set(['layer_id', 'layer_type', 'source_attempt', 'audio_context_state']),
  saved_space_created: new Set(['state', 'duration_minutes', 'atmosphere_count']),
  saved_space_restored: new Set(['state', 'duration_minutes', 'atmosphere_count']),
  thought_captured: new Set(['voyage_session_id', 'thought_number']),
  onboarding_started: new Set([]),
  onboarding_completed: new Set([]),
  onboarding_skipped: new Set([]),
  feedback_submitted: new Set([
    'voyage_session_id', 'rating', 'issue_area', 'has_comment', 'comment_length_bucket'
  ]),
  analytics_consent_updated: new Set(['consent']),
  returning_visit: new Set(['visit_gap_bucket']),
  client_error_sanitized: new Set(['error_code', 'surface', 'route'])
};

const FORBIDDEN_KEY = /^(intention|thought|note|name|email|url|href|referrer|error_message|message|stack|content|clipboard|device_id|ip|query)$/i;
const MAX_STRING_LENGTH = 96;
let runtime: VoyageAnalyticsRuntime | null = null;

function makeUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `voyage-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

function sanitizePrimitive(value: AnalyticsPrimitive): AnalyticsPrimitive {
  if (typeof value !== 'string') return value;
  return value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, MAX_STRING_LENGTH);
}

export function sanitizeAnalyticsProperties(
  event: AnalyticsEventName,
  properties: AnalyticsProperties = {}
): AnalyticsProperties {
  const allowed = EVENT_PROPERTY_ALLOWLIST[event];
  const sanitized: AnalyticsProperties = {
    app_version: APP_VERSION,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    $geoip_disable: true
  };

  for (const [key, value] of Object.entries(properties)) {
    if (!allowed.has(key) || FORBIDDEN_KEY.test(key)) continue;
    if (
      value !== null &&
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) continue;
    sanitized[key] = sanitizePrimitive(value);
  }

  return sanitized;
}

export function durationBucket(minutes: number): string {
  if (minutes < 15) return 'under_15';
  if (minutes < 25) return '15_24';
  if (minutes < 45) return '25_44';
  if (minutes < 60) return '45_59';
  return '60_plus';
}

export function elapsedBucket(milliseconds: number): string {
  const minutes = milliseconds / 60000;
  if (minutes < 1) return 'under_1_min';
  if (minutes < 5) return '1_4_min';
  if (minutes < 15) return '5_14_min';
  if (minutes < 30) return '15_29_min';
  return '30_plus';
}

export function activeMinutesBucket(milliseconds: number): string {
  const minutes = milliseconds / 60000;
  if (minutes < 5) return 'under_5';
  if (minutes < 15) return '5_14';
  if (minutes < 25) return '15_24';
  if (minutes < 45) return '25_44';
  if (minutes < 60) return '45_59';
  return '60_plus';
}

export function commentLengthBucket(length: number): string {
  if (length <= 0) return 'none';
  if (length <= 50) return '1_50';
  if (length <= 150) return '51_150';
  if (length <= 300) return '151_300';
  return '301_500';
}

export function beginVoyageRuntime(state: string, plannedMinutes: number): VoyageAnalyticsRuntime {
  runtime = {
    voyageSessionId: makeUuid(),
    state,
    plannedMinutes,
    started: true,
    completed: false,
    abandoned: false,
    activeStartedAt: Date.now(),
    activeMilliseconds: 0,
    thoughtsCapturedCount: 0,
    atmosphereLayersUsed: new Set<string>(),
    capturedEvents: new Set<string>()
  };
  return runtime;
}

export function ensureVoyageSessionId(): string {
  if (runtime) return runtime.voyageSessionId;
  runtime = {
    voyageSessionId: makeUuid(),
    state: 'unknown',
    plannedMinutes: 0,
    started: false,
    completed: false,
    abandoned: false,
    activeStartedAt: null,
    activeMilliseconds: 0,
    thoughtsCapturedCount: 0,
    atmosphereLayersUsed: new Set<string>(),
    capturedEvents: new Set<string>()
  };
  return runtime.voyageSessionId;
}

export function resumeVoyageRuntime(): void {
  if (!runtime || runtime.completed || runtime.abandoned || runtime.activeStartedAt !== null) return;
  runtime.activeStartedAt = Date.now();
}

export function pauseVoyageRuntime(): void {
  if (!runtime || runtime.activeStartedAt === null) return;
  runtime.activeMilliseconds += Math.max(0, Date.now() - runtime.activeStartedAt);
  runtime.activeStartedAt = null;
}

export function activeVoyageMilliseconds(): number {
  if (!runtime) return 0;
  return runtime.activeMilliseconds + (
    runtime.activeStartedAt === null ? 0 : Math.max(0, Date.now() - runtime.activeStartedAt)
  );
}

export function markVoyageCompleted(): VoyageAnalyticsRuntime | null {
  if (!runtime || runtime.completed || runtime.abandoned) return null;
  pauseVoyageRuntime();
  runtime.completed = true;
  return runtime;
}

export function markVoyageAbandoned(): VoyageAnalyticsRuntime | null {
  if (!runtime || runtime.completed || runtime.abandoned || !runtime.started) return null;
  pauseVoyageRuntime();
  runtime.abandoned = true;
  return runtime;
}

export function incrementThoughtCount(): number {
  if (!runtime) ensureVoyageSessionId();
  if (!runtime) return 0;
  runtime.thoughtsCapturedCount += 1;
  return runtime.thoughtsCapturedCount;
}

export function markAtmosphereLayerUsed(layerId: string): void {
  runtime?.atmosphereLayersUsed.add(layerId);
}

export function getVoyageRuntime(): VoyageAnalyticsRuntime | null {
  return runtime;
}

export function clearVoyageRuntime(): void {
  runtime = null;
}

export function eventOnce(key: string): boolean {
  if (!runtime) return true;
  if (runtime.capturedEvents.has(key)) return false;
  runtime.capturedEvents.add(key);
  return true;
}

export function idSuffix(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(-6);
}
