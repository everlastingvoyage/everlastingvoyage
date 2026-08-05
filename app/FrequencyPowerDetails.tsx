'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import {
  startFrequencyPreview,
  stopActiveFrequencyPreview,
  type FrequencyPreviewHandle
} from './frequency-preview-audio';

type StateId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';
type PopupPhase = 'idle' | 'open' | 'closing';

type FrequencyPower = {
  id: StateId;
  frequency: string;
  hz: string;
  state: string;
  promise: string;
  benefits: string[];
  uses: string[];
  technical: string;
  guidance: string;
  recommended: string;
  listeningType: string;
  leftHz: number;
  rightHz: number;
  actionLabel: string;
};

const powers: Record<StateId, FrequencyPower> = {
  alpha: {
    id: 'alpha',
    frequency: 'Alpha',
    hz: '10 Hz',
    state: 'Calm Focus',
    promise: 'Enter a clear, steady state for learning, planning and focused work without unnecessary pressure.',
    benefits: ['Supports sustained attention', 'Creates a calmer entry into study', 'Helps organize attention around one task'],
    uses: ['Studying', 'Reading', 'Planning', 'Morning clarity', 'Steady work'],
    technical: 'Left 180 Hz · Right 190 Hz · 10 Hz difference',
    guidance: 'Keep volume moderate · Begin in a quiet setting',
    recommended: '25–60 minutes',
    listeningType: 'Binaural signal · Headphones required for the binaural effect',
    leftHz: 180,
    rightHz: 190,
    actionLabel: 'Build a Calm Focus voyage'
  },
  gamma: {
    id: 'gamma',
    frequency: 'Gamma',
    hz: '40 Hz',
    state: 'Deep Focus',
    promise: 'Enter a sharper, high-attention atmosphere for demanding work, research and complex problem solving.',
    benefits: ['Supports high-demand concentration', 'Encourages active information processing', 'Designed for precise analytical sessions'],
    uses: ['Research', 'Programming', 'Complex study', 'Problem solving', 'Deep work'],
    technical: 'Left 220 Hz · Right 260 Hz · 40 Hz difference',
    guidance: 'Begin at a low volume · Best for active work',
    recommended: '25–50 minutes',
    listeningType: 'Binaural signal · Headphones required for the binaural effect',
    leftHz: 220,
    rightHz: 260,
    actionLabel: 'Build a Deep Focus voyage'
  },
  theta: {
    id: 'theta',
    frequency: 'Theta',
    hz: '4 Hz',
    state: 'Creative Flow',
    promise: 'Enter a slower, more imaginative state for original thought, reflection and visualization.',
    benefits: ['Encourages creative ideation', 'Supports reflective thinking', 'Creates space for mental flexibility'],
    uses: ['Writing', 'Brainstorming', 'Meditation', 'Journaling', 'Visualization'],
    technical: 'Left 95 Hz · Right 99 Hz · 4 Hz difference',
    guidance: 'Keep volume moderate · Best in a quiet setting',
    recommended: '25–60 minutes',
    listeningType: 'Binaural signal · Headphones required for the binaural effect',
    leftHz: 95,
    rightHz: 99,
    actionLabel: 'Build a Creative Flow voyage'
  },
  delta: {
    id: 'delta',
    frequency: 'Delta',
    hz: '2 Hz',
    state: 'Deep Rest',
    promise: 'Enter a cold, quiet and deeply slowed atmosphere designed for wind-down rituals and sleep preparation.',
    benefits: ['Supports progressive relaxation', 'Helps reduce stimulation before rest', 'Encourages a deliberate transition into stillness'],
    uses: ['Sleep preparation', 'Evening wind-down', 'Rest', 'Slow breathing', 'Recovery rituals'],
    technical: 'Left 70 Hz · Right 72 Hz · 2 Hz difference',
    guidance: 'Use only when resting safely · Begin at a low volume',
    recommended: '40–60 minutes',
    listeningType: 'Binaural signal · Headphones required for the binaural effect',
    leftHz: 70,
    rightHz: 72,
    actionLabel: 'Build a Deep Rest voyage'
  },
  abundance: {
    id: 'abundance',
    frequency: 'Pure Tone',
    hz: '888 Hz',
    state: 'Abundance',
    promise: 'Enter a warm ceremonial space for intention, visualization, gratitude and focused manifestation rituals.',
    benefits: ['Supports deliberate visualization', 'Creates a symbolic focus point', 'Pairs intention with a repeatable ritual'],
    uses: ['Manifestation', 'Affirmations', 'Gratitude', 'Journaling', 'Ceremonial meditation'],
    technical: 'Pure 888 Hz tone · Clean uninterrupted signal',
    guidance: 'Start at a very low volume · Speakers or headphones',
    recommended: '15–40 minutes',
    listeningType: 'Pure tone · Speakers or headphones',
    leftHz: 888,
    rightHz: 888,
    actionLabel: 'Build an Abundance voyage'
  }
};

