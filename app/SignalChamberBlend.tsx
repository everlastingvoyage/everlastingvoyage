'use client';

import { useEffect } from 'react';

const signalStates = ['alpha', 'gamma', 'theta', 'delta', 'abundance'] as const;
type SignalState = (typeof signalStates)[number];
type SoundDirection = 'open' | 'close' | 'confirm';

function getSignalState(element: Element | null): SignalState | null {
  if (!element) return null;
  return signalStates.find((state) => element.classList.contains(state)) ?? null;
}

export default function SignalChamberBlend() {
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('#library .signalStage');
    const library = stage?.closest<HTMLElement>('#library');
    if (!stage || !library) return;

    let previousPopup = stage.querySelector<HTMLElement>(
      '.signalPopupOverlay:not(.signalPopupExitGhost)'
    );
    let previousState = getSignalState(previousPopup);
    let releaseTimer: number | undefined;
    let arrivalTimer: number | undefined;
    let audioContext: AudioContext | null = null;

    const setDataState = (name: 'signalState' | 'enterState' | 'exitState', state: SignalState | null) => {
      if (state) {
        stage.dataset[name] = state;
        library.dataset[name] = state;
      } else {
        delete stage.dataset[name];
        delete library.dataset[name];
      }
    };

    const playUiTone = (state: SignalState, direction: SoundDirection) => {
      const AudioContextClass =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return;

      try {
        audioContext ??= new AudioContextClass();
        if (audioContext.state === 'suspended') void audioContext.resume();

        const baseFrequency: Record<SignalState, number> = {
          alpha: 520,
          gamma: 660,
          theta: 440,
          delta: 330,
          abundance: 740
        };

        const now = audioContext.currentTime;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const base = baseFrequency[state];

        oscillator.type = direction === 'confirm' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(
          direction === 'close' ? base * 0.94 : base * 0.78,
          now
        );
        oscillator.frequency.exponentialRampToValueAtTime(
          direction === 'close' ? base * 0.68 : direction === 'confirm' ? base * 1.28 : base,
          now + 0.13
        );

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.016, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.16);
      } catch {
        // Sound is an enhancement only; interaction must remain silent-safe.
      }
    };

    const createTransitionWave = (state: SignalState, direction: 'Enter' | 'Exit') => {
      const wave = document.createElement('span');
      wave.className = `signalTransitionWave signal${direction}Wave ${state}`;
      wave.setAttribute('aria-hidden', 'true');
      stage.appendChild(wave);
      window.setTimeout(() => wave.remove(), direction === 'Enter' ? 900 : 980);
    };

    const arriveSignal = (state: SignalState) => {
      window.clearTimeout(arrivalTimer);
      setDataState('enterState', state);
      createTransitionWave(state, 'Enter');

      arrivalTimer = window.setTimeout(() => {
        setDataState('enterState', null);
      }, 860);
    };

    const releaseSignal = (popup: HTMLElement, state: SignalState) => {
      window.clearTimeout(releaseTimer);
      setDataState('signalState', null);
      setDataState('enterState', null);
      setDataState('exitState', state);

      const ghost = popup.cloneNode(true) as HTMLElement;
      ghost.classList.add('signalPopupExitGhost');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.querySelectorAll<HTMLElement>('button, a, input, textarea, select').forEach((item) => {
        item.tabIndex = -1;
      });
      stage.appendChild(ghost);

      createTransitionWave(state, 'Exit');

      window.setTimeout(() => ghost.remove(), 430);
      releaseTimer = window.setTimeout(() => {
        setDataState('exitState', null);
      }, 980);
    };

    const syncPopup = () => {
      const currentPopup = stage.querySelector<HTMLElement>(
        '.signalPopupOverlay:not(.signalPopupExitGhost)'
      );
      const currentState = getSignalState(currentPopup);

      if (currentPopup && currentState) {
        window.clearTimeout(releaseTimer);
        setDataState('exitState', null);
        setDataState('signalState', currentState);

        if (currentPopup !== previousPopup) arriveSignal(currentState);

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

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;

      const node = event.target.closest<HTMLElement>('.signalNode');
      if (node && stage.contains(node)) {
        const state = getSignalState(node);
        if (state) playUiTone(state, 'open');
        return;
      }

      const popup = event.target.closest<HTMLElement>('.signalPopupOverlay');
      const state = getSignalState(popup);
      if (!state) return;

      if (event.target.closest('.signalPopupClose')) {
        playUiTone(state, 'close');
      } else if (event.target.closest('.signalPopupAction')) {
        playUiTone(state, 'confirm');
      }
    };

    const observer = new MutationObserver(syncPopup);
    observer.observe(stage, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    stage.addEventListener('pointerdown', handlePointerDown);

    syncPopup();

    return () => {
      observer.disconnect();
      stage.removeEventListener('pointerdown', handlePointerDown);
      window.clearTimeout(releaseTimer);
      window.clearTimeout(arrivalTimer);
      void audioContext?.close();
    };
  }, []);

  return (
    <style jsx global>{`
      /* The chamber now belongs to the page instead of sitting inside a rectangle. */
      #library {
        --library-rgb: 92, 155, 255;
        position: relative;
        isolation: isolate;
        overflow: visible;
      }

      #library[data-signal-state='alpha'],
      #library[data-enter-state='alpha'],
      #library[data-exit-state='alpha'] { --library-rgb: var(--ev-alpha-rgb); }

      #library[data-signal-state='gamma'],
      #library[data-enter-state='gamma'],
      #library[data-exit-state='gamma'] { --library-rgb: var(--ev-gamma-rgb); }

      #library[data-signal-state='theta'],
      #library[data-enter-state='theta'],
      #library[data-exit-state='theta'] { --library-rgb: var(--ev-theta-rgb); }

      #library[data-signal-state='delta'],
      #library[data-enter-state='delta'],
      #library[data-exit-state='delta'] { --library-rgb: var(--ev-delta-rgb); }

      #library[data-signal-state='abundance'],
      #library[data-enter-state='abundance'],
      #library[data-exit-state='abundance'] { --library-rgb: var(--ev-abundance-rgb); }

      #library::before {
        content: '';
        position: absolute;
        z-index: -2;
        top: 5%;
        bottom: -10%;
        left: 50%;
        width: 100vw;
        transform: translateX(-50%);
        pointer-events: none;
        background:
          radial-gradient(ellipse 64% 48% at 50% 53%, rgba(var(--library-rgb), 0.14), rgba(var(--library-rgb), 0.045) 46%, transparent 76%),
          radial-gradient(ellipse 26% 24% at 16% 45%, rgba(var(--ev-alpha-rgb), 0.045), transparent 76%),
          radial-gradient(ellipse 26% 24% at 84% 45%, rgba(var(--ev-gamma-rgb), 0.038), transparent 76%),
          linear-gradient(180deg, transparent 0%, rgba(3, 11, 23, 0.32) 24%, rgba(2, 7, 15, 0.46) 76%, transparent 100%);
        opacity: 0.95;
        transition: background 620ms ease, opacity 620ms ease, filter 620ms ease;
      }

      #library[data-signal-state]::before,
      #library[data-enter-state]::before,
      #library[data-exit-state]::before {
        background:
          radial-gradient(ellipse 72% 54% at 50% 52%, rgba(var(--library-rgb), 0.2), rgba(var(--library-rgb), 0.07) 44%, transparent 78%),
          radial-gradient(ellipse 32% 28% at 18% 48%, rgba(var(--library-rgb), 0.055), transparent 78%),
          radial-gradient(ellipse 32% 28% at 82% 48%, rgba(var(--library-rgb), 0.05), transparent 78%),
          linear-gradient(180deg, transparent 0%, rgba(3, 11, 23, 0.34) 24%, rgba(2, 7, 15, 0.5) 76%, transparent 100%);
        filter: saturate(1.08);
      }

      #library::after {
        content: '';
        position: absolute;
        z-index: -1;
        left: 50%;
        top: 22%;
        width: min(1500px, 100vw);
        height: 76%;
        transform: translateX(-50%);
        border-radius: 50%;
        pointer-events: none;
        background: radial-gradient(ellipse at center, rgba(var(--library-rgb), 0.11), transparent 72%);
        filter: blur(72px);
        transition: background 620ms ease, opacity 620ms ease;
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
        inset: -18% -16% !important;
        border-radius: 50% !important;
        filter: blur(120px) !important;
        opacity: 0.38 !important;
      }

      #library .signalExperience::after {
        content: '';
        position: absolute;
        z-index: 0;
        inset: -8% -12% -5%;
        pointer-events: none;
        border-radius: 50%;
        background:
          radial-gradient(ellipse 62% 54% at 50% 52%, rgba(var(--library-rgb), 0.115), rgba(22, 56, 108, 0.05) 50%, transparent 78%),
          conic-gradient(from 25deg at 50% 52%, rgba(var(--ev-alpha-rgb), 0.022), transparent 17%, rgba(var(--ev-gamma-rgb), 0.02) 29%, transparent 46%, rgba(var(--ev-theta-rgb), 0.022) 65%, transparent 82%, rgba(var(--ev-abundance-rgb), 0.018));
        filter: blur(38px);
        transition: background 620ms ease;
      }

      #library .signalExperienceTop,
      #library .signalStage {
        position: relative;
        z-index: 1;
      }

      #library .signalExperienceTop {
        z-index: 3 !important;
        padding-right: clamp(4px, 1vw, 16px);
      }

      #library .compactHint {
        margin-bottom: 4px !important;
        color: #a9b9ca !important;
      }

      #library .signalStage {
        --release-rgb: 92, 155, 255;
        overflow: visible !important;
        min-height: clamp(680px, 56vw, 790px) !important;
        isolation: isolate;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        transition: filter 560ms ease, opacity 560ms ease !important;
      }

      #library .signalStage[data-signal-state='alpha'],
      #library .signalStage[data-enter-state='alpha'],
      #library .signalStage[data-exit-state='alpha'] { --release-rgb: var(--ev-alpha-rgb); }

      #library .signalStage[data-signal-state='gamma'],
      #library .signalStage[data-enter-state='gamma'],
      #library .signalStage[data-exit-state='gamma'] { --release-rgb: var(--ev-gamma-rgb); }

      #library .signalStage[data-signal-state='theta'],
      #library .signalStage[data-enter-state='theta'],
      #library .signalStage[data-exit-state='theta'] { --release-rgb: var(--ev-theta-rgb); }

      #library .signalStage[data-signal-state='delta'],
      #library .signalStage[data-enter-state='delta'],
      #library .signalStage[data-exit-state='delta'] { --release-rgb: var(--ev-delta-rgb); }

      #library .signalStage[data-signal-state='abundance'],
      #library .signalStage[data-enter-state='abundance'],
      #library .signalStage[data-exit-state='abundance'] { --release-rgb: var(--ev-abundance-rgb); }

      #library .signalStage[data-enter-state] {
        animation: evChamberArrive 820ms cubic-bezier(0.16, 0.72, 0.26, 1) both;
      }

      #library .signalStage[data-exit-state] {
        animation: evChamberSettle 920ms cubic-bezier(0.2, 0.72, 0.2, 1) both;
      }

      #library .signalStage::before {
        inset: 7% 8% !important;
        opacity: 0.78 !important;
        border: 0 !important;
        background: repeating-radial-gradient(
          ellipse at center,
          rgba(116, 196, 255, 0.09) 0 1px,
          transparent 1px 66px
        ) !important;
        mask-image: radial-gradient(ellipse at center, #000 0%, #000 66%, transparent 91%) !important;
        -webkit-mask-image: radial-gradient(ellipse at center, #000 0%, #000 66%, transparent 91%) !important;
      }

      #library .signalStage::after {
        inset: -3% -4% !important;
        border: 0 !important;
        border-radius: 50% !important;
        opacity: 0.45 !important;
        background:
          linear-gradient(90deg, transparent 49.9%, rgba(114, 196, 255, 0.08) 50%, transparent 50.1%),
          linear-gradient(0deg, transparent 49.9%, rgba(114, 196, 255, 0.055) 50%, transparent 50.1%),
          conic-gradient(from 45deg at 50% 50%, transparent 0 11%, rgba(92, 177, 255, 0.045) 12%, transparent 13% 37%, rgba(92, 177, 255, 0.04) 38%, transparent 39% 62%, rgba(92, 177, 255, 0.04) 63%, transparent 64% 87%, rgba(92, 177, 255, 0.04) 88%, transparent 89% 100%) !important;
        mask-image: radial-gradient(ellipse at center, #000 0%, rgba(0, 0, 0, 0.88) 62%, transparent 88%);
        -webkit-mask-image: radial-gradient(ellipse at center, #000 0%, rgba(0, 0, 0, 0.88) 62%, transparent 88%);
      }

      /* Each frequency has a stronger, unmistakable color identity. */
      #library .signalNode {
        overflow: hidden;
        border-color: rgba(var(--node-rgb), 0.62) !important;
        background:
          radial-gradient(circle at 50% -8%, rgba(var(--node-rgb), 0.36), transparent 52%),
          linear-gradient(155deg, rgba(var(--node-rgb), 0.18), rgba(7, 19, 36, 0.96) 48%, rgba(2, 8, 18, 0.985)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.055),
          inset 0 0 34px rgba(var(--node-rgb), 0.055),
          0 20px 44px rgba(0, 0, 0, 0.3),
          0 0 34px rgba(var(--node-rgb), 0.1) !important;
      }

      #library .signalNode::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(120deg, transparent 18%, rgba(255, 255, 255, 0.07) 42%, transparent 62%);
        transform: translateX(-120%);
        transition: transform 520ms ease;
      }

      #library .signalNode:hover::before,
      #library .signalNode:focus-visible::before,
      #library .signalNode.active::before {
        transform: translateX(120%);
      }

      #library .signalNode:hover,
      #library .signalNode:focus-visible,
      #library .signalNode.active {
        border-color: rgba(var(--node-rgb), 0.98) !important;
        background:
          radial-gradient(circle at 50% -4%, rgba(var(--node-rgb), 0.52), transparent 56%),
          linear-gradient(155deg, rgba(var(--node-rgb), 0.3), rgba(7, 20, 38, 0.98) 50%, rgba(2, 8, 18, 1)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.09),
          inset 0 0 38px rgba(var(--node-rgb), 0.12),
          0 26px 54px rgba(0, 0, 0, 0.34),
          0 0 44px rgba(var(--node-rgb), 0.25) !important;
      }

      #library .signalPopupOverlay:not(.signalPopupExitGhost) {
        z-index: 6 !important;
        animation: evPopupArrival 500ms cubic-bezier(0.16, 0.82, 0.24, 1) both !important;
      }

      #library .signalPopupExitGhost {
        z-index: 6 !important;
        pointer-events: none !important;
        animation: evPopupExit 400ms cubic-bezier(0.4, 0, 0.8, 0.4) forwards !important;
      }

      #library .signalTransitionWave {
        --wave-rgb: 92, 155, 255;
        position: absolute;
        z-index: 4;
        left: 50%;
        top: 50%;
        width: 18%;
        aspect-ratio: 1;
        transform: translate(-50%, -50%) scale(0.45);
        border-radius: 50%;
        border: 1px solid rgba(var(--wave-rgb), 0.76);
        box-shadow:
          0 0 28px rgba(var(--wave-rgb), 0.36),
          inset 0 0 26px rgba(var(--wave-rgb), 0.14);
        pointer-events: none;
      }

      #library .signalTransitionWave.alpha { --wave-rgb: var(--ev-alpha-rgb); }
      #library .signalTransitionWave.gamma { --wave-rgb: var(--ev-gamma-rgb); }
      #library .signalTransitionWave.theta { --wave-rgb: var(--ev-theta-rgb); }
      #library .signalTransitionWave.delta { --wave-rgb: var(--ev-delta-rgb); }
      #library .signalTransitionWave.abundance { --wave-rgb: var(--ev-abundance-rgb); }

      #library .signalEnterWave {
        animation: evSignalArrival 860ms cubic-bezier(0.16, 0.72, 0.26, 1) forwards;
      }

      #library .signalExitWave {
        animation: evSignalRelease 940ms cubic-bezier(0.16, 0.72, 0.26, 1) forwards;
      }

      @keyframes evPopupArrival {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.76);
          filter: blur(10px) brightness(1.26);
        }
        62% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.025);
          filter: blur(0) brightness(1.08);
        }
        100% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
          filter: blur(0) brightness(1);
        }
      }

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

      @keyframes evSignalArrival {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.32);
        }
        18% { opacity: 0.96; }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(5.3);
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

      @keyframes evChamberArrive {
        0% { filter: saturate(0.92) brightness(0.94); }
        46% { filter: saturate(1.28) brightness(1.1); }
        100% { filter: saturate(1.06) brightness(1); }
      }

      @keyframes evChamberSettle {
        0% { filter: saturate(1.22) brightness(1.08); }
        45% { filter: saturate(1.08) brightness(1.025); }
        100% { filter: saturate(1) brightness(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        #library .signalPopupOverlay,
        #library .signalPopupExitGhost,
        #library .signalTransitionWave,
        #library .signalStage[data-enter-state],
        #library .signalStage[data-exit-state] {
          animation-duration: 1ms !important;
        }
      }

      @media (max-width: 860px) {
        #library::before {
          top: 9%;
          bottom: -4%;
        }

        #library .signalExperienceTop {
          padding-right: 0;
        }

        #library .signalExperience::after {
          inset: -4% -22% 0;
        }
      }

      @media (max-width: 560px) {
        #library .signalExperience.glassCard {
          margin-top: 18px !important;
        }

        #library .signalStage {
          min-height: 720px !important;
        }

        #library .signalTransitionWave {
          width: 25%;
        }

        #library .signalNode {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 0 26px rgba(var(--node-rgb), 0.06),
            0 14px 30px rgba(0, 0, 0, 0.26),
            0 0 24px rgba(var(--node-rgb), 0.09) !important;
        }
      }
    `}</style>
  );
}
