import * as React from 'react';
import { dropTransition } from '../../motion';
import { cx } from '../../internal/util';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  /** What it turns on; becomes aria-label. Put the visible text next to it in the row. */
  label: string;
  disabled?: boolean;
  className?: string;
}

/** An on/off setting that applies at once. The thumb stretches like a droplet while it moves. */
export function Switch({ checked, onChange, label, disabled, className }: SwitchProps) {
  const on = !!checked;
  const [pressing, setPressing] = React.useState(false);
  const W = 48;
  const H = 28;
  const th = pressing ? 28 : on ? 24 : 16;
  const gap = (H - th) / 2;
  const stretch = pressing ? 6 : 0;
  const left = on ? W - gap - th - stretch : gap;
  const right = on ? gap : W - gap - th - stretch;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className={cx('ui-switch', on && 'is-on', className)}
      onClick={() => onChange?.(!on)}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
    >
      <span
        className="ui-switch-thumb"
        style={{
          left,
          right,
          height: th,
          marginTop: -th / 2,
          transition: `${dropTransition('left', 'right', on)}, height 150ms ease, margin-top 150ms ease, background-color .2s ease`,
        }}
      >
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={on ? 'M5 12.5l4.5 4.5L19 7' : 'M7 7l10 10M17 7L7 17'} />
        </svg>
      </span>
    </button>
  );
}
