'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type StateId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';
type SessionStatus = 'ready' | 'running' | 'paused' | 'completed';

type SignalDefinition = {
  id: StateId;
  frequency: string;
  hz: string;
  state: string;
  purpose: string;
  technical: string;
  note: string;
  leftHz?: number;
  rightHz?: number;
  pureHz?: number;
};

type SessionConfig = {
  stateId: StateId;
  durationMinutes: number;
  intention: string;
};

type PersistedSession = {
  config: SessionConfig;
  status: SessionStatus;
  remainingSeconds: number;
  endAt: number | null;
  thoughts: string[];
  volume: number;
  muted: boolean;
  updatedAt: number;
};

const STORAGE_KEY = 'ev-v10-active-session';

const signals: Record<StateId, SignalDefinition> = {
  alpha: {
    id: 'alpha',
    frequency: 'Alpha',
    hz: '10 Hz',
    state: 'Calm Focus',
    purpose: 'Steady concentration for studying, reading and planning.',
    technical: 'Left 180 Hz · Right 190 Hz · 10 Hz difference',
    note: 'Headphones recommended',
    leftHz: 180,
    rightHz: 190
  },
  gamma: {
    id: 'gamma',
    frequency: 'Gamma',
    hz: '40 Hz',
    state: 'Deep Focus',
    purpose: 'High-attention focus for demanding work and research.',
    technical: 'Left 220 Hz · Right 260 Hz · 40 Hz difference',
    note: 'Headphones recommended',
    leftHz: 220,
    rightHz: 260
  },
  theta: {
    id: 'theta',
    frequency: 'Theta',
    hz: '4 Hz',
    state: 'Creative Flow',
    purpose: 'A reflective space for writing, meditation and ideation.',
    technical: 'Left 95 Hz · Right 99 Hz · 4 Hz difference',
    note: 'Headphones recommended',
    leftHz: 95,
    rightHz: 99
  },
  delta: {
    id: 'delta',
    frequency: 'Delta',
    hz: '2 Hz',
    state: 'Deep Rest',
    purpose: 'A quiet wind-down state for rest and sleep preparation.',
    technical: 'Left 70 Hz · Right 72 Hz · 2 Hz difference',
    note: 'Headphones recommended',
    leftHz: 70,
    rightHz: 72
  },
  abundance: {
    id: 'abundance',
    frequency: 'Pure Tone',
    hz: '888 Hz',
    state: 'Abundance',
    purpose: 'A ceremonial pure-tone space for visualization and intention.',
    technical: 'Pure 888 Hz tone · Clean uninterrupted signal',
    note: 'Speakers or headphones',
    pureHz: 888
  }
};

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function readBuilderConfig(): SessionConfig {
  const ids: StateId[] = ['alpha', 'gamma', 'theta', 'delta', 'abundance'];
  const activeState = document.querySelector<HTMLElement>('.stateChoice.active');
  const stateId = ids.find((id) => activeState?.classList.contains(id)) ?? 'alpha';
  const durationText = document.querySelector<HTMLElement>('.durationRow button.active')?.textContent ?? '25';
  const durationMinutes = Number.parseInt(durationText, 10) || 25;
  const intention = (document.querySelector<HTMLInputElement>('.intentionField input')?.value ?? '').trim();
  return { stateId, durationMinutes, intention };
}

