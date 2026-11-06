"""Builds dist/index.js, an ES module with the same components as dist/bundle.js.

dist/bundle.js stays the source: it is the UMD file that reads window.React. This script turns it into a module that
imports React and ReactDOM and exports every member of window.UI by name, plus the whole object as the default export.

python3 scripts/build_esm.py           writes dist/index.js
python3 scripts/build_esm.py --check   exits 1 when dist/index.js is out of date (used in CI)
"""
import pathlib, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from ui_keys import runtime_keys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def build():
    src = (ROOT / 'dist/bundle.js').read_text()
    lines = src.split('\n')
    start = next(i for i, l in enumerate(lines) if l.startswith('(function () {'))
    end = max(i for i, l in enumerate(lines) if l.startswith('})();'))
    body = '\n'.join(lines[start + 1:end])
    for old, new in [
        ("  if (typeof window === 'undefined') return; // server or Node test: nothing to register\n", "  if (typeof window === 'undefined') return {}; // server: components need a browser\n"),
        ("  var React = window.React;\n", ""),
        ("window.ReactDOM && ReactDOM.createPortal", "ReactDOM && ReactDOM.createPortal"),
    ]:
        if old not in body: sys.exit('build_esm: expected text not found in bundle.js: ' + old.strip()[:60])
        body = body.replace(old, new, 1)
    body = '\n'.join(l for l in body.split('\n') if not l.startswith("  if (!React) throw new Error("))
    i = body.index('  window.UI = Object.assign(window.UI || {}, {')
    j = body.find('\n', i)
    if j < 0: j = len(body)
    obj = body[i:j].replace('  window.UI = Object.assign(window.UI || {}, {', '  return {', 1)
    obj = obj[:obj.rindex('});')] + '};'
    body = body[:i] + obj + body[j:]
    keys = runtime_keys()
    out = ['// Generated from dist/bundle.js by scripts/build_esm.py. Do not edit by hand.',
           "import * as React from 'react';",
           "import * as ReactDOM from 'react-dom';",
           '',
           'const UI = (function () {',
           body,
           '})();',
           '',
           'export default UI;']
    out += [f'export const {k} = UI.{k};' for k in keys]
    return '\n'.join(out) + '\n'


def main():
    text = build()
    p = ROOT / 'dist/index.js'
    if '--check' in sys.argv:
        if not p.exists() or p.read_text() != text:
            sys.exit('dist/index.js is out of date: run python3 scripts/build_esm.py')
        return
    p.write_text(text)
    print('dist/index.js:', len(runtime_keys()), 'exports')


if __name__ == '__main__':
    main()
