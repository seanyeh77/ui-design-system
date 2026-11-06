import * as React from 'react';
import { CHECK } from '../../icons/Icon';
import { cx } from '../../internal/util';

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
  // Draw the check mark only when it changes after the first render, not on page load.
  const [drawn, setDrawn] = React.useState(false);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={v}
      aria-label={aria['aria-label']}
      disabled={disabled}
      className={cx('ui-check', v && 'is-on', className)}
      onClick={() => {
        setDrawn(true);
        onChange?.(v !== true);
      }}
    >
      <span className="ui-check-box" aria-hidden="true">
        {v === true ? (
          <svg
            className={cx(drawn && 'ui-draw')}
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={CHECK} />
          </svg>
        ) : null}
        {v === 'mixed' ? <span className="ui-check-dash" /> : null}
      </span>
      {label ? <span>{label}</span> : null}
    </button>
  );
}
