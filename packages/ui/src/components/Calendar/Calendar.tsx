import * as React from 'react';
import { dayAdd, format, sameDay } from '../../format';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { browserKey, cx } from '../../internal/util';

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
  // The day the keyboard is on: the only day in the Tab order (the focused, else the selected, else today, else the
  // 1st), always in the month shown.
  const [active, setActive] = React.useState<Date>(() => focus || today);
  const cur = active.getFullYear() === y && active.getMonth() === m ? active : new Date(y, m, Math.min(active.getDate(), new Date(y, m + 1, 0).getDate()));
  const grid = React.useRef<HTMLDivElement>(null);
  const moveTo = React.useRef(false);
  React.useEffect(() => {
    if (!moveTo.current) return;
    moveTo.current = false;
    grid.current?.querySelector<HTMLButtonElement>('.ui-cal-day[tabindex="0"]')?.focus();
  });
  const go = (d: Date) => {
    // Disabled days are passed over in the same direction, up to a month.
    const step = d < cur ? -1 : 1;
    for (let k = 0; k < 31 && dayState?.(d)?.disabled; k++) d = dayAdd(d, step);
    setActive(d);
    if (d.getMonth() !== m || d.getFullYear() !== y) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    moveTo.current = true;
    onHover?.(d);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (browserKey(e)) return;
    const wd = (cur.getDay() - format.firstDay() + 7) % 7;
    const sameDayIn = (dm: number) => {
      const last = new Date(cur.getFullYear(), cur.getMonth() + dm + 1, 0).getDate();
      return new Date(cur.getFullYear(), cur.getMonth() + dm, Math.min(cur.getDate(), last));
    };
    const to: Record<string, () => Date> = {
      ArrowLeft: () => dayAdd(cur, -1),
      ArrowRight: () => dayAdd(cur, 1),
      ArrowUp: () => dayAdd(cur, -7),
      ArrowDown: () => dayAdd(cur, 7),
      Home: () => dayAdd(cur, -wd),
      End: () => dayAdd(cur, 6 - wd),
      PageUp: () => sameDayIn(-1),
      PageDown: () => sameDayIn(1),
    };
    if (!to[e.key]) return;
    e.preventDefault();
    go(to[e.key]());
  };
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
      <div ref={grid} className="ui-cal-grid" role="group" aria-label={format.month(month)} onKeyDown={onKey}>
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
              tabIndex={sameDay(c, cur) ? 0 : -1}
              onFocus={() => !sameDay(c, cur) && setActive(c)}
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
