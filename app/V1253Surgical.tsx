'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { premiumAudioRecipes, type PremiumAudioRecipe } from './premium-audio-engine';

const FOUNDER_SPOTLIGHT_KEY = 'ev-founder-spotlight-last-v1253';
const FOUNDER_SPOTLIGHT_COOLDOWN_MS = 12 * 60 * 60 * 1000;

const sonicOverrides: Record<string, PremiumAudioRecipe> = {
  'alpha-12': {
    id: 'alpha-12',
    category: 'study',
    title: 'Memory Retention',
    soundIdentity: 'Luminous memory sequence',
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
    id: 'beta-18',
    category: 'study',
    title: 'Learning Momentum',
    soundIdentity: 'Uplifting kinetic study sequence',
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
    id: 'gamma-30',
    category: 'work',
    title: 'Creative Spark',
    soundIdentity: 'Prismatic creative motion',
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

// V12.5.3 is intentionally surgical: only these three named recipes are replaced.
Object.entries(sonicOverrides).forEach(([id, recipe]) => {
  premiumAudioRecipes[id] = recipe;
});

function isFounderPremiumActive() {
  return Boolean(document.querySelector('.evPremiumShowcase.activeMember'));
}

function founderOfferCanOpen() {
  const button = document.querySelector<HTMLButtonElement>('.evPremiumOffer .evPremiumPrimary');
  return Boolean(button && !button.disabled && !isFounderPremiumActive());
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
        gateway.innerHTML = `
          <div class="evBuilderPremiumGatewayGlow" aria-hidden="true"></div>
          <div>
            <span>Premium Library</span>
            <strong>Unlock 30 Premium Frequencies</strong>
            <p>Explore 35 frequency experiences across five collections.</p>
          </div>
          <button type="button" class="evBuilderPremiumExplore">Explore Premium <span aria-hidden="true">→</span></button>
        `;
        root.appendChild(gateway);
      }

      const premiumActive = isFounderPremiumActive();
      const title = gateway.querySelector<HTMLElement>('strong');
      const copy = gateway.querySelector<HTMLElement>('p');
      const button = gateway.querySelector<HTMLButtonElement>('.evBuilderPremiumExplore');
      if (premiumActive) {
        if (title) title.textContent = 'Your 30 Premium Frequencies are open';
        if (copy) copy.textContent = 'Enter any of the 35 frequency experiences across five collections.';
        if (button) button.innerHTML = 'Open Premium Library <span aria-hidden="true">→</span>';
      } else {
        if (title) title.textContent = 'Unlock 30 Premium Frequencies';
        if (copy) copy.textContent = 'Explore 35 frequency experiences across five collections.';
        if (button) button.innerHTML = 'Explore Premium <span aria-hidden="true">→</span>';
      }
    };

    const ensureCheckoutComparison = () => {
      const form = document.querySelector<HTMLElement>('.evCheckoutForm');
      const intro = form?.querySelector<HTMLElement>('.evCheckoutIntro');
      if (!form || !intro) return;
      form.classList.add('evCheckoutComparisonEnabled');
      let comparison = form.querySelector<HTMLElement>('.evCheckoutComparisonV1253');
      if (!comparison) {
        comparison = document.createElement('section');
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
          <p class="evComparisonComing"><b>Coming to Premium:</b> 15 immersive sound effects</p>
        `;
        intro.insertAdjacentElement('afterend', comparison);
      }
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
      syncFrame = window.requestAnimationFrame(() => {
        syncFrame = null;
        sync();
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('.evBuilderPremiumExplore')) {
        document.getElementById('ev-premium-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (target?.closest('.evCompletionReturn')) {
        const lastShown = Number(localStorage.getItem(FOUNDER_SPOTLIGHT_KEY) || '0');
        if (Date.now() - lastShown < FOUNDER_SPOTLIGHT_COOLDOWN_MS) return;
        window.setTimeout(() => {
          if (!founderOfferCanOpen()) return;
          localStorage.setItem(FOUNDER_SPOTLIGHT_KEY, String(Date.now()));
          setSpotlightOpen(true);
        }, 550);
      }
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
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeSpotlight(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeSpotlight, spotlightOpen]);

  if (!active) return null;

  return (
    <>
      {spotlightOpen && createPortal(
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
      )}

      <style id="v12-5-3-surgical-styles">{`
        /* Mobile category carousel: cards own their width instead of overflowing narrow grid tracks. */
        @media(max-width:980px){
          .evPremiumCategoryTabs{display:flex!important;grid-template-columns:none!important;gap:12px!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;padding:2px 18px 8px 0!important;margin-right:-18px!important}
          .evPremiumCategoryTabs button{flex:0 0 clamp(205px,52vw,232px)!important;width:auto!important;min-width:0!important;scroll-snap-align:start;scroll-snap-stop:normal}
        }
        @media(max-width:390px){.evPremiumCategoryTabs button{flex-basis:205px!important;min-width:0!important}}

        /* Gold is Premium. Free 888 uses an amethyst/pearl ritual identity instead. */
        body.ev-product-route .signalBadge.abundance{color:#e1d7ff!important;border-color:rgba(172,142,255,.46)!important;background:linear-gradient(135deg,rgba(105,75,182,.18),rgba(116,205,255,.08))!important}
        body.ev-product-route .stateChoice.abundance.active{border-color:rgba(172,142,255,.62)!important;background:linear-gradient(145deg,rgba(70,48,125,.42),rgba(28,52,88,.28))!important;box-shadow:inset 0 0 28px rgba(157,126,255,.08)!important}
        body.ev-product-route .stateChoice.abundance.active span,body.ev-product-route .stateChoice.abundance.active small{color:#d9cbff!important}
        body.ev-product-route .frequencyCard.abundance.active{border-color:rgba(172,142,255,.52)!important}
        body.ev-product-route .frequencyCard.abundance .frequencyTopline{color:#d9cbff!important}
        body.ev-product-route .sessionOverlay.abundance{--session-accent:#a68bff!important}

        /* Premium gateway directly under the five free builder choices. */
        .evBuilderPremiumGateway{position:relative;isolation:isolate;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;margin:14px 0 18px;padding:18px 20px;border:1px solid rgba(244,197,105,.58);border-radius:20px;background:radial-gradient(circle at 86% 20%,rgba(255,209,112,.18),transparent 34%),linear-gradient(135deg,rgba(35,26,20,.96),rgba(9,12,24,.98));box-shadow:inset 0 1px 0 rgba(255,241,207,.08),0 18px 44px rgba(151,101,19,.13)}
        .evBuilderPremiumGatewayGlow{position:absolute;inset:-40% auto -40% -20%;width:44%;background:linear-gradient(100deg,transparent,rgba(255,221,149,.10),transparent);transform:skewX(-18deg);animation:evV1253GatewaySheen 6.5s ease-in-out infinite;pointer-events:none;z-index:-1}
        .evBuilderPremiumGateway span{display:block;color:#f1c873;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
        .evBuilderPremiumGateway strong{display:block;margin-top:6px;color:#fff7e6;font-size:clamp(20px,2.2vw,28px);line-height:1.05;letter-spacing:-.025em}
        .evBuilderPremiumGateway p{margin:7px 0 0;color:rgba(239,230,214,.72);font-size:13px;line-height:1.5}
        .evBuilderPremiumExplore,.evExplorePremiumGold{min-height:56px!important;padding:0 20px!important;border:1px solid rgba(255,215,133,.7)!important;border-radius:15px!important;background:linear-gradient(135deg,rgba(132,83,24,.38),rgba(76,48,20,.25))!important;color:#ffe0a0!important;font-weight:900!important;letter-spacing:.025em!important;box-shadow:inset 0 1px 0 rgba(255,244,213,.08),0 12px 28px rgba(167,110,25,.14)!important}
        .evBuilderPremiumExplore:hover,.evExplorePremiumGold:hover{transform:translateY(-1px);border-color:rgba(255,225,158,.92)!important;box-shadow:0 16px 36px rgba(189,130,31,.2)!important}
        body.ev-premium-builder-selected .evBuilderPremiumGateway{display:none}
        @keyframes evV1253GatewaySheen{0%,62%{transform:translateX(-80%) skewX(-18deg);opacity:0}72%{opacity:1}100%{transform:translateX(330%) skewX(-18deg);opacity:0}}
        @media(max-width:620px){.evBuilderPremiumGateway{grid-template-columns:1fr;padding:17px;gap:14px}.evBuilderPremiumExplore{width:100%}}
        @media(prefers-reduced-motion:reduce){.evBuilderPremiumGatewayGlow{animation:none}}

        /* Founder checkout keeps its existing shell/price/Square flow; only the value story becomes comparative. */
        .evCheckoutComparisonEnabled>.evCheckoutValue{display:none!important}
        .evCheckoutComparisonV1253{display:grid;gap:14px;margin-top:28px}
        .evCheckoutComparisonV1253>h3{margin:0;color:#f7fbff;font-size:clamp(22px,2.3vw,28px);line-height:1.12}
        .evComparisonTable{overflow:hidden;border:1px solid rgba(129,184,230,.18);border-radius:20px;background:rgba(5,13,29,.58)}
        .evComparisonHeader,.evComparisonRow{display:grid;grid-template-columns:1fr 1fr}
        .evComparisonHeader{border-bottom:1px solid rgba(255,255,255,.08)}
        .evComparisonHeader span,.evComparisonHeader strong{padding:13px 16px;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
        .evComparisonHeader span{color:#8ee7ff;background:rgba(55,192,235,.07)}
        .evComparisonHeader strong{color:#ffdc99;background:rgba(229,167,67,.08)}
        .evComparisonRow>span,.evComparisonRow>strong{display:grid;gap:4px;align-content:center;min-height:67px;padding:11px 16px;border-bottom:1px solid rgba(255,255,255,.055)}
        .evComparisonRow>span{color:#d8ebf7;background:rgba(37,160,204,.025)}
        .evComparisonRow>strong{color:#fff2d4;background:rgba(198,136,44,.035);border-left:1px solid rgba(255,255,255,.06)}
        .evComparisonRow:last-child>span,.evComparisonRow:last-child>strong{border-bottom:0}
        .evComparisonRow small{color:rgba(206,225,239,.56);font-size:10px;letter-spacing:.07em;text-transform:uppercase;font-weight:700}
        .evComparisonRow b,.evComparisonRow strong{font-size:13.5px;line-height:1.3}
        .evComparisonComing{margin:0;padding:13px 16px;border:1px solid rgba(238,191,100,.25);border-radius:15px;color:rgba(236,226,207,.75);background:rgba(107,72,25,.08);font-size:13px;text-align:center}
        .evComparisonComing b{color:#ffd895}
        @media(max-width:620px){.evCheckoutComparisonV1253{margin-top:22px}.evComparisonHeader span,.evComparisonHeader strong{padding:11px 10px;font-size:11px}.evComparisonRow>span,.evComparisonRow>strong{padding:10px;min-height:64px}.evComparisonRow b,.evComparisonRow strong{font-size:12.5px}.evComparisonRow small{font-size:9.5px}}

        /* First-party Everlasting promotion after Return Home; compact, dismissible, and frequency-capped. */
        .evFounderSpotlightBackdrop{position:fixed;inset:0;z-index:10080;display:grid;place-items:center;padding:18px;background:rgba(0,5,15,.74);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
        .evFounderSpotlight{position:relative;width:min(520px,100%);padding:30px;border:1px solid rgba(244,196,99,.52);border-radius:25px;background:radial-gradient(circle at 82% 5%,rgba(247,193,87,.22),transparent 34%),linear-gradient(155deg,#07152a,#090a18 58%,#171022);box-shadow:0 36px 100px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,240,203,.08);text-align:center}
        .evFounderSpotlight>p{margin:0;color:#f3c871;font-size:11px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}
        .evFounderSpotlight h2{margin:13px auto 8px;max-width:11ch;color:#fff9ee;font-size:clamp(34px,7vw,50px);line-height:.96;letter-spacing:-.045em}
        .evFounderSpotlight>span{display:block;color:rgba(224,235,246,.74);font-size:14px;line-height:1.5}
        .evFounderSpotlightPrice{display:grid;gap:3px;margin:22px 0;padding:16px;border:1px solid rgba(238,190,96,.24);border-radius:17px;background:rgba(115,74,22,.08)}
        .evFounderSpotlightPrice small{color:#e7bf75;text-transform:uppercase;letter-spacing:.12em;font-weight:850}
        .evFounderSpotlightPrice strong{color:white;font-size:38px;letter-spacing:-.035em}
        .evFounderSpotlightPrice b{color:rgba(235,226,210,.72);font-size:13px;font-weight:600}
        .evFounderSpotlightPrimary,.evFounderSpotlightExplore{width:100%;min-height:56px;border-radius:15px;font-weight:900}
        .evFounderSpotlightPrimary{border:1px solid rgba(255,220,150,.8);background:linear-gradient(110deg,#edc365,#d99d38);color:#171005;box-shadow:0 15px 36px rgba(207,145,42,.2)}
        .evFounderSpotlightExplore{margin-top:10px;border:1px solid rgba(227,188,110,.34);background:rgba(89,59,24,.14);color:#ffdda0}
        .evFounderSpotlight>small{display:block;margin-top:14px;color:rgba(213,227,240,.48);font-size:11px}
        .evFounderSpotlightClose{position:absolute;top:14px;right:14px;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(8,20,40,.72);color:white;font-size:26px;line-height:1}
        @media(max-width:620px){.evFounderSpotlight{padding:27px 20px 22px;border-radius:22px}.evFounderSpotlight h2{font-size:38px}.evFounderSpotlightPrice strong{font-size:34px}}
      `}</style>
    </>
  );
}
