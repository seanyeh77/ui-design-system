import * as React from 'react';
import { tr } from '../../i18n';
import { browserKey, cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';

export interface SplitPaneProps {
  /** The main area, on the left. */
  a: React.ReactNode;
  /** The side panel, on the right; its width is what the divider changes. */
  b: React.ReactNode;
  /** px. The side panel's width at first and after a double-click on the divider. Default 420. */
  defaultB?: number;
  /** px. The main area never gets narrower than this. Default 360. */
  minA?: number;
  /** px. The side panel never gets narrower than this. Default 280. */
  minB?: number;
  /** Remembers the side panel's width in localStorage under this name. Without it the width lasts until the page reloads. */
  storageKey?: string;
  /** Names the divider for screen readers. Default 「調整面板寬度」. */
  label?: string;
  /** After every change, with the side panel's new width in px. */
  onResize?: (b: number) => void;
  className?: string;
}

/** Width of the divider between the two areas, in px; a 48 px hit area is drawn over it. */
const HANDLE = 16;
/** Narrower than this (px, the component's own width), the two areas stack and the divider goes away. */
const STACK = 960;
/** One arrow key press, in px. */
const STEP = 16;

const read = (key: string | undefined): number | null => {
  if (!key) return null;
  try {
    const v = Number(window.localStorage.getItem('ui-split:' + key));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
};
const write = (key: string | undefined, v: number) => {
  if (!key) return;
  try {
    window.localStorage.setItem('ui-split:' + key, String(Math.round(v)));
  } catch {
    // Storage blocked or full: the width still changes, it is just not remembered.
  }
};

/** A main area and a side panel with a divider between them that can be dragged, moved with the arrow keys and reset
 *  with a double-click. Under 960 px (its own width) the two stack, side panel below, without the divider. */
export function SplitPane({ a, b, defaultB = 420, minA = 360, minB = 280, storageKey, label, onResize, className }: SplitPaneProps) {
  devWarn(defaultB < minB, 'SplitPane', `defaultB (${defaultB} px) is under minB (${minB} px): the panel starts at ${minB} px. Raise defaultB or lower minB.`);
  const root = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  // The stored width, read on the first render in the browser. The grid columns are set only once the component has
  // measured itself, so the server's render and the first one in the browser match.
  const [side, setSide] = React.useState(() => (typeof window === 'undefined' ? null : read(storageKey)) ?? defaultB);
  const [drag, setDrag] = React.useState(false);
  // Read by the move and up handlers: a move can come before the render that follows the press.
  const dragging = React.useRef(false);
  const id = React.useId();
  React.useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const stacked = width > 0 && width < STACK;
  // The side panel's width as it can be now: both areas keep their minimum.
  const maxB = Math.max(minB, width - HANDLE - minA);
  const shown = Math.round(Math.min(maxB, Math.max(minB, side)));
  const valueA = Math.max(0, width - HANDLE - shown);
  // The width after the last move, for the release that stores it (the render with it may not have happened yet).
  const latest = React.useRef(shown);
  const set = (v: number, keep = true) => {
    const next = Math.round(Math.min(maxB, Math.max(minB, v)));
    latest.current = next;
    setSide(next);
    if (keep) write(storageKey, next);
    onResize?.(next);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (browserKey(e)) return;
    // The value is the main area's width: ← makes it narrower (the panel wider), Home makes it as narrow as it goes.
    const to =
      e.key === 'ArrowLeft'
        ? shown + STEP
        : e.key === 'ArrowRight'
          ? shown - STEP
          : e.key === 'Home'
            ? maxB
            : e.key === 'End'
              ? minB
              : e.key === 'Enter'
                ? defaultB
                : null;
    if (to == null) return;
    e.preventDefault();
    set(to);
  };
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    // Keeps getting the moves when the pointer leaves the divider (a fast drag).
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // No such pointer (a synthetic event): moves still come while over the divider.
    }
    e.currentTarget.focus({ preventScroll: true });
    dragging.current = true;
    setDrag(true);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !root.current) return;
    const r = root.current.getBoundingClientRect();
    set(r.right - e.clientX - HANDLE / 2, false);
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    setDrag(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Already released.
    }
    if (root.current) write(storageKey, latest.current);
  };
  return (
    <div
      ref={root}
      className={cx('ui-split', stacked && 'is-stacked', drag && 'is-dragging', className)}
      style={stacked || !width ? undefined : { gridTemplateColumns: `minmax(0, 1fr) ${HANDLE}px ${shown}px` }}
    >
      <div className="ui-split-a">{a}</div>
      {stacked ? null : (
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={label || tr('調整面板寬度')}
          aria-controls={id}
          aria-valuenow={valueA}
          aria-valuemin={minA}
          aria-valuemax={Math.max(minA, width - HANDLE - minB)}
          aria-valuetext={tr('主要區域 {a} px，面板 {b} px', { a: valueA, b: shown })}
          className="ui-split-handle"
          onKeyDown={onKey}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onDoubleClick={() => set(defaultB)}
        />
      )}
      <div id={id} className="ui-split-b">
        {b}
      </div>
    </div>
  );
}
