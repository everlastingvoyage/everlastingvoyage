from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def replace_block(text: str, start: str, end: str, replacement: str, label: str) -> str:
    start_index = text.find(start)
    if start_index < 0:
        raise SystemExit(f"{label}: start marker not found")
    end_index = text.find(end, start_index)
    if end_index < 0:
        raise SystemExit(f"{label}: end marker not found")
    return text[:start_index] + replacement + text[end_index:]


# -----------------------------------------------------------------------------
# Premium audio recipes: four distinct personalities, shared preview/full engine.
# -----------------------------------------------------------------------------
audio_path = Path('app/premium-audio-engine.ts')
audio = audio_path.read_text()

audio = replace_block(
    audio,
    "  'alpha-12': {",
    "  'smr-14': {",
    """  'alpha-12': {
    id: 'alpha-12', category: 'study', title: 'Memory Retention', soundIdentity: 'Luminous learning atmosphere',
    recommendedUse: 'A luminous study environment for focused review and information retention.',
    core: { type: 'binaural', targetDifferenceHz: 12, leftCarrierHz: 256, rightCarrierHz: 268, waveform: 'sine', gain: 0.5 },
    stems: [
      { id: 'memory-luminous-pad', role: 'pad', gain: 0.15, rootHz: 196, waveform: 'sine', intervals: [0, 4, 7, 11], detuneCents: [-8, 0, 6], cutoffHz: 3300, movementHz: 0.022 },
      { id: 'memory-glass-halo', role: 'glass', gain: 0.066, rootHz: 392, waveform: 'sine', intervals: [0, 7, 12, 16], detuneCents: [-5, 5], cutoffHz: 5200, movementHz: 0.07 },
      { id: 'memory-study-air', role: 'sample', gain: 0.038, assetPath: '/audio/ambience/cafe-quiet-loop.m4a', startOffsetSeconds: 11 }
    ],
    events: [
      { id: 'memory-motif', role: 'motif', minIntervalSeconds: 15, maxIntervalSeconds: 30, probability: 0.78, gainMin: 0.024, gainMax: 0.038, panMin: -0.28, panMax: 0.28, frequenciesHz: [784, 988, 1176, 988], durationSeconds: 4.2 },
      { id: 'memory-crystal', role: 'crystal', minIntervalSeconds: 22, maxIntervalSeconds: 42, probability: 0.56, gainMin: 0.018, gainMax: 0.03, panMin: -0.5, panMax: 0.5, frequenciesHz: [1568, 1976, 2352], durationSeconds: 2.4 }
    ],
    processing: { highpassHz: 40, lowpassHz: 6200, compressorThreshold: -23, compressorRatio: 3.1, stereoWidth: 0.76 },
    preview: { representativeEventAtSeconds: 3.6, fadeInSeconds: 0.38 }
  },
""",
    'alpha-12 recipe'
)

audio = replace_block(
    audio,
    "  'beta-18': {",
    "  'beta-15': {",
    """  'beta-18': {
    id: 'beta-18', category: 'study', title: 'Focused Drive', soundIdentity: 'Momentum focus environment',
    recommendedUse: 'A forward-moving focus environment for productive work and active study.',
    core: { type: 'binaural', targetDifferenceHz: 18, leftCarrierHz: 186, rightCarrierHz: 204, waveform: 'sine', gain: 0.53 },
    stems: [
      { id: 'drive-warm-tech-pad', role: 'pad', gain: 0.115, rootHz: 93, waveform: 'triangle', intervals: [0, 2, 7, 12], detuneCents: [-6, 5], cutoffHz: 2100, movementHz: 0.038 },
      { id: 'drive-forward-pulse', role: 'pulse', gain: 0.052, rootHz: 186, waveform: 'triangle', pulseHz: 0.72, pulseDepth: 0.58, cutoffHz: 2300 },
      { id: 'drive-air', role: 'noise', gain: 0.022, noiseColor: 'pink', cutoffHz: 1700, movementHz: 0.045 }
    ],
    events: [
      { id: 'drive-motif', role: 'motif', minIntervalSeconds: 14, maxIntervalSeconds: 27, probability: 0.7, gainMin: 0.02, gainMax: 0.032, panMin: -0.3, panMax: 0.3, frequenciesHz: [372, 465, 558, 465], durationSeconds: 3.2 },
      { id: 'drive-swell', role: 'swell', minIntervalSeconds: 20, maxIntervalSeconds: 38, probability: 0.5, gainMin: 0.014, gainMax: 0.024, panMin: -0.24, panMax: 0.24, frequenciesHz: [186, 279, 372], durationSeconds: 4.6 }
    ],
    processing: { highpassHz: 32, lowpassHz: 5000, compressorThreshold: -23, compressorRatio: 3.4, stereoWidth: 0.58 },
    preview: { representativeEventAtSeconds: 5.2, fadeInSeconds: 0.36 }
  },
""",
    'beta-18 recipe'
)

