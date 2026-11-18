import * as React from 'react';
import { Tooltip } from '../Tooltip/Tooltip';
import { Icon, IconOf, type IconSource } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { tr } from '../../i18n';

/** A first-use hint on an icon button: an accent dot on the button and a dark bubble below it. */
export interface IconButtonHint {
  /** One short sentence: 「導覽：五個步驟介紹各頁。」. */
  text: string;
  /** The verb on the bubble's button. Default 「開始」. */
  action?: string;
  /** The bubble's button: do the thing the hint is about (start the tour). */
  onAction: () => void;
  /** The bubble's ×: hide the hint for good. */
  onDismiss: () => void;
}

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** What the button does, a verb: 「刪除」「複製連結」. Becomes aria-label and the tooltip. */
  label: string;
  /** A built-in name such as 'trash', or custom path data. */
  icon: IconSource;
  /** false: no tooltip (when the label is already visible next to it). Default true. */
  tooltip?: boolean;
  /** The Fill version of a built-in icon, for a pressed or selected button. */
  filled?: boolean;
  /** A first-use hint: a dot on the button and a bubble below it until the user acts on it or closes it. Pass
   *  undefined once it was handled (useTour's tour.hint() does this). */
  hint?: IconButtonHint;
  ref?: React.Ref<HTMLButtonElement>;
}

/** A square icon-only button with a tooltip. */
export function IconButton({ label, icon, className, tooltip = true, filled, hint, ...native }: IconButtonProps) {
  const id = React.useId();
  const btn = (
    <button
      type="button"
      {...native}
      className={cx('ui-iconbtn', hint && 'has-hint', className)}
      aria-label={label}
      aria-describedby={hint ? id : native['aria-describedby']}
    >
      <IconOf icon={icon} filled={filled} />
      {hint && <span className="ui-iconbtn-dot" aria-hidden="true" />}
    </button>
  );
  const button = tooltip ? (
    <Tooltip label={label} describe={false}>
      {btn}
    </Tooltip>
  ) : (
    btn
  );
  if (!hint) return button;
  return (
    <span className="ui-iconbtn-hintbox">
      {button}
      <span className="ui-hint" id={id} role="status">
        <span className="ui-hint-text">{hint.text}</span>
        <button type="button" className="ui-hint-go" onClick={hint.onAction}>
          {hint.action ?? tr('開始')}
        </button>
        <button type="button" className="ui-hint-x" aria-label={tr('關閉提示')} onClick={hint.onDismiss}>
          <Icon name="x" size={16} />
        </button>
      </span>
    </span>
  );
}
