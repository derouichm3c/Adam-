"""Check JSON templates and section groups against section/block schemas.

Catches what Shopify rejects silently on upload: unknown setting ids, select values
outside the options, range values off min/max/step, and unknown block types.
Usage: python3 validate_templates.py <built_theme_dir>
"""
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])


def schema(kind, name):
    path = root / kind / f'{name}.liquid'
    if not path.exists():
        return None
    text = path.read_text()
    if '{% schema %}' not in text:
        return {}
    return json.loads(text.split('{% schema %}')[1].split('{% endschema %}')[0])


def check_settings(where, sch, settings, errors):
    defs = {s['id']: s for s in sch.get('settings', []) if 'id' in s}
    for key, value in (settings or {}).items():
        d = defs.get(key)
        if d is None:
            errors.append(f'{where}: unknown setting "{key}"')
            continue
        if isinstance(value, str) and '{{' in value:
            continue
        if d['type'] in ('select', 'radio') and value not in [o['value'] for o in d['options']]:
            errors.append(f'{where}: "{key}"={value!r} not in {[o["value"] for o in d["options"]]}')
        if d['type'] == 'range':
            if not isinstance(value, (int, float)) or not d['min'] <= value <= d['max'] or (value - d['min']) % d.get('step', 1):
                errors.append(f'{where}: "{key}"={value!r} outside {d["min"]}..{d["max"]} step {d.get("step", 1)}')
        if d['type'] == 'checkbox' and not isinstance(value, bool):
            errors.append(f'{where}: "{key}" must be boolean')


def check_blocks(where, parent_schema, blocks, errors):
    allowed = [b['type'] for b in parent_schema.get('blocks', [])]
    for bid, block in (blocks or {}).items():
        btype = block['type']
        sch = schema('blocks', btype)
        here = f'{where} > {bid}({btype})'
        if sch is None:
            errors.append(f'{here}: block file missing')
            continue
        is_theme_block = not btype.startswith('_')
        if not block.get('static') and btype not in allowed and not ('@theme' in allowed and is_theme_block):
            errors.append(f'{here}: type not accepted by parent ({allowed})')
        check_settings(here, sch, block.get('settings'), errors)
        check_blocks(here, sch, block.get('blocks'), errors)
        for key in block.get('block_order', []):
            if key not in (block.get('blocks') or {}):
                errors.append(f'{here}: block_order references missing "{key}"')


def strip_comment(text):
    return text[text.index('*/') + 2:] if text.lstrip().startswith('/*') else text


errors = []
files = list((root / 'templates').glob('*.json')) + list((root / 'sections').glob('*-group.json'))
for path in sorted(files):
    data = json.loads(strip_comment(path.read_text()))
    for sid, section in data['sections'].items():
        sch = schema('sections', section['type'])
        where = f'{path.relative_to(root)} > {sid}({section["type"]})'
        if sch is None:
            errors.append(f'{where}: section file missing')
            continue
        check_settings(where, sch, section.get('settings'), errors)
        check_blocks(where, sch, section.get('blocks'), errors)
    for sid in data.get('order', []):
        if sid not in data['sections']:
            errors.append(f'{path.name}: order references missing "{sid}"')

print('\n'.join(errors) or 'OK: all templates match their schemas')
sys.exit(1 if errors else 0)