audio = replace_block(
    audio,
    "  'beta-20': {",
    "  'gamma-30': {",
    """  'beta-20': {
    id: 'beta-20', category: 'work', title: 'Peak Attention', soundIdentity: 'Futuristic attention space',
    recommendedUse: 'A bright futuristic focus environment built for high-attention sessions.',
    core: { type: 'binaural', targetDifferenceHz: 20, leftCarrierHz: 300, rightCarrierHz: 320, waveform: 'sine', gain: 0.48 },
    stems: [
      { id: 'peak-attention-pad', role: 'pad', gain: 0.16, rootHz: 75, waveform: 'triangle', intervals: [0, 7, 11, 14], detuneCents: [-10, -2, 7], cutoffHz: 3000, movementHz: 0.06 },
      { id: 'peak-attention-glass', role: 'glass', gain: 0.07, rootHz: 600, waveform: 'sine', intervals: [0, 5, 12, 19], detuneCents: [-6, 6], cutoffHz: 6200, movementHz: 0.095 },
      { id: 'peak-attention-pulse', role: 'pulse', gain: 0.055, rootHz: 225, waveform: 'sine', pulseHz: 0.52, pulseDepth: 0.7, cutoffHz: 3200 },
      { id: 'peak-attention-air', role: 'noise', gain: 0.018, noiseColor: 'white', cutoffHz: 2400, movementHz: 0.052 }
    ],
    events: [
      { id: 'peak-crystal', role: 'crystal', minIntervalSeconds: 12, maxIntervalSeconds: 25, probability: 0.76, gainMin: 0.026, gainMax: 0.042, panMin: -0.68, panMax: 0.68, frequenciesHz: [1200, 1500, 1800], durationSeconds: 2.1 },
      { id: 'peak-sequence', role: 'motif', minIntervalSeconds: 18, maxIntervalSeconds: 34, probability: 0.64, gainMin: 0.018, gainMax: 0.03, panMin: -0.42, panMax: 0.42, frequenciesHz: [450, 600, 750, 900], durationSeconds: 3.6 }
    ],
    processing: { highpassHz: 38, lowpassHz: 6500, compressorThreshold: -22, compressorRatio: 3.6, stereoWidth: 0.9 },
    preview: { representativeEventAtSeconds: 3.9, fadeInSeconds: 0.32 }
  },
""",
    'beta-20 recipe'
)

audio = replace_block(
    audio,
    "  'gamma-35': {",
    "  'theta-5': {",
    """  'gamma-35': {
    id: 'gamma-35', category: 'work', title: 'Peak Focus', soundIdentity: 'Elevated Gamma atmosphere',
    recommendedUse: 'A polished Gamma experience for clear, sustained high-performance focus.',
    core: { type: 'binaural', targetDifferenceHz: 35, leftCarrierHz: 280, rightCarrierHz: 315, waveform: 'sine', gain: 0.49 },
    stems: [
      { id: 'peak-focus-pad', role: 'pad', gain: 0.125, rootHz: 140, waveform: 'sine', intervals: [0, 4, 7, 14], detuneCents: [-5, 4], cutoffHz: 3600, movementHz: 0.028 },
      { id: 'peak-focus-drone', role: 'drone', gain: 0.052, rootHz: 70, waveform: 'sine', intervals: [0, 12, 19], detuneCents: [-3, 3], cutoffHz: 1500, movementHz: 0.016 },
      { id: 'peak-focus-glass', role: 'glass', gain: 0.042, rootHz: 420, waveform: 'sine', intervals: [0, 7, 12], detuneCents: [-4, 5], cutoffHz: 5200, movementHz: 0.05 },
      { id: 'peak-focus-pulse', role: 'pulse', gain: 0.026, rootHz: 210, waveform: 'triangle', pulseHz: 0.28, pulseDepth: 0.42, cutoffHz: 2600 }
    ],
    events: [{ id: 'peak-focus-swell', role: 'swell', minIntervalSeconds: 17, maxIntervalSeconds: 34, probability: 0.64, gainMin: 0.018, gainMax: 0.03, panMin: -0.3, panMax: 0.3, frequenciesHz: [420, 560, 700], durationSeconds: 4.8 }],
    processing: { highpassHz: 28, lowpassHz: 5600, compressorThreshold: -23, compressorRatio: 3.4, stereoWidth: 0.72 },
    preview: { representativeEventAtSeconds: 5.8, fadeInSeconds: 0.4 }
  },
""",
    'gamma-35 recipe'
)

