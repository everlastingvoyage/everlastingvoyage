'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type DockSection = 'voyage' | 'premium' | 'saved' | 'notes';

const PREMIUM_BENEFITS = [
  '30 Premium Frequencies',
  '5 Collections',
  'Exclusive Soundscapes',
  'Unlimited Voyages',
  'Lifetime Premium'
];

const V1255_POLISH_CSS = `
/* V12.5.5 — restraint pass: less duplication, clearer hierarchy, gold reserved for Premium. */
:root {
  --ev-abundance-accent: #ff5fbf;
  --ev-abundance-soft: #ffe4f5;
  --ev-abundance-deep: #4a153d;
  --ev-abundance-rgb: 255, 95, 191;
  --ev-abundance-surface: rgba(66, 18, 57, .94);
  --ev-abundance-border: rgba(255, 95, 191, .58);
}

/* Gold is Premium only. Make every remaining free 888 surface rose-magenta + pearl. */
body.ev-product-route .stateChoice.abundance,
body.ev-product-route .stateChoice.abundance:hover,
body.ev-product-route .selectedSummary.abundance,
body.ev-product-route .frequencyCard.abundance,
body.ev-product-route .frequencyCard.abundance.active,
body.ev-product-route #library.evFrequencyChamber .signalNode.abundance,
body.ev-product-route .signalPopupOverlay.abundance {
  border-color: var(--ev-abundance-border) !important;
  background:
    radial-gradient(circle at 82% 8%, rgba(var(--ev-abundance-rgb), .17), transparent 36%),
    linear-gradient(160deg, rgba(61, 17, 55, .96), rgba(8, 12, 28, .99)) !important;
  box-shadow: inset 0 1px 0 rgba(255, 232, 247, .065), 0 0 30px rgba(var(--ev-abundance-rgb), .08) !important;
}

body.ev-product-route .stateChoice.abundance > span,
body.ev-product-route .stateChoice.abundance > small,
body.ev-product-route .selectedSummary.abundance .summaryLabel,
body.ev-product-route .selectedSummary.abundance .technicalSummary span:first-child,
body.ev-product-route .frequencyCard.abundance .frequencyTopline,
body.ev-product-route .frequencyCard.abundance .useStateLabel,
body.ev-product-route #library.evFrequencyChamber .signalNode.abundance > span,
body.ev-product-route #library.evFrequencyChamber .signalNode.abundance > strong,
body.ev-product-route #library.evFrequencyChamber .signalNode.abundance .evSignalStateName,
body.ev-product-route .signalPopupOverlay.abundance .signalPopupEyebrow,
body.ev-product-route .signalPopupOverlay.abundance .signalPopupAction {
  color: var(--ev-abundance-soft) !important;
  text-shadow: 0 0 16px rgba(var(--ev-abundance-rgb), .28) !important;
}

body.ev-product-route #library.evFrequencyChamber .signalNode.abundance {
  --node-rgb: var(--ev-abundance-rgb) !important;
}

body.ev-product-route #library.evFrequencyChamber .signalNode.abundance .evSignalStateName {
  color: #ff8bd0 !important;
  text-shadow: 0 0 15px rgba(var(--ev-abundance-rgb), .48), 0 0 30px rgba(var(--ev-abundance-rgb), .2) !important;
}

body.ev-product-route #library.evFrequencyChamber .signalNode.abundance > span {
  color: rgba(255, 221, 244, .84) !important;
}

body.ev-product-route #library.evFrequencyChamber .signalNode.abundance > strong {
  color: rgba(255, 232, 247, .78) !important;
}

body.ev-product-route .evFrequencyPowerBackdrop.abundance {
  --power-color: var(--ev-abundance-accent) !important;
}

body.ev-product-route .evSavedSpaceCard.abundance {
  --space-color: var(--ev-abundance-accent) !important;
}

body.ev-product-route .v10SessionOverlay.abundance,
body.ev-product-route .sessionOverlay.abundance,
body.ev-product-route .v10SessionOverlay.abundance.completed {
  --session-accent: var(--ev-abundance-accent) !important;
  --session-rgb: var(--ev-abundance-rgb) !important;
  --completion-accent: var(--ev-abundance-accent) !important;
}

body.ev-product-route .evPremiumSignalCard.evAbundanceFreeCard {
  border-color: rgba(var(--ev-abundance-rgb), .58) !important;
  background:
    radial-gradient(circle at 84% 7%, rgba(var(--ev-abundance-rgb), .18), transparent 35%),
    linear-gradient(155deg, rgba(53, 17, 51, .97), rgba(6, 10, 24, .99)) !important;
  box-shadow: inset 0 1px 0 rgba(255, 231, 247, .07), 0 16px 42px rgba(111, 20, 87, .11) !important;
}

body.ev-product-route .evPremiumSignalCard.evAbundanceFreeCard:hover {
  border-color: rgba(255, 139, 208, .82) !important;
  box-shadow: 0 20px 46px rgba(173, 35, 132, .16), inset 0 0 34px rgba(var(--ev-abundance-rgb), .07) !important;
}

body.ev-product-route .evPremiumSignalCard.evAbundanceFreeCard .evSignalCardTopline,
body.ev-product-route .evPremiumSignalCard.evAbundanceFreeCard .evSignalPurpose,
body.ev-product-route .evPremiumSignalCard.evAbundanceFreeCard .evSignalAction {
  color: #ff9bd5 !important;
}

body.ev-product-route .evPremiumSignalCard.evAbundanceFreeCard .evSignalCardTopline > span {
  border-color: rgba(var(--ev-abundance-rgb), .36) !important;
  color: #ffdff3 !important;
  background: rgba(166, 41, 129, .14) !important;
}

body.ev-product-route .evPremiumSignalCard.evAbundanceFreeCard .evSignalCardTopline i {
  color: #ffeaf8 !important;
  border-color: rgba(var(--ev-abundance-rgb), .48) !important;
  background: rgba(183, 47, 142, .12) !important;
}

/* Current-value Premium hierarchy. */
body.ev-product-route .evPremiumBenefitRow {
  align-items: stretch;
}

body.ev-product-route .evPremiumBenefitRow span {
  display: inline-flex;
  align-items: center;
}

/* Improve the smallest Premium-library copy without making cards materially taller. */
body.ev-product-route .evPremiumSignalCard > small {
  font-size: 13px !important;
  line-height: 1.45 !important;
  color: rgba(191, 199, 216, .8) !important;
}

body.ev-product-route .evPremiumSignalCard .evSignalAction {
  font-size: 12.5px !important;
  line-height: 1.2 !important;
}

@media (max-width: 760px) {
  /* The dock already owns Saved + Notes on mobile; remove duplicate large Builder pills. */
  body.ev-product-route #ev-builder-library-controls {
    display: none !important;
  }

  /* Keep the approved dock, but make it feel lighter and less dominant. */
  body.ev-product-route .evQuickAccessDock {
    min-height: 58px !important;
    padding: 5px !important;
    gap: 4px !important;
    border-radius: 21px !important;
  }

  body.ev-product-route .evQuickAccessDock button {
    min-height: 46px !important;
    padding: 4px 2px !important;
    gap: 1px !important;
    border-radius: 15px !important;
  }

  body.ev-product-route .evQuickAccessDock button > span {
    min-height: 19px !important;
    font-size: 1.04rem !important;
  }

  body.ev-product-route .evQuickAccessDock button > small {
    font-size: .63rem !important;
  }

  /* The final Builder actions must be scrollable fully above the floating dock. */
  body.ev-product-route .builderActions {
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
  }

  body.ev-product-route .evProductFooter {
    padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px)) !important;
  }

  /* Chamber remains cinematic, but no longer behaves like a second oversized hero. */
  body.ev-product-route #library.evFrequencyChamber {
    padding-top: 54px !important;
  }

  body.ev-product-route #library.evFrequencyChamber .sectionIntro {
    margin-bottom: 10px !important;
  }

  body.ev-product-route #library.evFrequencyChamber .sectionIntro h2 {
    font-size: 3.05rem !important;
    line-height: .94 !important;
  }

  body.ev-product-route #library.evFrequencyChamber .signalExperienceTop {
    margin-bottom: 8px !important;
  }

  body.ev-product-route #library.evFrequencyChamber .compactHint {
    min-height: 52px !important;
  }

  /* The origin quote remains primary; attribution steps back slightly. */
  body.ev-product-route .youtubeOrigin cite {
    color: rgba(137, 210, 255, .55) !important;
    font-size: 9px !important;
    letter-spacing: .10em !important;
  }

  /* Compress supporting About content by removing empty height, not readable copy. */
  body.ev-product-route .evAboutCompact.section {
    padding-top: 64px !important;
    padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px)) !important;
  }

  body.ev-product-route .evAboutRitual {
    gap: 12px !important;
    margin-top: 30px !important;
  }

  body.ev-product-route .evAboutRitual article {
    min-height: 0 !important;
    padding: 18px 20px !important;
  }

  body.ev-product-route .evAboutRitual article strong {
    margin: 12px 0 6px !important;
  }

  body.ev-product-route .evAboutRitual article p {
    margin: 0 !important;
  }

  body.ev-product-route .evAboutRitual > i {
    display: none !important;
  }

  body.ev-product-route .evAboutSignals {
    gap: 8px !important;
    margin-top: 16px !important;
  }

  body.ev-product-route .evAboutSignals span {
    padding: 8px 11px !important;
  }
}

@media (max-width: 390px) {
  body.ev-product-route #library.evFrequencyChamber .sectionIntro h2 {
    font-size: 2.92rem !important;
  }
}
`;

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

