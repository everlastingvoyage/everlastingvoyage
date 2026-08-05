'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  AmbientMixerEngine,
  preloadAmbientMetadata,
  releaseAmbientMetadata
} from './ambient-mixer-engine';
import {
  publishAmbientRuntime,
  readAmbientMix,
  subscribeToAmbientCommands,
  subscribeToAmbientMix,
  subscribeToAmbientRestoreRequests,
  writeAmbientMix,
  type AmbientCommand
} from './ambient-mixer-store';
import {
  createIdleAmbientRuntimeState,
  type AmbientLayerRuntimeMap
} from './ambient-runtime';
import {
  isPlayableAmbientId,
  playableAmbientIds,
  type PlayableAmbientId
} from './ambient-playable';
import {
  clampUnitVolume,
  createDefaultAmbientLayers,
  type AmbientLayerConfig
} from './voyage-model';

type SessionStatus = 'ready' | 'running' | 'paused' | 'completed' | 'closed';

function createSilentInitialLayers(): AmbientLayerConfig[] {
  return createDefaultAmbientLayers().map((layer) => ({ ...layer, enabled: false }));
}

function createInitialRuntimeStates(): AmbientLayerRuntimeMap {
  return Object.fromEntries(
    playableAmbientIds.map((id) => [id, createIdleAmbientRuntimeState()])
  ) as AmbientLayerRuntimeMap;
}

function getSessionStatus(): SessionStatus {
  const session = document.querySelector<HTMLElement>('.v10SessionOverlay');
  if (!session) return 'closed';
  if (session.classList.contains('running')) return 'running';
  if (session.classList.contains('paused')) return 'paused';
  if (session.classList.contains('completed')) return 'completed';
  return 'ready';
}