audio_path.write_text(audio)


# -----------------------------------------------------------------------------
# Product flow: names, hierarchy, Pure Tone / Immersive identity, gold Premium UI.
# -----------------------------------------------------------------------------
product_path = Path('app/V10ProductFlow.tsx')
product = product_path.read_text()

product = replace_once(product,
"  { id: 'alpha-12', category: 'study', family: 'Alpha', hz: 12, label: 'Active Learning', purpose: 'A brighter Alpha experience for active learning and review.', description: 'Clean binaural signal designed to remain simple and precise.', premium: true, pure: false, soundProfile: 'clean', leftHz: 180, rightHz: 192 },",
"  { id: 'alpha-12', category: 'study', family: 'Alpha', hz: 12, label: 'Memory Retention', purpose: 'A luminous study environment for focused review and information retention.', description: 'Luminous pad, glass harmonics and restrained melodic detail around a precise 12 Hz foundation.', premium: true, pure: false, soundProfile: 'focus', leftHz: 256, rightHz: 268 },",
'product alpha-12 metadata')

product = replace_once(product,
"  { id: 'beta-18', category: 'study', family: 'Beta', hz: 18, label: 'Mental Drive', purpose: 'A more active focus experience for demanding study blocks.', description: 'Binaural focus signal with a restrained modern texture.', premium: true, pure: false, soundProfile: 'focus', leftHz: 180, rightHz: 198 },",
"  { id: 'beta-18', category: 'study', family: 'Beta', hz: 18, label: 'Focused Drive', purpose: 'A forward-moving focus environment for productive work and active study.', description: 'Warm technological pad, restrained pulse and positive forward movement around an 18 Hz foundation.', premium: true, pure: false, soundProfile: 'focus', leftHz: 186, rightHz: 204 },",
'product beta-18 metadata')

product = replace_once(product,
"  { id: 'beta-20', category: 'work', family: 'Beta', hz: 20, label: 'High Attention', purpose: 'An active focus signal with a subtle futuristic pulse.', description: 'Binaural signal supported by a quiet digital pulse and spacious texture.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 200, rightHz: 220 },",
"  { id: 'beta-20', category: 'work', family: 'Beta', hz: 20, label: 'Peak Attention', purpose: 'A bright futuristic focus environment built for high-attention sessions.', description: 'Wide futuristic pad, crystalline accents and spatial motion around a precise 20 Hz foundation.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 300, rightHz: 320 },",
'product beta-20 metadata')

product = replace_once(product,
"  { id: 'gamma-35', category: 'work', family: 'Gamma', hz: 35, label: 'Deep Execution', purpose: 'A deeper sci-fi productivity atmosphere for concentrated execution.', description: 'Binaural signal with a subtle technological soundscape kept beneath the core tone.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 200, rightHz: 235 },",
"  { id: 'gamma-35', category: 'work', family: 'Gamma', hz: 35, label: 'Peak Focus', purpose: 'A polished Gamma experience for clear, sustained high-performance focus.', description: 'Luminous Gamma atmosphere with a clean pad, supportive drone and restrained tonal movement.', premium: true, pure: false, soundProfile: 'futuristic', leftHz: 280, rightHz: 315 },",
'product gamma-35 metadata')

product = replace_once(product,
"function customerFrequencyCopy(value: string) {\n  return value.replace(/\\bsignals\\b/gi, 'frequencies').replace(/\\bsignal\\b/gi, 'frequency');\n}\n\nfunction createNoiseBuffer",
"function customerFrequencyCopy(value: string) {\n  return value.replace(/\\bsignals\\b/gi, 'frequencies').replace(/\\bsignal\\b/gi, 'frequency');\n}\n\nfunction getCustomerAudioType(signal: PremiumSignal) {\n  if (signal.pure) return 'Pure Tone';\n  if (getPremiumAudioRecipe(signal.id)) return 'Immersive Frequency';\n  return 'Clean Frequency';\n}\n\nfunction createNoiseBuffer",
'audio type helper')

old_card = """                  <button key={signal.id} type=\"button\" className={`evPremiumSignalCard ${signal.premium ? 'premium' : 'free'} ${signal.soundProfile} ${unlocked ? 'unlocked' : ''}`} onClick={() => openSignal(signal)}>
                    <span className=\"evSignalCardTopline\"><span>{signal.premium ? (unlocked ? 'Premium active' : 'Premium') : 'Free flagship'}</span><i aria-hidden=\"true\">{signal.premium ? (unlocked ? '✓' : '◇') : '✓'}</i></span>
                    <strong>{signal.family}</strong><b>{signal.hz} Hz</b><span className=\"evSignalPurpose\">{signal.label}</span><small>{customerFrequencyCopy(signal.purpose)}</small><span className=\"evSignalAction\">{signal.premium ? (unlocked ? 'Use this frequency →' : 'Preview frequency →') : 'Use free frequency →'}</span>
                  </button>"""
