'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

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

const premiumCategories: PremiumCategory[] = [
  { id: 'study', title: 'Study & Memory', subtitle: 'Learn. Read. Retain.', icon: '⌁' },
  { id: 'work', title: 'Deep Work', subtitle: 'Lock in. Create. Execute.', icon: '⚡' },
  { id: 'meditation', title: 'Meditation', subtitle: 'Slow down. Go inward.', icon: '◌' },
  { id: 'sleep', title: 'Sleep', subtitle: 'Disconnect. Slow down. Rest.', icon: '☾' },
  { id: 'ritual', title: 'Manifestation & Ritual', subtitle: 'Intention. Visualization. Ritual.', icon: '∞' }
];

const premiumSignals: PremiumSignal[] = [
  { id: 'alpha-10', category: 'study', family: 'Alpha', hz: 10, label: 'Calm Focus', purpose: 'Study, reading and steady concentration.', description: 'The free Alpha flagship for calm, sustained concentration.', premium: false, pure: false, soundProfile: 'clean', freeStateId: 'alpha', leftHz: 180, rightHz: 190 },
  { id: 'alpha-8', category: 'study', family: 'Alpha', hz: 8, label: 'Relaxed Study', purpose: 'A slower Alpha experience for relaxed reading and study.', description: 'Clean binaural signal with a restrained, distraction-free presentation.', premium: true, pure: false, soundProfile: 'clean', leftHz: 180, rightHz: 188 },
  { id: 'alpha-12', category: 'study', family: 'Alpha', hz: 12, label: 'Active Learning', purpose: 'A brighter Alpha experience for active learning and review.', description: 'Clean binaural signal designed to remain simple and precise.', premium: true, pure: false, soundProfile: 'clean', leftHz: 180, rightHz: 192 },
  { id: 'smr-14', category: 'study', family: 'SMR', hz: 14, label: 'Steady Attention', purpose: 'A steady-attention signal with an extremely subtle support layer.', description: 'Minimal binaural signal with a quiet tonal bed beneath the main signal.', premium: true, pure: false, soundProfile: 'focus', leftHz: 180, rightHz: 194 },
  { id: 'beta-18', category: 'study', family: 'Beta', hz: 18, label: 'Mental Drive', purpose: 'A more active focus experience for demanding study blocks.', description: 'Binaural focus signal with a restrained modern texture.', premium: true, pure: false, soundProfile: 'focus', leftHz: 180, rightHz: 198 },

  { id: 'gamma-40', category: 'work', family: 'Gamma', hz: 40, label: 'Deep Focus', purpose: 'Demanding work, research and high-attention sessions.', description: 'The free Gamma flagship for demanding focus sessions.', premium: false, pure: false, soundProfile: 'clean', freeStateId: 'gamma', leftHz: 220, rightHz: 260 },
  { id: 'beta-15', category: 'work', family: 'Beta', hz: 15, label: 'Focus Mode', purpose: 'A clean, minimal signal for focused execution.', description: 'Minimal binaural presentation with no distracting sound bed.', premium: true, pure: false, soundProfile: 'clean', leftHz: 200, rightHz: 215 },
  { id: 'beta-20', category: 'work', family: 'Beta', hz: 20, label: 'High Attention', purpose: 'An active focus signal with a subtle futuristic pulse.', description: 'Binaural signal supported by a quiet digital pulse and spacious texture.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 200, rightHz: 220 },
  { id: 'gamma-30', category: 'work', family: 'Gamma', hz: 30, label: 'Creative Flow', purpose: 'A futuristic Gamma experience for creative production.', description: 'Binaural signal with a low synthetic pad and gentle stereo movement.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 200, rightHz: 230 },
  { id: 'gamma-35', category: 'work', family: 'Gamma', hz: 35, label: 'Deep Execution', purpose: 'A deeper sci-fi productivity atmosphere for concentrated execution.', description: 'Binaural signal with a subtle technological soundscape kept beneath the core tone.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 200, rightHz: 235 },

  { id: 'theta-4', category: 'meditation', family: 'Theta', hz: 4, label: 'Creative Flow', purpose: 'Writing, reflection, meditation and ideation.', description: 'The free Theta flagship for reflective and meditative sessions.', premium: false, pure: false, soundProfile: 'clean', freeStateId: 'theta', leftHz: 95, rightHz: 99 },
  { id: 'theta-5', category: 'meditation', family: 'Theta', hz: 5, label: 'Inner Stillness', purpose: 'A soft inward signal with a quiet atmospheric pad.', description: 'Binaural signal supported by a warm, spacious tonal bed.', premium: true, pure: false, soundProfile: 'meditative', leftHz: 95, rightHz: 100 },
  { id: 'theta-6', category: 'meditation', family: 'Theta', hz: 6, label: 'Deep Meditation', purpose: 'A spacious meditative experience with slow harmonic movement.', description: 'Binaural signal with soft harmonics and a wide, calm atmosphere.', premium: true, pure: false, soundProfile: 'meditative', leftHz: 95, rightHz: 101 },
  { id: 'theta-7', category: 'meditation', family: 'Theta', hz: 7, label: 'Mindful Awareness', purpose: 'A gentle Theta signal with light airy movement.', description: 'Binaural signal with a quiet, breathable ambient texture.', premium: true, pure: false, soundProfile: 'meditative', leftHz: 95, rightHz: 102 },
  { id: 'alpha-9', category: 'meditation', family: 'Alpha', hz: 9, label: 'Calm Presence', purpose: 'A mostly clean Alpha experience for calm presence.', description: 'Simple binaural presentation with minimal added texture.', premium: true, pure: false, soundProfile: 'clean', leftHz: 180, rightHz: 189 },

  { id: 'delta-2', category: 'sleep', family: 'Delta', hz: 2, label: 'Deep Rest', purpose: 'Wind-down rituals, recovery and sleep preparation.', description: 'The free Delta flagship for quiet nighttime sessions.', premium: false, pure: false, soundProfile: 'clean', freeStateId: 'delta', leftHz: 70, rightHz: 72 },
  { id: 'delta-1', category: 'sleep', family: 'Delta', hz: 1, label: 'Deep Rest', purpose: 'A very slow Delta signal with a deep warm ambience.', description: 'Binaural signal with a soft low atmosphere and no sudden movement.', premium: true, pure: false, soundProfile: 'sleep', leftHz: 70, rightHz: 71 },
  { id: 'delta-1-5', category: 'sleep', family: 'Delta', hz: 1.5, label: 'Night Drift', purpose: 'A clean low-frequency difference for quiet nighttime listening.', description: 'A deliberately simple binaural signal with no added effects.', premium: true, pure: false, soundProfile: 'clean', leftHz: 70, rightHz: 71.5 },
  { id: 'delta-2-5', category: 'sleep', family: 'Delta', hz: 2.5, label: 'Slow Descent', purpose: 'A slow Delta signal supported by a dark filtered-noise bed.', description: 'Binaural signal with a soft brown-noise-style texture underneath.', premium: true, pure: false, soundProfile: 'sleep', leftHz: 70, rightHz: 72.5 },
  { id: 'delta-3', category: 'sleep', family: 'Delta', hz: 3, label: 'Sleep Preparation', purpose: 'A gentle nighttime signal with a soft dark atmosphere.', description: 'Binaural signal with a warm low pad intended to stay unobtrusive.', premium: true, pure: false, soundProfile: 'sleep', leftHz: 70, rightHz: 73 },

  { id: 'pure-888', category: 'ritual', family: 'Pure Tone', hz: 888, label: 'Abundance', purpose: 'Visualization, intention and ceremonial sessions.', description: 'The free 888 Hz pure-tone flagship, presented cleanly.', premium: false, pure: true, soundProfile: 'clean', freeStateId: 'abundance', pureHz: 888 },
  { id: 'pure-222', category: 'ritual', family: 'Pure Tone', hz: 222, label: 'Alignment', purpose: 'A warm ritual listening space for intention and visualization.', description: 'Pure tone with a soft shimmer, distant airy chime and gentle pad.', premium: true, pure: true, soundProfile: 'ritual', pureHz: 222 },
  { id: 'pure-444', category: 'ritual', family: 'Pure Tone', hz: 444, label: 'Grounded Intention', purpose: 'A grounded ceremonial listening experience.', description: 'Pure tone with a dark low drone, subtle metallic shimmer and slow pulse.', premium: true, pure: true, soundProfile: 'ritual', pureHz: 444 },
  { id: 'pure-528', category: 'ritual', family: 'Pure Tone', hz: 528, label: 'Renewal', purpose: 'A warm, expansive ritual listening experience.', description: 'Pure tone with a luminous pad, soft harmonic swell and sparse chime accents.', premium: true, pure: true, soundProfile: 'ritual', pureHz: 528 },
  { id: 'pure-963', category: 'ritual', family: 'Pure Tone', hz: 963, label: 'Higher Awareness', purpose: 'A celestial ritual listening space for reflection and intention.', description: 'Pure tone with a very soft high shimmer, wide pad and slow atmospheric movement.', premium: true, pure: true, soundProfile: 'ritual', pureHz: 963 }
];

const premiumSignalCount = premiumSignals.filter((signal) => signal.premium).length;
const totalSignalCount = premiumSignals.length;
const premiumCollectionCount = premiumCategories.length;
const founderPriceLabel = 'CA$9.99';
const previewDurationSeconds = 24;

function createNoiseBuffer(context: AudioContext, seconds = 2) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
}

export default function V10ProductFlow() {
  const pathname = usePathname();
  const active = pathname === '/voyage';
  const [premiumMount, setPremiumMount] = useState<HTMLElement | null>(null);
  const [aboutMount, setAboutMount] = useState<HTMLElement | null>(null);
  const [footerMount, setFooterMount] = useState<HTMLElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PremiumCategoryId>('study');
  const [previewSignal, setPreviewSignal] = useState<PremiumSignal | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewSeconds, setPreviewSeconds] = useState(previewDurationSeconds);
  const [previewMessage, setPreviewMessage] = useState('');
  const audioCleanupRef = useRef<(() => void) | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const previewTickRef = useRef<number | null>(null);

  const categorySignals = useMemo(
    () => premiumSignals.filter((signal) => signal.category === selectedCategory),
    [selectedCategory]
  );

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
      setPreviewMessage('End or close the active Voyage before previewing another signal.');
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

      const sources: AudioScheduledSourceNode[] = [];
      const nodes: AudioNode[] = [master];
      const registerSource = <T extends AudioScheduledSourceNode>(source: T) => {
        sources.push(source);
        nodes.push(source);
        return source;
      };

      if (signal.pure && signal.pureHz) {
        const oscillator = registerSource(context.createOscillator());
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(signal.pureHz, now);
        const signalGain = context.createGain();
        signalGain.gain.value = 0.72;
        nodes.push(signalGain);
        oscillator.connect(signalGain);
        signalGain.connect(master);
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

      if (signal.soundProfile === 'focus') addPad(110, 0.035, 'sine');

      if (signal.soundProfile === 'futuristic') {
        addPad(55, 0.026, 'triangle');
        addFilteredNoise(720, 0.018, 'bandpass');
        const pulse = registerSource(context.createOscillator());
        const pulseGain = context.createGain();
        const pulseDepth = context.createGain();
        pulse.type = 'sine';
        pulse.frequency.value = 0.17;
        pulseDepth.gain.value = 0.012;
        pulseGain.gain.value = 0.018;
        pulse.connect(pulseDepth);
        pulseDepth.connect(pulseGain.gain);
        const bed = registerSource(context.createOscillator());
        bed.type = 'sine';
        bed.frequency.value = 165;
        bed.connect(pulseGain);
        pulseGain.connect(master);
        nodes.push(pulseGain, pulseDepth);
        pulse.start(now);
        bed.start(now);
      }

      if (signal.soundProfile === 'meditative') {
        addPad(110, 0.028, 'sine');
        addPad(220, 0.012, 'sine');
      }

      if (signal.soundProfile === 'sleep') {
        addPad(55, 0.026, 'sine');
        addFilteredNoise(420, 0.022, 'lowpass');
      }

      if (signal.soundProfile === 'ritual') {
        const base = signal.pureHz ? Math.max(74, signal.pureHz / 4) : 111;
        addPad(base, 0.03, 'sine');
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
        } catch {
          // Audio may already be closing.
        }
        window.setTimeout(() => {
          sources.forEach((source) => {
            try { source.stop(); } catch { /* already stopped */ }
          });
          nodes.forEach((node) => {
            try { node.disconnect(); } catch { /* already disconnected */ }
          });
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

  const openSignal = (signal: PremiumSignal) => {
    stopPreview();
    setPreviewMessage('');
    if (!signal.premium && signal.freeStateId) {
      const button = document.querySelector<HTMLButtonElement>(`.stateChoice.${signal.freeStateId}`);
      button?.click();
      document.getElementById('session-builder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setPreviewSignal(signal);
  };

  const explorePremium = () => document.getElementById('ev-premium-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const startCheckout = () => {
    const checkoutUrl = process.env.NEXT_PUBLIC_EVERLASTING_FOUNDER_CHECKOUT_URL;
    if (checkoutUrl) {
      window.location.assign(checkoutUrl);
      return;
    }
    setPreviewMessage('Founder checkout is being connected for launch. Premium previews are already available.');
    explorePremium();
  };

  useEffect(() => {
    document.body.classList.toggle('ev-product-route', active);
    if (!active) return () => document.body.classList.remove('ev-product-route');

    const hero = document.querySelector<HTMLElement>('.heroSection');
    const join = document.querySelector<HTMLElement>('.joinSection');
    if (!join) return;

    const premiumRoot = document.createElement('div');
    premiumRoot.id = 'ev-premium-root';
    if (hero) hero.insertAdjacentElement('afterend', premiumRoot);
    else join.insertAdjacentElement('beforebegin', premiumRoot);

    const aboutRoot = document.createElement('div');
    aboutRoot.id = 'ev-about-root';
    join.insertAdjacentElement('beforebegin', aboutRoot);

    const footerRoot = document.createElement('div');
    footerRoot.id = 'ev-footer-root';
    join.insertAdjacentElement('afterend', footerRoot);

    setPremiumMount(premiumRoot);
    setAboutMount(aboutRoot);
    setFooterMount(footerRoot);

    const handleVoyageStart = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('.builderActions .primaryButton')) stopPreview();
    };
    document.addEventListener('click', handleVoyageStart, true);

    return () => {
      document.removeEventListener('click', handleVoyageStart, true);
      document.body.classList.remove('ev-product-route');
      stopPreview();
      premiumRoot.remove();
      aboutRoot.remove();
      footerRoot.remove();
      setPremiumMount(null);
      setAboutMount(null);
      setFooterMount(null);
    };
  }, [active, stopPreview]);

  useEffect(() => () => stopPreview(), [stopPreview]);

  if (!active) return null;

  return (
    <>
      {premiumMount && createPortal(
        <>
          <section className="evPremiumLaunch section" aria-labelledby="ev-premium-title">
            <article className="evPremiumShowcase">
              <div className="evPremiumGlow evPremiumGlowOne" aria-hidden="true" />
              <div className="evPremiumGlow evPremiumGlowTwo" aria-hidden="true" />
              <div className="evPremiumShowcaseCopy">
                <div className="evPremiumKickerRow">
                  <span className="evPremiumKicker">Everlasting Premium</span>
                  <span className="evFounderBadge">Founding access</span>
                </div>
                <h2 id="ev-premium-title">Your Voyage is unlimited. Premium lets you go deeper.</h2>
                <p>Unlock {premiumSignalCount} additional signals across Study, Deep Work, Meditation, Sleep and Manifestation — including exclusive immersive sound experiences.</p>
                <div className="evPremiumBenefitRow" aria-label="Premium benefits">
                  <span>{premiumSignalCount} premium signals</span><span>{premiumCollectionCount} collections</span><span>Exclusive soundscapes</span><span>Unlimited Voyages</span><span>No ads</span>
                </div>
              </div>
              <div className="evPremiumOffer">
                <span className="evPremiumOfferLabel">Founding member access</span>
                <strong>{founderPriceLabel}</strong>
                <small>One time · No subscription</small>
                <button type="button" className="evPremiumPrimary" onClick={startCheckout}>Unlock Premium</button>
                <button type="button" className="evPremiumSecondary" onClick={explorePremium}>Explore premium signals</button>
                <p>The core Everlasting Voyage experience remains free.</p>
              </div>
            </article>
          </section>

          <section className="evPremiumLibrary section" id="ev-premium-library" aria-labelledby="ev-library-title">
            <div className="evPremiumLibraryHeader">
              <div><p className="eyebrow">Premium signal library</p><h2 id="ev-library-title">{totalSignalCount} signals. Five ways to enter.</h2></div>
              <p>Every collection includes a free flagship. Premium opens four deeper signal experiences in each state.</p>
            </div>
            <div className="evPremiumCategoryTabs" role="tablist" aria-label="Premium frequency collections">
              {premiumCategories.map((category) => (
                <button key={category.id} type="button" role="tab" aria-selected={selectedCategory === category.id} className={selectedCategory === category.id ? 'active' : ''} onClick={() => setSelectedCategory(category.id)}>
                  <span aria-hidden="true">{category.icon}</span><strong>{category.title}</strong><small>{category.subtitle}</small>
                </button>
              ))}
            </div>
            <div className="evPremiumSignalGrid" role="tabpanel">
              {categorySignals.map((signal) => (
                <button key={signal.id} type="button" className={`evPremiumSignalCard ${signal.premium ? 'premium' : 'free'} ${signal.soundProfile}`} onClick={() => openSignal(signal)}>
                  <span className="evSignalCardTopline"><span>{signal.premium ? 'Premium' : 'Free flagship'}</span><i aria-hidden="true">{signal.premium ? '◇' : '✓'}</i></span>
                  <strong>{signal.family}</strong><b>{signal.hz} Hz</b><span className="evSignalPurpose">{signal.label}</span><small>{signal.purpose}</small><span className="evSignalAction">{signal.premium ? 'Preview signal →' : 'Use free signal →'}</span>
                </button>
              ))}
            </div>
            <div className="evPremiumLibraryNote"><span>Premium is an expansion, not a gate.</span><p>Unlimited free Voyages remain available with the five original signals.</p></div>
          </section>
        </>, premiumMount
      )}

      {aboutMount && createPortal(
        <section className="evAboutCompact section" id="about" aria-labelledby="ev-about-title">
          <div className="evAboutHeader"><div><p className="eyebrow">About Everlasting Voyage</p><h2 id="ev-about-title">Three choices. One focused environment.</h2></div><p>Pure frequencies, a precise timer and one clear intention live together without feeds, comments or setup friction.</p></div>
          <div className="evAboutRitual" aria-label="How Everlasting Voyage works"><article><span>01</span><strong>Choose your state</strong><p>Select the atmosphere that matches the moment.</p></article><i aria-hidden="true">→</i><article><span>02</span><strong>Set your time</strong><p>Choose a session length and one intention.</p></article><i aria-hidden="true">→</i><article><span>03</span><strong>Enter the voyage</strong><p>Signal, timer and thought capture remain together.</p></article></div>
          <div className="evAboutSignals"><span>Pure signals</span><span>Built for sessions</span><span>No forced setup</span><span>Saved spaces</span></div>
        </section>, aboutMount
      )}

      {footerMount && createPortal(
        <footer className="evProductFooter">
          <a href="/" className="evFooterBrand" aria-label="Everlasting Voyage entrance"><img src="/brand-infinity.png" alt="" /><img src="/brand-wordmark.png" alt="Everlasting Voyage" /></a>
          <nav aria-label="Footer navigation"><a href="#session-builder">Build a voyage</a><a href="#ev-premium-library">Premium</a><a href="#library">Frequencies</a><a href="#about">About</a><a href="#join">Early access</a></nav>
          <p>© 2026 Everlasting Voyage. Pure signals, clearly presented.</p>
        </footer>, footerMount
      )}

      {previewSignal && createPortal(
        <div className="evPremiumModalBackdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closePreview(); }}>
          <article className={`evPremiumModal ${previewSignal.soundProfile}`} role="dialog" aria-modal="true" aria-labelledby="ev-preview-title">
            <button type="button" className="evPremiumModalClose" onClick={closePreview} aria-label="Close premium preview">×</button>
            <div className="evPremiumModalMeta"><span>Premium signal</span><span>{premiumCategories.find((category) => category.id === previewSignal.category)?.title}</span></div>
            <h2 id="ev-preview-title">{previewSignal.family} <strong>{previewSignal.hz} Hz</strong></h2><h3>{previewSignal.label}</h3><p>{previewSignal.description}</p>
            <div className="evPremiumSoundProfile"><span>Sound profile</span><strong>{previewSignal.soundProfile === 'ritual' ? 'Ritual soundscape' : previewSignal.soundProfile === 'futuristic' ? 'Futuristic focus' : previewSignal.soundProfile === 'sleep' ? 'Sleep ambience' : previewSignal.soundProfile === 'meditative' ? 'Meditative ambience' : previewSignal.soundProfile === 'focus' ? 'Minimal focus bed' : 'Clean signal'}</strong></div>
            <div className="evPremiumPreviewControls">
              <button type="button" className={`evPreviewButton ${previewing ? 'playing' : ''}`} onClick={() => previewing ? stopPreview() : startPreview(previewSignal)}>{previewing ? `Stop preview · ${previewSeconds}s` : `Preview ${previewDurationSeconds} seconds`}</button>
              <small>{previewSignal.pure ? `Pure ${previewSignal.pureHz} Hz tone` : `Left ${previewSignal.leftHz} Hz · Right ${previewSignal.rightHz} Hz · ${previewSignal.hz} Hz difference`}</small>
            </div>
            {previewMessage ? <p className="evPremiumMessage" role="status">{previewMessage}</p> : null}
            <div className="evPremiumModalOffer"><div><span>Founding access</span><strong>{founderPriceLabel}</strong><small>One time</small></div><button type="button" className="evPremiumPrimary" onClick={startCheckout}>Unlock Premium</button></div>
            <button type="button" className="evContinueFree" onClick={closePreview}>Continue with the free library</button>
          </article>
        </div>, document.body
      )}

      <style>{`
        .evPremiumLaunch{padding-top:18px!important;padding-bottom:34px!important}.evPremiumShowcase{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.55fr) minmax(260px,.65fr);gap:30px;align-items:stretch;padding:clamp(26px,4vw,48px);border:1px solid rgba(116,192,255,.17);border-radius:30px;background:linear-gradient(135deg,rgba(4,17,39,.94),rgba(5,10,31,.92) 54%,rgba(18,8,43,.9));box-shadow:0 30px 90px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.035)}.evPremiumGlow{position:absolute;width:320px;height:320px;border-radius:50%;filter:blur(80px);opacity:.18;pointer-events:none}.evPremiumGlowOne{top:-180px;left:16%;background:#27b8ff}.evPremiumGlowTwo{right:-130px;bottom:-210px;background:#8658ff}.evPremiumShowcaseCopy,.evPremiumOffer{position:relative;z-index:1}.evPremiumKickerRow{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:20px}.evPremiumKicker,.evFounderBadge{display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;font-size:10px;line-height:1;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.evPremiumKicker{color:#9ce8ff;border:1px solid rgba(93,201,255,.28);background:rgba(29,128,194,.1)}.evFounderBadge{color:#d9c9ff;border:1px solid rgba(166,126,255,.25);background:rgba(119,74,213,.1)}.evPremiumShowcase h2,.evPremiumLibraryHeader h2{margin:0;color:#f3f8ff;font-size:clamp(30px,4.2vw,58px);line-height:.98;letter-spacing:-.045em;max-width:900px}.evPremiumShowcaseCopy>p{max-width:780px;margin:22px 0 0;color:rgba(220,235,249,.7);font-size:clamp(15px,1.5vw,18px);line-height:1.65}.evPremiumBenefitRow{display:flex;flex-wrap:wrap;gap:9px;margin-top:26px}.evPremiumBenefitRow span{padding:9px 12px;border-radius:999px;border:1px solid rgba(139,197,255,.12);color:rgba(222,239,255,.8);background:rgba(255,255,255,.025);font-size:11px;font-weight:700;letter-spacing:.04em}.evPremiumOffer{display:flex;flex-direction:column;justify-content:center;align-items:stretch;padding:24px;border-radius:24px;border:1px solid rgba(160,202,255,.14);background:linear-gradient(180deg,rgba(20,40,72,.42),rgba(8,12,29,.5))}.evPremiumOfferLabel{color:rgba(201,226,248,.63);font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.evPremiumOffer>strong{margin-top:9px;color:#fff;font-size:34px;letter-spacing:-.04em}.evPremiumOffer>small{color:rgba(220,232,246,.58);margin:2px 0 20px}.evPremiumPrimary,.evPremiumSecondary,.evPreviewButton{border:0;cursor:pointer;font:inherit}.evPremiumPrimary{min-height:48px;padding:0 18px;border-radius:14px;color:#03101c;background:linear-gradient(135deg,#95e7ff,#67b7ff 56%,#9f8cff);box-shadow:0 12px 34px rgba(72,167,255,.18);font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.evPremiumSecondary{margin-top:9px;min-height:42px;border-radius:13px;color:#cfeaff;border:1px solid rgba(130,200,255,.14);background:rgba(255,255,255,.025);font-size:11px;font-weight:800}.evPremiumOffer>p{margin:15px 0 0;text-align:center;color:rgba(210,228,244,.5);font-size:10px;line-height:1.5}.evPremiumLibrary{padding-top:38px!important}.evPremiumLibraryHeader{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(250px,.7fr);gap:28px;align-items:end;margin-bottom:26px}.evPremiumLibraryHeader h2{font-size:clamp(30px,3.8vw,50px)}.evPremiumLibraryHeader>p{margin:0;color:rgba(216,232,248,.6);line-height:1.7}.evPremiumCategoryTabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:14px;overflow:auto;scrollbar-width:none}.evPremiumCategoryTabs::-webkit-scrollbar{display:none}.evPremiumCategoryTabs button{min-width:150px;min-height:96px;padding:15px;text-align:left;border:1px solid rgba(115,181,236,.1);border-radius:17px;color:rgba(213,231,247,.63);background:rgba(5,15,32,.5);cursor:pointer;transition:border-color .2s ease,background .2s ease,transform .2s ease}.evPremiumCategoryTabs button:hover{transform:translateY(-2px);border-color:rgba(113,196,255,.2)}.evPremiumCategoryTabs button.active{color:#ebf8ff;border-color:rgba(96,197,255,.34);background:linear-gradient(145deg,rgba(25,91,137,.23),rgba(36,29,91,.22));box-shadow:inset 0 0 30px rgba(73,168,255,.04)}.evPremiumCategoryTabs button>span{display:block;color:#83ddff;font-size:18px}.evPremiumCategoryTabs strong{display:block;margin-top:7px;font-size:12px}.evPremiumCategoryTabs small{display:block;margin-top:4px;color:rgba(203,225,243,.44);font-size:9px;line-height:1.35}.evPremiumSignalGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.evPremiumSignalCard{position:relative;min-height:250px;padding:19px;overflow:hidden;text-align:left;border-radius:20px;border:1px solid rgba(112,179,235,.11);color:#dff2ff;background:linear-gradient(155deg,rgba(7,24,47,.83),rgba(3,10,23,.95));cursor:pointer;transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}.evPremiumSignalCard:hover{transform:translateY(-3px);border-color:rgba(102,198,255,.25);box-shadow:0 20px 42px rgba(0,0,0,.22)}.evPremiumSignalCard.premium:after{content:'';position:absolute;width:130px;height:130px;top:-70px;right:-55px;border-radius:50%;background:#6d5cff;filter:blur(55px);opacity:.16}.evPremiumSignalCard.futuristic:after{background:#16c8ff;opacity:.2}.evPremiumSignalCard.ritual:after{background:#9f72ff;opacity:.23}.evPremiumSignalCard.sleep:after{background:#3560ff;opacity:.13}.evPremiumSignalCard.free{border-color:rgba(93,211,255,.19)}.evSignalCardTopline{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;align-items:center;color:rgba(181,216,243,.48);font-size:8px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.evSignalCardTopline i{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;color:#a7e8ff;border:1px solid rgba(117,207,255,.17);font-style:normal}.evPremiumSignalCard>strong{position:relative;z-index:1;display:block;margin-top:22px;color:rgba(214,236,252,.72);font-size:11px;letter-spacing:.08em;text-transform:uppercase}.evPremiumSignalCard>b{position:relative;z-index:1;display:block;margin-top:2px;color:#f4fbff;font-size:clamp(27px,2.3vw,35px);letter-spacing:-.045em}.evSignalPurpose{position:relative;z-index:1;display:block;margin-top:9px;color:#9fdfff;font-size:12px;font-weight:800}.evPremiumSignalCard>small{position:relative;z-index:1;display:block;margin-top:7px;color:rgba(211,230,245,.48);line-height:1.5;font-size:9px}.evSignalAction{position:absolute;z-index:1;left:19px;bottom:18px;color:rgba(184,226,255,.72);font-size:9px;font-weight:800;letter-spacing:.05em}.evPremiumLibraryNote{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-top:14px;padding:16px 18px;border:1px solid rgba(116,180,231,.08);border-radius:15px;background:rgba(255,255,255,.018)}.evPremiumLibraryNote span{color:#bfeaff;font-size:11px;font-weight:800}.evPremiumLibraryNote p{margin:0;color:rgba(210,228,243,.45);font-size:10px}.evPremiumModalBackdrop{position:fixed;inset:0;z-index:1700;display:grid;place-items:center;padding:18px;background:rgba(0,4,13,.74);backdrop-filter:blur(15px)}.evPremiumModal{position:relative;width:min(560px,100%);max-height:min(760px,calc(100dvh - 36px));overflow:auto;padding:clamp(24px,4vw,38px);border-radius:27px;border:1px solid rgba(116,197,255,.2);color:#eef9ff;background:radial-gradient(circle at 80% -10%,rgba(77,94,255,.18),transparent 35%),linear-gradient(150deg,rgba(7,24,48,.99),rgba(3,8,20,.99));box-shadow:0 34px 110px rgba(0,0,0,.56)}.evPremiumModal.ritual{background:radial-gradient(circle at 80% -10%,rgba(150,93,255,.22),transparent 38%),linear-gradient(150deg,rgba(17,16,47,.99),rgba(4,7,19,.99))}.evPremiumModal.futuristic{background:radial-gradient(circle at 80% -10%,rgba(24,194,255,.2),transparent 38%),linear-gradient(150deg,rgba(5,28,48,.99),rgba(3,8,20,.99))}.evPremiumModalClose{position:absolute;top:16px;right:16px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(136,202,255,.13);color:#dff6ff;background:rgba(255,255,255,.035);cursor:pointer;font-size:22px}.evPremiumModalMeta{display:flex;flex-wrap:wrap;gap:8px;padding-right:44px}.evPremiumModalMeta span{padding:7px 9px;border-radius:999px;border:1px solid rgba(130,201,255,.14);color:rgba(189,226,251,.62);background:rgba(255,255,255,.025);font-size:8px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.evPremiumModal h2{margin:27px 0 0;font-size:clamp(36px,7vw,60px);line-height:.95;letter-spacing:-.05em}.evPremiumModal h2 strong{color:#94e4ff;font-weight:inherit}.evPremiumModal h3{margin:12px 0 0;color:#cbefff;font-size:16px}.evPremiumModal>p{color:rgba(213,232,247,.6);line-height:1.65}.evPremiumSoundProfile{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:22px;padding:14px 15px;border-radius:14px;border:1px solid rgba(115,190,246,.1);background:rgba(255,255,255,.022)}.evPremiumSoundProfile span{color:rgba(202,225,244,.45);font-size:9px;text-transform:uppercase;letter-spacing:.11em}.evPremiumSoundProfile strong{color:#cdefff;font-size:11px}.evPremiumPreviewControls{margin-top:12px;padding:16px;border-radius:15px;border:1px solid rgba(104,194,255,.12);background:rgba(14,48,78,.14)}.evPreviewButton{width:100%;min-height:48px;border-radius:13px;color:#e5f8ff;border:1px solid rgba(106,204,255,.24);background:linear-gradient(135deg,rgba(48,141,202,.2),rgba(93,77,191,.18));font-size:11px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}.evPreviewButton.playing{box-shadow:inset 0 0 26px rgba(75,195,255,.1)}.evPremiumPreviewControls small{display:block;margin-top:10px;text-align:center;color:rgba(192,218,239,.42);font-size:9px}.evPremiumMessage{margin:12px 0 0!important;padding:11px 13px;border-radius:12px;border:1px solid rgba(114,196,255,.13);background:rgba(31,91,128,.1);color:#bfe9ff!important;font-size:10px}.evPremiumModalOffer{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center;margin-top:18px;padding-top:18px;border-top:1px solid rgba(150,195,230,.09)}.evPremiumModalOffer>div span,.evPremiumModalOffer>div small{display:block;color:rgba(202,224,242,.46);font-size:9px}.evPremiumModalOffer>div strong{display:block;margin:2px 0;font-size:28px;letter-spacing:-.04em}.evContinueFree{display:block;margin:14px auto 0;border:0;color:rgba(201,224,241,.5);background:transparent;cursor:pointer;font-size:10px;text-decoration:underline;text-underline-offset:3px}@media(max-width:980px){.evPremiumShowcase,.evPremiumLibraryHeader{grid-template-columns:1fr}.evPremiumOffer{max-width:460px}.evPremiumCategoryTabs{grid-template-columns:repeat(5,minmax(150px,1fr))}.evPremiumSignalGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.evPremiumLaunch{padding-top:10px!important;padding-bottom:18px!important}.evPremiumShowcase{gap:22px;padding:23px 18px;border-radius:23px}.evPremiumShowcase h2{font-size:34px}.evPremiumShowcaseCopy>p{margin-top:16px;font-size:14px}.evPremiumBenefitRow{gap:7px;margin-top:18px}.evPremiumBenefitRow span{font-size:9px;padding:8px 10px}.evPremiumOffer{padding:18px;border-radius:18px}.evPremiumLibrary{padding-top:22px!important}.evPremiumLibraryHeader{gap:12px;margin-bottom:18px}.evPremiumLibraryHeader h2{font-size:32px}.evPremiumLibraryHeader>p{font-size:12px}.evPremiumCategoryTabs{margin-right:-18px;padding-right:18px}.evPremiumCategoryTabs button{min-width:138px;min-height:88px;padding:13px}.evPremiumSignalGrid{grid-template-columns:1fr 1fr;gap:8px}.evPremiumSignalCard{min-height:225px;padding:16px 14px;border-radius:17px}.evPremiumSignalCard>b{font-size:27px}.evSignalAction{left:14px;bottom:15px;font-size:8px}.evPremiumLibraryNote{align-items:flex-start;flex-direction:column;gap:5px}.evPremiumModalBackdrop{padding:10px;align-items:end}.evPremiumModal{max-height:calc(100dvh - 20px);padding:25px 18px 22px;border-radius:24px 24px 18px 18px}.evPremiumModal h2{font-size:42px}.evPremiumModalOffer{grid-template-columns:1fr}}@media(max-width:390px){.evPremiumSignalGrid{grid-template-columns:1fr}.evPremiumSignalCard{min-height:205px}}
      `}</style>
    </>
  );
}
