"""Build the documentation site into site/.

Each component gets a live preview page (its preview.html wired to React and dist/),
and index.html lists them by group next to the component's README.
Run from the repo root: python3 scripts/build_tokens.py && python3 scripts/build_site.py
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
REACT = 'https://unpkg.com/react@18.3.1/umd/react.production.min.js'
REACT_DOM = 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js'
GROUP_ORDER = ['Foundations', 'Actions', 'Forms', 'Data', 'Status', 'Feedback', 'Overlays', 'Navigation', 'Appearance', 'Pages']
GROUP_NAMES = {'Foundations': '基礎', 'Actions': '按鈕', 'Forms': '表單', 'Data': '數據呈現', 'Status': '狀態', 'Feedback': '回饋',
               'Overlays': '浮層', 'Navigation': '導覽', 'Appearance': '外觀', 'Pages': '頁面範本', 'Other': '其他'}

if SITE.exists():
    shutil.rmtree(SITE)
(SITE / 'preview').mkdir(parents=True)
(SITE / 'md').mkdir()
shutil.copytree(ROOT / 'packages' / 'ui' / 'dist', SITE / 'dist')
for md in (ROOT / 'docs').glob('*.md'):
    shutil.copy(md, SITE / 'md' / md.name)

PREVIEW_HEAD = '''<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{name}</title>
<link rel="stylesheet" href="../dist/fonts.css">
<link rel="stylesheet" href="../dist/tokens.css"><link rel="stylesheet" href="../dist/bundle.css">
<style>body{{margin:0;padding:24px;font-family:var(--font-sans);color:var(--ink);background:var(--bg)}}</style>
<script>try{{var t=new URLSearchParams(location.search).get('theme');if(t)document.documentElement.setAttribute('data-theme',t);}}catch(e){{}}</script>
<script src="../dist/bundle.js"></script>
</head>
<body>
'''

components = []
for folder in sorted((ROOT / 'packages' / 'ui' / 'src' / 'components').iterdir()):
    pv = folder / 'preview.html'
    if not pv.is_file():
        continue
    src = pv.read_text(encoding='utf-8')
    m = re.search(r'@dsCard([^>]*)-->', src)
    meta = m.group(1) if m else ''
    group = (re.search(r'group="([^"]+)"', meta) or [None, 'Other'])[1]
    height = int((re.search(r'height=(\d+)', meta) or [None, '300'])[1])
    body = src[src.index('<body>') + 6:src.index('</body>')]
    page = PREVIEW_HEAD.format(name=folder.name, react=REACT, react_dom=REACT_DOM) + body + '</body>\n</html>\n'
    (SITE / 'preview' / (folder.name + '.html')).write_text(page, encoding='utf-8')
    readme = folder / 'README.md'
    if readme.is_file():
        shutil.copy(readme, SITE / 'md' / (folder.name + '.md'))
    components.append({'name': folder.name, 'group': group, 'height': height + 48})

components.sort(key=lambda c: (GROUP_ORDER.index(c['group']) if c['group'] in GROUP_ORDER else 99, c['name']))
nav = {'docs': [{'id': 'guidelines', 'label': '設計規則'}, {'id': 'layout', 'label': '版面'}, {'id': 'motion', 'label': '動畫'}],
       'groups': [], 'components': components}
for c in components:
    label = GROUP_NAMES.get(c['group'], c['group'])
    if not nav['groups'] or nav['groups'][-1]['label'] != label:
        nav['groups'].append({'label': label, 'items': []})
    nav['groups'][-1]['items'].append(c['name'])

index = (ROOT / 'scripts' / 'site_index.html').read_text(encoding='utf-8').replace('__NAV__', json.dumps(nav, ensure_ascii=False))
(SITE / 'index.html').write_text(index, encoding='utf-8')
(SITE / '.nojekyll').write_text('')

# Files for agents: raw tokens, AGENTS.md, and an llms.txt index of every published file.
(SITE / 'tokens').mkdir()
shutil.copy(ROOT / 'packages' / 'tokens' / 'tokens.json', SITE / 'tokens' / 'tokens.json')
shutil.copy(ROOT / 'AGENTS.md', SITE / 'AGENTS.md')
BASE = 'https://seanyeh77.github.io/ui-design-system'
doc_titles = {'guidelines': 'All confirmed design rules', 'layout': 'Page structure and breakpoints',
              'motion': 'Animation durations and effects', 'decisions': 'Original wording of each lab decision'}
lines = [
    '# ui-design-system',
    '',
    "> SeanYeh's design system: React 18 components on window.UI, design tokens and written rules. "
    'Warm-gray neutrals, accent #2457d6, Inter + Noto Sans TC, Geist Mono for numbers, light and dark themes. '
    'Read AGENTS.md first, then guidelines before building any UI.',
    '',
    '## Start here',
    '',
    f'- [AGENTS.md]({BASE}/AGENTS.md): how to load the files, use components and tokens, and change the system',
    *[f'- [{name}]({BASE}/md/{name}.md): {title}' for name, title in doc_titles.items() if (SITE / 'md' / f'{name}.md').exists()],
    '',
    '## Files to load',
    '',
    f'- [tokens.css]({BASE}/dist/tokens.css): CSS variables for every token, light and dark',
    f'- [bundle.css]({BASE}/dist/bundle.css): component styles',
    f'- [bundle.js]({BASE}/dist/bundle.js): all components on window.UI (React 19 included; sets window.React, window.ReactDOM and window.UI)',
    f'- [index.js]({BASE}/dist/index.js): the same components as an ES module (npm package @seanyeh77/ui)',
    f'- [fonts.css]({BASE}/dist/fonts.css): self-hosted Inter, Geist Mono and Noto Sans TC, weights 400 to 700',
    f'- [index.d.ts]({BASE}/dist/index.d.ts): component props and API types',
    f'- [tokens.json]({BASE}/tokens/tokens.json): token values with their intended usage',
    '',
    '## Components',
    '',
    *[f"- [{c['name']}]({BASE}/md/{c['name']}.md) ({GROUP_NAMES.get(c['group'], c['group'])}), "
      f"live preview {BASE}/preview/{c['name']}.html"
      for c in components if (SITE / 'md' / f"{c['name']}.md").exists()],
    '',
]
(SITE / 'llms.txt').write_text('\n'.join(lines), encoding='utf-8')
print('site/:', len(components), 'components')