new_card = """                  <button key={signal.id} type=\"button\" className={`evPremiumSignalCard ${signal.premium ? 'premium' : 'free'} ${signal.soundProfile} ${unlocked ? 'unlocked' : ''}`} onClick={() => openSignal(signal)}>
                    <span className=\"evSignalCardTopline\"><span>{signal.premium ? (unlocked ? 'Premium active' : 'Premium') : 'Free flagship'}</span><i aria-hidden=\"true\">{signal.premium ? (unlocked ? '✓' : '◇') : '✓'}</i></span>
                    <span className=\"evSignalExperienceTitle\">{signal.label}</span>
                    <b>{signal.hz} Hz</b>
                    {!signal.pure ? <strong>{signal.family}</strong> : null}
                    <span className=\"evSignalType\">{getCustomerAudioType(signal)}</span>
                    <small>{customerFrequencyCopy(signal.purpose)}</small>
                    <span className=\"evSignalAction\">{signal.premium ? (unlocked ? 'Use this frequency →' : 'Preview frequency →') : 'Use free frequency →'}</span>
                  </button>"""
product = replace_once(product, old_card, new_card, 'frequency card hierarchy')

old_modal = """            <h2 id=\"ev-preview-title\">{previewSignal.family} <strong>{previewSignal.hz} Hz</strong></h2><h3>{previewSignal.label}</h3><p>{getPremiumAudioRecipe(previewSignal.id)?.recommendedUse ?? customerFrequencyCopy(previewSignal.description)}</p>
            <div className=\"evPremiumSoundProfile\"><span>Sound profile</span><strong>{getPremiumSoundIdentity(previewSignal.id) ?? (previewSignal.soundProfile === 'ritual' ? 'Ritual soundscape' : previewSignal.soundProfile === 'futuristic' ? 'Futuristic focus' : previewSignal.soundProfile === 'sleep' ? 'Sleep ambience' : previewSignal.soundProfile === 'meditative' ? 'Meditative ambience' : previewSignal.soundProfile === 'focus' ? 'Minimal focus bed' : 'Clean frequency')}</strong></div>"""
new_modal = """            <h2 id=\"ev-preview-title\">{previewSignal.label}</h2>
            <div className=\"evPremiumModalFrequency\"><strong>{previewSignal.hz} Hz</strong>{!previewSignal.pure ? <span>{previewSignal.family}</span> : null}<span className=\"evPremiumTypeBadge\">{getCustomerAudioType(previewSignal)}</span></div>
            <p>{getPremiumAudioRecipe(previewSignal.id)?.recommendedUse ?? customerFrequencyCopy(previewSignal.description)}</p>
            <div className=\"evPremiumSoundProfile\"><span>Sound profile</span><strong>{getPremiumSoundIdentity(previewSignal.id) ?? (previewSignal.soundProfile === 'ritual' ? 'Ritual soundscape' : previewSignal.soundProfile === 'futuristic' ? 'Futuristic focus' : previewSignal.soundProfile === 'sleep' ? 'Sleep ambience' : previewSignal.soundProfile === 'meditative' ? 'Meditative ambience' : previewSignal.soundProfile === 'focus' ? 'Minimal focus bed' : 'Clean frequency')}</strong></div>"""
product = replace_once(product, old_modal, new_modal, 'preview modal hierarchy')

