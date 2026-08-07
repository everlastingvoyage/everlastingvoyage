'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

type CompletionMeta = {
  state: string;
  frequency: string;
  hz: string;
};

type PreserveOptions = {
  label: string;
  successLabel: string;
  description: string;
  icon: string;
  successPattern: RegExp;
  successClass: string;
  rowClass: string;
};

const completionMeta: Record<string, CompletionMeta> = {
  alpha: { state: 'Calm Focus', frequency: 'Alpha', hz: '10 Hz' },
  gamma: { state: 'Gamma Clarity', frequency: 'Gamma', hz: '40 Hz' },
  theta: { state: 'Reflective Space', frequency: 'Theta', hz: '4 Hz' },
  delta: { state: 'Deep Rest', frequency: 'Delta', hz: '2 Hz' },
  abundance: { state: 'Abundance', frequency: 'Pure Tone', hz: '888 Hz' }
};

function setText(element: HTMLElement | null | undefined, value: string) {
  if (element && element.textContent !== value) element.textContent = value;
}

function getCompletionMeta(overlay: HTMLElement | null): CompletionMeta {
  const id = Object.keys(completionMeta).find((candidate) => overlay?.classList.contains(candidate));
  return completionMeta[id ?? 'alpha'];
}

function ensureCompletionMessage(completion: HTMLElement, summary: HTMLElement | null) {
  let message = completion.querySelector<HTMLElement>('.evCompletionMessage');
  if (!message) {
    message = document.createElement('p');
    message.className = 'evCompletionMessage';
    summary?.insertAdjacentElement('afterend', message);
  }
  setText(message, 'Your session is complete.');
}

function ensurePreserveCard(actions: HTMLElement) {
  let preserve = actions.querySelector<HTMLElement>('.evCompletionPreserve');

  if (!preserve) {
    preserve = document.createElement('section');
    preserve.className = 'evCompletionPreserve';
    preserve.setAttribute('aria-label', 'Keep this voyage');
    actions.appendChild(preserve);
  }

  let copy = preserve.querySelector<HTMLElement>('.evCompletionPreserveCopy');
  if (!copy) {
    copy = document.createElement('div');
    copy.className = 'evCompletionPreserveCopy';
    preserve.prepend(copy);
  }

  if (copy.dataset.completionCopy !== 'v11.8') {
    copy.dataset.completionCopy = 'v11.8';
    copy.innerHTML = `
      <span class="evCompletionPreserveIcon" aria-hidden="true">✦</span>
      <div>
        <p>Keep this voyage</p>
        <strong>Save the setup or preserve your thoughts.</strong>
      </div>
    `;
  }

  let preserveActions = preserve.querySelector<HTMLElement>('.evCompletionPreserveActions');
  if (!preserveActions) {
    preserveActions = document.createElement('div');
    preserveActions.className = 'evCompletionPreserveActions';
    preserveActions.setAttribute('aria-label', 'Voyage preservation tools');
    preserve.appendChild(preserveActions);
  }

  return preserve;
}

function ensureActionPresentation(
  button: HTMLButtonElement,
  options: PreserveOptions,
  completed: boolean
) {
  const root = button.parentElement;
  if (!root) return;

  root.classList.add('evCompletionActionRoot', options.rowClass);
  button.classList.add('evCompletionActionHitArea');

  let presentation = root.querySelector<HTMLElement>('.evCompletionActionPresentation');
  if (!presentation) {
    presentation = document.createElement('div');
    presentation.className = 'evCompletionActionPresentation';
    presentation.setAttribute('aria-hidden', 'true');
    presentation.innerHTML = `
      <span class="evCompletionActionIcon"></span>
      <span class="evCompletionActionCopy">
        <strong></strong>
        <small></small>
      </span>
      <span class="evCompletionActionChevron">›</span>
    `;
    root.appendChild(presentation);
  }

  root.classList.toggle('is-complete', completed);
  setText(presentation.querySelector<HTMLElement>('.evCompletionActionIcon'), completed ? '✓' : options.icon);
  setText(
    presentation.querySelector<HTMLElement>('.evCompletionActionCopy strong'),
    completed ? options.successLabel : options.label
  );
  setText(presentation.querySelector<HTMLElement>('.evCompletionActionCopy small'), options.description);
  setText(presentation.querySelector<HTMLElement>('.evCompletionActionChevron'), completed ? '✓' : '›');
}

