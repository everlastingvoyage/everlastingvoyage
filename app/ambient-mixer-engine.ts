import {
  ambientCatalog,
  type AmbientId,
  type NoiseColor,
  type ProceduralAtmosphereKind
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

type FilterStage = {
  type: BiquadFilterType;
  frequency: number;
  q?: number;
};

const DEFAULT_FADE_SECONDS = 0.36;
const NOISE_BUFFER_SECONDS = 12;

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

export class AmbientMixerEngine {
  private readonly context: AudioContext;
  private readonly output: GainNode;
  private readonly compressor: DynamicsCompressorNode;
  private readonly layers = new Map<AmbientId, LayerRuntime>();
  private readonly bufferCache = new Map<string, Promise<AudioBuffer>>();
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
    this.bufferCache.clear();

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

    if (definition.sourceType === 'procedural-atmosphere') {
      return this.createProceduralAtmosphere(definition.generator ?? 'rain', destination);
    }

    const buffer = definition.sourceType === 'procedural-noise'
      ? await this.getNoiseBuffer(definition.noiseColor ?? 'white')
      : await this.loadSampleBuffer(definition.assetPath);

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

  private async createProceduralAtmosphere(
    kind: ProceduralAtmosphereKind,
    destination: AudioNode
  ): Promise<LayerVoice> {
    const context = this.context;
    const master = context.createGain();
    const sources = new Set<AudioScheduledSourceNode>();
    const nodes = new Set<AudioNode>([master]);
    const timers = new Set<number>();
    let stopped = false;

    master.gain.value = 0.86;
    master.connect(destination);

    const registerSource = <T extends AudioScheduledSourceNode>(source: T): T => {
      sources.add(source);
      nodes.add(source);
      source.addEventListener('ended', () => {
        sources.delete(source);
        safelyDisconnect(source);
      }, { once: true });
      return source;
    };

    const schedule = (callback: () => void, delayMs: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!stopped) callback();
      }, delayMs);
      timers.add(timer);
    };

    const createBed = async (
      color: NoiseColor,
      stages: readonly FilterStage[],
      level: number
    ) => {
      const buffer = await this.getNoiseBuffer(color);
      if (stopped) return null;

      const source = registerSource(context.createBufferSource());
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = buffer.duration;

      let previous: AudioNode = source;
      stages.forEach((stage) => {
        const filter = context.createBiquadFilter();
        filter.type = stage.type;
        filter.frequency.value = stage.frequency;
        filter.Q.value = stage.q ?? 0.7;
        previous.connect(filter);
        previous = filter;
        nodes.add(filter);
      });

      const gain = context.createGain();
      gain.gain.value = level;
      previous.connect(gain);
      gain.connect(master);
      nodes.add(gain);
      source.start(context.currentTime, Math.random() * buffer.duration);
      return gain;
    };

    const addLfo = (target: AudioParam, frequency: number, amount: number, phaseDelay = 0) => {
      const oscillator = registerSource(context.createOscillator());
      const depth = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      depth.gain.value = amount;
      oscillator.connect(depth);
      depth.connect(target);
      nodes.add(depth);
      oscillator.start(context.currentTime + phaseDelay);
    };

    const makeChirp = (startAt: number, level: number) => {
      if (stopped) return;
      const duration = 0.16 + Math.random() * 0.2;
      const base = 1700 + Math.random() * 1700;
      const peak = base * (1.18 + Math.random() * 0.38);
      const oscillator = registerSource(context.createOscillator());
      const gain = context.createGain();
      const panner = context.createStereoPanner();
      oscillator.type = Math.random() > 0.45 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(base, startAt);
      oscillator.frequency.exponentialRampToValueAtTime(peak, startAt + duration * 0.42);
      oscillator.frequency.exponentialRampToValueAtTime(base * 0.92, startAt + duration);
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(level, startAt + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      panner.pan.value = Math.random() * 1.5 - 0.75;
      oscillator.connect(gain);
      gain.connect(panner);
      panner.connect(master);
      nodes.add(gain);
      nodes.add(panner);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.03);
    };

    const scheduleBirdPhrase = (minimumSeconds: number, maximumSeconds: number, level: number) => {
      const next = () => {
        if (stopped) return;
        const now = context.currentTime + 0.04;
        const calls = 1 + Math.floor(Math.random() * 3);
        for (let index = 0; index < calls; index += 1) {
          makeChirp(now + index * (0.1 + Math.random() * 0.08), level * (0.72 + Math.random() * 0.35));
        }
        const delay = minimumSeconds + Math.random() * (maximumSeconds - minimumSeconds);
        schedule(next, delay * 1000);
      };
      schedule(next, 500 + Math.random() * 1400);
    };

    const makeThunder = async () => {
      if (stopped) return;
      const buffer = await this.getNoiseBuffer('brown');
      if (stopped) return;

      const now = context.currentTime + 0.03;
      const duration = 3.6 + Math.random() * 2.8;
      const noise = registerSource(context.createBufferSource());
      const lowpass = context.createBiquadFilter();
      const noiseGain = context.createGain();
      const panner = context.createStereoPanner();
      noise.buffer = buffer;
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 150 + Math.random() * 90;
      lowpass.Q.value = 0.8;
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.22, now + 0.32);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      panner.pan.value = Math.random() * 1.3 - 0.65;
      noise.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(panner);
      panner.connect(master);
      nodes.add(lowpass);
      nodes.add(noiseGain);
      nodes.add(panner);
      noise.start(now, Math.random() * Math.max(0.1, buffer.duration - duration), duration);

      const rumble = registerSource(context.createOscillator());
      const rumbleGain = context.createGain();
      rumble.type = 'sine';
      rumble.frequency.setValueAtTime(48 + Math.random() * 12, now);
      rumble.frequency.exponentialRampToValueAtTime(25 + Math.random() * 8, now + duration);
      rumbleGain.gain.setValueAtTime(0, now);
      rumbleGain.gain.linearRampToValueAtTime(0.055, now + 0.28);
      rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      rumble.connect(rumbleGain);
      rumbleGain.connect(master);
      nodes.add(rumbleGain);
      rumble.start(now);
      rumble.stop(now + duration + 0.03);
    };

    const scheduleThunder = () => {
      const next = () => {
        void makeThunder();
        schedule(next, (10 + Math.random() * 16) * 1000);
      };
      schedule(next, (4 + Math.random() * 7) * 1000);
    };

    if (kind === 'rain') {
      const rain = await createBed('white', [
        { type: 'highpass', frequency: 720 },
        { type: 'lowpass', frequency: 9200 }
      ], 0.46);
      await createBed('pink', [
        { type: 'highpass', frequency: 100 },
        { type: 'lowpass', frequency: 1100 }
      ], 0.12);
      if (rain) addLfo(rain.gain, 0.09, 0.045);
    }

    if (kind === 'ocean') {
      const surf = await createBed('pink', [
        { type: 'highpass', frequency: 55 },
        { type: 'lowpass', frequency: 1450 }
      ], 0.4);
      const body = await createBed('brown', [
        { type: 'lowpass', frequency: 310 }
      ], 0.2);
      if (surf) {
        addLfo(surf.gain, 0.065, 0.2);
        addLfo(surf.gain, 0.113, 0.08, 0.2);
      }
      if (body) addLfo(body.gain, 0.043, 0.07);
    }

    if (kind === 'birds') {
      await createBed('pink', [
        { type: 'highpass', frequency: 100 },
        { type: 'lowpass', frequency: 1800 }
      ], 0.065);
      scheduleBirdPhrase(1.7, 5.2, 0.055);
    }

    if (kind === 'nature') {
      const leaves = await createBed('pink', [
        { type: 'highpass', frequency: 90 },
        { type: 'lowpass', frequency: 2700 }
      ], 0.16);
      await createBed('brown', [
        { type: 'lowpass', frequency: 380 }
      ], 0.055);
      if (leaves) addLfo(leaves.gain, 0.12, 0.035);
      scheduleBirdPhrase(4.2, 10.5, 0.032);
    }

    if (kind === 'storm') {
      const rain = await createBed('white', [
        { type: 'highpass', frequency: 480 },
        { type: 'lowpass', frequency: 7200 }
      ], 0.35);
      const pressure = await createBed('brown', [
        { type: 'lowpass', frequency: 240 }
      ], 0.16);
      if (rain) addLfo(rain.gain, 0.075, 0.055);
      if (pressure) addLfo(pressure.gain, 0.037, 0.05);
      scheduleThunder();
    }

    return {
      stop: () => {
        if (stopped) return;
        stopped = true;
        timers.forEach((timer) => window.clearTimeout(timer));
        timers.clear();
        sources.forEach(safelyStop);
        sources.clear();
      },
      disconnect: () => {
        nodes.forEach(safelyDisconnect);
        nodes.clear();
      }
    };
  }

  private getNoiseBuffer(color: NoiseColor): Promise<AudioBuffer> {
    const key = `procedural-noise:${color}`;
    const cached = this.bufferCache.get(key);
    if (cached) return cached;

    const promise = Promise.resolve(createNoiseBuffer(this.context, color));
    this.bufferCache.set(key, promise);
    return promise;
  }

  private async loadSampleBuffer(assetPath: string | undefined): Promise<AudioBuffer> {
    if (!assetPath) throw new Error('Ambient sample is missing an asset path.');
    const key = `sample:${assetPath}`;
    const cached = this.bufferCache.get(key);
    if (cached) return cached;

    const promise = (async () => {
      const response = await fetch(assetPath, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Unable to load ambient sample: ${assetPath}`);
      const bytes = await response.arrayBuffer();
      return this.context.decodeAudioData(bytes.slice(0));
    })();

    this.bufferCache.set(key, promise);
    promise.catch(() => this.bufferCache.delete(key));
    return promise;
  }
}
