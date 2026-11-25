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
// The browser's tick is never 0, so the first render after hydration renders again with the browser's clock.
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
  React.useSyncExternalStore(subscribe, clientTick, serverTick);
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const text = format.relative(d);
  return (
    // The server's clock and the browser's differ by the time the page takes to load: the text may differ at hydration,
    // and is put right by the render that follows it.
    <time {...rest} dateTime={d.toISOString()} suppressHydrationWarning>
      {children ? children(text) : text}
    </time>
  );
}