# Premium library card palette + hierarchy. Checkout-specific selectors remain untouched.
product = replace_once(product,
"        .evPremiumSignalCard{position:relative;min-height:250px;padding:19px;overflow:hidden;text-align:left;border-radius:20px;border:1px solid rgba(112,179,235,.11);color:#dff2ff;background:linear-gradient(155deg,rgba(7,24,47,.83),rgba(3,10,23,.95));cursor:pointer;transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}",
"        .evPremiumSignalCard{position:relative;isolation:isolate;min-height:286px;padding:19px;overflow:hidden;text-align:left;border-radius:20px;border:1px solid rgba(112,179,235,.11);color:#dff2ff;background:linear-gradient(155deg,rgba(7,24,47,.83),rgba(3,10,23,.95));cursor:pointer;transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease,background .22s ease}",
'card base css')
product = replace_once(product,
"        .evPremiumSignalCard:hover{transform:translateY(-3px);border-color:rgba(102,198,255,.25);box-shadow:0 20px 42px rgba(0,0,0,.22)}",
"        .evPremiumSignalCard:hover{transform:translateY(-3px);border-color:rgba(102,198,255,.28);box-shadow:0 20px 42px rgba(0,0,0,.24)}\n        .evPremiumSignalCard.premium{border-color:rgba(232,188,99,.44);background:radial-gradient(circle at 88% 4%,rgba(255,207,111,.16),transparent 34%),linear-gradient(155deg,rgba(28,22,26,.96),rgba(8,11,22,.98) 58%,rgba(17,13,22,.98));box-shadow:inset 0 1px 0 rgba(255,238,196,.055),0 16px 44px rgba(111,74,16,.12)}\n        .evPremiumSignalCard.premium:hover{border-color:rgba(255,215,131,.66);box-shadow:inset 0 1px 0 rgba(255,242,210,.08),0 22px 52px rgba(173,118,27,.18),0 0 28px rgba(246,194,93,.08)}",
'card premium css')
product = replace_once(product,
"        .evPremiumSignalCard.premium:after{content:'';position:absolute;width:130px;height:130px;top:-70px;right:-55px;border-radius:50%;background:#6d5cff;filter:blur(55px);opacity:.16}",
"        .evPremiumSignalCard.premium:after{content:'';position:absolute;z-index:0;width:165px;height:165px;top:-82px;right:-62px;border-radius:50%;background:#f3bd59;filter:blur(58px);opacity:.25;pointer-events:none}\n        .evPremiumSignalCard.premium:before{content:'';position:absolute;z-index:0;top:-55%;left:-75%;width:34%;height:220%;transform:rotate(18deg);background:linear-gradient(90deg,transparent,rgba(255,231,174,.12),transparent);pointer-events:none;animation:evPremiumGoldSheen 8.5s ease-in-out infinite}",
'card gold glow css')
product = replace_once(product,
"        .evPremiumSignalCard.unlocked{box-shadow:inset 0 0 28px rgba(202,158,255,.045),0 16px 42px rgba(87,49,170,.11)}",
"        .evPremiumSignalCard.unlocked{border-color:rgba(255,219,144,.62);box-shadow:inset 0 0 34px rgba(255,206,112,.055),0 18px 46px rgba(146,96,18,.15)}",
'unlocked gold css')
product = replace_once(product,
"        .evSignalCardTopline{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;align-items:center;color:rgba(181,216,243,.48);font-size:8px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}",
"        .evSignalCardTopline{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;align-items:center;color:rgba(181,216,243,.58);font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}\n        .evPremiumSignalCard.premium .evSignalCardTopline>span{display:inline-flex;align-items:center;min-height:27px;padding:0 10px;border:1px solid rgba(242,192,94,.42);border-radius:999px;color:#ffe2a5;background:rgba(150,101,29,.1);box-shadow:0 0 22px rgba(235,180,77,.06)}",
'topline css')
product = replace_once(product,
"        .evSignalCardTopline i{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;color:#a7e8ff;border:1px solid rgba(117,207,255,.17);font-style:normal}",
"        .evSignalCardTopline i{display:grid;place-items:center;width:27px;height:27px;border-radius:50%;color:#a7e8ff;border:1px solid rgba(117,207,255,.2);font-style:normal}\n        .evPremiumSignalCard.premium .evSignalCardTopline i{color:#ffd68b;border-color:rgba(240,190,93,.38);background:rgba(161,105,24,.08)}",
'top icon css')
product = replace_once(product,
"        .evPremiumSignalCard>strong{position:relative;z-index:1;display:block;margin-top:22px;color:rgba(214,236,252,.72);font-size:11px;letter-spacing:.08em;text-transform:uppercase}\n        .evPremiumSignalCard>b{position:relative;z-index:1;display:block;margin-top:2px;color:#f4fbff;font-size:clamp(27px,2.3vw,35px);letter-spacing:-.045em}\n        .evSignalPurpose{position:relative;z-index:1;display:block;margin-top:9px;color:#9fdfff;font-size:12px;font-weight:800}\n        .evPremiumSignalCard>small{position:relative;z-index:1;display:block;margin-top:7px;color:rgba(211,230,245,.48);line-height:1.5;font-size:9px}\n        .evSignalAction{position:absolute;z-index:1;left:19px;bottom:18px;color:rgba(184,226,255,.72);font-size:9px;font-weight:800;letter-spacing:.05em}",
"        .evSignalExperienceTitle{position:relative;z-index:1;display:block;margin-top:20px;color:#f5fbff;font-size:clamp(23px,2vw,30px);font-weight:900;line-height:1.03;letter-spacing:-.035em;text-wrap:balance}\n        .evPremiumSignalCard.premium .evSignalExperienceTitle{color:#fff2d2;text-shadow:0 0 22px rgba(244,191,90,.12)}\n        .evPremiumSignalCard>b{position:relative;z-index:1;display:block;margin-top:9px;color:#f4fbff;font-size:clamp(21px,1.8vw,27px);line-height:1;letter-spacing:-.035em}\n        .evPremiumSignalCard>strong{position:relative;z-index:1;display:block;margin-top:7px;color:rgba(204,228,246,.66);font-size:11px;letter-spacing:.1em;text-transform:uppercase}\n        .evSignalType{position:relative;z-index:1;display:inline-flex;align-items:center;min-height:24px;margin-top:9px;padding:0 8px;border:1px solid rgba(110,205,255,.18);border-radius:999px;color:#a9e8ff;background:rgba(56,155,209,.07);font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}\n        .evPremiumSignalCard.premium .evSignalType{border-color:rgba(238,188,91,.35);color:#ffdaa0;background:rgba(145,91,17,.09)}\n        .evPremiumSignalCard>small{position:relative;z-index:1;display:block;margin-top:9px;padding-bottom:38px;color:rgba(211,230,245,.58);line-height:1.5;font-size:10px}\n        .evSignalAction{position:absolute;z-index:1;left:19px;bottom:18px;color:rgba(184,226,255,.78);font-size:9px;font-weight:900;letter-spacing:.05em}\n        .evPremiumSignalCard.premium .evSignalAction{color:#ffd58c}",
'card hierarchy css')