function syncPremiumPolish() {
  const benefitRow = document.querySelector<HTMLElement>('.evPremiumBenefitRow');
  if (benefitRow) {
    const current = Array.from(benefitRow.querySelectorAll(':scope > span')).map((item) => item.textContent?.trim() || '');
    const matches = current.length === PREMIUM_BENEFITS.length && current.every((value, index) => value === PREMIUM_BENEFITS[index]);
    if (!matches) {
      const fragment = document.createDocumentFragment();
      PREMIUM_BENEFITS.forEach((label) => {
        const chip = document.createElement('span');
        chip.textContent = label;
        fragment.appendChild(chip);
      });
      benefitRow.replaceChildren(fragment);
    }
  }

  document.querySelectorAll<HTMLElement>('.evPremiumSignalCard.free').forEach((card) => {
    const copy = (card.textContent || '').toLowerCase();
    const abundance = copy.includes('abundance') && copy.includes('888 hz');
    card.classList.toggle('evAbundanceFreeCard', abundance);
  });
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

    const style = document.createElement('style');
    style.id = 'ev-v12-5-5-polish';
    style.textContent = V1255_POLISH_CSS;
    document.getElementById(style.id)?.remove();
    document.head.appendChild(style);

    let premiumObserver: MutationObserver | null = null;
    let syncFrame: number | null = null;
    const retryTimers: number[] = [];

    const schedulePremiumSync = () => {
      if (syncFrame !== null) return;
      syncFrame = window.requestAnimationFrame(() => {
        syncFrame = null;
        syncPremiumPolish();
      });
    };

    const attachPremiumObserver = () => {
      if (premiumObserver) return;
      const root = document.getElementById('ev-premium-root');
      if (!root) return;
      premiumObserver = new MutationObserver(schedulePremiumSync);
      premiumObserver.observe(root, { childList: true, subtree: true });
      schedulePremiumSync();
    };

    [0, 60, 160, 360, 720].forEach((delay) => {
      retryTimers.push(window.setTimeout(() => {
        attachPremiumObserver();
        schedulePremiumSync();
      }, delay));
    });

    const handlePremiumClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('.evPremiumCategoryTabs button')) window.setTimeout(schedulePremiumSync, 0);
    };
    document.addEventListener('click', handlePremiumClick, true);

    return () => {
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      if (syncFrame !== null) window.cancelAnimationFrame(syncFrame);
      premiumObserver?.disconnect();
      document.removeEventListener('click', handlePremiumClick, true);
      style.remove();
    };
  }, [enabled]);

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
