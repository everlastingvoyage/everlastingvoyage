export type PremiumAudioCategory = 'study' | 'work' | 'meditation' | 'sleep' | 'ritual';
export type PremiumAudioMode = 'pure' | 'immersive';
export type PremiumWaveform = OscillatorType;
export type PremiumNoiseColor = 'white' | 'pink' | 'brown';
export type PremiumStemRole = 'pad' | 'drone' | 'glass' | 'pulse' | 'vowel' | 'noise' | 'sample';
export type PremiumEventRole = 'bell' | 'crystal' | 'breath' | 'swell' | 'motif';

export type PremiumStemLayer = {
  id: string;
  role: PremiumStemRole;
  gain: number;
  rootHz?: number;
  waveform?: PremiumWaveform;
  intervals?: number[];
  detuneCents?: number[];
  cutoffHz?: number;
  movementHz?: number;
  pulseHz?: number;
  pulseDepth?: number;
  noiseColor?: PremiumNoiseColor;
  formantsHz?: number[];
  assetPath?: string;
  startOffsetSeconds?: number;
};

export type PremiumEventLayer = {
  id: string;
  role: PremiumEventRole;
  minIntervalSeconds: number;
  maxIntervalSeconds: number;
  probability: number;
  gainMin: number;
  gainMax: number;
  panMin: number;
  panMax: number;
  frequenciesHz?: number[];
  durationSeconds?: number;
};

export type PremiumAudioCore =
  | {
      type: 'binaural';
      targetDifferenceHz: number;
      leftCarrierHz: number;
      rightCarrierHz: number;
      waveform: PremiumWaveform;
      gain: number;
    }
  | {
      type: 'pure';
      pureHz: number;
      waveform: PremiumWaveform;
      gain: number;
    };

export type PremiumAudioRecipe = {
  id: string;
  category: PremiumAudioCategory;
  title: string;
  soundIdentity: string;
  recommendedUse: string;
  core: PremiumAudioCore;
  stems: PremiumStemLayer[];
  events: PremiumEventLayer[];
  processing: {
    highpassHz?: number;
    lowpassHz?: number;
    compressorThreshold?: number;
    compressorRatio?: number;
    stereoWidth?: number;
  };
  preview: {
    representativeEventAtSeconds?: number;
    fadeInSeconds: number;
  };
};

export type PremiumAudioHandle = {
  stop: (fadeSeconds?: number) => void;
};

type StartPremiumAudioOptions = {
  mode?: PremiumAudioMode;
  preview?: boolean;
};

type RuntimeBag = {
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  timers: number[];
  media: HTMLAudioElement[];
  stopped: boolean;
};

const RATIO = (semitones: number) => Math.pow(2, semitones / 12);

