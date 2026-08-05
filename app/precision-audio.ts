export const MIN_CONTROL_DB = -60;
export const DEFAULT_RESTORE_DB = -24;

export function clampGain(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function gainToDb(gain: number): number | null {
  const safeGain = clampGain(gain);
  if (safeGain <= 0) return null;
  return Math.max(MIN_CONTROL_DB, Math.min(0, 20 * Math.log10(safeGain)));
}

export function dbToGain(db: number): number {
  if (!Number.isFinite(db)) return 0;
  return clampGain(10 ** (Math.min(0, db) / 20));
}

export function adjustGainByDb(gain: number, deltaDb: number): number {
  if (!Number.isFinite(deltaDb) || deltaDb === 0) return clampGain(gain);

  const currentDb = gainToDb(gain);
  if (currentDb === null) {
    return deltaDb > 0 ? dbToGain(-40) : 0;
  }

  const nextDb = Math.min(0, currentDb + deltaDb);
  if (nextDb <= MIN_CONTROL_DB) return 0;
  return dbToGain(nextDb);
}

export function formatGainPercent(gain: number): string {
  const percent = clampGain(gain) * 100;
  if (percent === 0) return '0%';
  if (percent < 10) return `${percent.toFixed(1)}%`;
  return `${Math.round(percent)}%`;
}

export function formatGainDb(gain: number): string {
  const db = gainToDb(gain);
  if (db === null) return '−∞ dB';
  const rounded = Math.abs(db) < 0.05 ? 0 : db;
  return `${rounded.toFixed(1).replace('-', '−')} dB`;
}

export function formatGainMetric(gain: number): string {
  return `${formatGainPercent(gain)} · ${formatGainDb(gain)}`;
}
