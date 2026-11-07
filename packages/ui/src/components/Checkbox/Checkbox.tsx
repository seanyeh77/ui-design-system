import * as React from 'react';
import { cx } from '../../internal/util';
import { CheckMark } from '../../internal/Field';

export interface CheckboxProps {
  /** 'mixed': some of a group are checked (shows a dash). */
  checked?: boolean | 'mixed';
  /** Receives the new state; from 'mixed' it goes to true. */
  onChange?: (checked: boolean) => void;
  /** Text to the right of the box. Without it, pass aria-label. */
  label?: React.ReactNode;
  'aria-label'?: string;
  disabled?: boolean;
  className?: string;
}

/** A check box with a drawn check mark. The whole row is the touch target. */
export function Checkbox({ checked, onChange, label, disabled, className, ...aria }: CheckboxProps) {
  const v = checked === 'mixed' ? 'mixed' : !!checked;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={v}
      aria-label={aria['aria-label']}
      disabled={disabled}
      className={cx('ui-check', v && 'is-on', className)}
      onClick={() => onChange?.(v !== true)}
    >
      <span className="ui-check-box" aria-hidden="true">
        <CheckMark v={v} />
      </span>
      {label ? <span>{label}</span> : null}
    </button>
  );
}
