'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { premiumAudioRecipes, type PremiumAudioRecipe } from './premium-audio-engine';

const FOUNDER_SPOTLIGHT_KEY = 'ev-founder-spotlight-last-v1253';
const FOUNDER_SPOTLIGHT_COOLDOWN_MS = 12 * 60 * 60 * 1000;

const sonicOverrides: Record<string, PremiumAudioRecipe> = {
  'alpha-12': {
    id: 'alpha-12', category: 'study', title: 'Memory Retention', soundIdentity: 'Luminous memory sequence',
    recommendedUse: 'A luminous study environment for focused review and information retention.',
    core: { type: 'binaural', targetDifferenceHz: 12, leftCarrierHz: 256, rightCarrierHz: 268, waveform: 'sine', gain: 0.46 },
    stems: [
      { id: 'memory-horizon', role: 'pad', gain: 0.095, rootHz: 196, waveform: 'sine', intervals: [0, 4, 7, 14], detuneCents: [-9, 0, 7], cutoffHz: 3900, movementHz: 0.018 },
      { id: 'memory-prism', role: 'glass', gain: 0.052, rootHz: 392, waveform: 'sine', intervals: [0, 5, 9, 16], detuneCents: [-5, 5], cutoffHz: 6100, movementHz: 0.083 },
      { id: 'memory-breathing-pulse', role: 'pulse', gain: 0.022, rootHz: 294, waveform: 'triangle', pulseHz: 0.19, pulseDepth: 0.34, cutoffHz: 2600 },
      { id: 'memory-study-space', role: 'sample', gain: 0.026, assetPath: '/audio/ambience/cafe-quiet-loop.m4a', startOffsetSeconds: 11 }
    ],
    events: [
      { id: 'memory-recall-phrase', role: 'motif', minIntervalSeconds: 13, maxIntervalSeconds: 27, probability: 0.84, gainMin: 0.028, gainMax: 0.043, panMin: -0.38, panMax: 0.38, frequenciesHz: [784, 988, 1176, 1568, 1318, 988, 1176, 880], durationSeconds: 7.4 },
      { id: 'memory-signature-bell', role: 'crystal', minIntervalSeconds: 24, maxIntervalSeconds: 46, probability: 0.58, gainMin: 0.018, gainMax: 0.03, panMin: -0.56, panMax: 0.56, frequenciesHz: [1568, 1976, 2352], durationSeconds: 2.6 }
    ],
    processing: { highpassHz: 40, lowpassHz: 6600, compressorThreshold: -23, compressorRatio: 3.1, stereoWidth: 0.82 },
    preview: { representativeEventAtSeconds: 2.8, fadeInSeconds: 0.34 }
  },
  'beta-18': {
    id: 'beta-18', category: 'study', title: 'Learning Momentum', soundIdentity: 'Uplifting kinetic study sequence',
    recommendedUse: 'Positive forward energy for active study, productive review and sustained learning.',
    core: { type: 'binaural', targetDifferenceHz: 18, leftCarrierHz: 216, rightCarrierHz: 234, waveform: 'sine', gain: 0.43 },
    stems: [
      { id: 'momentum-wide-synth', role: 'pad', gain: 0.09, rootHz: 165, waveform: 'triangle', intervals: [0, 7, 11, 14], detuneCents: [-10, 1, 8], cutoffHz: 4300, movementHz: 0.061 },
      { id: 'momentum-forward-pulse', role: 'pulse', gain: 0.052, rootHz: 330, waveform: 'triangle', pulseHz: 0.72, pulseDepth: 0.62, cutoffHz: 3300 },
      { id: 'momentum-counter-pulse', role: 'pulse', gain: 0.025, rootHz: 495, waveform: 'sine', pulseHz: 1.11, pulseDepth: 0.42, cutoffHz: 3900 },
      { id: 'momentum-spark-layer', role: 'glass', gain: 0.038, rootHz: 660, waveform: 'sine', intervals: [0, 5, 9, 12], detuneCents: [-4, 5], cutoffHz: 6500, movementHz: 0.118 },
      { id: 'momentum-air', role: 'noise', gain: 0.012, noiseColor: 'white', cutoffHz: 2500, movementHz: 0.052 }
    ],
    events: [
      { id: 'momentum-ascending-sequence', role: 'motif', minIntervalSeconds: 10, maxIntervalSeconds: 22, probability: 0.88, gainMin: 0.026, gainMax: 0.043, panMin: -0.52, panMax: 0.52, frequenciesHz: [495, 660, 742.5, 825, 990, 825, 1110, 1320], durationSeconds: 6.8 },
      { id: 'momentum-lift', role: 'swell', minIntervalSeconds: 19, maxIntervalSeconds: 37, probability: 0.65, gainMin: 0.018, gainMax: 0.032, panMin: -0.32, panMax: 0.32, frequenciesHz: [330, 495, 660], durationSeconds: 4.8 }
    ],
    processing: { highpassHz: 42, lowpassHz: 6900, compressorThreshold: -22, compressorRatio: 3.5, stereoWidth: 0.9 },
    preview: { representativeEventAtSeconds: 2.2, fadeInSeconds: 0.28 }
  },
  'gamma-30': {
    id: 'gamma-30', category: 'work', title: 'Creative Spark', soundIdentity: 'Prismatic creative motion',
    recommendedUse: 'Creative production, design and exploratory work with a brighter sense of movement.',
    core: { type: 'binaural', targetDifferenceHz: 30, leftCarrierHz: 190, rightCarrierHz: 220, waveform: 'sine', gain: 0.42 },
    stems: [
      { id: 'creative-prism-pad', role: 'pad', gain: 0.082, rootHz: 123.47, waveform: 'triangle', intervals: [0, 2, 7, 9, 14], detuneCents: [-8, 2, 9], cutoffHz: 4400, movementHz: 0.047 },
      { id: 'creative-pluck-glass', role: 'glass', gain: 0.058, rootHz: 493.88, waveform: 'sine', intervals: [0, 3, 7, 10, 14], detuneCents: [-5, 6], cutoffHz: 7200, movementHz: 0.132 },
      { id: 'creative-soft-clock', role: 'pulse', gain: 0.034, rootHz: 246.94, waveform: 'sine', pulseHz: 0.31, pulseDepth: 0.52, cutoffHz: 3600 },
      { id: 'creative-shimmer-air', role: 'noise', gain: 0.013, noiseColor: 'white', cutoffHz: 3200, movementHz: 0.071 }
    ],
    events: [
      { id: 'creative-idea-phrase', role: 'motif', minIntervalSeconds: 9, maxIntervalSeconds: 21, probability: 0.86, gainMin: 0.024, gainMax: 0.041, panMin: -0.68, panMax: 0.68, frequenciesHz: [493.88, 587.33, 739.99, 659.25, 880, 783.99, 987.77, 739.99], durationSeconds: 7.2 },
      { id: 'creative-color-shift', role: 'crystal', minIntervalSeconds: 17, maxIntervalSeconds: 34, probability: 0.62, gainMin: 0.016, gainMax: 0.03, panMin: -0.72, panMax: 0.72, frequenciesHz: [987.77, 1174.66, 1479.98], durationSeconds: 2.9 }
    ],
    processing: { highpassHz: 40, lowpassHz: 7400, compressorThreshold: -22, compressorRatio: 3.35, stereoWidth: 0.96 },
    preview: { representativeEventAtSeconds: 2.6, fadeInSeconds: 0.3 }
  }
};

