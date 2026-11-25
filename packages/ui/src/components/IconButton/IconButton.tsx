import * as React from 'react';
import { Tooltip } from '../Tooltip/Tooltip';
import { Icon, IconOf, type IconSource } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { tr } from '../../i18n';
import { includeIcons } from '../../icons/store';
import { useDisabledFocusRescue } from '../../internal/focus';
import phX from '../../icons/ph/x';

includeIcons(phX);

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
  /** 'outline' (default): 40 px with a border. 'quiet': 32 px, no border, a background only on hover; for top bars and
   *  tab bars where several sit in a row. On touch screens both keep a 48 px touch area. */
  variant?: 'outline' | 'quiet';
  /** A first-use hint: a dot on the button and a bubble below it until the user acts on it or closes it. Pass
   *  undefined once it was handled (useTour's tour.hint() does this). */
  hint?: IconButtonHint;
  /** The underlying <button>. */
  ref?: React.Ref<HTMLButtonElement>;
}

/** A square icon-only button with a tooltip. */
export function IconButton({ label, icon, className, tooltip = true, filled, hint, variant, ref, ...native }: IconButtonProps) {
  const id = React.useId();
  const own = React.useRef<HTMLButtonElement | null>(null);
  // Disabled while it has focus: focus goes to the control before it, not to the page.
  useDisabledFocusRescue(own, native.disabled);
  const setRef = React.useCallback(
    (el: HTMLButtonElement | null) => {
      own.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.RefObject<HTMLButtonElement | null>).current = el;
    },
    [ref],
  );
  const btn = (
    <button
      type="button"
      {...native}
      ref={setRef}
      className={cx('ui-iconbtn', variant === 'quiet' && 'is-quiet', hint && 'has-hint', className)}
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
      <HintBubble id={id} hint={hint} />
    </span>
  );
}

/** The bubble sits left of the button, in its row (H3), narrowing (the text wraps) to the room there. With less than
 *  180 px on the left it goes below the button, right-aligned with it but kept 16 px inside the screen, its arrow
 *  still on the button. */
function HintBubble({ id, hint }: { id: string; hint: IconButtonHint }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [place, setPlace] = React.useState<{ room: number; left?: number; arrow?: number } | null>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const box = el.parentElement?.getBoundingClientRect();
      if (!box) return;
      const room = Math.floor(box.left - 12 - 8);
      if (room >= 180) return setPlace({ room });
      const w = Math.min(320, window.innerWidth - 32);
      const want = box.left + box.width - w;
      const at = Math.max(16, Math.min(want, window.innerWidth - 16 - w));
      setPlace({ room, left: Math.round(at - box.left), arrow: Math.round(box.left + box.width / 2 - at - 6) });
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const below = place != null && place.room < 180;
  return (
    <span
      ref={ref}
      className={cx('ui-hint', below && 'is-below')}
      id={id}
      role="status"
      style={
        place == null
          ? undefined
          : below
            ? ({ left: place.left, right: 'auto', '--hint-arrow': place.arrow + 'px' } as React.CSSProperties)
            : { maxWidth: Math.min(320, place.room) }
      }
    >
      <span className="ui-hint-text">{hint.text}</span>
      <button type="button" className="ui-hint-go" onClick={hint.onAction}>
        {hint.action ?? tr('開始')}
      </button>
      <button type="button" className="ui-hint-x" aria-label={tr('關閉提示')} onClick={hint.onDismiss}>
        <Icon name="x" size={16} />
      </button>
    </span>
  );
}
