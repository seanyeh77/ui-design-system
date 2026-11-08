import * as React from 'react';
import { cx, browserKey } from '../../internal/util';

export interface RadioOption<V extends string = string> {
  value: V;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<V extends string = string> {
  /** Shown above the options and used as the group's name. */
  label?: string;
  value?: V;
  onChange?: (value: V) => void;
  /** 2 to 5 options, all visible. Use Select for more. */
  options: RadioOption<V>[];
  disabled?: boolean;
  className?: string;
}

/** One choice out of a few visible options. Arrow keys move between them. */
export function RadioGroup<V extends string = string>({ label, value, onChange, options, disabled, className }: RadioGroupProps<V>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.map((o) => !(disabled || o.disabled));
  const selected = options.findIndex((o) => o.value === value);
  const tabStop = selected >= 0 ? selected : enabled.indexOf(true);
  const move = (from: number, dir: 1 | -1) => {
    for (let k = 1; k <= options.length; k++) {
      const i = (from + dir * k + options.length) % options.length;
      if (enabled[i]) {
        refs.current[i]?.focus();
        onChange?.(options[i].value);
        return;
      }
    }
  };
  return (
    <div role="radiogroup" aria-label={label} className={cx('ui-radios', className)}>
      {label ? <div className="ui-field-label">{label}</div> : null}
      {options.map((o, i) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={i === tabStop ? 0 : -1}
            disabled={!enabled[i]}
            className={cx('ui-radio', on && 'is-on')}
            onClick={() => onChange?.(o.value)}
            onKeyDown={(e) => {
              if (browserKey(e)) return;
              if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                move(i, 1);
              } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                move(i, -1);
              }
            }}
          >
            <span className="ui-radio-ring" aria-hidden="true">
              {on ? <span className="ui-radio-dot" /> : null}
            </span>
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