# Gold Preview identity only; checkout uses .evCheckoutModal and remains isolated.
product = replace_once(product,
"        .evPremiumModal{position:relative;width:min(560px,100%);max-height:min(760px,calc(100dvh - 36px));overflow:auto;padding:clamp(24px,4vw,38px);border-radius:27px;border:1px solid rgba(116,197,255,.2);color:#eef9ff;background:radial-gradient(circle at 80% -10%,rgba(77,94,255,.18),transparent 35%),linear-gradient(150deg,rgba(7,24,48,.99),rgba(3,8,20,.99));box-shadow:0 34px 110px rgba(0,0,0,.56)}",
"        .evPremiumModal{position:relative;width:min(560px,100%);max-height:min(760px,calc(100dvh - 36px));overflow:auto;padding:clamp(24px,4vw,38px);border-radius:27px;border:1px solid rgba(237,193,106,.42);color:#eef9ff;background:radial-gradient(circle at 82% -8%,rgba(245,190,82,.2),transparent 37%),radial-gradient(circle at 4% 18%,rgba(70,186,255,.07),transparent 30%),linear-gradient(150deg,rgba(13,18,33,.995),rgba(5,8,18,.995));box-shadow:0 34px 110px rgba(0,0,0,.58),0 0 42px rgba(194,133,28,.08)}",
'modal base gold css')
product = replace_once(product,
"        .evPremiumModal.ritual{background:radial-gradient(circle at 80% -10%,rgba(150,93,255,.22),transparent 38%),linear-gradient(150deg,rgba(17,16,47,.99),rgba(4,7,19,.99))}",
"        .evPremiumModal.ritual{background:radial-gradient(circle at 82% -8%,rgba(248,191,76,.23),transparent 38%),radial-gradient(circle at 12% 20%,rgba(139,93,43,.08),transparent 34%),linear-gradient(150deg,rgba(21,17,26,.995),rgba(5,7,16,.995))}",
'ritual visual gold css')
product = replace_once(product,
"        .evPremiumModal.futuristic{background:radial-gradient(circle at 80% -10%,rgba(24,194,255,.2),transparent 38%),linear-gradient(150deg,rgba(5,28,48,.99),rgba(3,8,20,.99))}",
"        .evPremiumModal.futuristic{background:radial-gradient(circle at 82% -8%,rgba(245,190,82,.2),transparent 37%),radial-gradient(circle at 10% 26%,rgba(32,188,255,.12),transparent 34%),linear-gradient(150deg,rgba(8,24,37,.995),rgba(4,8,18,.995))}",
'futuristic visual gold css')
product = replace_once(product,
"        .evPremiumModalMeta span{padding:7px 9px;border-radius:999px;border:1px solid rgba(130,201,255,.14);color:rgba(189,226,251,.62);background:rgba(255,255,255,.025);font-size:8px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}",
"        .evPremiumModalMeta span{padding:8px 10px;border-radius:999px;border:1px solid rgba(236,190,98,.28);color:#ffe0a5;background:rgba(144,92,21,.08);font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}",
'modal meta gold css')
product = replace_once(product,
"        .evPremiumModal h2{margin:27px 0 0;font-size:clamp(36px,7vw,60px);line-height:.95;letter-spacing:-.05em}\n        .evPremiumModal h2 strong{color:#94e4ff;font-weight:inherit}\n        .evPremiumModal h3{margin:12px 0 0;color:#cbefff;font-size:16px}",
"        .evPremiumModal h2{margin:28px 0 0;color:#fff7e7;font-size:clamp(48px,8vw,68px);line-height:.94;letter-spacing:-.055em;text-wrap:balance;text-shadow:0 0 28px rgba(239,184,76,.08)}\n        .evPremiumModalFrequency{display:flex;align-items:center;flex-wrap:wrap;gap:9px 12px;margin-top:16px}\n        .evPremiumModalFrequency>strong{color:#ffd77e;font-size:clamp(29px,5vw,38px);line-height:1;letter-spacing:-.04em}\n        .evPremiumModalFrequency>span:not(.evPremiumTypeBadge){color:rgba(219,231,244,.7);font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}\n        .evPremiumTypeBadge{display:inline-flex;align-items:center;min-height:27px;padding:0 10px;border:1px solid rgba(237,189,93,.38);border-radius:999px;color:#ffe0a5;background:rgba(145,93,24,.1);font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}",
'modal title hierarchy css')
product = replace_once(product,
"        .evPremiumSoundProfile{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:22px;padding:14px 15px;border-radius:14px;border:1px solid rgba(115,190,246,.1);background:rgba(255,255,255,.022)}",
"        .evPremiumSoundProfile{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:22px;padding:14px 15px;border-radius:14px;border:1px solid rgba(233,187,94,.18);background:linear-gradient(135deg,rgba(137,87,20,.06),rgba(255,255,255,.018))}",
'modal sound profile css')
product = replace_once(product,
"        .evPremiumSoundProfile strong{color:#cdefff;font-size:11px}",
"        .evPremiumSoundProfile strong{color:#ffe0aa;font-size:11px}",
'modal profile text css')
product = replace_once(product,
"        .evPremiumPreviewControls{margin-top:12px;padding:16px;border-radius:15px;border:1px solid rgba(104,194,255,.12);background:rgba(14,48,78,.14)}",
"        .evPremiumPreviewControls{margin-top:12px;padding:16px;border-radius:15px;border:1px solid rgba(231,185,92,.18);background:linear-gradient(135deg,rgba(119,77,22,.07),rgba(20,44,65,.1))}",
'modal preview container css')
product = replace_once(product,
"        @keyframes evFounderSheen{0%,65%{left:-34%;opacity:0}70%{opacity:.2}82%{opacity:.52}95%,100%{left:124%;opacity:0}}",
"        @keyframes evFounderSheen{0%,65%{left:-34%;opacity:0}70%{opacity:.2}82%{opacity:.52}95%,100%{left:124%;opacity:0}}\n        @keyframes evPremiumGoldSheen{0%,68%{left:-75%;opacity:0}73%{opacity:.24}84%{opacity:.5}96%,100%{left:135%;opacity:0}}",
'gold sheen keyframe')
product = replace_once(product,
"        .evPremiumSignalCard{min-height:225px;padding:16px 14px;border-radius:17px}\n        .evPremiumSignalCard>b{font-size:27px}\n        .evSignalAction{left:14px;bottom:15px;font-size:8px}",
"        .evPremiumSignalCard{min-height:270px;padding:16px 14px;border-radius:17px}\n        .evSignalExperienceTitle{margin-top:18px;font-size:clamp(22px,6.1vw,26px)}\n        .evPremiumSignalCard>b{font-size:22px}\n        .evPremiumSignalCard>strong{font-size:10px}\n        .evSignalType{font-size:7.5px}\n        .evPremiumSignalCard>small{font-size:9.5px;padding-bottom:36px}\n        .evSignalAction{left:14px;bottom:15px;font-size:8px}",
'mobile card hierarchy css')
product = replace_once(product,
"        .evPremiumModal h2{font-size:42px}",
"        .evPremiumModal h2{font-size:46px}\n        .evPremiumModalFrequency>strong{font-size:30px}",
'mobile modal title css')
product = replace_once(product,
"        @media(prefers-reduced-motion:reduce){.evCheckoutBenefitCard{transition:none}.evPayButton:not(:disabled):after{animation:none;display:none}}",
"        @media(prefers-reduced-motion:reduce){.evCheckoutBenefitCard{transition:none}.evPayButton:not(:disabled):after,.evPremiumSignalCard.premium:before{animation:none;display:none}}",
'reduced motion gold css')

