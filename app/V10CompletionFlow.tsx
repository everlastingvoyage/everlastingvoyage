'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

type DialogKind = 'save' | 'copy' | null;

type DialogContent = {
  eyebrow: string;
  title: string;
  body: string;
  primary: string;
};

const dialogContent: Record<Exclude<DialogKind, null>, DialogContent> = {
  save: {
    eyebrow: 'Keep this voyage',
    title: 'Save this voyage to Notes?',
    body: 'Your session state, duration, intention and captured thoughts will be stored in your Notes library so you can return to them later.',
    primary: 'Save voyage'
  },
  copy: {
    eyebrow: 'Take it with you',
    title: 'Copy session notes',
    body: 'Copy this voyage summary and its captured thoughts to your device clipboard so you can paste them into Notes, Messages, email or another app.',
    primary: 'Copy now'
  }
};

function stopEvent(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function ensurePreserveCard(actions: HTMLElement) {
  let preserve = actions.querySelector<HTMLElement>('.evCompletionPreserve');

  if (!preserve) {
    preserve = document.createElement('section');
    preserve.className = 'evCompletionPreserve';
    preserve.setAttribute('aria-label', 'Keep this voyage');
    preserve.innerHTML = `
      <div class="evCompletionPreserveCopy">
        <span class="evCompletionPreserveIcon" aria-hidden="true">✦</span>
        <div>
          <p>Keep this voyage</p>
          <strong>Preserve what surfaced.</strong>
          <small>Save the full session inside Everlasting Voyage or copy it to use anywhere else.</small>
        </div>
      </div>
      <div class="evCompletionPreserveActions" aria-label="Session note tools"></div>
    `;
    actions.appendChild(preserve);
  }

  return preserve;
}

export default function V10CompletionFlow() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [dialog, setDialog] = useState<DialogKind>(null);
  const bypassAction = useRef<Exclude<DialogKind, null> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const syncCompletion = () => {
      const completion = document.querySelector<HTMLElement>('.v10Completion');
      const actions = completion?.querySelector<HTMLElement>('.v10CompletionActions');

      const thoughtInput = document.querySelector<HTMLInputElement>('#v10-thought');
      if (thoughtInput && thoughtInput.placeholder !== 'Capture it without leaving the voyage') {
        thoughtInput.placeholder = 'Capture it without leaving the voyage';
      }

      if (!completion || !actions) return;

      completion.classList.add('evCompletionEnhanced');

      const repeat = actions.querySelector<HTMLButtonElement>('.v10PrimaryAction');
      const secondary = actions.querySelector<HTMLButtonElement>('.v10SecondaryAction:not(.evSaveNotesButton):not(.evCopyNotesButton)');
      const returnButton = actions.querySelector<HTMLButtonElement>('.v10TextAction');

      repeat?.classList.add('evCompletionRepeat');

      if (secondary) {
        secondary.classList.add('evCompletionChoose');
        if (secondary.textContent?.trim() === 'Start another state') secondary.textContent = 'Choose another state';
      }

      if (returnButton) {
        returnButton.classList.add('evCompletionReturn');
        if (returnButton.textContent?.trim() === 'Return home') returnButton.textContent = 'Return to the beginning';
      }

      const thoughts = completion.querySelector<HTMLElement>('.v10CompletionThoughts');
      const thoughtsLabel = thoughts?.querySelector<HTMLElement>('span');
      const thoughtCount = thoughts?.querySelectorAll('p').length ?? 0;
      if (thoughtsLabel && thoughtCount > 0) thoughtsLabel.textContent = `Captured thoughts · ${thoughtCount}`;

      const preserve = ensurePreserveCard(actions);
      const preserveActions = preserve.querySelector<HTMLElement>('.evCompletionPreserveActions');
      if (!preserveActions) return;

      const saveRoot = actions.querySelector<HTMLElement>('#ev-save-notes-root');
      const copyRoot = actions.querySelector<HTMLElement>('#ev-copy-notes-root');
      if (saveRoot && saveRoot.parentElement !== preserveActions) preserveActions.appendChild(saveRoot);
      if (copyRoot && copyRoot.parentElement !== preserveActions) preserveActions.appendChild(copyRoot);

      const saveButton = preserveActions.querySelector<HTMLButtonElement>('.evSaveNotesButton');
      const copyButton = preserveActions.querySelector<HTMLButtonElement>('.evCopyNotesButton');

      if (saveButton) {
        const saved = saveButton.textContent?.toLowerCase().includes('saved to notes') ?? false;
        saveButton.classList.toggle('is-saved', saved);
        saveButton.disabled = false;
        saveButton.setAttribute('aria-label', saved ? 'Open saved notes' : 'Save this voyage to Notes');
      }

      if (copyButton) {
        const copied = copyButton.textContent?.toLowerCase().includes('copied') ?? false;
        copyButton.classList.toggle('is-copied', copied);
      }
    };

    syncCompletion();
    const observer = new MutationObserver(() => window.requestAnimationFrame(syncCompletion));
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['disabled']
    });

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      const saveButton = target.closest<HTMLButtonElement>('.evSaveNotesButton');
      if (saveButton) {
        const alreadySaved = saveButton.textContent?.toLowerCase().includes('saved to notes') ?? false;
        if (alreadySaved) {
          stopEvent(event);
          document.querySelector<HTMLButtonElement>('.evNotesTrigger')?.click();
          return;
        }

        if (bypassAction.current === 'save') {
          bypassAction.current = null;
          return;
        }

        stopEvent(event);
        setDialog('save');
        return;
      }

      const copyButton = target.closest<HTMLButtonElement>('.evCopyNotesButton');
      if (copyButton) {
        if (bypassAction.current === 'copy') {
          bypassAction.current = null;
          return;
        }

        stopEvent(event);
        setDialog('copy');
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClick, true);
    };
  }, [enabled]);

  useEffect(() => {
    if (!dialog) return;

    document.body.classList.add('ev-completion-dialog-open');
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDialog(null);
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.classList.remove('ev-completion-dialog-open');
      window.removeEventListener('keydown', handleEscape);
    };
  }, [dialog]);

  const confirmAction = () => {
    if (!dialog) return;
    const selector = dialog === 'save' ? '.evSaveNotesButton' : '.evCopyNotesButton';
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (!button) {
      setDialog(null);
      return;
    }

    bypassAction.current = dialog;
    setDialog(null);
    window.requestAnimationFrame(() => button.click());
  };

  if (!enabled || !dialog || typeof document === 'undefined') return null;

  const content = dialogContent[dialog];

  return createPortal(
    <div
      className={`evCompletionDialogBackdrop ${dialog}`}
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && setDialog(null)}
    >
      <section className="evCompletionDialog" role="dialog" aria-modal="true" aria-labelledby="ev-completion-dialog-title">
        <button type="button" className="evCompletionDialogClose" onClick={() => setDialog(null)} aria-label="Close">×</button>
        <span className="evCompletionDialogSymbol" aria-hidden="true">{dialog === 'save' ? '✦' : '⧉'}</span>
        <p>{content.eyebrow}</p>
        <h2 id="ev-completion-dialog-title">{content.title}</h2>
        <strong>{content.body}</strong>
        <div className="evCompletionDialogActions">
          <button type="button" className="evCompletionDialogPrimary" onClick={confirmAction}>{content.primary}</button>
          <button type="button" className="evCompletionDialogCancel" onClick={() => setDialog(null)}>Cancel</button>
        </div>
      </section>
    </div>,
    document.body
  );
}
