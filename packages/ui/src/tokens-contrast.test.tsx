import { afterEach, expect, test } from 'vitest';
import tokens from '@seanyeh77/tokens/tokens.json';
import { ACCENT_SWATCHES, DEFAULT_ACCENT, setAccent, setTheme } from './theme';

// Text contrast (WCAG 2, 4.5:1) computed from tokens.json, and from setAccent for every preset swatch, so a token
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

afterEach(() => {
  root.removeAttribute('data-theme');
  setTheme('light');
  setAccent(DEFAULT_ACCENT, true);
});

test.each(['light', 'dark', 'teaching'])('%s: setAccent gives every preset swatch a text color that reads on every ground', (theme) => {
  const fails: string[] = [];
  for (const [name, hex] of ACCENT_SWATCHES) {
    if (theme === 'teaching') root.setAttribute('data-theme', 'teaching');
    else setTheme(theme as 'light' | 'dark');
    setAccent(hex, true);
    const text = varOf('--accent-text');
    const soft = varOf('--accent-soft');
    for (const g of ['bg', 'surface', 'surface-sub', 'surface-chrome']) {
      const bgc = ground(g);
      // tokens.css may be minified (#fff); the token file has the long form.
      const r = contrast(text, bgc.length === 4 ? '#' + [...bgc.slice(1)].map((x) => x + x).join('') : bgc);
      if (r < 4.5) fails.push(`${name} ${hex}: accent-text ${text} on ${g}: ${r.toFixed(2)}:1`);
    }
    const r = contrast(text, soft);
    if (r < 4.5) fails.push(`${name} ${hex}: accent-text ${text} on accent-soft ${soft}: ${r.toFixed(2)}:1`);
    const on = contrast(varOf('--on-accent'), hex);
    if (on < 4.5) fails.push(`${name} ${hex}: on-accent on the accent: ${on.toFixed(2)}:1`);
  }
  expect(fails).toEqual([]);
});

test('the token values of accent-text and accent-soft are what setAccent derives from the default accents', () => {
  for (const theme of ['light', 'dark'] as const) {
    setTheme(theme);
    setAccent(DEFAULT_ACCENT, true);
    expect(varOf('--accent-text')).toBe(themes[theme]['accent-text']);
    expect(varOf('--accent-soft')).toBe(themes[theme]['accent-soft']);
  }
  root.setAttribute('data-theme', 'teaching');
  setAccent(teaching.accent, true);
  expect(varOf('--accent-text')).toBe(teaching['accent-text']);
  expect(varOf('--accent-soft')).toBe(teaching['accent-soft']);
});

test('every type style in tokens.json uses a size of the text scale', () => {
  const sizes = new Set(tokens.text.tokens.map((t) => t.value));
  const off = tokens.type.groups.flatMap((g) => g.styles.filter((s) => !sizes.has(s.fontSize)).map((s) => `${s.name} ${s.fontSize}`));
  expect(off).toEqual([]);
});
