'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import {
  getPremiumAudioRecipe,
  getPremiumRecipeTechnical,
  getPremiumSoundIdentity,
  startPremiumAudioRecipe
} from './premium-audio-engine';

type PremiumCategoryId = 'study' | 'work' | 'meditation' | 'sleep' | 'ritual';
type SoundProfile = 'clean' | 'focus' | 'futuristic' | 'meditative' | 'sleep' | 'ritual';
type FreeStateId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';

type PremiumSignal = {
  id: string;
  category: PremiumCategoryId;
  family: string;
  hz: number;
  label: string;
  purpose: string;
  description: string;
  premium: boolean;
  pure: boolean;
  soundProfile: SoundProfile;
  freeStateId?: FreeStateId;
  leftHz?: number;
  rightHz?: number;
  pureHz?: number;
};

type PremiumCategory = {
  id: PremiumCategoryId;
  title: string;
  subtitle: string;
  icon: string;
};

type CheckoutConfig = {
  displayPriceUsd: string;
  chargeCadCents: number | null;
  chargePriceCad: string | null;
  chargeCurrency: 'CAD';
  founderEndsAt: string;
  founderEndsLabel: string;
  founderAvailable: boolean;
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
  checkoutReady: boolean;
  entitlementStorageKey: string;
  pendingAttemptStorageKey: string;
};

type EntitlementSummary = {
  entitlement: 'founder-premium';
  founder: true;
  provider: 'square';
  purchasedAt: string;
  amount: number;
  currency: 'CAD';
};

type PremiumApiResponse = {
  ok?: boolean;
  valid?: boolean;
  recovered?: boolean;
  status?: string;
  code?: string;
  error?: string;
  message?: string;
  confirmedNotCharged?: boolean;
  recoverable?: boolean;
  entitlementToken?: string;
  attemptToken?: string;
  entitlement?: EntitlementSummary;
  receiptUrl?: string | null;
  chargePriceCad?: string | null;
  displayPriceUsd?: string;
};

type SquareTokenResult = {
  status: string;
  token?: string;
  errors?: Array<{ message?: string; detail?: string }>;
};

type SquareVerificationDetails = {
  amount: string;
  currencyCode: 'CAD';
  intent: 'CHARGE';
  customerInitiated: true;
  sellerKeyedIn: false;
  billingContact: Record<string, never>;
};

type SquareCardStyle = Record<string, Record<string, string>>;

type SquareCardOptions = {
  style?: SquareCardStyle;
};

type SquareCard = {
  attach(selector: string): Promise<void>;
  tokenize(details: SquareVerificationDetails): Promise<SquareTokenResult>;
  destroy(): Promise<boolean>;
};

type SquarePayments = {
  card(options?: SquareCardOptions): Promise<SquareCard>;
  setLocale?(locale: string): Promise<unknown>;
};

type SquareGlobal = {
  payments(applicationId: string, locationId: string): SquarePayments;
};

declare global {
  interface Window {
    Square?: SquareGlobal;
  }
}

const premiumCategories: PremiumCategory[] = [
  { id: 'ritual', title: 'Manifestation & Ritual', subtitle: 'Intention. Visualization. Ritual.', icon: '∞' },
  { id: 'study', title: 'Study & Memory', subtitle: 'Learn. Read. Retain.', icon: '⌁' },
  { id: 'work', title: 'Deep Work', subtitle: 'Create. Build. Achieve.', icon: '⚡' },
  { id: 'meditation', title: 'Meditation', subtitle: 'Slow down. Go inward.', icon: '◌' },
  { id: 'sleep', title: 'Sleep', subtitle: 'Disconnect. Slow down. Rest.', icon: '☾' }
];

