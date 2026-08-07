'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

export default function V11CompletionSaveSpace() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let syncFrame: number | null = null;

    const syncMount = () => {
      const actions = document.querySelector<HTMLElement>('.v10CompletionActions');
      if (!actions) {
        setMount(null);
        setSaved(false);
        return;
      }

      let root = actions.querySelector<HTMLElement>('#ev-save-space-completion-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'ev-save-space-completion-root';
        actions.appendChild(root);
      }
      setMount((current) => current === root ? current : root);
    };

    const scheduleSync = () => {
      if (syncFrame !== null) return;
      syncFrame = window.requestAnimationFrame(() => {
        syncFrame = null;
        syncMount();
      });
    };

    const handleCompletionNavigation = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('.v10CompletionActions, .v10CloseSession')) window.setTimeout(scheduleSync, 0);
    };

    syncMount();
    window.addEventListener('ev:voyage-completed', scheduleSync);
    window.addEventListener('ev:voyage-return-home', scheduleSync);
    document.addEventListener('click', handleCompletionNavigation, true);
    return () => {
      if (syncFrame !== null) window.cancelAnimationFrame(syncFrame);
      window.removeEventListener('ev:voyage-completed', scheduleSync);
      window.removeEventListener('ev:voyage-return-home', scheduleSync);
      document.removeEventListener('click', handleCompletionNavigation, true);
    };
  }, [enabled]);

  const saveVoyageSetup = () => {
    const builderSave = document.querySelector<HTMLButtonElement>('.builderActions .saveButton');
    if (!builderSave) return;
    builderSave.click();
    setSaved(true);
  };

  if (!enabled || !mount) return null;

  return createPortal(
    <button
      type="button"
      className={`v10SecondaryAction evSaveSpaceCompletionButton ${saved ? 'is-saved' : ''}`}
      onClick={saveVoyageSetup}
      disabled={saved}
    >
      {saved ? 'Voyage setup saved ✓' : 'Save voyage setup'}
    </button>,
    mount
  );
}
