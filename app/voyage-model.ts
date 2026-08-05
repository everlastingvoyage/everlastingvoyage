import { ambientCatalog, ambientIds, isAmbientId, type AmbientId } from './ambient-catalog';
import { frequencyIds, isFrequencyId, type FrequencyId } from './frequency-catalog';

export const VOYAGE_SCHEMA_VERSION = 1 as const;
export const MAX_ACTIVE_AMBIENT_LAYERS = 8;

export type AccessTier = 'free' | 'founder' | 'premium';

export type AmbientLayerConfig = {
  id: AmbientId;
  enabled: boolean;
  volume: number;
};

export type VoyageConfig = {
  schemaVersion: typeof VOYAGE_SCHEMA_VERSION;
  frequencyId: FrequencyId;
  durationMinutes: number;
  intention: string;
  signalVolume: number;
  signalMuted: boolean;
  ambientLayers: AmbientLayerConfig[];
};

export type VoyagePreset = {
  id: string;
  name: string;
  description: string;
  access: AccessTier;
  config: VoyageConfig;
  createdAt: number;
  updatedAt: number;
};

export type SavedVoyage = {
  id: string;
  name: string;
  config: VoyageConfig;
  createdAt: number;
  lastUsedAt: number;
};

type LegacyVoyageLike = {
  stateId?: unknown;
  frequencyId?: unknown;
  durationMinutes?: unknown;
  intention?: unknown;
  signalVolume?: unknown;
  volume?: unknown;
  volumePercent?: unknown;
  muted?: unknown;
  signalMuted?: unknown;
  ambientLayers?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function clampUnitVolume(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

export function normalizeDuration(value: unknown, fallback = 25): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(240, Math.max(1, Math.round(parsed)));
}

export function createDefaultAmbientLayers(): AmbientLayerConfig[] {
  return ambientIds.map((id) => ({
    id,
    enabled: false,
    volume: ambientCatalog[id].defaultVolume
  }));
}

export function createDefaultVoyageConfig(frequencyId: FrequencyId = 'alpha'): VoyageConfig {
  return {
    schemaVersion: VOYAGE_SCHEMA_VERSION,
    frequencyId,
    durationMinutes: 25,
    intention: '',
    signalVolume: 0.22,
    signalMuted: false,
    ambientLayers: createDefaultAmbientLayers()
  };
}

export function sanitizeAmbientLayers(value: unknown): AmbientLayerConfig[] {
  const source = Array.isArray(value) ? value : [];
  const byId = new Map<AmbientId, AmbientLayerConfig>();

  source.forEach((candidate) => {
    if (!isRecord(candidate)) return;
    const idValue = typeof candidate.id === 'string' ? candidate.id : null;
    if (!isAmbientId(idValue)) return;

    byId.set(idValue, {
      id: idValue,
      enabled: Boolean(candidate.enabled),
      volume: clampUnitVolume(Number(candidate.volume), ambientCatalog[idValue].defaultVolume)
    });
  });

  let enabledCount = 0;
  return ambientIds.map((id) => {
    const layer = byId.get(id) ?? {
      id,
      enabled: false,
      volume: ambientCatalog[id].defaultVolume
    };

    if (!layer.enabled) return layer;
    enabledCount += 1;
    return enabledCount <= MAX_ACTIVE_AMBIENT_LAYERS ? layer : { ...layer, enabled: false };
  });
}

export function sanitizeVoyageConfig(value: unknown): VoyageConfig | null {
  if (!isRecord(value)) return null;

  const legacy = value as LegacyVoyageLike;
  const frequencyCandidate = typeof legacy.frequencyId === 'string'
    ? legacy.frequencyId
    : typeof legacy.stateId === 'string'
      ? legacy.stateId
      : null;

  if (!isFrequencyId(frequencyCandidate)) return null;

  const rawVolume = typeof legacy.signalVolume === 'number'
    ? legacy.signalVolume
    : typeof legacy.volume === 'number'
      ? legacy.volume
      : typeof legacy.volumePercent === 'number'
        ? legacy.volumePercent / 100
        : 0.22;

  return {
    schemaVersion: VOYAGE_SCHEMA_VERSION,
    frequencyId: frequencyCandidate,
    durationMinutes: normalizeDuration(legacy.durationMinutes),
    intention: typeof legacy.intention === 'string' ? legacy.intention.trim().slice(0, 240) : '',
    signalVolume: clampUnitVolume(rawVolume, 0.22),
    signalMuted: Boolean(legacy.signalMuted ?? legacy.muted),
    ambientLayers: sanitizeAmbientLayers(legacy.ambientLayers)
  };
}

export function parseVoyageConfig(raw: string | null): VoyageConfig | null {
  if (!raw) return null;
  try {
    return sanitizeVoyageConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function serializeVoyageConfig(config: VoyageConfig): string {
  return JSON.stringify(sanitizeVoyageConfig(config) ?? createDefaultVoyageConfig());
}

export function getEnabledAmbientLayers(config: VoyageConfig): AmbientLayerConfig[] {
  return config.ambientLayers.filter((layer) => layer.enabled).slice(0, MAX_ACTIVE_AMBIENT_LAYERS);
}

export function canUseAmbient(id: AmbientId, tier: AccessTier): boolean {
  if (ambientCatalog[id].access === 'free') return true;
  return tier === 'founder' || tier === 'premium';
}

export function isKnownFrequency(value: string): value is FrequencyId {
  return frequencyIds.includes(value as FrequencyId);
}
