'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { ambientCatalog, type AmbientId } from './ambient-catalog';
import {
  dispatchAmbientCommand,
  readAmbientMix,
  subscribeToAmbientMix,
  subscribeToAmbientRuntime,
  type AmbientRuntimeSnapshot
} from './ambient-mixer-store';
import type { AmbientLayerConfig } from './voyage-model';

const playableIds = ['white-noise', 'brown-noise', 'pink-noise'] as const satisfies readonly AmbientId[];
type PlayableId = (typeof playableIds)[number];
type SessionStatus = 'ready' | 'running' | 'paused' | 'completed' | 'closed';

const layerSymbols: Record<PlayableId, string> = {
  'white-noise': '◌',
  'brown-noise': '≈',
  'pink-noise': '∿'
};

const shortDescriptions: Record<PlayableId, string> = {
  'white-noise': 'Bright, even masking.',
  'brown-noise': 'Deep, soft masking.',
  'pink-noise': 'Balanced, natural texture.'
};

function getSessionStatus(): SessionStatus {
  const session = document.querySelector<HTMLElement>('.v10SessionOverlay');
  if (!session) return 'closed';
  if (session.classList.contains('running')) return 'running';
  if (session.classList.contains('paused')) return 'paused';
  if (session.classList.contains('completed')) return 'completed';
  return 'ready';
}

