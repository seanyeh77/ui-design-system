import * as React from 'react';
import { Tooltip } from '../Tooltip/Tooltip';
import { IconOf, type IconSource } from '../../icons/Icon';
import { cx } from '../../internal/util';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** What the button does, a verb: 「刪除」「複製連結」. Becomes aria-label and the tooltip. */
  label: string;
  /** A built-in name such as 'trash', or custom path data. */
  icon: IconSource;
  /** false: no tooltip (when the label is already visible next to it). Default true. */
  tooltip?: boolean;
  /** The Fill version of a built-in icon, for a pressed or selected button. */
  filled?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

/** A square icon-only button with a tooltip. */
export function IconButton({ label, icon, className, tooltip = true, filled, ...native }: IconButtonProps) {
  const btn = (
    <button type="button" {...native} className={cx('ui-iconbtn', className)} aria-label={label}>
      <IconOf icon={icon} filled={filled} />
    </button>
  );
  return tooltip ? (
    <Tooltip label={label} describe={false}>
      {btn}
    </Tooltip>
  ) : (
    btn
  );
}
