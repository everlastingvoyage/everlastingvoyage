'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getPremiumAudioRecipe,
  getPremiumRecipeTechnical,
  startPremiumAudioRecipe,
  type PremiumAudioHandle
} from './premium-audio-engine';

type ThemeId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';
type SoundProfile = 'clean' | 'focus' | 'futuristic' | 'meditative' | 'sleep' | 'ritual';
type SignalId =
  | ThemeId
  | 'alpha-8'
  | 'alpha-12'
  | 'smr-14'
  | 'beta-18'
  | 'beta-15'
  | 'beta-20'
  | 'gamma-30'
  | 'gamma-35'
  | 'theta-5'
  | 'theta-6'
  | 'theta-7'
  | 'alpha-9'
  | 'delta-1'
  | 'delta-1-5'
  | 'delta-2-5'
  | 'delta-3'
  | 'pure-222'
  | 'pure-444'
  | 'pure-528'
  | 'alpha-7'
  | 'beta-22'
  | 'beta-25'
  | 'gamma-45'
  | 'theta-3-5'
  | 'alpha-10-5'
  | 'delta-0-8'
  | 'theta-3-8'
  | 'ritual-639'
  | 'ritual-741'
  | 'pure-963';
type SessionStatus = 'ready' | 'running' | 'paused' | 'completed';

type SignalDefinition = {
  id: SignalId;
  themeId: ThemeId;
  frequency: string;
  hz: string;
  state: string;
  purpose: string;
  technical: string;
  note: string;
  premium: boolean;
  soundProfile: SoundProfile;
  leftHz?: number;
  rightHz?: number;
  pureHz?: number;
};

type SessionConfig = {
  stateId: ThemeId;
  signalId?: SignalId;
  durationMinutes: number;
  intention: string;
};

type PersistedSession = {
  config: SessionConfig;
  status: SessionStatus;
  remainingSeconds: number;
  endAt: number | null;
  thoughts: string[];
  volume: number;
  muted: boolean;
  updatedAt: number;
};

const STORAGE_KEY = 'ev-v10-active-session';
const ENTITLEMENT_STORAGE_KEY = 'ev-premium-entitlement';
const PREMIUM_SELECTION_DATASET_KEY = 'evPremiumSignal';

