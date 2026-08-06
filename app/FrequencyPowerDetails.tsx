'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import {
  frequencyCatalog,
  getFrequencyIdFromElement,
  type FrequencyId
} from './frequency-catalog';
import {
  startFrequencyPreview,
  stopActiveFrequencyPreview,
  type FrequencyPreviewHandle
} from './frequency-preview-audio';

type PopupPhase = 'idle' | 'open' | 'closing';

function nextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function waitForExitAnimation(element: HTMLElement | null, timeoutMs = 180) {
  return new Promise<void>((resolve) => {
    if (!element) {
      window.setTimeout(resolve, timeoutMs);
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      element.removeEventListener('animationend', handleAnimationEnd);
      window.clearTimeout(fallback);
      resolve();
    };
    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target === element) finish();
    };
    const fallback = window.setTimeout(finish, timeoutMs);
    element.addEventListener('animationend', handleAnimationEnd);
  });
}

export default function FrequencyPowerDetails() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [activeId, setActiveId] = useState<FrequencyId | null>(null);
  const [phase, setPhase] = useState<PopupPhase>('idle');
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'starting' | 'playing'>('idle');
  const [previewProgress, setPreviewProgress] = useState(0);
  const previewHandleRef = useRef<FrequencyPreviewHandle | null>(null);
  const previewIntervalRef = useRef<number | undefined>(undefined);
  const previewRequestRef = useRef(0);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeRunRef = useRef(0);
  const active = activeId ? frequencyCatalog[activeId] : null;

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
    clearChamberExitState();
  }, [clearChamberExitState]);

  useEffect(() => {
    if (!enabled) return;

    const handleSignalClick = (event: MouseEvent) => {
      const node = (event.target as Element | null)?.closest<HTMLElement>('.signalNode') ?? null;
      const id = getFrequencyIdFromElement(node);
      if (!id || phase === 'closing') return;

      triggerRef.current = node;
      closeRunRef.current += 1;
      clearChamberExitState();
      stopPreview();
      setActiveId(id);
      setPhase('open');
    };

    document.addEventListener('click', handleSignalClick, true);
    return () => document.removeEventListener('click', handleSignalClick, true);
  }, [clearChamberExitState, enabled, phase, stopPreview]);

  useEffect(() => {
    if (phase !== 'open') return;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [phase, activeId]);

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
    await waitForExitAnimation(backdropRef.current);
    if (closeRunRef.current !== runId) return;

    document.querySelector<HTMLButtonElement>(selector)?.click();

    /* The legacy MutationObserver creates its exit clone in a microtask after
       the hidden button click. Keep closing state alive for one paint, remove
       that inert clone, then release the portal immediately. */
    await nextPaint();
    if (closeRunRef.current !== runId) return;

    removeLegacyGhosts();
    clearChamberExitState();
    setActiveId(null);
    setPhase('idle');

    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (selector === '.signalPopupClose' && trigger) {
      window.requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
    }
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

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

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
      <article
        className={`evFrequencyPowerCard ${active.id}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ev-frequency-power-title"
        aria-describedby="ev-frequency-power-description"
      >
        <div className="evFrequencyPowerTop">
          <span>{active.frequency} · {active.hz}</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Close frequency details"
            disabled={phase === 'closing'}
          >
            ×
          </button>
        </div>

        <div className="evFrequencyPowerHero">
          <p>State potential</p>
          <h2 id="ev-frequency-power-title">{active.state}</h2>
          <strong id="ev-frequency-power-description">{active.promise}</strong>
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
