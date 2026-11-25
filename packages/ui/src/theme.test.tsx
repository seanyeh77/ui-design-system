import { afterEach, expect, test } from 'vitest';
import { DEFAULT_ACCENT, accentText, resetAccent, setAccent, setTheme, themeScript, toHex } from './theme';

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

test('setAccent: the fill reaches 3:1 and its text 4.5:1; a fill that does not is darkened in light, lightened in dark', () => {
  setTheme('light');
  expect(setAccent('#ffe066', true)).toBe(true);
  // Yellow on white is 1.3:1: mixed with black 4 % at a time until it reaches 3:1 on every ground.
  expect(varOf('--accent')).toBe('#99863d');
  expect(varOf('--on-accent')).toBe('#171512');
  expect(varOf('--accent-text')).toBe('#7a6c31');
  expect(varOf('--focus')).toBe('#7a6c31');
  setAccent('#1a1a6e', true);
  expect(varOf('--accent')).toBe('#1a1a6e');
  expect(varOf('--on-accent')).toBe('#ffffff');
  setTheme('dark');
  setAccent('#ffe066', true);
  expect(varOf('--accent')).toBe('#ffe066');
  expect(varOf('--accent-text')).toBe('#ffe066');
  setAccent('#1a1a6e', true);
  // Mixed with white 5 % at a time until 3:1 on surface, surface-sub, surface-chrome and accent-soft.
  expect(varOf('--accent')).toBe('#8d8db7');
  expect(varOf('--on-accent')).toBe('#171512');
  // Hover and press go lighter in dark, so they keep 3:1 on the page.
  expect(contrast(varOf('--accent-hover'), DARK.surface)).toBeGreaterThan(contrast(varOf('--accent'), DARK.surface));
  // Lighter than accentText on bg and surface alone (#a3a3c5): it must also read on surface-sub.
  expect(varOf('--accent-text')).toBe('#afafcc');
  expect(varOf('--focus')).toBe('#afafcc');
});

test('bundlers shorten #ffffff to #fff: with --surface #fff the default accent-text is still #2457d6, not black', () => {
  setTheme('light');
  const root = document.documentElement;
  root.style.setProperty('--surface', '#fff');
  root.style.setProperty('--bg', '#fcfbfb');
  try {
    setAccent(DEFAULT_ACCENT, true);
    expect(varOf('--accent-text')).toBe('#2457d6');
    // rgb() reads the same
    root.style.setProperty('--surface', 'rgb(255, 255, 255)');
    setAccent(DEFAULT_ACCENT, true);
    expect(varOf('--accent-text')).toBe('#2457d6');
  } finally {
    root.style.removeProperty('--surface');
    root.style.removeProperty('--bg');
  }
});

test('toHex reads #rgb, #rrggbb, alpha forms and rgb(); accentText keeps the accent when a background cannot be read', () => {
  expect(toHex('#fff')).toBe('#ffffff');
  expect(toHex(' #FFF ')).toBe('#ffffff');
  expect(toHex('#2457D6')).toBe('#2457d6');
  expect(toHex('#2457d6cc')).toBe('#2457d6');
  expect(toHex('#fffa')).toBe('#ffffff');
  expect(toHex('rgb(255, 255, 255)')).toBe('#ffffff');
  expect(toHex('rgba(57,53,48,0.5)')).toBe('#393530');
  expect(toHex('rgb(57 53 48 / 50%)')).toBe('#393530');
  expect(toHex('white')).toBeNull();
  expect(toHex('')).toBeNull();
  // a light accent that does not read would normally darken; with an unreadable background it stays as it is
  expect(accentText('#f0b400', false, 'var(--x)', '#fff')).toBe('#f0b400');
  // short forms give the same result as the long ones
  expect(accentText('#f0b400', false, '#fcfbfb', '#fff')).toBe(accentText('#f0b400', false, '#fcfbfb', '#ffffff'));
});

test('presets: initTheme({ preset }) keeps the preset through setTheme; inline accent variables only after a pick', async () => {
  const { initTheme, resetAccent, storedAccent, themePreset } = await import('./theme');
  const root = document.documentElement;
  localStorage.removeItem('ui-accent');
  try {
    initTheme({ preset: 'teaching' });
    expect(themePreset()).toBe('teaching');
    expect(root.getAttribute('data-theme')).toBe('teaching');
    // No pick: tokens.css decides, so the teaching accent shows and no inline variable overrides it.
    expect(varOf('--accent')).toBe('');
    expect(getComputedStyle(root).getPropertyValue('--accent').trim()).toBe('#027874');
    expect(storedAccent()).toBe('#027874');
    // The teaching preset is light only: a dark setting is remembered but the preset stays.
    setTheme('dark');
    expect(root.getAttribute('data-theme')).toBe('teaching');
    expect(root.getAttribute('data-theme-setting')).toBe('dark');
    expect(getComputedStyle(root).colorScheme).toBe('light');
    // A pick writes the inline variables and survives a theme change; resetAccent goes back to tokens.css.
    setAccent('#ba3873');
    setTheme('light');
    expect(varOf('--accent')).toBe('#ba3873');
    resetAccent();
    expect(varOf('--accent')).toBe('');
    expect(localStorage.getItem('ui-accent')).toBeNull();
  } finally {
    initTheme({ preset: null });
    localStorage.removeItem('ui-theme');
  }
  expect(root.hasAttribute('data-theme-preset')).toBe(false);
  expect(root.getAttribute('data-theme')).toBe('light');
});

test('color-scheme follows the theme: native scrollbars and controls turn dark in dark', () => {
  setTheme('dark');
  expect(getComputedStyle(document.documentElement).colorScheme).toBe('dark');
  setTheme('light');
  expect(getComputedStyle(document.documentElement).colorScheme).toBe('light');
});

test('themeScript applies the stored theme and the picked accent before initTheme, as setAccent would', () => {
  const root = document.documentElement;
  setTheme('light');
  setAccent('#d63384');
  setTheme('dark');
  const want = ['--accent', '--accent-text', '--focus'].map((k) => root.style.getPropertyValue(k));
  // A fresh page: nothing on <html> yet.
  for (const k of ['--accent', '--accent-hover', '--accent-press', '--accent-soft', '--accent-text', '--on-accent', '--focus', '--focus-ring'])
    root.style.removeProperty(k);
  root.removeAttribute('data-theme');
  root.removeAttribute('data-theme-setting');
  new Function(themeScript)();
  expect(root.getAttribute('data-theme')).toBe('dark');
  expect(root.getAttribute('data-theme-setting')).toBe('dark');
  expect(['--accent', '--accent-text', '--focus'].map((k) => root.style.getPropertyValue(k))).toEqual(want);
  // After a theme switch the other theme's tokens are there too.
  setTheme('light');
  const light = root.style.getPropertyValue('--accent-text');
  root.style.removeProperty('--accent-text');
  new Function(themeScript)();
  expect(root.style.getPropertyValue('--accent-text')).toBe(light);
  resetAccent();
  setTheme('auto');
});