function configurePreserveButton(button: HTMLButtonElement | null, options: PreserveOptions) {
  if (!button) return;

  const originalText = button.textContent?.trim() ?? '';
  const completed = button.classList.contains(options.successClass) || options.successPattern.test(originalText);
  button.classList.toggle(options.successClass, completed);
  button.dataset.completionIcon = options.icon;
  button.dataset.completionDescription = options.description;
  button.setAttribute('aria-label', `${completed ? options.successLabel : options.label}. ${options.description}`);
  setText(button, completed ? options.successLabel : options.label);
  ensureActionPresentation(button, options, completed);
}

export default function V10CompletionFlow() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const activeCompletionRef = useRef<HTMLElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let syncFrame: number | null = null;
    let observedOverlay: HTMLElement | null = null;
    let overlayObserver: MutationObserver | null = null;

    const resetCompletionPosition = (overlay: HTMLElement, completion: HTMLElement) => {
      if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        const previousBehavior = overlay.style.scrollBehavior;
        overlay.style.scrollBehavior = 'auto';
        overlay.scrollTop = 0;
        completion.scrollIntoView({ block: 'start', behavior: 'auto' });
        overlay.scrollTop = 0;
        overlay.style.scrollBehavior = previousBehavior;
      });
    };

    const syncCompletion = () => {
      const completion = document.querySelector<HTMLElement>('.v10Completion');
      const actions = completion?.querySelector<HTMLElement>('.v10CompletionActions');

      const thoughtInput = document.querySelector<HTMLInputElement>('#v10-thought');
      if (thoughtInput && thoughtInput.placeholder !== 'Capture it without leaving the voyage') {
        thoughtInput.placeholder = 'Capture it without leaving the voyage';
      }

      if (!completion || !actions) {
        activeCompletionRef.current = null;
        return;
      }

      completion.classList.add('evCompletionEnhanced', 'evCompletionClear', 'evCompletionPolished');
      const overlay = completion.closest<HTMLElement>('.v10SessionOverlay');
      const meta = getCompletionMeta(overlay);
      const eyebrow = completion.querySelector<HTMLElement>('.v10SessionEyebrow');
      const title = completion.querySelector<HTMLElement>('h2');
      const summary = completion.querySelector<HTMLElement>('.v10CompletionSummary');
      const duration = summary?.textContent?.split('·')[0]?.trim() || '25 minutes';

      setText(eyebrow, 'Voyage complete');
      setText(title, meta.state);
      setText(summary, `${duration} · ${meta.frequency} · ${meta.hz}`);
      ensureCompletionMessage(completion, summary);

      const repeat = actions.querySelector<HTMLButtonElement>('.v10PrimaryAction');
      const secondary = actions.querySelector<HTMLButtonElement>('.v10SecondaryAction:not(.evSaveNotesButton):not(.evCopyNotesButton):not(.evSaveSpaceCompletionButton)');
      const returnButton = actions.querySelector<HTMLButtonElement>('.v10TextAction');

      repeat?.classList.add('evCompletionRepeat');
      if (secondary) {
        secondary.classList.add('evCompletionChoose');
        setText(secondary, 'Choose another state');
      }
      if (returnButton) {
        returnButton.classList.add('evCompletionReturn');
        setText(returnButton, 'Return home');
      }

      const thoughts = completion.querySelector<HTMLElement>('.v10CompletionThoughts');
      const thoughtsLabel = thoughts?.querySelector<HTMLElement>('span');
      const thoughtCount = thoughts?.querySelectorAll('p').length ?? 0;
      if (thoughtsLabel && thoughtCount > 0) setText(thoughtsLabel, `Captured thoughts · ${thoughtCount}`);

      const preserve = ensurePreserveCard(actions);
      const preserveActions = preserve.querySelector<HTMLElement>('.evCompletionPreserveActions');
      if (!preserveActions) return;

      const spaceRoot = actions.querySelector<HTMLElement>('#ev-save-space-completion-root');
      const saveRoot = actions.querySelector<HTMLElement>('#ev-save-notes-root');
      const copyRoot = actions.querySelector<HTMLElement>('#ev-copy-notes-root');
      if (spaceRoot && spaceRoot.parentElement !== preserveActions) preserveActions.appendChild(spaceRoot);
      if (saveRoot && saveRoot.parentElement !== preserveActions) preserveActions.appendChild(saveRoot);
      if (copyRoot && copyRoot.parentElement !== preserveActions) preserveActions.appendChild(copyRoot);

      configurePreserveButton(
        preserveActions.querySelector<HTMLButtonElement>('.evSaveSpaceCompletionButton'),
        {
          label: 'Save setup',
          successLabel: 'Setup saved',
          description: 'Reuse this exact voyage',
          icon: '∞',
          successPattern: /setup saved|voyage setup saved/i,
          successClass: 'is-saved',
          rowClass: 'is-setup'
        }
      );

      const saveButton = preserveActions.querySelector<HTMLButtonElement>('.evSaveNotesButton');
      configurePreserveButton(saveButton, {
        label: saveButton?.textContent?.toLowerCase().includes('add a thought') ? 'Add a thought first' : 'Save thoughts',
        successLabel: 'Thoughts saved',
        description: 'Add captured thoughts to Notes',
        icon: '▤',
        successPattern: /saved to notes|thoughts saved/i,
        successClass: 'is-saved',
        rowClass: 'is-thoughts'
      });
      if (saveButton) saveButton.disabled = false;

      configurePreserveButton(
        preserveActions.querySelector<HTMLButtonElement>('.evCopyNotesButton'),
        {
          label: 'Copy thoughts',
          successLabel: 'Thoughts copied',
          description: 'Paste them anywhere',
          icon: '⧉',
          successPattern: /copied/i,
          successClass: 'is-copied',
          rowClass: 'is-copy'
        }
      );

      if (activeCompletionRef.current !== completion && overlay) {
        activeCompletionRef.current = completion;
        resetCompletionPosition(overlay, completion);
        window.dispatchEvent(new CustomEvent('ev:voyage-completed'));
      }
    };

    const scheduleSync = () => {
      if (syncFrame !== null) return;
      syncFrame = window.requestAnimationFrame(() => {
        syncFrame = null;
        syncCompletion();
      });
    };

    const attachOverlayObserver = () => {
      const nextOverlay = document.querySelector<HTMLElement>('.v10SessionOverlay');
      if (nextOverlay === observedOverlay) return;
      overlayObserver?.disconnect();
      overlayObserver = null;
      observedOverlay = nextOverlay;
      if (!nextOverlay) {
        activeCompletionRef.current = null;
        return;
      }
      overlayObserver = new MutationObserver(scheduleSync);
      overlayObserver.observe(nextOverlay, { childList: true, subtree: true });
      scheduleSync();
    };

    const bodyObserver = new MutationObserver(attachOverlayObserver);
    bodyObserver.observe(document.body, { childList: true });

    const handleCompleted = () => scheduleSync();

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const endButton = target?.closest<HTMLButtonElement>('.v10TimerControls .v10TextAction');
      if (endButton && /end session|ending/i.test(endButton.textContent || '')) {
        if (endButton.dataset.voyageEnding === 'true') {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }
        endButton.dataset.voyageEnding = 'true';
        endButton.setAttribute('aria-disabled', 'true');
        setText(endButton, 'Ending…');
      }

      const returnButton = target?.closest<HTMLButtonElement>('.evCompletionReturn');
      if (returnButton) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (returnButton.dataset.returningHome === 'true') return;

        returnButton.dataset.returningHome = 'true';
        returnButton.setAttribute('aria-disabled', 'true');
        setText(returnButton, 'Returning home…');

        const root = document.documentElement;
        const previousBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';

        const closeButton = document.querySelector<HTMLButtonElement>('.v10CloseSession');
        if (closeButton) {
          closeButton.dataset.skipScrollRestore = 'true';
          closeButton.click();
        }

        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        window.setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
          window.dispatchEvent(new CustomEvent('ev:voyage-return-home'));
          window.setTimeout(() => { root.style.scrollBehavior = previousBehavior; }, 40);
        }, 0);
        return;
      }

      if (target?.closest('.v10CompletionActions')) scheduleSync();
      const saveButton = target?.closest<HTMLButtonElement>('.evSaveNotesButton.is-saved');
      if (!saveButton) return;
      event.preventDefault();
      event.stopPropagation();
      document.querySelector<HTMLButtonElement>('.evNotesTrigger')?.click();
    };

    attachOverlayObserver();
    syncCompletion();
    document.addEventListener('click', handleClick, true);
    window.addEventListener('ev:voyage-completed', handleCompleted);

    return () => {
      if (syncFrame !== null) window.cancelAnimationFrame(syncFrame);
      if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
      bodyObserver.disconnect();
      overlayObserver?.disconnect();
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('ev:voyage-completed', handleCompleted);
    };
  }, [enabled]);

  return null;
}