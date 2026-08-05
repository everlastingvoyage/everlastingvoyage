'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { ambientCatalog, type AmbientId } from './ambient-catalog';
import { AmbientMixerEngine } from './ambient-mixer-engine';
import {
  dispatchAmbientCommand,
  publishAmbientRuntime,
  readAmbientMix,
  subscribeToAmbientCommands,
  subscribeToAmbientMix,
  writeAmbientMix,
  type AmbientCommand
} from './ambient-mixer-store';
import { clampUnitVolume, createDefaultAmbientLayers, type AmbientLayerConfig } from './voyage-model';

const playableIds = ['white-noise', 'brown-noise', 'pink-noise'] as const satisfies readonly AmbientId[];
const upcomingIds = ['rain', 'ocean', 'birds', 'airplane', 'cafe', 'fire'] as const satisfies readonly AmbientId[];

type PlayableId = (typeof playableIds)[number];

const layerSymbols: Record<PlayableId, string> = {
  'white-noise': '◌',
  'brown-noise': '≈',
  'pink-noise': '∿'
};

const shortDescriptions: Record<PlayableId, string> = {
  'white-noise': 'Bright, even sound masking.',
  'brown-noise': 'Deep, soft low-frequency masking.',
  'pink-noise': 'Balanced, natural noise texture.'
};

function createSilentInitialLayers(): AmbientLayerConfig[] {
  return createDefaultAmbientLayers().map((layer) => ({ ...layer, enabled: false }));
}

function isPlayableId(id: AmbientId): id is PlayableId {
  return playableIds.includes(id as PlayableId);
}

function sessionAllowsAtmosphere(): boolean {
  const session = document.querySelector<HTMLElement>('.v10SessionOverlay');
  if (!session) return true;
  return !session.classList.contains('paused') && !session.classList.contains('completed');
}

