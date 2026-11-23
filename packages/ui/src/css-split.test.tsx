import { expect, test } from 'vitest';
import manifest from './styles.css?raw';

// dist/css/ splits dist/styles.css per component. A page whose CSS entry imports base.css, the files of the components
// it renders and end.css must look exactly as with styles.css: each component file imports what it needs, so a
// bundler that inlines the imports (keeping the first copy of a file imported twice, as postcss-import and Vite do)
// gets every rule a component needs, in the order of styles.css. Each component preview is rendered with both, and
// every element's computed style compared. Needs the build (pnpm check builds first).

const previews = import.meta.glob<string>('./components/*/preview.html', { query: '?raw', import: 'default', eager: true });
const order = [...manifest.matchAll(/components\/(\w+)\/\1\.css/g)].map((m) => m[1]);
const position = new Map(order.map((n, i) => [n, i]));
// Every component has a file in dist/css/; those without styles of their own (LineChart…) only import others.
const components = new Set(
  Object.keys(import.meta.glob('./components/*/*.tsx'))
    .map((p) => p.split('/'))
    .filter(([, , dir, file]) => file === `${dir}.tsx`)
    .map(([, , dir]) => dir),
);
const at = (n: string) => position.get(n) ?? -1;

// A fixed clock and random numbers, so both renderings build the same DOM.
const freeze = `<script>(function(){var T=Date.parse('2026-11-20T09:00:00Z'),D=Date;function F(){return arguments.length?new (Function.prototype.bind.apply(D,[null].concat([].slice.call(arguments))))():new D(T)}F.prototype=D.prototype;F.now=function(){return T};F.parse=D.parse;F.UTC=D.UTC;window.Date=F;var s=1;Math.random=function(){s=(s*16807)%2147483647;return (s-1)/2147483646}})()</script>`;

// The built CSS as text (fetch would get Vite's JavaScript module for a .css file).
const built = import.meta.glob<string>(['../dist/styles.css', '../dist/css/*.css'], { query: '?raw', import: 'default', eager: true });
const text = (path: string) => {
  const css = built[`..${path}`];
  if (css === undefined) throw new Error(`${path} is missing: run pnpm build first`);
  return css;
};

/** The CSS a bundler makes of an entry that imports these files: each @import inlined, a file imported again left out. */
function bundle(files: string[]) {
  const seen = new Set<string>();
  const inline = (path: string): string => {
    if (seen.has(path)) return '';
    seen.add(path);
    const css = text(path);
    let out = '';
    let last = 0;
    for (const m of css.matchAll(/@import '\.\/([\w-]+\.css)';/g)) {
      out += css.slice(last, m.index) + inline(path.replace(/[^/]+$/, m[1]));
      last = (m.index ?? 0) + m[0].length;
    }
    return out + css.slice(last);
  };
  let out = '';
  for (const f of files) out += inline(f);
  return out;
}

const escape = (css: string) => css.replace(/<\/style/gi, '<\\/style');
function page(body: string, whole: string, split: string) {
  const links = ['/dist/fonts.css', '/dist/tokens.css'].map((href) => `<link rel="stylesheet" href="${href}">`).join('');
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">${links}<style id="whole">${escape(whole)}</style><style id="split" media="not all">${escape(split)}</style><style>body{margin:0;padding:24px;font-family:var(--font-sans);color:var(--ink);background:var(--bg)}</style>${freeze}<script src="/dist/bundle.js"></script></head><body>${body}</body></html>`;
}

const must = <T,>(value: T | null | undefined, what: string): T => {
  if (value == null) throw new Error(`no ${what}`);
  return value;
};

async function load(html: string, width: number) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:900px;border:0;position:fixed;left:0;top:0;visibility:hidden`;
  const done = new Promise<void>((resolve) => frame.addEventListener('load', () => resolve(), { once: true }));
  frame.srcdoc = html;
  document.body.append(frame);
  await done;
  const doc = must(frame.contentDocument, 'document');
  await doc.fonts.ready;
  // Effects that measure (ResizeObserver, layout effects) settle within a few frames.
  for (let i = 0; i < 4; i++) await new Promise((r) => must(frame.contentWindow, 'window').requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, 150));
  return frame;
}

const PSEUDOS = [null, '::before', '::after'] as const;
/** Every computed value of every element of the page (not the head) and of its ::before and ::after. */
function styles(doc: Document) {
  const view = must(doc.defaultView, 'window');
  const out: { el: Element; pseudo: string | null; values: string[]; props: string[] }[] = [];
  for (const el of [doc.documentElement, doc.body, ...doc.body.querySelectorAll('*')])
    for (const pseudo of PSEUDOS) {
      const cs = view.getComputedStyle(el, pseudo);
      if (pseudo && cs.content === 'none') {
        out.push({ el, pseudo, values: [], props: [] });
        continue;
      }
      const props = [...cs];
      out.push({ el, pseudo, props, values: props.map((p) => cs.getPropertyValue(p)) });
    }
  return out;
}

// The same page, the same moment: styles with styles.css, then with the split files instead. Both read in one task, so
// no timer or animation frame runs between them.
function differences(doc: Document, limit = 8) {
  const whole = doc.getElementById('whole') as HTMLStyleElement;
  const split = doc.getElementById('split') as HTMLStyleElement;
  const a = styles(doc);
  whole.media = 'not all';
  split.media = 'all';
  const b = styles(doc);
  const out: string[] = [];
  const name = (el: Element) =>
    el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '');
  for (let i = 0; i < a.length && out.length < limit; i++) {
    const x = a[i];
    const y = b[i];
    if (x.props.length !== y.props.length) {
      out.push(`${name(x.el)}${x.pseudo ?? ''}: ${x.pseudo ? 'content' : 'properties'} differ`);
      continue;
    }
    const k = x.values.findIndex((v, j) => v !== y.values[j]);
    if (k >= 0) out.push(`${name(x.el)}${x.pseudo ?? ''} ${x.props[k]}: ${x.values[k]} (styles.css) / ${y.values[k]} (dist/css/)`);
  }
  return out;
}

const names = Object.keys(previews)
  .map((p) => p.split('/')[2])
  .sort();

test('dist/ is built', () => {
  expect(Object.keys(built).length, 'run pnpm build first').toBeGreaterThan(70);
});

for (const name of names) {
  test(`${name}: base.css + its component files + end.css render as styles.css`, async () => {
    const src = previews[`./components/${name}/preview.html`];
    const open = /<body[^>]*>/.exec(src);
    const body = src.slice(open ? open.index + open[0].length : 0, src.indexOf('</body>'));
    // The components the preview renders itself: its own and every U.<Name> it calls, as a page would import them.
    const used = new Set([name, ...[...body.matchAll(/\bU\.([A-Z]\w*)/g)].map((m) => m[1])].filter((n) => components.has(n)));
    const files = [...used].sort((x, y) => at(x) - at(y)).map((n) => `/dist/css/${n}.css`);
    const whole = text('/dist/styles.css');
    const split = bundle(['/dist/css/base.css', ...files, '/dist/css/end.css']);
    for (const width of [1280, 390]) {
      const frame = await load(page(body, whole, split), width);
      try {
        expect(differences(must(frame.contentDocument, 'document')), `${name} at ${width} px with ${files.join(', ')}`).toEqual([]);
      } finally {
        frame.remove();
      }
    }
  });
}