export const premiumAudioRecipes: Record<string, PremiumAudioRecipe> = {
  'alpha-8': {
    id: 'alpha-8', category: 'study', title: 'Relaxed Study', soundIdentity: 'Futuristic glass room',
    recommendedUse: 'Relaxed reading and lower-pressure study blocks.',
    core: { type: 'binaural', targetDifferenceHz: 8, leftCarrierHz: 120, rightCarrierHz: 128, waveform: 'sine', gain: 0.56 },
    stems: [
      { id: 'glass-bed', role: 'glass', gain: 0.075, rootHz: 240, waveform: 'sine', intervals: [0, 7, 12, 19], detuneCents: [-7, 5], cutoffHz: 2800, movementHz: 0.035 },
      { id: 'soft-air', role: 'noise', gain: 0.018, noiseColor: 'pink', cutoffHz: 1200, movementHz: 0.025 }
    ],
    events: [{ id: 'study-crystal', role: 'crystal', minIntervalSeconds: 17, maxIntervalSeconds: 34, probability: 0.68, gainMin: 0.018, gainMax: 0.032, panMin: -0.42, panMax: 0.42, frequenciesHz: [960, 1280, 1440], durationSeconds: 2.8 }],
    processing: { highpassHz: 34, lowpassHz: 5600, compressorThreshold: -22, compressorRatio: 3.2, stereoWidth: 0.72 },
    preview: { representativeEventAtSeconds: 5.4, fadeInSeconds: 0.55 }
  },
  'alpha-12': {
    id: 'alpha-12', category: 'study', title: 'Memory Retention', soundIdentity: 'Luminous learning atmosphere',
    recommendedUse: 'A luminous study environment for focused review and information retention.',
    core: { type: 'binaural', targetDifferenceHz: 12, leftCarrierHz: 256, rightCarrierHz: 268, waveform: 'sine', gain: 0.5 },
    stems: [
      { id: 'memory-luminous-pad', role: 'pad', gain: 0.15, rootHz: 196, waveform: 'sine', intervals: [0, 4, 7, 11], detuneCents: [-8, 0, 6], cutoffHz: 3300, movementHz: 0.022 },
      { id: 'memory-glass-halo', role: 'glass', gain: 0.066, rootHz: 392, waveform: 'sine', intervals: [0, 7, 12, 16], detuneCents: [-5, 5], cutoffHz: 5200, movementHz: 0.07 },
      { id: 'memory-study-air', role: 'sample', gain: 0.038, assetPath: '/audio/ambience/cafe-quiet-loop.m4a', startOffsetSeconds: 11 }
    ],
    events: [
      { id: 'memory-motif', role: 'motif', minIntervalSeconds: 15, maxIntervalSeconds: 30, probability: 0.78, gainMin: 0.024, gainMax: 0.038, panMin: -0.28, panMax: 0.28, frequenciesHz: [784, 988, 1176, 988], durationSeconds: 4.2 },
      { id: 'memory-crystal', role: 'crystal', minIntervalSeconds: 22, maxIntervalSeconds: 42, probability: 0.56, gainMin: 0.018, gainMax: 0.03, panMin: -0.5, panMax: 0.5, frequenciesHz: [1568, 1976, 2352], durationSeconds: 2.4 }
    ],
    processing: { highpassHz: 40, lowpassHz: 6200, compressorThreshold: -23, compressorRatio: 3.1, stereoWidth: 0.76 },
    preview: { representativeEventAtSeconds: 3.6, fadeInSeconds: 0.38 }
  },
  'smr-14': {
    id: 'smr-14', category: 'study', title: 'Steady Attention', soundIdentity: 'Structured attention pulse',
    recommendedUse: 'Steady, repetitive tasks that benefit from a stable pulse.',
    core: { type: 'binaural', targetDifferenceHz: 14, leftCarrierHz: 174, rightCarrierHz: 188, waveform: 'sine', gain: 0.58 },
    stems: [
      { id: 'stable-bed', role: 'drone', gain: 0.045, rootHz: 87, waveform: 'triangle', intervals: [0, 12, 19], detuneCents: [-3, 3], cutoffHz: 1100, movementHz: 0.018 },
      { id: 'clock-structure', role: 'sample', gain: 0.032, assetPath: '/audio/ambience/clock-soft-loop.m4a', startOffsetSeconds: 4 },
      { id: 'attention-pulse', role: 'pulse', gain: 0.026, rootHz: 348, waveform: 'sine', pulseHz: 0.42, pulseDepth: 0.62, cutoffHz: 1800 }
    ],
    events: [],
    processing: { highpassHz: 28, lowpassHz: 4200, compressorThreshold: -24, compressorRatio: 3.1, stereoWidth: 0.38 },
    preview: { fadeInSeconds: 0.45 }
  },
  'beta-18': {
    id: 'beta-18', category: 'study', title: 'Learning Momentum', soundIdentity: 'Luminous momentum field',
    recommendedUse: 'Positive forward energy for active study, productive review and sustained learning.',
    core: { type: 'binaural', targetDifferenceHz: 18, leftCarrierHz: 216, rightCarrierHz: 234, waveform: 'sine', gain: 0.49 },
    stems: [
      { id: 'momentum-luminous-pad', role: 'pad', gain: 0.145, rootHz: 144, waveform: 'sine', intervals: [0, 4, 7, 11], detuneCents: [-7, 0, 6], cutoffHz: 3400, movementHz: 0.031 },
      { id: 'momentum-glass', role: 'glass', gain: 0.052, rootHz: 432, waveform: 'sine', intervals: [0, 7, 12, 16], detuneCents: [-5, 5], cutoffHz: 5200, movementHz: 0.064 },
      { id: 'momentum-pulse', role: 'pulse', gain: 0.035, rootHz: 288, waveform: 'triangle', pulseHz: 0.36, pulseDepth: 0.46, cutoffHz: 2600 },
      { id: 'momentum-air', role: 'noise', gain: 0.014, noiseColor: 'pink', cutoffHz: 1900, movementHz: 0.028 }
    ],
    events: [
      { id: 'momentum-motif', role: 'motif', minIntervalSeconds: 17, maxIntervalSeconds: 33, probability: 0.72, gainMin: 0.021, gainMax: 0.034, panMin: -0.34, panMax: 0.34, frequenciesHz: [576, 720, 864, 720], durationSeconds: 4.1 },
      { id: 'momentum-crystal', role: 'crystal', minIntervalSeconds: 25, maxIntervalSeconds: 46, probability: 0.48, gainMin: 0.014, gainMax: 0.025, panMin: -0.5, panMax: 0.5, frequenciesHz: [1152, 1440, 1728], durationSeconds: 2.5 }
    ],
    processing: { highpassHz: 34, lowpassHz: 5800, compressorThreshold: -23, compressorRatio: 3.3, stereoWidth: 0.7 },
    preview: { representativeEventAtSeconds: 4.4, fadeInSeconds: 0.35 }
  },
  'alpha-7': {
    id: 'alpha-7', category: 'study', title: 'Recall Spark', soundIdentity: 'Crystalline recall field',
    recommendedUse: 'A bright review environment with crystalline detail and spacious, low-pressure clarity.',
    core: { type: 'binaural', targetDifferenceHz: 7, leftCarrierHz: 224, rightCarrierHz: 231, waveform: 'sine', gain: 0.49 },
    stems: [
      { id: 'recall-pad', role: 'pad', gain: 0.135, rootHz: 168, waveform: 'sine', intervals: [0, 4, 7, 14], detuneCents: [-6, 0, 6], cutoffHz: 3600, movementHz: 0.026 },
      { id: 'recall-glass', role: 'glass', gain: 0.06, rootHz: 504, waveform: 'sine', intervals: [0, 7, 12, 19], detuneCents: [-5, 5], cutoffHz: 5900, movementHz: 0.078 },
      { id: 'recall-air', role: 'noise', gain: 0.012, noiseColor: 'white', cutoffHz: 2600, movementHz: 0.032 }
    ],
    events: [
      { id: 'recall-motif', role: 'motif', minIntervalSeconds: 18, maxIntervalSeconds: 34, probability: 0.74, gainMin: 0.02, gainMax: 0.034, panMin: -0.36, panMax: 0.36, frequenciesHz: [672, 840, 1008, 840], durationSeconds: 4.0 },
      { id: 'recall-crystal', role: 'crystal', minIntervalSeconds: 25, maxIntervalSeconds: 48, probability: 0.48, gainMin: 0.015, gainMax: 0.025, panMin: -0.55, panMax: 0.55, frequenciesHz: [1344, 1680, 2016], durationSeconds: 2.4 }
    ],
    processing: { highpassHz: 38, lowpassHz: 6400, compressorThreshold: -23, compressorRatio: 3.1, stereoWidth: 0.82 },
    preview: { representativeEventAtSeconds: 4.2, fadeInSeconds: 0.36 }
  },
  'beta-22': {
    id: 'beta-22', category: 'study', title: 'Knowledge Flow', soundIdentity: 'Flowing study continuum',
    recommendedUse: 'A smooth extended-learning atmosphere for long reading, practice and connected thinking.',
    core: { type: 'binaural', targetDifferenceHz: 22, leftCarrierHz: 330, rightCarrierHz: 352, waveform: 'sine', gain: 0.46 },
    stems: [
      { id: 'knowledge-pad', role: 'pad', gain: 0.14, rootHz: 110, waveform: 'sine', intervals: [0, 5, 9, 14], detuneCents: [-8, 0, 7], cutoffHz: 3200, movementHz: 0.025 },
      { id: 'knowledge-glass', role: 'glass', gain: 0.044, rootHz: 440, waveform: 'sine', intervals: [0, 7, 16], detuneCents: [-4, 4], cutoffHz: 5100, movementHz: 0.055 },
      { id: 'knowledge-pulse', role: 'pulse', gain: 0.032, rootHz: 220, waveform: 'triangle', pulseHz: 0.3, pulseDepth: 0.4, cutoffHz: 2400 }
    ],
    events: [{ id: 'knowledge-motif', role: 'motif', minIntervalSeconds: 20, maxIntervalSeconds: 38, probability: 0.68, gainMin: 0.018, gainMax: 0.03, panMin: -0.4, panMax: 0.4, frequenciesHz: [440, 550, 660, 825], durationSeconds: 4.8 }],
    processing: { highpassHz: 34, lowpassHz: 5700, compressorThreshold: -23, compressorRatio: 3.2, stereoWidth: 0.74 },
    preview: { representativeEventAtSeconds: 5.1, fadeInSeconds: 0.42 }
  },
  'beta-15': {
    id: 'beta-15', category: 'work', title: 'Precision Mode', soundIdentity: 'Clean precision field',
    recommendedUse: 'Structured work where atmosphere stays minimal and clarity stays high.',
    core: { type: 'binaural', targetDifferenceHz: 15, leftCarrierHz: 140, rightCarrierHz: 155, waveform: 'sine', gain: 0.66 },
    stems: [{ id: 'precision-drone', role: 'drone', gain: 0.025, rootHz: 70, waveform: 'sine', intervals: [0, 12], detuneCents: [-2, 2], cutoffHz: 900, movementHz: 0.012 }],
    events: [],
    processing: { highpassHz: 24, lowpassHz: 3600, compressorThreshold: -25, compressorRatio: 2.5, stereoWidth: 0.28 },
    preview: { fadeInSeconds: 0.35 }
  },
  'beta-20': {
    id: 'beta-20', category: 'work', title: 'Peak Attention', soundIdentity: 'Futuristic attention space',
    recommendedUse: 'A bright futuristic focus environment built for high-attention sessions.',
    core: { type: 'binaural', targetDifferenceHz: 20, leftCarrierHz: 300, rightCarrierHz: 320, waveform: 'sine', gain: 0.48 },
    stems: [
      { id: 'peak-attention-pad', role: 'pad', gain: 0.16, rootHz: 75, waveform: 'triangle', intervals: [0, 7, 11, 14], detuneCents: [-10, -2, 7], cutoffHz: 3000, movementHz: 0.06 },
      { id: 'peak-attention-glass', role: 'glass', gain: 0.07, rootHz: 600, waveform: 'sine', intervals: [0, 5, 12, 19], detuneCents: [-6, 6], cutoffHz: 6200, movementHz: 0.095 },
      { id: 'peak-attention-pulse', role: 'pulse', gain: 0.055, rootHz: 225, waveform: 'sine', pulseHz: 0.52, pulseDepth: 0.7, cutoffHz: 3200 },
      { id: 'peak-attention-air', role: 'noise', gain: 0.018, noiseColor: 'white', cutoffHz: 2400, movementHz: 0.052 }
    ],
    events: [
      { id: 'peak-crystal', role: 'crystal', minIntervalSeconds: 12, maxIntervalSeconds: 25, probability: 0.76, gainMin: 0.026, gainMax: 0.042, panMin: -0.68, panMax: 0.68, frequenciesHz: [1200, 1500, 1800], durationSeconds: 2.1 },
      { id: 'peak-sequence', role: 'motif', minIntervalSeconds: 18, maxIntervalSeconds: 34, probability: 0.64, gainMin: 0.018, gainMax: 0.03, panMin: -0.42, panMax: 0.42, frequenciesHz: [450, 600, 750, 900], durationSeconds: 3.6 }
    ],
    processing: { highpassHz: 38, lowpassHz: 6500, compressorThreshold: -22, compressorRatio: 3.6, stereoWidth: 0.9 },
    preview: { representativeEventAtSeconds: 3.9, fadeInSeconds: 0.32 }
  },
  'gamma-30': {
    id: 'gamma-30', category: 'work', title: 'Creative Flow', soundIdentity: 'Expansive creative field',
    recommendedUse: 'Creative production, design and exploratory work.',
    core: { type: 'binaural', targetDifferenceHz: 30, leftCarrierHz: 170, rightCarrierHz: 200, waveform: 'sine', gain: 0.47 },
    stems: [
      { id: 'creative-pad', role: 'pad', gain: 0.08, rootHz: 85, waveform: 'triangle', intervals: [0, 5, 9, 14], detuneCents: [-7, 5], cutoffHz: 2600, movementHz: 0.035 },
      { id: 'creative-glass', role: 'glass', gain: 0.04, rootHz: 340, waveform: 'sine', intervals: [0, 7, 16], detuneCents: [-4, 4], cutoffHz: 4200, movementHz: 0.06 }
    ],
    events: [{ id: 'creative-motif', role: 'motif', minIntervalSeconds: 16, maxIntervalSeconds: 34, probability: 0.72, gainMin: 0.014, gainMax: 0.024, panMin: -0.42, panMax: 0.42, frequenciesHz: [510, 680, 765, 680], durationSeconds: 4.2 }],
    processing: { highpassHz: 30, lowpassHz: 5600, compressorThreshold: -23, compressorRatio: 3.2, stereoWidth: 0.84 },
    preview: { representativeEventAtSeconds: 4.6, fadeInSeconds: 0.5 }
  },
  'gamma-35': {
    id: 'gamma-35', category: 'work', title: 'Peak Focus', soundIdentity: 'Elevated Gamma atmosphere',
    recommendedUse: 'A polished Gamma experience for clear, sustained high-performance focus.',
    core: { type: 'binaural', targetDifferenceHz: 35, leftCarrierHz: 280, rightCarrierHz: 315, waveform: 'sine', gain: 0.49 },
    stems: [
      { id: 'peak-focus-pad', role: 'pad', gain: 0.125, rootHz: 140, waveform: 'sine', intervals: [0, 4, 7, 14], detuneCents: [-5, 4], cutoffHz: 3600, movementHz: 0.028 },
      { id: 'peak-focus-drone', role: 'drone', gain: 0.052, rootHz: 70, waveform: 'sine', intervals: [0, 12, 19], detuneCents: [-3, 3], cutoffHz: 1500, movementHz: 0.016 },
      { id: 'peak-focus-glass', role: 'glass', gain: 0.042, rootHz: 420, waveform: 'sine', intervals: [0, 7, 12], detuneCents: [-4, 5], cutoffHz: 5200, movementHz: 0.05 },
      { id: 'peak-focus-pulse', role: 'pulse', gain: 0.026, rootHz: 210, waveform: 'triangle', pulseHz: 0.28, pulseDepth: 0.42, cutoffHz: 2600 }
    ],
    events: [{ id: 'peak-focus-swell', role: 'swell', minIntervalSeconds: 17, maxIntervalSeconds: 34, probability: 0.64, gainMin: 0.018, gainMax: 0.03, panMin: -0.3, panMax: 0.3, frequenciesHz: [420, 560, 700], durationSeconds: 4.8 }],
    processing: { highpassHz: 28, lowpassHz: 5600, compressorThreshold: -23, compressorRatio: 3.4, stereoWidth: 0.72 },
    preview: { representativeEventAtSeconds: 5.8, fadeInSeconds: 0.4 }
  },
  'beta-25': {
    id: 'beta-25', category: 'work', title: 'Productive Rhythm', soundIdentity: 'Bright productivity current',
    recommendedUse: 'A forward, balanced work atmosphere for sustained output without an aggressive edge.',
    core: { type: 'binaural', targetDifferenceHz: 25, leftCarrierHz: 205, rightCarrierHz: 230, waveform: 'sine', gain: 0.47 },
    stems: [
      { id: 'rhythm-pad', role: 'pad', gain: 0.12, rootHz: 102.5, waveform: 'triangle', intervals: [0, 4, 7, 12], detuneCents: [-6, 5], cutoffHz: 2800, movementHz: 0.034 },
      { id: 'rhythm-pulse', role: 'pulse', gain: 0.045, rootHz: 307.5, waveform: 'sine', pulseHz: 0.44, pulseDepth: 0.54, cutoffHz: 3100 },
      { id: 'rhythm-air', role: 'noise', gain: 0.015, noiseColor: 'pink', cutoffHz: 2100, movementHz: 0.04 }
    ],
    events: [{ id: 'rhythm-motif', role: 'motif', minIntervalSeconds: 17, maxIntervalSeconds: 32, probability: 0.7, gainMin: 0.018, gainMax: 0.03, panMin: -0.34, panMax: 0.34, frequenciesHz: [410, 512.5, 615, 717.5], durationSeconds: 3.8 }],
    processing: { highpassHz: 34, lowpassHz: 5600, compressorThreshold: -23, compressorRatio: 3.4, stereoWidth: 0.7 },
    preview: { representativeEventAtSeconds: 4.7, fadeInSeconds: 0.34 }
  },
  'gamma-45': {
    id: 'gamma-45', category: 'work', title: 'Clear Purpose', soundIdentity: 'Radiant high-Gamma field',
    recommendedUse: 'A bright, expansive work environment for deliberate high-attention sessions.',
    core: { type: 'binaural', targetDifferenceHz: 45, leftCarrierHz: 360, rightCarrierHz: 405, waveform: 'sine', gain: 0.43 },
    stems: [
      { id: 'purpose-pad', role: 'pad', gain: 0.13, rootHz: 180, waveform: 'sine', intervals: [0, 7, 11, 14], detuneCents: [-6, 0, 5], cutoffHz: 4100, movementHz: 0.032 },
      { id: 'purpose-glass', role: 'glass', gain: 0.055, rootHz: 720, waveform: 'sine', intervals: [0, 7, 12], detuneCents: [-4, 4], cutoffHz: 6800, movementHz: 0.072 },
      { id: 'purpose-pulse', role: 'pulse', gain: 0.025, rootHz: 270, waveform: 'triangle', pulseHz: 0.24, pulseDepth: 0.36, cutoffHz: 3000 }
    ],
    events: [
      { id: 'purpose-swell', role: 'swell', minIntervalSeconds: 20, maxIntervalSeconds: 39, probability: 0.62, gainMin: 0.016, gainMax: 0.028, panMin: -0.28, panMax: 0.28, frequenciesHz: [540, 720, 900], durationSeconds: 4.6 },
      { id: 'purpose-crystal', role: 'crystal', minIntervalSeconds: 29, maxIntervalSeconds: 52, probability: 0.42, gainMin: 0.012, gainMax: 0.022, panMin: -0.58, panMax: 0.58, frequenciesHz: [1080, 1440, 1800], durationSeconds: 2.2 }
    ],
    processing: { highpassHz: 42, lowpassHz: 7000, compressorThreshold: -22, compressorRatio: 3.5, stereoWidth: 0.86 },
    preview: { representativeEventAtSeconds: 5.0, fadeInSeconds: 0.32 }
  },
  'theta-5': {
    id: 'theta-5', category: 'meditation', title: 'Inner Stillness', soundIdentity: 'Warm inward drone',
    recommendedUse: 'Quiet inward attention and low-motion meditation.',
    core: { type: 'binaural', targetDifferenceHz: 5, leftCarrierHz: 85, rightCarrierHz: 90, waveform: 'sine', gain: 0.56 },
    stems: [
      { id: 'stillness-drone', role: 'drone', gain: 0.075, rootHz: 85, waveform: 'triangle', intervals: [0, 7, 12], detuneCents: [-4, 4], cutoffHz: 1000, movementHz: 0.013 },
      { id: 'forest-breath', role: 'sample', gain: 0.02, assetPath: '/audio/ambience/forest-deep-loop.m4a', startOffsetSeconds: 19 }
    ],
    events: [{ id: 'stillness-bell', role: 'bell', minIntervalSeconds: 22, maxIntervalSeconds: 46, probability: 0.62, gainMin: 0.014, gainMax: 0.025, panMin: -0.2, panMax: 0.2, frequenciesHz: [340, 510, 850], durationSeconds: 5.6 }],
    processing: { highpassHz: 22, lowpassHz: 3300, compressorThreshold: -25, compressorRatio: 2.8, stereoWidth: 0.55 },
    preview: { representativeEventAtSeconds: 6.4, fadeInSeconds: 0.7 }
  },
  'theta-6': {
    id: 'theta-6', category: 'meditation', title: 'Deep Meditation', soundIdentity: 'OM-style meditative field',
    recommendedUse: 'Long-form meditation with a warm vocal-like center.',
    core: { type: 'binaural', targetDifferenceHz: 6, leftCarrierHz: 144, rightCarrierHz: 150, waveform: 'sine', gain: 0.5 },
    stems: [
      { id: 'om-vowel', role: 'vowel', gain: 0.055, rootHz: 72, waveform: 'sawtooth', detuneCents: [-9, 0, 8], formantsHz: [420, 820, 1180], cutoffHz: 1800, movementHz: 0.012 },
      { id: 'meditation-pad', role: 'pad', gain: 0.055, rootHz: 72, waveform: 'sine', intervals: [0, 7, 12], detuneCents: [-4, 4], cutoffHz: 1450, movementHz: 0.018 }
    ],
    events: [{ id: 'breath-event', role: 'breath', minIntervalSeconds: 18, maxIntervalSeconds: 35, probability: 0.66, gainMin: 0.01, gainMax: 0.018, panMin: -0.38, panMax: 0.38, durationSeconds: 4.6 }],
    processing: { highpassHz: 24, lowpassHz: 3000, compressorThreshold: -25, compressorRatio: 2.8, stereoWidth: 0.68 },
    preview: { representativeEventAtSeconds: 7.4, fadeInSeconds: 0.72 }
  },
  'theta-7': {
    id: 'theta-7', category: 'meditation', title: 'Mindful Awareness', soundIdentity: 'Bowl resonance space',
    recommendedUse: 'Mindfulness with sparse resonant markers and open air.',
    core: { type: 'binaural', targetDifferenceHz: 7, leftCarrierHz: 250, rightCarrierHz: 257, waveform: 'sine', gain: 0.48 },
    stems: [
      { id: 'airy-pad', role: 'pad', gain: 0.052, rootHz: 125, waveform: 'sine', intervals: [0, 5, 12], detuneCents: [-4, 5], cutoffHz: 2600, movementHz: 0.02 },
      { id: 'open-wind', role: 'sample', gain: 0.018, assetPath: '/audio/ambience/wind-open-loop.m4a', startOffsetSeconds: 13 }
    ],
    events: [{ id: 'awareness-bowl', role: 'bell', minIntervalSeconds: 17, maxIntervalSeconds: 39, probability: 0.78, gainMin: 0.015, gainMax: 0.028, panMin: -0.3, panMax: 0.3, frequenciesHz: [500, 750, 1250], durationSeconds: 6.4 }],
    processing: { highpassHz: 30, lowpassHz: 4500, compressorThreshold: -25, compressorRatio: 2.6, stereoWidth: 0.72 },
    preview: { representativeEventAtSeconds: 4.2, fadeInSeconds: 0.62 }
  },
  'alpha-9': {
    id: 'alpha-9', category: 'meditation', title: 'Calm Presence', soundIdentity: 'Celestial presence',
    recommendedUse: 'A brighter meditative atmosphere for calm open awareness.',
    core: { type: 'binaural', targetDifferenceHz: 9, leftCarrierHz: 333, rightCarrierHz: 342, waveform: 'sine', gain: 0.45 },
    stems: [
      { id: 'celestial-vowel', role: 'vowel', gain: 0.048, rootHz: 111, waveform: 'sawtooth', detuneCents: [-12, -3, 7, 14], formantsHz: [520, 980, 1640], cutoffHz: 2400, movementHz: 0.016 },
      { id: 'celestial-pad', role: 'pad', gain: 0.06, rootHz: 111, waveform: 'sine', intervals: [0, 7, 14, 19], detuneCents: [-6, 4], cutoffHz: 3600, movementHz: 0.028 }
    ],
    events: [{ id: 'celestial-crystal', role: 'crystal', minIntervalSeconds: 20, maxIntervalSeconds: 44, probability: 0.64, gainMin: 0.012, gainMax: 0.022, panMin: -0.55, panMax: 0.55, frequenciesHz: [999, 1332, 1665], durationSeconds: 3.8 }],
    processing: { highpassHz: 36, lowpassHz: 5200, compressorThreshold: -26, compressorRatio: 2.6, stereoWidth: 0.86 },
    preview: { representativeEventAtSeconds: 6.8, fadeInSeconds: 0.72 }
  },
  'theta-3-5': {
    id: 'theta-3-5', category: 'meditation', title: 'Inner Light', soundIdentity: 'Luminous inward sanctuary',
    recommendedUse: 'A bright, gentle inward atmosphere for reflective meditation and spacious stillness.',
    core: { type: 'binaural', targetDifferenceHz: 3.5, leftCarrierHz: 108, rightCarrierHz: 111.5, waveform: 'sine', gain: 0.5 },
    stems: [
      { id: 'inner-light-pad', role: 'pad', gain: 0.12, rootHz: 108, waveform: 'sine', intervals: [0, 5, 7, 12], detuneCents: [-6, 0, 6], cutoffHz: 3000, movementHz: 0.018 },
      { id: 'inner-light-vowel', role: 'vowel', gain: 0.06, rootHz: 72, waveform: 'sawtooth', detuneCents: [-8, 0, 8], formantsHz: [560, 1040, 1680], cutoffHz: 2600, movementHz: 0.014 },
      { id: 'inner-light-glow', role: 'glass', gain: 0.025, rootHz: 432, waveform: 'sine', intervals: [0, 7, 12], detuneCents: [-4, 4], cutoffHz: 5000, movementHz: 0.038 }
    ],
    events: [
      { id: 'inner-light-bell', role: 'bell', minIntervalSeconds: 26, maxIntervalSeconds: 51, probability: 0.58, gainMin: 0.012, gainMax: 0.022, panMin: -0.3, panMax: 0.3, frequenciesHz: [432, 648, 864], durationSeconds: 5.4 },
      { id: 'inner-light-swell', role: 'swell', minIntervalSeconds: 33, maxIntervalSeconds: 61, probability: 0.42, gainMin: 0.01, gainMax: 0.019, panMin: -0.22, panMax: 0.22, frequenciesHz: [216, 324, 432], durationSeconds: 6.2 }
    ],
    processing: { highpassHz: 26, lowpassHz: 5200, compressorThreshold: -25, compressorRatio: 2.7, stereoWidth: 0.8 },
    preview: { representativeEventAtSeconds: 5.6, fadeInSeconds: 0.62 }
  },
  'alpha-10-5': {
    id: 'alpha-10-5', category: 'meditation', title: 'Serene Expansion', soundIdentity: 'Wide celestial calm',
    recommendedUse: 'A spacious, peaceful meditation environment with airy vocal color and slow harmonic expansion.',
    core: { type: 'binaural', targetDifferenceHz: 10.5, leftCarrierHz: 240, rightCarrierHz: 250.5, waveform: 'sine', gain: 0.44 },
    stems: [
      { id: 'expansion-pad', role: 'pad', gain: 0.13, rootHz: 120, waveform: 'sine', intervals: [0, 7, 14, 21], detuneCents: [-8, 0, 7], cutoffHz: 3600, movementHz: 0.018 },
      { id: 'expansion-vowel', role: 'vowel', gain: 0.05, rootHz: 80, waveform: 'sawtooth', detuneCents: [-9, 0, 9], formantsHz: [500, 900, 1500], cutoffHz: 2400, movementHz: 0.012 },
      { id: 'expansion-air', role: 'noise', gain: 0.012, noiseColor: 'pink', cutoffHz: 1500, movementHz: 0.014 }
    ],
    events: [
      { id: 'expansion-breath', role: 'breath', minIntervalSeconds: 28, maxIntervalSeconds: 55, probability: 0.55, gainMin: 0.009, gainMax: 0.016, panMin: -0.45, panMax: 0.45, durationSeconds: 5.0 },
      { id: 'expansion-swell', role: 'swell', minIntervalSeconds: 35, maxIntervalSeconds: 66, probability: 0.4, gainMin: 0.009, gainMax: 0.017, panMin: -0.3, panMax: 0.3, frequenciesHz: [240, 360, 480], durationSeconds: 7.0 }
    ],
    processing: { highpassHz: 30, lowpassHz: 5000, compressorThreshold: -26, compressorRatio: 2.6, stereoWidth: 0.92 },
    preview: { representativeEventAtSeconds: 6.2, fadeInSeconds: 0.72 }
  },
  'delta-1': {
    id: 'delta-1', category: 'sleep', title: 'Warm Rest', soundIdentity: 'Deep brown-noise rest',
    recommendedUse: 'Very low-motion rest and quiet nighttime listening.',
    core: { type: 'binaural', targetDifferenceHz: 1, leftCarrierHz: 55, rightCarrierHz: 56, waveform: 'sine', gain: 0.58 },
    stems: [
      { id: 'deep-brown', role: 'noise', gain: 0.04, noiseColor: 'brown', cutoffHz: 520, movementHz: 0.008 },
      { id: 'rest-drone', role: 'drone', gain: 0.045, rootHz: 55, waveform: 'sine', intervals: [0, 12], detuneCents: [-2, 2], cutoffHz: 650, movementHz: 0.009 }
    ],
    events: [],
    processing: { highpassHz: 16, lowpassHz: 1500, compressorThreshold: -27, compressorRatio: 2.4, stereoWidth: 0.28 },
    preview: { fadeInSeconds: 0.85 }
  },
  'delta-1-5': {
    id: 'delta-1-5', category: 'sleep', title: 'Night Drift', soundIdentity: 'Nocturnal air drift',
    recommendedUse: 'Slow drifting toward sleep with a natural night bed.',
    core: { type: 'binaural', targetDifferenceHz: 1.5, leftCarrierHz: 96, rightCarrierHz: 97.5, waveform: 'sine', gain: 0.53 },
    stems: [
      { id: 'night-bed', role: 'sample', gain: 0.035, assetPath: '/audio/ambience/night-ambience-loop.m4a', startOffsetSeconds: 21 },
      { id: 'night-air', role: 'noise', gain: 0.018, noiseColor: 'pink', cutoffHz: 720, movementHz: 0.01 },
      { id: 'night-drone', role: 'drone', gain: 0.035, rootHz: 48, waveform: 'triangle', intervals: [0, 12], detuneCents: [-3, 3], cutoffHz: 720, movementHz: 0.008 }
    ],
    events: [],
    processing: { highpassHz: 18, lowpassHz: 1800, compressorThreshold: -27, compressorRatio: 2.4, stereoWidth: 0.38 },
    preview: { fadeInSeconds: 0.82 }
  },
  'delta-2-5': {
    id: 'delta-2-5', category: 'sleep', title: 'Sleep Serenity', soundIdentity: 'Serene night atmosphere',
    recommendedUse: 'A soft, warm transition toward sleep with gentle filtered air and a peaceful tonal bed.',
    core: { type: 'binaural', targetDifferenceHz: 2.5, leftCarrierHz: 140, rightCarrierHz: 142.5, waveform: 'sine', gain: 0.48 },
    stems: [
      { id: 'serenity-air', role: 'noise', gain: 0.024, noiseColor: 'pink', cutoffHz: 620, movementHz: 0.009 },
      { id: 'serenity-pad', role: 'pad', gain: 0.065, rootHz: 84, waveform: 'sine', intervals: [0, 7, 12, 16], detuneCents: [-4, 4], cutoffHz: 1400, movementHz: 0.009 }
    ],
    events: [],
    processing: { highpassHz: 18, lowpassHz: 1800, compressorThreshold: -28, compressorRatio: 2.3, stereoWidth: 0.34 },
    preview: { fadeInSeconds: 0.9 }
  },
  'delta-3': {
    id: 'delta-3', category: 'sleep', title: 'Sleep Preparation', soundIdentity: 'Warm sleep horizon',
    recommendedUse: 'A softer environmental bridge from wakefulness into sleep.',
    core: { type: 'binaural', targetDifferenceHz: 3, leftCarrierHz: 210, rightCarrierHz: 213, waveform: 'sine', gain: 0.46 },
    stems: [
      { id: 'sleep-pad', role: 'pad', gain: 0.05, rootHz: 70, waveform: 'sine', intervals: [0, 7, 12], detuneCents: [-4, 4], cutoffHz: 1300, movementHz: 0.01 },
      { id: 'sleep-wind', role: 'sample', gain: 0.025, assetPath: '/audio/ambience/wind-open-loop.m4a', startOffsetSeconds: 31 },
      { id: 'sleep-pink', role: 'noise', gain: 0.014, noiseColor: 'pink', cutoffHz: 860, movementHz: 0.008 }
    ],
    events: [],
    processing: { highpassHz: 18, lowpassHz: 1800, compressorThreshold: -27, compressorRatio: 2.4, stereoWidth: 0.42 },
    preview: { fadeInSeconds: 0.85 }
  },
  'delta-0-8': {
    id: 'delta-0-8', category: 'sleep', title: 'Moonlit Ease', soundIdentity: 'Warm moonlit rest field',
    recommendedUse: 'A soft, safe nighttime atmosphere with slow air, gentle warmth and minimal movement.',
    core: { type: 'binaural', targetDifferenceHz: 0.8, leftCarrierHz: 64, rightCarrierHz: 64.8, waveform: 'sine', gain: 0.52 },
    stems: [
      { id: 'moonlit-pad', role: 'pad', gain: 0.06, rootHz: 64, waveform: 'sine', intervals: [0, 7, 12], detuneCents: [-3, 3], cutoffHz: 1200, movementHz: 0.007 },
      { id: 'moonlit-air', role: 'noise', gain: 0.022, noiseColor: 'pink', cutoffHz: 600, movementHz: 0.007 },
      { id: 'moonlit-night', role: 'sample', gain: 0.025, assetPath: '/audio/ambience/night-ambience-loop.m4a', startOffsetSeconds: 55 }
    ],
    events: [],
    processing: { highpassHz: 16, lowpassHz: 1600, compressorThreshold: -28, compressorRatio: 2.3, stereoWidth: 0.34 },
    preview: { fadeInSeconds: 0.95 }
  },
  'theta-3-8': {
    id: 'theta-3-8', category: 'sleep', title: 'Quiet Horizon', soundIdentity: 'Soft sleep horizon',
    recommendedUse: 'A peaceful, slightly brighter nighttime field for easing into sustained rest.',
    core: { type: 'binaural', targetDifferenceHz: 3.8, leftCarrierHz: 172, rightCarrierHz: 175.8, waveform: 'sine', gain: 0.44 },
    stems: [
      { id: 'horizon-pad', role: 'pad', gain: 0.07, rootHz: 86, waveform: 'sine', intervals: [0, 5, 12], detuneCents: [-4, 4], cutoffHz: 1500, movementHz: 0.009 },
      { id: 'horizon-air', role: 'noise', gain: 0.016, noiseColor: 'pink', cutoffHz: 900, movementHz: 0.008 },
      { id: 'horizon-wind', role: 'sample', gain: 0.018, assetPath: '/audio/ambience/wind-open-loop.m4a', startOffsetSeconds: 23 }
    ],
    events: [],
    processing: { highpassHz: 18, lowpassHz: 1900, compressorThreshold: -27, compressorRatio: 2.4, stereoWidth: 0.46 },
    preview: { fadeInSeconds: 0.88 }
  },
  'ritual-639': {
    id: 'ritual-639', category: 'ritual', title: 'Solar Harmony', soundIdentity: 'Golden celestial ritual world',
    recommendedUse: 'A warm ceremonial atmosphere for intention, visualization and expansive ritual listening.',
    core: { type: 'pure', pureHz: 639, waveform: 'sine', gain: 0.42 },
    stems: [
      { id: 'solar-pad', role: 'pad', gain: 0.11, rootHz: 106.5, waveform: 'sine', intervals: [0, 4, 7, 12], detuneCents: [-7, 0, 6], cutoffHz: 3600, movementHz: 0.018 },
      { id: 'solar-vowel', role: 'vowel', gain: 0.06, rootHz: 79.875, waveform: 'sawtooth', detuneCents: [-8, 0, 8], formantsHz: [540, 980, 1580], cutoffHz: 2500, movementHz: 0.014 },
      { id: 'solar-glow', role: 'glass', gain: 0.035, rootHz: 319.5, waveform: 'sine', intervals: [0, 7, 12], detuneCents: [-4, 4], cutoffHz: 5800, movementHz: 0.05 }
    ],
    events: [
      { id: 'solar-bell', role: 'bell', minIntervalSeconds: 21, maxIntervalSeconds: 43, probability: 0.7, gainMin: 0.016, gainMax: 0.028, panMin: -0.42, panMax: 0.42, frequenciesHz: [639, 958.5, 1278], durationSeconds: 5.2 },
      { id: 'solar-swell', role: 'swell', minIntervalSeconds: 31, maxIntervalSeconds: 59, probability: 0.46, gainMin: 0.012, gainMax: 0.022, panMin: -0.28, panMax: 0.28, frequenciesHz: [213, 319.5, 426], durationSeconds: 6.4 }
    ],
    processing: { highpassHz: 28, lowpassHz: 6500, compressorThreshold: -24, compressorRatio: 2.9, stereoWidth: 0.88 },
    preview: { representativeEventAtSeconds: 4.4, fadeInSeconds: 0.5 }
  },
  'ritual-741': {
    id: 'ritual-741', category: 'ritual', title: 'Celestial Radiance', soundIdentity: 'Crystalline celestial ritual world',
    recommendedUse: 'A bright ritual atmosphere with airy vocal color, crystalline detail and spacious movement.',
    core: { type: 'pure', pureHz: 741, waveform: 'sine', gain: 0.4 },
    stems: [
      { id: 'radiance-pad', role: 'pad', gain: 0.105, rootHz: 123.5, waveform: 'sine', intervals: [0, 5, 9, 14], detuneCents: [-7, 0, 7], cutoffHz: 4200, movementHz: 0.022 },
      { id: 'radiance-glass', role: 'glass', gain: 0.07, rootHz: 370.5, waveform: 'sine', intervals: [0, 7, 12, 19], detuneCents: [-5, 5], cutoffHz: 7000, movementHz: 0.075 },
      { id: 'radiance-vowel', role: 'vowel', gain: 0.045, rootHz: 82.333, waveform: 'sawtooth', detuneCents: [-9, 0, 9], formantsHz: [620, 1160, 1900], cutoffHz: 3000, movementHz: 0.017 }
    ],
    events: [
      { id: 'radiance-crystal', role: 'crystal', minIntervalSeconds: 16, maxIntervalSeconds: 34, probability: 0.76, gainMin: 0.018, gainMax: 0.03, panMin: -0.6, panMax: 0.6, frequenciesHz: [741, 1111.5, 1482], durationSeconds: 3.0 },
      { id: 'radiance-motif', role: 'motif', minIntervalSeconds: 25, maxIntervalSeconds: 47, probability: 0.54, gainMin: 0.013, gainMax: 0.023, panMin: -0.36, panMax: 0.36, frequenciesHz: [494, 618, 741, 988], durationSeconds: 4.6 }
    ],
    processing: { highpassHz: 36, lowpassHz: 7600, compressorThreshold: -24, compressorRatio: 3.0, stereoWidth: 0.94 },
    preview: { representativeEventAtSeconds: 3.7, fadeInSeconds: 0.42 }
  },
};