product_path.write_text(product)


# -----------------------------------------------------------------------------
# Full Voyage metadata: keep customer-facing names/purpose in parity with recipes.
# -----------------------------------------------------------------------------
voyage_path = Path('app/V10VoyageEngine.tsx')
voyage = voyage_path.read_text()

voyage = replace_block(voyage,
"  'alpha-12': {",
"  'smr-14': {",
"""  'alpha-12': {
    id: 'alpha-12', themeId: 'alpha', frequency: 'Alpha', hz: '12 Hz', state: 'Memory Retention',
    purpose: 'A luminous study environment for focused review and information retention.',
    technical: 'Left 256 Hz · Right 268 Hz · 12 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'focus', leftHz: 256, rightHz: 268
  },
""", 'voyage alpha-12 metadata')

voyage = replace_block(voyage,
"  'beta-18': {",
"  'beta-15': {",
"""  'beta-18': {
    id: 'beta-18', themeId: 'alpha', frequency: 'Beta', hz: '18 Hz', state: 'Focused Drive',
    purpose: 'A forward-moving focus environment for productive work and active study.',
    technical: 'Left 186 Hz · Right 204 Hz · 18 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'focus', leftHz: 186, rightHz: 204
  },
""", 'voyage beta-18 metadata')

voyage = replace_block(voyage,
"  'beta-20': {",
"  'gamma-30': {",
"""  'beta-20': {
    id: 'beta-20', themeId: 'gamma', frequency: 'Beta', hz: '20 Hz', state: 'Peak Attention',
    purpose: 'A bright futuristic focus environment built for high-attention sessions.',
    technical: 'Left 300 Hz · Right 320 Hz · 20 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'futuristic', leftHz: 300, rightHz: 320
  },
""", 'voyage beta-20 metadata')

