import * as React from 'react';
import { cx } from '../../internal/util';
import { useRovingRadio } from '../../internal/roving';

export interface RadioOption<V extends string = string> {
  value: V;
  label: React.ReactNode;
  disabled?: boolean;
}

interface RadioGroupBase<V extends string> {
  /** Controlled: the chosen value. */
  value?: V;
  /** Uncontrolled: the value chosen at first; the group then keeps its own state. */
  defaultValue?: V;
  /** Receives the chosen value, then the event (a click or the arrow key that picked it). */
  onChange?: (value: V, event: React.SyntheticEvent<HTMLButtonElement>) => void;
  /** 2 to 5 options, all visible. Use Select for more. */
  options: RadioOption<V>[];
  /** Grayed out and skipped by Tab. */
  disabled?: boolean;
  /** Form field name: the chosen value is sent with a native form. */
  name?: string;
  className?: string;
}

export type RadioGroupProps<V extends string = string> = RadioGroupBase<V> &
  (
    | {
        /** Shown above the options and used as the group's name. */
        label: string;
        'aria-label'?: never;
      }
    | {
        label?: never;
        /** The group's name when no label is shown. */
        'aria-label': string;
      }
  );

/** One choice out of a few visible options. Arrow keys move between them. */
export function RadioGroup<V extends string = string>({
  label,
  value,
  defaultValue,
  onChange,
  options,
  disabled,
  name,
  className,
  ...aria
}: RadioGroupProps<V>) {
  const labelId = React.useId();
  const [own, setOwn] = React.useState<V | undefined>(defaultValue);
  const cur = value !== undefined ? value : own;
  const enabled = options.map((o) => !(disabled || o.disabled));
  const selected = options.findIndex((o) => o.value === cur);
  const tabStop = selected >= 0 ? selected : enabled.indexOf(true);
  const pick = (i: number, e: React.SyntheticEvent<HTMLButtonElement>) => {
    if (value === undefined) setOwn(options[i].value);
    onChange?.(options[i].value, e);
  };
  const lastKey = React.useRef<React.SyntheticEvent<HTMLButtonElement> | null>(null);
  const roving = useRovingRadio(
    options.length,
    (i) => lastKey.current && pick(i, lastKey.current),
    (i) => enabled[i],
  );
  return (
    <div
      role="radiogroup"
      aria-labelledby={label ? labelId : undefined}
      aria-label={label ? undefined : aria['aria-label']}
      className={cx('ui-radios', className)}
    >
      {label ? (
        <div id={labelId} className="ui-field-label">
          {label}
        </div>
      ) : null}
      {options.map((o, i) => {
        const on = cur === o.value;
        return (
          <button
            key={o.value}
            ref={roving.ref(i)}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={i === tabStop ? 0 : -1}
            disabled={!enabled[i]}
            className={cx('ui-radio', on && 'is-on')}
            onClick={(e) => pick(i, e)}
            onKeyDown={(e) => {
              lastKey.current = e;
              roving.onKeyDown(i)(e);
            }}
          >
            <span className="ui-radio-ring" aria-hidden="true">
              {on ? <span className="ui-radio-dot" /> : null}
            </span>
            <span>{o.label}</span>
          </button>
        );
      })}
      {name ? <input type="hidden" name={name} value={cur ?? ''} /> : null}
    </div>
  );
}