export default function V11AmbientMixer() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [layers, setLayers] = useState<AmbientLayerConfig[]>(createSilentInitialLayers);
  const [busyId, setBusyId] = useState<PlayableId | null>(null);
  const [soloId, setSoloId] = useState<PlayableId | null>(null);
  const [error, setError] = useState('');
  const engineRef = useRef<AmbientMixerEngine | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const layersRef = useRef(layers);
  const soloIdRef = useRef<PlayableId | null>(null);
  const commandRunRef = useRef(0);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    soloIdRef.current = soloId;
  }, [soloId]);

  useEffect(() => {
    if (!enabled) return;

    const summary = document.querySelector<HTMLElement>('.sessionBuilder .selectedSummary');
    const builderLower = document.querySelector<HTMLElement>('.sessionBuilder .builderLower');
    if (!summary && !builderLower) return;

    const root = document.createElement('div');
    root.id = 'ev-ambient-mixer-root';

    if (summary?.parentElement) summary.parentElement.insertBefore(root, summary);
    else builderLower?.insertAdjacentElement('afterend', root);

    const stored = readAmbientMix().layers;
    layersRef.current = stored;
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

  const publishRuntime = useCallback(() => {
    publishAmbientRuntime({
      soloId: soloIdRef.current,
      audible: sessionAllowsAtmosphere()
    });
  }, []);

  const syncEngine = useCallback(async (nextLayers: AmbientLayerConfig[], allowCreate: boolean) => {
    const audible = sessionAllowsAtmosphere();
    publishAmbientRuntime({ soloId: soloIdRef.current, audible });

    if (!audible) {
      await engineRef.current?.stopAll(0.26);
      return;
    }

    const engine = allowCreate ? await ensureEngine() : engineRef.current;
    if (!engine) return;

    const enabledLayers = nextLayers.filter(
      (layer): layer is AmbientLayerConfig & { id: PlayableId } => layer.enabled && isPlayableId(layer.id)
    );
    const selectedLayers = soloIdRef.current
      ? enabledLayers.filter((layer) => layer.id === soloIdRef.current)
      : enabledLayers;
    const selectedIds = new Set(selectedLayers.map((layer) => layer.id));

    await Promise.all(selectedLayers.map((layer) => engine.startLayer(layer.id, layer.volume)));
    await Promise.all(
      engine.activeLayerIds
        .filter((id) => isPlayableId(id) && !selectedIds.has(id))
        .map((id) => engine.stopLayer(id, 0.22))
    );
  }, [ensureEngine]);

  const handleCommand = useCallback(async (command: AmbientCommand) => {
    const runId = commandRunRef.current + 1;
    commandRunRef.current = runId;
    setError('');

    if (command.type === 'stop-all') {
      soloIdRef.current = null;
      setSoloId(null);
      await engineRef.current?.stopAll(0.28);
      persistLayers(layersRef.current.map((layer) => ({ ...layer, enabled: false })));
      publishRuntime();
      return;
    }

    if (command.type === 'sync') {
      await syncEngine(layersRef.current, false);
      return;
    }

    if (command.type === 'clear-solo') {
      soloIdRef.current = null;
      setSoloId(null);
      await syncEngine(layersRef.current, false);
      return;
    }

    if (!isPlayableId(command.id)) return;
    const current = layersRef.current.find((layer) => layer.id === command.id);
    if (!current) return;

    if (command.type === 'set-volume') {
      const volume = clampUnitVolume(command.volume, current.volume);
      const nextLayers = layersRef.current.map((layer) => (
        layer.id === command.id ? { ...layer, volume } : layer
      ));
      persistLayers(nextLayers);

      if (
        sessionAllowsAtmosphere() &&
        current.enabled &&
        (!soloIdRef.current || soloIdRef.current === command.id)
      ) {
        engineRef.current?.setLayerVolume(command.id, volume);
      }
      return;
    }

    if (command.type === 'solo') {
      const nextSoloId = soloIdRef.current === command.id ? null : command.id;
      soloIdRef.current = nextSoloId;
      setSoloId(nextSoloId);

      const nextLayers = current.enabled
        ? layersRef.current
        : layersRef.current.map((layer) => (
            layer.id === command.id ? { ...layer, enabled: true } : layer
          ));

      if (!current.enabled) persistLayers(nextLayers);
      await syncEngine(nextLayers, true);
      return;
    }

    setBusyId(command.id);
    try {
      const nextEnabled = !current.enabled;
      let nextSoloId = soloIdRef.current;
      if (!nextEnabled && nextSoloId === command.id) {
        nextSoloId = null;
        soloIdRef.current = null;
        setSoloId(null);
      }

      const nextLayers = layersRef.current.map((layer) => (
        layer.id === command.id ? { ...layer, enabled: nextEnabled } : layer
      ));
      persistLayers(nextLayers);

      if (nextEnabled) {
        if (sessionAllowsAtmosphere() && (!nextSoloId || nextSoloId === command.id)) {
          const engine = await ensureEngine();
          await engine.startLayer(command.id, current.volume);
        }
      } else {
        await engineRef.current?.stopLayer(command.id, 0.24);
      }

      if (commandRunRef.current === runId) publishRuntime();
    } catch {
      setError('The atmosphere could not start. Try tapping the layer again.');
    } finally {
      if (commandRunRef.current === runId) setBusyId(null);
    }
  }, [ensureEngine, persistLayers, publishRuntime, syncEngine]);

  useEffect(() => {
    if (!enabled) return;
    const unsubscribeMix = subscribeToAmbientMix((snapshot) => {
      layersRef.current = snapshot.layers;
      setLayers(snapshot.layers);
      void syncEngine(snapshot.layers, false);
    });
    const unsubscribeCommands = subscribeToAmbientCommands((command) => {
      void handleCommand(command);
    });

    return () => {
      unsubscribeMix();
      unsubscribeCommands();
    };
  }, [enabled, handleCommand, syncEngine]);

  useEffect(() => {
    if (!enabled) return;

    let lastStatus = '';
    const syncSessionState = () => {
      const session = document.querySelector<HTMLElement>('.v10SessionOverlay');
      const status = session
        ? ['running', 'paused', 'completed', 'ready'].find((item) => session.classList.contains(item)) ?? 'open'
        : 'builder';
      if (status === lastStatus) return;
      lastStatus = status;
      void syncEngine(layersRef.current, false);
    };

    const observer = new MutationObserver(syncSessionState);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    syncSessionState();

    return () => observer.disconnect();
  }, [enabled, syncEngine]);

  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      const context = contextRef.current;
      engineRef.current = null;
      contextRef.current = null;
      void engine?.dispose().finally(() => context?.close().catch(() => undefined));
    };
  }, []);

  const addedCount = useMemo(
    () => playableIds.filter((id) => layers.find((layer) => layer.id === id)?.enabled).length,
    [layers]
  );

  if (!enabled || !mount) return null;

  return createPortal(
    <section className="evAmbientMixer" aria-labelledby="ev-ambient-mixer-title">
      <header className="evAmbientMixerHeader">
        <div>
          <span className="evAmbientMixerEyebrow">Atmosphere mixer</span>
          <h3 id="ev-ambient-mixer-title">Shape the space around your signal.</h3>
          <p>Tap one texture or blend all three. Every layer stays synchronized with your live voyage controls.</p>
        </div>
        <div className="evAmbientMixerStatus">
          <strong>{addedCount}</strong>
          <span>{addedCount === 1 ? 'layer added' : 'layers added'}</span>
          <button type="button" onClick={() => dispatchAmbientCommand({ type: 'stop-all' })} disabled={addedCount === 0}>Stop all</button>
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
          const percentage = Math.round(layer.volume * 100);

          return (
            <article className={`evAmbientLayer ${id} ${layer.enabled ? 'active' : ''} ${soloId === id ? 'solo' : ''}`} key={id}>
              <button
                type="button"
                className="evAmbientLayerToggle"
                onClick={() => dispatchAmbientCommand({ type: 'toggle', id })}
                aria-pressed={layer.enabled}
                disabled={isBusy}
              >
                <span className="evAmbientLayerIcon" aria-hidden="true">{layerSymbols[id]}</span>
                <span className="evAmbientLayerCopy">
                  <strong>{definition.name}</strong>
                  <small>{shortDescriptions[id]}</small>
                </span>
                <span className="evAmbientLayerState">{isBusy ? 'Starting…' : layer.enabled ? 'On' : 'Add'}</span>
              </button>

              <label className="evAmbientVolume">
                <span>Layer volume</span>
                <strong>{percentage === 0 ? 'Muted' : `${percentage}%`}</strong>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={layer.volume}
                  onChange={(event) => dispatchAmbientCommand({
                    type: 'set-volume',
                    id,
                    volume: Number(event.target.value)
                  })}
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