const premiumSignals: PremiumSignal[] = [
  { id: 'alpha', category: 'study', family: 'Alpha', hz: 10, label: 'Calm Focus', purpose: 'Study, reading and steady concentration.', description: 'The free Alpha flagship for calm, sustained concentration.', premium: false, pure: false, soundProfile: 'clean', freeStateId: 'alpha', leftHz: 180, rightHz: 190 },
  { id: 'alpha-8', category: 'study', family: 'Alpha', hz: 8, label: 'Relaxed Study', purpose: 'A slower Alpha experience for relaxed reading and study.', description: 'Clean binaural signal with a restrained, distraction-free presentation.', premium: true, pure: false, soundProfile: 'clean', leftHz: 180, rightHz: 188 },
  { id: 'alpha-12', category: 'study', family: 'Alpha', hz: 12, label: 'Memory Retention', purpose: 'A luminous study environment for focused review and information retention.', description: 'Luminous pad, glass harmonics and restrained melodic detail around a precise 12 Hz foundation.', premium: true, pure: false, soundProfile: 'focus', leftHz: 256, rightHz: 268 },
  { id: 'smr-14', category: 'study', family: 'SMR', hz: 14, label: 'Steady Attention', purpose: 'A steady-attention signal with an extremely subtle support layer.', description: 'Minimal binaural signal with a quiet tonal bed beneath the main signal.', premium: true, pure: false, soundProfile: 'focus', leftHz: 180, rightHz: 194 },
  { id: 'beta-18', category: 'study', family: 'Beta', hz: 18, label: 'Learning Momentum', purpose: 'Positive forward energy for active study, productive review and sustained learning.', description: 'Luminous harmony, crystalline detail and gentle forward motion around a precise 18 Hz foundation.', premium: true, pure: false, soundProfile: 'focus', leftHz: 216, rightHz: 234 },

  { id: 'alpha-7', category: 'study', family: 'Alpha', hz: 7, label: 'Recall Spark', purpose: 'A bright review environment with crystalline detail and spacious, low-pressure clarity.', description: 'Luminous pad, glass detail and a gentle recall motif around a precise 7 Hz foundation.', premium: true, pure: false, soundProfile: 'focus', leftHz: 224, rightHz: 231 },
  { id: 'beta-22', category: 'study', family: 'Beta', hz: 22, label: 'Knowledge Flow', purpose: 'A smooth extended-learning atmosphere for long reading, practice and connected thinking.', description: 'Flowing harmony, soft pulse and melodic movement around a precise 22 Hz foundation.', premium: true, pure: false, soundProfile: 'focus', leftHz: 330, rightHz: 352 },

  { id: 'gamma', category: 'work', family: 'Gamma', hz: 40, label: 'Gamma Clarity', purpose: 'Demanding work, research and high-attention sessions.', description: 'The free Gamma flagship for demanding clarity and high-attention sessions.', premium: false, pure: false, soundProfile: 'clean', freeStateId: 'gamma', leftHz: 220, rightHz: 260 },
  { id: 'beta-15', category: 'work', family: 'Beta', hz: 15, label: 'Precision Mode', purpose: 'A clean, minimal frequency for structured precision work.', description: 'Minimal binaural presentation with no distracting sound bed.', premium: true, pure: false, soundProfile: 'clean', leftHz: 200, rightHz: 215 },
  { id: 'beta-20', category: 'work', family: 'Beta', hz: 20, label: 'Peak Attention', purpose: 'A bright futuristic focus environment built for high-attention sessions.', description: 'Wide futuristic pad, crystalline accents and spatial motion around a precise 20 Hz foundation.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 300, rightHz: 320 },
  { id: 'gamma-30', category: 'work', family: 'Gamma', hz: 30, label: 'Creative Spark', purpose: 'A futuristic Gamma experience for creative production.', description: 'Binaural signal with a low synthetic pad and gentle stereo movement.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 200, rightHz: 230 },
  { id: 'gamma-35', category: 'work', family: 'Gamma', hz: 35, label: 'Peak Focus', purpose: 'A polished Gamma experience for clear, sustained high-performance focus.', description: 'Luminous Gamma atmosphere with a clean pad, supportive drone and restrained tonal movement.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 280, rightHz: 315 },

  { id: 'beta-25', category: 'work', family: 'Beta', hz: 25, label: 'Productive Rhythm', purpose: 'A forward, balanced work atmosphere for sustained output without an aggressive edge.', description: 'Bright pad, gentle rhythmic motion and positive work energy around a precise 25 Hz foundation.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 205, rightHz: 230 },
  { id: 'gamma-45', category: 'work', family: 'Gamma', hz: 45, label: 'Clear Purpose', purpose: 'A bright, expansive work environment for deliberate high-attention sessions.', description: 'Radiant high-Gamma atmosphere with polished harmonics, crystal detail and controlled motion.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 360, rightHz: 405 },

  { id: 'theta', category: 'meditation', family: 'Theta', hz: 4, label: 'Reflective Space', purpose: 'Writing, reflection, meditation and ideation.', description: 'The free Theta flagship for reflective and meditative sessions.', premium: false, pure: false, soundProfile: 'clean', freeStateId: 'theta', leftHz: 95, rightHz: 99 },
  { id: 'theta-5', category: 'meditation', family: 'Theta', hz: 5, label: 'Inner Stillness', purpose: 'A soft inward signal with a quiet atmospheric pad.', description: 'Binaural signal supported by a warm, spacious tonal bed.', premium: true, pure: false, soundProfile: 'meditative', leftHz: 95, rightHz: 100 },
  { id: 'theta-6', category: 'meditation', family: 'Theta', hz: 6, label: 'Deep Meditation', purpose: 'A spacious meditative experience with slow harmonic movement.', description: 'Binaural signal with soft harmonics and a wide, calm atmosphere.', premium: true, pure: false, soundProfile: 'meditative', leftHz: 95, rightHz: 101 },
  { id: 'theta-7', category: 'meditation', family: 'Theta', hz: 7, label: 'Mindful Awareness', purpose: 'A gentle Theta signal with light airy movement.', description: 'Binaural signal with a quiet, breathable ambient texture.', premium: true, pure: false, soundProfile: 'meditative', leftHz: 95, rightHz: 102 },
  { id: 'alpha-9', category: 'meditation', family: 'Alpha', hz: 9, label: 'Calm Presence', purpose: 'A mostly clean Alpha experience for calm presence.', description: 'Simple binaural presentation with minimal added texture.', premium: true, pure: false, soundProfile: 'clean', leftHz: 180, rightHz: 189 },

  { id: 'theta-3-5', category: 'meditation', family: 'Theta', hz: 3.5, label: 'Inner Light', purpose: 'A bright, gentle inward atmosphere for reflective meditation and spacious stillness.', description: 'Luminous pad, airy vowel color and soft resonant detail around a precise 3.5 Hz foundation.', premium: true, pure: false, soundProfile: 'meditative', leftHz: 108, rightHz: 111.5 },
  { id: 'alpha-10-5', category: 'meditation', family: 'Alpha', hz: 10.5, label: 'Serene Expansion', purpose: 'A spacious, peaceful meditation environment with airy vocal color and slow harmonic expansion.', description: 'Wide celestial harmony, warm vowel texture and gentle breathing motion around a 10.5 Hz foundation.', premium: true, pure: false, soundProfile: 'meditative', leftHz: 240, rightHz: 250.5 },

  { id: 'delta', category: 'sleep', family: 'Delta', hz: 2, label: 'Deep Rest', purpose: 'Wind-down rituals, recovery and sleep preparation.', description: 'The free Delta flagship for quiet nighttime sessions.', premium: false, pure: false, soundProfile: 'clean', freeStateId: 'delta', leftHz: 70, rightHz: 72 },
  { id: 'delta-1', category: 'sleep', family: 'Delta', hz: 1, label: 'Warm Rest', purpose: 'A very slow Delta frequency with a deep warm ambience.', description: 'Binaural signal with a soft low atmosphere and no sudden movement.', premium: true, pure: false, soundProfile: 'sleep', leftHz: 70, rightHz: 71 },
  { id: 'delta-1-5', category: 'sleep', family: 'Delta', hz: 1.5, label: 'Night Drift', purpose: 'A clean low-frequency difference for quiet nighttime listening.', description: 'A deliberately simple binaural signal with no added effects.', premium: true, pure: false, soundProfile: 'clean', leftHz: 70, rightHz: 71.5 },
  { id: 'delta-2-5', category: 'sleep', family: 'Delta', hz: 2.5, label: 'Sleep Serenity', purpose: 'A soft Delta experience with gentle filtered air and a peaceful tonal bed.', description: 'A warm, serene sleep atmosphere with smooth low-motion texture.', premium: true, pure: false, soundProfile: 'sleep', leftHz: 70, rightHz: 72.5 },
  { id: 'delta-3', category: 'sleep', family: 'Delta', hz: 3, label: 'Sleep Preparation', purpose: 'A gentle nighttime frequency with a soft warm atmosphere.', description: 'Binaural signal with a warm low pad intended to stay unobtrusive.', premium: true, pure: false, soundProfile: 'sleep', leftHz: 70, rightHz: 73 },

  { id: 'delta-0-8', category: 'sleep', family: 'Delta', hz: 0.8, label: 'Moonlit Ease', purpose: 'A soft, safe nighttime atmosphere with slow air, gentle warmth and minimal movement.', description: 'Warm pad, soft night air and a very slow 0.8 Hz foundation for quiet rest.', premium: true, pure: false, soundProfile: 'sleep', leftHz: 64, rightHz: 64.8 },
  { id: 'theta-3-8', category: 'sleep', family: 'Theta', hz: 3.8, label: 'Quiet Horizon', purpose: 'A peaceful, slightly brighter nighttime field for easing into sustained rest.', description: 'Soft harmonic horizon, filtered air and subtle environmental texture around a 3.8 Hz foundation.', premium: true, pure: false, soundProfile: 'sleep', leftHz: 172, rightHz: 175.8 },

  { id: 'abundance', category: 'ritual', family: 'Pure Tone', hz: 888, label: 'Abundance', purpose: 'Visualization, intention and ceremonial sessions.', description: 'The free 888 Hz pure-tone flagship, presented cleanly.', premium: false, pure: true, soundProfile: 'clean', freeStateId: 'abundance', pureHz: 888 },
  { id: 'pure-222', category: 'ritual', family: 'Pure Tone', hz: 222, label: 'Alignment', purpose: 'A warm ritual listening space for intention and visualization.', description: 'Pure tone with a soft shimmer, distant airy chime and gentle pad.', premium: true, pure: true, soundProfile: 'ritual', pureHz: 222 },
  { id: 'pure-444', category: 'ritual', family: 'Pure Tone', hz: 444, label: 'Grounded Intention', purpose: 'A grounded ceremonial listening experience.', description: 'Pure tone with a deep low drone, subtle metallic shimmer and slow pulse.', premium: true, pure: true, soundProfile: 'ritual', pureHz: 444 },
  { id: 'pure-528', category: 'ritual', family: 'Pure Tone', hz: 528, label: 'Renewal', purpose: 'A warm, expansive ritual listening experience.', description: 'Pure tone with a luminous pad, soft harmonic swell and sparse chime accents.', premium: true, pure: true, soundProfile: 'ritual', pureHz: 528 },
  { id: 'pure-963', category: 'ritual', family: 'Pure Tone', hz: 963, label: 'Higher Awareness', purpose: 'A celestial ritual listening space for reflection and intention.', description: 'Pure tone with a very soft high shimmer, wide pad and slow atmospheric movement.', premium: true, pure: true, soundProfile: 'ritual', pureHz: 963 },
  { id: 'ritual-639', category: 'ritual', family: 'Ritual Frequency', hz: 639, label: 'Solar Harmony', purpose: 'A warm ceremonial atmosphere for intention, visualization and expansive ritual listening.', description: 'Exact 639 Hz foundation with a luminous pad, original vowel color, golden bells and spacious harmonic movement.', premium: true, pure: false, soundProfile: 'ritual', pureHz: 639 },
  { id: 'ritual-741', category: 'ritual', family: 'Ritual Frequency', hz: 741, label: 'Celestial Radiance', purpose: 'A bright ritual atmosphere with airy vocal color, crystalline detail and spacious movement.', description: 'Exact 741 Hz foundation with celestial glass, original vowel texture and crystalline ritual accents.', premium: true, pure: false, soundProfile: 'ritual', pureHz: 741 },
];

const premiumSignalCount = premiumSignals.filter((signal) => signal.premium).length;
const totalSignalCount = premiumSignals.length;
const premiumCollectionCount = premiumCategories.length;
const previewDurationSeconds = 24;
const FALLBACK_ENTITLEMENT_KEY = 'ev-premium-entitlement';
const FALLBACK_PENDING_KEY = 'ev-premium-pending-attempt';

function customerFrequencyCopy(value: string) {
  return value.replace(/\bsignals\b/gi, 'frequencies').replace(/\bsignal\b/gi, 'frequency');
}

function getCustomerAudioType(signal: PremiumSignal) {
  if (signal.pure) return 'Pure Tone';
  if (getPremiumAudioRecipe(signal.id)) return 'Immersive Frequency';
  return 'Clean Frequency';
}

function createNoiseBuffer(context: AudioContext, seconds = 2) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
}

function formatCadCents(cents: number | null) {
  return cents ? `CA$${(cents / 100).toFixed(2)} CAD` : 'CAD charge not configured';
}

async function premiumPost(payload: Record<string, unknown>): Promise<PremiumApiResponse> {
  const response = await fetch('/api/premium', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({ ok: false, error: 'Invalid server response.' })) as PremiumApiResponse;
  if (!response.ok && !data.error) data.error = 'The request could not be completed.';
  return data;
}

function squareCspContent(environment: 'sandbox' | 'production') {
  if (environment === 'production') {
    return [
      "default-src 'self'",
      "script-src 'self' https://web.squarecdn.com",
      "frame-src 'self' https://web.squarecdn.com",
      "connect-src 'self' https://web.squarecdn.com https://pci-connect.squareup.com https://o160250.ingest.sentry.io",
      "style-src 'self' 'unsafe-inline' https://web.squarecdn.com",
      "font-src 'self' data: https://square-fonts-production-f.squarecdn.com https://d1g145x70srn7h.cloudfront.net",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
  }
  return [
    "default-src 'self'",
    "script-src 'self' https://sandbox.web.squarecdn.com",
    "frame-src 'self' https://sandbox.web.squarecdn.com",
    "connect-src 'self' https://sandbox.web.squarecdn.com https://pci-connect.squareupsandbox.com https://o160250.ingest.sentry.io",
    "style-src 'self' 'unsafe-inline' https://sandbox.web.squarecdn.com",
    "font-src 'self' data: https://square-fonts-production-f.squarecdn.com https://d1g145x70srn7h.cloudfront.net",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');
}

function ensureSquareCsp(environment: 'sandbox' | 'production') {
  let meta = document.querySelector<HTMLMetaElement>('meta[data-ev-square-csp]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.dataset.evSquareCsp = 'true';
    document.head.appendChild(meta);
  }
  meta.content = squareCspContent(environment);
}

function loadSquareScript(environment: 'sandbox' | 'production') {
  return new Promise<void>((resolve, reject) => {
    if (window.Square) {
      resolve();
      return;
    }
    const src = environment === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';
    const existing = document.querySelector<HTMLScriptElement>('script[data-ev-square-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Square SDK could not load.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.evSquareSdk = environment;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Square SDK could not load.')), { once: true });
    document.head.appendChild(script);
  });
}

export default function V10ProductFlow() {
  const pathname = usePathname();
  const active = pathname === '/voyage';
  const [premiumMount, setPremiumMount] = useState<HTMLElement | null>(null);
  const [builderPremiumMount, setBuilderPremiumMount] = useState<HTMLElement | null>(null);
  const [aboutMount, setAboutMount] = useState<HTMLElement | null>(null);
  const [footerMount, setFooterMount] = useState<HTMLElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PremiumCategoryId>('ritual');
  const [previewSignal, setPreviewSignal] = useState<PremiumSignal | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewSeconds, setPreviewSeconds] = useState(previewDurationSeconds);
  const [previewMessage, setPreviewMessage] = useState('');
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfig | null>(null);
  const [premiumState, setPremiumState] = useState<'checking' | 'free' | 'premium'>('checking');
  const [selectedPremiumSignal, setSelectedPremiumSignal] = useState<PremiumSignal | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'form' | 'processing' | 'success' | 'recovery' | 'restore'>('form');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [restoreCode, setRestoreCode] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [cardReady, setCardReady] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy recovery code');
  const audioCleanupRef = useRef<(() => void) | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const previewTickRef = useRef<number | null>(null);
  const squareCardRef = useRef<SquareCard | null>(null);
  const checkoutTargetRef = useRef<PremiumSignal | null>(null);

  const categorySignals = useMemo(
    () => premiumSignals.filter((signal) => signal.category === selectedCategory),
    [selectedCategory]
  );

  const entitlementKey = checkoutConfig?.entitlementStorageKey || FALLBACK_ENTITLEMENT_KEY;
  const pendingKey = checkoutConfig?.pendingAttemptStorageKey || FALLBACK_PENDING_KEY;
  const founderPriceLabel = checkoutConfig?.displayPriceUsd || 'US$9.99';
  const founderOfferOpen = checkoutConfig?.founderAvailable !== false;
  const founderChargeLabel = checkoutConfig?.chargePriceCad || formatCadCents(checkoutConfig?.chargeCadCents ?? null);
  const founderChargeActionLabel = checkoutConfig?.chargePriceCad ? founderChargeLabel.replace(/\s+CAD$/i, '') : '';

  const stopPreview = useCallback(() => {
    audioCleanupRef.current?.();
    audioCleanupRef.current = null;
    if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    if (previewTickRef.current) window.clearInterval(previewTickRef.current);
    previewTimerRef.current = null;
    previewTickRef.current = null;
    setPreviewing(false);
    setPreviewSeconds(previewDurationSeconds);
  }, []);

  const startPreview = useCallback(async (signal: PremiumSignal) => {
    if (document.body.classList.contains('v10-session-open')) {
      setPreviewMessage('End or close the active Voyage before previewing another frequency.');
      return;
    }
    stopPreview();
    setPreviewMessage('');
    try {
      const AudioContextClass = window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio unavailable');
      const context = new AudioContextClass();
      if (context.state === 'suspended') await context.resume();
      const now = context.currentTime;
      const master = context.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.105, now + 0.7);
      master.connect(context.destination);

      // V12.5: non-Ritual Premium previews use the same canonical recipe as the full Voyage.
      // Manifestation & Ritual deliberately stays on the approved legacy path below.
      const premiumRecipe = signal.premium ? getPremiumAudioRecipe(signal.id) : null;
      if (premiumRecipe) {
        const premiumHandle = await startPremiumAudioRecipe(context, master, signal.id, { mode: 'immersive', preview: true });
        audioCleanupRef.current = () => {
          premiumHandle.stop(0.18);
          window.setTimeout(() => context.close().catch(() => undefined), 240);
        };
        setPreviewing(true);
        setPreviewSeconds(previewDurationSeconds);
        previewTickRef.current = window.setInterval(() => setPreviewSeconds((current) => Math.max(0, current - 1)), 1000);
        previewTimerRef.current = window.setTimeout(stopPreview, previewDurationSeconds * 1000);
        return;
      }

      const sources: AudioScheduledSourceNode[] = [];
      const nodes: AudioNode[] = [master];
      const registerSource = <T extends AudioScheduledSourceNode>(source: T) => {
        sources.push(source);
        nodes.push(source);
        return source;
      };

      if (signal.pure && signal.pureHz) {
        const oscillator = registerSource(context.createOscillator());
        const signalGain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(signal.pureHz, now);
        signalGain.gain.value = 0.72;
        oscillator.connect(signalGain);
        signalGain.connect(master);
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
        merger.connect(master);
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
        gain.connect(master);
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
        gain.connect(master);
        nodes.push(filter, gain);
        noise.start(now);
      };

      if (signal.soundProfile === 'focus') addPad(110, 0.035);
      if (signal.soundProfile === 'futuristic') {
        addPad(55, 0.026, 'triangle');
        addFilteredNoise(720, 0.018, 'bandpass');
        const pulse = registerSource(context.createOscillator());
        const pulseGain = context.createGain();
        const pulseDepth = context.createGain();
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
        pulseGain.connect(master);
        nodes.push(pulseGain, pulseDepth);
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
          chimeGain.connect(master);
          nodes.push(chimeGain);
          chime.start(now + offset);
          chime.stop(now + offset + 2);
        });
      }

      audioCleanupRef.current = () => {
        const stopAt = context.currentTime;
        try {
          master.gain.cancelScheduledValues(stopAt);
          master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), stopAt);
          master.gain.exponentialRampToValueAtTime(0.0001, stopAt + 0.18);
        } catch { /* audio may already be closing */ }
        window.setTimeout(() => {
          sources.forEach((source) => { try { source.stop(); } catch { /* stopped */ } });
          nodes.forEach((node) => { try { node.disconnect(); } catch { /* disconnected */ } });
          context.close().catch(() => undefined);
        }, 220);
      };
      setPreviewing(true);
      setPreviewSeconds(previewDurationSeconds);
      previewTickRef.current = window.setInterval(() => setPreviewSeconds((current) => Math.max(0, current - 1)), 1000);
      previewTimerRef.current = window.setTimeout(stopPreview, previewDurationSeconds * 1000);
    } catch {
      stopPreview();
      setPreviewMessage('This browser could not start the audio preview. Try again after interacting with the page.');
    }
  }, [stopPreview]);

  const closePreview = useCallback(() => {
    stopPreview();
    setPreviewSignal(null);
    setPreviewMessage('');
  }, [stopPreview]);

  const clearPremiumSelection = useCallback(() => {
    setSelectedPremiumSignal(null);
    delete document.body.dataset.evPremiumSignal;
    document.body.classList.remove('ev-premium-builder-selected');
  }, []);

  const usePremiumSignal = useCallback((signal: PremiumSignal) => {
    if (!signal.premium || premiumState !== 'premium') return;
    stopPreview();
    setPreviewSignal(null);
    setSelectedPremiumSignal(signal);
    document.body.dataset.evPremiumSignal = signal.id;
    document.body.classList.add('ev-premium-builder-selected');
    document.getElementById('session-builder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [premiumState, stopPreview]);

  const openSignal = (signal: PremiumSignal) => {
    stopPreview();
    setPreviewMessage('');
    if (!signal.premium && signal.freeStateId) {
      clearPremiumSelection();
      document.querySelector<HTMLButtonElement>(`.stateChoice.${signal.freeStateId}`)?.click();
      document.getElementById('session-builder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (premiumState === 'premium') {
      usePremiumSignal(signal);
      return;
    }
    setPreviewSignal(signal);
  };

  const explorePremium = () => document.getElementById('ev-premium-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const destroySquareCard = useCallback(async () => {
    const card = squareCardRef.current;
    squareCardRef.current = null;
    setCardReady(false);
    if (card) {
      try { await card.destroy(); } catch { /* already destroyed */ }
    }
  }, []);

  const closeCheckout = useCallback(() => {
    if (checkoutStatus === 'processing') return;
    destroySquareCard();
    setCheckoutOpen(false);
    setCheckoutStatus('form');
    setCheckoutMessage('');
    setRestoreCode('');
  }, [checkoutStatus, destroySquareCard]);

  const applyEntitlement = useCallback((data: PremiumApiResponse, showSuccess = false) => {
    if (!data.entitlementToken) return false;
    localStorage.setItem(entitlementKey, data.entitlementToken);
    localStorage.removeItem(pendingKey);
    setRecoveryCode(data.entitlementToken);
    setPremiumState('premium');
    setReceiptUrl(data.receiptUrl || '');
    if (showSuccess) {
      setCheckoutOpen(true);
      setCheckoutStatus('success');
      setCheckoutMessage('');
    }
    return true;
  }, [entitlementKey, pendingKey]);

  const recoverPendingAttempt = useCallback(async (attemptToken: string, showUi: boolean) => {
    if (showUi) {
      setCheckoutOpen(true);
      setCheckoutStatus('recovery');
      setCheckoutMessage('Checking the last Square payment before allowing another charge…');
    }
    try {
      const data = await premiumPost({ action: 'recover', attemptToken });
      if (data.recovered && data.entitlementToken) {
        applyEntitlement(data, showUi);
        return 'completed' as const;
      }
      if (data.confirmedNotCharged || data.status === 'failed' || data.status === 'canceled') {
        localStorage.removeItem(pendingKey);
        if (showUi) {
          setCheckoutMessage(data.message || 'Square confirms the previous payment was not completed. You can start a new checkout.');
        }
        return 'safe' as const;
      }
      if (showUi) setCheckoutMessage(data.message || data.error || 'The previous payment is not confirmed yet. Check again before trying another payment.');
      return 'unknown' as const;
    } catch {
      if (showUi) setCheckoutMessage('Payment recovery is temporarily unavailable. Do not submit another payment until the status is confirmed.');
      return 'unknown' as const;
    }
  }, [applyEntitlement, pendingKey]);

  const startCheckout = useCallback(async (target?: PremiumSignal | null) => {
    if (document.body.classList.contains('v10-session-open')) {
      setPreviewMessage('End or close the active Voyage before opening checkout.');
      return;
    }
    stopPreview();
    if (target?.premium) checkoutTargetRef.current = target;
    setPreviewSignal(null);
    setCheckoutMessage('');

    const pending = localStorage.getItem(pendingKey) || '';
    if (pending) {
      const outcome = await recoverPendingAttempt(pending, true);
      if (outcome !== 'safe') return;
      setCheckoutMessage('');
    }

    setCheckoutOpen(true);
    setCheckoutStatus('form');
  }, [pendingKey, recoverPendingAttempt, stopPreview]);

  const restorePremium = useCallback(async () => {
    const token = restoreCode.trim();
    if (!token) {
      setCheckoutMessage('Paste your Founder Recovery Code first.');
      return;
    }
    setCheckoutMessage('Validating Founder access…');
    try {
      const data = await premiumPost({ action: 'restore', token });
      if (data.valid && data.entitlementToken) {
        applyEntitlement(data, true);
        return;
      }
      setCheckoutMessage('That recovery code is not valid. Check that the complete code was copied.');
    } catch {
      setCheckoutMessage('Founder access could not be restored right now. Try again shortly.');
    }
  }, [applyEntitlement, restoreCode]);

  const processPayment = useCallback(async () => {
    if (!squareCardRef.current || !checkoutConfig?.chargeCadCents || !checkoutConfig.checkoutReady) {
      setCheckoutMessage('Square checkout is not ready yet.');
      return;
    }
    if (checkoutStatus === 'processing') return;
    setCheckoutStatus('processing');
    setCheckoutMessage('Securing your Founder payment…');

    try {
      const verificationDetails: SquareVerificationDetails = {
        amount: (checkoutConfig.chargeCadCents / 100).toFixed(2),
        currencyCode: 'CAD',
        intent: 'CHARGE',
        customerInitiated: true,
        sellerKeyedIn: false,
        billingContact: {}
      };
      const tokenResult = await squareCardRef.current.tokenize(verificationDetails);
      if (tokenResult.status !== 'OK' || !tokenResult.token) {
        setCheckoutStatus('form');
        setCheckoutMessage(tokenResult.errors?.[0]?.message || 'Check the card details and try again.');
        return;
      }

      const begin = await premiumPost({ action: 'begin-purchase' });
      if (!begin.ok || !begin.attemptToken) {
        setCheckoutStatus('form');
        setCheckoutMessage(begin.error || 'Founder checkout could not start.');
        return;
      }
      localStorage.setItem(pendingKey, begin.attemptToken);

      const result = await premiumPost({ action: 'purchase', sourceId: tokenResult.token, attemptToken: begin.attemptToken });
      if (result.ok && result.status === 'completed' && result.entitlementToken) {
        applyEntitlement(result, true);
        await destroySquareCard();
        return;
      }
      if (result.confirmedNotCharged) {
        localStorage.removeItem(pendingKey);
        setCheckoutStatus('form');
        setCheckoutMessage(result.error || 'The payment was not completed. You can safely try again.');
        return;
      }
      setCheckoutStatus('recovery');
      setCheckoutMessage(result.error || 'We could not confirm the final payment state. Check this payment before trying again.');
    } catch {
      setCheckoutStatus('recovery');
      setCheckoutMessage('We could not confirm the payment response. Check this payment before trying again.');
    }
  }, [applyEntitlement, checkoutConfig, checkoutStatus, destroySquareCard, pendingKey]);

  const copyRecoveryCode = useCallback(async () => {
    if (!recoveryCode) return;
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopyLabel('Copied ✓');
      window.setTimeout(() => setCopyLabel('Copy recovery code'), 1800);
    } catch {
      setCopyLabel('Select and copy the code');
    }
  }, [recoveryCode]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const boot = async () => {
      try {
        const response = await fetch('/api/premium', { cache: 'no-store' });
        const config = await response.json() as CheckoutConfig;
        if (cancelled) return;
        setCheckoutConfig(config);
        ensureSquareCsp(config.environment);
        const savedToken = localStorage.getItem(config.entitlementStorageKey || FALLBACK_ENTITLEMENT_KEY) || '';
        const validation = await premiumPost({ action: 'validate', token: savedToken });
        if (cancelled) return;
        if (validation.valid && validation.entitlementToken) {
          localStorage.setItem(config.entitlementStorageKey || FALLBACK_ENTITLEMENT_KEY, validation.entitlementToken);
          setRecoveryCode(validation.entitlementToken);
          setPremiumState('premium');
          return;
        }
        if (savedToken) localStorage.removeItem(config.entitlementStorageKey || FALLBACK_ENTITLEMENT_KEY);
        setPremiumState('free');
        const pending = localStorage.getItem(config.pendingAttemptStorageKey || FALLBACK_PENDING_KEY) || '';
        if (pending) await recoverPendingAttempt(pending, false);
      } catch {
        if (!cancelled) setPremiumState('free');
      }
    };
    boot();
    return () => { cancelled = true; };
  }, [active, recoverPendingAttempt]);

  useEffect(() => {
    if (!checkoutOpen || premiumState === 'premium' || checkoutStatus === 'success' || checkoutStatus === 'restore' || checkoutStatus === 'recovery') {
      destroySquareCard();
      return;
    }
    if (checkoutStatus === 'processing') return;
    if (checkoutStatus !== 'form') return;
    if (squareCardRef.current) {
      setCardReady(true);
      return;
    }
    if (!checkoutConfig?.checkoutReady || !checkoutConfig.applicationId || !checkoutConfig.locationId || !checkoutConfig.chargeCadCents) return;
    let cancelled = false;
    const initialize = async () => {
      try {
        if (!window.isSecureContext) throw new Error('Secure checkout requires HTTPS.');
        ensureSquareCsp(checkoutConfig.environment);
        await loadSquareScript(checkoutConfig.environment);
        if (cancelled || !window.Square) return;
        const payments = window.Square.payments(checkoutConfig.applicationId, checkoutConfig.locationId);
        if (payments.setLocale) await payments.setLocale('en-CA');
        const card = await payments.card({
          style: {
            '.message-text': { color: '#cfe7f7' },
            '.message-icon': { color: '#88dcff' },
            '.message-text.is-error': { color: '#ffb7c0' },
            '.message-icon.is-error': { color: '#ff9eaa' }
          }
        });
        if (cancelled) {
          await card.destroy();
          return;
        }
        await card.attach('#ev-square-card');
        squareCardRef.current = card;
        setCardReady(true);
        setCheckoutMessage('');
      } catch (error) {
        setCardReady(false);
        setCheckoutMessage(error instanceof Error ? error.message : 'Secure Square checkout could not load.');
      }
    };
    const timer = window.setTimeout(initialize, 30);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [checkoutConfig, checkoutOpen, checkoutStatus, destroySquareCard, premiumState]);

  useEffect(() => {
    const overlayOpen = checkoutOpen || Boolean(previewSignal);
    if (!overlayOpen) return;

    const body = document.body;
    const html = document.documentElement;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const bodySnapshot = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      overscrollBehavior: body.style.overscrollBehavior,
      paddingRight: body.style.paddingRight
    };
    const htmlSnapshot = {
      overflow: html.style.overflow,
      overscrollBehavior: html.style.overscrollBehavior,
      scrollBehavior: html.style.scrollBehavior
    };
    const scrollbarGap = Math.max(0, window.innerWidth - html.clientWidth);
    const currentPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

    body.classList.add('ev-modal-open');
    html.classList.add('ev-modal-open');
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    if (scrollbarGap > 0) body.style.paddingRight = `${currentPaddingRight + scrollbarGap}px`;
    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';

    return () => {
      body.classList.remove('ev-modal-open');
      html.classList.remove('ev-modal-open');
      body.style.position = bodySnapshot.position;
      body.style.top = bodySnapshot.top;
      body.style.left = bodySnapshot.left;
      body.style.right = bodySnapshot.right;
      body.style.width = bodySnapshot.width;
      body.style.overflow = bodySnapshot.overflow;
      body.style.overscrollBehavior = bodySnapshot.overscrollBehavior;
      body.style.paddingRight = bodySnapshot.paddingRight;
      html.style.overflow = htmlSnapshot.overflow;
      html.style.overscrollBehavior = htmlSnapshot.overscrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(scrollX, scrollY);
      html.style.scrollBehavior = htmlSnapshot.scrollBehavior;
    };
  }, [checkoutOpen, previewSignal]);

  useEffect(() => {
    document.body.classList.toggle('ev-product-route', active);
    if (!active) return () => document.body.classList.remove('ev-product-route');

    const hero = document.querySelector<HTMLElement>('.heroSection');
    const join = document.querySelector<HTMLElement>('.joinSection');
    const builder = document.getElementById('session-builder');
    if (!join) return;
    join.hidden = true;

    const premiumRoot = document.createElement('div');
    premiumRoot.id = 'ev-premium-root';
    if (hero) hero.insertAdjacentElement('afterend', premiumRoot);
    else join.insertAdjacentElement('beforebegin', premiumRoot);

    const premiumBuilderRoot = document.createElement('div');
    premiumBuilderRoot.id = 'ev-premium-builder-root';
    const selectedSummary = builder?.querySelector('.selectedSummary');
    if (selectedSummary) selectedSummary.insertAdjacentElement('beforebegin', premiumBuilderRoot);
    else builder?.appendChild(premiumBuilderRoot);

    const aboutRoot = document.createElement('div');
    aboutRoot.id = 'ev-about-root';
    join.insertAdjacentElement('beforebegin', aboutRoot);

    const footerRoot = document.createElement('div');
    footerRoot.id = 'ev-footer-root';
    join.insertAdjacentElement('afterend', footerRoot);

    setPremiumMount(premiumRoot);
    setBuilderPremiumMount(premiumBuilderRoot);
    setAboutMount(aboutRoot);
    setFooterMount(footerRoot);

    const handlePageClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('.builderActions .primaryButton')) stopPreview();
      if (target?.closest('.stateChoice')) clearPremiumSelection();
    };
    const handleAccessRequired = (event: Event) => {
      const signalId = (event as CustomEvent<{ signalId?: string }>).detail?.signalId || '';
      const signal = premiumSignals.find((item) => item.id === signalId && item.premium) || null;
      startCheckout(signal);
    };
    document.addEventListener('click', handlePageClick, true);
    window.addEventListener('ev:premium-access-required', handleAccessRequired);

    return () => {
      document.removeEventListener('click', handlePageClick, true);
      window.removeEventListener('ev:premium-access-required', handleAccessRequired);
      document.body.classList.remove('ev-product-route', 'ev-premium-builder-selected');
      delete document.body.dataset.evPremiumSignal;
      stopPreview();
      destroySquareCard();
      premiumRoot.remove();
      premiumBuilderRoot.remove();
      aboutRoot.remove();
      footerRoot.remove();
      join.hidden = false;
      setPremiumMount(null);
      setBuilderPremiumMount(null);
      setAboutMount(null);
      setFooterMount(null);
    };
  }, [active, clearPremiumSelection, destroySquareCard, startCheckout, stopPreview]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (checkoutOpen) closeCheckout();
        else if (previewSignal) closePreview();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [checkoutOpen, closeCheckout, closePreview, previewSignal]);

  useEffect(() => () => stopPreview(), [stopPreview]);

  if (!active) return null;

  return (
    <>
      {builderPremiumMount && selectedPremiumSignal && createPortal(
        <div className={`evPremiumBuilderSelection ${selectedPremiumSignal.soundProfile}`} role="status">
          <div>
            <span>Premium frequency selected · Founding Member</span>
            <strong>{selectedPremiumSignal.family} · {selectedPremiumSignal.hz} Hz</strong>
            <p>{selectedPremiumSignal.label} — {customerFrequencyCopy(selectedPremiumSignal.purpose)}</p>
          </div>
          <button type="button" onClick={clearPremiumSelection}>Use a free frequency instead</button>
        </div>, builderPremiumMount
      )}

      {premiumMount && createPortal(
        <>
          <section className="evPremiumLaunch section" aria-labelledby="ev-premium-title">
            <article className={`evPremiumShowcase ${premiumState === 'premium' ? 'activeMember' : ''}`}>
              <div className="evPremiumGlow evPremiumGlowOne" aria-hidden="true" />
              <div className="evPremiumGlow evPremiumGlowTwo" aria-hidden="true" />
              <div className="evPremiumShowcaseCopy">
                <div className="evPremiumKickerRow">
                  <span className="evPremiumKicker">Everlasting Premium</span>
                  <span className="evFounderBadge">{premiumState === 'premium' ? 'Founding Member' : 'Founder access · through Aug 31'}</span>
                </div>
                <h2 id="ev-premium-title">{premiumState === 'premium' ? 'Premium is active. Your full frequency library is open.' : 'Your Voyage is unlimited. Premium lets you go deeper.'}</h2>
                <p>{premiumState === 'premium' ? `All ${premiumSignalCount} Premium frequencies are ready for full Voyages across five collections.` : `Unlock ${premiumSignalCount} additional Premium frequencies across Study, Deep Work, Meditation, Sleep and Ritual — including exclusive immersive soundscapes.`}</p>
                <div className="evPremiumBenefitRow" aria-label="Premium benefits">
                  <span>{premiumSignalCount} Premium Frequencies</span><span>{premiumCollectionCount} Collections</span><span>Exclusive Soundscapes</span><span className="evFutureBenefit">15 Sound Effects · Coming Next</span><span>Unlimited Voyages</span><span>No Ads</span>
                </div>
              </div>
              <div className="evPremiumOffer">
                <span className="evPremiumOfferLabel">{premiumState === 'premium' ? 'Premium active' : founderOfferOpen ? 'Founding Member' : 'Founder access ended'}</span>
                {premiumState === 'premium' ? (
                  <><strong>Lifetime</strong><small>Founding Member Premium</small><button type="button" className="evPremiumPrimary" onClick={explorePremium}>Choose a Premium frequency</button><button type="button" className="evPremiumSecondary" onClick={() => { setCheckoutOpen(true); setCheckoutStatus('restore'); }}>Recovery code</button></>
                ) : (
                  <><strong>{founderPriceLabel}</strong><small>One time · Lifetime Premium</small><span className="evCadCharge">{checkoutConfig?.chargePriceCad ? `Charged as ${checkoutConfig.chargePriceCad} through Square` : 'Final CAD charge is shown before payment'}</span><button type="button" className="evPremiumPrimary" onClick={() => startCheckout(null)} disabled={premiumState === 'checking' || !founderOfferOpen}>{premiumState === 'checking' ? 'Checking access…' : founderOfferOpen ? 'Unlock Premium' : 'Founder offer ended'}</button><button type="button" className="evPremiumSecondary" onClick={explorePremium}>Explore Premium Frequencies</button><button type="button" className="evRestoreInline" onClick={() => { setCheckoutOpen(true); setCheckoutStatus('restore'); setCheckoutMessage(''); }}>Restore Founder access</button></>
                )}
                <p>The five core frequencies and unlimited free Voyages remain free.</p>
              </div>
            </article>
          </section>

          <section className="evPremiumLibrary section" id="ev-premium-library" aria-labelledby="ev-library-title">
            <div className="evPremiumLibraryHeader">
              <div><p className="evPremiumLibraryTitle">Premium Frequency Library</p><h2 id="ev-library-title">{totalSignalCount} frequencies. Five ways to enter.</h2></div>
              <p>Every collection includes a free flagship. Premium opens six deeper frequency experiences in each state.</p>
            </div>
            <div className="evPremiumCategoryTabs" role="tablist" aria-label="Premium frequency collections">
              {premiumCategories.map((category) => (
                <button key={category.id} type="button" role="tab" aria-selected={selectedCategory === category.id} className={selectedCategory === category.id ? 'active' : ''} onClick={() => setSelectedCategory(category.id)}>
                  <span aria-hidden="true">{category.icon}</span><strong>{category.title}</strong><small>{category.subtitle}</small>
                </button>
              ))}
            </div>
            <div className="evPremiumSignalGrid" role="tabpanel">
              {categorySignals.map((signal) => {
                const unlocked = signal.premium && premiumState === 'premium';
                return (
                  <button key={signal.id} type="button" className={`evPremiumSignalCard ${signal.premium ? 'premium' : 'free'} ${signal.soundProfile} ${unlocked ? 'unlocked' : ''}`} onClick={() => openSignal(signal)}>
                    <span className="evSignalCardTopline"><span>{signal.premium ? (unlocked ? 'Premium active' : 'Premium') : 'Free flagship'}</span><i aria-hidden="true">{signal.premium ? (unlocked ? '✓' : '◇') : '✓'}</i></span>
                    <span className="evSignalExperienceTitle">{signal.label}</span>
                    <b>{signal.hz} Hz</b>
                    {!signal.pure ? <strong>{signal.family}</strong> : null}
                    <span className="evSignalType">{getCustomerAudioType(signal)}</span>
                    <small>{customerFrequencyCopy(signal.purpose)}</small>
                    <span className="evSignalAction">{signal.premium ? (unlocked ? 'Use this frequency →' : 'Preview frequency →') : 'Use free frequency →'}</span>
                  </button>
                );
              })}
            </div>
            <div className="evPremiumLibraryNote"><span>Premium is an expansion, not a gate.</span><p>Unlimited free Voyages remain available with the five original frequencies.</p></div>
          </section>
        </>, premiumMount
      )}

      {aboutMount && createPortal(
        <section className="evAboutCompact section" id="about" aria-labelledby="ev-about-title">
          <div className="evAboutHeader"><div><p className="eyebrow">About Everlasting Voyage</p><h2 id="ev-about-title">Three choices. One focused environment.</h2></div><p>Pure frequencies, a precise timer and one clear intention live together without feeds, comments or setup friction.</p></div>
          <div className="evAboutRitual" aria-label="How Everlasting Voyage works"><article><span>01</span><strong>Choose your state</strong><p>Select the atmosphere that matches the moment.</p></article><i aria-hidden="true">→</i><article><span>02</span><strong>Set your time</strong><p>Choose a session length and one intention.</p></article><i aria-hidden="true">→</i><article><span>03</span><strong>Enter the voyage</strong><p>Frequency, timer and thought capture remain together.</p></article></div>
          <div className="evAboutSignals"><span>Pure frequencies</span><span>Built for sessions</span><span>No forced setup</span><span>Saved spaces</span></div>
        </section>, aboutMount
      )}

      {footerMount && createPortal(
        <footer className="evProductFooter">
          <a href="/" className="evFooterBrand" aria-label="Everlasting Voyage entrance"><img src="/brand-infinity.png" alt="" /><img src="/brand-wordmark.png" alt="Everlasting Voyage" /></a>
          <nav aria-label="Footer navigation"><a href="#session-builder">Build a voyage</a><a href="#ev-premium-library">Premium</a><a href="#library">Frequencies</a><a href="#about">About</a></nav>
          <p>© 2026 Everlasting Voyage. Pure frequencies, clearly presented.</p>
        </footer>, footerMount
      )}

      {previewSignal && createPortal(
        <div className="evPremiumModalBackdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closePreview(); }}>
          <article className={`evPremiumModal ${previewSignal.soundProfile}`} role="dialog" aria-modal="true" aria-labelledby="ev-preview-title">
            <button type="button" className="evPremiumModalClose" onClick={closePreview} aria-label="Close premium preview">×</button>
            <div className="evPremiumModalMeta"><span>Premium frequency</span><span>{premiumCategories.find((category) => category.id === previewSignal.category)?.title}</span></div>
            <h2 id="ev-preview-title">{previewSignal.label}</h2>
            <div className="evPremiumModalFrequency"><strong>{previewSignal.hz} Hz</strong>{!previewSignal.pure ? <span>{previewSignal.family}</span> : null}<span className="evPremiumTypeBadge">{getCustomerAudioType(previewSignal)}</span></div>
            <p>{getPremiumAudioRecipe(previewSignal.id)?.recommendedUse ?? customerFrequencyCopy(previewSignal.description)}</p>
            <div className="evPremiumSoundProfile"><span>Sound profile</span><strong>{getPremiumSoundIdentity(previewSignal.id) ?? (previewSignal.soundProfile === 'ritual' ? 'Ritual soundscape' : previewSignal.soundProfile === 'futuristic' ? 'Futuristic focus' : previewSignal.soundProfile === 'sleep' ? 'Sleep ambience' : previewSignal.soundProfile === 'meditative' ? 'Meditative ambience' : previewSignal.soundProfile === 'focus' ? 'Minimal focus bed' : 'Clean frequency')}</strong></div>
            <div className="evPremiumPreviewControls">
              <button type="button" className={`evPreviewButton ${previewing ? 'playing' : ''}`} onClick={() => previewing ? stopPreview() : startPreview(previewSignal)}>{previewing ? `Stop preview · ${previewSeconds}s` : `Preview ${previewDurationSeconds} seconds`}</button>
              <small>{getPremiumRecipeTechnical(previewSignal.id) ?? (previewSignal.pure ? `Pure ${previewSignal.pureHz} Hz tone` : `Left ${previewSignal.leftHz} Hz · Right ${previewSignal.rightHz} Hz · ${previewSignal.hz} Hz difference`)}</small>
            </div>
            {previewMessage ? <p className="evPremiumMessage" role="status">{previewMessage}</p> : null}
            <div className="evPremiumModalOffer"><div><span>Founding Member</span><strong>{founderPriceLabel}</strong><small>One time · Lifetime</small></div><button type="button" className="evPremiumPrimary" onClick={() => startCheckout(previewSignal)} disabled={!founderOfferOpen}>{founderOfferOpen ? 'Unlock Premium' : 'Founder access ended'}</button></div>
            <button type="button" className="evContinueFree" onClick={closePreview}>Continue with the free library</button>
          </article>
        </div>, document.body
      )}

      {checkoutOpen && createPortal(
        <div className="evPremiumModalBackdrop evCheckoutBackdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeCheckout(); }}>
          <article className="evCheckoutModal" role="dialog" aria-modal="true" aria-labelledby="ev-checkout-title">
            <button type="button" className="evPremiumModalClose" onClick={closeCheckout} aria-label="Close checkout" disabled={checkoutStatus === 'processing'}>×</button>

            {checkoutStatus === 'success' ? (
              <div className="evPremiumSuccess">
                <span className="evSuccessMark" aria-hidden="true">∞</span>
                <p className="evCheckoutEyebrow">Founding Member · Premium active</p>
                <h2 id="ev-checkout-title">Premium unlocked.</h2>
                <h3>Your library just got deeper.</h3>
                <div className="evSuccessBenefits"><span>{premiumSignalCount} Premium Frequencies</span><span>5 collections</span><span>Lifetime Founder Premium</span><span>No ads</span></div>
                <div className="evRecoveryBox">
                  <strong>Founder Recovery Code</strong>
                  <p>Save this code. It restores Premium on another browser or device. Treat it like a private access key.</p>
                  <textarea readOnly value={recoveryCode} aria-label="Founder Recovery Code" onFocus={(event) => event.currentTarget.select()} />
                  <button type="button" className="evPremiumSecondary" onClick={copyRecoveryCode}>{copyLabel}</button>
                </div>
                <div className="evCheckoutActions">
                  <button type="button" className="evPremiumPrimary" onClick={() => {
                    const target = checkoutTargetRef.current;
                    setCheckoutOpen(false);
                    if (target) usePremiumSignal(target);
                    else explorePremium();
                  }}>Enter the Voyage →</button>
                  <button type="button" className="evPremiumSecondary" onClick={() => { setCheckoutOpen(false); explorePremium(); }}>Explore Premium Frequencies</button>
                </div>
                {receiptUrl ? <a className="evReceiptLink" href={receiptUrl} target="_blank" rel="noreferrer">View Square receipt ↗</a> : null}
              </div>
            ) : checkoutStatus === 'restore' ? (
              <div className="evRestorePanel">
                <p className="evCheckoutEyebrow">Restore purchase</p>
                <h2 id="ev-checkout-title">Restore Founder Premium.</h2>
                <p>Paste the complete Founder Recovery Code from your original purchase. No account is required.</p>
                <textarea value={restoreCode} onChange={(event) => setRestoreCode(event.target.value)} placeholder="EVF1.…" aria-label="Founder Recovery Code" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
                {checkoutMessage ? <p className="evCheckoutMessage" role="status">{checkoutMessage}</p> : null}
                <button type="button" className="evPremiumPrimary" onClick={restorePremium}>Restore Premium</button>
                <button type="button" className="evContinueFree" onClick={() => { setCheckoutStatus('form'); setCheckoutMessage(''); }}>Back to Founder checkout</button>
              </div>
            ) : checkoutStatus === 'recovery' ? (
              <div className="evRestorePanel">
                <p className="evCheckoutEyebrow">Payment safety check</p>
                <h2 id="ev-checkout-title">We will not charge twice.</h2>
                <p>Square is being checked for the previous payment attempt before another checkout is allowed.</p>
                <p className="evCheckoutMessage" role="status">{checkoutMessage}</p>
                <button type="button" className="evPremiumPrimary" onClick={async () => {
                  const pending = localStorage.getItem(pendingKey) || '';
                  if (!pending) { setCheckoutStatus('form'); setCheckoutMessage(''); return; }
                  const outcome = await recoverPendingAttempt(pending, true);
                  if (outcome === 'safe') { setCheckoutStatus('form'); setCheckoutMessage(''); }
                }}>Check payment again</button>
                <button type="button" className="evContinueFree" onClick={closeCheckout}>Close safely</button>
              </div>
            ) : (
              <div className="evCheckoutForm">
                <div className="evCheckoutIntro">
                  <p className="evCheckoutEyebrow">Everlasting Voyage Premium</p>
                  <h2 id="ev-checkout-title">Founding Member</h2>
                  <div className="evCheckoutPrice"><strong>{founderPriceLabel}</strong><span>One payment · Lifetime Premium</span></div>
                </div>

                <section className="evCheckoutValue" aria-labelledby="ev-checkout-benefits-title">
                  <h3 id="ev-checkout-benefits-title">Everything you unlock</h3>
                  <div className="evCheckoutBenefitGrid">
                    <article className="evCheckoutBenefitCard evBenefitCyan"><span className="evCheckoutBenefitIcon" aria-hidden="true">◉</span><div><strong>{premiumSignalCount} Premium Frequencies</strong><p>Explore deeper frequencies across Study, Deep Work, Meditation, Sleep and Ritual.</p></div></article>
                    <article className="evCheckoutBenefitCard evBenefitViolet"><span className="evCheckoutBenefitIcon" aria-hidden="true">✦</span><div><strong>Premium Soundscapes</strong><p>Immersive focus, meditation, sleep and ritual listening environments.</p></div></article>
                    <article className="evCheckoutBenefitCard evBenefitAqua"><span className="evCheckoutBenefitIcon" aria-hidden="true">∞</span><div><strong>Unlimited Voyages</strong><p>Enter whenever you want. No session limits.</p></div></article>
                    <article className="evCheckoutBenefitCard evBenefitGold"><span className="evCheckoutBenefitIcon" aria-hidden="true">◇</span><div><strong>Lifetime Founder Access</strong><p>One payment. Premium stays unlocked as a Founding Member.</p></div></article>
                  </div>
                  <p className="evCheckoutBenefitMeta"><span>5 collections</span><span>No ads</span><span>No account required</span></p><p className="evCheckoutComingSoon"><strong>Coming to Premium:</strong> 15 immersive sound effects</p>
                </section>

                <div className="evFounderPromise"><span aria-hidden="true">∞</span><p><strong>Founder price.</strong> One payment. Yours for life.</p></div>

                <div className="evCheckoutCurrency">
                  <span>You’ll be charged</span>
                  <strong>{checkoutConfig?.chargePriceCad ? founderChargeLabel : 'Checkout unavailable'}</strong>
                  <small>{checkoutConfig?.chargePriceCad ? 'Processed securely by Square in Canadian dollars.' : 'Premium checkout is temporarily unavailable. Please try again shortly.'}</small>
                </div>

                {!checkoutConfig ? (
                  <div className="evCheckoutNotReady"><strong>Loading secure checkout…</strong><p>Everlasting Voyage is preparing the secure Square payment form.</p></div>
                ) : !checkoutConfig.founderAvailable ? (
                  <p className="evCheckoutMessage">Founding Member access has ended.</p>
                ) : !checkoutConfig.checkoutReady ? (
                  <div className="evCheckoutNotReady"><strong>Premium checkout is temporarily unavailable.</strong><p>Please try again shortly. No card can be charged while checkout is unavailable.</p></div>
                ) : (
                  <>
                    <div className="evSquareSecureLabel"><span>Secure checkout</span><strong>Square</strong></div>
                    <div id="ev-square-card" className={`evSquareCard ${cardReady ? 'ready' : ''}`} aria-label="Secure Square card form" />
                  </>
                )}

                {checkoutMessage ? <p className="evCheckoutMessage" role="status">{checkoutMessage}</p> : null}
                <button type="button" className="evPremiumPrimary evPayButton" disabled={!cardReady || checkoutStatus === 'processing' || !checkoutConfig?.checkoutReady} onClick={processPayment}>{checkoutStatus === 'processing' ? 'Processing…' : checkoutConfig?.chargePriceCad ? `Unlock lifetime Premium — ${founderChargeActionLabel}` : 'Premium checkout temporarily unavailable'}</button>
                <p className="evSquareTrust">Secure payment processed by Square</p>
                <p className="evCheckoutFinePrint">Founder access is available through {checkoutConfig?.founderEndsLabel || 'August 31, 2026'}. The free Everlasting Voyage experience remains available regardless of purchase.</p>
                <button type="button" className="evRestoreInline" onClick={() => { setCheckoutStatus('restore'); setCheckoutMessage(''); }}>Already a Founder? Restore access</button>
              </div>
            )}
          </article>
        </div>, document.body
      )}

      <style>{`
        .evPremiumLaunch{padding-top:18px!important;padding-bottom:34px!important}
        .evPremiumShowcase{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.55fr) minmax(260px,.65fr);gap:30px;align-items:stretch;padding:clamp(26px,4vw,48px);border:1px solid rgba(116,192,255,.17);border-radius:30px;background:linear-gradient(135deg,rgba(4,17,39,.94),rgba(5,10,31,.92) 54%,rgba(18,8,43,.9));box-shadow:0 30px 90px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.035)}
        .evPremiumShowcase.activeMember{border-color:rgba(215,176,255,.26);background:linear-gradient(135deg,rgba(6,22,42,.96),rgba(16,11,41,.94))}
        .evPremiumGlow{position:absolute;width:320px;height:320px;border-radius:50%;filter:blur(80px);opacity:.18;pointer-events:none}
        .evPremiumGlowOne{top:-180px;left:16%;background:#27b8ff}
        .evPremiumGlowTwo{right:-130px;bottom:-210px;background:#8658ff}
        .evPremiumShowcaseCopy,.evPremiumOffer{position:relative;z-index:1}
        .evPremiumKickerRow{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:20px}
        .evPremiumKicker,.evFounderBadge{display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;font-size:10px;line-height:1;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
        .evPremiumKicker{color:#9ce8ff;border:1px solid rgba(93,201,255,.28);background:rgba(29,128,194,.1)}
        .evFounderBadge{color:#ffd99a;border:1px solid rgba(224,173,94,.28);background:linear-gradient(135deg,rgba(141,85,34,.12),rgba(119,74,213,.1))}
        .evPremiumShowcase h2,.evPremiumLibraryHeader h2{margin:0;color:#f3f8ff;font-size:clamp(30px,4.2vw,58px);line-height:.98;letter-spacing:-.045em;max-width:900px}
        .evPremiumShowcaseCopy>p{max-width:780px;margin:22px 0 0;color:rgba(220,235,249,.7);font-size:clamp(15px,1.5vw,18px);line-height:1.65}
        .evPremiumBenefitRow{display:flex;flex-wrap:wrap;gap:9px;margin-top:26px}
        .evPremiumBenefitRow span{--ev-chip:110,206,255;position:relative;padding:9px 12px;border-radius:999px;border:1px solid rgba(var(--ev-chip),.28);color:rgba(239,249,255,.94);background:linear-gradient(135deg,rgba(var(--ev-chip),.11),rgba(255,255,255,.025));box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 0 22px rgba(var(--ev-chip),.055);font-size:11px;font-weight:800;letter-spacing:.04em;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
        .evPremiumBenefitRow span:nth-child(1){--ev-chip:74,212,255;color:#bcefff}
        .evPremiumBenefitRow span:nth-child(2){--ev-chip:104,166,255;color:#d2e5ff}
        .evPremiumBenefitRow span:nth-child(3){--ev-chip:164,111,255;color:#e1d2ff}
        .evPremiumBenefitRow span:nth-child(4){--ev-chip:231,185,108;color:#ffe0aa}
        .evPremiumBenefitRow span:nth-child(5){--ev-chip:74,226,213;color:#bff8ef}
        .evPremiumBenefitRow span:nth-child(6){--ev-chip:231,185,108;color:#ffe8bd}
        .evPremiumBenefitRow span:hover{transform:translateY(-1px);border-color:rgba(var(--ev-chip),.42);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 26px rgba(var(--ev-chip),.10)}
        .evPremiumOffer{display:flex;flex-direction:column;justify-content:center;align-items:stretch;padding:24px;border-radius:24px;border:1px solid rgba(160,202,255,.14);background:linear-gradient(180deg,rgba(20,40,72,.42),rgba(8,12,29,.5))}
        .evPremiumOfferLabel{align-self:flex-start;display:inline-flex;align-items:center;min-height:31px;padding:0 11px;border:1px solid rgba(235,190,111,.28);border-radius:999px;color:#ffe0a8;background:linear-gradient(135deg,rgba(147,92,35,.14),rgba(126,78,216,.11));box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 0 28px rgba(224,171,91,.06);text-shadow:0 0 18px rgba(255,212,143,.13);font-size:13px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
        .evPremiumOffer>strong{margin-top:9px;color:#fff;font-size:34px;letter-spacing:-.04em}
        .evPremiumOffer>small{color:rgba(220,232,246,.58);margin:2px 0 8px}
        .evCadCharge{display:block;margin:0 0 16px;color:#ffd79a;font-size:10px;line-height:1.45}
        .evPremiumPrimary,.evPremiumSecondary,.evPreviewButton{border:0;cursor:pointer;font:inherit}
        .evPremiumPrimary{min-height:48px;padding:0 18px;border-radius:14px;color:#03101c;background:linear-gradient(135deg,#95e7ff,#67b7ff 56%,#9f8cff);box-shadow:0 12px 34px rgba(72,167,255,.18);font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
        .evPremiumPrimary:disabled{cursor:not-allowed;opacity:.48}
        .evPremiumSecondary{margin-top:9px;min-height:42px;padding:0 14px;border-radius:13px;color:#cfeaff;border:1px solid rgba(130,200,255,.14);background:rgba(255,255,255,.025);font-size:11px;font-weight:800}
        .evPremiumOffer>p{margin:15px 0 0;text-align:center;color:rgba(210,228,244,.5);font-size:10px;line-height:1.5}
        .evRestoreInline{margin-top:10px;border:0;background:transparent;color:rgba(205,226,244,.62);text-decoration:underline;text-underline-offset:3px;cursor:pointer;font-size:10px}
        .evPremiumLibrary{padding-top:38px!important}
        .evPremiumLibraryHeader{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(250px,.7fr);gap:28px;align-items:end;margin-bottom:26px}
        .evPremiumLibraryTitle{margin:0 0 12px;color:#f0c66f;font-size:clamp(28px,3vw,42px);font-weight:950;letter-spacing:.12em;text-transform:uppercase;text-shadow:0 0 26px rgba(240,190,91,.16)}
        .evPremiumLibraryHeader h2{font-size:clamp(34px,4.2vw,56px)}
        .evPremiumLibraryHeader>p{margin:0;color:rgba(224,237,249,.78);font-size:clamp(15px,1.45vw,18px);line-height:1.65}
        .evPremiumCategoryTabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:14px;overflow:auto;scrollbar-width:none}
        .evPremiumCategoryTabs::-webkit-scrollbar{display:none}
        .evPremiumCategoryTabs button{min-width:190px;min-height:128px;padding:18px;text-align:left;border:1px solid rgba(115,181,236,.1);border-radius:17px;color:rgba(213,231,247,.63);background:rgba(5,15,32,.5);cursor:pointer;transition:border-color .2s ease,background .2s ease,transform .2s ease}
        .evPremiumCategoryTabs button:hover{transform:translateY(-2px);border-color:rgba(113,196,255,.2)}
        .evPremiumCategoryTabs button.active{color:#ebf8ff;border-color:rgba(96,197,255,.34);background:linear-gradient(145deg,rgba(25,91,137,.23),rgba(36,29,91,.22));box-shadow:inset 0 0 30px rgba(73,168,255,.04)}
        .evPremiumCategoryTabs button>span{display:block;color:#83ddff;font-size:21px}
        .evPremiumCategoryTabs strong{display:block;margin-top:10px;color:#eef7ff;font-size:clamp(18px,1.55vw,22px);line-height:1.12;letter-spacing:-.02em}
        .evPremiumCategoryTabs small{display:block;margin-top:8px;color:rgba(216,232,247,.72);font-size:clamp(13px,1.05vw,15px);line-height:1.4}
        .evPremiumSignalGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
        .evPremiumSignalCard{position:relative;isolation:isolate;min-height:286px;padding:19px;overflow:hidden;text-align:left;border-radius:20px;border:1px solid rgba(112,179,235,.11);color:#dff2ff;background:linear-gradient(155deg,rgba(7,24,47,.83),rgba(3,10,23,.95));cursor:pointer;transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease,background .22s ease}
        .evPremiumSignalCard:hover{transform:translateY(-3px);border-color:rgba(102,198,255,.28);box-shadow:0 20px 42px rgba(0,0,0,.24)}
        .evPremiumSignalCard.premium{border-color:rgba(232,188,99,.44);background:radial-gradient(circle at 88% 4%,rgba(255,207,111,.16),transparent 34%),linear-gradient(155deg,rgba(28,22,26,.96),rgba(8,11,22,.98) 58%,rgba(17,13,22,.98));box-shadow:inset 0 1px 0 rgba(255,238,196,.055),0 16px 44px rgba(111,74,16,.12)}
        .evPremiumSignalCard.premium:hover{border-color:rgba(255,215,131,.66);box-shadow:inset 0 1px 0 rgba(255,242,210,.08),0 22px 52px rgba(173,118,27,.18),0 0 28px rgba(246,194,93,.08)}
        .evPremiumSignalCard.premium:after{content:'';position:absolute;z-index:0;width:165px;height:165px;top:-82px;right:-62px;border-radius:50%;background:#f3bd59;filter:blur(58px);opacity:.25;pointer-events:none}
        .evPremiumSignalCard.premium:before{content:'';position:absolute;z-index:0;top:-55%;left:-75%;width:34%;height:220%;transform:rotate(18deg);background:linear-gradient(90deg,transparent,rgba(255,231,174,.12),transparent);pointer-events:none;animation:evPremiumGoldSheen 8.5s ease-in-out infinite}
        .evPremiumSignalCard.unlocked{border-color:rgba(255,219,144,.62);box-shadow:inset 0 0 34px rgba(255,206,112,.055),0 18px 46px rgba(146,96,18,.15)}
        .evPremiumSignalCard.free{border-color:rgba(93,211,255,.19)}
        .evSignalCardTopline{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;align-items:center;color:rgba(181,216,243,.58);font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
        .evPremiumSignalCard.premium .evSignalCardTopline>span{display:inline-flex;align-items:center;min-height:27px;padding:0 10px;border:1px solid rgba(242,192,94,.42);border-radius:999px;color:#ffe2a5;background:rgba(150,101,29,.1);box-shadow:0 0 22px rgba(235,180,77,.06)}
        .evSignalCardTopline i{display:grid;place-items:center;width:27px;height:27px;border-radius:50%;color:#a7e8ff;border:1px solid rgba(117,207,255,.2);font-style:normal}
        .evPremiumSignalCard.premium .evSignalCardTopline i{color:#ffd68b;border-color:rgba(240,190,93,.38);background:rgba(161,105,24,.08)}
        .evSignalExperienceTitle{position:relative;z-index:1;display:block;margin-top:20px;color:#f5fbff;font-size:clamp(23px,2vw,30px);font-weight:900;line-height:1.03;letter-spacing:-.035em;text-wrap:balance}
        .evPremiumSignalCard.premium .evSignalExperienceTitle{color:#fff2d2;text-shadow:0 0 22px rgba(244,191,90,.12)}
        .evPremiumSignalCard>b{position:relative;z-index:1;display:block;margin-top:9px;color:#f4fbff;font-size:clamp(21px,1.8vw,27px);line-height:1;letter-spacing:-.035em}
        .evPremiumSignalCard>strong{position:relative;z-index:1;display:block;margin-top:7px;color:rgba(204,228,246,.66);font-size:11px;letter-spacing:.1em;text-transform:uppercase}
        .evSignalType{position:relative;z-index:1;display:inline-flex;align-items:center;min-height:24px;margin-top:9px;padding:0 8px;border:1px solid rgba(110,205,255,.18);border-radius:999px;color:#a9e8ff;background:rgba(56,155,209,.07);font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
        .evPremiumSignalCard.premium .evSignalType{border-color:rgba(238,188,91,.35);color:#ffdaa0;background:rgba(145,91,17,.09)}
        .evPremiumSignalCard>small{position:relative;z-index:1;display:block;margin-top:9px;padding-bottom:38px;color:rgba(211,230,245,.58);line-height:1.5;font-size:10px}
        .evSignalAction{position:absolute;z-index:1;left:19px;bottom:18px;color:rgba(184,226,255,.78);font-size:9px;font-weight:900;letter-spacing:.05em}
        .evPremiumSignalCard.premium .evSignalAction{color:#ffd58c}
        .evPremiumLibraryNote{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-top:14px;padding:16px 18px;border:1px solid rgba(116,180,231,.08);border-radius:15px;background:rgba(255,255,255,.018)}
        .evPremiumLibraryNote span{color:#bfeaff;font-size:11px;font-weight:800}
        .evPremiumLibraryNote p{margin:0;color:rgba(210,228,243,.45);font-size:10px}
        .evPremiumBuilderSelection{margin:14px 0 18px;padding:16px 18px;border-radius:17px;border:1px solid rgba(211,168,255,.35);background:radial-gradient(circle at 88% 8%,rgba(161,91,255,.17),transparent 35%),linear-gradient(145deg,rgba(23,18,52,.92),rgba(6,16,33,.94));display:flex;justify-content:space-between;gap:18px;align-items:center}
        .evPremiumBuilderSelection span{display:block;color:#ffd99a;font-size:9px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}
        .evPremiumBuilderSelection strong{display:block;margin-top:5px;color:#f8f1ff;font-size:18px}
        .evPremiumBuilderSelection p{margin:4px 0 0;color:rgba(218,230,244,.62);font-size:11px}
        .evPremiumBuilderSelection button{flex:0 0 auto;border:1px solid rgba(152,201,244,.13);border-radius:12px;background:rgba(255,255,255,.025);color:#cdeaff;min-height:40px;padding:0 13px;cursor:pointer;font-size:10px}
        .ev-premium-builder-selected #session-builder>.selectedSummary{display:none!important}
        .ev-premium-builder-selected #session-builder .signalBadge{opacity:.35}
        .ev-premium-builder-selected #session-builder .stateChoice.active .selectionMark{opacity:0!important}
        .ev-premium-builder-selected #session-builder .stateChoice.active{filter:saturate(.6);opacity:.7}
        .evPremiumModalBackdrop{position:fixed;inset:0;z-index:1700;display:grid;place-items:center;padding:18px;overflow:hidden;overscroll-behavior:none;background:rgba(0,4,13,.76);backdrop-filter:blur(15px)}
        .evPremiumModal{position:relative;width:min(560px,100%);max-height:min(760px,calc(100dvh - 36px));overflow:auto;padding:clamp(24px,4vw,38px);border-radius:27px;border:1px solid rgba(237,193,106,.42);color:#eef9ff;background:radial-gradient(circle at 82% -8%,rgba(245,190,82,.2),transparent 37%),radial-gradient(circle at 4% 18%,rgba(70,186,255,.07),transparent 30%),linear-gradient(150deg,rgba(13,18,33,.995),rgba(5,8,18,.995));box-shadow:0 34px 110px rgba(0,0,0,.58),0 0 42px rgba(194,133,28,.08)}
        .evPremiumModal.ritual{background:radial-gradient(circle at 82% -8%,rgba(248,191,76,.23),transparent 38%),radial-gradient(circle at 12% 20%,rgba(139,93,43,.08),transparent 34%),linear-gradient(150deg,rgba(21,17,26,.995),rgba(5,7,16,.995))}
        .evPremiumModal.futuristic{background:radial-gradient(circle at 82% -8%,rgba(245,190,82,.2),transparent 37%),radial-gradient(circle at 10% 26%,rgba(32,188,255,.12),transparent 34%),linear-gradient(150deg,rgba(8,24,37,.995),rgba(4,8,18,.995))}
        .evPremiumModalClose{position:absolute;z-index:5;top:16px;right:16px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(136,202,255,.13);color:#dff6ff;background:rgba(255,255,255,.035);cursor:pointer;font-size:22px}
        .evPremiumModalClose:disabled{opacity:.35;cursor:not-allowed}
        .evPremiumModalMeta{display:flex;flex-wrap:wrap;gap:8px;padding-right:44px}
        .evPremiumModalMeta span{padding:8px 10px;border-radius:999px;border:1px solid rgba(236,190,98,.28);color:#ffe0a5;background:rgba(144,92,21,.08);font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
        .evPremiumModal h2{margin:28px 0 0;color:#fff7e7;font-size:clamp(48px,8vw,68px);line-height:.94;letter-spacing:-.055em;text-wrap:balance;text-shadow:0 0 28px rgba(239,184,76,.08)}
        .evPremiumModalFrequency{display:flex;align-items:center;flex-wrap:wrap;gap:9px 12px;margin-top:16px}
        .evPremiumModalFrequency>strong{color:#ffd77e;font-size:clamp(29px,5vw,38px);line-height:1;letter-spacing:-.04em}
        .evPremiumModalFrequency>span:not(.evPremiumTypeBadge){color:rgba(219,231,244,.7);font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
        .evPremiumTypeBadge{display:inline-flex;align-items:center;min-height:27px;padding:0 10px;border:1px solid rgba(237,189,93,.38);border-radius:999px;color:#ffe0a5;background:rgba(145,93,24,.1);font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
        .evPremiumModal>p{color:rgba(213,232,247,.6);line-height:1.65}
        .evPremiumSoundProfile{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:22px;padding:14px 15px;border-radius:14px;border:1px solid rgba(233,187,94,.18);background:linear-gradient(135deg,rgba(137,87,20,.06),rgba(255,255,255,.018))}
        .evPremiumSoundProfile span{color:rgba(202,225,244,.45);font-size:9px;text-transform:uppercase;letter-spacing:.11em}
        .evPremiumSoundProfile strong{color:#ffe0aa;font-size:11px}
        .evPremiumPreviewControls{margin-top:12px;padding:16px;border-radius:15px;border:1px solid rgba(231,185,92,.18);background:linear-gradient(135deg,rgba(119,77,22,.07),rgba(20,44,65,.1))}
        .evPreviewButton{width:100%;min-height:48px;border-radius:13px;color:#e5f8ff;border:1px solid rgba(106,204,255,.24);background:linear-gradient(135deg,rgba(48,141,202,.2),rgba(93,77,191,.18));font-size:11px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}
        .evPremiumPreviewControls small{display:block;margin-top:10px;text-align:center;color:rgba(192,218,239,.42);font-size:9px}
        .evPremiumMessage,.evCheckoutMessage{margin:12px 0 0!important;padding:11px 13px;border-radius:12px;border:1px solid rgba(114,196,255,.13);background:rgba(31,91,128,.1);color:#bfe9ff!important;font-size:10px;line-height:1.55}
        .evPremiumModalOffer{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center;margin-top:18px;padding-top:18px;border-top:1px solid rgba(150,195,230,.09)}
        .evPremiumModalOffer>div span,.evPremiumModalOffer>div small{display:block;color:rgba(202,224,242,.46);font-size:9px}
        .evPremiumModalOffer>div strong{display:block;margin:2px 0;font-size:28px;letter-spacing:-.04em}
        .evContinueFree{display:block;margin:14px auto 0;border:0;color:rgba(201,224,241,.5);background:transparent;cursor:pointer;font-size:10px;text-decoration:underline;text-underline-offset:3px}
        .evCheckoutBackdrop{align-items:center;padding:18px}
        .evCheckoutModal{position:relative;isolation:isolate;display:flex;flex-direction:column;width:min(740px,calc(100vw - 36px));max-height:min(900px,calc(100dvh - 36px));overflow:hidden;border-radius:30px;border:1px solid rgba(179,142,255,.32);color:#eef9ff;background:radial-gradient(circle at 82% -3%,rgba(144,76,255,.24),transparent 34%),radial-gradient(circle at 4% 22%,rgba(47,184,255,.1),transparent 30%),linear-gradient(155deg,rgba(8,21,43,.997),rgba(6,7,20,.997));box-shadow:0 42px 140px rgba(0,0,0,.68),inset 0 1px 0 rgba(255,255,255,.035)}
        .evCheckoutForm,.evRestorePanel,.evPremiumSuccess{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:38px 42px 36px;scrollbar-width:none}
        .evCheckoutForm::-webkit-scrollbar,.evRestorePanel::-webkit-scrollbar,.evPremiumSuccess::-webkit-scrollbar{width:0;height:0}
        .evCheckoutModal .evPremiumModalClose{top:18px;right:18px;width:44px;height:44px;border-color:rgba(153,205,255,.2);background:rgba(14,26,51,.72);box-shadow:0 8px 28px rgba(0,0,0,.25);backdrop-filter:blur(10px);font-size:24px}
        .evCheckoutEyebrow{margin:0;color:#ffdda2;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
        .evCheckoutForm h2,.evRestorePanel h2,.evPremiumSuccess h2{margin:11px 0 0;color:#f8fbff;font-size:clamp(54px,6vw,60px);line-height:.96;letter-spacing:-.05em}
        .evCheckoutPrice{display:flex;align-items:end;gap:14px;margin-top:18px}
        .evCheckoutPrice strong{color:#fff;font-size:42px;line-height:1;letter-spacing:-.045em}
        .evCheckoutPrice span{padding-bottom:5px;color:rgba(225,237,249,.76);font-size:14px;font-weight:600}
        .evCheckoutValue{margin-top:30px}
        .evCheckoutValue>h3{margin:0 0 12px;color:#edfaff;font-size:16px;font-weight:850;letter-spacing:.015em}
        .evCheckoutBenefitGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .evCheckoutBenefitCard{--ev-benefit:86,215,255;position:relative;overflow:hidden;display:flex;gap:12px;min-height:112px;padding:16px 16px 15px;border:1px solid rgba(var(--ev-benefit),.24);border-radius:17px;background:linear-gradient(145deg,rgba(var(--ev-benefit),.075),rgba(255,255,255,.018) 52%,rgba(5,10,26,.52));box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 14px 34px rgba(var(--ev-benefit),.035);transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}
        .evCheckoutBenefitCard:after{content:'';position:absolute;top:-70px;right:-55px;width:150px;height:150px;border-radius:50%;background:rgba(var(--ev-benefit),.18);filter:blur(42px);pointer-events:none}
        .evCheckoutBenefitCard:hover{transform:translateY(-2px);border-color:rgba(var(--ev-benefit),.38);box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 18px 40px rgba(var(--ev-benefit),.07)}
        .evBenefitCyan{--ev-benefit:75,211,255}
        .evBenefitViolet{--ev-benefit:157,112,255}
        .evBenefitAqua{--ev-benefit:75,229,218}
        .evBenefitGold{--ev-benefit:235,184,105}
        .evCheckoutBenefitIcon{position:relative;z-index:1;flex:0 0 auto;display:grid;place-items:center;width:32px;height:32px;border-radius:11px;border:1px solid rgba(var(--ev-benefit),.34);color:rgb(var(--ev-benefit));background:rgba(var(--ev-benefit),.09);box-shadow:0 0 24px rgba(var(--ev-benefit),.1);font-size:16px;font-weight:900}
        .evCheckoutBenefitCard>div{position:relative;z-index:1;min-width:0}
        .evCheckoutBenefitCard strong{display:block;color:#f3fbff;font-size:15px;line-height:1.25}
        .evCheckoutBenefitCard p{margin:6px 0 0;color:rgba(216,234,248,.72);font-size:12.5px;line-height:1.5}
        .evCheckoutBenefitMeta{display:flex;justify-content:center;flex-wrap:wrap;margin:12px 0 0;color:rgba(211,231,247,.72);font-size:12.5px;font-weight:700}
        .evCheckoutBenefitMeta span+span:before{content:'·';margin:0 8px;color:rgba(149,214,255,.5)}
        .evFounderPromise{display:flex;align-items:center;gap:10px;margin-top:14px;padding:12px 14px;border:1px solid rgba(224,178,102,.2);border-radius:14px;background:linear-gradient(120deg,rgba(124,79,26,.1),rgba(117,72,205,.07))}
        .evFounderPromise>span{display:grid;place-items:center;flex:0 0 auto;width:29px;height:29px;border-radius:50%;color:#ffdca1;border:1px solid rgba(235,190,111,.28);background:rgba(235,190,111,.07);font-size:17px}
        .evFounderPromise p{margin:0;color:rgba(229,236,247,.8);font-size:13px;line-height:1.4}
        .evFounderPromise strong{color:#ffe0aa}
        .evCheckoutCurrency{margin-top:18px;padding:16px 18px;border:1px solid rgba(235,190,111,.28);border-radius:17px;background:radial-gradient(circle at 93% 0%,rgba(235,190,111,.11),transparent 40%),linear-gradient(145deg,rgba(119,74,32,.11),rgba(91,54,131,.055));box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
        .evCheckoutCurrency span,.evCheckoutCurrency small{display:block;color:rgba(226,232,242,.72);font-size:12px}
        .evCheckoutCurrency span{font-weight:850;letter-spacing:.1em;text-transform:uppercase}
        .evCheckoutCurrency strong{display:block;margin:5px 0 4px;color:#ffdda2;font-size:22px;line-height:1.08;letter-spacing:-.02em}
        .evCheckoutCurrency small{font-size:13px;line-height:1.5}
        .evSquareSecureLabel{display:flex;justify-content:space-between;align-items:center;margin-top:22px;color:rgba(219,236,249,.76);font-size:13px;font-weight:700}
        .evSquareSecureLabel strong{color:#fff;font-size:13px}
        .evSquareCard{min-height:102px;margin-top:9px;padding:12px;border:1px solid rgba(116,191,244,.18);border-radius:17px;background:rgba(255,255,255,.028);box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
        .evSquareCard.ready{border-color:rgba(119,207,255,.32);box-shadow:0 0 0 1px rgba(119,207,255,.025),inset 0 1px 0 rgba(255,255,255,.035)}
        .evCheckoutModal .evPremiumPrimary{font-size:14px}
        .evCheckoutModal .evPremiumSecondary{font-size:13px}
        .evCheckoutModal .evContinueFree{font-size:13px;color:rgba(211,232,248,.7)}
        .evCheckoutModal .evCheckoutMessage{font-size:13px;line-height:1.55;color:#c9efff!important}
        .evPayButton{position:relative;overflow:hidden;width:100%;min-height:58px;margin-top:18px;padding:0 18px;font-size:14.5px!important;letter-spacing:.055em;box-shadow:0 15px 38px rgba(73,169,255,.22),0 0 34px rgba(142,104,255,.09)}
        .evPayButton:not(:disabled):after{content:'';position:absolute;top:-90%;left:-34%;width:20%;height:280%;transform:rotate(18deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.44),transparent);opacity:0;pointer-events:none;animation:evFounderSheen 5.8s ease-in-out infinite}
        .evSquareTrust{margin:9px 0 0;text-align:center;color:rgba(208,231,247,.7);font-size:12.5px;font-weight:650}
        .evCheckoutComingSoon{margin:12px 0 0;padding:10px 12px;border:1px solid rgba(235,190,111,.18);border-radius:12px;color:rgba(222,235,247,.72);background:rgba(132,86,20,.06);font-size:12px;line-height:1.45;text-align:center}.evCheckoutComingSoon strong{color:#ffe0aa}
        .evCheckoutFinePrint{margin:16px 0 0;color:rgba(212,229,243,.68);font-size:12.5px;line-height:1.55}
        .evCheckoutForm>.evRestoreInline{display:block;margin:12px auto 0;color:rgba(213,235,250,.78);font-size:13px}
        .evCheckoutNotReady{margin-top:20px;padding:16px;border-radius:15px;border:1px solid rgba(239,183,100,.21);background:rgba(119,75,27,.08)}
        .evCheckoutNotReady strong{color:#ffd99a;font-size:14px}
        .evCheckoutNotReady p{margin:6px 0 0;color:rgba(222,233,245,.7);font-size:13px;line-height:1.55}
        .evRestorePanel>p,.evPremiumSuccess>h3{color:rgba(222,235,247,.72);font-size:14px;line-height:1.6}
        .evRestorePanel textarea,.evRecoveryBox textarea{width:100%;min-height:132px;resize:vertical;margin-top:14px;padding:13px;border:1px solid rgba(122,191,244,.18);border-radius:13px;color:#dff5ff;background:rgba(2,10,24,.62);font:500 12.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;outline:none}
        .evRestorePanel>.evPremiumPrimary{width:100%;margin-top:16px}
        .evSuccessMark{display:grid;place-items:center;width:62px;height:62px;margin-bottom:18px;border-radius:50%;border:1px solid rgba(235,190,111,.34);color:#ffd99a;background:linear-gradient(135deg,rgba(137,83,255,.18),rgba(160,105,42,.17));font-size:32px}
        .evPremiumSuccess h3{margin:9px 0 0;font-size:16px}
        .evSuccessBenefits{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}
        .evSuccessBenefits span{padding:8px 10px;border-radius:999px;border:1px solid rgba(133,192,241,.14);background:rgba(255,255,255,.03);color:rgba(226,239,249,.82);font-size:12px}
        .evRecoveryBox{margin-top:20px;padding:18px;border:1px solid rgba(176,139,255,.2);border-radius:16px;background:rgba(255,255,255,.027)}
        .evRecoveryBox strong{color:#ffe0aa;font-size:14px}
        .evRecoveryBox p{margin:7px 0 0;color:rgba(219,232,245,.68);font-size:12.5px;line-height:1.5}
        .evRecoveryBox .evPremiumSecondary{width:100%}
        .evCheckoutActions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
        .evCheckoutActions .evPremiumSecondary{margin:0}
        .evReceiptLink{display:block;margin-top:14px;text-align:center;color:#aee8ff;font-size:12px;text-decoration:none}
        @keyframes evFounderSheen{0%,65%{left:-34%;opacity:0}70%{opacity:.2}82%{opacity:.52}95%,100%{left:124%;opacity:0}}
        @keyframes evPremiumGoldSheen{0%,68%{left:-75%;opacity:0}73%{opacity:.24}84%{opacity:.5}96%,100%{left:135%;opacity:0}}
        .evAboutCompact{padding-top:28px!important}
        .evAboutHeader{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:end}
        .evAboutHeader h2{margin:0;font-size:clamp(28px,3.5vw,46px);color:#f2f8ff}
        .evAboutHeader>p{color:rgba(211,229,244,.58);line-height:1.65}
        .evAboutRitual{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:14px;align-items:center;margin-top:24px}
        .evAboutRitual article{padding:18px;border:1px solid rgba(117,182,235,.08);border-radius:16px;background:rgba(255,255,255,.018)}
        .evAboutRitual article>span{color:#7ddcff;font-size:10px}
        .evAboutRitual strong{display:block;margin-top:8px;color:#e8f7ff}
        .evAboutRitual p{color:rgba(208,226,241,.48);font-size:10px;line-height:1.5}
        .evAboutRitual i{color:rgba(123,202,255,.3);font-style:normal}
        .evAboutSignals{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
        .evAboutSignals span{padding:8px 10px;border-radius:999px;border:1px solid rgba(121,190,242,.08);color:rgba(205,227,244,.55);font-size:9px}
        .evProductFooter{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:28px clamp(18px,5vw,70px);border-top:1px solid rgba(118,182,232,.07);background:rgba(1,7,18,.45)}
        .evFooterBrand{display:flex;align-items:center;gap:8px}
        .evFooterBrand img:first-child{width:28px;height:28px;object-fit:contain}
        .evFooterBrand img:last-child{width:120px;height:auto}
        .evProductFooter nav{display:flex;gap:15px;flex-wrap:wrap}
        .evProductFooter a{color:rgba(205,229,246,.58);text-decoration:none;font-size:9px}
        .evProductFooter p{margin:0;color:rgba(200,221,238,.34);font-size:8px}
        @media(max-width:980px){.evPremiumShowcase,.evPremiumLibraryHeader,.evAboutHeader{grid-template-columns:1fr}
        .evPremiumOffer{max-width:460px}
        .evPremiumCategoryTabs{grid-template-columns:repeat(5,minmax(150px,1fr))}
        .evPremiumSignalGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .evAboutRitual{grid-template-columns:1fr}
        .evAboutRitual i{display:none}
        .evProductFooter{align-items:flex-start;flex-direction:column}}
        @media(max-width:620px){.evPremiumLaunch{padding-top:10px!important;padding-bottom:18px!important}
        .evPremiumShowcase{gap:22px;padding:23px 18px;border-radius:23px}
        .evPremiumShowcase h2{font-size:34px}
        .evPremiumShowcaseCopy>p{margin-top:16px;font-size:14px}
        .evPremiumBenefitRow{gap:7px;margin-top:18px}
        .evPremiumBenefitRow span{font-size:10.5px;padding:8px 11px}
        .evPremiumOffer{padding:18px;border-radius:18px}
        .evPremiumOfferLabel{font-size:12.5px;min-height:30px}
        .evPremiumLibrary{padding-top:22px!important}
        .evPremiumLibraryHeader{gap:12px;margin-bottom:18px}
        .evPremiumLibraryTitle{margin-bottom:10px;font-size:28px;line-height:1.1;letter-spacing:.1em}
        .evPremiumLibraryHeader h2{font-size:36px}
        .evPremiumLibraryHeader>p{font-size:15px;line-height:1.55}
        .evPremiumCategoryTabs{margin-right:-18px;padding-right:18px}
        .evPremiumCategoryTabs button{min-width:205px;min-height:136px;padding:17px}
        .evPremiumSignalGrid{grid-template-columns:1fr 1fr;gap:8px}
        .evPremiumSignalCard{min-height:270px;padding:16px 14px;border-radius:17px}
        .evSignalExperienceTitle{margin-top:18px;font-size:clamp(22px,6.1vw,26px)}
        .evPremiumSignalCard>b{font-size:22px}
        .evPremiumSignalCard>strong{font-size:10px}
        .evSignalType{font-size:7.5px}
        .evPremiumSignalCard>small{font-size:9.5px;padding-bottom:36px}
        .evSignalAction{left:14px;bottom:15px;font-size:8px}
        .evPremiumLibraryNote{align-items:flex-start;flex-direction:column;gap:5px}
        .evPremiumBuilderSelection{align-items:flex-start;flex-direction:column}
        .evPremiumBuilderSelection button{width:100%}
        .evPremiumModalBackdrop{padding:10px;align-items:end}
        .evPremiumModal{max-height:calc(100dvh - 20px);padding:25px 18px 22px;border-radius:24px 24px 18px 18px}
        .evPremiumModal h2{font-size:46px}
        .evPremiumModalFrequency>strong{font-size:30px}
        .evPremiumModalOffer,.evCheckoutActions{grid-template-columns:1fr}
        .evCheckoutActions .evPremiumSecondary{margin-top:0}
        .evCheckoutBackdrop{align-items:center;padding:10px;padding-top:max(10px,env(safe-area-inset-top));padding-right:max(10px,env(safe-area-inset-right));padding-bottom:max(10px,env(safe-area-inset-bottom));padding-left:max(10px,env(safe-area-inset-left))}
        .evCheckoutModal{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);padding:0;border-radius:24px}
        .evCheckoutForm,.evRestorePanel,.evPremiumSuccess{padding:24px 22px 22px}
        .evCheckoutModal .evPremiumModalClose{top:14px;right:14px;width:44px;height:44px}
        .evCheckoutEyebrow{font-size:12px;padding-right:48px}
        .evCheckoutForm h2,.evRestorePanel h2,.evPremiumSuccess h2{margin-top:10px;font-size:44px}
        .evCheckoutPrice{align-items:flex-start;flex-direction:column;gap:4px;margin-top:16px}
        .evCheckoutPrice strong{font-size:38px}
        .evCheckoutPrice span{padding:0;font-size:14px}
        .evCheckoutValue{margin-top:24px}
        .evCheckoutValue>h3{margin-bottom:10px;font-size:16px}
        .evCheckoutBenefitGrid{grid-template-columns:1fr;gap:9px}
        .evCheckoutBenefitCard{min-height:0;padding:14px;border-radius:16px}
        .evCheckoutBenefitIcon{width:31px;height:31px;border-radius:10px}
        .evCheckoutBenefitCard strong{font-size:14.5px}
        .evCheckoutBenefitCard p{margin-top:5px;font-size:13px;line-height:1.45}
        .evCheckoutBenefitMeta{margin-top:11px;font-size:12px}
        .evCheckoutBenefitMeta span+span:before{margin:0 6px}
        .evFounderPromise{margin-top:13px;padding:11px 12px}
        .evFounderPromise p{font-size:12.5px}
        .evCheckoutCurrency{margin-top:17px;padding:15px 16px}
        .evCheckoutCurrency strong{font-size:23px}
        .evCheckoutCurrency small{font-size:13px}
        .evSquareSecureLabel{margin-top:19px;font-size:13px}
        .evSquareCard{margin-top:8px;border-radius:16px}
        .evPayButton{min-height:58px;margin-top:16px;font-size:13.5px!important;letter-spacing:.04em;white-space:nowrap}
        .evSquareTrust{font-size:12px}
        .evCheckoutFinePrint{margin-top:14px;font-size:12px}
        .evCheckoutForm>.evRestoreInline{font-size:13px}
        .evRestorePanel>p,.evPremiumSuccess>h3{font-size:13.5px}
        .evProductFooter{padding:22px 18px}}
        @media(max-width:390px){.evPremiumCategoryTabs button{min-width:190px}.evPremiumCategoryTabs strong{font-size:19px}.evPremiumCategoryTabs small{font-size:13px}
        .evPremiumSignalGrid{grid-template-columns:1fr}
        .evPremiumSignalCard{min-height:205px}
        .evCheckoutForm h2,.evRestorePanel h2,.evPremiumSuccess h2{font-size:40px}
        .evCheckoutPrice strong{font-size:36px}
        .evCheckoutForm,.evRestorePanel,.evPremiumSuccess{padding-left:20px;padding-right:20px}
        .evPayButton{font-size:12.8px!important;letter-spacing:.025em}}
        @media(prefers-reduced-motion:reduce){.evCheckoutBenefitCard{transition:none}.evPayButton:not(:disabled):after,.evPremiumSignalCard.premium:before{animation:none;display:none}}
      `}</style>
    </>
  );
}
