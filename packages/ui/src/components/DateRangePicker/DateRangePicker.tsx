import * as React from 'react';
import { dayAdd, format, sameDay } from '../../format';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FieldLabel } from '../../internal/Field';
import { FloatingPanel } from '../../internal/FloatingPanel';
import { Calendar } from '../Calendar/Calendar';

export type DateRange = [Date, Date];

export interface DateRangePickerProps {
  label?: string;
  value: [Date | null, Date | null];
  onChange: (range: DateRange) => void;
  /** Default 「選擇期間」. */
  placeholder?: string;
  className?: string;
}

/** A period: quick ranges (今天、最近 7 天、最近 30 天、本月、上個月) beside one month. Click a start day, then an end day. */
// The current language's date (zh-TW: 2026/11/04), without the weekday.
const day = (d: Date | null) => format.date(d, { weekday: false });

export function DateRangePicker({ label, value, onChange, placeholder, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [first, setFirst] = React.useState<Date | null>(null);
  const [hover, setHover] = React.useState<Date | null>(null);
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const quick: [string, DateRange][] = [
    [tr('今天'), [t0, t0]],
    [tr('最近 7 天'), [dayAdd(t0, -6), t0]],
    [tr('最近 30 天'), [dayAdd(t0, -29), t0]],
    [tr('本月'), [new Date(t0.getFullYear(), t0.getMonth(), 1), new Date(t0.getFullYear(), t0.getMonth() + 1, 0)]],
    [tr('上個月'), [new Date(t0.getFullYear(), t0.getMonth() - 1, 1), new Date(t0.getFullYear(), t0.getMonth(), 0)]],
  ];
  const toggle = (next: boolean) => {
    setOpen(next);
    if (!next) setFirst(null);
  };
  const set = (r: DateRange) => {
    onChange(r);
    toggle(false);
  };
  const a = first || value[0];
  const b = first ? hover || first : value[1];
  const lo = a && b && b < a ? b : a;
  const hi = a && b && b < a ? a : b;
  return (
    <div className={cx('ui-field', className)}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <FloatingPanel
        open={open}
        onOpenChange={toggle}
        className="ui-datepop ui-rangepop"
        aria-label={tr('選擇期間')}
        trigger={
          <button
            type="button"
            className={cx('ui-datefield', 'ui-rangefield', open && 'is-open')}
            aria-label={
              value[0]
                ? tr('{label}：{a} 到 {b}', { label: label || tr('期間'), a: day(value[0]), b: day(value[1]) })
                : `${label || tr('期間')}${tr('：')}${placeholder || tr('選擇期間')}`
            }
          >
            <Icon name="calendar-blank" size={18} />
            <span>{value[0] ? `${day(value[0])} – ${day(value[1])}` : placeholder || tr('選擇期間')}</span>
          </button>
        }
      >
        <div className="ui-quick">
          {quick.map(([name, r]) => (
            <button
              key={name}
              type="button"
              className={cx('ui-quick-btn', sameDay(r[0], value[0]) && sameDay(r[1], value[1]) && 'is-on')}
              onClick={() => set(r)}
            >
              {name}
            </button>
          ))}
        </div>
        <Calendar
          focus={value[1] || value[0]}
          onHover={first ? setHover : undefined}
          dayState={(d) => ({
            selected: sameDay(d, lo) || sameDay(d, hi),
            start: sameDay(d, lo),
            end: sameDay(d, hi),
            inRange: !!lo && !!hi && d > lo && d < hi,
          })}
          onPick={(d) => {
            if (!first) {
              setFirst(d);
              setHover(d);
            } else set(first <= d ? [first, d] : [d, first]);
          }}
        />
      </FloatingPanel>
    </div>
  );
}
