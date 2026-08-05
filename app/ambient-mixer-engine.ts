import {
  ambientCatalog,
  type AmbientId,
  type NoiseColor
} from './ambient-catalog';
import { getAmbientGainCompensation } from './ambient-gain';
import {
  ambientDiagnostics,
  type AmbientEngineEvent,
  type AmbientLayerRuntimeMap,
  type AmbientSourceKind
} from './ambient-runtime';
import { isPlayableAmbientId, type PlayableAmbientId } from './ambient-playable';
import {
  clampUnitVolume,
  getEnabledAmbientLayers,
  type AmbientLayerConfig,
  type VoyageConfig
} from './voyage-model';

type LayerVoice = {
  stop: () => void;
  disconnect: () => void;
  pause: () => void;
  resume: () => Promise<void>;
  isPaused: () => boolean;
  source: AmbientSourceKind;
};

type LayerRuntime = {
  gain: GainNode;
  voice: LayerVoice | null;
  generation: number;
  volume: number;
  retryCount: number;
  source?: AmbientSourceKind;
};

const DEFAULT_FADE_SECONDS = 0.5;
const PAUSE_FADE_SECONDS = 0.18;
const NOISE_BUFFER_SECONDS = 12;
const MEDIA_READY_TIMEOUT_MS = 16000;
const MAX_EFFECTIVE_LAYER_GAIN = 0.82;
const preloadedMediaElements = new Map<AmbientId, HTMLAudioElement>();
const activeMediaElements = new Map<AmbientId, HTMLAudioElement>();

function createNoiseBuffer(context: AudioContext, color: NoiseColor): AudioBuffer {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * NOISE_BUFFER_SECONDS));
  const buffer = context.createBuffer(2, frameCount, context.sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const output = buffer.getChannelData(channel);
    let brown = 0;
    let pink0 = 0;
    let pink1 = 0;
    let pink2 = 0;
    let pink3 = 0;
    let pink4 = 0;
    let pink5 = 0;
    let pink6 = 0;

    for (let index = 0; index < frameCount; index += 1) {
      const white = Math.random() * 2 - 1;

      if (color === 'white') {
        output[index] = white * 0.42;
        continue;
      }

      if (color === 'brown') {
        brown = (brown + 0.02 * white) / 1.02;
        output[index] = Math.max(-1, Math.min(1, brown * 3.5));
        continue;
      }

      pink0 = 0.99886 * pink0 + white * 0.0555179;
      pink1 = 0.99332 * pink1 + white * 0.0750759;
      pink2 = 0.969 * pink2 + white * 0.153852;
      pink3 = 0.8665 * pink3 + white * 0.3104856;
      pink4 = 0.55 * pink4 + white * 0.5329522;
      pink5 = -0.7616 * pink5 - white * 0.016898;
      const pink = pink0 + pink1 + pink2 + pink3 + pink4 + pink5 + pink6 + white * 0.5362;
      pink6 = white * 0.115926;
      output[index] = Math.max(-1, Math.min(1, pink * 0.11));
    }
  }

  return buffer;
}

function safelyStop(source: AudioScheduledSourceNode): void {
  try {
    source.stop();
  } catch {
    // A scheduled source can already be stopped during rapid UI changes.
  }
}

function safelyDisconnect(node: AudioNode): void {
  try {
    node.disconnect();
  } catch {
    // A node can already be disconnected during browser lifecycle cleanup.
  }
}

function releaseMediaElement(audio: HTMLAudioElement): void {
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // Safari can throw while a failed media element is being reset.
  }
  audio.removeAttribute('src');
  audio.load();
}

function waitForMedia(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Ambient recording timed out while loading.'));
    }, MEDIA_READY_TIMEOUT_MS);

    const handleReady = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error('Ambient recording could not be loaded.'));
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      audio.removeEventListener('canplay', handleReady);
      audio.removeEventListener('loadeddata', handleReady);
      audio.removeEventListener('error', handleError);
    };

    audio.addEventListener('canplay', handleReady, { once: true });
    audio.addEventListener('loadeddata', handleReady, { once: true });
    audio.addEventListener('error', handleError, { once: true });
    audio.load();
  });
}

export function preloadAmbientMetadata(ids: readonly PlayableAmbientId[]): void {
  if (typeof window === 'undefined') return;

  ids.forEach((id) => {
    if (preloadedMediaElements.has(id)) return;
    const definition = ambientCatalog[id];
    if (definition.sourceType !== 'sample' || !definition.assetPath) return;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    audio.setAttribute('playsinline', '');
    audio.src = definition.assetPath;
    audio.load();
    preloadedMediaElements.set(id, audio);
  });
}

