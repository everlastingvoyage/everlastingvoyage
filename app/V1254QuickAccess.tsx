'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type DockSection = 'voyage' | 'premium' | 'saved' | 'notes';
type CompletionSaveKind = 'setup' | 'thoughts';

const PREMIUM_BENEFITS = [
  '30 Premium Frequencies',
  '5 Collections',
  'Exclusive Soundscapes',
  'Unlimited Voyages',
  'Lifetime Premium'
];

const V1256_POLISH_CSS = `
/* V12.5.5 + V12.5.6 — preserve approved polish, elevate the Voyage launch and remove save friction. */
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
body.ev-product-route .evPremiumBenefitRow { align-items: stretch; }
body.ev-product-route .evPremiumBenefitRow span { display: inline-flex; align-items: center; }

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

/* V12.5.6 — the Builder resolves visually into one obvious launch action. */
body.ev-product-route .builderActions {
  --ev-cta-accent: 91, 220, 255 !important;
  --ev-cta-accent-two: 103, 87, 255 !important;
  --ev-cta-shine: 236, 252, 255 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 12px !important;
  position: relative;
}

body.ev-product-route .builderActions::before {
  content: 'READY TO ENTER';
  align-self: stretch;
  margin: 2px 0 0;
  color: rgba(130, 221, 255, .76);
  font-size: .68rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: .23em;
  text-align: center;
}

body.ev-product-route .builderActions .primaryButton {
  position: relative !important;
  width: 100% !important;
  min-height: 78px !important;
  overflow: hidden !important;
  border: 1px solid rgba(194, 245, 255, .68) !important;
  border-radius: 999px !important;
  color: #03101d !important;
  background:
    linear-gradient(104deg, #8feaff 0%, #61d6ff 34%, #6689ff 72%, #7868ff 100%) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.72),
    inset 0 -14px 28px rgba(33, 38, 113, .16),
    0 18px 48px rgba(63, 183, 255, .27),
    0 0 42px rgba(100, 86, 255, .18) !important;
  font-size: clamp(1.12rem, 3vw, 1.34rem) !important;
  font-weight: 900 !important;
  letter-spacing: -.018em !important;
  transform: translateZ(0);
  transition: transform 120ms ease, filter 160ms ease !important;
}

body.ev-product-route .builderActions .primaryButton:active {
  transform: scale(.982) !important;
  filter: saturate(1.08) brightness(.96) !important;
}

body.ev-product-route .builderActions .saveButton {
  width: min(84%, 620px) !important;
  min-height: 50px !important;
  margin: 0 auto !important;
  padding: 0 20px !important;
  border: 1px solid rgba(104, 190, 239, .28) !important;
  border-radius: 999px !important;
  color: rgba(216, 235, 249, .9) !important;
  background: linear-gradient(180deg, rgba(11, 31, 53, .76), rgba(4, 15, 31, .9)) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.025) !important;
  font-size: .94rem !important;
  font-weight: 760 !important;
}

body.ev-product-route .builderActions .saveButton:hover,
body.ev-product-route .builderActions .saveButton:focus-visible {
  border-color: rgba(117, 208, 255, .44) !important;
  color: #effaff !important;
}

/* Saved Spaces metadata is information, not three unrelated buttons. */
body.ev-product-route .evSavedSpaceMeta {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 8px !important;
  margin: 18px 0 20px !important;
}

body.ev-product-route .evSavedSpaceMeta span[data-ev-v1256-meta] {
  min-width: 0 !important;
  min-height: 66px !important;
  padding: 9px 6px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
  border: 1px solid rgba(128, 184, 229, .16) !important;
  border-radius: 16px !important;
  color: transparent !important;
  background: rgba(5, 17, 34, .58) !important;
  font-size: 0 !important;
  text-align: center !important;
  overflow: hidden;
}

body.ev-product-route .evSavedSpaceMeta span[data-ev-v1256-meta]::before {
  content: attr(data-ev-v1256-value);
  display: block;
  color: #eef7ff;
  font-size: .98rem;
  font-weight: 820;
  line-height: 1.05;
  white-space: nowrap;
}

body.ev-product-route .evSavedSpaceMeta span[data-ev-v1256-meta]::after {
  content: attr(data-ev-v1256-label);
  display: block;
  color: #7f96ac;
  font-size: .66rem;
  font-weight: 720;
  line-height: 1.05;
  letter-spacing: .035em;
  white-space: nowrap;
}

/* Completion success is instant, brief and non-blocking. */
.evCompletionActionRoot.evV1256SaveSuccess {
  --action-rgb: 103, 224, 165 !important;
  border-color: rgba(103, 224, 165, .46) !important;
  background:
    radial-gradient(circle at 8% 50%, rgba(103, 224, 165, .13), transparent 45%),
    linear-gradient(180deg, rgba(13, 48, 43, .97), rgba(4, 21, 25, .99)) !important;
  box-shadow: inset 0 1px 0 rgba(235,255,246,.05), 0 0 28px rgba(103,224,165,.08) !important;
}

.evCompletionActionRoot.evV1256SaveCommitted {
  --action-rgb: 115, 205, 165 !important;
  border-color: rgba(105, 205, 160, .23) !important;
  background:
    radial-gradient(circle at 0% 50%, rgba(100, 205, 158, .055), transparent 42%),
    linear-gradient(180deg, rgba(10, 30, 43, .96), rgba(4, 15, 29, .99)) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.03), 0 10px 26px rgba(0,0,0,.11) !important;
}

.evCompletionActionRoot.evV1256SaveSuccess .evCompletionActionPresentation,
.evCompletionActionRoot.evV1256SaveCommitted .evCompletionActionPresentation {
  pointer-events: none !important;
}

/* Landing arrow is a custom UI mark, never an emoji glyph. */
.evEntranceSecondary > span {
  position: relative;
  width: 17px;
  height: 17px;
  flex: 0 0 17px;
  display: inline-block;
  overflow: visible;
  color: currentColor;
  font-size: 0 !important;
}
.evEntranceSecondary > span::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 8px;
  width: 13px;
  height: 2px;
  border-radius: 2px;
  background: currentColor;
  transform: rotate(45deg);
  transform-origin: center;
}
.evEntranceSecondary > span::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 1px;
  width: 7px;
  height: 7px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
}

@media (max-width: 760px) {
  /* The dock owns Saved + Notes on mobile; remove duplicate large Builder pills. */
  body.ev-product-route #ev-builder-library-controls { display: none !important; }

  /* Keep the approved dock, but reduce the pill-inside-pill active state. */
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
  body.ev-product-route .evQuickAccessDock button > small { font-size: .63rem !important; }
  body.ev-product-route .evQuickAccessDock button.is-active:not(.premium) {
    border-color: rgba(111, 204, 252, .11) !important;
    background: rgba(44, 143, 194, .035) !important;
    box-shadow: inset 0 0 0 1px rgba(111, 204, 252, .025) !important;
  }
  body.ev-product-route .evQuickAccessDock button.premium.is-active {
    border-color: rgba(240, 194, 104, .24) !important;
    background: rgba(137, 89, 24, .075) !important;
  }

  /* The final Builder actions must clear the floating dock. */
  body.ev-product-route .builderActions {
    padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px)) !important;
  }
  body.ev-product-route .builderActions::before { margin-top: 3px; }
  body.ev-product-route .builderActions .primaryButton {
    min-height: 82px !important;
    font-size: 1.18rem !important;
  }
  body.ev-product-route .builderActions .saveButton {
    width: 82% !important;
    min-height: 50px !important;
  }

  body.ev-product-route .evProductFooter {
    padding-bottom: calc(82px + env(safe-area-inset-bottom, 0px)) !important;
  }

  /* Chamber remains cinematic, just reveal the interaction a little earlier. */
  body.ev-product-route #library.evFrequencyChamber { padding-top: 52px !important; }
  body.ev-product-route #library.evFrequencyChamber .sectionIntro { margin-bottom: 8px !important; }
  body.ev-product-route #library.evFrequencyChamber .sectionIntro h2 {
    font-size: 2.88rem !important;
    line-height: .94 !important;
  }
  body.ev-product-route #library.evFrequencyChamber .signalExperienceTop { margin-bottom: 6px !important; }
  body.ev-product-route #library.evFrequencyChamber .compactHint { min-height: 50px !important; }

  /* The origin quote remains primary; attribution stays quiet. */
  body.ev-product-route .youtubeOrigin cite {
    color: rgba(137, 210, 255, .55) !important;
    font-size: 9px !important;
    letter-spacing: .10em !important;
  }

  /* Cards are already compact; only remove the remaining dead space below About. */
  body.ev-product-route .evAboutCompact.section {
    padding-top: 64px !important;
    padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)) !important;
  }
  body.ev-product-route .evAboutRitual {
    gap: 12px !important;
    margin-top: 30px !important;
  }
  body.ev-product-route .evAboutRitual article {
    min-height: 0 !important;
    padding: 18px 20px !important;
  }
  body.ev-product-route .evAboutRitual article strong { margin: 12px 0 6px !important; }
  body.ev-product-route .evAboutRitual article p { margin: 0 !important; }
  body.ev-product-route .evAboutRitual > i { display: none !important; }
  body.ev-product-route .evAboutSignals {
    gap: 8px !important;
    margin-top: 16px !important;
  }
  body.ev-product-route .evAboutSignals span { padding: 8px 11px !important; }
}

@media (max-width: 390px) {
  body.ev-product-route #library.evFrequencyChamber .sectionIntro h2 {
    font-size: 2.76rem !important;
  }
  body.ev-product-route .evSavedSpaceMeta span[data-ev-v1256-meta]::before { font-size: .9rem; }
  body.ev-product-route .evSavedSpaceMeta span[data-ev-v1256-meta]::after { font-size: .61rem; }
}

@media (prefers-reduced-motion: reduce) {
  body.ev-product-route .builderActions .primaryButton,
  body.ev-product-route .builderActions .primaryButton::after,
  body.ev-product-route .builderActions .primaryButton span {
    animation: none !important;
    transition: none !important;
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

function replaceSignalLanguage(value: string) {
  return value.replace(/\bsignals\b/gi, 'frequencies').replace(/\bsignal\b/gi, 'frequency');
}

function syncVisibleFrequencyTerminology() {
  document.querySelectorAll<HTMLElement>([
    '.v10SessionIdentity p',
    '.signalPopupBody p',
    '.evPremiumSignalCard > small'
  ].join(',')).forEach((element) => {
    const current = element.textContent || '';
    const next = replaceSignalLanguage(current);
    if (current !== next) element.textContent = next;
  });
}

function syncEntrancePolish() {
  const copy = document.querySelector<HTMLElement>('.evEntranceCopy');
  if (copy) {
    const desired = 'A focused environment for pure frequencies, intentional sessions and a quieter way to enter deep work, creativity or rest.';
    if (copy.textContent?.trim() !== desired) copy.textContent = desired;
  }

  const trust = document.querySelectorAll<HTMLElement>('.evEntranceTrust span');
  if (trust[1] && trust[1].textContent?.trim() !== 'Exact frequencies') trust[1].textContent = 'Exact frequencies';
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

  syncVisibleFrequencyTerminology();
}

function syncSavedSpaceMetadata() {
  document.querySelectorAll<HTMLElement>('.evSavedSpaceMeta').forEach((meta) => {
    const items = Array.from(meta.querySelectorAll<HTMLElement>(':scope > span'));
    if (items.length < 3) return;

    const durationText = items[0].textContent?.trim() || '';
    const volumeText = items[1].textContent?.trim() || '';
    const atmosphereText = items[2].textContent?.trim() || '';
    const volumeMatch = volumeText.match(/(\d+(?:\.\d+)?)%/);
    const atmosphereMatch = atmosphereText.match(/(\d+)\s+atmosphere\s+(?:layer|layers)/i);

    const values = [
      durationText,
      volumeMatch ? `${volumeMatch[1]}%` : volumeText.replace(/^Frequency volume\s*/i, ''),
      atmosphereMatch ? `${atmosphereMatch[1]} ${Number(atmosphereMatch[1]) === 1 ? 'layer' : 'layers'}` : atmosphereText
    ];
    const labels = ['Duration', 'Frequency', 'Atmosphere'];

    items.slice(0, 3).forEach((item, index) => {
      item.dataset.evV1256Meta = 'true';
      item.dataset.evV1256Value = values[index];
      item.dataset.evV1256Label = labels[index];
    });
  });
}

function sessionHasSavableThoughts() {
  try {
    const session = JSON.parse(localStorage.getItem('ev-v10-active-session') || 'null') as {
      config?: { intention?: string };
      thoughts?: unknown[];
    } | null;
    const intention = session?.config?.intention?.trim() || '';
    const thoughts = Array.isArray(session?.thoughts)
      ? session.thoughts.some((thought) => String(thought).trim().length > 0)
      : false;
    return Boolean(intention || thoughts);
  } catch {
    return false;
  }
}

function getCompletionSaveKind(button: HTMLButtonElement): CompletionSaveKind | null {
  if (button.classList.contains('evSaveSpaceCompletionButton')) return 'setup';
  if (button.classList.contains('evSaveNotesButton')) return 'thoughts';
  return null;
}

export default function V1254QuickAccess() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const polishEnabled = enabled || pathname === '/';
  const [pastHero, setPastHero] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<DockSection>('voyage');

  useEffect(() => {
    if (!polishEnabled) return;

    const style = document.createElement('style');
    style.id = 'ev-v12-5-6-polish';
    style.textContent = V1256_POLISH_CSS;
    document.getElementById('ev-v12-5-5-polish')?.remove();
    document.getElementById(style.id)?.remove();
    document.head.appendChild(style);

    if (pathname === '/') {
      const timers = [0, 60, 180].map((delay) => window.setTimeout(syncEntrancePolish, delay));
      return () => {
        timers.forEach((timer) => window.clearTimeout(timer));
        style.remove();
      };
    }

    let premiumObserver: MutationObserver | null = null;
    let completionObserver: MutationObserver | null = null;
    let syncFrame: number | null = null;
    let committedActions = new WeakSet<HTMLButtonElement>();
    const successTimers = new WeakMap<HTMLButtonElement, number>();
    const successTimerIds = new Set<number>();
    const retryTimers: number[] = [];

    const syncAll = () => {
      syncPremiumPolish();
      syncSavedSpaceMetadata();
      syncVisibleFrequencyTerminology();
    };

    const scheduleSync = () => {
      if (syncFrame !== null) return;
      syncFrame = window.requestAnimationFrame(() => {
        syncFrame = null;
        syncAll();
      });
    };

    const attachPremiumObserver = () => {
      if (premiumObserver) return;
      const root = document.getElementById('ev-premium-root');
      if (!root) return;
      premiumObserver = new MutationObserver(scheduleSync);
      premiumObserver.observe(root, { childList: true, subtree: true });
      scheduleSync();
    };

    const attachCompletionObserver = () => {
      const completion = document.querySelector<HTMLElement>('.v10Completion');
      if (!completion || completionObserver) return;
      completionObserver = new MutationObserver(() => {
        scheduleSync();
        completion.querySelectorAll<HTMLButtonElement>('.evSaveSpaceCompletionButton, .evSaveNotesButton').forEach((button) => {
          if (!committedActions.has(button)) return;
          button.disabled = false;
          button.removeAttribute('aria-disabled');
        });
      });
      completionObserver.observe(completion, { childList: true, subtree: true });
    };

    const flashSavedAction = (button: HTMLButtonElement, kind: CompletionSaveKind) => {
      const root = button.parentElement;
      if (!root) return;

      const previousTimer = successTimers.get(button);
      if (previousTimer) {
        window.clearTimeout(previousTimer);
        successTimerIds.delete(previousTimer);
      }

      root.classList.remove('evV1256SaveCommitted');
      root.classList.add('evV1256SaveSuccess', 'is-complete');
      button.classList.add('is-saved');
      button.disabled = false;
      button.removeAttribute('aria-disabled');

      const presentation = root.querySelector<HTMLElement>('.evCompletionActionPresentation');
      const strong = presentation?.querySelector<HTMLElement>('.evCompletionActionCopy strong');
      const small = presentation?.querySelector<HTMLElement>('.evCompletionActionCopy small');
      const icon = presentation?.querySelector<HTMLElement>('.evCompletionActionIcon');
      const chevron = presentation?.querySelector<HTMLElement>('.evCompletionActionChevron');
      const successLabel = kind === 'setup' ? 'Setup saved' : 'Thoughts saved';
      if (strong) strong.textContent = successLabel;
      if (small) small.textContent = kind === 'setup' ? 'Ready whenever you return' : 'Saved privately on this device';
      if (icon) icon.textContent = '✓';
      if (chevron) chevron.textContent = '✓';

      const timer = window.setTimeout(() => {
        root.classList.remove('evV1256SaveSuccess');
        root.classList.add('evV1256SaveCommitted');
        button.disabled = false;
        button.removeAttribute('aria-disabled');
        successTimerIds.delete(timer);
      }, 720);
      successTimers.set(button, timer);
      successTimerIds.add(timer);
    };

    const handleCompletionSave = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest<HTMLButtonElement>('.evSaveSpaceCompletionButton, .evSaveNotesButton');
      if (!button) return;
      const kind = getCompletionSaveKind(button);
      if (!kind) return;
      if (kind === 'thoughts' && !sessionHasSavableThoughts()) return;

      if (committedActions.has(button)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        flashSavedAction(button, kind);
        return;
      }

      committedActions.add(button);
      window.setTimeout(() => flashSavedAction(button, kind), 0);
    };

    const handleCompleted = () => {
      successTimerIds.forEach((timer) => window.clearTimeout(timer));
      successTimerIds.clear();
      committedActions = new WeakSet<HTMLButtonElement>();
      completionObserver?.disconnect();
      completionObserver = null;
      window.requestAnimationFrame(() => {
        attachCompletionObserver();
        scheduleSync();
      });
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('.evPremiumCategoryTabs button')) window.setTimeout(scheduleSync, 0);
      if (target?.closest('.evSavedSpacesTrigger')) window.setTimeout(scheduleSync, 40);
    };

    [0, 60, 160, 360, 720].forEach((delay) => {
      retryTimers.push(window.setTimeout(() => {
        attachPremiumObserver();
        attachCompletionObserver();
        scheduleSync();
      }, delay));
    });

    window.addEventListener('click', handleCompletionSave, true);
    window.addEventListener('ev:voyage-completed', handleCompleted);
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      if (syncFrame !== null) window.cancelAnimationFrame(syncFrame);
      successTimerIds.forEach((timer) => window.clearTimeout(timer));
      successTimerIds.clear();
      premiumObserver?.disconnect();
      completionObserver?.disconnect();
      window.removeEventListener('click', handleCompletionSave, true);
      window.removeEventListener('ev:voyage-completed', handleCompleted);
      document.removeEventListener('click', handleDocumentClick, true);
      style.remove();
    };
  }, [pathname, polishEnabled]);

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

    const updateOverlay = () => {
      const open = Boolean(document.querySelector('[role="dialog"]'));
      setOverlayOpen(open);
      if (open) window.requestAnimationFrame(syncSavedSpaceMetadata);
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

  useEffect(() => {
    if (!enabled) return;

    let footerObserver: IntersectionObserver | null = null;
    const timers: number[] = [];

    const attach = () => {
      if (footerObserver) return;
      const footer = document.querySelector<HTMLElement>('.evProductFooter');
      if (!footer) return;
      footerObserver = new IntersectionObserver((entries) => {
        setFooterVisible(entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.08));
      }, { threshold: [0, .08, .2] });
      footerObserver.observe(footer);
    };

    [0, 100, 320, 760, 1400].forEach((delay) => timers.push(window.setTimeout(attach, delay)));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      footerObserver?.disconnect();
      setFooterVisible(false);
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
  const dockVisible = pastHero && !keyboardOpen && !overlayOpen && !footerVisible;

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
