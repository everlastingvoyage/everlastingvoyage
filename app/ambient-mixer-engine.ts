import {
  ambientCatalog,
  type AmbientId,
  type NoiseColor
} from './ambient-catalog';
import {
  clampUnitVolume,
  getEnabledAmbientLayers,
  type AmbientLayerConfig,
  type VoyageConfig
} from './voyage-model';

type LayerVoice = {
  stop: () => void;
  disconnect: () => void;
};

type LayerRuntime = {
  gain: GainNode;
  voice: LayerVoice | null;
  generation: number;
  volume: number;
};

const DEFAULT_FADE_SECONDS = 0.36;
const NOISE_BUFFER_SECONDS = 12;
const MEDIA_READY_TIMEOUT_MS = 16000;

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
      audio.removeEventListener('error', handleError);
    };

    audio.addEventListener('canplay', handleReady, { once: true });
    audio.addEventListener('error', handleError, { once: true });
    audio.load();
  });
}

export class AmbientMixerEngine {
  private readonly context: AudioContext;
  private readonly output: GainNode;
  private readonly compressor: DynamicsCompressorNode;
  private readonly layers = new Map<AmbientId, LayerRuntime>();
  private readonly noiseBufferCache = new Map<NoiseColor, Promise<AudioBuffer>>();
  private disposed = false;

  constructor(context: AudioContext, destination: AudioNode = context.destination) {
    this.context = context;
    this.output = context.createGain();
    this.compressor = context.createDynamicsCompressor();

    this.output.gain.value = 0.62;
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 5;
    this.compressor.attack.value = 0.004;
    this.compressor.release.value = 0.24;

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

  setMasterVolume(volume: number, fadeSeconds = 0.12): void {
    if (this.disposed) return;
    this.rampGain(this.output, clampUnitVolume(volume, 0.62), fadeSeconds);
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
      this.rampGain(runtime.gain, runtime.volume, 0.1);
      return;
    }

    const voice = await this.createLayerVoice(id, runtime.gain);
    if (this.disposed || runtime.generation !== generation || runtime.voice) {
      voice.stop();
      voice.disconnect();
      return;
    }

    runtime.voice = voice;
    const now = this.context.currentTime;
    runtime.gain.gain.cancelScheduledValues(now);
    runtime.gain.gain.setValueAtTime(0, now);
    this.rampGain(runtime.gain, runtime.volume, DEFAULT_FADE_SECONDS);
  }

  setLayerVolume(id: AmbientId, volume: number): void {
    if (this.disposed) return;
    const runtime = this.getOrCreateRuntime(id, volume);
    runtime.volume = clampUnitVolume(volume, ambientCatalog[id].defaultVolume);
    this.rampGain(runtime.gain, runtime.voice ? runtime.volume : 0, 0.08);
  }

  async stopLayer(id: AmbientId, fadeSeconds = DEFAULT_FADE_SECONDS): Promise<void> {
    const runtime = this.layers.get(id);
    if (!runtime) return;

    runtime.generation += 1;
    const voice = runtime.voice;
    runtime.voice = null;
    if (!voice) return;

    this.rampGain(runtime.gain, 0, fadeSeconds);
    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        voice.stop();
        voice.disconnect();
        resolve();
      }, Math.ceil(fadeSeconds * 1000) + 40);
    });
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
      volume: clampUnitVolume(volume, ambientCatalog[id].defaultVolume)
    };
    this.layers.set(id, runtime);
    return runtime;
  }

  private rampGain(gain: GainNode, volume: number, duration: number): void {
    const now = this.context.currentTime;
    const target = clampUnitVolume(volume, 0);
    const current = Math.max(0, gain.gain.value);

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(current, now);

    if (duration <= 0.01) {
      gain.gain.setValueAtTime(target, now);
      return;
    }

    if (target === 0 || current === 0) {
      gain.gain.linearRampToValueAtTime(target, now + duration);
      return;
    }

    gain.gain.exponentialRampToValueAtTime(target, now + duration);
  }

  private async createLayerVoice(id: AmbientId, destination: AudioNode): Promise<LayerVoice> {
    const definition = ambientCatalog[id];

    if (definition.sourceType === 'procedural-noise') {
      const buffer = await this.getNoiseBuffer(definition.noiseColor ?? 'white');
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = buffer.duration;
      source.connect(destination);
      source.start(this.context.currentTime, Math.random() * Math.max(0.01, buffer.duration - 0.01));

      return {
        stop: () => safelyStop(source),
        disconnect: () => safelyDisconnect(source)
      };
    }

    return this.createStreamingSampleVoice(
      definition.assetPath,
      definition.fallbackAssetPath,
      destination
    );
  }

  private async createStreamingSampleVoice(
    assetPath: string | undefined,
    fallbackAssetPath: string | undefined,
    destination: AudioNode
  ): Promise<LayerVoice> {
    if (!assetPath) throw new Error('Ambient recording is missing an asset URL.');

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.loop = true;
    audio.setAttribute('playsinline', '');

    const source = this.context.createMediaElementSource(audio);
    source.connect(destination);

    const trySource = async (url: string) => {
      audio.src = url;
      await waitForMedia(audio);
      audio.currentTime = 0;
      await audio.play();
    };

    try {
      await trySource(assetPath);
    } catch (primaryError) {
      if (!fallbackAssetPath) {
        safelyDisconnect(source);
        throw primaryError;
      }

      try {
        audio.removeAttribute('src');
        audio.load();
        await trySource(fallbackAssetPath);
      } catch (fallbackError) {
        safelyDisconnect(source);
        throw fallbackError;
      }
    }

    return {
      stop: () => {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute('src');
        audio.load();
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
