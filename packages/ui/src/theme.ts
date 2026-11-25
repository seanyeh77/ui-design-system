import { ensureAnnouncer } from './announce';
import { DEFAULT_ACCENT, GROUNDS, PRESETS, type ThemePreset } from './generated/themeDefaults';
import { installFocusMain } from './internal/focusMain';
import { readStored, writeStored } from './internal/stored';
import { reduced } from './internal/util';

/* Theme and accent color. 'auto' follows prefers-color-scheme; colors cross-fade for 300 ms on a change.
   The choice is kept in localStorage, so initTheme() on the next visit restores it. A preset (data-theme-preset on
   <html>, or initTheme({ preset })) replaces light and dark: the teaching preset is light only. The accent comes from
   tokens.css until the person picks one (setAccent); only then are inline --accent variables written. */

export type ThemeSetting = 'auto' | 'light' | 'dark';
export type { ThemePreset };
export { DEFAULT_ACCENT };

export const THEME_KEY = 'ui-theme';
export const ACCENT_KEY = 'ui-accent';
const PRESET_ATTR = 'data-theme-preset';

const isSetting = (v: string | null): v is ThemeSetting => v === 'auto' || v === 'light' || v === 'dark';
const hasDom = () => typeof window !== 'undefined' && typeof document !== 'undefined';

/** A stored theme setting as text to the setting, 'auto' for anything else. */
export const parseTheme = (raw: string): ThemeSetting => (isSetting(raw) ? raw : 'auto');

/** The stored theme setting, 'auto' when there is none (and on the server). */
export function storedTheme(): ThemeSetting {
  return hasDom() ? parseTheme(readStored(THEME_KEY) ?? '') : 'auto';
}

/** The preset on <html data-theme-preset>, or null (the light and dark themes). */
export function themePreset(): ThemePreset | null {
  if (typeof document === 'undefined') return null;
  const v = document.documentElement.getAttribute(PRESET_ATTR);
  return v && Object.hasOwn(PRESETS, v) ? (v as ThemePreset) : null;
}

function resolveTheme(t: ThemeSetting): 'light' | 'dark' {
  if (t !== 'auto') return t;
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let fadeTimer: ReturnType<typeof setTimeout> | undefined;

/** Switches the theme on <html data-theme> and remembers it. Under a preset the setting is remembered but the
 *  preset stays (the teaching preset is light only). */
export function setTheme(t: ThemeSetting): void {
  if (!hasDom()) return;
  const root = document.documentElement;
  if (!reduced()) {
    root.classList.add('ui-theme-fade');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => root.classList.remove('ui-theme-fade'), 320);
  }
  root.setAttribute('data-theme', themePreset() ?? resolveTheme(t));
  root.setAttribute('data-theme-setting', t);
  writeStored(THEME_KEY, t);
  // The accent's text and soft colors depend on the theme.
  applyAccent();
}

/** Swatches whose color changed so they read as text on every ground: a stored old value moves to the new one. */
const RENAMED_SWATCHES: Record<string, string> = {
  '#8a4fd6': '#864ad1',
  '#c2407a': '#ba3873',
  '#cd3a2f': '#c53228',
  '#b85a0e': '#ab5101',
  '#1a844a': '#077b42',
  '#0e827d': '#027874',
};

/** A stored accent as text to #rrggbb, an old swatch value moved to its current one; null for anything else. */
export function parseAccent(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(v)) return null;
  return RENAMED_SWATCHES[v] ?? v;
}

/** The accent the person picked (stored), with an old swatch value moved to its current one (and stored again);
 *  null when they picked none, so tokens.css decides. */
export function pickedAccent(): string | null {
  if (!hasDom()) return null;
  const raw = readStored(ACCENT_KEY);
  const v = raw ? parseAccent(raw) : null;
  if (v && v !== raw) writeStored(ACCENT_KEY, v);
  return v;
}

/** The accent in use: the picked one, else the preset's accent, else the default (DEFAULT_ACCENT). */
export function storedAccent(): string {
  return pickedAccent() ?? defaultAccent();
}

/** The accent tokens.css gives when nothing is picked: the preset's, else DEFAULT_ACCENT. */
export function defaultAccent(): string {
  const p = themePreset();
  return p ? PRESETS[p].accent : DEFAULT_ACCENT;
}

const hexRgb = (x: string): number[] => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));

/** A CSS color as #rrggbb: #rgb, #rgba, #rrggbb, #rrggbbaa (alpha dropped), rgb() and rgba() with commas or spaces.
 *  null for anything else (a name, a var(), an empty value). Bundlers shorten #ffffff to #fff in tokens.css, so the
 *  short form must read the same. */
