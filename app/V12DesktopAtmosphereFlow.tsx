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

    const placeAtmosphere = () => {
      scheduledFrame = null;

      const overlay = document.querySelector<HTMLElement>('.v10SessionOverlay:not(.completed)');
      const root = overlay?.querySelector<HTMLElement>('#ev-session-atmosphere-root');
      const sessionMain = overlay?.querySelector<HTMLElement>('.v10SessionMain');
      const audioControls = overlay?.querySelector<HTMLElement>('.v10AudioControls');
      if (!overlay || !root || !sessionMain || !audioControls) return;

      if (desktopQuery.matches) {
        const alreadyPlaced = root.parentElement === overlay && root.previousElementSibling === sessionMain;
        if (!alreadyPlaced) sessionMain.insertAdjacentElement('afterend', root);
        root.dataset.flowPlacement = 'overlay';
        return;
      }

      const tools = audioControls.parentElement;
      const alreadyPlaced = root.parentElement === tools && root.previousElementSibling === audioControls;
      if (!alreadyPlaced) audioControls.insertAdjacentElement('afterend', root);
      root.dataset.flowPlacement = 'tools';
    };

    const schedulePlacement = () => {
      if (scheduledFrame !== null) return;
      scheduledFrame = window.requestAnimationFrame(placeAtmosphere);
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
