import * as React from 'react';
import { format } from '../../format';
import { useLocale } from '../../locale';

/* One interval for every RelativeTime on the page: it runs while at least one is shown and ticks once a minute. */
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let tick = 0;
const TICK_MS = 60_000;

function subscribe(f: () => void): () => void {
  listeners.add(f);
  if (!timer)
    timer = setInterval(() => {
      tick = Date.now();
      listeners.forEach((g) => g());
    }, TICK_MS);
  return () => {
    listeners.delete(f);
    if (!listeners.size) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}
// The browser's tick is never 0. The server render and the hydration pass read 0 and show the full date and time; the
// render React does right after hydration reads the browser's tick and swaps in the relative text.
const clientTick = () => tick || (tick = Date.now());
const serverTick = () => 0;

export interface RelativeTimeProps extends Omit<React.ComponentPropsWithRef<'time'>, 'children' | 'dateTime'> {
  /** The moment: a Date, an ISO string or milliseconds. */
  value: Date | string | number;
  /** Wraps the shown text, e.g. to mark a search match. Default: the text as it is. */
  children?: (text: string) => React.ReactNode;
}

/** 「2 小時前」、「昨天」 in a `<time>` element that stays current: every RelativeTime on the page renders again once a
 *  minute from one shared interval. Older than a week: the full date and time (format.relative). */
export function RelativeTime({ value, children, ...rest }: RelativeTimeProps) {
  useLocale();
  const now = React.useSyncExternalStore(subscribe, clientTick, serverTick);
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // On the server and in the hydration pass (now is 0): the full date and time, which does not depend on the clock.
  const hydrating = now === 0;
  const text = hydrating ? format.dateTime(d) : format.relative(d);
  return (
    // The key changes once the browser's clock is read, so React replaces the element instead of keeping the server's
    // text: suppressHydrationWarning alone keeps the server DOM, and a later render with the same text never patches it.
    <time key={hydrating ? 's' : 'c'} {...rest} dateTime={d.toISOString()} suppressHydrationWarning>
      {children ? children(text) : text}
    </time>
  );
}
