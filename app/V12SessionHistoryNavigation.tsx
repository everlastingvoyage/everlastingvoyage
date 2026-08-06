'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SESSION_HISTORY_KEY = 'evVoyageSession';

type VoyageHistoryState = Record<string, unknown> & {
  [SESSION_HISTORY_KEY]?: boolean;
};

function hasSessionMarker(state: unknown): state is VoyageHistoryState {
  return Boolean(
    state &&
    typeof state === 'object' &&
    (state as VoyageHistoryState)[SESSION_HISTORY_KEY] === true
  );
}

function sessionIsOpen() {
  return Boolean(document.querySelector('.v10SessionOverlay'));
}

function scrollToVoyageHero() {
  const performScroll = () => {
    const hero = document.getElementById('top');
    if (hero) hero.scrollIntoView({ block: 'start', behavior: 'auto' });
    else window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  /* V10SessionUtilities restores the builder's previous scroll position after
     the legacy close button fires. Run once immediately and once after that
     restoration so browser Back always lands on the actual Voyage hero. */
  window.requestAnimationFrame(performScroll);
  window.setTimeout(performScroll, 220);
}

export default function V12SessionHistoryNavigation() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const handlingPopStateRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const pushSessionEntry = () => {
      if (hasSessionMarker(window.history.state)) return;

      const currentState =
        window.history.state && typeof window.history.state === 'object'
          ? window.history.state as Record<string, unknown>
          : {};
      const sessionUrl = `${window.location.pathname}${window.location.search}#session`;

      window.history.pushState(
        { ...currentState, [SESSION_HISTORY_KEY]: true },
        '',
        sessionUrl
      );
    };

    const handleOpenIntent = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const opensFromBuilder = target?.closest('.builderActions .primaryButton');
      const resumesSession = target?.closest('.v10ContinueVoyage');
      if (!opensFromBuilder && !resumesSession) return;

      pushSessionEntry();
    };

    const closeSessionFromHistory = () => {
      const closeButton = document.querySelector<HTMLButtonElement>(
        '.v10SessionOverlay .v10CloseSession'
      );

      if (closeButton) closeButton.click();
      scrollToVoyageHero();
    };

    const handlePopState = (event: PopStateEvent) => {
      if (handlingPopStateRef.current) return;

      const movingIntoSession = hasSessionMarker(event.state);
      if (movingIntoSession) {
        /* Forward navigation can restore a paused session when the legacy
           Continue button exists. Ready sessions remain safely on the hero. */
        if (!sessionIsOpen()) {
          document.querySelector<HTMLButtonElement>('.v10ContinueVoyage')?.click();
        }
        return;
      }

      if (!sessionIsOpen()) return;

      handlingPopStateRef.current = true;
      closeSessionFromHistory();
      window.setTimeout(() => {
        handlingPopStateRef.current = false;
      }, 260);
    };

    const handleVisibleClose = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const closeButton = target?.closest('.v10SessionOverlay .v10CloseSession');
      if (!closeButton || handlingPopStateRef.current) return;
      if (!hasSessionMarker(window.history.state)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.history.back();
    };

    /* Window capture runs before the V10 engine's document-capture handler,
       which intentionally stops propagation after opening the session. */
    window.addEventListener('click', handleOpenIntent, true);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleVisibleClose, true);

    return () => {
      window.removeEventListener('click', handleOpenIntent, true);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleVisibleClose, true);
    };
  }, [enabled]);

  return null;
}
