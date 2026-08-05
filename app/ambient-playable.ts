import type { AmbientId } from './ambient-catalog';

export const playableAmbientIds = [
  'white-noise',
  'brown-noise',
  'pink-noise',
  'rain',
  'ocean',
  'birds',
  'nature',
  'storm'
] as const satisfies readonly AmbientId[];

export type PlayableAmbientId = (typeof playableAmbientIds)[number];
export type PlayableAmbientCategory = 'Noise' | 'Water' | 'Nature' | 'Weather';

export const playableAmbientCategories: ReadonlyArray<{
  label: PlayableAmbientCategory;
  ids: readonly PlayableAmbientId[];
}> = [
  { label: 'Noise', ids: ['white-noise', 'brown-noise', 'pink-noise'] },
  { label: 'Water', ids: ['rain', 'ocean'] },
  { label: 'Nature', ids: ['birds', 'nature'] },
  { label: 'Weather', ids: ['storm'] }
];

export const ambientSymbols: Record<PlayableAmbientId, string> = {
  'white-noise': '◌',
  'brown-noise': '≈',
  'pink-noise': '∿',
  rain: '╱',
  ocean: '≋',
  birds: '⌁',
  nature: '◇',
  storm: 'ϟ'
};

export const ambientShortDescriptions: Record<PlayableAmbientId, string> = {
  'white-noise': 'Bright, even masking.',
  'brown-noise': 'Deep, soft masking.',
  'pink-noise': 'Balanced, natural texture.',
  rain: 'Real steady rainfall recording.',
  ocean: 'Real shoreline water movement.',
  birds: 'Real outdoor birdsong recording.',
  nature: 'Real stereo woodland ambience.',
  storm: 'Real rain and thunder recording.'
};

export function isPlayableAmbientId(id: AmbientId): id is PlayableAmbientId {
  return playableAmbientIds.includes(id as PlayableAmbientId);
}
