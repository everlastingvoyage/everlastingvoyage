import { ambientCatalog } from './ambient-catalog';

// V11.9 keeps the public IDs stable for Saved Spaces while replacing
// unreliable third-party streams and the Coastal Seagulls presentation.
Object.assign(ambientCatalog.ocean, {
  name: 'Calm Shoreline',
  shortName: 'Ocean',
  description: 'Natural shoreline waves and water movement.',
  assetPath: '/audio/field/ocean-v2.mp3',
  fallbackAssetPath: '/audio/field/ocean-v2.ogg',
  sourcePage: 'https://commons.wikimedia.org/wiki/File:Waves.ogg',
  sourceCredit: 'Dsw4 / Wikimedia Commons',
  license: 'public-domain' as const,
  tags: ['rest', 'meditation', 'water'] as const
});

Object.assign(ambientCatalog.birds, {
  name: 'Morning Birds',
  shortName: 'Birds',
  description: 'Natural woodland birdsong on a mild morning.',
  assetPath: '/audio/field/birds-v2.mp3',
  fallbackAssetPath: '/audio/field/birds-v2.ogg',
  sourcePage: 'https://commons.wikimedia.org/wiki/File:Birdsong_mild_sunny_day.ogg',
  sourceCredit: 'Stephan / PDSounds',
  license: 'public-domain' as const,
  tags: ['birds', 'morning', 'nature'] as const
});