export function getPremiumAudioRecipe(id: string | null | undefined): PremiumAudioRecipe | null {
  return id ? premiumAudioRecipes[id] ?? null : null;
}

export function getPremiumRecipeTechnical(id: string | null | undefined): string | null {
  const recipe = getPremiumAudioRecipe(id);
  if (!recipe) return null;
  if (recipe.core.type === 'pure') return `Pure ${recipe.core.pureHz} Hz tone · Immersive frequency world`;
  return `Left ${recipe.core.leftCarrierHz} Hz · Right ${recipe.core.rightCarrierHz} Hz · ${recipe.core.targetDifferenceHz} Hz difference`;
}

export function getPremiumSoundIdentity(id: string | null | undefined): string | null {
  return getPremiumAudioRecipe(id)?.soundIdentity ?? null;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function safelyStop(source: AudioScheduledSourceNode) {
  try { source.stop(); } catch { /* already stopped */ }
}

function safelyDisconnect(node: AudioNode) {
  try { node.disconnect(); } catch { /* already disconnected */ }
}

function registerSource<T extends AudioScheduledSourceNode>(bag: RuntimeBag, source: T): T {
  bag.sources.push(source);
  bag.nodes.push(source);
  return source;
}

function registerNode<T extends AudioNode>(bag: RuntimeBag, node: T): T {
  bag.nodes.push(node);
  return node;
}

function createColoredNoiseBuffer(context: AudioContext, color: PremiumNoiseColor, seconds = 8) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const output = buffer.getChannelData(0);
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
      output[index] = white * 0.22;
      continue;
    }
    if (color === 'brown') {
      brown = (brown + 0.018 * white) / 1.018;
      output[index] = Math.max(-1, Math.min(1, brown * 2.8));
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
    output[index] = Math.max(-1, Math.min(1, pink * 0.075));
  }
  return buffer;
}

