'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const DESKTOP_SESSION_QUERY = '(min-width: 1100px)';

export default function V12DesktopAtmosphereFlow() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/voyage') return;

    const desktopQuery = window.matchMedia(DESKTOP_SESSION_QUERY);
    let scheduledFrame: number | null = null;

    const placeSessionSections = () => {
      scheduledFrame = null;

      const overlay = document.querySelector<HTMLElement>('.v10SessionOverlay:not(.completed)');
      const root = overlay?.querySelector<HTMLElement>('#ev-session-atmosphere-root');
      const sessionMain = overlay?.querySelector<HTMLElement>('.v10SessionMain');
      const audioControls = overlay?.querySelector<HTMLElement>('.v10AudioControls');
      const footer = overlay?.querySelector<HTMLElement>('.v10SessionFooter');
      if (!overlay || !root || !sessionMain || !audioControls || !footer) return;

      if (desktopQuery.matches) {
        // Desktop uses three explicit, consecutive overlay sections:
        // session console -> Atmosphere -> technical footer.
        // Move the actual DOM nodes instead of relying on grid overflow or margins.
        if (root.parentElement !== overlay || root.previousElementSibling !== sessionMain) {
          sessionMain.insertAdjacentElement('afterend', root);
        }
        if (footer.parentElement !== overlay || footer.previousElementSibling !== root) {
          root.insertAdjacentElement('afterend', footer);
        }

        root.dataset.flowPlacement = 'overlay-after-main';
        footer.dataset.flowPlacement = 'overlay-after-atmosphere';
        return;
      }

      // Tablet/mobile keep Atmosphere inside the tools column, while the
      // technical footer remains a direct overlay section after the main panel.
      const tools = audioControls.parentElement;
      if (tools && (root.parentElement !== tools || root.previousElementSibling !== audioControls)) {
        audioControls.insertAdjacentElement('afterend', root);
      }
      if (footer.parentElement !== overlay || footer.previousElementSibling !== sessionMain) {
        sessionMain.insertAdjacentElement('afterend', footer);
      }

      root.dataset.flowPlacement = 'tools-after-signal';
      footer.dataset.flowPlacement = 'overlay-after-main';
    };

    const schedulePlacement = () => {
      if (scheduledFrame !== null) return;
      scheduledFrame = window.requestAnimationFrame(placeSessionSections);
    };

    const observer = new MutationObserver(schedulePlacement);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    desktopQuery.addEventListener('change', schedulePlacement);
    schedulePlacement();

    return () => {
      observer.disconnect();
      desktopQuery.removeEventListener('change', schedulePlacement);
      if (scheduledFrame !== null) window.cancelAnimationFrame(scheduledFrame);
    };
  }, [pathname]);

  return null;
}
