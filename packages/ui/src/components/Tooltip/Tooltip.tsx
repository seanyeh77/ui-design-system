import * as React from 'react';
import { Tooltip as Base } from '@base-ui/react/tooltip';

export interface TooltipProps {
  /** Short text, also announced as the trigger's description. Never the only place important information lives. */
  label: string;
  /** Preferred side; flips when there is no room. Default 'top'. */
  side?: 'top' | 'bottom';
  /** One focusable element that accepts a ref (a button, IconButton, Button, a link). */
  children: React.ReactElement;
  /** false: the label only repeats the trigger's own name (an IconButton's aria-label), so it is not added as its description. Default true. */
  describe?: boolean;
  /** Long text (a cut-off table cell): wraps at 360 px in regular weight instead of one bold line. */
  wrap?: boolean;
  /** Turns it off without unmounting the trigger, e.g. while a cell's text still fits. */
  disabled?: boolean;
}

// The Tooltips open right now: opening one closes the others, so moving fast (Tab through a table) never stacks them.
const openNow = new Set<() => void>();

/** Dark label above the element (below when there is no room), with an arrow. Appears at once on hover and focus. */
export function Tooltip({ label, side = 'top', describe = true, wrap = false, disabled = false, children }: TooltipProps) {
  // Base UI tooltips are visual only; a hidden copy gives screen readers the description.
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const shown = open && !disabled;
  React.useEffect(() => {
    if (!shown) return;
    for (const other of openNow) if (other !== close) other();
    openNow.add(close);
    return () => {
      openNow.delete(close);
    };
  }, [shown, close]);
  return (
    <Base.Root disabled={disabled} open={shown} onOpenChange={setOpen}>
      <Base.Trigger delay={0} render={children} aria-describedby={describe && !disabled ? id : undefined} onBlur={close} />
      {describe && !disabled ? (
        <span id={id} hidden>
          {label}
        </span>
      ) : null}
      <Base.Portal>
        <Base.Positioner side={side} sideOffset={8} className="ui-tooltip-positioner">
          <Base.Popup className={wrap ? 'ui-tooltip is-wrap' : 'ui-tooltip'}>
            {label}
            <Base.Arrow className="ui-tooltip-arrow" />
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
