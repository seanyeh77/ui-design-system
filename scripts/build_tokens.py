"""Turn tokens/tokens.json into dist/tokens.css.

Light values go on :root, dark values on [data-theme="dark"].
Each preset in "presets" becomes [data-theme="<id>"] with the values that differ from light.
Run from the repo root: python3 scripts/build_tokens.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
tokens = json.loads((ROOT / 'tokens' / 'tokens.json').read_text(encoding='utf-8'))

light, dark = {}, {}


def add(name, value):
    if isinstance(value, dict):
        light[name] = value.get('light')
        dark[name] = value.get('dark', value.get('light'))
    else:
        light[name] = value


for group in ('color', 'spacing', 'radius', 'shadow', 'size'):
    for t in tokens.get(group, {}).get('tokens', []):
        add(t['name'], t['value'])

families = tokens.get('type', {}).get('families', {})
for key, value in families.items():
    light['font-' + key] = value


def block(selector, values, only_changed=None):
    lines = []
    for k, v in values.items():
        if v is None or (only_changed is not None and only_changed.get(k) == v):
            continue
        lines.append(f'  --{k}: {v};')
    return selector + ' {\n' + '\n'.join(lines) + '\n}\n'


css = '/* Generated from tokens/tokens.json by scripts/build_tokens.py. Do not edit by hand. */\n'
css += block(':root', light)
css += block('[data-theme="dark"]', dark, only_changed=light)
for preset in tokens.get('presets', []):
    unknown = set(preset['values']) - set(light)
    if unknown:
        raise SystemExit(f"preset {preset['id']}: unknown tokens {sorted(unknown)}")
    css += block(f'[data-theme="{preset["id"]}"]', preset['values'], only_changed=light)
(ROOT / 'dist' / 'tokens.css').write_text(css, encoding='utf-8')
print('dist/tokens.css:', len(light), 'tokens,', css.count('\n'), 'lines')
