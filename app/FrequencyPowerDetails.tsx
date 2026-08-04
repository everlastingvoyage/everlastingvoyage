'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

type StateId = 'alpha' | 'gamma' | 'theta' | 'delta' | 'abundance';

type FrequencyPower = {
  id: StateId;
  frequency: string;
  hz: string;
  state: string;
  promise: string;
  benefits: string[];
  uses: string[];
  technical: string;
  guidance: string;
};

const powers: Record<StateId, FrequencyPower> = {
  alpha: { id: 'alpha', frequency: 'Alpha', hz: '10 Hz', state: 'Calm Focus', promise: 'Enter a clear, steady state for learning, planning and focused work without unnecessary pressure.', benefits: ['May support sustained attention', 'Creates a calmer entry into study', 'Helps organize thoughts around one task'], uses: ['Studying', 'Reading', 'Planning', 'Morning clarity', 'Steady work'], technical: 'Left 180 Hz · Right 190 Hz · 10 Hz difference', guidance: 'Headphones recommended · Keep volume moderate' },
  gamma: { id: 'gamma', frequency: 'Gamma', hz: '40 Hz', state: 'Deep Focus', promise: 'Enter a sharper, high-attention atmosphere for demanding work, research and complex problem solving.', benefits: ['May support high-demand concentration', 'Encourages active information processing', 'Useful for precise analytical sessions'], uses: ['Research', 'Programming', 'Complex study', 'Problem solving', 'Deep work'], technical: 'Left 220 Hz · Right 260 Hz · 40 Hz difference', guidance: 'Headphones recommended · Begin at a low volume' },
  theta: { id: 'theta', frequency: 'Theta', hz: '4 Hz', state: 'Creative Flow', promise: 'Enter a slower, more imaginative state for original thought, reflection and visualization.', benefits: ['May support creative ideation', 'Encourages reflective thinking', 'Creates room for mental flexibility'], uses: ['Writing', 'Brainstorming', 'Meditation', 'Journaling', 'Visualization'], technical: 'Left 95 Hz · Right 99 Hz · 4 Hz difference', guidance: 'Headphones recommended · Best in a quiet setting' },
  delta: { id: 'delta', frequency: 'Delta', hz: '2 Hz', state: 'Deep Rest', promise: 'Enter a cold, quiet and deeply slowed atmosphere designed for wind-down rituals and sleep preparation.', benefits: ['May support progressive relaxation', 'Helps reduce stimulation before rest', 'Creates a deliberate transition into stillness'], uses: ['Sleep preparation', 'Evening wind-down', 'Rest', 'Slow breathing', 'Recovery rituals'], technical: 'Left 70 Hz · Right 72 Hz · 2 Hz difference', guidance: 'Headphones recommended · Use only when resting safely' },
  abundance: { id: 'abundance', frequency: 'Pure Tone', hz: '888 Hz', state: 'Abundance', promise: 'Enter a warm ceremonial space for intention, visualization, gratitude and focused manifestation rituals.', benefits: ['Supports deliberate visualization', 'Creates a symbolic focus point', 'Pairs intention with a repeatable ritual'], uses: ['Manifestation', 'Affirmations', 'Gratitude', 'Journaling', 'Ceremonial meditation'], technical: 'Pure 888 Hz tone · Clean uninterrupted signal', guidance: 'Speakers or headphones · Start at a very low volume' }
};

function getNodeId(element: Element | null): StateId | null {
  if (!element) return null;
  const ids: StateId[] = ['alpha', 'gamma', 'theta', 'delta', 'abundance'];
  return ids.find((id) => element.classList.contains(id)) ?? null;
}

export default function FrequencyPowerDetails() {
  const pathname = usePathname();
  const enabled = pathname === '/voyage';
  const [activeId, setActiveId] = useState<StateId | null>(null);
  const [closing, setClosing] = useState(false);
  const active = useMemo(() => activeId ? powers[activeId] : null, [activeId]);

  useEffect(() => {
    if (!enabled) return;
    const handleSignalClick = (event: MouseEvent) => {
      const node = (event.target as Element | null)?.closest('.signalNode');
      const id = getNodeId(node);
      if (!id) return;
      setClosing(false);
      setActiveId(id);
    };
    document.addEventListener('click', handleSignalClick, true);
    return () => document.removeEventListener('click', handleSignalClick, true);
  }, [enabled]);

  useEffect(() => {
    document.body.classList.toggle('ev-frequency-power-open', Boolean(active));
    return () => document.body.classList.remove('ev-frequency-power-open');
  }, [active]);

  const close = useCallback(() => {
    if (!active || closing) return;
    setClosing(true);
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>('.signalPopupClose')?.click();
      setActiveId(null);
      setClosing(false);
    }, 280);
  }, [active, closing]);

  const applyState = useCallback(() => {
    if (!active) return;
    document.querySelector<HTMLButtonElement>('.signalPopupAction')?.click();
    setActiveId(null);
    setClosing(false);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, close]);

  if (!enabled || !active || typeof document === 'undefined') return null;

  return createPortal(
    <div className={`evFrequencyPowerBackdrop ${active.id} ${closing ? 'closing' : ''}`} role="presentation">
      <article className={`evFrequencyPowerCard ${active.id}`} role="dialog" aria-modal="true" aria-labelledby="ev-frequency-power-title">
        <div className="evFrequencyPowerTop"><span>{active.frequency} · {active.hz}</span><button type="button" onClick={close} aria-label="Close frequency details">×</button></div>
        <div className="evFrequencyPowerHero"><p>State potential</p><h2 id="ev-frequency-power-title">{active.state}</h2><strong>{active.promise}</strong></div>
        <div className="evFrequencyPowerGrid">
          <section><h3>What this state may support</h3><ul>{active.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></section>
          <section><h3>Best used for</h3><div className="evFrequencyUseChips">{active.uses.map((use) => <span key={use}>{use}</span>)}</div></section>
        </div>
        <div className="evFrequencyTechnical"><span>{active.technical}</span><span>{active.guidance}</span></div>
        <button type="button" className="evFrequencyPowerAction" onClick={applyState}>Use this state <span aria-hidden="true">→</span></button>
      </article>
    </div>,
    document.body
  );
}