export default function V10VoyageEngine() {
  const [config, setConfig] = useState<SessionConfig>({ stateId: 'alpha', durationMinutes: 25, intention: '' });
  const [status, setStatus] = useState<SessionStatus>('ready');
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [thought, setThought] = useState('');
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [thoughtSaved, setThoughtSaved] = useState(false);
  const [volume, setVolume] = useState(0.22);
  const [muted, setMuted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscillatorRefs = useRef<OscillatorNode[]>([]);
  const completionPlayedRef = useRef(false);

  const signal = signals[config.stateId];
  const totalSeconds = config.durationMinutes * 60;
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds)) : 0;

  const persist = useCallback(
    (overrides: Partial<PersistedSession> = {}) => {
      if (typeof window === 'undefined') return;
      const payload: PersistedSession = {
        config,
        status,
        remainingSeconds,
        endAt,
        thoughts,
        volume,
        muted,
        updatedAt: Date.now(),
        ...overrides
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },
    [config, status, remainingSeconds, endAt, thoughts, volume, muted]
  );

  const ensureAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio is not supported in this browser.');
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    return audioContextRef.current;
  }, []);

  const stopAudio = useCallback((fadeSeconds = 0.35) => {
    const context = audioContextRef.current;
    const gain = masterGainRef.current;
    const oscillators = oscillatorRefs.current;
    if (!context || !gain || oscillators.length === 0) return;

    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);

    window.setTimeout(() => {
      oscillators.forEach((oscillator) => {
        try {
          oscillator.stop();
          oscillator.disconnect();
        } catch {
          // The node may already be stopped.
        }
      });
      oscillatorRefs.current = [];
      masterGainRef.current = null;
    }, Math.ceil(fadeSeconds * 1000) + 60);
  }, []);

  const startAudio = useCallback(async () => {
    const context = await ensureAudioContext();
    stopAudio(0.06);

    const masterGain = context.createGain();
    const now = context.currentTime;
    const targetVolume = muted ? 0.0001 : Math.max(0.0001, volume);
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(targetVolume, now + 0.8);
    masterGain.connect(context.destination);
    masterGainRef.current = masterGain;

    const created: OscillatorNode[] = [];

    if (signal.pureHz) {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(signal.pureHz, now);
      oscillator.connect(masterGain);
      oscillator.start(now);
      created.push(oscillator);
    } else if (signal.leftHz && signal.rightHz) {
      const merger = context.createChannelMerger(2);
      const leftGain = context.createGain();
      const rightGain = context.createGain();
      leftGain.gain.value = 0.62;
      rightGain.gain.value = 0.62;
      leftGain.connect(merger, 0, 0);
      rightGain.connect(merger, 0, 1);
      merger.connect(masterGain);

      const left = context.createOscillator();
      const right = context.createOscillator();
      left.type = 'sine';
      right.type = 'sine';
      left.frequency.setValueAtTime(signal.leftHz, now);
      right.frequency.setValueAtTime(signal.rightHz, now);
      left.connect(leftGain);
      right.connect(rightGain);
      left.start(now);
      right.start(now);
      created.push(left, right);
    }

    oscillatorRefs.current = created;
  }, [ensureAudioContext, muted, signal, stopAudio, volume]);

  const playCompletionSound = useCallback(async () => {
    if (muted || completionPlayedRef.current) return;
    completionPlayedRef.current = true;
    try {
      const context = await ensureAudioContext();
      const now = context.currentTime;
      [392, 523.25, 659.25].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.0001, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.045, now + index * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1 + index * 0.08);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + index * 0.08);
        oscillator.stop(now + 1.25 + index * 0.08);
      });
    } catch {
      // Completion remains visual when audio is unavailable.
    }
  }, [ensureAudioContext, muted]);

  const completeSession = useCallback(() => {
    stopAudio(0.9);
    setStatus('completed');
    setEndAt(null);
    setRemainingSeconds(0);
    playCompletionSound();
  }, [playCompletionSound, stopAudio]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as PersistedSession;
        const validState = saved.config && signals[saved.config.stateId];
        if (validState) {
          let restoredRemaining = Math.max(0, saved.remainingSeconds || saved.config.durationMinutes * 60);
          let restoredStatus = saved.status;
          let restoredEndAt = saved.endAt;
          if (saved.status === 'running' && saved.endAt) {
            restoredRemaining = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
            if (restoredRemaining === 0) {
              restoredStatus = 'completed';
              restoredEndAt = null;
            } else {
              restoredStatus = 'paused';
              restoredEndAt = null;
            }
          }
          setConfig(saved.config);
          setStatus(restoredStatus);
          setRemainingSeconds(restoredRemaining);
          setEndAt(restoredEndAt);
          setThoughts(Array.isArray(saved.thoughts) ? saved.thoughts : []);
          setVolume(typeof saved.volume === 'number' ? saved.volume : 0.22);
          setMuted(Boolean(saved.muted));
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persist();
  }, [hydrated, persist]);

  useEffect(() => {
    if (status !== 'running' || !endAt) return;
    const update = () => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next <= 0) completeSession();
    };
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [status, endAt, completeSession]);

  useEffect(() => {
    const gain = masterGainRef.current;
    const context = audioContextRef.current;
    if (!gain || !context) return;
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(muted ? 0.0001 : Math.max(0.0001, volume), now, 0.08);
  }, [muted, volume]);

  useEffect(() => {
    const interceptEnterVoyage = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest<HTMLButtonElement>('.builderActions .primaryButton');
      if (!button || !button.textContent?.toLowerCase().includes('enter the voyage')) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const nextConfig = readBuilderConfig();
      const nextRemaining = nextConfig.durationMinutes * 60;
      completionPlayedRef.current = false;
      stopAudio(0.08);
      setConfig(nextConfig);
      setStatus('ready');
      setRemainingSeconds(nextRemaining);
      setEndAt(null);
      setThought('');
      setThoughts([]);
      setIsOpen(true);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          config: nextConfig,
          status: 'ready',
          remainingSeconds: nextRemaining,
          endAt: null,
          thoughts: [],
          volume,
          muted,
          updatedAt: Date.now()
        } satisfies PersistedSession)
      );
    };

    document.addEventListener('click', interceptEnterVoyage, true);
    return () => document.removeEventListener('click', interceptEnterVoyage, true);
  }, [muted, stopAudio, volume]);

  useEffect(() => {
    document.body.classList.toggle('v10-session-open', isOpen);
    return () => document.body.classList.remove('v10-session-open');
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopAudio(0.08);
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, [stopAudio]);

  const startOrResume = async () => {
    try {
      await startAudio();
      const nextEndAt = Date.now() + remainingSeconds * 1000;
      completionPlayedRef.current = false;
      setEndAt(nextEndAt);
      setStatus('running');
      persist({ status: 'running', endAt: nextEndAt, remainingSeconds });
    } catch {
      setStatus('paused');
    }
  };

  const pauseSession = () => {
    const nextRemaining = endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : remainingSeconds;
    stopAudio(0.4);
    setRemainingSeconds(nextRemaining);
    setEndAt(null);
    setStatus('paused');
    persist({ status: 'paused', endAt: null, remainingSeconds: nextRemaining });
  };

  const resetSession = () => {
    stopAudio(0.35);
    completionPlayedRef.current = false;
    setStatus('ready');
    setEndAt(null);
    setRemainingSeconds(totalSeconds);
    persist({ status: 'ready', endAt: null, remainingSeconds: totalSeconds });
  };

  const closeSession = () => {
    if (status === 'running') pauseSession();
    setIsOpen(false);
  };

  const endSession = () => {
    stopAudio(0.65);
    setStatus('completed');
    setEndAt(null);
    setRemainingSeconds(Math.max(0, remainingSeconds));
    playCompletionSound();
  };

  const repeatVoyage = () => {
    completionPlayedRef.current = false;
    setStatus('ready');
    setEndAt(null);
    setRemainingSeconds(totalSeconds);
    setThought('');
    setThoughts([]);
  };

  const addThought = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = thought.trim();
    if (!clean) return;
    const nextThoughts = [...thoughts, clean];
    setThoughts(nextThoughts);
    setThought('');
    setThoughtSaved(true);
    window.setTimeout(() => setThoughtSaved(false), 1600);
    persist({ thoughts: nextThoughts });
  };

  const sessionSummary = useMemo(
    () => `${config.durationMinutes} minutes · ${signal.frequency} · ${signal.state}`,
    [config.durationMinutes, signal]
  );

  if (!hydrated) return null;

  return (
    <>
      {!isOpen && status !== 'completed' && remainingSeconds < totalSeconds && (
        <button type="button" className={`v10ContinueVoyage ${signal.id}`} onClick={() => setIsOpen(true)}>
          Continue voyage <span>{formatTime(remainingSeconds)}</span>
        </button>
      )}

      {isOpen && (
        <div className={`v10SessionOverlay ${signal.id} ${status}`} role="dialog" aria-modal="true" aria-label={`${signal.state} voyage session`}>
          <div className="v10SessionAtmosphere" aria-hidden="true" />
          <div className="v10SessionParticles" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, index) => (
              <span key={index} style={{ '--particle-index': index } as React.CSSProperties} />
            ))}
          </div>

          <header className="v10SessionHeader">
            <div className="v10SessionBrand">
              <img src="/brand-infinity.png" alt="" />
              <span>Everlasting Voyage</span>
            </div>
            <button type="button" className="v10CloseSession" onClick={closeSession}>
              Close
            </button>
          </header>

          {status === 'completed' ? (
            <main className="v10Completion">
              <p className="v10SessionEyebrow">Voyage complete</p>
              <h2>The signal is quiet.</h2>
              <p className="v10CompletionSummary">{sessionSummary}</p>
              {config.intention && (
                <div className="v10CompletionIntention">
                  <span>Your intention</span>
                  <strong>{config.intention}</strong>
                </div>
              )}
              {thoughts.length > 0 && (
                <div className="v10CompletionThoughts">
                  <span>Captured thoughts</span>
                  {thoughts.map((item, index) => (
                    <p key={`${item}-${index}`}>{item}</p>
                  ))}
                </div>
              )}
              <div className="v10CompletionActions">
                <button type="button" className="v10PrimaryAction" onClick={repeatVoyage}>Repeat this voyage</button>
                <button
                  type="button"
                  className="v10SecondaryAction"
                  onClick={() => {
                    setIsOpen(false);
                    document.getElementById('session-builder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  Start another state
                </button>
                <button
                  type="button"
                  className="v10TextAction"
                  onClick={() => {
                    setIsOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Return home
                </button>
              </div>
            </main>
          ) : (
            <main className="v10SessionMain">
              <section className="v10SessionIdentity">
                <span className="v10SessionEyebrow">{signal.frequency} · {signal.hz}</span>
                <h2>{signal.state}</h2>
                <p>{config.intention || signal.purpose}</p>
              </section>

              <section className="v10TimerArea">
                <div className="v10ProgressRing" style={{ '--session-progress': `${progress * 360}deg` } as React.CSSProperties}>
                  <div className="v10TimerDisplay">{formatTime(remainingSeconds)}</div>
                  <span>{status === 'running' ? 'Signal active' : status === 'paused' ? 'Voyage paused' : 'Ready to begin'}</span>
                </div>

                <div className="v10TimerControls">
                  {status === 'running' ? (
                    <button type="button" className="v10PrimaryAction" onClick={pauseSession}>Pause</button>
                  ) : (
                    <button type="button" className="v10PrimaryAction" onClick={startOrResume}>
                      {status === 'paused' ? 'Resume' : 'Begin'}
                    </button>
                  )}
                  <button type="button" className="v10SecondaryAction" onClick={resetSession}>Reset</button>
                  <button type="button" className="v10TextAction" onClick={endSession}>End session</button>
                </div>
              </section>

              <section className="v10SessionTools">
                <div className="v10AudioControls">
                  <div>
                    <span className={`v10AudioIndicator ${status === 'running' ? 'active' : ''}`} />
                    <strong>{status === 'running' ? 'Pure signal playing' : 'Pure signal ready'}</strong>
                  </div>
                  <label>
                    <span>Volume</span>
                    <input
                      type="range"
                      min="0.04"
                      max="0.42"
                      step="0.01"
                      value={volume}
                      onChange={(event) => setVolume(Number(event.target.value))}
                      aria-label="Session volume"
                    />
                  </label>
                  <button type="button" onClick={() => setMuted((current) => !current)}>{muted ? 'Unmute' : 'Mute'}</button>
                </div>

                <form className="v10ThoughtCapture" onSubmit={addThought}>
                  <label htmlFor="v10-thought">Capture a thought</label>
                  <div>
                    <input
                      id="v10-thought"
                      value={thought}
                      onChange={(event) => setThought(event.target.value)}
                      placeholder="Write it down without leaving the voyage"
                      maxLength={180}
                    />
                    <button type="submit">{thoughtSaved ? 'Saved ✓' : 'Save'}</button>
                  </div>
                </form>

                {thoughts.length > 0 && (
                  <div className="v10ThoughtList">
                    {thoughts.map((item, index) => (
                      <span key={`${item}-${index}`}>{item}</span>
                    ))}
                  </div>
                )}
              </section>
            </main>
          )}

          <footer className="v10SessionFooter">
            <span>{signal.technical}</span>
            <span>{signal.note} · Keep volume moderate</span>
          </footer>
        </div>
      )}
    </>
  );
}
