'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { ambientCatalog, type AmbientId } from './ambient-catalog';
import { AmbientMixerEngine } from './ambient-mixer-engine';
import { readAmbientMix, writeAmbientMix } from './ambient-mixer-store';
import { createDefaultAmbientLayers, type AmbientLayerConfig } from './voyage-model';

const playableIds = ['white-noise', 'brown-noise', 'pink-noise'] as const satisfies readonly AmbientId[];
const upcomingIds = ['rain', 'ocean', 'birds', 'airplane', 'cafe', 'fire'] as const satisfies readonly AmbientId[];

type PlayableId = (typeof playableIds)[number];

const layerSymbols: Record<PlayableId, string> = {
  'white-noise': '◌',
  'brown-noise': '≈',
  'pink-noise': '∿'
};

function createSilentInitialLayers(): AmbientLayerConfig[] {
  return createDefaultAmbientLayers().map((layer) => ({ ...layer, enabled: false }));
}

export default function V11AmbientMixer() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [layers, setLayers] = useState<AmbientLayerConfig[]>(createSilentInitialLayers);
  const [busyId, setBusyId] = useState<PlayableId | null>(null);
  const [error, setError] = useState('');
  const engineRef = useRef<AmbientMixerEngine | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const layersRef = useRef(layers);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    if (!enabled) return;

    const summary = document.querySelector<HTMLElement>('.sessionBuilder .selectedSummary');
    const builderLower = document.querySelector<HTMLElement>('.sessionBuilder .builderLower');
    if (!summary && !builderLower) return;

    const root = document.createElement('div');
    root.id = 'ev-ambient-mixer-root';

    if (summary?.parentElement) summary.parentElement.insertBefore(root, summary);
    else builderLower?.insertAdjacentElement('afterend', root);

    const stored = readAmbientMix().layers.map((layer) => ({ ...layer, enabled: false }));
    setLayers(stored);
    setMount(root);

    return () => {
      root.remove();
      setMount(null);
    };
  }, [enabled]);

  const ensureEngine = useCallback(async () => {
    if (engineRef.current && contextRef.current?.state !== 'closed') {
      if (contextRef.current?.state === 'suspended') await contextRef.current.resume();
      return engineRef.current;
    }

    const AudioContextClass =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) throw new Error('Ambient audio is not supported in this browser.');

    const context = new AudioContextClass();
    if (context.state === 'suspended') await context.resume();

    const engine = new AmbientMixerEngine(context);
    contextRef.current = context;
    engineRef.current = engine;
    return engine;
  }, []);

  const persistLayers = useCallback((nextLayers: AmbientLayerConfig[]) => {
    layersRef.current = nextLayers;
    setLayers(nextLayers);
    writeAmbientMix(nextLayers);
  }, []);

  const toggleLayer = useCallback(async (id: PlayableId) => {
    if (busyId) return;
    const current = layersRef.current.find((layer) => layer.id === id);
    if (!current) return;

    setBusyId(id);
    setError('');

    try {
      const engine = await ensureEngine();
      const nextEnabled = !current.enabled;

      if (nextEnabled) await engine.startLayer(id, current.volume);
      else await engine.stopLayer(id);

      persistLayers(layersRef.current.map((layer) => (
        layer.id === id ? { ...layer, enabled: nextEnabled } : layer
      )));
    } catch {
      setError('The atmosphere could not start. Try tapping the layer again.');
    } finally {
      setBusyId(null);
    }
  }, [busyId, ensureEngine, persistLayers]);

  const changeVolume = useCallback((id: PlayableId, volume: number) => {
    const nextLayers = layersRef.current.map((layer) => (
      layer.id === id ? { ...layer, volume } : layer
    ));
    persistLayers(nextLayers);
    engineRef.current?.setLayerVolume(id, volume);
  }, [persistLayers]);

  const stopAll = useCallback(async () => {
    setError('');
    await engineRef.current?.stopAll(0.28);
    persistLayers(layersRef.current.map((layer) => ({ ...layer, enabled: false })));
  }, [persistLayers]);

  useEffect(() => {
    if (!enabled) return;

    const syncSessionState = () => {
      const engine = engineRef.current;
      if (!engine) return;

      const session = document.querySelector<HTMLElement>('.v10SessionOverlay');
      if (!session) return;

      if (session.classList.contains('paused') || session.classList.contains('completed')) {
        void engine.stopAll(0.26);
        return;
      }

      if (session.classList.contains('running')) {
        layersRef.current
          .filter((layer): layer is AmbientLayerConfig & { id: PlayableId } => (
            layer.enabled && playableIds.includes(layer.id as PlayableId)
          ))
          .forEach((layer) => void engine.startLayer(layer.id, layer.volume));
      }
    };

    const observer = new MutationObserver(syncSessionState);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      const context = contextRef.current;
      engineRef.current = null;
      contextRef.current = null;
      void engine?.dispose().finally(() => context?.close().catch(() => undefined));
    };
  }, []);

  const activeCount = useMemo(
    () => playableIds.filter((id) => layers.find((layer) => layer.id === id)?.enabled).length,
    [layers]
  );

  if (!enabled || !mount) return null;

  return createPortal(
    <section className="evAmbientMixer" aria-labelledby="ev-ambient-mixer-title">
      <header className="evAmbientMixerHeader">
        <div>
          <span className="evAmbientMixerEyebrow">Atmosphere mixer · V11 beta</span>
          <h3 id="ev-ambient-mixer-title">Shape the space around your signal.</h3>
          <p>Add one texture or blend all three. Each layer has its own volume and continues into your voyage.</p>
        </div>
        <div className="evAmbientMixerStatus">
          <strong>{activeCount}</strong>
          <span>{activeCount === 1 ? 'layer active' : 'layers active'}</span>
          <button type="button" onClick={stopAll} disabled={activeCount === 0}>Stop all</button>
        </div>
      </header>

      <div className="evAmbientLayerGrid">
        {playableIds.map((id) => {
          const definition = ambientCatalog[id];
          const layer = layers.find((item) => item.id === id) ?? {
            id,
            enabled: false,
            volume: definition.defaultVolume
          };
          const isBusy = busyId === id;

          return (
            <article className={`evAmbientLayer ${id} ${layer.enabled ? 'active' : ''}`} key={id}>
              <button
                type="button"
                className="evAmbientLayerToggle"
                onClick={() => void toggleLayer(id)}
                aria-pressed={layer.enabled}
                disabled={isBusy}
              >
                <span className="evAmbientLayerIcon" aria-hidden="true">{layerSymbols[id]}</span>
                <span className="evAmbientLayerCopy">
                  <strong>{definition.name}</strong>
                  <small>{definition.description}</small>
                </span>
                <span className="evAmbientLayerState">{isBusy ? 'Starting…' : layer.enabled ? 'On' : 'Add'}</span>
              </button>

              <label className="evAmbientVolume">
                <span>Layer volume</span>
                <strong>{Math.round(layer.volume * 100)}%</strong>
                <input
                  type="range"
                  min="0.04"
                  max="0.5"
                  step="0.01"
                  value={layer.volume}
                  onChange={(event) => changeVolume(id, Number(event.target.value))}
                  aria-label={`${definition.name} volume`}
                />
              </label>
            </article>
          );
        })}
      </div>

      <div className="evAmbientComingNext">
        <div>
          <span>High-fidelity atmosphere pack</span>
          <strong>Rain, ocean, birds and places are next.</strong>
        </div>
        <div className="evAmbientUpcomingChips" aria-label="Upcoming ambient sounds">
          {upcomingIds.map((id) => <span key={id}>{ambientCatalog[id].shortName}</span>)}
        </div>
      </div>

      {error ? <p className="evAmbientMixerError" role="status">{error}</p> : null}
    </section>,
    mount
  );
}