function addSlowStereoMovement(context: AudioContext, bag: RuntimeBag, input: AudioNode, destination: AudioNode, movementHz = 0.025, depth = 0.55) {
  if (!('StereoPannerNode' in window)) {
    input.connect(destination);
    return;
  }
  const panner = registerNode(bag, context.createStereoPanner());
  const lfo = registerSource(bag, context.createOscillator());
  const lfoGain = registerNode(bag, context.createGain());
  lfo.type = 'sine';
  lfo.frequency.value = Math.max(0.005, movementHz);
  lfoGain.gain.value = Math.max(0, Math.min(0.92, depth));
  lfo.connect(lfoGain);
  lfoGain.connect(panner.pan);
  input.connect(panner);
  panner.connect(destination);
  lfo.start();
}

function addCore(context: AudioContext, bag: RuntimeBag, recipe: PremiumAudioRecipe, destination: AudioNode) {
  if (recipe.core.type === 'pure') {
    const oscillator = registerSource(bag, context.createOscillator());
    const gain = registerNode(bag, context.createGain());
    oscillator.type = recipe.core.waveform;
    oscillator.frequency.value = recipe.core.pureHz;
    gain.gain.value = recipe.core.gain;
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start();
    return;
  }
  const merger = registerNode(bag, context.createChannelMerger(2));
  const leftGain = registerNode(bag, context.createGain());
  const rightGain = registerNode(bag, context.createGain());
  const left = registerSource(bag, context.createOscillator());
  const right = registerSource(bag, context.createOscillator());
  left.type = recipe.core.waveform;
  right.type = recipe.core.waveform;
  left.frequency.value = recipe.core.leftCarrierHz;
  right.frequency.value = recipe.core.rightCarrierHz;
  leftGain.gain.value = recipe.core.gain;
  rightGain.gain.value = recipe.core.gain;
  left.connect(leftGain);
  right.connect(rightGain);
  leftGain.connect(merger, 0, 0);
  rightGain.connect(merger, 0, 1);
  merger.connect(destination);
  left.start();
  right.start();
}

