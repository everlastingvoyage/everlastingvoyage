'use client';

import { useEffect } from 'react';

const VOLUME_STORAGE_KEY = 'ev-v10-precision-volume';

function setReactInputValue(input: HTMLInputElement, value: number) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, String(value));
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

export default function V10SessionPolish() {
  useEffect(() => {
    const cleanups = new Map<HTMLInputElement, () => void>();

    const enhanceVolumeControl = () => {
      const overlay = document.querySelector<HTMLElement>('.v10SessionOverlay');
      const input = overlay?.querySelector<HTMLInputElement>('.v10AudioControls input[type="range"]');
      if (!overlay || !input || input.dataset.precisionReady === 'true') return;

      const isPureTone = overlay.classList.contains('abundance');
      const safeMaximum = isPureTone ? 0.055 : 0.14;
      const defaultLevel = isPureTone ? 0.019 : 0.045;
      const storedPercent = Number(localStorage.getItem(VOLUME_STORAGE_KEY));
      const hasStoredPercent = Number.isFinite(storedPercent) && storedPercent >= 0 && storedPercent <= 100;
      const requestedLevel = hasStoredPercent ? (storedPercent / 100) * safeMaximum : Number(input.value);
      const initialLevel = requestedLevel > safeMaximum || requestedLevel < 0
        ? defaultLevel
        : requestedLevel;

      input.dataset.precisionReady = 'true';
      input.min = '0';
      input.max = String(safeMaximum);
      input.step = '0.001';

      const label = input.closest('label');
      const labelText = label?.querySelector<HTMLElement>('span');
      let percentage = label?.querySelector<HTMLElement>('.v10VolumePercent');
      if (!percentage && labelText) {
        percentage = document.createElement('b');
        percentage.className = 'v10VolumePercent';
        labelText.appendChild(percentage);
      }

      const muteButton = overlay.querySelector<HTMLButtonElement>('.v10AudioControls button');

      const updateVisualState = () => {
        const current = Math.max(0, Math.min(safeMaximum, Number(input.value) || 0));
        const percent = safeMaximum > 0 ? Math.round((current / safeMaximum) * 100) : 0;
        input.style.setProperty('--v10-volume', `${percent}%`);
        input.setAttribute('aria-valuetext', `${percent}%`);
        if (percentage) percentage.textContent = `${percent}%`;
        localStorage.setItem(VOLUME_STORAGE_KEY, String(percent));

        if (muteButton) {
          const buttonText = muteButton.textContent?.trim().toLowerCase();
          if (current <= 0 && buttonText === 'mute') muteButton.click();
          if (current > 0 && buttonText === 'unmute') muteButton.click();
        }
      };

      const onInput = () => updateVisualState();
      input.addEventListener('input', onInput);
      input.addEventListener('change', onInput);
      cleanups.set(input, () => {
        input.removeEventListener('input', onInput);
        input.removeEventListener('change', onInput);
      });

      setReactInputValue(input, Number(initialLevel.toFixed(3)));
      requestAnimationFrame(updateVisualState);
    };

    enhanceVolumeControl();
    const observer = new MutationObserver(() => requestAnimationFrame(enhanceVolumeControl));
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
    };
  }, []);

  return null;
}
