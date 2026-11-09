import * as React from 'react';
import { format } from '../../format';
import { dropTransition, useMoving } from '../../motion';
import { cx, browserKey } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { useFocusRescue } from '../../internal/focus';
import { announce } from '../../announce';
import { unitFor, type CountUnit } from '../../i18n';

export interface TabItem<V extends string = string> {
  id: V;
  label: string;
  /** A count after the label, e.g. how many rows a view has. */
  count?: number;
  /** Unit after this tab's count, e.g. 「筆」, or a function of the count for plurals. Default: the list's unit. */
  unit?: CountUnit;
}

export interface TabsProps<V extends string = string> {
  items: TabItem<V>[];
  value: V;
  onChange?: (id: V) => void;
  /** aria-label of the tab list. */
  label?: string;
  /** Unit after every count, e.g. 「筆」 or 「個」: a number carries its unit. A function gets the count, for plurals:
   *  `(n) => (n === 1 ? 'item' : 'items')`. */
  unit?: CountUnit;
  className?: string;
}

/** Views of the same content. The underline moves like a droplet; arrow keys move between tabs. */
export function Tabs<V extends string = string>({ items, value, onChange, label, unit, className }: TabsProps<V>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const track = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<{ left: number; right: number } | null>(null);
  const [forward, setForward] = React.useState(true);
  const [moving, bump] = useMoving();
  // Wider than its box (G0): a fade on the side that has more tabs, and the selected tab kept in view.
  const [more, setMore] = React.useState({ left: false, right: false });
  const edges = React.useCallback(() => {
    const el = track.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
  }, []);
  // The focused tab re-rendered away (new items, the app swapped the list): focus goes to the selected tab.
  useFocusRescue(
    track,
    () =>
      refs.current[
        Math.max(
          0,
          items.findIndex((t) => t.id === value),
        )
      ],
  );
  devWarn(
    items.some((t) => t.count != null && !(t.unit || unit)),
    'Tabs',
    "a count has no unit, so it reads as a bare number. Pass unit, e.g. unit: '筆', on Tabs or on the item.",
  );
  const idx = Math.max(
    0,
    items.findIndex((t) => t.id === value),
  );
  React.useLayoutEffect(() => {
    const el = refs.current[idx];
    const tr = track.current;
    if (!el || !tr) return;
    // Counts, fonts and the container change tab widths without changing the selection.
    const measure = () => {
      // Both sides from the row's own box: a tab past the visible part gets a negative right, and scrolls with the row.
      setBox({ left: el.offsetLeft, right: tr.clientWidth - el.offsetLeft - el.offsetWidth });
      edges();
    };
    measure();
    // The selected tab in view, without scrolling the page.
    if (el.offsetLeft < tr.scrollLeft) tr.scrollLeft = el.offsetLeft - 4;
    else if (el.offsetLeft + el.offsetWidth > tr.scrollLeft + tr.clientWidth) tr.scrollLeft = el.offsetLeft + el.offsetWidth - tr.clientWidth + 4;
    const ro = new ResizeObserver(measure);
    ro.observe(tr);
    for (const t of refs.current) if (t) ro.observe(t);
    return () => ro.disconnect();
  }, [idx, items.length, edges]);
  const go = (i: number) => {
    if (i === idx || !items[i]) return;
    setForward(i > idx);
    bump();
    onChange?.(items[i].id);
    announce(
      items[i].label +
        (items[i].count != null
          ? ' ' + format.number(items[i].count ?? 0) + (items[i].unit || unit ? ' ' + unitFor(items[i].unit || unit, items[i].count ?? 0) : '')
          : ''),
    );
  };
  return (
    <div
      ref={track}
      className={cx('ui-tabs', more.left && 'has-more-left', more.right && 'has-more-right', className)}
      role="tablist"
      aria-label={label}
      onScroll={edges}
    >
      {box ? (
        <span
          className="ui-tabs-ind"
          aria-hidden="true"
          style={{ left: box.left, right: box.right, transform: moving ? 'scaleY(.82)' : 'none', transition: dropTransition('left', 'right', forward) }}
        />
      ) : null}
      {items.map((t, i) => (
        <button
          key={t.id}
          ref={(n) => {
            refs.current[i] = n;
          }}
          type="button"
          role="tab"
          aria-selected={i === idx}
          tabIndex={i === idx ? 0 : -1}
          className={cx('ui-tab', i === idx && 'is-selected')}
          onClick={() => go(i)}
          onKeyDown={(e) => {
            if (browserKey(e)) return;
            const to = e.key === 'ArrowRight' ? (i + 1) % items.length : e.key === 'ArrowLeft' ? (i - 1 + items.length) % items.length : -1;
            if (to < 0) return;
            e.preventDefault();
            refs.current[to]?.focus();
            go(to);
          }}
        >
          {t.label}
          {/* A space between the name and its count, also for screen readers: 「全部 26 個」. */}
          {t.count != null ? ' ' : null}
          {t.count != null ? (
            <span className="ui-tab-count">
              {format.number(t.count)}
              {t.unit || unit ? (
                <>
                  {' '}
                  <span className="ui-unit">{unitFor(t.unit || unit, t.count)}</span>
                </>
              ) : null}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
