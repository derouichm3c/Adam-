"""Assemble the full Glowe Lab theme: stock Horizon 4.3.0 + glowe-theme overlay + merged locales.

Usage: python3 build.py <horizon_dir> <out_dir>
"""
import json
import pathlib
import shutil
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from glowe_copy import EN, FR  # noqa: E402

OVERLAY = pathlib.Path(__file__).resolve().parent.parent
horizon = pathlib.Path(sys.argv[1]).resolve()
out = pathlib.Path(sys.argv[2]).resolve()


def flat(d, prefix=''):
    keys = set()
    for k, v in d.items():
        if isinstance(v, dict):
            keys |= flat(v, f'{prefix}{k}.')
        else:
            keys.add(prefix + k)
    return keys


missing = flat(EN) ^ flat(FR)
if missing:
    sys.exit(f'FR/EN key mismatch: {sorted(missing)}')

if out.exists():
    shutil.rmtree(out)
shutil.copytree(horizon, out, ignore=shutil.ignore_patterns('.git', '.github', '*.md', 'LICENSE*'))

for path in OVERLAY.rglob('*'):
    rel = path.relative_to(OVERLAY)
    if path.is_dir() or rel.parts[0] in ('tools', 'locales') or path.name.startswith('.'):
        continue
    dest = out / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, dest)


def merge_locale(name, copy):
    # Horizon locale files contain // comments, so insert the "glowe" key textually
    # before the root object's closing brace instead of re-serializing the file.
    path = out / 'locales' / name
    text = path.read_text()
    if '"glowe":' in text:
        sys.exit(f'{name} already has a glowe key')
    end = text.rstrip().rindex('}')
    block = json.dumps({'glowe': copy}, ensure_ascii=False, indent=2)[1:-1].strip('\n')
    merged = text[:end].rstrip() + ',\n' + block + '\n}\n'
    path.write_text(merged)
    # Keep a copy in the overlay so the upload step sends the merged file.
    (OVERLAY / 'locales').mkdir(exist_ok=True)
    (OVERLAY / 'locales' / name).write_text(merged)


merge_locale('en.default.json', EN)
merge_locale('fr.json', FR)
print('built', out)
