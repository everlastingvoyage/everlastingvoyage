export const frequencyIds = ['alpha', 'gamma', 'theta', 'delta', 'abundance'] as const;

export type FrequencyId = (typeof frequencyIds)[number];
export type SignalType = 'binaural' | 'pure-tone' | 'isochronic';

export type FrequencyDefinition = {
  id: FrequencyId;
  frequency: string;
  hz: string;
  state: string;
  ariaLabel: string;
  promise: string;
  benefits: string[];
  uses: string[];
  technical: string;
  guidance: string;
  recommended: string;
  listeningType: string;
  signalType: SignalType;
  leftHz: number;
  rightHz: number;
  actionLabel: string;
};

export const frequencyCatalog = {
  alpha: {
    id: 'alpha',
    frequency: 'Alpha',
    hz: '10 Hz',
    state: 'Calm Focus',
    ariaLabel: 'Open Alpha 10 Hz — Calm Focus details',
    promise: 'Enter a clear, steady state for learning, planning and focused work without unnecessary pressure.',
    benefits: ['Supports sustained attention', 'Creates a calmer entry into study', 'Helps organize attention around one task'],
    uses: ['Studying', 'Reading', 'Planning', 'Morning clarity', 'Steady work'],
    technical: 'Left 180 Hz · Right 190 Hz · 10 Hz difference',
    guidance: 'Keep volume moderate · Begin in a quiet setting',
    recommended: '25–60 minutes',
    listeningType: 'Binaural signal · Headphones required for the binaural effect',
    signalType: 'binaural',
    leftHz: 180,
    rightHz: 190,
    actionLabel: 'Build a Calm Focus voyage'
  },
  gamma: {
    id: 'gamma',
    frequency: 'Gamma',
    hz: '40 Hz',
    state: 'Deep Focus',
    ariaLabel: 'Open Gamma 40 Hz — Deep Focus details',
    promise: 'Enter a sharper, high-attention atmosphere for demanding work, research and complex problem solving.',
    benefits: ['Supports high-demand concentration', 'Encourages active information processing', 'Designed for precise analytical sessions'],
    uses: ['Research', 'Programming', 'Complex study', 'Problem solving', 'Deep work'],
    technical: 'Left 220 Hz · Right 260 Hz · 40 Hz difference',
    guidance: 'Begin at a low volume · Best for active work',
    recommended: '25–50 minutes',
    listeningType: 'Binaural signal · Headphones required for the binaural effect',
    signalType: 'binaural',
    leftHz: 220,
    rightHz: 260,
    actionLabel: 'Build a Deep Focus voyage'
  },
  theta: {
    id: 'theta',
    frequency: 'Theta',
    hz: '4 Hz',
    state: 'Creative Flow',
    ariaLabel: 'Open Theta 4 Hz — Creative Flow details',
    promise: 'Enter a slower, more imaginative state for original thought, reflection and visualization.',
    benefits: ['Encourages creative ideation', 'Supports reflective thinking', 'Creates space for mental flexibility'],
    uses: ['Writing', 'Brainstorming', 'Meditation', 'Journaling', 'Visualization'],
    technical: 'Left 95 Hz · Right 99 Hz · 4 Hz difference',
    guidance: 'Keep volume moderate · Best in a quiet setting',
    recommended: '25–60 minutes',
    listeningType: 'Binaural signal · Headphones required for the binaural effect',
    signalType: 'binaural',
    leftHz: 95,
    rightHz: 99,
    actionLabel: 'Build a Creative Flow voyage'
  },
  delta: {
    id: 'delta',
    frequency: 'Delta',
    hz: '2 Hz',
    state: 'Deep Rest',
    ariaLabel: 'Open Delta 2 Hz — Deep Rest details',
    promise: 'Enter a cold, quiet and deeply slowed atmosphere designed for wind-down rituals and sleep preparation.',
    benefits: ['Supports progressive relaxation', 'Helps reduce stimulation before rest', 'Encourages a deliberate transition into stillness'],
    uses: ['Sleep preparation', 'Evening wind-down', 'Rest', 'Slow breathing', 'Recovery rituals'],
    technical: 'Left 70 Hz · Right 72 Hz · 2 Hz difference',
    guidance: 'Use only when resting safely · Begin at a low volume',
    recommended: '40–60 minutes',
    listeningType: 'Binaural signal · Headphones required for the binaural effect',
    signalType: 'binaural',
    leftHz: 70,
    rightHz: 72,
    actionLabel: 'Build a Deep Rest voyage'
  },
  abundance: {
    id: 'abundance',
    frequency: 'Pure Tone',
    hz: '888 Hz',
    state: 'Abundance',
    ariaLabel: 'Open Pure Tone 888 Hz — Abundance details',
    promise: 'Enter a warm ceremonial space for intention, visualization, gratitude and focused manifestation rituals.',
    benefits: ['Supports deliberate visualization', 'Creates a symbolic focus point', 'Pairs intention with a repeatable ritual'],
    uses: ['Manifestation', 'Affirmations', 'Gratitude', 'Journaling', 'Ceremonial meditation'],
    technical: 'Pure 888 Hz tone · Clean uninterrupted signal',
    guidance: 'Start at a very low volume · Speakers or headphones',
    recommended: '15–40 minutes',
    listeningType: 'Pure tone · Speakers or headphones',
    signalType: 'pure-tone',
    leftHz: 888,
    rightHz: 888,
    actionLabel: 'Build an Abundance voyage'
  }
} satisfies Record<FrequencyId, FrequencyDefinition>;

export function isFrequencyId(value: string | null | undefined): value is FrequencyId {
  return Boolean(value && frequencyIds.includes(value as FrequencyId));
}

export function getFrequencyIdFromElement(element: Element | null): FrequencyId | null {
  if (!element) return null;
  return frequencyIds.find((id) => element.classList.contains(id)) ?? null;
}
