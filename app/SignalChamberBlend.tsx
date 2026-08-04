'use client';

import { useEffect } from 'react';

const signalStates = ['alpha', 'gamma', 'theta', 'delta', 'abundance'] as const;
type SignalState = (typeof signalStates)[number];

function getSignalState(element: Element | null): SignalState | null {
  if (!element) return null;
  return signalStates.find((state) => element.classList.contains(state)) ?? null;
}

export default function SignalChamberBlend() {
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('#library .signalStage');
    if (!stage) return;

    let previousPopup = stage.querySelector<HTMLElement>(
      '.signalPopupOverlay:not(.signalPopupExitGhost)'
    );
    let previousState = getSignalState(previousPopup);
    let releaseTimer: number | undefined;

    const setStageState = (state: SignalState | null) => {
      if (state) {
        stage.dataset.signalState = state;
      } else {
        delete stage.dataset.signalState;
      }
    };

    const releaseSignal = (popup: HTMLElement, state: SignalState) => {
      window.clearTimeout(releaseTimer);
      delete stage.dataset.signalState;
      stage.dataset.exitState = state;

      const ghost = popup.cloneNode(true) as HTMLElement;
      ghost.classList.add('signalPopupExitGhost');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.querySelectorAll<HTMLElement>('button, a, input, textarea, select').forEach((item) => {
        item.tabIndex = -1;
      });
      stage.appendChild(ghost);

      const wave = document.createElement('span');
      wave.className = `signalExitWave ${state}`;
      wave.setAttribute('aria-hidden', 'true');
      stage.appendChild(wave);

      window.setTimeout(() => ghost.remove(), 430);
      window.setTimeout(() => wave.remove(), 980);
      releaseTimer = window.setTimeout(() => {
        delete stage.dataset.exitState;
      }, 980);
    };

    const syncPopup = () => {
      const currentPopup = stage.querySelector<HTMLElement>(
        '.signalPopupOverlay:not(.signalPopupExitGhost)'
      );
      const currentState = getSignalState(currentPopup);

      if (currentPopup && currentState) {
        window.clearTimeout(releaseTimer);
        delete stage.dataset.exitState;
        setStageState(currentState);
        previousPopup = currentPopup;
        previousState = currentState;
        return;
      }

      if (!currentPopup && previousPopup && previousState) {
        const popupToRelease = previousPopup;
        const stateToRelease = previousState;
        previousPopup = null;
        previousState = null;
        releaseSignal(popupToRelease, stateToRelease);
      }
    };

    const observer = new MutationObserver(syncPopup);
    observer.observe(stage, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    syncPopup();

    return () => {
      observer.disconnect();
      window.clearTimeout(releaseTimer);
    };
  }, []);

  return (
    <style jsx global>{`
      /* The library is an atmospheric part of the page, not a card inside a card. */
      #library {
        position: relative;
        isolation: isolate;
        overflow: visible;
      }

      #library::before {
        content: '';
        position: absolute;
        z-index: -2;
        top: 8%;
        bottom: -8%;
        left: 50%;
        width: 100vw;
        transform: translateX(-50%);
        pointer-events: none;
        background:
          radial-gradient(ellipse 42% 34% at 50% 48%, rgba(54, 99, 214, 0.16), transparent 72%),
          radial-gradient(ellipse 24% 24% at 22% 44%, rgba(var(--ev-alpha-rgb), 0.055), transparent 74%),
          radial-gradient(ellipse 24% 24% at 78% 44%, rgba(var(--ev-gamma-rgb), 0.045), transparent 74%),
          linear-gradient(180deg, transparent 0%, rgba(3, 11, 23, 0.48) 28%, rgba(2, 7, 15, 0.54) 72%, transparent 100%);
        opacity: 0.92;
      }

      #library::after {
        content: '';
        position: absolute;
        z-index: -1;
        left: 50%;
        top: 27%;
        width: min(1100px, 92vw);
        height: 68%;
        transform: translateX(-50%);
        border-radius: 50%;
        pointer-events: none;
        background: radial-gradient(ellipse at center, rgba(45, 100, 190, 0.105), transparent 70%);
        filter: blur(58px);
      }

      #library .sectionIntro,
      #library .signalExperience {
        position: relative;
        z-index: 1;
      }

      #library .signalExperience.glassCard {
        overflow: visible !important;
        margin-top: clamp(20px, 3vw, 38px) !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      #library .signalExperience::before {
        inset: -10% -12% !important;
        border-radius: 50% !important;
        filter: blur(110px) !important;
        opacity: 0.42 !important;
      }

      #library .signalExperience::after {
        content: '';
        position: absolute;
        z-index: 0;
        inset: 9% 5% 3%;
        pointer-events: none;
        border-radius: 50%;
        background:
          radial-gradient(ellipse at center, rgba(44, 102, 196, 0.12), rgba(12, 35, 70, 0.045) 48%, transparent 74%);
        filter: blur(34px);
      }

      #library .signalExperienceTop {
        z-index: 3 !important;
        padding-right: clamp(4px, 1vw, 16px);
      }

      #library .compactHint {
        margin-bottom: 4px !important;
        color: #9eafc2 !important;
      }

      #library .signalStage {
        --release-rgb: 92, 155, 255;
        overflow: visible !important;
        min-height: clamp(680px, 56vw, 790px) !important;
        border: 0 !important;
        border-radius: 0 !important;
        background:
          radial-gradient(ellipse 54% 48% at 50% 49%, rgba(55, 113, 221, 0.22) 0%, rgba(23, 62, 123, 0.12) 38%, rgba(6, 19, 39, 0.035) 63%, transparent 80%),
          radial-gradient(ellipse 78% 64% at 50% 50%, rgba(15, 42, 82, 0.11), transparent 78%) !important;
        box-shadow: none !important;
        transition: filter 560ms ease, opacity 560ms ease !important;
      }

      #library .signalStage[data-signal-state='alpha'],
      #library .signalStage[data-exit-state='alpha'] {
        --release-rgb: var(--ev-alpha-rgb);
      }

      #library .signalStage[data-signal-state='gamma'],
      #library .signalStage[data-exit-state='gamma'] {
        --release-rgb: var(--ev-gamma-rgb);
      }

      #library .signalStage[data-signal-state='theta'],
      #library .signalStage[data-exit-state='theta'] {
        --release-rgb: var(--ev-theta-rgb);
      }

      #library .signalStage[data-signal-state='delta'],
      #library .signalStage[data-exit-state='delta'] {
        --release-rgb: var(--ev-delta-rgb);
      }

      #library .signalStage[data-signal-state='abundance'],
      #library .signalStage[data-exit-state='abundance'] {
        --release-rgb: var(--ev-abundance-rgb);
      }

      #library .signalStage[data-signal-state] {
        background:
          radial-gradient(ellipse 56% 50% at 50% 49%, rgba(var(--release-rgb), 0.25) 0%, rgba(var(--release-rgb), 0.105) 40%, rgba(var(--release-rgb), 0.025) 64%, transparent 81%),
          radial-gradient(ellipse 80% 66% at 50% 50%, rgba(14, 37, 76, 0.105), transparent 78%) !important;
      }

      #library .signalStage[data-exit-state] {
        animation: evChamberSettle 920ms cubic-bezier(0.2, 0.72, 0.2, 1) both;
      }

      #library .signalStage::before {
        inset: 7% 10% !important;
        opacity: 0.78 !important;
        mask-image: radial-gradient(ellipse at center, #000 0%, #000 66%, transparent 90%) !important;
        -webkit-mask-image: radial-gradient(ellipse at center, #000 0%, #000 66%, transparent 90%) !important;
      }

      #library .signalStage::after {
        border-radius: 50% !important;
        opacity: 0.48 !important;
        mask-image: radial-gradient(ellipse at center, #000 0%, rgba(0, 0, 0, 0.88) 60%, transparent 86%);
        -webkit-mask-image: radial-gradient(ellipse at center, #000 0%, rgba(0, 0, 0, 0.88) 60%, transparent 86%);
      }

      #library .signalNode {
        box-shadow:
          inset 0 0 0 1px rgba(var(--node-rgb), 0.035),
          0 16px 36px rgba(0, 0, 0, 0.24),
          0 0 34px rgba(var(--node-rgb), 0.035) !important;
      }

      #library .signalPopupExitGhost {
        pointer-events: none !important;
        animation: evPopupExit 400ms cubic-bezier(0.4, 0, 0.8, 0.4) forwards !important;
      }

      #library .signalExitWave {
        --wave-rgb: 92, 155, 255;
        position: absolute;
        z-index: 3;
        left: 50%;
        top: 50%;
        width: 18%;
        aspect-ratio: 1;
        transform: translate(-50%, -50%) scale(0.55);
        border-radius: 50%;
        border: 1px solid rgba(var(--wave-rgb), 0.72);
        box-shadow:
          0 0 24px rgba(var(--wave-rgb), 0.32),
          inset 0 0 22px rgba(var(--wave-rgb), 0.12);
        pointer-events: none;
        animation: evSignalRelease 940ms cubic-bezier(0.16, 0.72, 0.26, 1) forwards;
      }

      #library .signalExitWave.alpha { --wave-rgb: var(--ev-alpha-rgb); }
      #library .signalExitWave.gamma { --wave-rgb: var(--ev-gamma-rgb); }
      #library .signalExitWave.theta { --wave-rgb: var(--ev-theta-rgb); }
      #library .signalExitWave.delta { --wave-rgb: var(--ev-delta-rgb); }
      #library .signalExitWave.abundance { --wave-rgb: var(--ev-abundance-rgb); }

      @keyframes evPopupExit {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
          filter: blur(0);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -52%) scale(0.965);
          filter: blur(7px);
        }
      }

      @keyframes evSignalRelease {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.48);
        }
        18% { opacity: 0.9; }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(5.2);
        }
      }

      @keyframes evChamberSettle {
        0% {
          filter: saturate(1.22) brightness(1.08);
        }
        45% {
          filter: saturate(1.08) brightness(1.025);
        }
        100% {
          filter: saturate(1) brightness(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #library .signalPopupExitGhost,
        #library .signalExitWave,
        #library .signalStage[data-exit-state] {
          animation-duration: 1ms !important;
        }
      }

      @media (max-width: 860px) {
        #library::before {
          top: 11%;
          bottom: -4%;
        }

        #library .signalExperienceTop {
          padding-right: 0;
        }
      }

      @media (max-width: 560px) {
        #library .signalExperience.glassCard {
          margin-top: 18px !important;
        }

        #library .signalStage {
          min-height: 720px !important;
        }

        #library .signalExitWave {
          width: 25%;
        }
      }
    `}</style>
  );
}
