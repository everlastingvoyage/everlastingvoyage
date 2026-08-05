export type FrequencyPreviewConfig = {
  leftHz: number;
  rightHz: number;
  durationMs?: number;
};

export type FrequencyPreviewHandle = {
  durationMs: number;
  stop: () => void;
};

let activeStop: (() => void) | null = null;

export function stopActiveFrequencyPreview() {
  activeStop?.();
  activeStop = null;
}

export async function startFrequencyPreview(
  config: FrequencyPreviewConfig,
  onEnded?: () => void
): Promise<FrequencyPreviewHandle | null> {
  if (typeof window === 'undefined') return null;

  stopActiveFrequencyPreview();

  const AudioContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) return null;

  const durationMs = Math.max(1200, config.durationMs ?? 10000);
  let context: AudioContext;

  try {
    context = new AudioContextClass({ latencyHint: 'interactive' });
  } catch {
    context = new AudioContextClass();
  }

  try {
    if (context.state !== 'running') await context.resume();
  } catch {
    await context.close().catch(() => undefined);
    return null;
  }

  const startedAt = context.currentTime;
  const durationSeconds = durationMs / 1000;
  const master = context.createGain();
  const merger = context.createChannelMerger(2);
  const oscillators: OscillatorNode[] = [];
  let finished = false;
  let naturalTimer: number | undefined;

  master.gain.setValueAtTime(0.0001, startedAt);
  master.gain.exponentialRampToValueAtTime(0.018, startedAt + 0.18);
  master.gain.setValueAtTime(0.018, Math.max(startedAt + 0.18, startedAt + durationSeconds - 0.45));
  master.gain.exponentialRampToValueAtTime(0.0001, startedAt + durationSeconds);
  merger.connect(master);
  master.connect(context.destination);

  const addTone = (frequency: number, channel: 0 | 1) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startedAt);
    gain.gain.setValueAtTime(0.72, startedAt);
    oscillator.connect(gain);
    gain.connect(merger, 0, channel);
    oscillator.start(startedAt);
    oscillator.stop(startedAt + durationSeconds + 0.08);
    oscillators.push(oscillator);
  };

  addTone(config.leftHz, 0);
  addTone(config.rightHz, 1);

  const finalize = (notify: boolean) => {
    if (finished) return;
    finished = true;
    if (naturalTimer) window.clearTimeout(naturalTimer);

    const now = context.currentTime;
    try {
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    } catch {
      // Closing the context below remains the final cleanup.
    }

    window.setTimeout(() => {
      oscillators.forEach((oscillator) => {
        try { oscillator.stop(); } catch { /* already stopped */ }
        try { oscillator.disconnect(); } catch { /* already disconnected */ }
      });
      try { merger.disconnect(); } catch { /* already disconnected */ }
      try { master.disconnect(); } catch { /* already disconnected */ }
      void context.close().catch(() => undefined);
      if (activeStop === stop) activeStop = null;
      if (notify) onEnded?.();
    }, 110);
  };

  const stop = () => finalize(false);
  activeStop = stop;
  naturalTimer = window.setTimeout(() => finalize(true), durationMs + 20);

  return { durationMs, stop };
}
