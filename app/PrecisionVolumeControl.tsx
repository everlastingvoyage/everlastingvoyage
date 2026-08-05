'use client';

import { useEffect, useRef } from 'react';
import {
  adjustGainByDb,
  formatGainDb,
  formatGainPercent
} from './precision-audio';

type PrecisionVolumeControlProps = {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  className?: string;
  label?: string;
};

export default function PrecisionVolumeControl({
  value,
  onChange,
  ariaLabel,
  className = '',
  label = 'Layer volume'
}: PrecisionVolumeControlProps) {
  const repeatTimeoutRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);
  const valueRef = useRef(value);
  const pointerHandledRef = useRef(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const clearRepeat = () => {
    if (repeatTimeoutRef.current !== null) window.clearTimeout(repeatTimeoutRef.current);
    if (repeatIntervalRef.current !== null) window.clearInterval(repeatIntervalRef.current);
    repeatTimeoutRef.current = null;
    repeatIntervalRef.current = null;
  };

  useEffect(() => clearRepeat, []);

  const adjust = (deltaDb: number) => {
    const next = adjustGainByDb(valueRef.current, deltaDb);
    valueRef.current = next;
    onChange(next);
  };

  const beginRepeat = (event: React.PointerEvent<HTMLButtonElement>, deltaDb: number) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    pointerHandledRef.current = true;
    clearRepeat();
    adjust(deltaDb);
    repeatTimeoutRef.current = window.setTimeout(() => {
      repeatIntervalRef.current = window.setInterval(() => adjust(deltaDb), 110);
    }, 430);
  };

  const handleClick = (deltaDb: number) => {
    if (pointerHandledRef.current) {
      pointerHandledRef.current = false;
      return;
    }
    adjust(deltaDb);
  };

  return (
    <div className={`evPrecisionVolume ${className}`.trim()}>
      <div className="evPrecisionVolumeHeader">
        <span>{label}</span>
        <strong>{value === 0 ? 'Muted' : formatGainPercent(value)}</strong>
        <small>{formatGainDb(value)}</small>
      </div>

      <div className="evPrecisionVolumeRow">
        <button
          type="button"
          className="evPrecisionStep"
          onPointerDown={(event) => beginRepeat(event, -1)}
          onPointerUp={clearRepeat}
          onPointerCancel={clearRepeat}
          onPointerLeave={clearRepeat}
          onClick={() => handleClick(-1)}
          aria-label={`Lower ${ariaLabel} by 1 decibel`}
          disabled={value <= 0}
        >
          <span aria-hidden="true">−</span>
          <small>1 dB</small>
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={ariaLabel}
          aria-valuetext={`${formatGainPercent(value)}, ${formatGainDb(value)}`}
        />

        <button
          type="button"
          className="evPrecisionStep"
          onPointerDown={(event) => beginRepeat(event, 1)}
          onPointerUp={clearRepeat}
          onPointerCancel={clearRepeat}
          onPointerLeave={clearRepeat}
          onClick={() => handleClick(1)}
          aria-label={`Raise ${ariaLabel} by 1 decibel`}
          disabled={value >= 1}
        >
          <span aria-hidden="true">+</span>
          <small>1 dB</small>
        </button>
      </div>
    </div>
  );
}
