'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

type StateId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';

const stateMeta: Record<StateId, { label: string; aria: string }> = {
  alpha: { label: 'Calm Focus', aria: 'Open Alpha 10 Hz — Calm Focus details' },
  gamma: { label: 'Deep Focus', aria: 'Open Gamma 40 Hz — Deep Focus details' },
  theta: { label: 'Creative Flow', aria: 'Open Theta 4 Hz — Creative Flow details' },
  delta: { label: 'Deep Rest', aria: 'Open Delta 2 Hz — Deep Rest details' },
  abundance: { label: 'Abundance', aria: 'Open Pure Tone 888 Hz — Abundance details' }
};

const stateIds = Object.keys(stateMeta) as StateId[];

function getStateId(element: Element | null): StateId | null {
  if (!element) return null;
  return stateIds.find((id) => element.classList.contains(id)) ?? null;
}

export default function FrequencyChamberExperience() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/voyage') return;

    const library = document.querySelector<HTMLElement>('#library');
    const stage = library?.querySelector<HTMLElement>('.signalStage');
    const experience = library?.querySelector<HTMLElement>('.signalExperience');
    const intro = library?.querySelector<HTMLElement>('.sectionIntro');
    const eyebrow = intro?.querySelector<HTMLElement>('.eyebrow');
    const title = intro?.querySelector<HTMLElement>('h2');
    const legacyCopy = intro?.querySelector<HTMLElement>(':scope > p');
    const hint = library?.querySelector<HTMLElement>('.compactHint');
    const hintText = hint?.querySelector<HTMLElement>('span:first-child');

    if (!library || !stage || !experience || !intro || !eyebrow || !title || !hint || !hintText) return;

    const original = {
      eyebrow: eyebrow.textContent,
      title: title.textContent,
      hint: hintText.textContent,
      hintAria: hint.getAttribute('aria-hidden'),
      legacyClass: legacyCopy?.className ?? ''
    };

    library.classList.add('evFrequencyChamber');
    eyebrow.textContent = 'Frequency chamber';
    title.textContent = 'Explore the signal behind every state.';
    hintText.textContent = 'Tap a frequency to expand the signal';
    hint.setAttribute('aria-hidden', 'false');
    legacyCopy?.classList.add('evFrequencyLegacyCopy');

    const visualLayer = document.createElement('div');
    visualLayer.className = 'evChamberVisualLayer';
    visualLayer.setAttribute('aria-hidden', 'true');

    const auras = document.createElement('div');
    auras.className = 'evChamberAuras';
    stateIds.forEach((id) => {
      const aura = document.createElement('span');
      aura.className = `evChamberAura ${id}`;
      auras.appendChild(aura);
    });

    const links = document.createElement('div');
    links.className = 'evChamberEnergyLinks';
    stateIds.forEach((id) => {
      const link = document.createElement('span');
      link.className = `evChamberEnergyLink ${id}`;
      links.appendChild(link);
    });

    const particles = document.createElement('div');
    particles.className = 'evChamberParticles';
    Array.from({ length: 18 }).forEach((_, index) => {
      const particle = document.createElement('span');
      particle.style.setProperty('--ev-particle-index', String(index));
      particle.style.setProperty('--ev-particle-angle', `${index * 20}deg`);
      particle.style.setProperty('--ev-particle-distance', `${170 + index * 7}px`);
      particle.style.setProperty('--ev-particle-delay', `${index * -360}ms`);
      particles.appendChild(particle);
    });

    visualLayer.append(auras, links, particles);
    stage.prepend(visualLayer);

    const trustRow = document.createElement('div');
    trustRow.className = 'evChamberTrustRow';
    trustRow.setAttribute('aria-label', 'Frequency transparency principles');
    ['Exact frequencies', 'No hidden layers', 'Clear listening guidance'].forEach((text, index) => {
      const item = document.createElement('span');
      const number = document.createElement('i');
      number.setAttribute('aria-hidden', 'true');
      number.textContent = `0${index + 1}`;
      item.append(number, document.createTextNode(text));
      trustRow.appendChild(item);
    });
    experience.insertAdjacentElement('afterend', trustRow);

    const nodes = Array.from(stage.querySelectorAll<HTMLButtonElement>('.signalNode'));
    const cleanupNodes: Array<() => void> = [];

    const setHoverState = (id: StateId | null) => {
      if (id) {
        library.dataset.hoverState = id;
        stage.dataset.hoverState = id;
      } else {
        delete library.dataset.hoverState;
        delete stage.dataset.hoverState;
      }
    };

    nodes.forEach((node) => {
      const id = getStateId(node);
      if (!id) return;

      const stateName = document.createElement('small');
      stateName.className = 'evSignalStateName';
      stateName.textContent = stateMeta[id].label;
      node.appendChild(stateName);

      const previousAria = node.getAttribute('aria-label');
      node.setAttribute('aria-label', stateMeta[id].aria);
      node.dataset.chamberState = id;

      const enter = () => setHoverState(id);
      const leave = () => {
        window.setTimeout(() => {
          const focusedNode = document.activeElement?.closest?.('.signalNode');
          if (!focusedNode && !stage.matches(':hover')) setHoverState(null);
        }, 0);
      };
      const focus = () => setHoverState(id);
      const blur = () => {
        window.setTimeout(() => {
          if (!stage.contains(document.activeElement)) setHoverState(null);
        }, 0);
      };

      node.addEventListener('pointerenter', enter);
      node.addEventListener('pointerleave', leave);
      node.addEventListener('focus', focus);
      node.addEventListener('blur', blur);

      cleanupNodes.push(() => {
        node.removeEventListener('pointerenter', enter);
        node.removeEventListener('pointerleave', leave);
        node.removeEventListener('focus', focus);
        node.removeEventListener('blur', blur);
        stateName.remove();
        delete node.dataset.chamberState;
        if (previousAria === null) node.removeAttribute('aria-label');
        else node.setAttribute('aria-label', previousAria);
      });
    });

    let resetTimer: number | undefined;
    const resetAfterPopup = () => {
      window.clearTimeout(resetTimer);
      const popupOpen = Boolean(stage.querySelector('.signalPopupOverlay:not(.signalPopupExitGhost)'));
      if (popupOpen) return;

      resetTimer = window.setTimeout(() => {
        if (stage.querySelector('.signalPopupOverlay:not(.signalPopupExitGhost)')) return;
        delete stage.dataset.restState;
        delete library.dataset.restState;
      }, 1650);
    };

    const observer = new MutationObserver(resetAfterPopup);
    observer.observe(stage, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.clearTimeout(resetTimer);
      cleanupNodes.forEach((cleanup) => cleanup());
      visualLayer.remove();
      trustRow.remove();
      setHoverState(null);
      delete stage.dataset.restState;
      delete library.dataset.restState;
      library.classList.remove('evFrequencyChamber');
      eyebrow.textContent = original.eyebrow;
      title.textContent = original.title;
      hintText.textContent = original.hint;
      if (original.hintAria === null) hint.removeAttribute('aria-hidden');
      else hint.setAttribute('aria-hidden', original.hintAria);
      if (legacyCopy) legacyCopy.className = original.legacyClass;
    };
  }, [pathname]);

  return null;
}
