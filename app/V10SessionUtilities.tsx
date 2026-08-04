'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

type StateId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';

type StoredSession = {
  config?: { stateId?: StateId; durationMinutes?: number; intention?: string };
  thoughts?: string[];
};

const labels: Record<StateId, { frequency: string; hz: string; state: string }> = {
  alpha: { frequency: 'Alpha', hz: '10 Hz', state: 'Calm Focus' },
  gamma: { frequency: 'Gamma', hz: '40 Hz', state: 'Deep Focus' },
  theta: { frequency: 'Theta', hz: '4 Hz', state: 'Creative Flow' },
  delta: { frequency: 'Delta', hz: '2 Hz', state: 'Deep Rest' },
  abundance: { frequency: 'Pure Tone', hz: '888 Hz', state: 'Abundance' }
};

function readSession(): StoredSession | null {
  try {
    return JSON.parse(localStorage.getItem('ev-v10-active-session') || 'null') as StoredSession | null;
  } catch {
    return null;
  }
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

export default function V10SessionUtilities() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [copyMount, setCopyMount] = useState<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let storedScrollY = window.scrollY;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('.builderActions .primaryButton')) storedScrollY = window.scrollY;

      const closingControl = target?.closest('.v10CloseSession, .v10CompletionActions button');
      if (!closingControl) return;

      const active = document.activeElement as HTMLElement | null;
      active?.blur?.();

      window.setTimeout(() => {
        if (!document.querySelector('.v10SessionOverlay')) {
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo({ top: storedScrollY, left: 0, behavior: 'auto' });
          window.setTimeout(() => document.documentElement.style.removeProperty('scroll-behavior'), 40);
        }
      }, 140);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const syncMount = () => {
      const actions = document.querySelector<HTMLElement>('.v10CompletionActions');
      if (!actions) {
        setCopyMount(null);
        return;
      }

      let mount = actions.querySelector<HTMLElement>('#ev-copy-notes-root');
      if (!mount) {
        mount = document.createElement('div');
        mount.id = 'ev-copy-notes-root';
        actions.appendChild(mount);
      }
      setCopyMount(mount);
    };

    syncMount();
    const observer = new MutationObserver(syncMount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled]);

  const copyNotes = async () => {
    const session = readSession();
    const id = session?.config?.stateId ?? 'alpha';
    const meta = labels[id];
    const duration = session?.config?.durationMinutes ?? 25;
    const intention = session?.config?.intention?.trim();
    const thoughts = Array.isArray(session?.thoughts) ? session?.thoughts : [];

    const lines = [
      'Everlasting Voyage',
      '',
      `State: ${meta.state}`,
      `Signal: ${meta.frequency} · ${meta.hz}`,
      `Duration: ${duration} minutes`,
      intention ? `Intention: ${intention}` : 'Intention: Open focus',
      '',
      'Captured thoughts:',
      ...(thoughts.length ? thoughts.map((thought) => `• ${thought}`) : ['• No thoughts captured'])
    ];

    try {
      await copyText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (!enabled || !copyMount) return null;

  return createPortal(
    <button type="button" className="v10SecondaryAction evCopyNotesButton" onClick={copyNotes}>
      {copied ? 'Copied ✓' : 'Copy session notes'}
    </button>,
    copyMount
  );
}
