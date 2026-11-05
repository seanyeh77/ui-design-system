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
shutil.copytree(ROOT / 'dist', SITE / 'dist')
for md in (ROOT / 'docs').glob('*.md'):
    shutil.copy(md, SITE / 'md' / md.name)

PREVIEW_HEAD = '''<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../dist/tokens.css"><link rel="stylesheet" href="../dist/bundle.css">
<style>body{{margin:0;padding:24px;font-family:var(--font-sans);color:var(--ink);background:var(--bg)}}</style>
<script>try{{var t=new URLSearchParams(location.search).get('theme');if(t)document.documentElement.setAttribute('data-theme',t);}}catch(e){{}}</script>
<script src="{react}"></script><script src="{react_dom}"></script><script src="../dist/bundle.js"></script>
</head>
<body>
'''

components = []
for folder in sorted((ROOT / 'components').iterdir()):
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
print('site/:', len(components), 'components')