export function releaseAmbientMetadata(): void {
  preloadedMediaElements.forEach(releaseMediaElement);
  preloadedMediaElements.clear();
}

export class AmbientMixerEngine {
  private readonly context: AudioContext;
  private readonly output: GainNode;
  private readonly compressor: DynamicsCompressorNode;
  private readonly layers = new Map<AmbientId, LayerRuntime>();
  private readonly noiseBufferCache = new Map<NoiseColor, Promise<AudioBuffer>>();
  private readonly onEvent?: (event: AmbientEngineEvent) => void;
  private disposed = false;

  constructor(
    context: AudioContext,
    destination: AudioNode = context.destination,
    onEvent?: (event: AmbientEngineEvent) => void
  ) {
    this.context = context;
    this.onEvent = onEvent;
    this.output = context.createGain();
    this.compressor = context.createDynamicsCompressor();

    this.output.gain.value = 0.58;
    this.compressor.threshold.value = -20;
    this.compressor.knee.value = 20;
    this.compressor.ratio.value = 5;
    this.compressor.attack.value = 0.004;
    this.compressor.release.value = 0.26;

    this.output.connect(this.compressor);
    this.compressor.connect(destination);
  }

  get audioContext(): AudioContext {
    return this.context;
  }

  get activeLayerIds(): AmbientId[] {
    return Array.from(this.layers.entries())
      .filter(([, runtime]) => Boolean(runtime.voice))
      .map(([id]) => id);
  }

  get runtimeStates(): AmbientLayerRuntimeMap {
    const result: AmbientLayerRuntimeMap = {};
    this.layers.forEach((runtime, id) => {
      result[id] = {
        playbackState: runtime.voice
          ? runtime.voice.isPaused() ? 'paused' : 'playing'
          : 'idle',
        retryCount: runtime.retryCount,
        source: runtime.source
      };
    });
    return result;
  }

  setMasterVolume(volume: number, fadeSeconds = 0.12): void {
    if (this.disposed) return;
    this.rampGain(this.output, clampUnitVolume(volume, 0.58), fadeSeconds);
  }

  async applyVoyageMix(config: VoyageConfig): Promise<void> {
    const enabled = getEnabledAmbientLayers(config);
    const enabledIds = new Set(enabled.map((layer) => layer.id));

    await Promise.all(enabled.map((layer) => this.setLayer(layer)));
    await Promise.all(
      Array.from(this.layers.keys())
        .filter((id) => !enabledIds.has(id))
        .map((id) => this.stopLayer(id))
    );
  }

  async setLayer(layer: AmbientLayerConfig): Promise<void> {
    if (this.disposed) return;
    const volume = clampUnitVolume(layer.volume, ambientCatalog[layer.id].defaultVolume);

    if (!layer.enabled) {
      await this.stopLayer(layer.id);
      return;
    }

    await this.startLayer(layer.id, volume);
  }

  async startLayer(id: AmbientId, volume = ambientCatalog[id].defaultVolume): Promise<void> {
    if (this.disposed) return;
    if (this.context.state === 'suspended') await this.context.resume();

    const runtime = this.getOrCreateRuntime(id, volume);
    runtime.volume = clampUnitVolume(volume, ambientCatalog[id].defaultVolume);
    const generation = runtime.generation + 1;
    runtime.generation = generation;

    if (runtime.voice) {
      if (runtime.voice.isPaused()) {
        this.emit(id, 'loading', runtime);
        try {
          await runtime.voice.resume();
          this.emit(id, 'playing', runtime);
        } catch (error) {
          runtime.retryCount += 1;
          this.emit(id, 'error', runtime, error instanceof Error ? error.message : 'Unable to resume this sound.');
          throw error;
        }
      }
      this.rampGain(runtime.gain, this.getEffectiveVolume(id, runtime.volume), 0.55);
      return;
    }

    this.emit(id, 'loading', runtime);

    try {
      const voice = await this.createLayerVoice(id, runtime.gain, generation);
      if (this.disposed || runtime.generation !== generation || runtime.voice) {
        voice.stop();
        voice.disconnect();
        return;
      }

      runtime.voice = voice;
      runtime.source = voice.source;
      const now = this.context.currentTime;
      runtime.gain.gain.cancelScheduledValues(now);
      runtime.gain.gain.setValueAtTime(0.0001, now);
      this.rampGain(runtime.gain, this.getEffectiveVolume(id, runtime.volume), DEFAULT_FADE_SECONDS);
      this.emit(id, 'playing', runtime);
    } catch (error) {
      runtime.retryCount += 1;
      this.emit(id, 'error', runtime, error instanceof Error ? error.message : 'Unable to load this sound.');
      throw error;
    }
  }

