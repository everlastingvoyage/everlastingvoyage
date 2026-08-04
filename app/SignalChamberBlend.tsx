'use client';

import { useEffect } from 'react';

const signalStates = ['alpha', 'gamma', 'theta', 'delta', 'abundance'] as const;
type SignalState = (typeof signalStates)[number];
type SoundDirection = 'open' | 'close' | 'confirm';
type DataState = 'signalState' | 'restState' | 'enterState' | 'exitState';

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

    const setDataState = (name: DataState, state: SignalState | null) => {
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

        const roots: Record<SignalState, number> = {
          alpha: 523.25,
          gamma: 659.25,
          theta: 587.33,
          delta: 392,
          abundance: 698.46
        };

        const patterns: Record<SoundDirection, number[]> = {
          open: [1, 1.25, 1.5],
          close: [1.5, 1.25, 1],
          confirm: [1, 1.25, 1.5, 2]
        };

        const now = audioContext.currentTime;
        const master = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const notes = patterns[direction];

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(direction === 'confirm' ? 5200 : 4400, now);
        filter.Q.setValueAtTime(0.55, now);

        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(0.72, now + 0.012);
        master.gain.exponentialRampToValueAtTime(
          0.0001,
          now + (direction === 'confirm' ? 0.42 : 0.34)
        );
        master.connect(filter);
        filter.connect(audioContext.destination);

        notes.forEach((ratio, index) => {
          const start = now + index * (direction === 'confirm' ? 0.052 : 0.058);
          const duration = direction === 'confirm' ? 0.27 : 0.22;
          const oscillator = audioContext!.createOscillator();
          const noteGain = audioContext!.createGain();
          const frequency = roots[state] * ratio;

          oscillator.type = index % 2 === 0 ? 'triangle' : 'sine';
          oscillator.frequency.setValueAtTime(
            direction === 'close' ? frequency * 1.035 : frequency * 0.975,
            start
          );
          oscillator.frequency.exponentialRampToValueAtTime(
            direction === 'close' ? frequency * 0.97 : frequency * 1.018,
            start + duration
          );

          noteGain.gain.setValueAtTime(0.0001, start);
          noteGain.gain.exponentialRampToValueAtTime(
            direction === 'confirm' ? 0.014 : 0.011,
            start + 0.018
          );
          noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

          oscillator.connect(noteGain);
          noteGain.connect(master);
          oscillator.start(start);
          oscillator.stop(start + duration + 0.02);
        });
      } catch {
        // Sound is optional. Visual interaction always remains available.
      }
    };

    const createTransitionWave = (state: SignalState, direction: 'Enter' | 'Exit') => {
      const wave = document.createElement('span');
      wave.className = `signalTransitionWave signal${direction}Wave ${state}`;
      wave.setAttribute('aria-hidden', 'true');
      stage.appendChild(wave);
      window.setTimeout(() => wave.remove(), direction === 'Enter' ? 980 : 1500);
    };

    const arriveSignal = (state: SignalState) => {
      window.clearTimeout(arrivalTimer);
      setDataState('restState', state);
      setDataState('enterState', state);
      createTransitionWave(state, 'Enter');

      arrivalTimer = window.setTimeout(() => {
        setDataState('enterState', null);
      }, 940);
    };

    const releaseSignal = (popup: HTMLElement, state: SignalState) => {
      window.clearTimeout(releaseTimer);
      setDataState('signalState', null);
      setDataState('enterState', null);
      setDataState('restState', state);
      setDataState('exitState', state);

      const ghost = popup.cloneNode(true) as HTMLElement;
      ghost.classList.add('signalPopupExitGhost');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.querySelectorAll<HTMLElement>('button, a, input, textarea, select').forEach((item) => {
        item.tabIndex = -1;
      });
      stage.appendChild(ghost);

      createTransitionWave(state, 'Exit');

      window.setTimeout(() => ghost.remove(), 520);
      releaseTimer = window.setTimeout(() => {
        setDataState('exitState', null);
      }, 1480);
    };

    const syncPopup = () => {
      const currentPopup = stage.querySelector<HTMLElement>(
        '.signalPopupOverlay:not(.signalPopupExitGhost)'
      );
      const currentState = getSignalState(currentPopup);

      if (currentPopup && currentState) {
        window.clearTimeout(releaseTimer);
        setDataState('exitState', null);
        setDataState('restState', currentState);
        setDataState('signalState', currentState);

        if (currentPopup !== previousPopup || currentState !== previousState) {
          arriveSignal(currentState);
        }

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
      /* One full-width atmosphere: no rectangular chamber or nested card. */
      #library {
        --library-rgb: 92, 155, 255;
        position: relative;
        isolation: isolate;
        overflow: visible;
      }

      #library[data-rest-state='alpha'],
      #library[data-signal-state='alpha'],
      #library[data-enter-state='alpha'],
      #library[data-exit-state='alpha'] { --library-rgb: var(--ev-alpha-rgb); }

      #library[data-rest-state='gamma'],
      #library[data-signal-state='gamma'],
      #library[data-enter-state='gamma'],
      #library[data-exit-state='gamma'] { --library-rgb: var(--ev-gamma-rgb); }

      #library[data-rest-state='theta'],
      #library[data-signal-state='theta'],
      #library[data-enter-state='theta'],
      #library[data-exit-state='theta'] { --library-rgb: var(--ev-theta-rgb); }

      #library[data-rest-state='delta'],
      #library[data-signal-state='delta'],
      #library[data-enter-state='delta'],
      #library[data-exit-state='delta'] { --library-rgb: var(--ev-delta-rgb); }

      #library[data-rest-state='abundance'],
      #library[data-signal-state='abundance'],
      #library[data-enter-state='abundance'],
      #library[data-exit-state='abundance'] { --library-rgb: var(--ev-abundance-rgb); }

      #library::before {
        content: '';
        position: absolute;
        z-index: 0;
        top: -7%;
        bottom: -10%;
        left: 50%;
        width: 100vw;
        transform: translateX(-50%);
        pointer-events: none;
        background:
          radial-gradient(ellipse 76% 57% at 50% 53%, rgba(var(--library-rgb), 0.105), rgba(var(--library-rgb), 0.035) 48%, transparent 78%),
          radial-gradient(ellipse 31% 25% at 13% 48%, rgba(var(--ev-alpha-rgb), 0.035), transparent 80%),
          radial-gradient(ellipse 31% 25% at 87% 48%, rgba(var(--ev-gamma-rgb), 0.03), transparent 80%),
          linear-gradient(180deg, transparent 0%, rgba(3, 11, 23, 0.26) 17%, rgba(2, 8, 17, 0.44) 82%, transparent 100%);
        mask-image: linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%);
        -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%);
        transition: background 1500ms cubic-bezier(0.2, 0.7, 0.2, 1), filter 1500ms ease, opacity 1500ms ease;
      }

      #library[data-rest-state]::before {
        background:
          radial-gradient(ellipse 82% 60% at 50% 53%, rgba(var(--library-rgb), 0.14), rgba(var(--library-rgb), 0.045) 49%, transparent 80%),
          radial-gradient(ellipse 40% 31% at 14% 50%, rgba(var(--library-rgb), 0.035), transparent 80%),
          radial-gradient(ellipse 40% 31% at 86% 50%, rgba(var(--library-rgb), 0.032), transparent 80%),
          linear-gradient(180deg, transparent 0%, rgba(3, 11, 23, 0.28) 17%, rgba(2, 8, 17, 0.46) 82%, transparent 100%);
      }

      #library[data-signal-state]::before,
      #library[data-enter-state]::before {
        background:
          radial-gradient(ellipse 90% 67% at 50% 52%, rgba(var(--library-rgb), 0.235), rgba(var(--library-rgb), 0.082) 47%, transparent 82%),
          radial-gradient(ellipse 45% 34% at 13% 48%, rgba(var(--library-rgb), 0.055), transparent 80%),
          radial-gradient(ellipse 45% 34% at 87% 48%, rgba(var(--library-rgb), 0.052), transparent 80%),
          linear-gradient(180deg, transparent 0%, rgba(3, 11, 23, 0.25) 17%, rgba(2, 8, 17, 0.43) 82%, transparent 100%);
        filter: saturate(1.08) brightness(1.025);
      }

      #library[data-exit-state]::before {
        animation: evLibraryRelease 1480ms cubic-bezier(0.18, 0.76, 0.2, 1) both;
      }

      #library::after {
        content: '';
        position: absolute;
        z-index: 0;
        left: 50%;
        top: 13%;
        width: 100vw;
        height: 82%;
        transform: translateX(-50%);
        pointer-events: none;
        background: radial-gradient(ellipse 67% 59% at center, rgba(var(--library-rgb), 0.1), transparent 75%);
        filter: blur(76px);
        opacity: 0.88;
        transition: background 1500ms cubic-bezier(0.2, 0.7, 0.2, 1), opacity 1500ms ease;
      }

      #library .sectionIntro,
      #library .signalExperience {
        position: relative;
        z-index: 2;
      }

      #library .eyebrow,
      #library .compactHint .hintArrow {
        transition: color 1000ms ease, text-shadow 1000ms ease;
      }

      #library[data-rest-state] .eyebrow,
      #library[data-signal-state] .eyebrow,
      #library[data-rest-state] .compactHint .hintArrow,
      #library[data-signal-state] .compactHint .hintArrow {
        color: rgb(var(--library-rgb)) !important;
        text-shadow: 0 0 20px rgba(var(--library-rgb), 0.22);
      }

      #library .signalExperience.glassCard,
      #library .signalExperience {
        overflow: visible !important;
        margin-top: clamp(20px, 3vw, 38px) !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      #library .signalExperience::before {
        content: '' !important;
        position: absolute !important;
        z-index: 0 !important;
        inset: -18% -22% -12% !important;
        border: 0 !important;
        border-radius: 50% !important;
        background: radial-gradient(ellipse at center, rgba(var(--library-rgb), 0.09), transparent 73%) !important;
        filter: blur(70px) !important;
        opacity: 0.86 !important;
        pointer-events: none !important;
        transition: background 1500ms ease !important;
      }

      #library .signalExperience::after {
        content: none !important;
      }

      #library .signalExperienceTop,
      #library .signalStage {
        position: relative;
        z-index: 1;
      }

      #library .signalExperienceTop {
        z-index: 4 !important;
        padding-right: clamp(4px, 1vw, 16px);
      }

      #library .compactHint {
        margin-bottom: 4px !important;
        color: #a9b9ca !important;
      }

      /* Override every earlier state background, including the high-specificity :has rules. */
      #library .signalStage,
      #library .signalStage.popupOpen,
      #library .signalStage:has(.signalNode.active),
      #library .signalStage:has(.signalNode.alpha.active),
      #library .signalStage:has(.signalNode.gamma.active),
      #library .signalStage:has(.signalNode.theta.active),
      #library .signalStage:has(.signalNode.delta.active),
      #library .signalStage:has(.signalNode.abundance.active) {
        --release-rgb: 92, 155, 255;
        overflow: visible !important;
        min-height: clamp(680px, 56vw, 790px) !important;
        isolation: isolate;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      #library .signalStage[data-rest-state='alpha'],
      #library .signalStage[data-signal-state='alpha'],
      #library .signalStage[data-enter-state='alpha'],
      #library .signalStage[data-exit-state='alpha'] { --release-rgb: var(--ev-alpha-rgb); }

      #library .signalStage[data-rest-state='gamma'],
      #library .signalStage[data-signal-state='gamma'],
      #library .signalStage[data-enter-state='gamma'],
      #library .signalStage[data-exit-state='gamma'] { --release-rgb: var(--ev-gamma-rgb); }

      #library .signalStage[data-rest-state='theta'],
      #library .signalStage[data-signal-state='theta'],
      #library .signalStage[data-enter-state='theta'],
      #library .signalStage[data-exit-state='theta'] { --release-rgb: var(--ev-theta-rgb); }

      #library .signalStage[data-rest-state='delta'],
      #library .signalStage[data-signal-state='delta'],
      #library .signalStage[data-enter-state='delta'],
      #library .signalStage[data-exit-state='delta'] { --release-rgb: var(--ev-delta-rgb); }

      #library .signalStage[data-rest-state='abundance'],
      #library .signalStage[data-signal-state='abundance'],
      #library .signalStage[data-enter-state='abundance'],
      #library .signalStage[data-exit-state='abundance'] { --release-rgb: var(--ev-abundance-rgb); }

      #library .signalStage[data-enter-state] {
        animation: evChamberArrive 920ms cubic-bezier(0.16, 0.72, 0.26, 1) both;
      }

      #library .signalStage[data-exit-state] {
        animation: evChamberSettle 1480ms cubic-bezier(0.2, 0.72, 0.2, 1) both;
      }

      #library .signalStage::before {
        inset: 6% 5% !important;
        opacity: 0.72 !important;
        border: 0 !important;
        background: repeating-radial-gradient(
          ellipse at center,
          rgba(var(--release-rgb), 0.085) 0 1px,
          transparent 1px 66px
        ) !important;
        mask-image: radial-gradient(ellipse at center, #000 0%, #000 66%, transparent 92%) !important;
        -webkit-mask-image: radial-gradient(ellipse at center, #000 0%, #000 66%, transparent 92%) !important;
        transition: background 1200ms ease, opacity 1200ms ease !important;
      }

      #library .signalStage::after {
        inset: -8% -12% !important;
        border: 0 !important;
        border-radius: 50% !important;
        opacity: 0.42 !important;
        background:
          linear-gradient(90deg, transparent 49.9%, rgba(var(--release-rgb), 0.075) 50%, transparent 50.1%),
          linear-gradient(0deg, transparent 49.9%, rgba(var(--release-rgb), 0.052) 50%, transparent 50.1%),
          conic-gradient(from 45deg at 50% 50%, transparent 0 11%, rgba(var(--release-rgb), 0.04) 12%, transparent 13% 37%, rgba(var(--release-rgb), 0.035) 38%, transparent 39% 62%, rgba(var(--release-rgb), 0.035) 63%, transparent 64% 87%, rgba(var(--release-rgb), 0.035) 88%, transparent 89% 100%) !important;
        mask-image: radial-gradient(ellipse at center, #000 0%, rgba(0, 0, 0, 0.9) 64%, transparent 91%);
        -webkit-mask-image: radial-gradient(ellipse at center, #000 0%, rgba(0, 0, 0, 0.9) 64%, transparent 91%);
        transition: background 1200ms ease, opacity 1200ms ease !important;
      }

      /* Richer frequency nodes without becoming toy-like. */
      #library .signalNode {
        overflow: hidden;
        border-color: rgba(var(--node-rgb), 0.72) !important;
        background:
          radial-gradient(circle at 22% -4%, rgba(var(--node-rgb), 0.46), transparent 48%),
          radial-gradient(circle at 88% 118%, rgba(var(--node-rgb), 0.12), transparent 48%),
          linear-gradient(150deg, rgba(var(--node-rgb), 0.2), rgba(7, 19, 36, 0.965) 48%, rgba(2, 8, 18, 0.99)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.08),
          inset 0 0 38px rgba(var(--node-rgb), 0.075),
          0 20px 44px rgba(0, 0, 0, 0.3),
          0 0 38px rgba(var(--node-rgb), 0.13) !important;
        filter: saturate(1.08);
      }

      #library .signalNode::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(118deg, transparent 14%, rgba(255, 255, 255, 0.11) 41%, transparent 61%);
        transform: translateX(-125%);
        transition: transform 580ms ease;
      }

      #library .signalNode::after {
        content: '';
        position: absolute;
        left: 16%;
        right: 16%;
        bottom: 9px;
        height: 2px;
        border-radius: 999px;
        background: linear-gradient(90deg, transparent, rgba(var(--node-rgb), 0.9), transparent);
        opacity: 0.56;
        box-shadow: 0 0 14px rgba(var(--node-rgb), 0.48);
        pointer-events: none;
      }

      #library .signalNode:hover::before,
      #library .signalNode:focus-visible::before,
      #library .signalNode.active::before {
        transform: translateX(125%);
      }

      #library .signalNode:hover,
      #library .signalNode:focus-visible,
      #library .signalNode.active {
        border-color: rgba(var(--node-rgb), 1) !important;
        background:
          radial-gradient(circle at 25% -2%, rgba(var(--node-rgb), 0.64), transparent 54%),
          radial-gradient(circle at 90% 115%, rgba(var(--node-rgb), 0.2), transparent 50%),
          linear-gradient(150deg, rgba(var(--node-rgb), 0.34), rgba(7, 20, 38, 0.985) 52%, rgba(2, 8, 18, 1)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.12),
          inset 0 0 42px rgba(var(--node-rgb), 0.15),
          0 26px 56px rgba(0, 0, 0, 0.34),
          0 0 48px rgba(var(--node-rgb), 0.3) !important;
      }

      #library .signalPopupOverlay:not(.signalPopupExitGhost) {
        z-index: 6 !important;
        animation: evPopupArrival 560ms cubic-bezier(0.16, 0.82, 0.24, 1) both !important;
      }

      #library .signalPopupExitGhost {
        z-index: 6 !important;
        pointer-events: none !important;
        animation: evPopupExit 500ms cubic-bezier(0.4, 0, 0.8, 0.4) forwards !important;
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
          0 0 32px rgba(var(--wave-rgb), 0.38),
          inset 0 0 28px rgba(var(--wave-rgb), 0.15);
        pointer-events: none;
      }

      #library .signalTransitionWave.alpha { --wave-rgb: var(--ev-alpha-rgb); }
      #library .signalTransitionWave.gamma { --wave-rgb: var(--ev-gamma-rgb); }
      #library .signalTransitionWave.theta { --wave-rgb: var(--ev-theta-rgb); }
      #library .signalTransitionWave.delta { --wave-rgb: var(--ev-delta-rgb); }
      #library .signalTransitionWave.abundance { --wave-rgb: var(--ev-abundance-rgb); }

      #library .signalEnterWave {
        animation: evSignalArrival 940ms cubic-bezier(0.16, 0.72, 0.26, 1) forwards;
      }

      #library .signalExitWave {
        animation: evSignalRelease 1480ms cubic-bezier(0.16, 0.72, 0.26, 1) forwards;
      }

      @keyframes evPopupArrival {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.74);
          filter: blur(11px) brightness(1.28);
        }
        64% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.024);
          filter: blur(0) brightness(1.07);
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
          transform: translate(-50%, -52%) scale(0.955);
          filter: blur(8px);
        }
      }

      @keyframes evSignalArrival {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.28); }
        18% { opacity: 0.96; }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(6.2); }
      }

      @keyframes evSignalRelease {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.48); }
        18% { opacity: 0.88; }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(6.4); }
      }

      @keyframes evChamberArrive {
        0% { filter: saturate(0.92) brightness(0.94); }
        46% { filter: saturate(1.25) brightness(1.08); }
        100% { filter: saturate(1.07) brightness(1); }
      }

      @keyframes evChamberSettle {
        0% { filter: saturate(1.18) brightness(1.06); }
        52% { filter: saturate(1.08) brightness(1.02); }
        100% { filter: saturate(1) brightness(1); }
      }

      @keyframes evLibraryRelease {
        0% { filter: saturate(1.12) brightness(1.035); opacity: 1; }
        58% { filter: saturate(1.04) brightness(1.012); opacity: 0.98; }
        100% { filter: saturate(1) brightness(1); opacity: 0.95; }
      }

      @media (prefers-reduced-motion: reduce) {
        #library .signalPopupOverlay,
        #library .signalPopupExitGhost,
        #library .signalTransitionWave,
        #library .signalStage[data-enter-state],
        #library .signalStage[data-exit-state],
        #library[data-exit-state]::before {
          animation-duration: 1ms !important;
        }
      }

      @media (max-width: 860px) {
        #library::before {
          top: -2%;
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

        #library .signalTransitionWave {
          width: 26%;
        }

        #library .signalNode {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.07),
            inset 0 0 28px rgba(var(--node-rgb), 0.08),
            0 14px 30px rgba(0, 0, 0, 0.26),
            0 0 28px rgba(var(--node-rgb), 0.14) !important;
        }
      }
    `}</style>
  );
}