function addTonalStem(context: AudioContext, bag: RuntimeBag, stem: PremiumStemLayer, destination: AudioNode) {
  const root = Math.max(24, stem.rootHz ?? 110);
  const intervals = stem.intervals?.length ? stem.intervals : [0, 7, 12];
  const detunes = stem.detuneCents?.length ? stem.detuneCents : [0];
  const stemGain = registerNode(bag, context.createGain());
  const filter = registerNode(bag, context.createBiquadFilter());
  filter.type = 'lowpass';
  filter.frequency.value = stem.cutoffHz ?? 2200;
  filter.Q.value = stem.role === 'glass' ? 0.9 : 0.45;
  stemGain.gain.value = stem.gain;
  filter.connect(stemGain);

  intervals.forEach((semitones, intervalIndex) => {
    detunes.forEach((detune, detuneIndex) => {
      const oscillator = registerSource(bag, context.createOscillator());
      oscillator.type = stem.waveform ?? (stem.role === 'drone' ? 'triangle' : 'sine');
      oscillator.frequency.value = root * RATIO(semitones);
      oscillator.detune.value = detune;
      const voiceGain = registerNode(bag, context.createGain());
      voiceGain.gain.value = 1 / Math.max(2.4, intervals.length * detunes.length * (stem.role === 'glass' ? 0.7 : 0.9));
      oscillator.connect(voiceGain);
      voiceGain.connect(filter);
      oscillator.start(context.currentTime + (intervalIndex + detuneIndex) * 0.025);
    });
  });

  if (stem.movementHz) addSlowStereoMovement(context, bag, stemGain, destination, stem.movementHz, stem.role === 'glass' ? 0.75 : 0.46);
  else stemGain.connect(destination);
}

