/* One polite live region for the whole page: components and apps report what changed without moving focus. */

let region: HTMLElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Creates the live region if it is not on the page yet. A region that exists before its text changes is read more
 *  reliably, so AppShell and initTheme call this early. */
export function ensureAnnouncer(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (region?.isConnected) return region;
  region = document.querySelector<HTMLElement>('[data-ui-announcer]');
  if (!region) {
    region = document.createElement('div');
    region.className = 'ui-visually-hidden';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('data-ui-announcer', '');
    document.body.appendChild(region);
  }
  return region;
}

/** Says text to screen readers through the page's polite live region, without moving focus: 「顯示 6 筆」.
 *  A second call before the first is read replaces it. */
export function announce(text: string): void {
  const el = ensureAnnouncer();
  if (!el || !text) return;
  el.textContent = '';
  if (timer) clearTimeout(timer);
  // Cleared first and filled a moment later, so the same text twice in a row is read again.
  timer = setTimeout(() => {
    el.textContent = text;
  }, 60);
}
