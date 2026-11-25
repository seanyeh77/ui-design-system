import * as React from 'react';
import { dropTransition } from '../../motion';
import { cx } from '../../internal/util';

export interface SwitchProps {
  /** Controlled: on or off. */
  checked?: boolean;
  /** Uncontrolled: whether it starts on; the switch then keeps its own state. */
  defaultChecked?: boolean;
  /** Receives the new state, then the click event. */
  onChange?: (checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => void;
  /** What it turns on; becomes aria-label. Put the visible text next to it in the row (15 px, text-control). */
  label: string;
  /** Grayed out and skipped by Tab. */
  disabled?: boolean;
  /** Id of a sentence that explains the setting (SettingsRow sets it). */
  'aria-describedby'?: string;
  /** Form field name: an on switch sends 'on' with a native form. */
  name?: string;
  /** Extra class on the root element. */
  className?: string;
}

/** An on/off setting that applies at once. The thumb stretches like a droplet while it moves. */
export function Switch({ checked, defaultChecked, onChange, label, disabled, name, 'aria-describedby': describedBy, className }: SwitchProps) {
  const [own, setOwn] = React.useState(!!defaultChecked);
  const on = checked !== undefined ? !!checked : own;
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
      aria-describedby={describedBy}
      disabled={disabled}
      className={cx('ui-switch', on && 'is-on', className)}
      onClick={(e) => {
        if (checked === undefined) setOwn(!on);
        onChange?.(!on, e);
      }}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      // A touch that turns into a scroll is cancelled, not released: the thumb goes back too.
      onPointerCancel={() => setPressing(false)}
    >
      <span
        className="ui-switch-thumb"
        style={{
          left,
          right,
          height: th,
          marginTop: -th / 2,
          transition: `${dropTransition('left', 'right', on)}, height var(--dur-hover) ease, margin-top var(--dur-hover) ease, background-color var(--dur-nav) ease`,
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
      {name && on ? <input type="hidden" name={name} value="on" /> : null}
    </button>
  );
}
