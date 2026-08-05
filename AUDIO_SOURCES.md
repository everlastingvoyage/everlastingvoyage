# Everlasting Voyage — Atmosphere Audio Sources

The mathematical White, Brown and Pink Noise layers are generated locally by the application.

The natural atmosphere layers below use real field recordings released into the public domain or under CC0. Production playback uses same-origin `/audio/field/*` routes configured in `vercel.json`, with a secondary source where available.

## Soft Rain

- Customer name: `Soft Rain`
- File: `Rain (1).ogg`
- Creator: Ezwa / PDSounds
- Recording: 45 seconds of natural heavy rainfall
- License: Public domain
- Source page: https://commons.wikimedia.org/wiki/File:Rain_(1).ogg
- Original: https://upload.wikimedia.org/wikipedia/commons/0/0e/Rain_%281%29.ogg
- Date added: 2026-08-05
- Processing: Streamed through a same-origin route; no destructive noise reduction

## Calm Shoreline

- Customer name: `Calm Shoreline`
- Internal compatibility ID: `ocean`
- File: `Waves.ogg`
- Creator: Dsw4
- Recording: 4 minutes 47 seconds of real shoreline water recorded with a shotgun microphone on the shores of Lake Ontario
- License: Public domain
- Source page: https://commons.wikimedia.org/wiki/File:Waves.ogg
- Original: https://upload.wikimedia.org/wikipedia/commons/1/1f/Waves.ogg
- MP3 transcode: https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1f/Waves.ogg/Waves.ogg.mp3
- App routes: `/audio/field/ocean-v2.mp3` and `/audio/field/ocean-v2.ogg`
- Date added: 2026-08-05
- Processing: Streamed through versioned same-origin routes to avoid stale Safari cache and unreliable third-party hotlinking

## Morning Birds

- Customer name: `Morning Birds`
- Internal compatibility ID: `birds`
- File: `Birdsong mild sunny day.ogg`
- Creator: Stephan / PDSounds
- Recording: 37 seconds of natural woodland birdsong recorded on a mild April morning in Germany
- License: Public domain
- Source page: https://commons.wikimedia.org/wiki/File:Birdsong_mild_sunny_day.ogg
- Original: https://upload.wikimedia.org/wikipedia/commons/7/75/Birdsong_mild_sunny_day.ogg
- MP3 transcode: https://upload.wikimedia.org/wikipedia/commons/transcoded/7/75/Birdsong_mild_sunny_day.ogg/Birdsong_mild_sunny_day.ogg.mp3
- App routes: `/audio/field/birds-v2.mp3` and `/audio/field/birds-v2.ogg`
- Date added: 2026-08-05
- Processing: Replaces Coastal Seagulls while preserving the `birds` ID for Saved Spaces compatibility

## Open Nature

- Customer name: `Open Nature`
- File: `20090610 0 ambience.ogg`
- Creator: Nille / PDSounds
- Recording: 2 minutes 3 seconds of stereo woodland ambience with birds, insects, trees and wind
- License: Public domain
- Source page: https://commons.wikimedia.org/wiki/File:20090610_0_ambience.ogg
- Original: https://upload.wikimedia.org/wikipedia/commons/0/0a/20090610_0_ambience.ogg
- Date added: 2026-08-05
- Processing: Streamed through a same-origin route; no destructive noise reduction

## Distant Storm

- Customer name: `Distant Storm`
- File: `Storm thunderbolts.ogg`
- Creator: Stephan / PDSounds
- Recording: 5 minutes 3 seconds of a real storm with rain and thunder
- License: Public domain
- Source page: https://commons.wikimedia.org/wiki/File:Storm_thunderbolts.ogg
- Original: https://upload.wikimedia.org/wikipedia/commons/b/bd/Storm_thunderbolts.ogg
- Date added: 2026-08-05
- Processing: Streamed through a same-origin route; no synthetic thunder added

## Product rules

- Do not replace these routes with unverified downloads.
- Preserve this source record whenever an audio asset changes.
- Confirm commercial-use rights before adding any new sound.
- Prefer long natural recordings over short recognizable loops.
- Keep White, Brown and Pink Noise procedural and environmental layers recorded.
- Listen to each candidate from beginning to end on a physical device before final product sign-off.
