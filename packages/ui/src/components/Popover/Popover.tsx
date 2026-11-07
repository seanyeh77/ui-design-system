import * as React from 'react';
import { Popover as Base } from '@base-ui/react/popover';
import { IconOf, type IconSource } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FloatingPanel } from '../../internal/FloatingPanel';

export interface PopoverProps {
  /** Text of the trigger button. */
  label: string;
  icon?: IconSource;
  /** A number badge on the trigger, e.g. how many filters are on. */
  count?: number | string;
  /** Heading inside the popover; also its accessible name. */
  title?: string;
  /** Default 'bottom'. */
  side?: 'top' | 'bottom';
  /** Default 'end'. */
  align?: 'end' | 'start' | 'center';
  /** Content, or a function that receives close(). */
  children?: React.ReactNode | ((close: () => void) => React.ReactNode);
  triggerClassName?: string;
}

/** A small panel with an arrow, opened from a button on hover, click or focus. For extra detail or a few controls. */
export function Popover({ label, icon, count, title, side = 'bottom', align = 'end', children, triggerClassName }: PopoverProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <FloatingPanel
      open={open}
      onOpenChange={setOpen}
      openOnHover
      side={side}
      align={align}
      sideOffset={10}
      className="ui-popover"
      aria-label={title ? undefined : label}
      trigger={
        <button type="button" className={cx('ui-btn', 'ui-btn-secondary', triggerClassName)}>
          {icon ? <IconOf icon={icon} /> : null}
          {label}
          {count ? <span className="ui-pop-count">{count}</span> : null}
        </button>
      }
    >
      <Base.Arrow className="ui-popover-arrow" />
      {title ? <Base.Title className="ui-popover-title">{title}</Base.Title> : null}
      <div className="ui-popover-body">{typeof children === 'function' ? children(() => setOpen(false)) : children}</div>
    </FloatingPanel>
  );
}
