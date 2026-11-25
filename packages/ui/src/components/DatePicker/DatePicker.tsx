import * as React from 'react';
import { fmtDate, parseDate, sameDay } from '../../format';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FieldErrorIcon, FieldLabel, FieldMessage, type FieldProps } from '../../internal/Field';
import { FloatingPanel } from '../../internal/FloatingPanel';
import { Calendar } from '../Calendar/Calendar';
import { includeIcons } from '../../icons/store';
import phCalendarBlank from '../../icons/ph/calendar-blank';

includeIcons(phCalendarBlank);

/** 2026-11-14: the date a form sends, in the local calendar. */
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface DatePickerProps extends FieldProps {
  /** The date, or null for none. */
  value: Date | null;
  /** Receives the new date, or null when the field is cleared. */
  onChange: (value: Date | null) => void;
  /** Default 「可以直接輸入，例如 2026/11/14」; `backticks` are code. */
  hint?: string;
  /** An error from your own check (「請選擇開始日期」): the cause and the fix. Red border, the warning icon and this line
   *  under the field, announced when it appears. A date typed in the wrong format gets its own error. `backticks` are code. */
  error?: string;
  /** Extra class on the root element. */
  className?: string;
}

/** A date field: type YYYY/MM/DD, or pick from the calendar button's month grid. */
export function DatePicker({ label, hideLabel, value, onChange, hint, required, disabled, name, error, className }: DatePickerProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState<string | null>(null);
  const field = React.useRef<HTMLDivElement>(null);
  const wrong = typed !== null && typed !== '' && !parseDate(typed);
  // A half-typed date (「2026/1」) is not an error yet: it shows once the person leaves the field, and goes as soon as
  // the date is valid again.
  const [left, setLeft] = React.useState(false);
  const bad = wrong && left;
  const errText = bad ? tr('日期格式不正確，請寫成 2026/11/14') : error;
  const msgId = id + '-msg';
  const commit = (d: Date | null) => {
    setTyped(null);
    setLeft(false);
    onChange(d);
    setOpen(false);
  };
  return (
    <div className={cx('ui-field', errText && 'has-error', disabled && 'is-disabled', className)}>
      <FieldLabel htmlFor={id} required={required} hidden={hideLabel}>
        {label}
      </FieldLabel>
      <div ref={field} className={cx('ui-datefield', errText && 'is-invalid')}>
        {name ? <input type="hidden" name={name} value={value ? isoDay(value) : ''} /> : null}
        <input
          id={id}
          disabled={disabled}
          className="ui-datefield-input"
          value={typed ?? fmtDate(value)}
          placeholder="YYYY/MM/DD"
          // The label's red asterisk is hidden from screen readers; they hear 「必填」 from this.
          aria-required={required || undefined}
          aria-invalid={errText ? true : undefined}
          aria-describedby={msgId}
          onChange={(e) => {
            const t = e.target.value;
            setTyped(t);
            const d = parseDate(t);
            if (d) onChange(d);
            else if (t === '') onChange(null);
          }}
          onBlur={() => (wrong ? setLeft(true) : setTyped(null))}
        />
        {errText ? <FieldErrorIcon inline /> : null}
        <FloatingPanel
          open={open}
          onOpenChange={setOpen}
          anchor={field}
          className="ui-datepop"
          // Focus on the selected day, else today (the calendar's one day in the Tab order), not on 「上個月」.
          focusOnOpen='.ui-cal-day[tabindex="0"]'
          aria-label={tr('選擇日期')}
          trigger={
            <button type="button" className="ui-datefield-btn" aria-label={tr('開啟日曆')} disabled={disabled}>
              <Icon name="calendar-blank" size={18} />
            </button>
          }
        >
          <Calendar month={value} dayState={(d) => ({ selected: sameDay(d, value) })} onPick={commit} />
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
      <FieldMessage id={msgId} error={errText} hint={hint || tr('可以直接輸入，例如 2026/11/14')} />
    </div>
  );
}
