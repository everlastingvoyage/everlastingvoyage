import { ambientCatalog } from './ambient-catalog';

// Keep stable public IDs for Saved Spaces while replacing customer-facing
// recordings and labels with verified, versioned production sources.
Object.assign(ambientCatalog.ocean, {
  name: 'Calm Ocean',
  shortName: 'Ocean',
  description: 'Gentle beach waves arriving and retreating along the shore.',
  assetPath: '/audio/field/ocean-beach-v3.mp3',
  fallbackAssetPath: '/audio/field/ocean-beach-v3.ogg',
  sourcePage: 'https://commons.wikimedia.org/wiki/File:Beach_sounds_South_Carolina.ogg',
  sourceCredit: 'Anthropic42 / Wikimedia Commons',
  license: 'public-domain' as const,
  tags: ['beach', 'rest', 'meditation', 'water'] as const
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
