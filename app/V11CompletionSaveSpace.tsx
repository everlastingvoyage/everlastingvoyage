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
      setMount(root);
    };

    syncMount();
    const observer = new MutationObserver(syncMount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
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
