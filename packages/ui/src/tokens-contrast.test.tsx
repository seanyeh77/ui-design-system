import { afterEach, expect, test } from 'vitest';
import tokens from '@seanyeh77/tokens/tokens.json';
import { ACCENT_KEY, ACCENT_SWATCHES, DEFAULT_ACCENT, accentText, setAccent, setTheme, storedAccent } from './theme';

// Text contrast (WCAG 2, 4.5:1) and non-text contrast (3:1) computed from tokens.json, and from setAccent for every preset swatch, so a token
// change or a new swatch that makes text unreadable on one of the grounds fails here.

const lum = (hex: string) =>
  [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

type Value = string | { light: string; dark?: string };
const colors = Object.fromEntries(tokens.color.tokens.map((t) => [t.name, t.value as Value]));
const teaching = tokens.presets.find((p) => p.id === 'teaching')?.values as Record<string, string>;
const themes: Record<string, Record<string, string>> = {
  light: Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, typeof v === 'string' ? v : v.light])),
  dark: Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, typeof v === 'string' ? v : (v.dark ?? v.light)])),
};
themes.teaching = { ...themes.light, ...teaching };

const GROUNDS = ['bg', 'surface', 'surface-sub', 'surface-chrome', 'accent-soft'];
const TEXTS = ['ink', 'ink-muted', ...Object.keys(colors).filter((n) => n.endsWith('-text'))];

test.each(Object.keys(themes))('%s: ink, ink-muted and every *-text reach 4.5:1 on every ground', (theme) => {
  const c = themes[theme];
  const fails: string[] = [];
  for (const text of TEXTS) {
    // A status text also sits on its own soft fill (an alert, a badge).
    const soft = text.replace(/-text$/, '-soft');
    const grounds = text.endsWith('-text') && soft in c && soft !== 'accent-soft' ? [...GROUNDS, soft] : GROUNDS;
    for (const g of grounds) {
      const r = contrast(c[text], c[g]);
      if (r < 4.5) fails.push(`${text} ${c[text]} on ${g} ${c[g]}: ${r.toFixed(2)}:1`);
    }
  }
  expect(fails).toEqual([]);
});

const root = document.documentElement;
const varOf = (name: string) => root.style.getPropertyValue(name);
const ground = (name: string) =>
  getComputedStyle(root)
    .getPropertyValue('--' + name)
    .trim();
// tokens.css may be minified (#fff); the token file has the long form.
const long = (c: string) => (c.length === 4 ? '#' + [...c.slice(1)].map((x) => x + x).join('') : c);

afterEach(() => {
  root.removeAttribute('data-theme');
  setTheme('light');
  setAccent(DEFAULT_ACCENT, true);
});

test.each(['light', 'dark', 'teaching'])('%s: setAccent gives every preset swatch a text color, a fill and a focus color that reach their ratios', (theme) => {
  const fails: string[] = [];
  for (const [name, hex] of ACCENT_SWATCHES) {
    if (theme === 'teaching') root.setAttribute('data-theme', 'teaching');
    else setTheme(theme as 'light' | 'dark');
    setAccent(hex, true);
    const text = varOf('--accent-text');
    const soft = varOf('--accent-soft');
    for (const g of ['bg', 'surface', 'surface-sub', 'surface-chrome']) {
      const r = contrast(text, long(ground(g)));
      if (r < 4.5) fails.push(`${name} ${hex}: accent-text ${text} on ${g}: ${r.toFixed(2)}:1`);
    }
    const r = contrast(text, soft);
    if (r < 4.5) fails.push(`${name} ${hex}: accent-text ${text} on accent-soft ${soft}: ${r.toFixed(2)}:1`);
    // The fill (buttons, switches, progress, checked boxes) and its hover and press: 3:1 on every ground, including
    // the accent-soft of a selected row; on-accent 4.5:1 on each.
    const on = varOf('--on-accent');
    for (const f of ['--accent', '--accent-hover', '--accent-press']) {
      const fill = varOf(f);
      for (const g of ['bg', 'surface', 'surface-sub', 'surface-chrome']) {
        const r = contrast(fill, long(ground(g)));
        if (r < 3) fails.push(`${name} ${hex}: ${f} ${fill} on ${g}: ${r.toFixed(2)}:1`);
      }
      const rs = contrast(fill, soft);
      if (rs < 3) fails.push(`${name} ${hex}: ${f} ${fill} on accent-soft ${soft}: ${rs.toFixed(2)}:1`);
      const ro = contrast(on, fill);
      if (ro < 4.5) fails.push(`${name} ${hex}: on-accent ${on} on ${f} ${fill}: ${ro.toFixed(2)}:1`);
    }
    // The focus outline is the accent's text color (3:1 is enough for it; it gets 4.5:1).
    if (varOf('--focus') !== text) fails.push(`${name} ${hex}: --focus ${varOf('--focus')} is not accent-text ${text}`);
  }
  expect(fails).toEqual([]);
});

const DERIVED = ['accent', 'accent-hover', 'accent-press', 'accent-text', 'accent-soft', 'on-accent', 'focus', 'focus-ring'];

test('the token values of every accent token are what setAccent derives from the default accents', () => {
  // Pages without JavaScript get the same colors as pages that call initTheme().
  for (const theme of ['light', 'dark'] as const) {
    setTheme(theme);
    setAccent(DEFAULT_ACCENT, true);
    for (const t of DERIVED) expect(varOf('--' + t), `${theme} ${t}`).toBe(themes[theme][t]);
  }
  root.setAttribute('data-theme', 'teaching');
  setAccent(teaching.accent, true);
  for (const t of DERIVED) expect(varOf('--' + t), `teaching ${t}`).toBe(teaching[t]);
});