function getNodeId(element: Element | null): StateId | null {
  if (!element) return null;
  const ids: StateId[] = ['alpha', 'gamma', 'theta', 'delta', 'abundance'];
  return ids.find((id) => element.classList.contains(id)) ?? null;
}

function nextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

function waitForBackdropTransition(element: HTMLElement | null, timeoutMs = 430) {
  return new Promise<void>((resolve) => {
    if (!element) {
      window.setTimeout(resolve, timeoutMs);
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      element.removeEventListener('transitionend', handleTransitionEnd);
      window.clearTimeout(fallback);
      resolve();
    };
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === element && event.propertyName === 'opacity') finish();
    };
    const fallback = window.setTimeout(finish, timeoutMs);
    element.addEventListener('transitionend', handleTransitionEnd);
  });
}

export default function FrequencyPowerDetails() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [activeId, setActiveId] = useState<StateId | null>(null);
  const [phase, setPhase] = useState<PopupPhase>('idle');
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'starting' | 'playing'>('idle');
  const [previewProgress, setPreviewProgress] = useState(0);
  const previewHandleRef = useRef<FrequencyPreviewHandle | null>(null);
  const previewIntervalRef = useRef<number | undefined>(undefined);
  const previewRequestRef = useRef(0);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const closeRunRef = useRef(0);
  const cleanupTimerRef = useRef<number | undefined>(undefined);
  const active = useMemo(() => activeId ? powers[activeId] : null, [activeId]);

  const stopPreview = useCallback(() => {
    previewRequestRef.current += 1;
    previewHandleRef.current?.stop();
    previewHandleRef.current = null;
    stopActiveFrequencyPreview();
    if (previewIntervalRef.current) window.clearInterval(previewIntervalRef.current);
    previewIntervalRef.current = undefined;
    setPreviewStatus('idle');
    setPreviewProgress(0);
  }, []);

  const removeLegacyGhosts = useCallback(() => {
    document.querySelectorAll<HTMLElement>('#library .signalPopupExitGhost').forEach((ghost) => ghost.remove());
  }, []);

  const clearChamberExitState = useCallback(() => {
    const library = document.querySelector<HTMLElement>('#library');
    const stage = library?.querySelector<HTMLElement>('.signalStage');
    removeLegacyGhosts();

    [library, stage].forEach((element) => {
      if (!element) return;
      delete element.dataset.popupPhase;
      delete element.dataset.signalState;
      delete element.dataset.enterState;
      delete element.dataset.exitState;
      delete element.dataset.restState;
    });

    window.dispatchEvent(new CustomEvent('ev:frequency-popup-cleanup'));
  }, [removeLegacyGhosts]);

  useEffect(() => {
    const library = document.querySelector<HTMLElement>('#library');
    const stage = library?.querySelector<HTMLElement>('.signalStage');
    const isOpen = phase !== 'idle' || Boolean(active);

    document.body.classList.toggle('ev-frequency-power-open', isOpen);
    document.body.classList.toggle('ev-frequency-power-closing', phase === 'closing');

    [library, stage].forEach((element) => {
      if (!element) return;
      if (phase === 'idle') delete element.dataset.popupPhase;
      else element.dataset.popupPhase = phase;
    });
  }, [active, phase]);

  useEffect(() => () => {
    document.body.classList.remove('ev-frequency-power-open', 'ev-frequency-power-closing');
    if (cleanupTimerRef.current) window.clearTimeout(cleanupTimerRef.current);
    clearChamberExitState();
  }, [clearChamberExitState]);

  useEffect(() => {
    if (!enabled) return;
    const handleSignalClick = (event: MouseEvent) => {
      const node = (event.target as Element | null)?.closest('.signalNode') ?? null;
      const id = getNodeId(node);
      if (!id || phase === 'closing') return;

      closeRunRef.current += 1;
      if (cleanupTimerRef.current) window.clearTimeout(cleanupTimerRef.current);
      clearChamberExitState();
      stopPreview();
      setActiveId(id);
      setPhase('open');
    };
    document.addEventListener('click', handleSignalClick, true);
    return () => document.removeEventListener('click', handleSignalClick, true);
  }, [clearChamberExitState, enabled, phase, stopPreview]);

  useEffect(() => {
    if (phase !== 'closing') return;
    const stage = document.querySelector<HTMLElement>('#library .signalStage');
    if (!stage) return;

    const removeGhosts = () => removeLegacyGhosts();
    const observer = new MutationObserver(removeGhosts);
    observer.observe(stage, { childList: true, subtree: true });
    removeGhosts();
    return () => observer.disconnect();
  }, [phase, removeLegacyGhosts]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') stopPreview();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stopPreview]);

  useEffect(() => () => stopPreview(), [stopPreview]);

  const completeLegacyExit = useCallback(async (selector: '.signalPopupClose' | '.signalPopupAction') => {
    if (!active || phase === 'closing') return;

    const runId = closeRunRef.current + 1;
    closeRunRef.current = runId;
    stopPreview();
    setPhase('closing');

    await nextPaint();
    await waitForBackdropTransition(backdropRef.current);
    if (closeRunRef.current !== runId) return;

    document.querySelector<HTMLButtonElement>(selector)?.click();
    removeLegacyGhosts();
    setActiveId(null);

    cleanupTimerRef.current = window.setTimeout(() => {
      if (closeRunRef.current !== runId) return;
      clearChamberExitState();
      setPhase('idle');
    }, 620);
  }, [active, clearChamberExitState, phase, removeLegacyGhosts, stopPreview]);

  const close = useCallback(() => {
    void completeLegacyExit('.signalPopupClose');
  }, [completeLegacyExit]);

  const applyState = useCallback(() => {
    void completeLegacyExit('.signalPopupAction');
  }, [completeLegacyExit]);

  const togglePreview = useCallback(async () => {
    if (!active || phase !== 'open') return;
    if (previewStatus !== 'idle') {
      stopPreview();
      return;
    }

    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    setPreviewStatus('starting');
    setPreviewProgress(0);
    const startedAt = performance.now();

    const handle = await startFrequencyPreview(
      { leftHz: active.leftHz, rightHz: active.rightHz, durationMs: 10000 },
      () => {
        if (previewRequestRef.current !== requestId) return;
        if (previewIntervalRef.current) window.clearInterval(previewIntervalRef.current);
        previewIntervalRef.current = undefined;
        previewHandleRef.current = null;
        setPreviewProgress(100);
        window.setTimeout(() => {
          if (previewRequestRef.current === requestId) {
            setPreviewStatus('idle');
            setPreviewProgress(0);
          }
        }, 500);
      }
    );

    if (previewRequestRef.current !== requestId) {
      handle?.stop();
      return;
    }

    if (!handle) {
      setPreviewStatus('idle');
      setPreviewProgress(0);
      return;
    }

    previewHandleRef.current = handle;
    setPreviewStatus('playing');
    previewIntervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      setPreviewProgress(Math.min(100, (elapsed / handle.durationMs) * 100));
    }, 100);
  }, [active, phase, previewStatus, stopPreview]);

  useEffect(() => {
    if (!active) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, close]);

  if (!enabled || !active || typeof document === 'undefined') return null;

  const previewStyle = {
    '--ev-preview-progress': `${previewProgress}%`
  } as CSSProperties;

  return createPortal(
    <div
      ref={backdropRef}
      className={`evFrequencyPowerBackdrop ${active.id} ${phase === 'closing' ? 'closing' : ''}`}
      role="presentation"
      aria-busy={phase === 'closing'}
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <article className={`evFrequencyPowerCard ${active.id}`} role="dialog" aria-modal="true" aria-labelledby="ev-frequency-power-title">
        <div className="evFrequencyPowerTop">
          <span>{active.frequency} · {active.hz}</span>
          <button type="button" onClick={close} aria-label="Close frequency details" disabled={phase === 'closing'}>×</button>
        </div>

        <div className="evFrequencyPowerHero">
          <p>State potential</p>
          <h2 id="ev-frequency-power-title">{active.state}</h2>
          <strong>{active.promise}</strong>
        </div>

        <div className="evFrequencyInfoStrip">
          <article>
            <span>Recommended duration</span>
            <strong>{active.recommended}</strong>
          </article>
          <article>
            <span>Listening type</span>
            <strong>{active.listeningType}</strong>
          </article>
        </div>

        <div className="evFrequencyPowerGrid">
          <section>
            <h3>What this state supports</h3>
            <ul>{active.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
          </section>
          <section>
            <h3>Best used for</h3>
            <div className="evFrequencyUseChips">{active.uses.map((item) => <span key={item}>{item}</span>)}</div>
          </section>
        </div>

        <div className="evFrequencyTechnical">
          <span>{active.technical}</span>
          <span>{active.guidance}</span>
        </div>

        <div className="evFrequencyPowerActions">
          <button
            type="button"
            className={`evFrequencyPreviewAction ${previewStatus}`}
            onClick={togglePreview}
            aria-pressed={previewStatus === 'playing'}
            style={previewStyle}
            disabled={phase === 'closing'}
          >
            <span aria-hidden="true">{previewStatus === 'playing' ? '■' : '▶'}</span>
            {previewStatus === 'starting'
              ? 'Preparing signal…'
              : previewStatus === 'playing'
                ? 'Stop preview'
                : 'Preview signal · 10 sec'}
          </button>
          <button type="button" className="evFrequencyPowerAction" onClick={applyState} disabled={phase === 'closing'}>
            {active.actionLabel} <span aria-hidden="true">→</span>
          </button>
        </div>
      </article>
    </div>,
    document.body
  );
}
