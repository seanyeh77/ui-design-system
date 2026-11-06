import * as React from 'react';
import { format } from '../../format';
import { dropTransition, useMoving } from '../../motion';
import { cx } from '../../internal/util';

export interface TabItem<V extends string = string> {
  id: V;
  label: string;
  /** A count after the label, e.g. how many rows a view has. */
  count?: number;
}

export interface TabsProps<V extends string = string> {
  items: TabItem<V>[];
  value: V;
  onChange?: (id: V) => void;
  /** aria-label of the tab list. */
  label?: string;
  className?: string;
}

/** Views of the same content. The underline moves like a droplet; arrow keys move between tabs. */
export function Tabs<V extends string = string>({ items, value, onChange, label, className }: TabsProps<V>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const track = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<{ left: number; right: number } | null>(null);
  const [forward, setForward] = React.useState(true);
  const [moving, bump] = useMoving();
  const idx = Math.max(0, items.findIndex((t) => t.id === value));
  React.useLayoutEffect(() => {
    const el = refs.current[idx];
    const tr = track.current;
    if (!el || !tr) return;
    setBox({ left: el.offsetLeft, right: tr.clientWidth - el.offsetLeft - el.offsetWidth });
  }, [idx, items.length]);
  const go = (i: number) => {
    if (i === idx || !items[i]) return;
    setForward(i > idx);
    bump();
    onChange?.(items[i].id);
  };
  return (
    <div ref={track} className={cx('ui-tabs', className)} role="tablist" aria-label={label}>
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
            const to = e.key === 'ArrowRight' ? (i + 1) % items.length : e.key === 'ArrowLeft' ? (i - 1 + items.length) % items.length : -1;
            if (to < 0) return;
            e.preventDefault();
            refs.current[to]?.focus();
            go(to);
          }}
        >
          {t.label}
          {t.count != null ? <span className="ui-tab-count">{format.number(t.count)}</span> : null}
        </button>
      ))}
    </div>
  );
}