test('light and teaching: every preset swatch and the teaching accent read as text by themselves (accentText keeps them)', () => {
  const fails: string[] = [];
  const check = (name: string, hex: string, c: Record<string, string>) => {
    // The light accent-soft of this accent: white with 12% of it (setAccent).
    const soft =
      '#' +
      [1, 3, 5]
        .map((i) =>
          Math.round(255 + (parseInt(hex.slice(i, i + 2), 16) - 255) * 0.12)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('');
    const text = accentText(hex, false, c.bg, c.surface, c['surface-sub'], c['surface-chrome'], soft);
    if (text !== hex) fails.push(`${name} ${hex}: accentText gives ${text}`);
    if (contrast('#ffffff', hex) < 4.5) fails.push(`${name} ${hex}: white on it ${contrast('#ffffff', hex).toFixed(2)}:1`);
  };
  for (const [name, hex] of ACCENT_SWATCHES) check(name, hex, themes.light);
  check('teaching', teaching.accent, themes.teaching);
  expect(teaching['accent-text']).toBe(teaching.accent);
  expect(fails).toEqual([]);
});

// Non-text UI (WCAG 1.4.11, 3:1). The grounds a control or mark can sit on: the page, cards, gray areas, the frame,
// a selected row, and DataTable's rows: the hover wash (6 % ink on surface in light, 5 % in dark) and, in dark, the
// zebra row (half surface, half surface-sub; in light it is surface-sub).
const mixHex = (a: string, b: string, t: number) =>
  '#' +
  [1, 3, 5]
    .map((i) =>
      Math.round(parseInt(a.slice(i, i + 2), 16) + (parseInt(b.slice(i, i + 2), 16) - parseInt(a.slice(i, i + 2), 16)) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
const rowGrounds = (theme: string) => {
  const c = themes[theme];
  const dark = theme === 'dark';
  return {
    bg: c.bg,
    surface: c.surface,
    'surface-sub': c['surface-sub'],
    'surface-chrome': c['surface-chrome'],
    'accent-soft': c['accent-soft'],
    'row hover': mixHex(c.surface, c.ink, dark ? 0.05 : 0.06),
    'row zebra': dark ? mixHex(c.surface, c['surface-sub'], 0.5) : c['surface-sub'],
  };
};
const below3 = (theme: string, names: string[], grounds: Record<string, string>) => {
  const c = themes[theme];
  const fails: string[] = [];
  for (const n of names)
    for (const [g, v] of Object.entries(grounds)) {
      const r = contrast(c[n], v);
      if (r < 3) fails.push(`${n} ${c[n]} on ${g} ${v}: ${r.toFixed(2)}:1`);
    }
  return fails;
};

test.each(Object.keys(themes))('%s: line-strong (control borders, switch track, checkbox) reaches 3:1 on every ground', (theme) => {
  expect(below3(theme, ['line-strong'], { ...rowGrounds(theme), 'surface-input': themes[theme]['surface-input'] })).toEqual([]);
});

test.each(Object.keys(themes))('%s: status marks (Badge circles, tree dots, meter marks) reach 3:1 on every ground', (theme) => {
  // Marks use the text colors; draft uses ink-muted.
  const marks = ['success-text', 'warning-text', 'danger-text', 'accent-text', 'ink-muted'];
  expect(below3(theme, marks, rowGrounds(theme))).toEqual([]);
});

test.each(Object.keys(themes))('%s: solid status colors (fills, bars, icons) reach 3:1; text on danger 4.5:1', (theme) => {
  // Solid status colors are not drawn on a selected row's accent-soft: marks there use the text colors.
  const grounds = Object.fromEntries(Object.entries(rowGrounds(theme)).filter(([g]) => g !== 'accent-soft'));
  expect(below3(theme, ['success', 'warning', 'danger', 'focus'], grounds)).toEqual([]);
  const c = themes[theme];
  expect(contrast(c['on-danger'], c.danger)).toBeGreaterThanOrEqual(4.5);
});

test.each(Object.keys(themes))('%s: chart series colors reach 3:1 on the grounds a chart sits on', (theme) => {
  const c = themes[theme];
  const grounds = { bg: c.bg, surface: c.surface, 'surface-sub': c['surface-sub'], 'surface-chrome': c['surface-chrome'] };
  expect(below3(theme, ['chart-1', 'chart-2', 'chart-3', 'chart-4'], grounds)).toEqual([]);
});

test('every type style in tokens.json uses a size of the text scale', () => {
  const sizes = new Set(tokens.text.tokens.map((t) => t.value));
  const off = tokens.type.groups.flatMap((g) => g.styles.filter((s) => !sizes.has(s.fontSize)).map((s) => `${s.name} ${s.fontSize}`));
  expect(off).toEqual([]);
});

test('an old swatch value stored before the swatches changed moves to the current swatch', () => {
  localStorage.setItem(ACCENT_KEY, '#0e827d');
  expect(storedAccent()).toBe('#027874');
  expect(localStorage.getItem(ACCENT_KEY)).toBe('#027874');
  localStorage.setItem(ACCENT_KEY, '#123456');
  expect(storedAccent()).toBe('#123456');
  localStorage.removeItem(ACCENT_KEY);
});