function addPulseStem(context: AudioContext, bag: RuntimeBag, stem: PremiumStemLayer, destination: AudioNode) {
  const carrier = registerSource(bag, context.createOscillator());
  const carrierGain = registerNode(bag, context.createGain());
  const filter = registerNode(bag, context.createBiquadFilter());
  const lfo = registerSource(bag, context.createOscillator());
  const lfoGain = registerNode(bag, context.createGain());
  carrier.type = stem.waveform ?? 'triangle';
  carrier.frequency.value = stem.rootHz ?? 160;
  filter.type = 'lowpass';
  filter.frequency.value = stem.cutoffHz ?? 1800;
  carrierGain.gain.value = stem.gain * 0.62;
  lfo.type = 'sine';
  lfo.frequency.value = stem.pulseHz ?? 0.4;
  lfoGain.gain.value = stem.gain * (stem.pulseDepth ?? 0.55) * 0.45;
  lfo.connect(lfoGain);
  lfoGain.connect(carrierGain.gain);
  carrier.connect(filter);
  filter.connect(carrierGain);
  carrierGain.connect(destination);
  carrier.start();
  lfo.start();
}

function addNoiseStem(context: AudioContext, bag: RuntimeBag, stem: PremiumStemLayer, destination: AudioNode) {
  const source = registerSource(bag, context.createBufferSource());
  const filter = registerNode(bag, context.createBiquadFilter());
  const gain = registerNode(bag, context.createGain());
  source.buffer = createColoredNoiseBuffer(context, stem.noiseColor ?? 'pink');
  source.loop = true;
  filter.type = 'lowpass';
  filter.frequency.value = stem.cutoffHz ?? 1000;
  filter.Q.value = 0.25;
  gain.gain.value = stem.gain;
  source.connect(filter);
  filter.connect(gain);
  if (stem.movementHz) addSlowStereoMovement(context, bag, gain, destination, stem.movementHz, 0.32);
  else gain.connect(destination);
  source.start(context.currentTime, Math.random() * Math.max(0.01, source.buffer.duration - 0.01));
}

