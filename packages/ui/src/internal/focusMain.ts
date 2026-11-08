/** Moves keyboard and screen-reader focus to the page's content: its first heading inside main (or the top bar's title),
 *  else main itself. Call it after the app changes page, e.g. when a CommandPalette result opens another page. */
export function focusMain(): void {
  if (typeof document === 'undefined') return;
  const main = document.querySelector<HTMLElement>('main');
  const target = main?.querySelector<HTMLElement>('h1, h2') ?? document.querySelector<HTMLElement>('.ui-topbar-title') ?? main;
  if (!target) return;
  if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus();
}
