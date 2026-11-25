import * as React from 'react';

/* A value kept in localStorage that renders the same on the server and on the first render in the browser.
   The server snapshot is the fallback; React then re-renders with the stored value right after hydration, so the
   markup never differs. Other tabs and other components with the same key follow through the `storage` event and an
   in-page notification. Where storage is blocked or full the value is kept in memory for this page instead. */

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
// Values that could not be written (storage blocked or full), with what storage held then (undefined: it could not be
// read): kept so the change still shows on this page, until storage holds something else (changed by other code).
const memory = new Map<string, { raw: string | null; under: string | null | undefined }>();
let listening = false;

function notify(key: string | null): void {
  if (key === null) {
    for (const set of listeners.values()) for (const f of set) f();
    return;
  }
  listeners.get(key)?.forEach((f) => f());
}

function subscribe(key: string, f: Listener): () => void {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(f);
  if (!listening && typeof window !== 'undefined') {
    listening = true;
    // Another tab changed the value (key null: that tab cleared all storage).
    window.addEventListener('storage', (e) => notify(e.key));
  }
  return () => {
    set.delete(f);
    if (!set.size) listeners.delete(key);
  };
}

/** The stored text for a key, or null; after a write that failed, the value kept in memory for this page. */
export function readStored(key: string): string | null {
  const kept = memory.get(key);
  let now: string | null;
  try {
    now = localStorage.getItem(key);
  } catch {
    return kept ? kept.raw : null;
  }
  if (!kept) return now;
  if (kept.under === now) return kept.raw;
  // Storage changed since the failed write: it wins.
  memory.delete(key);
  return now;
}

/** Stores the text (null removes it) and tells every component that reads the key. */
export function writeStored(key: string, raw: string | null): void {
  try {
    if (raw === null) localStorage.removeItem(key);
    else localStorage.setItem(key, raw);
    memory.delete(key);
  } catch {
    // Storage blocked or full: it works the same for this page, without remembering.
    let under: string | null | undefined;
    try {
      under = localStorage.getItem(key);
    } catch {
      under = undefined;
    }
    memory.set(key, { raw, under });
  }
  notify(key);
}

const serverNull = () => null;

/** A value stored in localStorage under key, the same on the server and the first browser render (fallback), then
 *  the stored value. parse turns the stored text into the value (throwing gives the fallback); pass a function that
 *  stays the same between renders (module level or useCallback). serialize turns a value into text, null to remove
 *  it; by default strings as they are, null and undefined removed, anything else as JSON. An undefined key keeps the value in memory only. */
export function useStored<T>(
  key: string | undefined,
  parse: (raw: string) => T,
  fallback: T,
  serialize: (v: T) => string | null = (v) => (v == null ? null : typeof v === 'string' ? v : JSON.stringify(v)),
): [T, (v: T) => void] {
  const sub = React.useCallback((f: Listener) => (key ? subscribe(key, f) : () => {}), [key]);
  const snap = React.useCallback(() => (key ? readStored(key) : null), [key]);
  const raw = React.useSyncExternalStore(sub, snap, serverNull);
  const [mem, setMem] = React.useState<{ v: T } | null>(null);
  const parsed = React.useMemo(() => {
    if (raw === null) return null;
    try {
      return { v: parse(raw) };
    } catch {
      return null;
    }
  }, [raw, parse]);
  const set = React.useCallback(
    (v: T) => {
      if (key) writeStored(key, serialize(v));
      else setMem({ v });
    },
    // serialize is usually inline: what it does does not change between renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  const value = key ? (parsed ? parsed.v : fallback) : mem ? mem.v : fallback;
  return [value, set];
}

/** parse for a stored text kept as it is. */
export const asText = (raw: string): string => raw;