function addVowelStem(context: AudioContext, bag: RuntimeBag, stem: PremiumStemLayer, destination: AudioNode) {
  const sourceBus = registerNode(bag, context.createGain());
  sourceBus.gain.value = 0.22;
  const detunes = stem.detuneCents?.length ? stem.detuneCents : [-7, 0, 7];
  detunes.forEach((detune, index) => {
    const oscillator = registerSource(bag, context.createOscillator());
    oscillator.type = stem.waveform ?? 'sawtooth';
    oscillator.frequency.value = Math.max(45, stem.rootHz ?? 96) * (index === 0 ? 1 : index === detunes.length - 1 ? 2 : 1.5);
    oscillator.detune.value = detune;
    const voice = registerNode(bag, context.createGain());
    voice.gain.value = 0.22 / detunes.length;
    oscillator.connect(voice);
    voice.connect(sourceBus);
    oscillator.start();
  });

  const vowelBus = registerNode(bag, context.createGain());
  vowelBus.gain.value = stem.gain;
  const formants = stem.formantsHz?.length ? stem.formantsHz : [480, 920, 1400];
  formants.forEach((frequency, index) => {
    const filter = registerNode(bag, context.createBiquadFilter());
    const formantGain = registerNode(bag, context.createGain());
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = index === 0 ? 5 : 7;
    formantGain.gain.value = index === 0 ? 1 : index === 1 ? 0.62 : 0.38;
    sourceBus.connect(filter);
    filter.connect(formantGain);
    formantGain.connect(vowelBus);
  });

  if (stem.movementHz) addSlowStereoMovement(context, bag, vowelBus, destination, stem.movementHz, 0.52);
  else vowelBus.connect(destination);
}

