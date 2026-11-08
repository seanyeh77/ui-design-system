import * as React from 'react';
import { focusMain } from './focusMain';

/** True when focus has fallen out of the page's content: nothing focused, or the body. */
const lost = () => !document.activeElement || document.activeElement === document.body;

/** For a dialog-like overlay opened by the open prop: remembers what had focus when it opened and gives focus back
 *  when it closes. When that element is gone (the app changed page), focus goes to the main content. */
export function useReturnFocus(open: boolean): void {
  const opener = React.useRef<HTMLElement | null>(null);
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (open && !wasOpen.current) {
      const a = document.activeElement;
      opener.current = a instanceof HTMLElement && a !== document.body ? a : null;
    }
    if (!open && wasOpen.current) {
      const back = opener.current;
      opener.current = null;
      // After the overlay's own focus handling and the app's page change have run.
      const t = setTimeout(() => {
        if (!lost()) return;
        if (back?.isConnected) back.focus();
        else focusMain();
      }, 0);
      wasOpen.current = open;
      return () => clearTimeout(t);
    }
    wasOpen.current = open;
  }, [open]);
}

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]), input:not([disabled]), [role="tab"]';

/** When the focused control inside the container is removed or replaced (a button that turns into another), focus
 *  moves to the control now at its place, else the one before it, else `fallback()`, instead of falling to the body. */
export function useFocusRescue(ref: React.RefObject<HTMLElement | null>, fallback?: () => HTMLElement | null | undefined): void {
  const fb = React.useRef(fallback);
  React.useEffect(() => {
    fb.current = fallback;
  });
  React.useEffect(() => {
    const box = ref.current;
    if (!box) return;
    let last: HTMLElement | null = null;
    let index = -1;
    const list = () => Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((e) => e.getClientRects().length > 0 && !e.matches(':disabled'));
    const onIn = (e: FocusEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      last = e.target;
      index = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).indexOf(last);
    };
    const rescue = () => {
      const now = list();
      const next = fb.current?.() ?? now[Math.min(index, now.length - 1)] ?? null;
      last = null;
      if (next) next.focus();
      else focusMain();
    };
    let frame = 0;
    const mo = new MutationObserver(() => {
      // Gone, or still there but disabled (a disabled control drops focus too).
      if (!last || (last.isConnected && !last.matches(':disabled'))) return;
      if (lost()) return rescue();
      // The browser moves focus off a control it just disabled at its next rendering update, not at once: look again
      // then. Rescue when focus fell to the page, or still sits on the dead control; not when it went somewhere else.
      const dead = last;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (last === dead && (lost() || document.activeElement === dead)) rescue();
        });
      });
    });
    box.addEventListener('focusin', onIn);
    mo.observe(box, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    return () => {
      box.removeEventListener('focusin', onIn);
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}
