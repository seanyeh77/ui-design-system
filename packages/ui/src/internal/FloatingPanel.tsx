import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { cx } from './util';

export interface FloatingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The element that opens the panel; it must accept a ref (a native element or a component that passes ref on). */
  trigger: React.ReactElement;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  /** Class of the panel (it carries the look: .ui-datepop, .ui-noti …). */
  className?: string;
  /** Match the trigger's width. */
  matchWidth?: boolean;
  /** Accessible name of the panel. */
  'aria-label'?: string;
  /** Which element gets focus on open. Default: the first focusable one. */
  initialFocus?: React.RefObject<HTMLElement | null> | boolean;
  /** Position against this element instead of the trigger (e.g. the whole field around a calendar button). */
  anchor?: React.RefObject<Element | null>;
  /** Open on hover as well as on press. */
  openOnHover?: boolean;
  children: React.ReactNode;
}

/** A positioned panel next to its trigger: flips when there is no room, closes on Esc and outside press, returns focus. */
export function FloatingPanel({ open, onOpenChange, trigger, side = 'bottom', align = 'start', sideOffset = 6, className, matchWidth, initialFocus, openOnHover, anchor, children, ...aria }: FloatingPanelProps) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger render={trigger} openOnHover={openOnHover} delay={0} closeDelay={150} />
      <Popover.Portal>
        <Popover.Positioner className={cx('ui-float', matchWidth && 'is-match')} side={side} align={align} sideOffset={sideOffset} anchor={anchor}>
          <Popover.Popup className={className} aria-label={aria['aria-label']} initialFocus={initialFocus}>
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