  async retryLayer(id: AmbientId, volume = ambientCatalog[id].defaultVolume): Promise<void> {
    const runtime = this.getOrCreateRuntime(id, volume);
    runtime.generation += 1;
    const voice = runtime.voice;
    runtime.voice = null;
    if (voice) {
      voice.stop();
      voice.disconnect();
    }
    this.emit(id, 'loading', runtime);
    await this.startLayer(id, volume);
  }

  setLayerVolume(id: AmbientId, volume: number): void {
    if (this.disposed) return;
    const runtime = this.getOrCreateRuntime(id, volume);
    runtime.volume = clampUnitVolume(volume, ambientCatalog[id].defaultVolume);
    this.rampGain(
      runtime.gain,
      runtime.voice && !runtime.voice.isPaused() ? this.getEffectiveVolume(id, runtime.volume) : 0,
      0.1
    );
  }

  async pauseLayer(id: AmbientId, fadeSeconds = PAUSE_FADE_SECONDS): Promise<void> {
    const runtime = this.layers.get(id);
    if (!runtime?.voice || runtime.voice.isPaused()) return;

    this.rampGain(runtime.gain, 0, fadeSeconds);
    await new Promise<void>((resolve) => window.setTimeout(resolve, Math.ceil(fadeSeconds * 1000) + 30));
    runtime.voice.pause();
    this.emit(id, 'paused', runtime);
  }

  async pauseAll(fadeSeconds = PAUSE_FADE_SECONDS): Promise<void> {
    await Promise.all(this.activeLayerIds.map((id) => this.pauseLayer(id, fadeSeconds)));
  }