const signals: Record<SignalId, SignalDefinition> = {
  alpha: {
    id: 'alpha', themeId: 'alpha', frequency: 'Alpha', hz: '10 Hz', state: 'Calm Focus',
    purpose: 'Steady concentration for studying, reading and planning.',
    technical: 'Left 180 Hz · Right 190 Hz · 10 Hz difference', note: 'Headphones recommended',
    premium: false, soundProfile: 'clean', leftHz: 180, rightHz: 190
  },
  gamma: {
    id: 'gamma', themeId: 'gamma', frequency: 'Gamma', hz: '40 Hz', state: 'Gamma Clarity',
    purpose: 'High-attention focus for demanding work and research.',
    technical: 'Left 220 Hz · Right 260 Hz · 40 Hz difference', note: 'Headphones recommended',
    premium: false, soundProfile: 'clean', leftHz: 220, rightHz: 260
  },
  theta: {
    id: 'theta', themeId: 'theta', frequency: 'Theta', hz: '4 Hz', state: 'Reflective Space',
    purpose: 'A reflective space for writing, meditation and ideation.',
    technical: 'Left 95 Hz · Right 99 Hz · 4 Hz difference', note: 'Headphones recommended',
    premium: false, soundProfile: 'clean', leftHz: 95, rightHz: 99
  },
  delta: {
    id: 'delta', themeId: 'delta', frequency: 'Delta', hz: '2 Hz', state: 'Deep Rest',
    purpose: 'A quiet wind-down state for rest and sleep preparation.',
    technical: 'Left 70 Hz · Right 72 Hz · 2 Hz difference', note: 'Headphones recommended',
    premium: false, soundProfile: 'clean', leftHz: 70, rightHz: 72
  },
  abundance: {
    id: 'abundance', themeId: 'abundance', frequency: 'Pure Tone', hz: '888 Hz', state: 'Abundance',
    purpose: 'A ceremonial pure-tone space for visualization and intention.',
    technical: 'Pure 888 Hz tone · Clean uninterrupted signal', note: 'Speakers or headphones',
    premium: false, soundProfile: 'clean', pureHz: 888
  },

  'alpha-8': {
    id: 'alpha-8', themeId: 'alpha', frequency: 'Alpha', hz: '8 Hz', state: 'Relaxed Study',
    purpose: 'A slower Alpha experience for relaxed reading and study.',
    technical: 'Left 180 Hz · Right 188 Hz · 8 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'clean', leftHz: 180, rightHz: 188
  },
  'alpha-12': {
    id: 'alpha-12', themeId: 'alpha', frequency: 'Alpha', hz: '12 Hz', state: 'Memory Retention',
    purpose: 'A luminous study environment for focused review and information retention.',
    technical: 'Left 256 Hz · Right 268 Hz · 12 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'focus', leftHz: 256, rightHz: 268
  },
  'smr-14': {
    id: 'smr-14', themeId: 'alpha', frequency: 'SMR', hz: '14 Hz', state: 'Steady Attention',
    purpose: 'A steady-attention signal with an extremely subtle support layer.',
    technical: 'Left 180 Hz · Right 194 Hz · 14 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'focus', leftHz: 180, rightHz: 194
  },
  'beta-18': {
    id: 'beta-18', themeId: 'alpha', frequency: 'Beta', hz: '18 Hz', state: 'Learning Momentum',
    purpose: 'A forward-moving focus environment for productive work and active study.',
    technical: 'Left 216 Hz · Right 234 Hz · 18 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'focus', leftHz: 186, rightHz: 204
  },
  'alpha-7': { id: 'alpha-7', themeId: 'alpha', frequency: 'Alpha', hz: '7 Hz', state: 'Recall Spark', purpose: 'A bright review environment with crystalline detail and spacious, low-pressure clarity.', technical: 'Left 224 Hz · Right 231 Hz · 7 Hz difference', note: 'Headphones recommended · Premium', premium: true, soundProfile: 'focus', leftHz: 224, rightHz: 231 },
  'beta-22': { id: 'beta-22', themeId: 'alpha', frequency: 'Beta', hz: '22 Hz', state: 'Knowledge Flow', purpose: 'A smooth extended-learning atmosphere for long reading, practice and connected thinking.', technical: 'Left 330 Hz · Right 352 Hz · 22 Hz difference', note: 'Headphones recommended · Premium', premium: true, soundProfile: 'focus', leftHz: 330, rightHz: 352 },
  'beta-15': {
    id: 'beta-15', themeId: 'gamma', frequency: 'Beta', hz: '15 Hz', state: 'Precision Mode',
    purpose: 'A clean, minimal signal for focused execution.',
    technical: 'Left 200 Hz · Right 215 Hz · 15 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'clean', leftHz: 200, rightHz: 215
  },
  'beta-20': {
    id: 'beta-20', themeId: 'gamma', frequency: 'Beta', hz: '20 Hz', state: 'Peak Attention',
    purpose: 'A bright futuristic focus environment built for high-attention sessions.',
    technical: 'Left 300 Hz · Right 320 Hz · 20 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'futuristic', leftHz: 300, rightHz: 320
  },
  'gamma-30': {
    id: 'gamma-30', themeId: 'gamma', frequency: 'Gamma', hz: '30 Hz', state: 'Creative Spark',
    purpose: 'A spacious Gamma experience for creative production and exploratory work.',
    technical: 'Left 200 Hz · Right 230 Hz · 30 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'futuristic', leftHz: 200, rightHz: 230
  },
  'gamma-35': {
    id: 'gamma-35', themeId: 'gamma', frequency: 'Gamma', hz: '35 Hz', state: 'Peak Focus',
    purpose: 'A polished Gamma experience for clear, sustained high-performance focus.',
    technical: 'Left 280 Hz · Right 315 Hz · 35 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'futuristic', leftHz: 280, rightHz: 315
  },
  'beta-25': { id: 'beta-25', themeId: 'gamma', frequency: 'Beta', hz: '25 Hz', state: 'Productive Rhythm', purpose: 'A forward, balanced work atmosphere for sustained output without an aggressive edge.', technical: 'Left 205 Hz · Right 230 Hz · 25 Hz difference', note: 'Headphones recommended · Premium', premium: true, soundProfile: 'futuristic', leftHz: 205, rightHz: 230 },
  'gamma-45': { id: 'gamma-45', themeId: 'gamma', frequency: 'Gamma', hz: '45 Hz', state: 'Clear Purpose', purpose: 'A bright, expansive work environment for deliberate high-attention sessions.', technical: 'Left 360 Hz · Right 405 Hz · 45 Hz difference', note: 'Headphones recommended · Premium', premium: true, soundProfile: 'futuristic', leftHz: 360, rightHz: 405 },
  'theta-5': {
    id: 'theta-5', themeId: 'theta', frequency: 'Theta', hz: '5 Hz', state: 'Inner Stillness',
    purpose: 'A soft inward signal with a quiet atmospheric pad.',
    technical: 'Left 95 Hz · Right 100 Hz · 5 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'meditative', leftHz: 95, rightHz: 100
  },
  'theta-6': {
    id: 'theta-6', themeId: 'theta', frequency: 'Theta', hz: '6 Hz', state: 'Deep Meditation',
    purpose: 'A spacious meditative experience with slow harmonic movement.',
    technical: 'Left 95 Hz · Right 101 Hz · 6 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'meditative', leftHz: 95, rightHz: 101
  },
  'theta-7': {
    id: 'theta-7', themeId: 'theta', frequency: 'Theta', hz: '7 Hz', state: 'Mindful Awareness',
    purpose: 'A gentle Theta signal with light airy movement.',
    technical: 'Left 95 Hz · Right 102 Hz · 7 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'meditative', leftHz: 95, rightHz: 102
  },
  'alpha-9': {
    id: 'alpha-9', themeId: 'theta', frequency: 'Alpha', hz: '9 Hz', state: 'Calm Presence',
    purpose: 'A mostly clean Alpha experience for calm presence.',
    technical: 'Left 180 Hz · Right 189 Hz · 9 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'clean', leftHz: 180, rightHz: 189
  },
  'theta-3-5': { id: 'theta-3-5', themeId: 'theta', frequency: 'Theta', hz: '3.5 Hz', state: 'Inner Light', purpose: 'A bright, gentle inward atmosphere for reflective meditation and spacious stillness.', technical: 'Left 108 Hz · Right 111.5 Hz · 3.5 Hz difference', note: 'Headphones recommended · Premium', premium: true, soundProfile: 'meditative', leftHz: 108, rightHz: 111.5 },
  'alpha-10-5': { id: 'alpha-10-5', themeId: 'theta', frequency: 'Alpha', hz: '10.5 Hz', state: 'Serene Expansion', purpose: 'A spacious, peaceful meditation environment with airy vocal color and slow harmonic expansion.', technical: 'Left 240 Hz · Right 250.5 Hz · 10.5 Hz difference', note: 'Headphones recommended · Premium', premium: true, soundProfile: 'meditative', leftHz: 240, rightHz: 250.5 },
  'delta-1': {
    id: 'delta-1', themeId: 'delta', frequency: 'Delta', hz: '1 Hz', state: 'Warm Rest',
    purpose: 'A very slow Delta signal with a deep warm ambience.',
    technical: 'Left 70 Hz · Right 71 Hz · 1 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'sleep', leftHz: 70, rightHz: 71
  },
  'delta-1-5': {
    id: 'delta-1-5', themeId: 'delta', frequency: 'Delta', hz: '1.5 Hz', state: 'Night Drift',
    purpose: 'A clean low-frequency difference for quiet nighttime listening.',
    technical: 'Left 70 Hz · Right 71.5 Hz · 1.5 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'clean', leftHz: 70, rightHz: 71.5
  },
  'delta-2-5': {
    id: 'delta-2-5', themeId: 'delta', frequency: 'Delta', hz: '2.5 Hz', state: 'Sleep Serenity',
    purpose: 'A soft Delta experience with gentle filtered air and a peaceful tonal bed.',
    technical: 'Left 70 Hz · Right 72.5 Hz · 2.5 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'sleep', leftHz: 70, rightHz: 72.5
  },
  'delta-3': {
    id: 'delta-3', themeId: 'delta', frequency: 'Delta', hz: '3 Hz', state: 'Sleep Preparation',
    purpose: 'A gentle nighttime frequency with a soft warm atmosphere.',
    technical: 'Left 70 Hz · Right 73 Hz · 3 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'sleep', leftHz: 70, rightHz: 73
  },
  'delta-0-8': { id: 'delta-0-8', themeId: 'delta', frequency: 'Delta', hz: '0.8 Hz', state: 'Moonlit Ease', purpose: 'A soft, safe nighttime atmosphere with slow air, gentle warmth and minimal movement.', technical: 'Left 64 Hz · Right 64.8 Hz · 0.8 Hz difference', note: 'Headphones recommended · Premium', premium: true, soundProfile: 'sleep', leftHz: 64, rightHz: 64.8 },
  'theta-3-8': { id: 'theta-3-8', themeId: 'delta', frequency: 'Theta', hz: '3.8 Hz', state: 'Quiet Horizon', purpose: 'A peaceful, slightly brighter nighttime field for easing into sustained rest.', technical: 'Left 172 Hz · Right 175.8 Hz · 3.8 Hz difference', note: 'Headphones recommended · Premium', premium: true, soundProfile: 'sleep', leftHz: 172, rightHz: 175.8 },
  'pure-222': {
    id: 'pure-222', themeId: 'abundance', frequency: 'Pure Tone', hz: '222 Hz', state: 'Alignment',
    purpose: 'A warm ritual listening space for intention and visualization.',
    technical: 'Pure 222 Hz tone · Ritual soundscape', note: 'Speakers or headphones · Premium',
    premium: true, soundProfile: 'ritual', pureHz: 222
  },
  'pure-444': {
    id: 'pure-444', themeId: 'abundance', frequency: 'Pure Tone', hz: '444 Hz', state: 'Grounded Intention',
    purpose: 'A grounded ceremonial listening experience.',
    technical: 'Pure 444 Hz tone · Ritual soundscape', note: 'Speakers or headphones · Premium',
    premium: true, soundProfile: 'ritual', pureHz: 444
  },
  'pure-528': {
    id: 'pure-528', themeId: 'abundance', frequency: 'Pure Tone', hz: '528 Hz', state: 'Renewal',
    purpose: 'A warm, expansive ritual listening experience.',
    technical: 'Pure 528 Hz tone · Ritual soundscape', note: 'Speakers or headphones · Premium',
    premium: true, soundProfile: 'ritual', pureHz: 528
  },
  'ritual-639': { id: 'ritual-639', themeId: 'abundance', frequency: 'Ritual Frequency', hz: '639 Hz', state: 'Solar Harmony', purpose: 'A warm ceremonial atmosphere for intention, visualization and expansive ritual listening.', technical: 'Pure 639 Hz tone · Immersive frequency world', note: 'Speakers or headphones · Premium', premium: true, soundProfile: 'ritual', pureHz: 639 },
  'ritual-741': { id: 'ritual-741', themeId: 'abundance', frequency: 'Ritual Frequency', hz: '741 Hz', state: 'Celestial Radiance', purpose: 'A bright ritual atmosphere with airy vocal color, crystalline detail and spacious movement.', technical: 'Pure 741 Hz tone · Immersive frequency world', note: 'Speakers or headphones · Premium', premium: true, soundProfile: 'ritual', pureHz: 741 },
  'pure-963': {
    id: 'pure-963', themeId: 'abundance', frequency: 'Pure Tone', hz: '963 Hz', state: 'Higher Awareness',
    purpose: 'A celestial ritual listening space for reflection and intention.',
    technical: 'Pure 963 Hz tone · Ritual soundscape', note: 'Speakers or headphones · Premium',
    premium: true, soundProfile: 'ritual', pureHz: 963
  }
};