voyage = replace_block(voyage,
"  'gamma-35': {",
"  'theta-5': {",
"""  'gamma-35': {
    id: 'gamma-35', themeId: 'gamma', frequency: 'Gamma', hz: '35 Hz', state: 'Peak Focus',
    purpose: 'A polished Gamma experience for clear, sustained high-performance focus.',
    technical: 'Left 280 Hz · Right 315 Hz · 35 Hz difference', note: 'Headphones recommended · Premium',
    premium: true, soundProfile: 'futuristic', leftHz: 280, rightHz: 315
  },
""", 'voyage gamma-35 metadata')

voyage_path.write_text(voyage)


# -----------------------------------------------------------------------------
# Static acceptance assertions before the real Next build runs.
# -----------------------------------------------------------------------------
audio_final = audio_path.read_text()
product_final = product_path.read_text()
voyage_final = voyage_path.read_text()
combined = audio_final + product_final + voyage_final

for old_name in ('Active Learning', 'Mental Drive', 'High Attention', 'Deep Execution'):
    if old_name in combined:
        raise SystemExit(f'Old customer-facing name still present: {old_name}')
for new_name in ('Memory Retention', 'Focused Drive', 'Peak Attention', 'Peak Focus'):
    if new_name not in audio_final or new_name not in product_final or new_name not in voyage_final:
        raise SystemExit(f'New identity missing from canonical surfaces: {new_name}')
for required in ('Immersive Frequency', 'Pure Tone', 'evPremiumGoldSheen'):
    if required not in product_final:
        raise SystemExit(f'Missing required UI identity: {required}')

# Hero recipes must contain multiple clearly audible designed layers.
for recipe_id, minimum_gain in (('alpha-12', 0.14), ('beta-20', 0.15)):
    start = audio_final.index(f"  '{recipe_id}': {{")
    end = audio_final.find("\n  '", start + 4)
    block = audio_final[start:end if end > 0 else len(audio_final)]
    if block.count("role: '") < 5:  # 3+ stems plus 2+ event roles
        raise SystemExit(f'{recipe_id} does not contain enough distinct sonic layers')
    if f'gain: {minimum_gain}' not in block:
        raise SystemExit(f'{recipe_id} hero atmosphere gain target is missing')

# Ritual audio implementation remains on the legacy path: no Ritual recipe enters premium-audio-engine.
for ritual_id in ('pure-222', 'pure-444', 'pure-528', 'pure-963', 'abundance'):
    if f"'{ritual_id}': {{" in audio_final:
        raise SystemExit(f'Ritual audio was incorrectly migrated into the new engine: {ritual_id}')

print('V12.5.1 static identity checks passed.')
