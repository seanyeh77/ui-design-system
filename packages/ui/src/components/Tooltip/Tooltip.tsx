import * as React from 'react';
import { Tooltip as Base } from '@base-ui/react/tooltip';

export interface TooltipProps {
  /** Short text, also announced as the trigger's description. Never the only place important information lives. */
  label: string;
  /** Preferred side; flips when there is no room. Default 'top'. */
  side?: 'top' | 'bottom';
  /** One focusable element that accepts a ref (a button, IconButton, Button, a link). */
  children: React.ReactElement;
}

/** Dark label above the element (below when there is no room), with an arrow. Appears at once on hover and focus. */
export function Tooltip({ label, side = 'top', children }: TooltipProps) {
  // Base UI tooltips are visual only; a hidden copy gives screen readers the description.
  const id = React.useId();
  return (
    <Base.Root>
      <Base.Trigger delay={0} render={children} aria-describedby={id} />
      <span id={id} hidden>
        {label}
      </span>
      <Base.Portal>
        <Base.Positioner side={side} sideOffset={8} className="ui-tooltip-positioner">
          <Base.Popup className="ui-tooltip">
            {label}
            <Base.Arrow className="ui-tooltip-arrow" />
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