function isSignalId(value: string): value is SignalId {
  return Object.prototype.hasOwnProperty.call(signals, value);
}

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function createNoiseBuffer(context: AudioContext, seconds = 2) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
}

function readBuilderConfig(): SessionConfig {
  const premiumCandidate = document.body.dataset[PREMIUM_SELECTION_DATASET_KEY] || '';
  const premiumSignalId = isSignalId(premiumCandidate) && signals[premiumCandidate].premium ? premiumCandidate : undefined;
  const freeIds: ThemeId[] = ['alpha', 'gamma', 'theta', 'delta', 'abundance'];
  const activeState = document.querySelector<HTMLElement>('.stateChoice.active');
  const freeStateId = freeIds.find((id) => activeState?.classList.contains(id)) ?? 'alpha';
  const stateId = premiumSignalId ? signals[premiumSignalId].themeId : freeStateId;
  const durationText = document.querySelector<HTMLElement>('.durationRow button.active')?.textContent ?? '25';
  const durationMinutes = Number.parseInt(durationText, 10) || 25;
  const intention = (document.querySelector<HTMLInputElement>('.intentionField input')?.value ?? '').trim();
  return { stateId, signalId: premiumSignalId, durationMinutes, intention };
}

async function validatePremiumAccess() {
  try {
    const token = localStorage.getItem(ENTITLEMENT_STORAGE_KEY) || '';
    const response = await fetch('/api/premium', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ action: 'validate', token })
    });
    if (!response.ok) return false;
    const data = await response.json() as { valid?: boolean; entitlementToken?: string };
    if (data.valid && data.entitlementToken) localStorage.setItem(ENTITLEMENT_STORAGE_KEY, data.entitlementToken);
    return data.valid === true;
  } catch {
    return false;
  }
}

