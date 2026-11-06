"""Keeps dist/index.d.ts in step with what dist/bundle.js puts on window.UI.

python3 scripts/ui_keys.py          lists members missing from the Window.UI declaration, exits 1 if any
python3 scripts/ui_keys.py --write  rewrites the Window.UI declaration from the bundle (each member needs its own declaration above it)
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def runtime_keys():
    s = (ROOT / 'dist/bundle.js').read_text()
    i = s.index('window.UI = Object.assign(window.UI || {}, {') + len('window.UI = Object.assign(window.UI || {}, {')
    depth, key, keys, tok = 0, None, [], ''
    while depth >= 0:
        c = s[i]; i += 1
        if c in '({[': depth += 1
        elif c in ')}]':
            depth -= 1
        if depth == 0 and c == ':' and key is None:
            key = tok.strip().split()[-1] if tok.strip() else None
            if key: keys.append(key)
        if depth == 0 and c == ',': key, tok = None, ''
        elif depth == 0 and key is None: tok += c
    return keys


def main():
    keys = runtime_keys()
    p = ROOT / 'dist/index.d.ts'; d = p.read_text()
    gi = d.index('declare global')
    declared = re.findall(r'(\w+): typeof', d[gi:])
    if '--write' in sys.argv:
        d = d[:gi] + 'declare global { interface Window { UI: { ' + '; '.join(k + ': typeof ' + k for k in keys) + ' } } }\n'
        p.write_text(d); declared = keys
    missing = [k for k in keys if k not in declared]
    body = d[:gi]
    untyped = [k for k in keys if not re.search(r'export declare (function|const) ' + k + r'\b', body)]
    if missing: print('Window.UI is missing:', ', '.join(missing))
    if untyped: print('No declaration for:', ', '.join(untyped))
    sys.exit(1 if missing or untyped else 0)


if __name__ == '__main__':
    main()
