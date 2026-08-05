'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AmbientMixerEngine } from './ambient-mixer-engine';
import {
  publishAmbientRuntime,
  readAmbientMix,
  subscribeToAmbientCommands,
  subscribeToAmbientMix,
  writeAmbientMix,
  type AmbientCommand
} from './ambient-mixer-store';
import {
  isPlayableAmbientId,
  type PlayableAmbientId
} from './ambient-playable';
import {
  clampUnitVolume,
  createDefaultAmbientLayers,
  type AmbientLayerConfig
} from './voyage-model';

function createSilentInitialLayers(): AmbientLayerConfig[] {
  return createDefaultAmbientLayers().map((layer) => ({ ...layer, enabled: false }));
}

function sessionAllowsAtmosphere(): boolean {
  const session = document.querySelector<HTMLElement>('.v10SessionOverlay');
  if (!session) return false;
  return !session.classList.contains('paused') && !session.classList.contains('completed');
}

export default function V11AmbientMixer() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const engineRef = useRef<AmbientMixerEngine | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const layersRef = useRef<AmbientLayerConfig[]>(createSilentInitialLayers());
  const soloIdRef = useRef<PlayableAmbientId | null>(null);
  const commandRunRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    layersRef.current = readAmbientMix().layers;
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

    const enabledLayers = nextLayers.filter(
      (layer): layer is AmbientLayerConfig & { id: PlayableAmbientId } => (
        layer.enabled && isPlayableAmbientId(layer.id)
      )
    );
    const selectedLayers = soloIdRef.current
      ? enabledLayers.filter((layer) => layer.id === soloIdRef.current)
      : enabledLayers;
    const selectedIds = new Set(selectedLayers.map((layer) => layer.id));

    if (!audible || selectedLayers.length === 0) {
      await engineRef.current?.stopAll(0.26);
      return;
    }

    const engine = allowCreate ? await ensureEngine() : engineRef.current;
    if (!engine) return;

    await Promise.all(selectedLayers.map((layer) => engine.startLayer(layer.id, layer.volume)));
    await Promise.all(
      engine.activeLayerIds
        .filter((id) => isPlayableAmbientId(id) && !selectedIds.has(id))
        .map((id) => engine.stopLayer(id, 0.22))
    );
  }, [ensureEngine]);

  const handleCommand = useCallback(async (command: AmbientCommand) => {
    const runId = commandRunRef.current + 1;
    commandRunRef.current = runId;

    if (command.type === 'stop-all') {
      soloIdRef.current = null;
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
      await syncEngine(layersRef.current, false);
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

      const nextLayers = current.enabled
        ? layersRef.current
        : layersRef.current.map((layer) => (
            layer.id === command.id ? { ...layer, enabled: true } : layer
          ));

      if (!current.enabled) persistLayers(nextLayers);
      await syncEngine(nextLayers, true);
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
        if (sessionAllowsAtmosphere() && (!nextSoloId || nextSoloId === command.id)) {
          const engine = await ensureEngine();
          await engine.startLayer(command.id, current.volume);
        }
      } else {
        await engineRef.current?.stopLayer(command.id, 0.24);
      }

      if (commandRunRef.current === runId) publishRuntime();
    } catch (error) {
      console.error('Unable to start atmosphere layer.', error);
    }
  }, [ensureEngine, persistLayers, publishRuntime, syncEngine]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribeMix = subscribeToAmbientMix((snapshot) => {
      layersRef.current = snapshot.layers;
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
        : 'closed';
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
    return () => {
      const engine = engineRef.current;
      const context = contextRef.current;
      engineRef.current = null;
      contextRef.current = null;
      void engine?.dispose().finally(() => context?.close().catch(() => undefined));
    };
  }, []);

  return null;
}