export default function V11SessionAtmosphere() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [layers, setLayers] = useState<AmbientLayerConfig[]>(() => readAmbientMix().layers);
  const [selectedId, setSelectedId] = useState<PlayableId | null>(null);
  const [status, setStatus] = useState<SessionStatus>('closed');
  const [runtime, setRuntime] = useState<AmbientRuntimeSnapshot>({ soloId: null, audible: true, updatedAt: 0 });
  const holdTimerRef = useRef<number | undefined>(undefined);
  const holdIdRef = useRef<PlayableId | null>(null);
  const holdTriggeredRef = useRef<PlayableId | null>(null);
  const pointerOriginRef = useRef({ x: 0, y: 0 });
  const previousVolumesRef = useRef<Partial<Record<PlayableId, number>>>({});

  useEffect(() => {
    if (!enabled) return;

    let root: HTMLDivElement | null = null;
    const syncMount = () => {
      const audioControls = document.querySelector<HTMLElement>('.v10SessionOverlay .v10AudioControls');
      const signalSlider = audioControls?.querySelector<HTMLInputElement>('input[type="range"]');
      if (signalSlider) {
        signalSlider.min = '0';
        signalSlider.setAttribute('aria-valuemin', '0');
      }

      if (!audioControls) {
        root?.remove();
        root = null;
        setMount(null);
        setStatus('closed');
        return;
      }

      if (!root || !root.isConnected) {
        root = document.createElement('div');
        root.id = 'ev-session-atmosphere-root';
        audioControls.insertAdjacentElement('afterend', root);
        setMount(root);
      }
      setStatus(getSessionStatus());
    };

    const observer = new MutationObserver(syncMount);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    syncMount();

    return () => {
      observer.disconnect();
      root?.remove();
      setMount(null);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    setLayers(readAmbientMix().layers);
    const unsubscribeMix = subscribeToAmbientMix((snapshot) => setLayers(snapshot.layers));
    const unsubscribeRuntime = subscribeToAmbientRuntime(setRuntime);
    return () => {
      unsubscribeMix();
      unsubscribeRuntime();
    };
  }, [enabled]);

  useEffect(() => {
    if (!selectedId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedId]);

  const cancelHold = () => {
    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = undefined;
    holdIdRef.current = null;
  };

  const beginHold = (event: React.PointerEvent<HTMLButtonElement>, id: PlayableId) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    cancelHold();
    holdIdRef.current = id;
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    holdTimerRef.current = window.setTimeout(() => {
      holdTriggeredRef.current = id;
      setSelectedId(id);
      cancelHold();
    }, 420);
  };

  const moveHold = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!holdIdRef.current) return;
    const distance = Math.hypot(
      event.clientX - pointerOriginRef.current.x,
      event.clientY - pointerOriginRef.current.y
    );
    if (distance > 10) cancelHold();
  };

  const toggleLayer = (id: PlayableId) => {
    if (holdTriggeredRef.current === id) {
      holdTriggeredRef.current = null;
      return;
    }
    dispatchAmbientCommand({ type: 'toggle', id });
  };

  const addedCount = useMemo(
    () => playableIds.filter((id) => layers.find((layer) => layer.id === id)?.enabled).length,
    [layers]
  );

  const selectedLayer = selectedId
    ? layers.find((layer) => layer.id === selectedId) ?? null
    : null;

  const setSelectedVolume = (volume: number) => {
    if (!selectedId) return;
    if (volume > 0) previousVolumesRef.current[selectedId] = volume;
    dispatchAmbientCommand({ type: 'set-volume', id: selectedId, volume });
  };

  const toggleMute = () => {
    if (!selectedId || !selectedLayer) return;
    if (selectedLayer.volume > 0) {
      previousVolumesRef.current[selectedId] = selectedLayer.volume;
      setSelectedVolume(0);
      return;
    }
    setSelectedVolume(previousVolumesRef.current[selectedId] ?? ambientCatalog[selectedId].defaultVolume);
  };

  if (!enabled || !mount || status === 'completed') return null;

  const controls = createPortal(
    <section className="evSessionAtmosphere" aria-labelledby="ev-session-atmosphere-title">
      <header className="evSessionAtmosphereHeader">
        <div>
          <span>Atmosphere</span>
          <strong id="ev-session-atmosphere-title">Build the sound around your signal.</strong>
        </div>
        <div className="evSessionAtmosphereCount">
          <strong>{addedCount}</strong>
          <span>{addedCount === 1 ? 'added' : 'added'}</span>
        </div>
      </header>

      <div className="evSessionAtmosphereGrid">
        {playableIds.map((id) => {
          const definition = ambientCatalog[id];
          const layer = layers.find((item) => item.id === id) ?? {
            id,
            enabled: false,
            volume: definition.defaultVolume
          };
          const percentage = Math.round(layer.volume * 100);
          const isSolo = runtime.soloId === id;

          return (
            <article className={`evSessionAtmosphereChip ${id} ${layer.enabled ? 'active' : ''} ${isSolo ? 'solo' : ''}`} key={id}>
              <button
                type="button"
                className="evSessionAtmosphereToggle"
                onClick={() => toggleLayer(id)}
                onPointerDown={(event) => beginHold(event, id)}
                onPointerMove={moveHold}
                onPointerUp={cancelHold}
                onPointerCancel={cancelHold}
                onPointerLeave={cancelHold}
                onContextMenu={(event) => event.preventDefault()}
                aria-pressed={layer.enabled}
                aria-label={`${layer.enabled ? 'Remove' : 'Add'} ${definition.name}. Hold for level controls.`}
              >
                <span aria-hidden="true">{layerSymbols[id]}</span>
                <span>
                  <strong>{definition.shortName}</strong>
                  <small>{isSolo ? 'Solo' : layer.enabled ? percentage === 0 ? 'Muted' : `${percentage}%` : shortDescriptions[id]}</small>
                </span>
              </button>
              <button
                type="button"
                className="evSessionAtmosphereLevels"
                onClick={() => setSelectedId(id)}
                aria-label={`Open ${definition.name} level controls`}
              >
                <span aria-hidden="true">≡</span>
              </button>
            </article>
          );
        })}
      </div>

      <footer className="evSessionAtmosphereFooter">
        <span>{status === 'paused' ? 'Changes are saved and return on Resume.' : 'Tap to blend. Hold a sound or tap levels to shape it.'}</span>
        <button
          type="button"
          onClick={() => dispatchAmbientCommand({ type: 'stop-all' })}
          disabled={addedCount === 0}
        >
          Stop atmosphere
        </button>
      </footer>
    </section>,
    mount
  );

  const sheet = selectedId && selectedLayer && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="evAtmosphereSheetBackdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setSelectedId(null)}
        >
          <section
            className={`evAtmosphereSheet ${selectedId}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ev-atmosphere-sheet-title"
          >
            <header>
              <div>
                <span>{selectedLayer.enabled ? runtime.soloId === selectedId ? 'Solo layer' : 'Added layer' : 'Available layer'}</span>
                <h3 id="ev-atmosphere-sheet-title">{ambientCatalog[selectedId].name}</h3>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Close atmosphere controls">×</button>
            </header>

            <p>{shortDescriptions[selectedId]} Changes apply instantly without restarting the timer.</p>

            <label className="evAtmosphereSheetVolume">
              <span>Layer volume</span>
              <strong>{selectedLayer.volume === 0 ? 'Muted' : `${Math.round(selectedLayer.volume * 100)}%`}</strong>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedLayer.volume}
                onChange={(event) => setSelectedVolume(Number(event.target.value))}
                aria-label={`${ambientCatalog[selectedId].name} volume`}
              />
            </label>

            <div className="evAtmosphereSheetActions">
              <button type="button" onClick={toggleMute}>
                {selectedLayer.volume === 0 ? 'Restore volume' : 'Mute'}
              </button>
              <button
                type="button"
                className={runtime.soloId === selectedId ? 'active' : ''}
                onClick={() => dispatchAmbientCommand({ type: 'solo', id: selectedId })}
              >
                {runtime.soloId === selectedId ? 'End solo' : 'Solo'}
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => dispatchAmbientCommand({ type: 'toggle', id: selectedId })}
              >
                {selectedLayer.enabled ? 'Remove layer' : 'Add layer'}
              </button>
            </div>
          </section>
        </div>,
        document.body
      )
    : null;

  return <>{controls}{sheet}</>;
}
