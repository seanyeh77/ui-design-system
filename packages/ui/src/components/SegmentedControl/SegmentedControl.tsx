import * as React from 'react';
import { dropTransition } from '../../motion';
import { cx, resizeObserver } from '../../internal/util';
import { useRovingRadio } from '../../internal/roving';
import { devWarn } from '../../internal/dev';
import { IconOf, type IconSource } from '../../icons/Icon';
import { Tooltip } from '../Tooltip/Tooltip';

export interface SegmentedOption<V extends string = string> {
  /** What onChange receives. */
  value: V;
  /** The words: shown, or with `iconOnly` the tooltip and what screen readers say. */
  label: string;
  /** Phosphor icon name or element; required with `iconOnly`. */
  icon?: IconSource;
}

/** @deprecated use SegmentedOption ({ value, label, icon }). */
export interface SegmentedItem<V extends string = string> {
  id: V;
  label: string;
  icon?: IconSource;
}

export interface SegmentedControlProps<V extends string = string> {
  /** The ways to show, 2 or 3, each { value, label, icon }. */
  options?: SegmentedOption<V>[];
  /** @deprecated use options ({ value, label, icon }); items ({ id, … }) still works for now. */
  items?: SegmentedItem<V>[];
  /** The chosen value. */
  value: V;
  /** Receives the chosen value. */
  onChange?: (value: V) => void;
  /** What the choice is about, for screen readers, e.g. 「顯示方式」. */
  label: string;
  /** Icons only, the words in a tooltip; for a bar such as Workbench's mainBar. Default false. */
  iconOnly?: boolean;
  className?: string;
}

/** A small switch between two or three ways of showing the same thing (預覽／原始碼), 40 px tall like the other
 *  controls of a toolbar (28 px inside Workbench's 36 px mainBar). The selected part is a raised pill that slides;
 *  ← → move and pick. For views of different content use Tabs. */
export function SegmentedControl<V extends string = string>({
  options,
  items: oldItems,
  value,
  onChange,
  label,
  iconOnly = false,
  className,
}: SegmentedControlProps<V>) {
  devWarn(!!oldItems, 'SegmentedControl', 'items is deprecated: pass options={[{ value, label, icon }]} (value in place of id).');
  const items = options ?? (oldItems ?? []).map((t) => ({ value: t.id, label: t.label, icon: t.icon }));
  devWarn(
    iconOnly && items.some((t) => !t.icon),
    'SegmentedControl',
    'iconOnly needs an icon on every option; one without an icon shows nothing. Add icon, or drop iconOnly to show the words.',
  );
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(
    0,
    items.findIndex((t) => t.value === value),
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
    onChange?.(items[i].value);
  };
  const roving = useRovingRadio(items.length, (i) => go(i));
  return (
    <div className={cx('ui-seg', iconOnly && 'is-icons', className)} role="radiogroup" aria-label={label}>
      {box ? (
        <span className="ui-seg-ind" aria-hidden="true" style={{ left: box.left, width: box.width, transition: dropTransition('left', 'width', forward) }} />
      ) : null}
      {items.map((t, i) => {
        const btn = (
          <button
            key={t.value}
            ref={(n) => {
              refs.current[i] = n;
              roving.ref(i)(n);
            }}
            type="button"
            role="radio"
            aria-checked={i === idx}
            aria-label={iconOnly ? t.label : undefined}
            tabIndex={i === idx ? 0 : -1}
            className={cx('ui-seg-item', i === idx && 'is-selected')}
            onClick={() => go(i)}
            onKeyDown={roving.onKeyDown(i)}
          >
            {t.icon ? <IconOf icon={t.icon} size={16} filled={iconOnly && i === idx} /> : null}
            {iconOnly ? null : <span>{t.label}</span>}
          </button>
        );
        return iconOnly ? (
          <Tooltip key={t.value} label={t.label} describe={false} side="bottom">
            {btn}
          </Tooltip>
        ) : (
          btn
        );
      })}
    </div>
  );
}
