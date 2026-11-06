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

/** Derives every accent token from one color (自訂強調色的換算 in docs/guidelines.md).
 *  Returns false for anything but #rrggbb. quiet: apply without storing. */
export function setAccent(hex: string, quiet = false): boolean {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
  hex = hex.toLowerCase();
  const root = document.documentElement;
  const dark = root.getAttribute('data-theme') === 'dark';
  const cs = getComputedStyle(root);
  const surface = (cs.getPropertyValue('--surface') || (dark ? '#393530' : '#ffffff')).trim();
  const bg = (cs.getPropertyValue('--bg') || (dark ? '#2f2a25' : '#fcfbfb')).trim();
  // In dark, lighten the text color until it reads on surface (4.5:1).
  let text = hex;
  if (dark) for (let t = 0; t <= 1 && contrast(text, surface) < 4.5; t += 0.05) text = mixHex(hex, '#ffffff', t);
  const ink = '#171512';
  const vars: Record<string, string> = {
    '--accent': hex,
    '--accent-hover': mixHex(hex, '#000000', 0.12),
    '--accent-press': mixHex(hex, '#000000', 0.22),
    '--accent-soft': dark ? mixHex(bg.startsWith('#') ? bg : '#2f2a25', hex, 0.22) : mixHex('#ffffff', hex, 0.12),
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
  if (following || typeof window.matchMedia !== 'function') return;
  following = true;
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (storedTheme() === 'auto') setTheme('auto');
  });
}
