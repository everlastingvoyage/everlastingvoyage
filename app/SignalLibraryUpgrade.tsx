'use client';

import { useEffect } from 'react';

const signalContent = {
  alpha: {
    state: 'Calm Focus',
    use: 'Steady attention',
    bestFor: 'Studying, reading, planning and calm task entry.',
    benefits: ['A calmer mental pace', 'More sustained attention', 'A gentler start to focused work']
  },
  gamma: {
    state: 'Deep Focus',
    use: 'High attention',
    bestFor: 'Research, demanding work and sessions that need sharper concentration.',
    benefits: ['Sharper concentration', 'More deliberate task engagement', 'A stronger high-focus atmosphere']
  },
  theta: {
    state: 'Creative Flow',
    use: 'Ideas & reflection',
    bestFor: 'Writing, ideation, reflection and meditative creative sessions.',
    benefits: ['Supports idea generation', 'Encourages reflective thinking', 'Creates a softer creative rhythm']
  },
  delta: {
    state: 'Deep Rest',
    use: 'Rest & recovery',
    bestFor: 'Wind-down rituals, quiet recovery and sleep preparation.',
    benefits: ['Slows the pace of the session', 'Supports a quieter wind-down', 'Creates a restful pre-sleep atmosphere']
  },
  abundance: {
    state: 'Abundance',
    use: 'Intention ritual',
    bestFor: 'Visualization, intentional thinking and ceremonial personal sessions.',
    benefits: ['Strengthens the visualization ritual', 'Supports intentional thinking', 'Creates a warm ceremonial atmosphere']
  }
} as const;

type SignalKey = keyof typeof signalContent;
const signalKeys = Object.keys(signalContent) as SignalKey[];

function getSignalKey(element: Element | null): SignalKey | null {
  if (!element) return null;
  return signalKeys.find((key) => element.classList.contains(key)) ?? null;
}

function decorateNode(node: HTMLElement, key: SignalKey) {
  if (node.dataset.libraryEnhanced === 'true') return;

  const content = signalContent[key];
  const wave = document.createElement('span');
  wave.className = 'signalNodeWave';
  wave.setAttribute('aria-hidden', 'true');
  wave.innerHTML = `
    <svg viewBox="0 0 72 24" focusable="false">
      <path d="M2 12h8l4-7 5 14 6-11 6 8 6-12 6 16 6-10 5 5h8" />
    </svg>
  `;

  const stateName = document.createElement('small');
  stateName.className = 'signalNodeState';
  stateName.textContent = content.state;

  const use = document.createElement('em');
  use.className = 'signalNodeUse';
  use.textContent = content.use;

  node.insertBefore(wave, node.firstChild);
  node.append(stateName, use);
  node.dataset.libraryEnhanced = 'true';
  node.setAttribute('aria-label', `${content.state}. ${content.use}. Open frequency details.`);
}

function decoratePopup(popup: HTMLElement, key: SignalKey) {
  if (popup.querySelector('.signalBenefits')) return;

  const content = signalContent[key];
  const action = popup.querySelector<HTMLElement>('.signalPopupAction');
  if (!action) return;

  const benefits = document.createElement('section');
  benefits.className = 'signalBenefits';
  benefits.innerHTML = `
    <span class="signalBenefitsLabel">Designed to support</span>
    <ul>
      ${content.benefits.map((benefit) => `<li>${benefit}</li>`).join('')}
    </ul>
    <p><strong>Best for</strong>${content.bestFor}</p>
  `;

  action.before(benefits);
}

