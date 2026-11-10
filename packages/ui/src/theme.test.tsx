import { afterEach, expect, test } from 'vitest';
import { DEFAULT_ACCENT, accentText, setAccent, setTheme } from './theme';

// Contrast as WCAG 2 counts it, to check the results independently of theme.ts.
const lum = (hex: string) =>
  [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const LIGHT = { bg: '#fcfbfb', surface: '#ffffff' };
const DARK = { bg: '#2f2a25', surface: '#393530' };
const varOf = (name: string) => document.documentElement.style.getPropertyValue(name);

afterEach(() => {
  setTheme('light');
  setAccent(DEFAULT_ACCENT, true);
});

test('light: an accent that already reads stays the text color (the default #2457d6)', () => {
  expect(accentText(DEFAULT_ACCENT, false, LIGHT.bg, LIGHT.surface)).toBe('#2457d6');
});

test('light: a light accent is darkened with black, 4 % at a time, until it reads on bg and surface', () => {
  expect(accentText('#ffe066', false, LIGHT.bg, LIGHT.surface)).toBe('#7a6c31');
  expect(accentText('#c4600f', false, LIGHT.bg, LIGHT.surface)).toBe('#b4580e');
  expect(accentText('#0f8a85', false, LIGHT.bg, LIGHT.surface)).toBe('#0e7f7a');
  for (const c of ['#ffe066', '#c4600f', '#0f8a85', '#ffffff']) {
    const t = accentText(c, false, LIGHT.bg, LIGHT.surface);
    expect(contrast(t, LIGHT.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t, LIGHT.surface)).toBeGreaterThanOrEqual(4.5);
  }
});

test('dark: a dark accent is lightened with white until it reads on bg and surface', () => {
  expect(accentText('#1a1a6e', true, DARK.bg, DARK.surface)).toBe('#a3a3c5');
  expect(accentText(DEFAULT_ACCENT, true, DARK.bg, DARK.surface)).toBe('#87a3e8');
  // A light accent already reads on the dark grounds: unchanged.
  expect(accentText('#ffe066', true, DARK.bg, DARK.surface)).toBe('#ffe066');
  for (const c of ['#1a1a6e', '#2457d6', '#000000']) {
    const t = accentText(c, true, DARK.bg, DARK.surface);
    expect(contrast(t, DARK.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t, DARK.surface)).toBeGreaterThanOrEqual(4.5);
  }
});

test('setAccent: only accent-text changes; the accent itself (fills, bars, rings) stays the chosen color', () => {
  setTheme('light');
  expect(setAccent('#ffe066', true)).toBe(true);
  expect(varOf('--accent')).toBe('#ffe066');
  expect(varOf('--accent-text')).toBe('#7a6c31');
  setTheme('dark');
  setAccent('#ffe066', true);
  expect(varOf('--accent')).toBe('#ffe066');
  expect(varOf('--accent-text')).toBe('#ffe066');
  setAccent('#1a1a6e', true);
  expect(varOf('--accent')).toBe('#1a1a6e');
  expect(varOf('--accent-text')).toBe('#a3a3c5');
});