export default function V11AmbientMixer() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const engineRef = useRef<AmbientMixerEngine | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const layersRef = useRef<AmbientLayerConfig[]>(createSilentInitialLayers());
  const soloIdRef = useRef<PlayableAmbientId | null>(null);
  const runtimeStatesRef = useRef<AmbientLayerRuntimeMap>(createInitialRuntimeStates());
  const restoreRequiredRef = useRef(false);
  const commandRunRef = useRef(0);

  const publishRuntime = useCallback(() => {
    const status = typeof document === 'undefined' ? 'closed' : getSessionStatus();
    publishAmbientRuntime({
      soloId: soloIdRef.current,
      audible: status === 'running' && !restoreRequiredRef.current,
      restoreRequired: restoreRequiredRef.current,
      layers: runtimeStatesRef.current
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    layersRef.current = readAmbientMix().layers;
    preloadAmbientMetadata(['rain', 'ocean', 'birds', 'nature', 'storm']);
    publishRuntime();
  }, [enabled, publishRuntime]);

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

    const engine = new AmbientMixerEngine(context, context.destination, (event) => {
      runtimeStatesRef.current = {
        ...runtimeStatesRef.current,
        [event.id]: {
          playbackState: event.playbackState,
          retryCount: event.retryCount,
          source: event.source,
          errorMessage: event.errorMessage
        }
      };
      publishRuntime();
    });

    const handleContextState = () => {
      if (context.state === 'suspended' && getSessionStatus() === 'running') {
        restoreRequiredRef.current = true;
      }
      if (context.state === 'running') restoreRequiredRef.current = false;
      publishRuntime();
    };
    context.addEventListener('statechange', handleContextState);

    contextRef.current = context;
    engineRef.current = engine;
    return engine;
  }, [publishRuntime]);

  const persistLayers = useCallback((nextLayers: AmbientLayerConfig[]) => {
    layersRef.current = nextLayers;
    writeAmbientMix(nextLayers);
  }, []);

  const setConfiguredPausedStates = useCallback((layers: AmbientLayerConfig[]) => {
    const next = { ...runtimeStatesRef.current };
    layers.forEach((layer) => {
      if (!isPlayableAmbientId(layer.id)) return;
      const current = next[layer.id] ?? createIdleAmbientRuntimeState();
      if (layer.enabled && current.playbackState === 'idle') {
        next[layer.id] = { ...current, playbackState: 'paused' };
      } else if (!layer.enabled && current.playbackState !== 'loading') {
        next[layer.id] = { ...current, playbackState: 'idle', errorMessage: undefined };
      }
    });
    runtimeStatesRef.current = next;
  }, []);

  const syncEngine = useCallback(async (nextLayers: AmbientLayerConfig[], allowCreate: boolean) => {
    const status = getSessionStatus();
    const enabledLayers = nextLayers.filter(
      (layer): layer is AmbientLayerConfig & { id: PlayableAmbientId } => (
        layer.enabled && isPlayableAmbientId(layer.id)
      )
    );
    const selectedLayers = soloIdRef.current
      ? enabledLayers.filter((layer) => layer.id === soloIdRef.current)
      : enabledLayers;
    const selectedIds = new Set(selectedLayers.map((layer) => layer.id));

    if (status === 'completed' || status === 'closed') {
      restoreRequiredRef.current = false;
      await engineRef.current?.stopAll(0.24);
      publishRuntime();
      return;
    }

    if (status !== 'running') {
      restoreRequiredRef.current = false;
      await engineRef.current?.pauseAll(0.16);
      setConfiguredPausedStates(nextLayers);
      publishRuntime();
      return;
    }

    if (selectedLayers.length === 0) {
      restoreRequiredRef.current = false;
      await engineRef.current?.stopAll(0.2);
      publishRuntime();
      return;
    }

    const engine = allowCreate ? await ensureEngine() : engineRef.current;
    if (!engine) {
      setConfiguredPausedStates(nextLayers);
      publishRuntime();
      return;
    }

    restoreRequiredRef.current = false;
    await Promise.all(selectedLayers.map((layer) => engine.startLayer(layer.id, layer.volume)));
    await Promise.all(
      engine.activeLayerIds
        .filter((id) => isPlayableAmbientId(id) && !selectedIds.has(id))
        .map((id) => engine.stopLayer(id, 0.22))
    );
    publishRuntime();
  }, [ensureEngine, publishRuntime, setConfiguredPausedStates]);

  const handleCommand = useCallback(async (command: AmbientCommand) => {
    const runId = commandRunRef.current + 1;
    commandRunRef.current = runId;

    if (command.type === 'stop-all') {
      soloIdRef.current = null;
      restoreRequiredRef.current = false;
      await engineRef.current?.stopAll(0.28);
      persistLayers(layersRef.current.map((layer) => ({ ...layer, enabled: false })));
      publishRuntime();
      return;
    }

    if (command.type === 'sync') {
      restoreRequiredRef.current = false;
      await syncEngine(layersRef.current, true);
      return;
    }

    if (command.type === 'clear-solo') {
      soloIdRef.current = null;
      await syncEngine(layersRef.current, getSessionStatus() === 'running');
      return;
    }

    if (!isPlayableAmbientId(command.id)) return;
    const current = layersRef.current.find((layer) => layer.id === command.id);
    if (!current) return;

    if (command.type === 'set-volume') {
      const volume = clampUnitVolume(command.volume, current.volume);
      const nextLayers = layersRef.current.map((layer) => (
        layer.id === command.id ? { ...layer, volume } : layer
      ));
      persistLayers(nextLayers);

      if (
        getSessionStatus() === 'running' &&
        current.enabled &&
        (!soloIdRef.current || soloIdRef.current === command.id)
      ) {
        engineRef.current?.setLayerVolume(command.id, volume);
      }
      return;
    }

    if (command.type === 'retry') {
      const nextLayers = current.enabled
        ? layersRef.current
        : layersRef.current.map((layer) => (
            layer.id === command.id ? { ...layer, enabled: true } : layer
          ));
      if (!current.enabled) persistLayers(nextLayers);

      if (getSessionStatus() !== 'running') {
        setConfiguredPausedStates(nextLayers);
        publishRuntime();
        return;
      }

      try {
        restoreRequiredRef.current = false;
        const engine = await ensureEngine();
        await engine.retryLayer(command.id, current.volume);
      } catch {
        // The engine publishes a recoverable error state for the UI.
      }
      publishRuntime();
      return;
    }

    if (command.type === 'solo') {
      const nextSoloId = soloIdRef.current === command.id ? null : command.id;
      soloIdRef.current = nextSoloId;

      const nextLayers = current.enabled
        ? layersRef.current
        : layersRef.current.map((layer) => (
            layer.id === command.id ? { ...layer, enabled: true } : layer
          ));

      if (!current.enabled) persistLayers(nextLayers);
      await syncEngine(nextLayers, getSessionStatus() === 'running');
      return;
    }

    try {
      const nextEnabled = !current.enabled;
      let nextSoloId = soloIdRef.current;
      if (!nextEnabled && nextSoloId === command.id) {
        nextSoloId = null;
        soloIdRef.current = null;
      }

      const nextLayers = layersRef.current.map((layer) => (
        layer.id === command.id ? { ...layer, enabled: nextEnabled } : layer
      ));
      persistLayers(nextLayers);

      if (nextEnabled) {
        if (getSessionStatus() === 'running' && (!nextSoloId || nextSoloId === command.id)) {
          const engine = await ensureEngine();
          await engine.startLayer(command.id, current.volume);
        } else {
          setConfiguredPausedStates(nextLayers);
        }
      } else {
        await engineRef.current?.stopLayer(command.id, 0.32);
      }

      if (commandRunRef.current === runId) publishRuntime();
    } catch {
      // The engine publishes the layer-specific error and Retry remains available.
      publishRuntime();
    }
  }, [ensureEngine, persistLayers, publishRuntime, setConfiguredPausedStates, syncEngine]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribeMix = subscribeToAmbientMix((snapshot) => {
      layersRef.current = snapshot.layers;
      void syncEngine(snapshot.layers, false);
    });
    const unsubscribeCommands = subscribeToAmbientCommands((command) => {
      void handleCommand(command);
    });
    const unsubscribeRestore = subscribeToAmbientRestoreRequests(() => {
      if (getSessionStatus() !== 'running') return;
      const hasEnabledLayers = layersRef.current.some((layer) => layer.enabled && isPlayableAmbientId(layer.id));
      if (!hasEnabledLayers) return;
      restoreRequiredRef.current = true;
      void engineRef.current?.pauseAll(0.12).finally(publishRuntime);
    });

    return () => {
      unsubscribeMix();
      unsubscribeCommands();
      unsubscribeRestore();
    };
  }, [enabled, handleCommand, publishRuntime, syncEngine]);

  useEffect(() => {
    if (!enabled) return;

    let lastStatus = '';
    const syncSessionState = () => {
      const status = getSessionStatus();
      if (status === lastStatus) return;
      lastStatus = status;
      void syncEngine(layersRef.current, status === 'running');
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
    if (!enabled) return;

    const markRestoreRequired = () => {
      if (getSessionStatus() !== 'running') return;
      const hasEnabledLayers = layersRef.current.some((layer) => layer.enabled && isPlayableAmbientId(layer.id));
      if (!hasEnabledLayers) return;
      restoreRequiredRef.current = true;
      publishRuntime();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        markRestoreRequired();
        return;
      }
      if (contextRef.current?.state === 'suspended') markRestoreRequired();
    };

    const handlePageShow = () => {
      if (contextRef.current?.state !== 'running') markRestoreRequired();
    };

    const mediaDevices = navigator.mediaDevices;
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', markRestoreRequired);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('blur', markRestoreRequired);
    mediaDevices?.addEventListener?.('devicechange', markRestoreRequired);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', markRestoreRequired);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('blur', markRestoreRequired);
      mediaDevices?.removeEventListener?.('devicechange', markRestoreRequired);
    };
  }, [enabled, publishRuntime]);

  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      const context = contextRef.current;
      engineRef.current = null;
      contextRef.current = null;
      releaseAmbientMetadata();
      void engine?.dispose().finally(() => context?.close().catch(() => undefined));
    };
  }, []);

  return null;
}
