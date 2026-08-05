export const ambientIds = [
  'rain',
  'ocean',
  'birds',
  'nature',
  'storm',
  'wind',
  'fire',
  'forest',
  'cafe',
  'airplane',
  'clock',
  'white-noise',
  'brown-noise',
  'pink-noise',
  'cabin-hum',
  'night'
] as const;

export type AmbientId = (typeof ambientIds)[number];
export type AmbientCategory = 'water' | 'nature' | 'weather' | 'place' | 'texture' | 'ritual';
export type AmbientSourceType = 'sample' | 'procedural-noise';
export type AmbientAccess = 'free' | 'premium';
export type NoiseColor = 'white' | 'brown' | 'pink';

export type AmbientDefinition = {
  id: AmbientId;
  name: string;
  shortName: string;
  description: string;
  category: AmbientCategory;
  sourceType: AmbientSourceType;
  access: AmbientAccess;
  defaultVolume: number;
  assetPath?: string;
  fallbackAssetPath?: string;
  sourcePage?: string;
  sourceCredit?: string;
  license?: 'public-domain' | 'cc0';
  noiseColor?: NoiseColor;
  icon: string;
  tags: readonly string[];
};

export const ambientCatalog = {
  rain: {
    id: 'rain',
    name: 'Soft Rain',
    shortName: 'Rain',
    description: 'A real field recording of steady rainfall with natural texture and variation.',
    category: 'water',
    sourceType: 'sample',
    access: 'free',
    defaultVolume: 0.28,
    assetPath: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/0/0e/Rain_%281%29.ogg/Rain_%281%29.ogg.mp3',
    fallbackAssetPath: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Rain_%281%29.ogg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Rain_(1).ogg',
    sourceCredit: 'Ezwa / PDSounds',
    license: 'public-domain',
    icon: 'rain',
    tags: ['study', 'sleep', 'calm']
  },
  ocean: {
    id: 'ocean',
    name: 'Distant Ocean',
    shortName: 'Ocean',
    description: 'A long real shoreline recording with spacious water movement and natural dynamics.',
    category: 'water',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.24,
    assetPath: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1f/Waves.ogg/Waves.ogg.mp3',
    fallbackAssetPath: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Waves.ogg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Waves.ogg',
    sourceCredit: 'Dsw4',
    license: 'public-domain',
    icon: 'ocean',
    tags: ['rest', 'meditation', 'reset']
  },
  birds: {
    id: 'birds',
    name: 'Morning Birds',
    shortName: 'Birds',
    description: 'An authentic outdoor recording of birds chirping in a garden in Abuja.',
    category: 'nature',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.16,
    assetPath: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/2f/Birds_chirping_in_a_garden.ogg/Birds_chirping_in_a_garden.ogg.mp3',
    fallbackAssetPath: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Birds_chirping_in_a_garden.ogg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Birds_chirping_in_a_garden.ogg',
    sourceCredit: 'Akum20',
    license: 'cc0',
    icon: 'birds',
    tags: ['morning', 'creative', 'nature']
  },
  nature: {
    id: 'nature',
    name: 'Open Nature',
    shortName: 'Nature',
    description: 'A real stereo forest ambience with wind, insects, birds and distant woodland life.',
    category: 'nature',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.2,
    assetPath: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/0/0a/20090610_0_ambience.ogg/20090610_0_ambience.ogg.mp3',
    fallbackAssetPath: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/20090610_0_ambience.ogg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:20090610_0_ambience.ogg',
    sourceCredit: 'Nille / PDSounds',
    license: 'public-domain',
    icon: 'nature',
    tags: ['reset', 'creative', 'calm']
  },
  storm: {
    id: 'storm',
    name: 'Distant Storm',
    shortName: 'Storm',
    description: 'A five-minute real storm recording with rain and naturally spaced thunder.',
    category: 'weather',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.22,
    assetPath: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/b/bd/Storm_thunderbolts.ogg/Storm_thunderbolts.ogg.mp3',
    fallbackAssetPath: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Storm_thunderbolts.ogg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Storm_thunderbolts.ogg',
    sourceCredit: 'Stephan / PDSounds',
    license: 'public-domain',
    icon: 'storm',
    tags: ['sleep', 'deep-work', 'weather']
  },
  wind: {
    id: 'wind',
    name: 'Open Wind',
    shortName: 'Wind',
    description: 'A smooth, low-motion wind texture without harsh gusts.',
    category: 'nature',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.2,
    assetPath: '/audio/ambience/wind-open-loop.m4a',
    icon: 'wind',
    tags: ['clarity', 'focus', 'space']
  },
  fire: {
    id: 'fire',
    name: 'Quiet Fire',
    shortName: 'Fire',
    description: 'A close fireplace texture with softened crackles and a warm body.',
    category: 'ritual',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.26,
    assetPath: '/audio/ambience/fire-quiet-loop.m4a',
    icon: 'fire',
    tags: ['ritual', 'night', 'writing']
  },
  forest: {
    id: 'forest',
    name: 'Deep Forest',
    shortName: 'Forest',
    description: 'A shaded forest floor with distant movement and no dominant wildlife.',
    category: 'nature',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.25,
    assetPath: '/audio/ambience/forest-deep-loop.m4a',
    icon: 'forest',
    tags: ['grounding', 'meditation', 'rest']
  },
  cafe: {
    id: 'cafe',
    name: 'Quiet Café',
    shortName: 'Café',
    description: 'A soft room murmur with subtle cups and no intelligible conversation.',
    category: 'place',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.2,
    assetPath: '/audio/ambience/cafe-quiet-loop.m4a',
    icon: 'cafe',
    tags: ['study', 'work', 'creative']
  },
  airplane: {
    id: 'airplane',
    name: 'Night Flight',
    shortName: 'Airplane',
    description: 'A stable aircraft cabin bed built around a soft low-frequency hum.',
    category: 'place',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.28,
    assetPath: '/audio/ambience/airplane-night-loop.m4a',
    icon: 'airplane',
    tags: ['deep-work', 'travel', 'night']
  },
  clock: {
    id: 'clock',
    name: 'Soft Clock',
    shortName: 'Clock',
    description: 'A restrained mechanical tick for structured focus and ritual timing.',
    category: 'ritual',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.12,
    assetPath: '/audio/ambience/clock-soft-loop.m4a',
    icon: 'clock',
    tags: ['pomodoro', 'focus', 'ritual']
  },
  'white-noise': {
    id: 'white-noise',
    name: 'White Noise',
    shortName: 'White',
    description: 'A bright, even spectrum for masking changing background sound.',
    category: 'texture',
    sourceType: 'procedural-noise',
    access: 'free',
    defaultVolume: 0.14,
    noiseColor: 'white',
    icon: 'white-noise',
    tags: ['masking', 'focus', 'steady']
  },
  'brown-noise': {
    id: 'brown-noise',
    name: 'Brown Noise',
    shortName: 'Brown',
    description: 'A deeper, softer noise floor with reduced high-frequency energy.',
    category: 'texture',
    sourceType: 'procedural-noise',
    access: 'premium',
    defaultVolume: 0.18,
    noiseColor: 'brown',
    icon: 'brown-noise',
    tags: ['deep-focus', 'masking', 'low']
  },
  'pink-noise': {
    id: 'pink-noise',
    name: 'Pink Noise',
    shortName: 'Pink',
    description: 'A balanced noise texture with a natural, less-bright spectral slope.',
    category: 'texture',
    sourceType: 'procedural-noise',
    access: 'premium',
    defaultVolume: 0.16,
    noiseColor: 'pink',
    icon: 'pink-noise',
    tags: ['rest', 'masking', 'balanced']
  },
  'cabin-hum': {
    id: 'cabin-hum',
    name: 'Cabin Hum',
    shortName: 'Cabin',
    description: 'A minimal enclosed-room hum without aircraft detail or movement.',
    category: 'place',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.22,
    assetPath: '/audio/ambience/cabin-hum-loop.m4a',
    icon: 'cabin',
    tags: ['focus', 'minimal', 'night']
  },
  night: {
    id: 'night',
    name: 'Night Ambience',
    shortName: 'Night',
    description: 'A quiet nocturnal bed with distant air and restrained natural detail.',
    category: 'nature',
    sourceType: 'sample',
    access: 'premium',
    defaultVolume: 0.2,
    assetPath: '/audio/ambience/night-ambience-loop.m4a',
    icon: 'night',
    tags: ['sleep', 'reflection', 'calm']
  }
} satisfies Record<AmbientId, AmbientDefinition>;

export function isAmbientId(value: string | null | undefined): value is AmbientId {
  return Boolean(value && ambientIds.includes(value as AmbientId));
}
