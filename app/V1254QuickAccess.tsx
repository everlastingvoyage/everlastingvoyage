'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type DockSection = 'voyage' | 'premium' | 'saved' | 'notes';

function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return element.matches('input, textarea, select, [contenteditable="true"]');
}

function scrollToSection(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  node.scrollIntoView({ behavior: 'auto', block: 'start' });
}

function mutationTouchesDialog(mutations: MutationRecord[]) {
  return mutations.some((mutation) => [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
    if (!(node instanceof Element)) return false;
    return node.matches('[role="dialog"]') || Boolean(node.querySelector('[role="dialog"]'));
  }));
}

export default function V1254QuickAccess() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [pastHero, setPastHero] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DockSection>('voyage');

  useEffect(() => {
    if (!enabled) return;

    const updatePosition = () => {
      const builder = document.getElementById('session-builder');
      const premium = document.getElementById('ev-premium-library');
      const builderThreshold = builder
        ? Math.max(300, builder.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45)
        : 360;

      setPastHero(window.scrollY > builderThreshold);

      if (premium) {
        const premiumTop = premium.getBoundingClientRect().top;
        const premiumBottom = premium.getBoundingClientRect().bottom;
        const premiumInFocus = premiumTop <= window.innerHeight * 0.46 && premiumBottom > 130;
        if (premiumInFocus) setActiveSection('premium');
        else if (!document.querySelector('[role="dialog"]')) setActiveSection('voyage');
      }
    };

    const updateOverlay = () => setOverlayOpen(Boolean(document.querySelector('[role="dialog"]')));
    const viewport = window.visualViewport;
    const updateKeyboard = () => {
      const activeEditable = isEditableTarget(document.activeElement);
      const viewportCompressed = Boolean(viewport && viewport.height < window.innerHeight * 0.72);
      setKeyboardOpen(activeEditable || viewportCompressed);
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (isEditableTarget(event.target)) setKeyboardOpen(true);
    };
    const handleFocusOut = () => window.setTimeout(updateKeyboard, 80);

    updatePosition();
    updateKeyboard();
    updateOverlay();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });
    viewport?.addEventListener('resize', updateKeyboard);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    const overlayObserver = new MutationObserver((mutations) => {
      if (mutationTouchesDialog(mutations)) updateOverlay();
    });
    overlayObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      viewport?.removeEventListener('resize', updateKeyboard);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      overlayObserver.disconnect();
    };
  }, [enabled]);

  const items = useMemo(() => [
    {
      id: 'voyage' as const,
      label: 'Voyage',
      icon: '∞',
      action: () => {
        const continueButton = document.querySelector<HTMLButtonElement>('.v10ContinueVoyage');
        if (continueButton) {
          continueButton.click();
          return;
        }
        setActiveSection('voyage');
        scrollToSection('session-builder');
      }
    },
    {
      id: 'premium' as const,
      label: 'Premium',
      icon: '✦',
      action: () => {
        setActiveSection('premium');
        scrollToSection('ev-premium-library');
      }
    },
    {
      id: 'saved' as const,
      label: 'Saved',
      icon: '▣',
      action: () => {
        setActiveSection('saved');
        document.querySelector<HTMLButtonElement>('.evSavedSpacesTrigger')?.click();
      }
    },
    {
      id: 'notes' as const,
      label: 'Notes',
      icon: '▤',
      action: () => {
        setActiveSection('notes');
        document.querySelector<HTMLButtonElement>('.evNotesTrigger')?.click();
      }
    }
  ], []);

  if (!enabled) return null;
  const dockVisible = pastHero && !keyboardOpen && !overlayOpen;

  return (
    <nav
      className={`evQuickAccessDock ${dockVisible ? 'is-visible' : ''}`}
      aria-label="Quick access"
      aria-hidden={!dockVisible}
    >
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={`${item.id === 'premium' ? 'premium' : ''} ${activeSection === item.id ? 'is-active' : ''}`}
          onClick={item.action}
          aria-label={`Open ${item.label}`}
          aria-current={dockVisible && activeSection === item.id ? 'page' : undefined}
          tabIndex={dockVisible ? 0 : -1}
        >
          <span aria-hidden="true">{item.icon}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}
