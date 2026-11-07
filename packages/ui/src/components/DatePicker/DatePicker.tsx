import * as React from 'react';
import { fmtDate, parseDate, sameDay } from '../../format';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FieldLabel } from '../../internal/Field';
import { FloatingPanel } from '../../internal/FloatingPanel';
import { Calendar } from '../Calendar/Calendar';

export interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (d: Date | null) => void;
  /** Default 「可以直接輸入，例如 2026/11/14」. */
  hint?: string;
  required?: boolean;
  className?: string;
}

/** A date field: type YYYY/MM/DD, or pick from the calendar button's month grid. */
export function DatePicker({ label, value, onChange, hint, required, className }: DatePickerProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState<string | null>(null);
  const field = React.useRef<HTMLDivElement>(null);
  const bad = typed !== null && typed !== '' && !parseDate(typed);
  const commit = (d: Date | null) => {
    setTyped(null);
    onChange(d);
    setOpen(false);
  };
  return (
    <div className={cx('ui-field', className)}>
      {label ? (
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
      ) : null}
      <div ref={field} className={cx('ui-datefield', bad && 'is-invalid')}>
        <input
          id={id}
          className="ui-datefield-input"
          value={typed ?? fmtDate(value)}
          placeholder="YYYY/MM/DD"
          aria-invalid={bad || undefined}
          onChange={(e) => {
            const t = e.target.value;
            setTyped(t);
            const d = parseDate(t);
            if (d) onChange(d);
            else if (t === '') onChange(null);
          }}
          onBlur={() => !bad && setTyped(null)}
        />
        <FloatingPanel
          open={open}
          onOpenChange={setOpen}
          anchor={field}
          className="ui-datepop"
          aria-label={tr('選擇日期')}
          trigger={
            <button type="button" className="ui-datefield-btn" aria-label={tr('開啟日曆')}>
              <Icon name="calendar-blank" size={18} />
            </button>
          }
        >
          <Calendar focus={value} dayState={(d) => ({ selected: sameDay(d, value) })} onPick={commit} />
          <div className="ui-datepop-foot">
            <button type="button" className="ui-link-btn" onClick={() => commit(new Date(new Date().setHours(0, 0, 0, 0)))}>
              {tr('今天')}
            </button>
            <button type="button" className="ui-link-btn is-muted" onClick={() => commit(null)}>
              {tr('清除')}
            </button>
          </div>
        </FloatingPanel>
      </div>
      <div className={cx('ui-field-hint', bad && 'is-error')}>
        {bad ? tr('日期格式不正確，請寫成 2026/11/14') : hint || tr('可以直接輸入，例如 2026/11/14')}
      </div>
    </div>
  );
}
