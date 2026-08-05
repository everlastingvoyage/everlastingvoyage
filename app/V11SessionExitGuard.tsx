'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

function isEndSessionButton(element: Element | null): element is HTMLButtonElement {
  const button = element?.closest<HTMLButtonElement>('.v10SessionOverlay .v10TimerControls button');
  return Boolean(button && button.textContent?.trim().toLowerCase() === 'end session');
}

export default function V11SessionExitGuard() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [open, setOpen] = useState(false);
  const bypassRef = useRef(false);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const syncLegacyClose = () => {
      document.querySelectorAll<HTMLButtonElement>('.v10SessionOverlay .v10CloseSession').forEach((button) => {
        button.classList.add('v11SessionLegacyClose');
        button.tabIndex = -1;
        button.setAttribute('aria-hidden', 'true');
      });
    };

    const observer = new MutationObserver(syncLegacyClose);
    observer.observe(document.body, { childList: true, subtree: true });
    syncLegacyClose();

    const interceptEndSession = (event: MouseEvent) => {
      if (bypassRef.current || !isEndSessionButton(event.target as Element | null)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setOpen(true);
    };

    document.addEventListener('click', interceptEndSession, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('click', interceptEndSession, true);
    };
  }, [enabled]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    continueButtonRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const confirmExit = () => {
    setOpen(false);
    const legacyClose = document.querySelector<HTMLButtonElement>('.v10SessionOverlay .v10CloseSession');
    if (legacyClose) {
      legacyClose.click();
      return;
    }

    const endButton = Array.from(document.querySelectorAll<HTMLButtonElement>('.v10SessionOverlay .v10TimerControls button'))
      .find((button) => button.textContent?.trim().toLowerCase() === 'end session');
    if (!endButton) return;
    bypassRef.current = true;
    endButton.click();
    bypassRef.current = false;
  };

  if (!enabled || !open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="v11ExitConfirmBackdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
    >
      <section
        className="v11ExitConfirmDialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="v11-exit-title"
        aria-describedby="v11-exit-description"
      >
        <span className="v11ExitConfirmEyebrow">Active voyage</span>
        <h2 id="v11-exit-title">End this voyage?</h2>
        <p id="v11-exit-description">Your timer, pure signal and active atmosphere will stop.</p>
        <div className="v11ExitConfirmActions">
          <button ref={continueButtonRef} type="button" className="primary" onClick={() => setOpen(false)}>
            Continue voyage
          </button>
          <button type="button" className="secondary" onClick={confirmExit}>
            End and return home
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}