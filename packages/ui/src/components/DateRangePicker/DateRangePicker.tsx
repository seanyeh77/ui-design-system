import * as React from 'react';
import { dayAdd, format, sameDay } from '../../format';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FieldErrorIcon, FieldLabel, FieldMessage, type FieldProps } from '../../internal/Field';
import { FloatingPanel } from '../../internal/FloatingPanel';
import { Calendar } from '../Calendar/Calendar';
import { isoDay } from '../DatePicker/DatePicker';
import { includeIcons } from '../../icons/store';
import phCalendarBlank from '../../icons/ph/calendar-blank';

includeIcons(phCalendarBlank);

/** A period: [start, end]; null where no day is chosen (a cleared range is [null, null]). */
export type DateRange = [Date | null, Date | null];

export interface DateRangePickerProps extends FieldProps {
  /** The period, or [null, null] for none. */
  value: DateRange;
  /** Receives the new period; [null, null] when it is cleared with 清除. */
  onChange: (value: DateRange) => void;
  /** Shown when no period is chosen. Default 「選擇期間」. */
  placeholder?: string;
  className?: string;
}

// The current language's date (zh-TW: 2026/11/04), without the weekday.
const day = (d: Date | null) => format.date(d, { weekday: false });

/** A period: quick ranges (今天、最近 7 天、最近 30 天、本月、上個月) beside one month. Click a start day, then an end day. */
export function DateRangePicker({ label, hideLabel, hint, error, required, disabled, name, value, onChange, placeholder, className }: DateRangePickerProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [first, setFirst] = React.useState<Date | null>(null);
  const [hover, setHover] = React.useState<Date | null>(null);
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const quick: [string, [Date, Date]][] = [
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
  const msgId = id + '-msg';
  const shown = value[0] ? `${day(value[0])} – ${day(value[1] ?? value[0])}` : placeholder || tr('選擇期間');
  return (
    <div className={cx('ui-field', error && 'has-error', disabled && 'is-disabled', className)}>
      <FieldLabel id={id + '-label'} required={required} hidden={hideLabel}>
        {label}
      </FieldLabel>
      {name ? <input type="hidden" name={name} value={value[0] ? `${isoDay(value[0])}/${isoDay(value[1] ?? value[0])}` : ''} /> : null}
      <FloatingPanel
        open={open}
        onOpenChange={toggle}
        className="ui-datepop ui-rangepop"
        aria-label={tr('選擇期間')}
        trigger={
          <button
            type="button"
            disabled={disabled}
            className={cx('ui-datefield', 'ui-rangefield', open && 'is-open', error && 'is-invalid')}
            // Named by the label and the text on the button, so a spoken command with what is shown finds it.
            aria-labelledby={`${id}-label ${id}-value`}
            aria-describedby={error || hint ? msgId : undefined}
            aria-invalid={error ? true : undefined}
            aria-required={required || undefined}
          >
            <span id={id + '-value'} className={cx('ui-rangefield-value', !value[0] && 'is-placeholder')}>
              {shown}
            </span>
            {error ? <FieldErrorIcon inline /> : null}
            <Icon name="calendar-blank" size={18} className="ui-rangefield-icon" />
          </button>
        }
      >
        <div className="ui-quick">
          {quick.map(([qname, r]) => (
            <button
              key={qname}
              type="button"
              className={cx('ui-quick-btn', sameDay(r[0], value[0]) && sameDay(r[1], value[1]) && 'is-on')}
              onClick={() => set(r)}
            >
              {qname}
            </button>
          ))}
          {value[0] ? (
            <button type="button" className="ui-quick-btn is-muted" onClick={() => set([null, null])}>
              {tr('清除')}
            </button>
          ) : null}
        </div>
        <Calendar
          month={value[1] || value[0]}
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
      {error || hint ? <FieldMessage id={msgId} error={error} hint={hint} /> : null}
    </div>
  );
}
