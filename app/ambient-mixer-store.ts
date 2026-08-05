import { ambientCatalog, type AmbientId } from './ambient-catalog';
import {
  createDefaultAmbientLayers,
  sanitizeAmbientLayers,
  type AmbientLayerConfig
} from './voyage-model';

export const AMBIENT_MIX_STORAGE_KEY = 'ev-v11-ambient-mix';
export const AMBIENT_MIX_EVENT = 'ev:ambient-mix-change';

export type AmbientMixSnapshot = {
  layers: AmbientLayerConfig[];
  updatedAt: number;
};

function makeSnapshot(layers: AmbientLayerConfig[]): AmbientMixSnapshot {
  return {
    layers: sanitizeAmbientLayers(layers),
    updatedAt: Date.now()
  };
}

export function readAmbientMix(): AmbientMixSnapshot {
  if (typeof window === 'undefined') {
    return makeSnapshot(createDefaultAmbientLayers());
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(AMBIENT_MIX_STORAGE_KEY) || 'null') as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return makeSnapshot(createDefaultAmbientLayers());
    }

    const source = parsed as { layers?: unknown; updatedAt?: unknown };
    return {
      layers: sanitizeAmbientLayers(source.layers),
      updatedAt: typeof source.updatedAt === 'number' ? source.updatedAt : Date.now()
    };
  } catch {
    localStorage.removeItem(AMBIENT_MIX_STORAGE_KEY);
    return makeSnapshot(createDefaultAmbientLayers());
  }
}

export function writeAmbientMix(layers: AmbientLayerConfig[]): AmbientMixSnapshot {
  const snapshot = makeSnapshot(layers);
  if (typeof window === 'undefined') return snapshot;

  localStorage.setItem(AMBIENT_MIX_STORAGE_KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new CustomEvent<AmbientMixSnapshot>(AMBIENT_MIX_EVENT, { detail: snapshot }));
  return snapshot;
}

export function updateAmbientLayer(id: AmbientId, updates: Partial<Pick<AmbientLayerConfig, 'enabled' | 'volume'>>): AmbientMixSnapshot {
  const current = readAmbientMix();
  const next = current.layers.map((layer) => layer.id === id
    ? {
        ...layer,
        enabled: typeof updates.enabled === 'boolean' ? updates.enabled : layer.enabled,
        volume: typeof updates.volume === 'number' ? updates.volume : layer.volume
      }
    : layer);

  return writeAmbientMix(next);
}

export function resetAmbientMix(): AmbientMixSnapshot {
  return writeAmbientMix(createDefaultAmbientLayers());
}

export function subscribeToAmbientMix(listener: (snapshot: AmbientMixSnapshot) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<AmbientMixSnapshot>;
    listener({
      layers: sanitizeAmbientLayers(customEvent.detail?.layers),
      updatedAt: customEvent.detail?.updatedAt ?? Date.now()
    });
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === AMBIENT_MIX_STORAGE_KEY) listener(readAmbientMix());
  };

  window.addEventListener(AMBIENT_MIX_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(AMBIENT_MIX_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
  };
}

export function getAmbientLayerLabel(id: AmbientId): string {
  return ambientCatalog[id].name;
}
