'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  frequencyCatalog,
  frequencyIds,
  getFrequencyIdFromElement,
  type FrequencyId
} from './frequency-catalog';

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

    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    const particleCount = isMobile ? 8 : 18;
    const original = {
      eyebrow: eyebrow.textContent,
      title: title.textContent,
      hint: hintText.textContent,
      hintAria: hint.getAttribute('aria-hidden'),
      legacyClass: legacyCopy?.className ?? ''
    };

    library.classList.add('evFrequencyChamber');
    library.dataset.performanceMode = isMobile ? 'mobile' : 'desktop';
    stage.dataset.performanceMode = isMobile ? 'mobile' : 'desktop';
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

    const links = document.createElement('div');
    links.className = 'evChamberEnergyLinks';

    frequencyIds.forEach((id) => {
      const aura = document.createElement('span');
      aura.className = `evChamberAura ${id}`;
      auras.appendChild(aura);

      const link = document.createElement('span');
      link.className = `evChamberEnergyLink ${id}`;
      links.appendChild(link);
    });

    const particles = document.createElement('div');
    particles.className = 'evChamberParticles';
    const particleFragment = document.createDocumentFragment();

    Array.from({ length: particleCount }).forEach((_, index) => {
      const particle = document.createElement('span');
      particle.style.setProperty('--ev-particle-index', String(index));
      particle.style.setProperty('--ev-particle-angle', `${index * (360 / particleCount)}deg`);
      particle.style.setProperty('--ev-particle-distance', `${170 + index * (isMobile ? 11 : 7)}px`);
      particle.style.setProperty('--ev-particle-delay', `${index * -360}ms`);
      particleFragment.appendChild(particle);
    });

    particles.appendChild(particleFragment);
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

    const setHoverState = (id: FrequencyId | null) => {
      if (id) {
        library.dataset.hoverState = id;
        stage.dataset.hoverState = id;
      } else {
        delete library.dataset.hoverState;
        delete stage.dataset.hoverState;
      }
    };

    nodes.forEach((node) => {
      const id = getFrequencyIdFromElement(node);
      if (!id) return;

      const definition = frequencyCatalog[id];
      const stateName = document.createElement('small');
      stateName.className = 'evSignalStateName';
      stateName.textContent = definition.state;
      node.appendChild(stateName);

      const previousAria = node.getAttribute('aria-label');
      node.setAttribute('aria-label', definition.ariaLabel);
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

      node.addEventListener('pointerenter', enter, { passive: true });
      node.addEventListener('pointerleave', leave, { passive: true });
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

    const handleManagedCleanup = () => setHoverState(null);
    window.addEventListener('ev:frequency-popup-cleanup', handleManagedCleanup);

    return () => {
      window.removeEventListener('ev:frequency-popup-cleanup', handleManagedCleanup);
      cleanupNodes.forEach((cleanup) => cleanup());
      visualLayer.remove();
      trustRow.remove();
      setHoverState(null);
      delete stage.dataset.restState;
      delete stage.dataset.performanceMode;
      delete library.dataset.restState;
      delete library.dataset.performanceMode;
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