  async stopLayer(id: AmbientId, fadeSeconds = DEFAULT_FADE_SECONDS): Promise<void> {
    const runtime = this.layers.get(id);
    if (!runtime) return;

    runtime.generation += 1;
    const voice = runtime.voice;
    runtime.voice = null;
    if (!voice) {
      this.emit(id, 'idle', runtime);
      return;
    }

    this.rampGain(runtime.gain, 0, fadeSeconds);
    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        voice.stop();
        voice.disconnect();
        resolve();
      }, Math.ceil(fadeSeconds * 1000) + 40);
    });
    runtime.retryCount = 0;
    runtime.source = undefined;
    this.emit(id, 'idle', runtime);
  }

  async stopAll(fadeSeconds = DEFAULT_FADE_SECONDS): Promise<void> {
    await Promise.all(Array.from(this.layers.keys()).map((id) => this.stopLayer(id, fadeSeconds)));
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    await this.stopAll(0.08);
    this.disposed = true;

    this.layers.forEach((runtime) => safelyDisconnect(runtime.gain));
    this.layers.clear();
    this.noiseBufferCache.clear();
    safelyDisconnect(this.output);
    safelyDisconnect(this.compressor);
  }

  private getOrCreateRuntime(id: AmbientId, volume: number): LayerRuntime {
    const existing = this.layers.get(id);
    if (existing) return existing;

    const gain = this.context.createGain();
    gain.gain.value = 0;
    gain.connect(this.output);

    const runtime: LayerRuntime = {
      gain,
      voice: null,
      generation: 0,
      volume: clampUnitVolume(volume, ambientCatalog[id].defaultVolume),
      retryCount: 0
    };
    this.layers.set(id, runtime);
    return runtime;
  }

  private getEffectiveVolume(id: AmbientId, volume: number): number {
    const compensation = isPlayableAmbientId(id) ? getAmbientGainCompensation(id) : 1;
    return Math.min(MAX_EFFECTIVE_LAYER_GAIN, Math.max(0, volume * compensation));
  }

  private rampGain(gain: GainNode, volume: number, duration: number): void {
    const now = this.context.currentTime;
    const target = Math.min(MAX_EFFECTIVE_LAYER_GAIN, Math.max(0, volume));
    const current = Math.max(0.0001, gain.gain.value);

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(current, now);

    if (duration <= 0.01) {
      gain.gain.setValueAtTime(target, now);
      return;
    }

    if (target <= 0.0001) {
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      return;
    }

    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, target), now + duration);
  }

  private emit(
    id: AmbientId,
    playbackState: AmbientEngineEvent['playbackState'],
    runtime: LayerRuntime,
    errorMessage?: string
  ): void {
    const event: AmbientEngineEvent = {
      id,
      playbackState,
      retryCount: runtime.retryCount,
      source: runtime.source,
      errorMessage
    };
    ambientDiagnostics.log({
      layerId: id,
      event: playbackState,
      source: runtime.source,
      audioContextState: this.context.state
    });
    this.onEvent?.(event);
  }

  private async createLayerVoice(id: AmbientId, destination: AudioNode, generation: number): Promise<LayerVoice> {
    const definition = ambientCatalog[id];

    if (definition.sourceType === 'procedural-noise') {
      const buffer = await this.getNoiseBuffer(definition.noiseColor ?? 'white');
      let source: AudioBufferSourceNode | null = null;

      const startSource = () => {
        const next = this.context.createBufferSource();
        next.buffer = buffer;
        next.loop = true;
        next.loopStart = 0;
        next.loopEnd = buffer.duration;
        next.connect(destination);
        next.start(this.context.currentTime, Math.random() * Math.max(0.01, buffer.duration - 0.01));
        source = next;
      };

      startSource();
      const runtime = this.layers.get(id);
      if (runtime) runtime.source = 'procedural';

      return {
        source: 'procedural',
        pause: () => {
          if (!source) return;
          safelyStop(source);
          safelyDisconnect(source);
          source = null;
        },
        resume: async () => {
          if (!source) startSource();
        },
        isPaused: () => !source,
        stop: () => {
          if (!source) return;
          safelyStop(source);
          safelyDisconnect(source);
          source = null;
        },
        disconnect: () => {
          if (source) safelyDisconnect(source);
        }
      };
    }

    return this.createStreamingSampleVoice(
      id,
      definition.assetPath,
      definition.fallbackAssetPath,
      destination,
      generation
    );
  }

  private async createStreamingSampleVoice(
    id: AmbientId,
    assetPath: string | undefined,
    fallbackAssetPath: string | undefined,
    destination: AudioNode,
    generation: number
  ): Promise<LayerVoice> {
    if (!assetPath) throw new Error('Ambient recording is missing an asset URL.');

    const existing = activeMediaElements.get(id);
    if (existing) {
      releaseMediaElement(existing);
      activeMediaElements.delete(id);
    }

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    audio.loop = true;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');

    const source = this.context.createMediaElementSource(audio);
    source.connect(destination);
    activeMediaElements.set(id, audio);

    let sourceKind: AmbientSourceKind = 'primary';
    let stopping = false;

    const runtimeIsCurrent = () => {
      const runtime = this.layers.get(id);
      return Boolean(runtime && runtime.generation === generation && !this.disposed);
    };

    const updateState = (state: AmbientEngineEvent['playbackState'], message?: string) => {
      if (!runtimeIsCurrent()) return;
      const runtime = this.layers.get(id);
      if (!runtime) return;
      runtime.source = sourceKind;
      this.emit(id, state, runtime, message);
    };

    const handleWaiting = () => updateState('buffering');
    const handleStalled = () => updateState('buffering');
    const handlePlaying = () => updateState('playing');
    const handlePause = () => {
      if (!stopping) updateState('paused');
    };
    const handleError = () => {
      if (!stopping) updateState('error', 'This recording could not be loaded.');
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    const cleanupListeners = () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };

    const trySource = async (url: string, kind: AmbientSourceKind) => {
      sourceKind = kind;
      const runtime = this.layers.get(id);
      if (runtime) runtime.source = kind;
      audio.src = url;
      audio.preload = 'auto';
      await waitForMedia(audio);
      audio.currentTime = 0;
      await audio.play();
    };

    try {
      await trySource(assetPath, 'primary');
    } catch (primaryError) {
      ambientDiagnostics.log({
        layerId: id,
        event: 'primary failed',
        source: 'primary',
        audioContextState: this.context.state
      });

      if (!fallbackAssetPath) {
        stopping = true;
        cleanupListeners();
        activeMediaElements.delete(id);
        releaseMediaElement(audio);
        safelyDisconnect(source);
        throw primaryError;
      }

      try {
        releaseMediaElement(audio);
        ambientDiagnostics.log({
          layerId: id,
          event: 'fallback started',
          source: 'fallback',
          audioContextState: this.context.state
        });
        await trySource(fallbackAssetPath, 'fallback');
      } catch (fallbackError) {
        stopping = true;
        cleanupListeners();
        activeMediaElements.delete(id);
        releaseMediaElement(audio);
        safelyDisconnect(source);
        throw fallbackError;
      }
    }

    return {
      source: sourceKind,
      pause: () => {
        audio.pause();
      },
      resume: async () => {
        await audio.play();
      },
      isPaused: () => audio.paused,
      stop: () => {
        stopping = true;
        cleanupListeners();
        if (activeMediaElements.get(id) === audio) activeMediaElements.delete(id);
        releaseMediaElement(audio);
      },
      disconnect: () => safelyDisconnect(source)
    };
  }

  private getNoiseBuffer(color: NoiseColor): Promise<AudioBuffer> {
    const cached = this.noiseBufferCache.get(color);
    if (cached) return cached;

    const promise = Promise.resolve(createNoiseBuffer(this.context, color));
    this.noiseBufferCache.set(color, promise);
    return promise;
  }
}
