import type { PlayableAmbientId } from './ambient-playable';

// Perceived-loudness trims. User-facing percentages remain unchanged.
// Values intentionally preserve headroom when several layers are combined.
export const ambientGainCompensation: Record<PlayableAmbientId, number> = {
  'white-noise': 0.55,
  'brown-noise': 0.65,
  'pink-noise': 0.58,
  rain: 1.08,
  ocean: 0.9,
  birds: 0.84,
  nature: 0.88,
  storm: 0.82
};

export function getAmbientGainCompensation(id: PlayableAmbientId): number {
  return ambientGainCompensation[id] ?? 1;
}
