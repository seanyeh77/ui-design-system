import { ensureAnnouncer } from './announce';
import { reduced, store } from './internal/util';

/* Theme and accent color. 'auto' follows prefers-color-scheme; colors cross-fade for 300 ms on a change.
   The choice is kept in localStorage, so initTheme() on the next visit restores it. */

export type ThemeSetting = 'auto' | 'light' | 'dark';

const THEME_KEY = 'ui-theme';
export const ACCENT_KEY = 'ui-accent';
export const DEFAULT_ACCENT = '#2457d6';

const isSetting = (v: string | null): v is ThemeSetting => v === 'auto' || v === 'light' || v === 'dark';

/** The stored theme setting, 'auto' when there is none. */
export function storedTheme(): ThemeSetting {
  const v = store(THEME_KEY);
  return isSetting(v) ? v : 'auto';
}

function resolveTheme(t: ThemeSetting): 'light' | 'dark' {
  if (t !== 'auto') return t;
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let fadeTimer: ReturnType<typeof setTimeout> | undefined;

/** Switches the theme on <html data-theme> and remembers it. */
export function setTheme(t: ThemeSetting): void {
  const root = document.documentElement;
  if (!reduced()) {
    root.classList.add('ui-theme-fade');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => root.classList.remove('ui-theme-fade'), 320);
  }
  root.setAttribute('data-theme', resolveTheme(t));
  root.setAttribute('data-theme-setting', t);
  store(THEME_KEY, t);
  // The accent's text and soft colors depend on the theme.
  setAccent(store(ACCENT_KEY) || DEFAULT_ACCENT, true);
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

/** The accent's text color (accent-text): the accent itself when it reads on both bg and surface (4.5:1); else, in
 *  light, the accent mixed with black 4 % at a time, in dark with white 5 % at a time, until it reads on both. Only
 *  text changes: fills, bars, rings and dots keep the accent. */
export function accentText(hex: string, dark: boolean, bg: string, surface: string): string {
  const b = toHex(bg);
  const s = toHex(surface);
  // A background that cannot be read: keep the accent itself rather than mixing it toward black or white blindly.
  if (!b || !s) return hex;
  const reads = (c: string) => contrast(c, b) >= 4.5 && contrast(c, s) >= 4.5;
  const toward = dark ? '#ffffff' : '#000000';
  const step = dark ? 0.05 : 0.04;
  let text = hex;
  for (let k = 1; k * step <= 1 && !reads(text); k++) text = mixHex(hex, toward, k * step);
  return text;
}

/** Derives every accent token from one color (自訂強調色的換算 in docs/theme.md).
 *  Returns false for anything but #rrggbb. quiet: apply without storing. */
export function setAccent(hex: string, quiet = false): boolean {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
  hex = hex.toLowerCase();
  const root = document.documentElement;
  const dark = root.getAttribute('data-theme') === 'dark';
  const cs = getComputedStyle(root);
  // Read the theme's colors as #rrggbb (bundlers may have shortened #ffffff to #fff); the theme's defaults when unset.
  const surface = toHex(cs.getPropertyValue('--surface')) ?? (dark ? '#393530' : '#ffffff');
  const bg = toHex(cs.getPropertyValue('--bg')) ?? (dark ? '#2f2a25' : '#fcfbfb');
  const text = accentText(hex, dark, bg, surface);
  const ink = '#171512';
  const vars: Record<string, string> = {
    '--accent': hex,
    '--accent-hover': mixHex(hex, '#000000', 0.12),
    '--accent-press': mixHex(hex, '#000000', 0.22),
    '--accent-soft': dark ? mixHex(bg, hex, 0.22) : mixHex('#ffffff', hex, 0.12),
    '--accent-text': text,
    '--on-accent': contrast('#ffffff', hex) >= contrast(ink, hex) ? '#ffffff' : ink,
    '--focus-ring': `rgba(${hexRgb(hex).join(', ')}, 0.3)`,
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  if (!quiet) store(ACCENT_KEY, hex);
  return true;
}

let following = false;

/** Applies the stored theme and accent; call once when the page starts. */
export function initTheme(): void {
  setTheme(storedTheme());
  ensureAnnouncer();
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
