import * as React from 'react';
import { Popover as Base } from '@base-ui/react/popover';
import { IconOf, type IconSource } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FloatingPanel } from '../../internal/FloatingPanel';
import { useOpenState, type OpenStateProps } from '../../internal/open';
import { devWarn } from '../../internal/dev';

export interface PopoverProps extends OpenStateProps {
  /** Text of the trigger button. */
  label: string;
  icon?: IconSource;
  /** A number badge on the trigger, e.g. how many filters are on. 0 shows nothing. */
  count?: number;
  /** The unit of count, read after it by screen readers: 「篩選，2 個條件」. */
  unit?: string;
  /** Heading inside the popover; also its accessible name. */
  title?: string;
  /** Default 'bottom'. */
  side?: 'top' | 'bottom';
  /** Default 'end'. */
  align?: 'end' | 'start' | 'center';
  /** Content, or a function that receives close(). */
  children?: React.ReactNode | ((close: () => void) => React.ReactNode);
  /** Extra class on the trigger button. */
  triggerClassName?: string;
  /** Extra class on the panel. */
  className?: string;
}

/** A small panel with an arrow, opened from a button on hover, click or focus. For extra detail or a few controls. */
export function Popover({
  label,
  icon,
  count,
  unit,
  title,
  side = 'bottom',
  align = 'end',
  children,
  triggerClassName,
  className,
  open: openProp,
  defaultOpen,
  onOpenChange,
}: PopoverProps) {
  devWarn(typeof count === 'string', 'Popover', 'count is a number now: pass count={2}, not a string.');
  const [open, setOpen] = useOpenState({ open: openProp, defaultOpen, onOpenChange });
  return (
    <FloatingPanel
      open={open}
      onOpenChange={setOpen}
      openOnHover
      side={side}
      align={align}
      sideOffset={10}
      className={cx('ui-popover', className)}
      aria-label={title ? undefined : label}
      trigger={
        <button type="button" className={cx('ui-btn', 'ui-btn-secondary', triggerClassName)}>
          {icon ? <IconOf icon={icon} /> : null}
          {label}
          {count ? (
            <span className="ui-pop-count">
              {count}
              {unit ? <span className="ui-visually-hidden">{' ' + unit}</span> : null}
            </span>
          ) : null}
        </button>
      }
    >
      <Base.Arrow className="ui-popover-arrow" />
      {title ? <Base.Title className="ui-popover-title">{title}</Base.Title> : null}
      <div className="ui-popover-body">{typeof children === 'function' ? children(() => setOpen(false, 'other')) : children}</div>
    </FloatingPanel>
  );
}