export default function V10VoyageEngine() {
  const [config, setConfig] = useState<SessionConfig>({ stateId: 'alpha', durationMinutes: 25, intention: '' });
  const [status, setStatus] = useState<SessionStatus>('ready');
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [thought, setThought] = useState('');
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [thoughtSaved, setThoughtSaved] = useState(false);
  const [volume, setVolume] = useState(0.22);
  const [muted, setMuted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const sourceRefs = useRef<AudioScheduledSourceNode[]>([]);
  const nodeRefs = useRef<AudioNode[]>([]);
  const premiumAudioHandleRef = useRef<PremiumAudioHandle | null>(null);
  const completionPlayedRef = useRef(false);

  const resolvedSignalId = config.signalId && isSignalId(config.signalId) ? config.signalId : config.stateId;
  const signal = signals[resolvedSignalId] ?? signals.alpha;
  const totalSeconds = config.durationMinutes * 60;
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds)) : 0;

  const persist = useCallback((overrides: Partial<PersistedSession> = {}) => {
    if (typeof window === 'undefined') return;
    const payload: PersistedSession = {
      config, status, remainingSeconds, endAt, thoughts, volume, muted, updatedAt: Date.now(), ...overrides
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [config, status, remainingSeconds, endAt, thoughts, volume, muted]);

  const ensureAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio is not supported in this browser.');
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    return audioContextRef.current;
  }, []);

  const stopAudio = useCallback((fadeSeconds = 0.35) => {
    premiumAudioHandleRef.current?.stop(fadeSeconds);
    premiumAudioHandleRef.current = null;
    const context = audioContextRef.current;
    const gain = masterGainRef.current;
    const sources = sourceRefs.current;
    const nodes = nodeRefs.current;
    if (!context || !gain) return;

    const now = context.currentTime;
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);
    } catch {
      // Audio can already be tearing down.
    }

    window.setTimeout(() => {
      sources.forEach((source) => {
        try { source.stop(); } catch { /* already stopped */ }
        try { source.disconnect(); } catch { /* already disconnected */ }
      });
      nodes.forEach((node) => {
        try { node.disconnect(); } catch { /* already disconnected */ }
      });
      sourceRefs.current = [];
      nodeRefs.current = [];
      masterGainRef.current = null;
    }, Math.ceil(fadeSeconds * 1000) + 70);
  }, []);

  const startAudio = useCallback(async () => {
    const context = await ensureAudioContext();
    stopAudio(0.06);

    const now = context.currentTime;
    const masterGain = context.createGain();
    const targetVolume = muted ? 0.0001 : Math.max(0.0001, volume);
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(targetVolume, now + 0.8);
    masterGain.connect(context.destination);
    masterGainRef.current = masterGain;

    // V12.5: redesigned non-Ritual Premium experiences share Preview/full Voyage recipes.
    // Approved Manifestation & Ritual remains on the exact legacy implementation below.
    const premiumRecipe = signal.premium ? getPremiumAudioRecipe(signal.id) : null;
    if (premiumRecipe) {
      premiumAudioHandleRef.current = await startPremiumAudioRecipe(context, masterGain, signal.id, { mode: 'immersive', preview: false });
      sourceRefs.current = [];
      nodeRefs.current = [masterGain];
      return;
    }

    const sources: AudioScheduledSourceNode[] = [];
    const nodes: AudioNode[] = [masterGain];
    const registerSource = <T extends AudioScheduledSourceNode>(source: T) => {
      sources.push(source);
      nodes.push(source);
      return source;
    };

    if (signal.pureHz) {
      const oscillator = registerSource(context.createOscillator());
      const signalGain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(signal.pureHz, now);
      signalGain.gain.value = 0.72;
      oscillator.connect(signalGain);
      signalGain.connect(masterGain);
      nodes.push(signalGain);
      oscillator.start(now);
    } else if (signal.leftHz && signal.rightHz) {
      const merger = context.createChannelMerger(2);
      const leftGain = context.createGain();
      const rightGain = context.createGain();
      leftGain.gain.value = 0.62;
      rightGain.gain.value = 0.62;
      leftGain.connect(merger, 0, 0);
      rightGain.connect(merger, 0, 1);
      merger.connect(masterGain);
      nodes.push(merger, leftGain, rightGain);

      const left = registerSource(context.createOscillator());
      const right = registerSource(context.createOscillator());
      left.type = 'sine';
      right.type = 'sine';
      left.frequency.setValueAtTime(signal.leftHz, now);
      right.frequency.setValueAtTime(signal.rightHz, now);
      left.connect(leftGain);
      right.connect(rightGain);
      left.start(now);
      right.start(now);
    }

    const addPad = (frequency: number, gainValue: number, type: OscillatorType = 'sine') => {
      const oscillator = registerSource(context.createOscillator());
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.value = gainValue;
      oscillator.connect(gain);
      gain.connect(masterGain);
      nodes.push(gain);
      oscillator.start(now);
    };

    const addFilteredNoise = (cutoff: number, gainValue: number, filterType: BiquadFilterType = 'lowpass') => {
      const noise = registerSource(context.createBufferSource());
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      noise.buffer = createNoiseBuffer(context);
      noise.loop = true;
      filter.type = filterType;
      filter.frequency.value = cutoff;
      filter.Q.value = filterType === 'bandpass' ? 0.6 : 0.35;
      gain.gain.value = gainValue;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      nodes.push(filter, gain);
      noise.start(now);
    };

    if (signal.soundProfile === 'focus') addPad(110, 0.035);

    if (signal.soundProfile === 'futuristic') {
      addPad(55, 0.026, 'triangle');
      addFilteredNoise(720, 0.018, 'bandpass');
      const pulse = registerSource(context.createOscillator());
      const pulseDepth = context.createGain();
      const pulseGain = context.createGain();
      const bed = registerSource(context.createOscillator());
      pulse.type = 'sine';
      pulse.frequency.value = 0.17;
      pulseDepth.gain.value = 0.012;
      pulseGain.gain.value = 0.018;
      bed.type = 'sine';
      bed.frequency.value = 165;
      pulse.connect(pulseDepth);
      pulseDepth.connect(pulseGain.gain);
      bed.connect(pulseGain);
      pulseGain.connect(masterGain);
      nodes.push(pulseDepth, pulseGain);
      pulse.start(now);
      bed.start(now);
    }

    if (signal.soundProfile === 'meditative') {
      addPad(110, 0.028);
      addPad(220, 0.012);
    }

    if (signal.soundProfile === 'sleep') {
      addPad(55, 0.026);
      addFilteredNoise(420, 0.022, 'lowpass');
    }

    if (signal.soundProfile === 'ritual') {
      const base = signal.pureHz ? Math.max(74, signal.pureHz / 4) : 111;
      addPad(base, 0.03);
      addPad(base * 1.5, 0.012, 'triangle');
      [3.2, 10.2, 17.2].forEach((offset, index) => {
        const chime = registerSource(context.createOscillator());
        const chimeGain = context.createGain();
        chime.type = 'sine';
        chime.frequency.value = Math.min(1700, (signal.pureHz ?? 444) * (index % 2 === 0 ? 1.5 : 2));
        chimeGain.gain.setValueAtTime(0.0001, now + offset);
        chimeGain.gain.exponentialRampToValueAtTime(0.022, now + offset + 0.05);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 1.8);
        chime.connect(chimeGain);
        chimeGain.connect(masterGain);
        nodes.push(chimeGain);
        chime.start(now + offset);
        chime.stop(now + offset + 2);
      });
    }

    sourceRefs.current = sources;
    nodeRefs.current = nodes;
  }, [ensureAudioContext, muted, signal, stopAudio, volume]);

  const playCompletionSound = useCallback(async () => {
    if (muted || completionPlayedRef.current) return;
    completionPlayedRef.current = true;
    try {
      const context = await ensureAudioContext();
      const now = context.currentTime;
      [392, 523.25, 659.25].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.0001, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.045, now + index * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1 + index * 0.08);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + index * 0.08);
        oscillator.stop(now + 1.25 + index * 0.08);
      });
    } catch {
      // Completion remains visual when audio is unavailable.
    }
  }, [ensureAudioContext, muted]);

  const completeSession = useCallback(() => {
    stopAudio(0.9);
    setStatus('completed');
    setEndAt(null);
    setRemainingSeconds(0);
    playCompletionSound();
  }, [playCompletionSound, stopAudio]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as PersistedSession;
        const savedStateId = saved.config?.stateId;
        const validState = savedStateId === 'alpha' || savedStateId === 'gamma' || savedStateId === 'theta' || savedStateId === 'delta' || savedStateId === 'abundance';
        if (validState) {
          let restoredRemaining = Math.max(0, saved.remainingSeconds || saved.config.durationMinutes * 60);
          let restoredStatus = saved.status;
          let restoredEndAt = saved.endAt;
          if (saved.status === 'running' && saved.endAt) {
            restoredRemaining = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
            if (restoredRemaining === 0) {
              restoredStatus = 'completed';
              restoredEndAt = null;
            } else {
              restoredStatus = 'paused';
              restoredEndAt = null;
            }
          }
          const restoredSignalId = saved.config.signalId && isSignalId(saved.config.signalId) ? saved.config.signalId : undefined;
          setConfig({ ...saved.config, stateId: savedStateId, signalId: restoredSignalId });
          setStatus(restoredStatus);
          setRemainingSeconds(restoredRemaining);
          setEndAt(restoredEndAt);
          setThoughts(Array.isArray(saved.thoughts) ? saved.thoughts : []);
          setVolume(typeof saved.volume === 'number' ? saved.volume : 0.22);
          setMuted(Boolean(saved.muted));
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persist();
  }, [hydrated, persist]);

  useEffect(() => {
    if (status !== 'running' || !endAt) return;
    const update = () => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next <= 0) completeSession();
    };
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [status, endAt, completeSession]);

  useEffect(() => {
    const gain = masterGainRef.current;
    const context = audioContextRef.current;
    if (!gain || !context) return;
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(muted ? 0.0001 : Math.max(0.0001, volume), now, 0.08);
  }, [muted, volume]);

  useEffect(() => {
    const interceptEnterVoyage = async (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest<HTMLButtonElement>('.builderActions .primaryButton');
      if (!button || !button.textContent?.toLowerCase().includes('enter the voyage')) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const nextConfig = readBuilderConfig();
      const nextSignal = signals[nextConfig.signalId ?? nextConfig.stateId];
      if (nextSignal.premium) {
        const allowed = await validatePremiumAccess();
        if (!allowed) {
          delete document.body.dataset[PREMIUM_SELECTION_DATASET_KEY];
          document.body.classList.remove('ev-premium-builder-selected');
          window.dispatchEvent(new CustomEvent('ev:premium-access-required', { detail: { signalId: nextSignal.id } }));
          return;
        }
      }

      const nextRemaining = nextConfig.durationMinutes * 60;
      completionPlayedRef.current = false;
      stopAudio(0.08);
      setConfig(nextConfig);
      setStatus('ready');
      setRemainingSeconds(nextRemaining);
      setEndAt(null);
      setThought('');
      setThoughts([]);
      setIsOpen(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        config: nextConfig,
        status: 'ready',
        remainingSeconds: nextRemaining,
        endAt: null,
        thoughts: [],
        volume,
        muted,
        updatedAt: Date.now()
      } satisfies PersistedSession));
    };

    document.addEventListener('click', interceptEnterVoyage, true);
    return () => document.removeEventListener('click', interceptEnterVoyage, true);
  }, [muted, stopAudio, volume]);

  useEffect(() => {
    document.body.classList.toggle('v10-session-open', isOpen);
    return () => document.body.classList.remove('v10-session-open');
  }, [isOpen]);

  useEffect(() => () => {
    stopAudio(0.08);
    audioContextRef.current?.close().catch(() => undefined);
  }, [stopAudio]);

  const startOrResume = async () => {
    if (signal.premium) {
      const allowed = await validatePremiumAccess();
      if (!allowed) {
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent('ev:premium-access-required', { detail: { signalId: signal.id } }));
        return;
      }
    }
    try {
      await startAudio();
      const nextEndAt = Date.now() + remainingSeconds * 1000;
      completionPlayedRef.current = false;
      setEndAt(nextEndAt);
      setStatus('running');
      persist({ status: 'running', endAt: nextEndAt, remainingSeconds });
    } catch {
      setStatus('paused');
    }
  };

  const pauseSession = () => {
    const nextRemaining = endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : remainingSeconds;
    stopAudio(0.4);
    setRemainingSeconds(nextRemaining);
    setEndAt(null);
    setStatus('paused');
    persist({ status: 'paused', endAt: null, remainingSeconds: nextRemaining });
  };

  const resetSession = () => {
    stopAudio(0.35);
    completionPlayedRef.current = false;
    setStatus('ready');
    setEndAt(null);
    setRemainingSeconds(totalSeconds);
    persist({ status: 'ready', endAt: null, remainingSeconds: totalSeconds });
  };

  const closeSession = () => {
    if (status === 'running') pauseSession();
    setIsOpen(false);
  };

  const endSession = () => {
    stopAudio(0.65);
    setStatus('completed');
    setEndAt(null);
    setRemainingSeconds(Math.max(0, remainingSeconds));
    playCompletionSound();
  };

  const repeatVoyage = () => {
    completionPlayedRef.current = false;
    setStatus('ready');
    setEndAt(null);
    setRemainingSeconds(totalSeconds);
    setThought('');
    setThoughts([]);
  };

  const addThought = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = thought.trim();
    if (!clean) return;
    const nextThoughts = [...thoughts, clean];
    setThoughts(nextThoughts);
    setThought('');
    setThoughtSaved(true);
    window.setTimeout(() => setThoughtSaved(false), 1600);
    persist({ thoughts: nextThoughts });
  };

  const sessionSummary = useMemo(
    () => `${config.durationMinutes} minutes · ${signal.frequency} · ${signal.state}`,
    [config.durationMinutes, signal]
  );

  if (!hydrated) return null;

  return (
    <>
      {!isOpen && status !== 'completed' && remainingSeconds < totalSeconds && (
        <button type="button" className={`v10ContinueVoyage ${signal.themeId}`} onClick={() => setIsOpen(true)}>
          Continue voyage <span>{formatTime(remainingSeconds)}</span>
        </button>
      )}

      {isOpen && (
        <div className={`v10SessionOverlay ${signal.themeId} ${status}`} role="dialog" aria-modal="true" aria-label={`${signal.state} voyage session`}>
          <div className="v10SessionAtmosphere" aria-hidden="true" />
          <div className="v10SessionParticles" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, index) => (
              <span key={index} style={{ '--particle-index': index } as React.CSSProperties} />
            ))}
          </div>

          <header className="v10SessionHeader">
            <div className="v10SessionBrand">
              <img src="/brand-infinity.png" alt="" />
              <span>Everlasting Voyage</span>
            </div>
            <button type="button" className="v10CloseSession" onClick={closeSession}>Close</button>
          </header>

          {status === 'completed' ? (
            <main className="v10Completion">
              <p className="v10SessionEyebrow">Voyage complete</p>
              <h2>The frequency is quiet.</h2>
              <p className="v10CompletionSummary">{sessionSummary}</p>
              {config.intention && (
                <div className="v10CompletionIntention"><span>Your intention</span><strong>{config.intention}</strong></div>
              )}
              {thoughts.length > 0 && (
                <div className="v10CompletionThoughts">
                  <span>Captured thoughts</span>
                  {thoughts.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}
                </div>
              )}
              <div className="v10CompletionActions">
                <button type="button" className="v10PrimaryAction" onClick={repeatVoyage}>Repeat this voyage</button>
                <button type="button" className="v10SecondaryAction" onClick={() => {
                  setIsOpen(false);
                  document.getElementById('session-builder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}>Start another state</button>
                <button type="button" className="v10TextAction" onClick={() => {
                  setIsOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>Return home</button>
              </div>
            </main>
          ) : (
            <main className="v10SessionMain">
              <section className="v10SessionIdentity">
                <span className="v10SessionEyebrow">
                  {signal.frequency} · {signal.hz}{signal.premium ? ' · Founding Member Premium' : ''}
                </span>
                <h2>{signal.state}</h2>
                <p>{config.intention || signal.purpose}</p>
              </section>

              <section className="v10TimerArea">
                <div className="v10ProgressRing" style={{ '--session-progress': `${progress * 360}deg` } as React.CSSProperties}>
                  <div className="v10TimerDisplay">{formatTime(remainingSeconds)}</div>
                  <span>{status === 'running' ? 'Frequency active' : status === 'paused' ? 'Voyage paused' : 'Ready to begin'}</span>
                </div>
                <div className="v10TimerControls">
                  {status === 'running' ? (
                    <button type="button" className="v10PrimaryAction" onClick={pauseSession}>Pause</button>
                  ) : (
                    <button type="button" className="v10PrimaryAction" onClick={startOrResume}>{status === 'paused' ? 'Resume' : 'Begin'}</button>
                  )}
                  <button type="button" className="v10SecondaryAction" onClick={resetSession}>Reset</button>
                  <button type="button" className="v10TextAction" onClick={endSession}>End session</button>
                </div>
              </section>

              <section className="v10SessionTools">
                <div className="v10AudioControls">
                  <div><span className={`v10AudioIndicator ${status === 'running' ? 'active' : ''}`} /><strong>{status === 'running' ? (signal.premium ? 'Immersive frequency playing' : 'Pure frequency playing') : (signal.premium ? 'Immersive frequency ready' : 'Pure frequency ready')}</strong></div>
                  <label>
                    <span>Volume</span>
                    <input type="range" min="0.04" max="0.42" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Session volume" />
                  </label>
                  <button type="button" onClick={() => setMuted((current) => !current)}>{muted ? 'Unmute' : 'Mute'}</button>
                </div>

                <form className="v10ThoughtCapture" onSubmit={addThought}>
                  <label htmlFor="v10-thought">Capture a thought</label>
                  <div>
                    <input id="v10-thought" value={thought} onChange={(event) => setThought(event.target.value)} placeholder="Write it down without leaving the voyage" maxLength={180} />
                    <button type="submit">{thoughtSaved ? 'Saved ✓' : 'Save'}</button>
                  </div>
                </form>

                {thoughts.length > 0 && (
                  <div className="v10ThoughtList">{thoughts.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
                )}
              </section>
            </main>
          )}

          <footer className="v10SessionFooter">
            <span>{getPremiumRecipeTechnical(signal.id) ?? signal.technical}</span>
            <span>{signal.note} · Keep volume moderate</span>
          </footer>
        </div>
      )}
    </>
  );
}
