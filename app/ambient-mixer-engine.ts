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

type LayerRuntime = {
  gain: GainNode;
  source: AudioBufferSourceNode | null;
  generation: number;
  volume: number;
};

const DEFAULT_FADE_SECONDS = 0.36;
const NOISE_BUFFER_SECONDS = 8;

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

export class AmbientMixerEngine {
  private readonly context: AudioContext;
  private readonly output: GainNode;
  private readonly compressor: DynamicsCompressorNode;
  private readonly layers = new Map<AmbientId, LayerRuntime>();
  private readonly bufferCache = new Map<AmbientId, Promise<AudioBuffer>>();
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
      .filter(([, runtime]) => Boolean(runtime.source))
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

    const stops = Array.from(this.layers.keys())
      .filter((id) => !enabledIds.has(id))
      .map((id) => this.stopLayer(id));
    await Promise.all(stops);
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

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    const runtime = this.getOrCreateRuntime(id, volume);
    runtime.volume = clampUnitVolume(volume, ambientCatalog[id].defaultVolume);
    const generation = runtime.generation + 1;
    runtime.generation = generation;

    if (runtime.source) {
      this.rampGain(runtime.gain, runtime.volume, 0.1);
      return;
    }

    const buffer = await this.getBuffer(id);
    if (this.disposed || runtime.generation !== generation || runtime.source) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = buffer.duration;
    source.connect(runtime.gain);
    runtime.source = source;

    const now = this.context.currentTime;
    runtime.gain.gain.cancelScheduledValues(now);
    runtime.gain.gain.setValueAtTime(0, now);
    this.rampGain(runtime.gain, runtime.volume, DEFAULT_FADE_SECONDS);

    source.onended = () => {
      if (runtime.source === source) runtime.source = null;
      try {
        source.disconnect();
      } catch {
        // Source may already be disconnected during disposal.
      }
    };

    source.start(now);
  }

  setLayerVolume(id: AmbientId, volume: number): void {
    if (this.disposed) return;
    const runtime = this.getOrCreateRuntime(id, volume);
    runtime.volume = clampUnitVolume(volume, ambientCatalog[id].defaultVolume);
    this.rampGain(runtime.gain, runtime.source ? runtime.volume : 0, 0.08);
  }

  async stopLayer(id: AmbientId, fadeSeconds = DEFAULT_FADE_SECONDS): Promise<void> {
    const runtime = this.layers.get(id);
    if (!runtime) return;

    runtime.generation += 1;
    const source = runtime.source;
    runtime.source = null;
    if (!source) return;

    this.rampGain(runtime.gain, 0, fadeSeconds);

    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        try {
          source.stop();
          source.disconnect();
        } catch {
          // The source can already be stopped by browser lifecycle events.
        }
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

    this.layers.forEach((runtime) => {
      try {
        runtime.gain.disconnect();
      } catch {
        // Gain may already be disconnected.
      }
    });
    this.layers.clear();
    this.bufferCache.clear();

    try {
      this.output.disconnect();
      this.compressor.disconnect();
    } catch {
      // Output nodes may already be disconnected.
    }
  }

  private getOrCreateRuntime(id: AmbientId, volume: number): LayerRuntime {
    const existing = this.layers.get(id);
    if (existing) return existing;

    const gain = this.context.createGain();
    gain.gain.value = 0;
    gain.connect(this.output);

    const runtime: LayerRuntime = {
      gain,
      source: null,
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

  private getBuffer(id: AmbientId): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(id);
    if (cached) return cached;

    const definition = ambientCatalog[id];
    const promise = definition.sourceType === 'procedural-noise'
      ? Promise.resolve(createNoiseBuffer(this.context, definition.noiseColor ?? 'white'))
      : this.loadSampleBuffer(definition.assetPath);

    this.bufferCache.set(id, promise);
    promise.catch(() => this.bufferCache.delete(id));
    return promise;
  }

  private async loadSampleBuffer(assetPath: string | undefined): Promise<AudioBuffer> {
    if (!assetPath) throw new Error('Ambient sample is missing an asset path.');

    const response = await fetch(assetPath, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`Unable to load ambient sample: ${assetPath}`);
    }

    const bytes = await response.arrayBuffer();
    return this.context.decodeAudioData(bytes.slice(0));
  }
}