export function toHex(c: string): string | null {
  const v = c.trim().toLowerCase();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])[0-9a-f]?$/.exec(v);
  if (short) return '#' + short[1] + short[1] + short[2] + short[2] + short[3] + short[3];
  const long = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/.exec(v);
  if (long) return '#' + long[1];
  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/.exec(v);
  if (fn) {
    const n = fn.slice(1, 4).map(Number);
    if (n.every((x) => x >= 0 && x <= 255)) return '#' + n.map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
  }
  return null;
}

function mixHex(a: string, b: string, t: number): string {
  const p = hexRgb(a);
  const q = hexRgb(b);
  return (
    '#' +
    p
      .map((v, i) =>
        Math.round(v + (q[i] - v) * t)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

function lum(x: string): number {
  const w = [0.2126, 0.7152, 0.0722];
  return hexRgb(x)
    .map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    })
    .reduce((s, v, i) => s + v * w[i], 0);
}

function contrast(a: string, b: string): number {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** The accent's text color (accent-text, and the focus outline): the accent itself when it reads (4.5:1) on bg,
 *  surface and every extra ground passed (setAccent passes surface-sub, surface-chrome and accent-soft); else, in
 *  light, the accent mixed with black 4 % at a time, in dark with white 5 % at a time, until it reads on all of them. */
export function accentText(hex: string, dark: boolean, bg: string, surface: string, ...grounds: string[]): string {
  const all = [bg, surface, ...grounds].map(toHex);
  // A background that cannot be read: keep the accent itself rather than mixing it toward black or white blindly.
  if (all.some((g) => !g)) return hex;
  const reads = (c: string) => all.every((g) => contrast(c, g as string) >= 4.5);
  const toward = dark ? '#ffffff' : '#000000';
  const step = dark ? 0.05 : 0.04;
  let text = hex;
  for (let k = 1; k * step <= 1 && !reads(text); k++) text = mixHex(hex, toward, k * step);
  return text;
}

const INK = GROUNDS.ink.light;

/** The text on an accent fill (on-accent): white or the near-black ink (#171512), whichever contrasts more. */
export function onFill(fill: string): '#ffffff' | '#171512' {
  return contrast('#ffffff', fill) >= contrast(INK, fill) ? '#ffffff' : INK;
}

/** The accent's fill color (accent: buttons, switches, progress, selected marks): the accent itself when it reaches
 *  3:1 on bg, surface and every extra ground passed (setAccent passes surface-sub, surface-chrome and accent-soft) and
 *  its on-accent text reaches 4.5:1 on it; else, in light, the accent mixed with black 4 % at a time, in dark with
 *  white 5 % at a time, until both hold. The preset swatches pass in light as they are. */
export function accentFill(hex: string, dark: boolean, bg: string, surface: string, ...grounds: string[]): string {
  const all = [bg, surface, ...grounds].map(toHex);
  if (all.some((g) => !g)) return hex;
  const ok = (c: string) => all.every((g) => contrast(c, g as string) >= 3) && contrast(onFill(c), c) >= 4.5;
  const toward = dark ? '#ffffff' : '#000000';
  const step = dark ? 0.05 : 0.04;
  let fill = hex;
  for (let k = 1; k * step <= 1 && !ok(fill); k++) fill = mixHex(hex, toward, k * step);
  return fill;
}

/** The preset swatches of AccentPicker. In light (and the teaching preset) each one reads as text by itself (4.5:1 on
 *  bg, surface, surface-sub, surface-chrome and its own accent-soft), so accentText returns it unchanged; white text
 *  reads on it (4.5:1). In dark, accentText lightens it. Checked in tokens-contrast.test.tsx. */
export const ACCENT_SWATCHES: readonly (readonly [name: string, hex: string])[] = [
  ['藍', '#2457d6'],
  ['靛', '#5b4fd6'],
  ['紫', '#864ad1'],
  ['桃紅', '#ba3873'],
  ['紅', '#c53228'],
  ['橘', '#ab5101'],
  ['綠', '#077b42'],
  ['青', '#027874'],
];

const ACCENT_VARS = ['--accent', '--accent-hover', '--accent-press', '--accent-soft', '--accent-text', '--on-accent', '--focus', '--focus-ring'];

/** Derives every accent token from one color (自訂強調色的換算 in docs/theme.md) and writes them on <html>.
 *  Returns false for anything but #rrggbb. quiet: apply without storing. */
export function setAccent(hex: string, quiet = false): boolean {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
  if (!hasDom()) return true;
  hex = hex.toLowerCase();
  const root = document.documentElement;
  const dark = root.getAttribute('data-theme') === 'dark';
  const mode = dark ? 'dark' : 'light';
  const cs = getComputedStyle(root);
  // Read the theme's colors as #rrggbb (bundlers may have shortened #ffffff to #fff); the theme's defaults when unset.
  const surface = toHex(cs.getPropertyValue('--surface')) ?? GROUNDS.surface[mode];
  const bg = toHex(cs.getPropertyValue('--bg')) ?? GROUNDS.bg[mode];
  const sub = toHex(cs.getPropertyValue('--surface-sub')) ?? GROUNDS['surface-sub'][mode];
  const chrome = toHex(cs.getPropertyValue('--surface-chrome')) ?? GROUNDS['surface-chrome'][mode];
  const soft = dark ? mixHex(surface, hex, 0.22) : mixHex('#ffffff', hex, 0.12);
  // Text in the accent also sits on zebra rows, code blocks, the top bar and its own soft fill (a selected row).
  const text = accentText(hex, dark, bg, surface, sub, chrome, soft);
  // The fill reaches 3:1 on the same grounds (a checked box in a selected row); hover and press go away from the page:
  // darker in light, lighter in dark, so they keep 3:1 and their text.
  const fill = accentFill(hex, dark, bg, surface, sub, chrome, soft);
  const away = dark ? '#ffffff' : '#000000';
  const vars: Record<string, string> = {
    '--accent': fill,
    '--accent-hover': mixHex(fill, away, 0.12),
    '--accent-press': mixHex(fill, away, 0.22),
    '--accent-soft': soft,
    '--accent-text': text,
    '--on-accent': onFill(fill),
    // One focus style everywhere: a 2 px outline in the accent's text color, 3:1 or more on every ground.
    '--focus': text,
    // Old name of --focus, kept for pages written before it.
    '--focus-ring': text,
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  if (!quiet) writeStored(ACCENT_KEY, hex);
  return true;
}

/** Forgets the picked accent and removes the inline accent variables, so tokens.css (the theme or preset) decides. */
export function resetAccent(): void {
  if (!hasDom()) return;
  for (const k of ACCENT_VARS) document.documentElement.style.removeProperty(k);
  writeStored(ACCENT_KEY, null);
}

/** Applies the picked accent for the current theme, or removes the inline variables when none is picked. */
function applyAccent(): void {
  const picked = pickedAccent();
  if (picked) setAccent(picked, true);
  else for (const k of ACCENT_VARS) document.documentElement.style.removeProperty(k);
}

let following = false;

/** Applies the stored theme and accent; call once when the page starts. preset: a preset of tokens.json (such as
 *  'teaching') that replaces light and dark, kept on <html data-theme-preset>; null removes it; without the option a
 *  data-theme-preset already on <html> is kept. Pages do not set data-theme themselves. */
export function initTheme(options: { preset?: ThemePreset | null } = {}): void {
  if (!hasDom()) return;
  const root = document.documentElement;
  if (options.preset === null) root.removeAttribute(PRESET_ATTR);
  else if (options.preset) root.setAttribute(PRESET_ATTR, options.preset);
  setTheme(storedTheme());
  ensureAnnouncer();
  installFocusMain();
  if (following || typeof window.matchMedia !== 'function') return;
  following = true;
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (storedTheme() === 'auto') setTheme('auto');
  });
}

/** The text color for something drawn on a fill (a heat-scale zone, a status band): the near-black ink of the light
 *  theme (#171512) or white, whichever contrasts more with the fill. `fill` is a color (#hex, rgb()) or a token name
 *  such as 'heat-6', read from el (default: the root) so it follows the theme. Every step of heat-*, diverge-* and
 *  chart-* reaches 4.5:1 with its pick. Unreadable colors give the near-black ink. */
export function textOn(fill: string, el?: Element): '#171512' | '#ffffff' {
  let c = fill.trim();
  if (/^[a-z][a-z0-9-]*$/.test(c) && typeof document !== 'undefined') c = getComputedStyle(el ?? document.documentElement).getPropertyValue('--' + c);
  const hex = toHex(c);
  if (!hex) return '#171512';
  return contrast(hex, '#171512') >= contrast(hex, '#ffffff') ? '#171512' : '#ffffff';
}

/** The heat-scale token for a value: min (or below) is heat-1, max (or above) is heat-7, evenly in between. */
export function heatToken(value: number, min: number, max: number): `heat-${1 | 2 | 3 | 4 | 5 | 6 | 7}` {
  const t = max > min ? (value - min) / (max - min) : 0;
  const step = Math.min(7, Math.max(1, Math.round(t * 6) + 1)) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
  return `heat-${step}`;
}

/** The diverging-scale token for a difference: within ±zero it is diverge-zero; from ±strong on, the -strong step. */
export function divergeToken(
  diff: number,
  limits: { zero: number; strong: number },
): 'diverge-neg-strong' | 'diverge-neg' | 'diverge-zero' | 'diverge-pos' | 'diverge-pos-strong' {
  const a = Math.abs(diff);
  if (a <= limits.zero) return 'diverge-zero';
  const strong = a >= limits.strong;
  return diff < 0 ? (strong ? 'diverge-neg-strong' : 'diverge-neg') : strong ? 'diverge-pos-strong' : 'diverge-pos';
}
