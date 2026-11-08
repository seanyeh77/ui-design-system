// How the person last acted: a key, or a pointer (mouse, pen, touch). The heading focusMain() moves to shows a bar on
// its left only after a key: someone who changed page with a mouse sees no change.
let lastInput: 'key' | 'pointer' = 'pointer';
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', () => (lastInput = 'key'), true);
  document.addEventListener('pointerdown', () => (lastInput = 'pointer'), true);
}

/** Moves keyboard and screen-reader focus to the page's content: its first heading inside main (or the top bar's title),
 *  else main itself. Call it after the app changes page, e.g. when a CommandPalette result opens another page. The
 *  heading gets no focus ring: a 3 px accent bar on its left after a key press, nothing after a mouse or touch. */
export function focusMain(): void {
  if (typeof document === 'undefined') return;
  const main = document.querySelector<HTMLElement>('main');
  const target = main?.querySelector<HTMLElement>('h1, h2') ?? document.querySelector<HTMLElement>('.ui-topbar-title') ?? main;
  if (!target) return;
  if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.setAttribute('data-ui-main-focus', lastInput);
  target.focus({ preventScroll: false });
}
