'use client';

import { useEffect } from 'react';
import {
  adjustGainByDb,
  formatGainDb,
  formatGainPercent
} from './precision-audio';

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
      input.step = String(safeMaximum / 1000);

      const label = input.closest('label');
      const labelText = label?.querySelector<HTMLElement>('span');
      let percentage = label?.querySelector<HTMLElement>('.v10VolumePercent');
      if (!percentage && labelText) {
        percentage = document.createElement('b');
        percentage.className = 'v10VolumePercent';
        labelText.appendChild(percentage);
      }

      let metric = label?.querySelector<HTMLElement>('.v11SignalDbMetric');
      if (!metric && labelText) {
        metric = document.createElement('small');
        metric.className = 'v11SignalDbMetric';
        labelText.appendChild(metric);
      }

      const rangeRow = document.createElement('div');
      rangeRow.className = 'v11SignalPrecisionRow';
      const minus = document.createElement('button');
      const plus = document.createElement('button');
      minus.type = 'button';
      plus.type = 'button';
      minus.className = 'v11SignalPrecisionStep';
      plus.className = 'v11SignalPrecisionStep';
      minus.innerHTML = '<span aria-hidden="true">−</span><small>1 dB</small>';
      plus.innerHTML = '<span aria-hidden="true">+</span><small>1 dB</small>';
      minus.setAttribute('aria-label', 'Lower pure signal volume by 1 decibel');
      plus.setAttribute('aria-label', 'Raise pure signal volume by 1 decibel');
      input.parentElement?.insertBefore(rangeRow, input);
      rangeRow.append(minus, input, plus);

      const muteButton = overlay.querySelector<HTMLButtonElement>('.v10AudioControls button');
      let repeatTimeout: number | null = null;
      let repeatInterval: number | null = null;

      const clearRepeat = () => {
        if (repeatTimeout !== null) window.clearTimeout(repeatTimeout);
        if (repeatInterval !== null) window.clearInterval(repeatInterval);
        repeatTimeout = null;
        repeatInterval = null;
      };

      const updateVisualState = () => {
        const current = Math.max(0, Math.min(safeMaximum, Number(input.value) || 0));
        const normalized = safeMaximum > 0 ? current / safeMaximum : 0;
        const percent = normalized * 100;
        input.style.setProperty('--v10-volume', `${percent}%`);
        input.setAttribute('aria-valuetext', `${formatGainPercent(normalized)}, ${formatGainDb(normalized)}`);
        if (percentage) percentage.textContent = formatGainPercent(normalized);
        if (metric) metric.textContent = formatGainDb(normalized);
        localStorage.setItem(VOLUME_STORAGE_KEY, String(percent));
        minus.disabled = normalized <= 0;
        plus.disabled = normalized >= 1;

        if (muteButton) {
          const buttonText = muteButton.textContent?.trim().toLowerCase();
          if (current <= 0 && buttonText === 'mute') muteButton.click();
          if (current > 0 && buttonText === 'unmute') muteButton.click();
        }
      };

      const adjust = (deltaDb: number) => {
        const current = Math.max(0, Math.min(safeMaximum, Number(input.value) || 0));
        const normalized = safeMaximum > 0 ? current / safeMaximum : 0;
        const next = adjustGainByDb(normalized, deltaDb) * safeMaximum;
        setReactInputValue(input, Number(next.toFixed(6)));
      };

      const beginRepeat = (event: PointerEvent, deltaDb: number) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        clearRepeat();
        adjust(deltaDb);
        repeatTimeout = window.setTimeout(() => {
          repeatInterval = window.setInterval(() => adjust(deltaDb), 110);
        }, 430);
      };

      const onMinusPointerDown = (event: PointerEvent) => beginRepeat(event, -1);
      const onPlusPointerDown = (event: PointerEvent) => beginRepeat(event, 1);
      const onMinusClick = (event: MouseEvent) => {
        if (event.detail === 0) adjust(-1);
      };
      const onPlusClick = (event: MouseEvent) => {
        if (event.detail === 0) adjust(1);
      };
      const onInput = () => updateVisualState();

      input.addEventListener('input', onInput);
      input.addEventListener('change', onInput);
      minus.addEventListener('pointerdown', onMinusPointerDown);
      plus.addEventListener('pointerdown', onPlusPointerDown);
      minus.addEventListener('click', onMinusClick);
      plus.addEventListener('click', onPlusClick);
      [minus, plus].forEach((button) => {
        button.addEventListener('pointerup', clearRepeat);
        button.addEventListener('pointercancel', clearRepeat);
        button.addEventListener('pointerleave', clearRepeat);
      });

      cleanups.set(input, () => {
        clearRepeat();
        input.removeEventListener('input', onInput);
        input.removeEventListener('change', onInput);
        minus.removeEventListener('pointerdown', onMinusPointerDown);
        plus.removeEventListener('pointerdown', onPlusPointerDown);
        minus.removeEventListener('click', onMinusClick);
        plus.removeEventListener('click', onPlusClick);
        [minus, plus].forEach((button) => {
          button.removeEventListener('pointerup', clearRepeat);
          button.removeEventListener('pointercancel', clearRepeat);
          button.removeEventListener('pointerleave', clearRepeat);
        });
      });

      setReactInputValue(input, Number(initialLevel.toFixed(6)));
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