export default function SignalLibraryUpgrade() {
  useEffect(() => {
    const library = document.querySelector<HTMLElement>('#library');
    const stage = library?.querySelector<HTMLElement>('.signalStage');
    if (!library || !stage) return;

    let clearTimer: number | undefined;

    const sync = () => {
      stage.querySelectorAll<HTMLElement>('.signalNode').forEach((node) => {
        const key = getSignalKey(node);
        if (key) decorateNode(node, key);
      });

      const popup = stage.querySelector<HTMLElement>(
        '.signalPopupOverlay:not(.signalPopupExitGhost)'
      );
      const popupKey = getSignalKey(popup);
      if (popup && popupKey) decoratePopup(popup, popupKey);

      const currentState =
        popupKey ??
        (stage.dataset.signalState as SignalKey | undefined) ??
        (stage.dataset.exitState as SignalKey | undefined) ??
        null;

      window.clearTimeout(clearTimer);
      if (currentState) {
        library.dataset.signalState = currentState;
      } else {
        clearTimer = window.setTimeout(() => {
          delete library.dataset.signalState;
        }, 360);
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(library, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-signal-state', 'data-exit-state']
    });

    sync();

    return () => {
      observer.disconnect();
      window.clearTimeout(clearTimer);
    };
  }, []);

  return (
    <style jsx global>{`
      #library {
        --library-rgb: 92, 155, 255;
      }

      #library[data-signal-state='alpha'] { --library-rgb: var(--ev-alpha-rgb); }
      #library[data-signal-state='gamma'] { --library-rgb: var(--ev-gamma-rgb); }
      #library[data-signal-state='theta'] { --library-rgb: var(--ev-theta-rgb); }
      #library[data-signal-state='delta'] { --library-rgb: var(--ev-delta-rgb); }
      #library[data-signal-state='abundance'] { --library-rgb: var(--ev-abundance-rgb); }

      /* The selected atmosphere fills the full section instead of a smaller rectangle. */
      #library::before {
        transition: opacity 520ms ease, filter 620ms ease !important;
      }

      #library[data-signal-state]::before {
        top: 4% !important;
        bottom: -12% !important;
        background:
          radial-gradient(ellipse 72% 54% at 50% 53%, rgba(var(--library-rgb), 0.19), rgba(var(--library-rgb), 0.07) 43%, transparent 76%),
          radial-gradient(ellipse 34% 28% at 18% 43%, rgba(var(--library-rgb), 0.07), transparent 76%),
          radial-gradient(ellipse 34% 28% at 82% 43%, rgba(var(--library-rgb), 0.06), transparent 76%),
          linear-gradient(180deg, transparent 0%, rgba(3, 10, 21, 0.38) 22%, rgba(2, 7, 15, 0.5) 78%, transparent 100%) !important;
        opacity: 1 !important;
        filter: saturate(1.08);
      }

      #library[data-signal-state]::after {
        width: min(1500px, 100vw) !important;
        height: 78% !important;
        background: radial-gradient(ellipse at center, rgba(var(--library-rgb), 0.13), transparent 72%) !important;
        filter: blur(72px) !important;
      }

      #library .signalExperience .signalStage[data-signal-state],
      #library .signalExperience .signalStage:has(.signalNode.active) {
        background:
          radial-gradient(ellipse 60% 52% at 50% 49%, rgba(var(--release-rgb), 0.23) 0%, rgba(var(--release-rgb), 0.09) 42%, transparent 77%),
          radial-gradient(ellipse 86% 72% at 50% 50%, rgba(12, 34, 70, 0.08), transparent 79%) !important;
      }

      /* Large orbital cards inspired by the channel visual system. */
      #library .signalNode {
        width: clamp(158px, 13vw, 188px) !important;
        min-height: 184px !important;
        padding: 18px 16px !important;
        display: flex !important;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 7px !important;
        border-radius: 28px !important;
        background:
          radial-gradient(circle at 50% 4%, rgba(var(--node-rgb), 0.2), transparent 48%),
          linear-gradient(165deg, rgba(var(--node-rgb), 0.11), rgba(5, 14, 28, 0.97) 48%, rgba(2, 8, 18, 0.99)) !important;
        border-color: rgba(var(--node-rgb), 0.48) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.045),
          inset 0 0 28px rgba(var(--node-rgb), 0.045),
          0 22px 48px rgba(0, 0, 0, 0.3),
          0 0 34px rgba(var(--node-rgb), 0.06) !important;
      }

      #library .signalNodeWave {
        width: 58px;
        height: 24px;
        display: grid !important;
        place-items: center;
        margin: 0 0 2px !important;
        color: var(--node-accent) !important;
        filter: drop-shadow(0 0 8px rgba(var(--node-rgb), 0.48));
      }

      #library .signalNodeWave svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }

      #library .signalNodeWave path {
        fill: none;
        stroke: currentColor;
        stroke-width: 2.6;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      #library .signalNode > span:not(.signalNodeWave) {
        margin: 0 !important;
        font-size: 0.82rem !important;
        letter-spacing: 0.19em !important;
      }

      #library .signalNode strong {
        font-size: clamp(2rem, 2.7vw, 2.45rem) !important;
        line-height: 0.95 !important;
        margin: 1px 0 2px;
      }

      #library .signalNodeState {
        display: block;
        color: #d9e5f2;
        font-size: 0.98rem;
        font-style: normal;
        font-weight: 750;
        line-height: 1.15;
      }

      #library .signalNodeUse {
        display: block;
        color: rgba(var(--node-rgb), 0.72);
        font-size: 0.72rem;
        font-style: normal;
        font-weight: 650;
        letter-spacing: 0.04em;
      }

      #library .signalNode:hover,
      #library .signalNode:focus-visible,
      #library .signalNode.active {
        transform: translateY(-6px) scale(1.035) !important;
        background:
          radial-gradient(circle at 50% 0%, rgba(var(--node-rgb), 0.36), transparent 54%),
          linear-gradient(165deg, rgba(var(--node-rgb), 0.21), rgba(5, 14, 28, 0.98) 52%, rgba(2, 8, 18, 1)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.08),
          inset 0 0 34px rgba(var(--node-rgb), 0.09),
          0 28px 56px rgba(0, 0, 0, 0.34),
          0 0 42px rgba(var(--node-rgb), 0.22) !important;
      }

      #library .signalNode.alpha { left: 5.5% !important; top: 7% !important; }
      #library .signalNode.gamma { right: 5.5% !important; top: 7% !important; }
      #library .signalNode.delta { left: 5.5% !important; bottom: 14% !important; }
      #library .signalNode.theta { right: 5.5% !important; bottom: 14% !important; }
      #library .signalNode.abundance {
        bottom: 0.8% !important;
        min-height: 164px !important;
      }

      #library .signalNode.abundance:hover,
      #library .signalNode.abundance:focus-visible,
      #library .signalNode.abundance.active {
        transform: translateX(-50%) translateY(-6px) scale(1.035) !important;
      }

      /* Richer explanation and benefit structure inside each frequency popup. */
      #library .signalPopupOverlay {
        width: min(620px, calc(100% - 48px)) !important;
        padding: clamp(24px, 3.2vw, 34px) !important;
      }

      #library .signalPopupBody p {
        max-width: 46ch;
      }

      #library .signalBenefits {
        margin-top: 20px;
        padding-top: 18px;
        border-top: 1px solid rgba(var(--popup-rgb), 0.2);
      }

      #library .signalBenefitsLabel {
        display: block;
        color: var(--popup-accent);
        font-size: 0.76rem;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      #library .signalBenefits ul {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin: 12px 0 14px;
        padding: 0;
        list-style: none;
      }

      #library .signalBenefits li {
        min-height: 72px;
        display: flex;
        align-items: center;
        padding: 12px 13px;
        border: 1px solid rgba(var(--popup-rgb), 0.2);
        border-radius: 15px;
        background: rgba(var(--popup-rgb), 0.065);
        color: #d8e4f0;
        font-size: 0.82rem;
        font-weight: 650;
        line-height: 1.4;
      }

      #library .signalBenefits p {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        margin: 0;
        color: #aebed0;
        font-size: 0.88rem;
        line-height: 1.55;
      }

      #library .signalBenefits p strong {
        color: var(--popup-accent);
        white-space: nowrap;
      }

      @media (max-width: 860px) {
        #library .signalNode {
          width: min(32vw, 150px) !important;
          min-height: 150px !important;
          padding: 14px 10px !important;
        }

        #library .signalNode.abundance {
          min-height: 144px !important;
        }

        #library .signalNodeState { font-size: 0.85rem; }
        #library .signalNodeUse { font-size: 0.66rem; }
      }

      @media (max-width: 560px) {
        #library[data-signal-state]::before {
          top: 7% !important;
          bottom: -5% !important;
          background:
            radial-gradient(ellipse 105% 48% at 50% 48%, rgba(var(--library-rgb), 0.2), rgba(var(--library-rgb), 0.06) 48%, transparent 82%),
            linear-gradient(180deg, transparent 0%, rgba(3, 10, 21, 0.4) 22%, rgba(2, 7, 15, 0.5) 78%, transparent 100%) !important;
        }

        #library .signalStage {
          min-height: 760px !important;
        }

        #library .signalNode {
          width: 43% !important;
          max-width: 138px !important;
          min-height: 132px !important;
          border-radius: 23px !important;
          gap: 5px !important;
        }

        #library .signalNodeWave {
          width: 44px;
          height: 18px;
        }

        #library .signalNode strong {
          font-size: 1.65rem !important;
        }

        #library .signalNodeState { font-size: 0.78rem; }
        #library .signalNodeUse { display: none; }

        #library .signalNode.alpha,
        #library .signalNode.gamma { top: 4.5% !important; }

        #library .signalNode.delta,
        #library .signalNode.theta { bottom: 17.5% !important; }

        #library .signalNode.abundance {
          width: min(48%, 150px) !important;
          min-height: 128px !important;
          bottom: 1.5% !important;
        }

        #library .signalPopupOverlay {
          width: calc(100% - 22px) !important;
          padding: 20px !important;
        }

        #library .signalBenefits ul {
          grid-template-columns: 1fr;
          gap: 7px;
        }

        #library .signalBenefits li {
          min-height: 0;
          padding: 10px 12px;
        }

        #library .signalBenefits p {
          grid-template-columns: 1fr;
          gap: 3px;
        }
      }
    `}</style>
  );
}
