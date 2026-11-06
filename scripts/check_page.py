#!/usr/bin/env python3
"""Runs the automatic part of "Before you finish" on one or more pages.

For each page at 390 px and 1280 px, light and dark:
  - console errors and uncaught exceptions
  - horizontal overflow at 390 px (and which elements stick out)
  - touch targets smaller than 48 x 48 px at 390 px

A target counts its own box or a larger hit area drawn by ::before / ::after.
Text links and buttons that sit inside a line of text are exempt, as in
WCAG 2.2 (2.5.8, inline exception); they are listed separately as "inline".

Usage:
  python3 scripts/check_page.py page.html https://example.com/app [--shots DIR] [--lib DIR]

  --shots DIR  save a screenshot per page, width and theme
  --lib DIR    serve unpkg React files from DIR (react.production.min.js,
               react-dom.production.min.js) when the network blocks unpkg
  --strict     also fail on inline targets

Needs: uv tool install playwright (or uv pip install playwright), then playwright install chromium.
Exit status is 1 when any check fails.
"""
import argparse, os, pathlib, sys

from playwright.sync_api import sync_playwright

MEASURE = r"""
() => {
  const out = { overflow: [], small: [], inline: [] };
  const vw = document.documentElement.clientWidth;
  const doc = document.documentElement;
  if (doc.scrollWidth > vw + 1) {
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed') {
        const parent = el.parentElement && el.parentElement.getBoundingClientRect();
        if (!parent || parent.right <= vw + 1) out.overflow.push(describe(el) + ' right ' + Math.round(r.right) + ' px');
      }
      if (out.overflow.length >= 8) break;
    }
    if (!out.overflow.length) out.overflow.push('page scrollWidth ' + doc.scrollWidth + ' px');
  }
  const sel = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [role=option], [role=menuitem], [role=link], [tabindex]:not([tabindex="-1"])';
  const seen = new Set();
  for (const el of document.querySelectorAll(sel)) {
    if (seen.has(el)) continue; seen.add(el);
    if (el.closest('[aria-hidden="true"], [inert]')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.pointerEvents === 'none') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    // A checkbox or radio inside its label uses the label as target.
    if ((el.type === 'checkbox' || el.type === 'radio') && el.closest('label')) continue;
    let w = r.width, h = r.height;
    for (const pe of ['::before', '::after']) {
      const ps = getComputedStyle(el, pe);
      if (ps.content && ps.content !== 'none' && ps.position === 'absolute' && ps.pointerEvents !== 'none') {
        w = Math.max(w, parseFloat(ps.width) || 0); h = Math.max(h, parseFloat(ps.height) || 0);
      }
    }
    if (w >= 47.5 && h >= 47.5) continue;
    const item = describe(el) + ' ' + Math.round(w) + ' x ' + Math.round(h) + ' px';
    (isInline(el, cs) ? out.inline : out.small).push(item);
  }
  return out;

  function isInline(el, cs) {
    if (!cs.display.startsWith('inline')) return false;
    const p = el.parentElement; if (!p) return false;
    for (const n of p.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
    return false;
  }
  function describe(el) {
    let s = el.tagName.toLowerCase();
    const cls = [...el.classList].filter(c => c.startsWith('ui-')).slice(0, 2);
    if (cls.length) s += '.' + cls.join('.');
    const label = el.getAttribute('aria-label') || (el.textContent || '').trim();
    if (label) s += ' "' + label.slice(0, 24) + '"';
    return s;
  }
}
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pages', nargs='+')
    ap.add_argument('--shots')
    ap.add_argument('--lib')
    ap.add_argument('--strict', action='store_true')
    ap.add_argument('--wait', type=int, default=800, help='ms to wait after load (default 800)')
    a = ap.parse_args()
    failed = False
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for page_arg in a.pages:
            url = page_arg if '://' in page_arg else pathlib.Path(page_arg).resolve().as_uri()
            print(url)
            for width in (390, 1280):
                for theme in ('light', 'dark'):
                    ctx = browser.new_context(viewport={'width': width, 'height': 844 if width == 390 else 900},
                                              color_scheme=theme, has_touch=width == 390, is_mobile=width == 390,
                                              device_scale_factor=2 if width == 390 else 1)
                    pg = ctx.new_page()
                    if a.lib:
                        lib = a.lib
                        def route(r):
                            name = 'react-dom.production.min.js' if 'react-dom' in r.request.url else 'react.production.min.js'
                            r.fulfill(path=os.path.join(lib, name))
                        pg.route('https://unpkg.com/**', route)
                        pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
                    errors = []
                    pg.on('pageerror', lambda e: errors.append(str(e)))
                    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'fonts.g' not in (m.location or {}).get('url', '') else None)
                    pg.goto(url, wait_until='load')
                    pg.evaluate("t => { const r = document.documentElement; if (r.hasAttribute('data-theme') || window.UI) r.setAttribute('data-theme', t); }", theme)
                    pg.wait_for_timeout(a.wait)
                    res = pg.evaluate(MEASURE)
                    tag = f'  {width} px {theme}:'
                    problems = []
                    if errors: problems.append('console errors: ' + ' | '.join(errors[:5]))
                    if width == 390:
                        if res['overflow']: problems.append('horizontal overflow: ' + '; '.join(res['overflow']))
                        if res['small']: problems.append('touch targets under 48 px: ' + '; '.join(res['small'][:12]) + (f' (+{len(res["small"]) - 12} more)' if len(res['small']) > 12 else ''))
                        if res['inline'] and a.strict: problems.append('inline targets under 48 px: ' + '; '.join(res['inline'][:12]))
                    print(tag, 'ok' if not problems else '')
                    for pr in problems: print('    - ' + pr)
                    if width == 390 and res['inline'] and not a.strict and theme == 'light':
                        print(f'    (inline text targets, exempt: {len(res["inline"])})')
                    failed = failed or bool(problems)
                    if a.shots:
                        os.makedirs(a.shots, exist_ok=True)
                        stem = pathlib.Path(url.rstrip('/').split('/')[-1] or 'page').stem
                        pg.screenshot(path=os.path.join(a.shots, f'{stem}-{width}-{theme}.png'), full_page=True)
                    ctx.close()
        browser.close()
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
