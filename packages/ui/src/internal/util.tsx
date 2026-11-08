import * as React from 'react';

/** Joins the truthy class names. */
export function cx(...names: unknown[]): string {
  return names.filter(Boolean).join(' ');
}

// Puts the numbers of a translated sentence in Geist Mono and leaves the words in the text font.
// The sentence marks each number with \u0001, \u0002 or \u0003 in the order of nums.
export function monoNums(text: string, nums: React.ReactNode[]): React.ReactNode[] {
  const marks = ['\u0001', '\u0002', '\u0003'];
  // eslint-disable-next-line no-control-regex -- the marks are control characters on purpose
  return text.split(/(\u0001|\u0002|\u0003)/).map((t, i) => {
    const k = marks.indexOf(t);
    return k >= 0 ? (
      <span key={i} className="ui-num">
        {nums[k]}
      </span>
    ) : (
      t
    );
  });
}

/** localStorage get (no value) or set; null when storage is blocked. */
export function store(key: string, value?: string): string | null {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked (private mode, sandboxed frame) */
  }
  return null;
}

export function reduced(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { userAgentData?: { platform?: string } }) : undefined;
export const IS_MAC = /mac|iphone|ipad/i.test(nav?.userAgentData?.platform || nav?.platform || nav?.userAgent || '');
/** A touch screen as the main input (phones, tablets): no keyboard to press a shortcut with, no hover. Phones and
 *  tablets report (pointer: coarse); (hover: none) alone is not used, since Chromium keeps it after touch emulation is
 *  turned off and a mouse would then lose its Tooltips. */
export const TOUCH_ONLY = '(pointer: coarse)';
export const SHORTCUT = IS_MAC ? '⌘K' : 'Ctrl K';

/** Matches a media query and follows changes. */
export function useMedia(query: string): boolean {
  const get = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  const [match, setMatch] = React.useState(get);
  React.useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const m = window.matchMedia(query);
    const f = () => setMatch(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [query]);
  return match;
}

/** True under 600 px, the same width where cards stack. */
export function useNarrow(): boolean {
  return useMedia('(max-width: 599px)');
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      return await navigator.clipboard.writeText(text);
    } catch {
      /* fall back below (insecure context, denied permission) */
    }
  }
  const t = document.createElement('textarea');
  t.value = text;
  t.setAttribute('readonly', '');
  t.style.position = 'fixed';
  t.style.opacity = '0';
  document.body.appendChild(t);
  t.select();
  try {
    if (!document.execCommand('copy')) throw new Error('copy failed');
  } finally {
    document.body.removeChild(t);
  }
}

/** Text with every number in Geist Mono and the words in the text font, for labels that mix both (「第 1 週」). */
export function digits(text: string, numbers = /(\d[\d,.:/]*)/): React.ReactNode[] {
  return text.split(numbers).map((t, i) =>
    i % 2 ? (
      <span key={i} className="ui-num">
        {t}
      </span>
    ) : (
      t
    ),
  );
}

/** Alt, Meta or Ctrl held: the key belongs to the browser or the system (Alt+← goes back a page), not to the widget. */
export const browserKey = (e: { altKey: boolean; metaKey: boolean; ctrlKey: boolean }): boolean => e.altKey || e.metaKey || e.ctrlKey;

/** The words in a React node, as a screen reader would read them: strings and numbers, through elements' children. */
export function nodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (React.isValidElement(node)) {
    const props = node.props as { 'aria-label'?: string; label?: unknown; children?: React.ReactNode };
    if (typeof props['aria-label'] === 'string') return props['aria-label'];
    return nodeText(props.children) || (typeof props.label === 'string' ? props.label : '');
  }
  return '';
}
