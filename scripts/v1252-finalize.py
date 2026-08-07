from pathlib import Path

p = Path('app/V10ProductFlow.tsx')
s = p.read_text()
old = "{ id: 'gamma-30', category: 'work', family: 'Gamma', hz: 30, label: 'Reflective Space'"
new = "{ id: 'gamma-30', category: 'work', family: 'Gamma', hz: 30, label: 'Creative Spark'"
if old not in s:
    raise SystemExit('gamma-30 product label target missing')
s = s.replace(old, new, 1)
old = "{ id: 'theta', category: 'meditation', family: 'Theta', hz: 4, label: 'Creative Spark'"
new = "{ id: 'theta', category: 'meditation', family: 'Theta', hz: 4, label: 'Reflective Space'"
if old not in s:
    raise SystemExit('theta product label target missing')
s = s.replace(old, new, 1)
s = s.replace("{ id: 'work', title: 'Deep Work', subtitle: 'Lock in. Create. Execute.'", "{ id: 'work', title: 'Deep Work', subtitle: 'Create. Build. Achieve.'", 1)
s = s.replace("description: 'The free Gamma flagship for demanding focus sessions.'", "description: 'The free Gamma flagship for demanding clarity and high-attention sessions.'", 1)
s = s.replace(".evPremiumLibraryTitle{margin:0 0 12px;color:#f0c66f;font-size:clamp(22px,2.5vw,34px);", ".evPremiumLibraryTitle{margin:0 0 12px;color:#f0c66f;font-size:clamp(28px,3vw,42px);", 1)
s = s.replace(".evPremiumBenefitRow span:nth-child(4){--ev-chip:74,226,213;color:#bff8ef}\n        .evPremiumBenefitRow span:nth-child(5){--ev-chip:231,185,108;color:#ffe0aa}", ".evPremiumBenefitRow span:nth-child(4){--ev-chip:231,185,108;color:#ffe0aa}\n        .evPremiumBenefitRow span:nth-child(5){--ev-chip:74,226,213;color:#bff8ef}\n        .evPremiumBenefitRow span:nth-child(6){--ev-chip:231,185,108;color:#ffe8bd}", 1)
s = s.replace(".evPremiumLibraryTitle{margin-bottom:10px;font-size:22px;", ".evPremiumLibraryTitle{margin-bottom:10px;font-size:28px;", 1)
p.write_text(s)

p = Path('app/premium-audio-engine.ts')
s = p.read_text()
old = "id: 'gamma-30', category: 'work', title: 'Creative Flow'"
if old not in s:
    raise SystemExit('gamma-30 engine title target missing')
s = s.replace(old, "id: 'gamma-30', category: 'work', title: 'Creative Spark'", 1)
p.write_text(s)

p = Path('app/layout.tsx')
s = p.read_text()
s = s.replace("box-shadow: inset 0 1px 0 rgba(234, 213, 255, .055), 0 14px 38px rgba(74, 40, 150, .08);", "box-shadow: inset 0 1px 0 rgba(255, 238, 199, .065), 0 16px 42px rgba(128, 84, 16, .11);", 1)
s = s.replace("box-shadow: 0 22px 50px rgba(99, 55, 190, .19), inset 0 0 36px rgba(160, 100, 255, .07) !important;", "box-shadow: 0 22px 52px rgba(175, 119, 25, .20), inset 0 0 36px rgba(245, 191, 83, .065) !important;", 1)
s = s.replace("background: linear-gradient(135deg, rgba(155, 96, 37, .15), rgba(119, 74, 210, .16));", "background: linear-gradient(135deg, rgba(155, 96, 37, .16), rgba(230, 172, 66, .10));", 1)
p.write_text(s)

product = Path('app/V10ProductFlow.tsx').read_text()
engine = Path('app/premium-audio-engine.ts').read_text()
page = Path('app/page.tsx').read_text()
checks = {
    'wrong gamma product name': "gamma-30', category: 'work', family: 'Gamma', hz: 30, label: 'Reflective Space'" not in product,
    'wrong theta product name': "theta', category: 'meditation', family: 'Theta', hz: 4, label: 'Creative Spark'" not in product,
    'old Focused Drive': 'Focused Drive' not in product and 'Focused Drive' not in engine,
    'old dark profile': 'Descending dark bed' not in product and 'Descending dark bed' not in engine,
    'old count': '20 Premium Frequencies' not in product,
    'old catalog count': '25 frequencies' not in product,
    'youtube story': 'Born from the Everlasting Voyage YouTube channel' in page,
    'future effects honesty': '15 Sound Effects · Coming Next' in product and 'Coming to Premium:' in product,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('Final static checks failed: ' + ', '.join(failed))
