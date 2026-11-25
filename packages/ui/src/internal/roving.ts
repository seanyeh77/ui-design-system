import * as React from 'react';
import { browserKey } from './util';

/** The keyboard of a radio group (RadioGroup, SegmentedControl, ThemePicker, AccentPicker): one Tab stop, the arrow
 *  keys move to the next or previous option and pick it, wrapping at the ends and passing over disabled options.
 *  Returns a ref setter and a keydown handler per option index. */
export function useRovingRadio(n: number, onPick: (index: number) => void, enabled?: (index: number) => boolean) {
  const refs = React.useRef<(HTMLElement | null)[]>([]);
  const pick = React.useRef(onPick);
  const ok = React.useRef(enabled);
  React.useEffect(() => {
    pick.current = onPick;
    ok.current = enabled;
  });
  const ref = React.useCallback(
    (i: number) => (el: HTMLElement | null) => {
      refs.current[i] = el;
    },
    [],
  );
  const onKeyDown = React.useCallback(
    (i: number) => (e: React.KeyboardEvent) => {
      if (browserKey(e)) return;
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      for (let k = 1; k <= n; k++) {
        const to = (i + dir * k + n * k) % n;
        if (ok.current && !ok.current(to)) continue;
        refs.current[to]?.focus();
        pick.current(to);
        return;
      }
    },
    [n],
  );
  return { ref, onKeyDown };
}
