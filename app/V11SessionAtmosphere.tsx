'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { ambientCatalog } from './ambient-catalog';
import {
  ambientShortDescriptions,
  ambientSymbols,
  playableAmbientCategories,
  playableAmbientIds,
  type PlayableAmbientId
} from './ambient-playable';
import {
  dispatchAmbientCommand,
  readAmbientMix,
  readAmbientRuntime,
  subscribeToAmbientMix,
  subscribeToAmbientRuntime,
  type AmbientRuntimeSnapshot
} from './ambient-mixer-store';
import PrecisionVolumeControl from './PrecisionVolumeControl';
import { formatGainPercent } from './precision-audio';
import type { AmbientLayerConfig } from './voyage-model';

type SessionStatus = 'ready' | 'running' | 'paused' | 'completed' | 'closed';

function getSessionStatus(): SessionStatus {
  const session = document.querySelector<HTMLElement>('.v10SessionOverlay');
  if (!session) return 'closed';
  if (session.classList.contains('running')) return 'running';
  if (session.classList.contains('paused')) return 'paused';
  if (session.classList.contains('completed')) return 'completed';
  return 'ready';
}

function stateClassName(label: string): string {
  return label.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
}

export default function V11SessionAtmosphere() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [layers, setLayers] = useState<AmbientLayerConfig[]>(() => readAmbientMix().layers);
  const [selectedId, setSelectedId] = useState<PlayableAmbientId | null>(null);
  const [status, setStatus] = useState<SessionStatus>('closed');
  const [runtime, setRuntime] = useState<AmbientRuntimeSnapshot>(() => readAmbientRuntime());
  const holdTimerRef = useRef<number | undefined>(undefined);
  const holdIdRef = useRef<PlayableAmbientId | null>(null);
  const holdTriggeredRef = useRef<PlayableAmbientId | null>(null);
  const pointerOriginRef = useRef({ x: 0, y: 0 });
  const previousVolumesRef = useRef<Partial<Record<PlayableAmbientId, number>>>({});

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
    setRuntime(readAmbientRuntime());
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

  const beginHold = (event: React.PointerEvent<HTMLButtonElement>, id: PlayableAmbientId) => {
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

  const toggleLayer = (id: PlayableAmbientId) => {
    if (holdTriggeredRef.current === id) {
      holdTriggeredRef.current = null;
      return;
    }
    const playbackState = runtime.layers[id]?.playbackState;
    if (playbackState === 'loading' || playbackState === 'buffering') return;
    dispatchAmbientCommand({ type: 'toggle', id });
  };

  const addedCount = useMemo(
    () => playableAmbientIds.filter((id) => layers.find((layer) => layer.id === id)?.enabled).length,
    [layers]
  );

  const playingCount = useMemo(
    () => playableAmbientIds.filter((id) => {
      const layer = layers.find((item) => item.id === id);
      const playbackState = runtime.layers[id]?.playbackState;
      return Boolean(layer?.enabled && layer.volume > 0 && playbackState === 'playing');
    }).length,
    [layers, runtime.layers]
  );

  const selectedLayer = selectedId
    ? layers.find((layer) => layer.id === selectedId) ?? null
    : null;
  const selectedRuntime = selectedId ? runtime.layers[selectedId] : undefined;

  const setSelectedVolume = (volume: number) => {
    if (!selectedId) return;
    if (volume > 0) previousVolumesRef.current[selectedId] = volume;
    dispatchAmbientCommand({ type: 'set-volume', id: selectedId, volume });
  };

  const toggleMute = () => {
    if (!selectedId || !selectedLayer || !selectedLayer.enabled) return;
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
        <div className="evSessionAtmosphereCount" aria-label={`${playingCount} atmosphere layers playing`}>
          <strong>{playingCount}</strong>
          <span>playing</span>
        </div>
      </header>

      {runtime.restoreRequired ? (
        <div className="evAtmosphereRestoreNotice" role="status">
          <span>Audio was paused by your browser or output device.</span>
          <button type="button" onClick={() => dispatchAmbientCommand({ type: 'sync' })}>
            Restore audio
          </button>
        </div>
      ) : null}

      <div className="evSessionAtmosphereLibrary">
        {playableAmbientCategories.map((category) => (
          <section
            className="evSessionAtmosphereCategory"
            data-category={category.label.toLowerCase()}
            aria-labelledby={`ev-session-category-${category.label.toLowerCase()}`}
            key={category.label}
          >
            <div className="evSessionAtmosphereCategoryHeading">
              <span id={`ev-session-category-${category.label.toLowerCase()}`}>{category.label}</span>
            </div>

            <div className="evSessionAtmosphereGrid">
              {category.ids.map((id) => {
                const definition = ambientCatalog[id];
                const layer = layers.find((item) => item.id === id) ?? {
                  id,
                  enabled: false,
                  volume: definition.defaultVolume
                };
                const layerRuntime = runtime.layers[id];
                const playbackState = layerRuntime?.playbackState ?? 'idle';
                const isSolo = runtime.soloId === id;
                const isMuted = layer.enabled && layer.volume === 0;
                const isBusy = playbackState === 'loading' || playbackState === 'buffering';
                const hasError = playbackState === 'error';
                const isPlaying = layer.enabled && playbackState === 'playing' && layer.volume > 0;
                const stateLabel = hasError
                  ? "Couldn't load"
                  : playbackState === 'loading'
                    ? 'Loading…'
                    : playbackState === 'buffering'
                      ? 'Buffering…'
                      : status !== 'running' && layer.enabled
                        ? 'Paused'
                        : isSolo
                          ? 'Solo'
                          : isMuted
                            ? 'Muted'
                            : isPlaying
                              ? 'Playing'
                              : 'Off';
                const stateClass = stateClassName(stateLabel);

                return (
                  <article
                    className={`evSessionAtmosphereChip ${id} ${isPlaying ? 'active' : 'inactive'} ${isMuted ? 'muted' : ''} ${isSolo ? 'solo' : ''} ${isBusy ? 'busy' : ''} ${hasError ? 'error' : ''}`}
                    key={id}
                  >
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
                      aria-busy={isBusy}
                      disabled={isBusy}
                      aria-label={`${layer.enabled ? 'Remove' : 'Add'} ${definition.name}. Hold for volume controls.`}
                    >
                      <span className="evSessionAtmosphereIcon" aria-hidden="true">{ambientSymbols[id]}</span>
                      <span className="evSessionAtmosphereCopy">
                        <strong>{definition.shortName}</strong>
                        <small>{ambientShortDescriptions[id]}</small>
                        <em className={`evSessionAtmosphereState ${stateClass}`}>
                          {stateLabel !== 'Off' && stateLabel !== 'Paused' ? <i aria-hidden="true" /> : null}
                          {stateLabel}
                        </em>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="evSessionAtmosphereLevels"
                      onClick={() => {
                        if (hasError) dispatchAmbientCommand({ type: 'retry', id });
                        else if (!isBusy) setSelectedId(id);
                      }}
                      disabled={isBusy}
                      aria-label={hasError
                        ? `Retry ${definition.name}`
                        : `Adjust ${definition.name} volume, currently ${formatGainPercent(layer.volume)}`}
                    >
                      <span>{hasError ? 'Retry' : isBusy ? 'Wait' : layer.enabled ? 'Volume' : 'Adjust'}</span>
                      <small>{hasError ? '↻' : formatGainPercent(layer.volume)}</small>
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="evSessionAtmosphereFooter">
        <span>{runtime.restoreRequired
          ? 'Use Restore audio after returning from background or changing devices.'
          : status === 'paused'
            ? 'Changes are saved and return on Resume.'
            : 'Combine as many sounds as you like.'}</span>
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
                <span>{selectedRuntime?.playbackState === 'error'
                  ? 'Layer unavailable'
                  : selectedRuntime?.playbackState === 'loading'
                    ? 'Loading layer'
                    : selectedRuntime?.playbackState === 'buffering'
                      ? 'Buffering layer'
                      : selectedLayer.enabled
                        ? runtime.soloId === selectedId
                          ? 'Solo layer'
                          : selectedLayer.volume === 0
                            ? 'Muted layer'
                            : status === 'running'
                              ? 'Playing layer'
                              : 'Paused layer'
                        : 'Available layer'}</span>
                <h3 id="ev-atmosphere-sheet-title">{ambientCatalog[selectedId].name}</h3>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Close atmosphere controls">×</button>
            </header>

            <p>{selectedRuntime?.playbackState === 'error'
              ? 'This recording could not load. Retry uses the primary source once, then the fallback source.'
              : `${ambientShortDescriptions[selectedId]} Changes apply instantly without restarting the timer.`}</p>

            <PrecisionVolumeControl
              className="evAtmosphereSheetPrecision"
              value={selectedLayer.volume}
              onChange={setSelectedVolume}
              ariaLabel={`${ambientCatalog[selectedId].name} volume`}
            />

            <div className={`evAtmosphereSheetActions ${selectedLayer.enabled ? '' : 'available'}`}>
              {selectedRuntime?.playbackState === 'error' ? (
                <button
                  type="button"
                  className="primary"
                  onClick={() => dispatchAmbientCommand({ type: 'retry', id: selectedId })}
                >
                  Retry sound
                </button>
              ) : selectedLayer.enabled ? (
                <>
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
                    Remove layer
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="primary"
                  onClick={() => dispatchAmbientCommand({ type: 'toggle', id: selectedId })}
                >
                  Add layer
                </button>
              )}
            </div>
          </section>
        </div>,
        document.body
      )
    : null;

  return <>{controls}{sheet}</>;
}
