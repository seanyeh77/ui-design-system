import * as React from 'react';
import { format, sameDay } from '../../format';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';

export interface DayState {
  selected?: boolean;
  inRange?: boolean;
  start?: boolean;
  end?: boolean;
  disabled?: boolean;
}

export interface CalendarProps {
  /** The month shown first. Default: this month. */
  focus?: Date | null;
  onPick?: (d: Date) => void;
  onHover?: (d: Date | null) => void;
  /** How each day looks: selected, inside a range, disabled. */
  dayState?: (d: Date) => DayState | undefined;
}

/** A month grid: selected days are rounded squares, today has a dot under the number. */
export function Calendar({ focus, onPick, onHover, dayState }: CalendarProps) {
  const [month, setMonth] = React.useState(() => {
    const b = focus || new Date();
    return new Date(b.getFullYear(), b.getMonth(), 1);
  });
  const today = new Date();
  const y = month.getFullYear();
  const m = month.getMonth();
  const start = (new Date(y, m, 1).getDay() - format.firstDay() + 7) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array<null>(start).fill(null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))];
  return (
    <div className="ui-cal">
      <div className="ui-cal-head">
        <button type="button" className="ui-cal-nav" aria-label={tr('上個月')} onClick={() => setMonth(new Date(y, m - 1, 1))}>
          <Icon name="caret-left" size={16} />
        </button>
        <span className="ui-cal-title" aria-live="polite">
          {format.month(month)}
        </span>
        <button type="button" className="ui-cal-nav" aria-label={tr('下個月')} onClick={() => setMonth(new Date(y, m + 1, 1))}>
          <Icon name="caret-right" size={16} />
        </button>
      </div>
      <div className="ui-cal-grid" role="group" aria-label={format.month(month)}>
        {format.weekdays().map((w, i) => (
          <span key={'w' + i} className="ui-cal-wk" aria-hidden="true">
            {w}
          </span>
        ))}
        {cells.map((c, i) => {
          if (!c) return <span key={'e' + i} />;
          const st = dayState?.(c) ?? {};
          const isToday = sameDay(c, today);
          return (
            <button
              key={i}
              type="button"
              disabled={st.disabled}
              className={cx('ui-cal-day', st.selected && 'is-sel', st.inRange && 'is-range', st.start && 'is-start', st.end && 'is-end', isToday && 'is-today')}
              aria-pressed={!!st.selected}
              aria-label={format.date(c, { weekday: false, long: true }) + (isToday ? tr('（今天）') : '')}
              onClick={() => onPick?.(c)}
              onMouseEnter={onHover ? () => onHover(c) : undefined}
            >
              {c.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