// Only the three explicitly approved recipes are replaced. Every other recipe remains untouched.
Object.entries(sonicOverrides).forEach(([id, recipe]) => { premiumAudioRecipes[id] = recipe; });

function isFounderPremiumActive() {
  return Boolean(document.querySelector('.evPremiumShowcase.activeMember'));
}

function founderOfferCanOpen() {
  const button = document.querySelector<HTMLButtonElement>('.evPremiumOffer .evPremiumPrimary');
  return Boolean(button && !button.disabled && !isFounderPremiumActive());
}

function setText(element: HTMLElement | null, value: string) {
  if (element && element.textContent !== value) element.textContent = value;
}

export default function V1253Surgical() {
  const pathname = usePathname();
  const active = pathname === '/voyage';
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const closeSpotlight = useCallback(() => setSpotlightOpen(false), []);

  useEffect(() => {
    if (!active) return;
    let syncFrame: number | null = null;

    const ensureBuilderGateway = () => {
      const root = document.getElementById('ev-premium-builder-root');
      const stateScroller = document.querySelector<HTMLElement>('#session-builder .stateScroller');
      if (!root || !stateScroller) return;
      if (root.previousElementSibling !== stateScroller) stateScroller.insertAdjacentElement('afterend', root);

      let gateway = root.querySelector<HTMLElement>('.evBuilderPremiumGateway');
      if (!gateway) {
        gateway = document.createElement('section');
        gateway.className = 'evBuilderPremiumGateway';
        gateway.innerHTML = `<div class="evBuilderPremiumGatewayGlow" aria-hidden="true"></div><div><span>Premium Library</span><strong>Unlock 30 Premium Frequencies</strong><p>Explore 35 frequency experiences across five collections.</p></div><button type="button" class="evBuilderPremiumExplore">Explore Premium <span aria-hidden="true">→</span></button>`;
        root.appendChild(gateway);
      }

      const premiumActive = isFounderPremiumActive();
      const mode = premiumActive ? 'active' : 'free';
      if (gateway.dataset.mode === mode) return;
      gateway.dataset.mode = mode;
      setText(gateway.querySelector<HTMLElement>('strong'), premiumActive ? 'Your 30 Premium Frequencies are open' : 'Unlock 30 Premium Frequencies');
      setText(gateway.querySelector<HTMLElement>('p'), premiumActive ? 'Enter any of the 35 frequency experiences across five collections.' : 'Explore 35 frequency experiences across five collections.');
      const button = gateway.querySelector<HTMLButtonElement>('.evBuilderPremiumExplore');
      if (button) button.innerHTML = premiumActive ? 'Open Premium Library <span aria-hidden="true">→</span>' : 'Explore Premium <span aria-hidden="true">→</span>';
    };

    const ensureCheckoutComparison = () => {
      const form = document.querySelector<HTMLElement>('.evCheckoutForm');
      const intro = form?.querySelector<HTMLElement>('.evCheckoutIntro');
      if (!form || !intro) return;
      form.classList.add('evCheckoutComparisonEnabled');
      if (form.querySelector('.evCheckoutComparisonV1253')) return;
      const comparison = document.createElement('section');
      comparison.className = 'evCheckoutComparisonV1253';
      comparison.setAttribute('aria-labelledby', 'ev-v1253-comparison-title');
      comparison.innerHTML = `
        <h3 id="ev-v1253-comparison-title">See what Founder Premium adds</h3>
        <div class="evComparisonTable" role="table" aria-label="Free and Founder Premium comparison">
          <div class="evComparisonHeader" role="row"><span role="columnheader">Free now</span><strong role="columnheader">Founder Premium</strong></div>
          <div class="evComparisonRow" role="row"><span role="cell"><small>Frequency library</small><b>5 core</b></span><strong role="cell"><small>Frequency library</small>35 total · +30 Premium</strong></div>
          <div class="evComparisonRow" role="row"><span role="cell"><small>Voyages</small><b>Unlimited</b></span><strong role="cell"><small>Voyages</small>Unlimited</strong></div>
          <div class="evComparisonRow" role="row"><span role="cell"><small>Sound worlds</small><b>Core frequencies</b></span><strong role="cell"><small>Sound worlds</small>Premium soundscapes</strong></div>
          <div class="evComparisonRow" role="row"><span role="cell"><small>Account</small><b>Not required</b></span><strong role="cell"><small>Account</small>Not required</strong></div>
          <div class="evComparisonRow" role="row"><span role="cell"><small>Third-party ads</small><b>None</b></span><strong role="cell"><small>Third-party ads</small>None</strong></div>
          <div class="evComparisonRow" role="row"><span role="cell"><small>Founder access</small><b>—</b></span><strong role="cell"><small>Founder access</small>Lifetime</strong></div>
        </div>
        <p class="evComparisonComing"><b>Coming to Premium:</b> 15 immersive sound effects</p>`;
      intro.insertAdjacentElement('afterend', comparison);
    };

    const ensurePremiumLabels = () => {
      document.querySelectorAll<HTMLElement>('.evPremiumBenefitRow span,.evSuccessBenefits span,.evCheckoutBenefitMeta span').forEach((node) => {
        if (/^no ads$/i.test(node.textContent?.trim() || '')) node.textContent = 'No third-party ads';
      });
      document.querySelectorAll<HTMLButtonElement>('.evPremiumOffer button,.evCheckoutActions button').forEach((button) => {
        if (/explore premium frequencies/i.test(button.textContent || '')) button.classList.add('evExplorePremiumGold');
      });
    };

    const sync = () => {
      ensureBuilderGateway();
      ensureCheckoutComparison();
      ensurePremiumLabels();
    };
    const scheduleSync = () => {
      if (syncFrame !== null) return;
      syncFrame = window.requestAnimationFrame(() => { syncFrame = null; sync(); });
    };
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('.evBuilderPremiumExplore')) {
        document.getElementById('ev-premium-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (!target?.closest('.evCompletionReturn')) return;
      const lastShown = Number(localStorage.getItem(FOUNDER_SPOTLIGHT_KEY) || '0');
      if (Date.now() - lastShown < FOUNDER_SPOTLIGHT_COOLDOWN_MS) return;
      window.setTimeout(() => {
        if (!founderOfferCanOpen()) return;
        localStorage.setItem(FOUNDER_SPOTLIGHT_KEY, String(Date.now()));
        setSpotlightOpen(true);
      }, 550);
    };

    sync();
    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', handleClick, true);
    return () => {
      if (syncFrame !== null) window.cancelAnimationFrame(syncFrame);
      observer.disconnect();
      document.removeEventListener('click', handleClick, true);
    };
  }, [active]);

  useEffect(() => {
    if (!spotlightOpen) return;
    const body = document.body;
    const scrollY = window.scrollY;
    const snapshot = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = snapshot.position;
      body.style.top = snapshot.top;
      body.style.width = snapshot.width;
      body.style.overflow = snapshot.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [spotlightOpen]);

  useEffect(() => {
    if (!spotlightOpen) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeSpotlight(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [closeSpotlight, spotlightOpen]);

  if (!active) return null;

  return spotlightOpen ? createPortal(
    <div className="evFounderSpotlightBackdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeSpotlight(); }}>
      <article className="evFounderSpotlight" role="dialog" aria-modal="true" aria-labelledby="ev-founder-spotlight-title">
        <button type="button" className="evFounderSpotlightClose" onClick={closeSpotlight} aria-label="Close Premium offer">×</button>
        <p>Everlasting Premium</p>
        <h2 id="ev-founder-spotlight-title">Unlock 30 Premium Frequencies</h2>
        <span>35 frequency experiences across five collections.</span>
        <div className="evFounderSpotlightPrice"><small>Founding Member</small><strong>US$9.99</strong><b>one payment · lifetime Premium</b></div>
        <button type="button" className="evFounderSpotlightPrimary" onClick={() => {
          closeSpotlight();
          window.setTimeout(() => document.querySelector<HTMLButtonElement>('.evPremiumOffer .evPremiumPrimary')?.click(), 60);
        }}>Unlock lifetime Premium</button>
        <button type="button" className="evFounderSpotlightExplore" onClick={() => {
          closeSpotlight();
          window.setTimeout(() => document.getElementById('ev-premium-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
        }}>Explore Premium Frequencies →</button>
        <small>Founder access is currently open. No countdown. No fake scarcity.</small>
      </article>
    </div>, document.body
  ) : null;
}