async function addSampleStem(context: AudioContext, bag: RuntimeBag, stem: PremiumStemLayer, destination: AudioNode) {
  if (!stem.assetPath) return;
  const audio = new Audio();
  audio.preload = 'auto';
  audio.loop = true;
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', '');
  audio.src = stem.assetPath;
  const mediaSource = registerNode(bag, context.createMediaElementSource(audio));
  const gain = registerNode(bag, context.createGain());
  gain.gain.value = stem.gain;
  mediaSource.connect(gain);
  gain.connect(destination);
  bag.media.push(audio);

  const start = () => {
    if (bag.stopped) return;
    const desiredOffset = Math.max(0, stem.startOffsetSeconds ?? 0);
    if (Number.isFinite(audio.duration) && audio.duration > 1) audio.currentTime = desiredOffset % Math.max(1, audio.duration - 0.25);
    void audio.play().catch(() => undefined);
  };
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) start();
  else audio.addEventListener('canplay', start, { once: true });
}

function scheduleToneEvent(context: AudioContext, bag: RuntimeBag, event: PremiumEventLayer, destination: AudioNode, delaySeconds = 0) {
  const now = context.currentTime + Math.max(0, delaySeconds);
  const frequencies = event.frequenciesHz?.length ? event.frequenciesHz : [440, 660, 990];
  const duration = event.durationSeconds ?? 3;
  const eventGain = randomBetween(event.gainMin, event.gainMax);
  const panValue = randomBetween(event.panMin, event.panMax);
  const panner = registerNode(bag, context.createStereoPanner());
  panner.pan.value = Math.max(-0.95, Math.min(0.95, panValue));
  panner.connect(destination);

  const selected = event.role === 'motif' ? frequencies : frequencies.slice(0, Math.min(3, frequencies.length));
  selected.forEach((frequency, index) => {
    const oscillator = registerSource(bag, context.createOscillator());
    const gain = registerNode(bag, context.createGain());
    const onset = now + (event.role === 'motif' ? index * 0.72 : index * 0.015);
    const release = onset + Math.max(0.8, duration - (event.role === 'motif' ? index * 0.3 : 0));
    oscillator.type = event.role === 'crystal' ? 'sine' : event.role === 'swell' ? 'triangle' : 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, onset);
    gain.gain.exponentialRampToValueAtTime(eventGain / Math.max(1, selected.length * 0.75), onset + (event.role === 'swell' ? 1.4 : 0.04));
    gain.gain.exponentialRampToValueAtTime(0.0001, release);
    oscillator.connect(gain);
    gain.connect(panner);
    oscillator.start(onset);
    oscillator.stop(release + 0.05);
  });
}

function scheduleBreathEvent(context: AudioContext, bag: RuntimeBag, event: PremiumEventLayer, destination: AudioNode, delaySeconds = 0) {
  const now = context.currentTime + Math.max(0, delaySeconds);
  const duration = event.durationSeconds ?? 4;
  const source = registerSource(bag, context.createBufferSource());
  const filter = registerNode(bag, context.createBiquadFilter());
  const gain = registerNode(bag, context.createGain());
  const panner = registerNode(bag, context.createStereoPanner());
  source.buffer = createColoredNoiseBuffer(context, 'pink', Math.max(6, duration + 1));
  filter.type = 'bandpass';
  filter.frequency.value = 720;
  filter.Q.value = 0.5;
  panner.pan.value = randomBetween(event.panMin, event.panMax);
  const peak = randomBetween(event.gainMin, event.gainMax);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + duration * 0.38);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(destination);
  source.start(now);
  source.stop(now + duration + 0.05);
}

function triggerEvent(context: AudioContext, bag: RuntimeBag, event: PremiumEventLayer, destination: AudioNode, delaySeconds = 0) {
  if (bag.stopped) return;
  if (event.role === 'breath') scheduleBreathEvent(context, bag, event, destination, delaySeconds);
  else scheduleToneEvent(context, bag, event, destination, delaySeconds);
}

function scheduleRecurringEvent(context: AudioContext, bag: RuntimeBag, event: PremiumEventLayer, destination: AudioNode) {
  const scheduleNext = () => {
    if (bag.stopped) return;
    const delayMs = randomBetween(event.minIntervalSeconds, event.maxIntervalSeconds) * 1000;
    const timer = window.setTimeout(() => {
      if (bag.stopped) return;
      if (Math.random() <= event.probability) triggerEvent(context, bag, event, destination);
      scheduleNext();
    }, delayMs);
    bag.timers.push(timer);
  };
  scheduleNext();
}

export async function startPremiumAudioRecipe(
  context: AudioContext,
  destination: AudioNode,
  id: string,
  options: StartPremiumAudioOptions = {}
): Promise<PremiumAudioHandle> {
  const recipe = getPremiumAudioRecipe(id);
  if (!recipe) throw new Error(`No Premium audio recipe is registered for ${id}.`);
  if (context.state === 'suspended') await context.resume();

  const mode = options.mode ?? 'immersive';
  const preview = options.preview === true;
  const bag: RuntimeBag = { sources: [], nodes: [], timers: [], media: [], stopped: false };
  const output = registerNode(bag, context.createGain());
  const highpass = registerNode(bag, context.createBiquadFilter());
  const lowpass = registerNode(bag, context.createBiquadFilter());
  const compressor = registerNode(bag, context.createDynamicsCompressor());
  const now = context.currentTime;

  highpass.type = 'highpass';
  highpass.frequency.value = recipe.processing.highpassHz ?? 18;
  lowpass.type = 'lowpass';
  lowpass.frequency.value = recipe.processing.lowpassHz ?? 6000;
  compressor.threshold.value = recipe.processing.compressorThreshold ?? -24;
  compressor.knee.value = 20;
  compressor.ratio.value = recipe.processing.compressorRatio ?? 3;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.32;

  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.92, now + (preview ? recipe.preview.fadeInSeconds : Math.max(0.7, recipe.preview.fadeInSeconds)));
  output.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(compressor);
  compressor.connect(destination);

  addCore(context, bag, recipe, output);

  if (mode === 'immersive') {
    for (const stem of recipe.stems) {
      if (stem.role === 'sample') await addSampleStem(context, bag, stem, output);
      else if (stem.role === 'noise') addNoiseStem(context, bag, stem, output);
      else if (stem.role === 'pulse') addPulseStem(context, bag, stem, output);
      else if (stem.role === 'vowel') addVowelStem(context, bag, stem, output);
      else addTonalStem(context, bag, stem, output);
    }

    recipe.events.forEach((event, index) => {
      if (preview && recipe.preview.representativeEventAtSeconds !== undefined && index === 0) {
        triggerEvent(context, bag, event, output, recipe.preview.representativeEventAtSeconds);
      }
      if (!preview) scheduleRecurringEvent(context, bag, event, output);
    });
  }

  return {
    stop: (fadeSeconds = 0.25) => {
      if (bag.stopped) return;
      bag.stopped = true;
      bag.timers.forEach((timer) => window.clearTimeout(timer));
      bag.timers.length = 0;
      bag.media.forEach((audio) => {
        try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch { /* media already released */ }
      });
      bag.media.length = 0;
      const stopAt = context.currentTime;
      try {
        output.gain.cancelScheduledValues(stopAt);
        output.gain.setValueAtTime(Math.max(0.0001, output.gain.value), stopAt);
        output.gain.exponentialRampToValueAtTime(0.0001, stopAt + Math.max(0.02, fadeSeconds));
      } catch { /* context may be closing */ }
      window.setTimeout(() => {
        bag.sources.forEach(safelyStop);
        bag.nodes.forEach(safelyDisconnect);
        bag.sources.length = 0;
        bag.nodes.length = 0;
      }, Math.ceil(Math.max(0.02, fadeSeconds) * 1000) + 60);
    }
  };
}
