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
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  node.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

export default function V1254QuickAccess() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [pastHero, setPastHero] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
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
        setActiveSection(premiumInFocus ? 'premium' : 'voyage');
      }
    };

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
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });
    viewport?.addEventListener('resize', updateKeyboard);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      viewport?.removeEventListener('resize', updateKeyboard);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
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
      action: () => document.querySelector<HTMLButtonElement>('.evSavedSpacesTrigger')?.click()
    },
    {
      id: 'notes' as const,
      label: 'Notes',
      icon: '▤',
      action: () => document.querySelector<HTMLButtonElement>('.evNotesTrigger')?.click()
    }
  ], []);

  if (!enabled) return null;

  return (
    <nav
      className={`evQuickAccessDock ${pastHero && !keyboardOpen ? 'is-visible' : ''}`}
      aria-label="Quick access"
      aria-hidden={pastHero && !keyboardOpen ? undefined : true}
    >
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={`${item.id === 'premium' ? 'premium' : ''} ${activeSection === item.id ? 'is-active' : ''}`}
          onClick={item.action}
          aria-label={`Open ${item.label}`}
          aria-current={activeSection === item.id ? 'page' : undefined}
        >
          <span aria-hidden="true">{item.icon}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}
