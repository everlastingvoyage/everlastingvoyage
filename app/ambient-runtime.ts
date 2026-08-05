import type { AmbientId } from './ambient-catalog';

export type AmbientPlaybackState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'error';

export type AmbientSourceKind = 'procedural' | 'primary' | 'fallback';

export type AmbientLayerRuntimeState = {
  playbackState: AmbientPlaybackState;
  errorMessage?: string;
  retryCount: number;
  source?: AmbientSourceKind;
};

export type AmbientLayerRuntimeMap = Partial<Record<AmbientId, AmbientLayerRuntimeState>>;

export type AmbientEngineEvent = AmbientLayerRuntimeState & {
  id: AmbientId;
};

type DiagnosticEvent = {
  layerId: AmbientId;
  event: string;
  source?: AmbientSourceKind;
  timestamp: number;
  audioContextState?: AudioContextState;
};

const MAX_DIAGNOSTICS = 20;
const recentDiagnostics: DiagnosticEvent[] = [];

export const ambientDiagnostics = {
  log(event: Omit<DiagnosticEvent, 'timestamp'>): void {
    const entry: DiagnosticEvent = { ...event, timestamp: Date.now() };
    recentDiagnostics.push(entry);
    if (recentDiagnostics.length > MAX_DIAGNOSTICS) recentDiagnostics.shift();

    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[ambient:${event.layerId}] ${event.event}`, {
        source: event.source,
        audioContextState: event.audioContextState
      });
    }
  },
  recent(): readonly DiagnosticEvent[] {
    return [...recentDiagnostics];
  }
};

export function createIdleAmbientRuntimeState(): AmbientLayerRuntimeState {
  return {
    playbackState: 'idle',
    retryCount: 0
  };
}
