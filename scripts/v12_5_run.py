from pathlib import Path
import shutil

patch_path = Path('scripts/v12_5_patch.py')
source = patch_path.read_text()

old = '''ritual_anchor = """      if (signal.soundProfile === 'ritual') {
        const base = signal.pureHz ? Math.max(74, signal.pureHz / 4) : 111;
        addPad(base, 0.03);
        addPad(base * 1.5, 0.012, 'triangle');
        [3.2, 10.2, 17.2].forEach((offset, index) => {"""
if ritual_anchor not in product:
    raise SystemExit("Approved Ritual Preview audio changed")
if ritual_anchor not in voyage:
    raise SystemExit("Approved Ritual full Voyage audio changed")
'''

new = '''ritual_markers = [
    "if (signal.soundProfile === 'ritual') {",
    "const base = signal.pureHz ? Math.max(74, signal.pureHz / 4) : 111;",
    "addPad(base, 0.03);",
    "addPad(base * 1.5, 0.012, 'triangle');",
    "[3.2, 10.2, 17.2].forEach((offset, index) => {",
]
for marker in ritual_markers:
    if marker not in product:
        raise SystemExit(f"Approved Ritual Preview audio marker changed: {marker}")
    if marker not in voyage:
        raise SystemExit(f"Approved Ritual full Voyage audio marker changed: {marker}")
for pure_hz in [222, 444, 528, 963]:
    marker = f"pureHz: {pure_hz}"
    if marker not in product or marker not in voyage:
        raise SystemExit(f"Approved Ritual pure-frequency mapping changed: {pure_hz} Hz")
if "pureHz: 888" not in product or "pureHz: 888" not in voyage:
    raise SystemExit("Approved free 888 Hz Ritual mapping changed")
'''

if old not in source:
    raise SystemExit('Expected legacy Ritual guard was not found in the V12.5 patch script.')

source = source.replace(old, new, 1)
exec(compile(source, str(patch_path), 'exec'), {'__name__': '__main__'})

# The existing QA workflow uploads popup-motion-qa after build. Keep the exact
# patched files as a nested zip so Next.js does not type-check the duplicate TSX
# copies living outside app/ during the build itself.
patched_dir = Path('popup-motion-qa/patched')
archive_base = Path('popup-motion-qa/v12-5-patched-source')
if patched_dir.exists():
    shutil.make_archive(str(archive_base), 'zip', root_dir=patched_dir)
    shutil.rmtree(patched_dir)
