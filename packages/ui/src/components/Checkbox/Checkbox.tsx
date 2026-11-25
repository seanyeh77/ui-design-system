import * as React from 'react';
import { cx } from '../../internal/util';
import { CheckMark } from '../../internal/Field';

interface CheckboxBase {
  /** Controlled: 'mixed' when some of a group are checked (shows a dash). */
  checked?: boolean | 'mixed';
  /** Uncontrolled: whether it starts checked; the box then keeps its own state. */
  defaultChecked?: boolean;
  /** Receives the new state, then the click event; from 'mixed' it goes to true. */
  onChange?: (checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Grayed out and skipped by Tab. */
  disabled?: boolean;
  /** Form field name: a checked box sends `value` (default 'on') with a native form. */
  name?: string;
  /** What a checked box sends with the form. Default 'on'. */
  value?: string;
  className?: string;
}

export type CheckboxProps = CheckboxBase &
  (
    | {
        /** Text to the right of the box; also its name. */
        label: React.ReactNode;
        'aria-label'?: string;
      }
    | {
        label?: never;
        /** The name when there is no visible label (a table's row check). */
        'aria-label': string;
      }
  );

/** A check box with a drawn check mark. The whole row is the touch target. */
export function Checkbox({ checked, defaultChecked, onChange, label, disabled, name, value = 'on', className, ...aria }: CheckboxProps) {
  const [own, setOwn] = React.useState(!!defaultChecked);
  const cur = checked !== undefined ? checked : own;
  const v = cur === 'mixed' ? 'mixed' : !!cur;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={v}
      aria-label={aria['aria-label']}
      disabled={disabled}
      className={cx('ui-check', v && 'is-on', className)}
      onClick={(e) => {
        if (checked === undefined) setOwn(v !== true);
        onChange?.(v !== true, e);
      }}
    >
      <span className="ui-check-box" aria-hidden="true">
        <CheckMark v={v} />
      </span>
      {label ? <span>{label}</span> : null}
      {name && v === true ? <input type="hidden" name={name} value={value} /> : null}
    </button>
  );
}
