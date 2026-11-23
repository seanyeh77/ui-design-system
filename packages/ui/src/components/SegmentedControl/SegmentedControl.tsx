import * as React from 'react';
import { dropTransition } from '../../motion';
import { cx, browserKey, resizeObserver } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { IconOf, type IconSource } from '../../icons/Icon';
import { Tooltip } from '../Tooltip/Tooltip';

export interface SegmentedItem<V extends string = string> {
  id: V;
  /** The words: shown, or with `iconOnly` the tooltip and what screen readers say. */
  label: string;
  /** Phosphor icon name or element; required with `iconOnly`. */
  icon?: IconSource;
}

export interface SegmentedControlProps<V extends string = string> {
  items: SegmentedItem<V>[];
  value: V;
  onChange?: (id: V) => void;
  /** What the choice is about, for screen readers, e.g. 「顯示方式」. */
  label: string;
  /** Icons only, 28 px each, the words in a tooltip; for a bar such as Workbench's mainBar. Default false. */
  iconOnly?: boolean;
  className?: string;
}

/** A small switch between two or three ways of showing the same thing (預覽／原始碼), 28 px tall to sit in a toolbar
 *  or Workbench's mainBar. The selected part is a raised white pill that slides; ← → move and pick. For views of
 *  different content use Tabs. */
export function SegmentedControl<V extends string = string>({ items, value, onChange, label, iconOnly = false, className }: SegmentedControlProps<V>) {
  devWarn(
    iconOnly && items.some((t) => !t.icon),
    'SegmentedControl',
    'iconOnly 需要每一項都有 icon；沒有圖示的那一項只剩空白。補上 icon，或拿掉 iconOnly 改顯示文字。',
  );
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(
    0,
    items.findIndex((t) => t.id === value),
  );
  const [box, setBox] = React.useState<{ left: number; width: number } | null>(null);
  const [forward, setForward] = React.useState(true);
  React.useLayoutEffect(() => {
    const el = refs.current[idx];
    if (!el) return;
    const measure = () => setBox({ left: el.offsetLeft, width: el.offsetWidth });
    measure();
    const ro = resizeObserver(measure);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [idx, items.length]);
  const go = (i: number) => {
    if (i === idx || !items[i]) return;
    setForward(i > idx);
    onChange?.(items[i].id);
  };
  return (
    <div className={cx('ui-seg', iconOnly && 'is-icons', className)} role="radiogroup" aria-label={label}>
      {box ? (
        <span className="ui-seg-ind" aria-hidden="true" style={{ left: box.left, width: box.width, transition: dropTransition('left', 'width', forward) }} />
      ) : null}
      {items.map((t, i) => {
        const btn = (
          <button
            key={t.id}
            ref={(n) => {
              refs.current[i] = n;
            }}
            type="button"
            role="radio"
            aria-checked={i === idx}
            aria-label={iconOnly ? t.label : undefined}
            tabIndex={i === idx ? 0 : -1}
            className={cx('ui-seg-item', i === idx && 'is-selected')}
            onClick={() => go(i)}
            onKeyDown={(e) => {
              if (browserKey(e)) return;
              const n = items.length;
              const to = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n : -1;
              if (to < 0) return;
              e.preventDefault();
              refs.current[to]?.focus();
              go(to);
            }}
          >
            {t.icon ? <IconOf icon={t.icon} size={16} filled={iconOnly && i === idx} /> : null}
            {iconOnly ? null : <span>{t.label}</span>}
          </button>
        );
        return iconOnly ? (
          <Tooltip key={t.id} label={t.label} describe={false} side="bottom">
            {btn}
          </Tooltip>
        ) : (
          btn
        );
      })}
    </div>
  );
}
