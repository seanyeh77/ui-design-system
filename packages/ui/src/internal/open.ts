import * as React from 'react';

/** Why an overlay opened or closed, passed as onOpenChange's second argument.
 *  trigger: its button was pressed (or hovered); escape: Esc; outside: a press outside it; close: its × or close
 *  button; cancel: its cancel button; confirm: its confirming button; select: an item was chosen; hotkey: a keyboard
 *  shortcut (Ctrl K); done / skip: a Tour was finished or skipped; other: anything else (focus moved away, the app). */
export type OpenChangeReason = 'trigger' | 'escape' | 'outside' | 'close' | 'cancel' | 'confirm' | 'select' | 'hotkey' | 'done' | 'skip' | 'other';

/** The open-state props every overlay takes: controlled with open, uncontrolled with defaultOpen. */
export interface OpenStateProps {
  /** Controlled: shown while true. Leave it out (and use defaultOpen) to let the component keep its own state. */
  open?: boolean;
  /** Uncontrolled: whether it starts open. Default false. */
  defaultOpen?: boolean;
  /** Called with the new state and why it changed (Esc, a press outside, the close button…). */
  onOpenChange?: (open: boolean, reason?: OpenChangeReason) => void;
}

/** Maps Base UI's change reasons to OpenChangeReason. */
export function baseReason(reason: string | undefined): OpenChangeReason {
  switch (reason) {
    case 'trigger-press':
    case 'trigger-hover':
    case 'trigger-focus':
      return 'trigger';
    case 'escape-key':
      return 'escape';
    case 'outside-press':
      return 'outside';
    case 'close-press':
      return 'close';
    case 'item-press':
      return 'select';
    default:
      return 'other';
  }
}

/** open / defaultOpen / onOpenChange in one place: returns the current state and the setter to call with a reason. */
export function useOpenState({ open, defaultOpen, onOpenChange }: OpenStateProps): [boolean, (next: boolean, reason?: OpenChangeReason) => void] {
  const [own, setOwn] = React.useState(!!defaultOpen);
  const controlled = open !== undefined;
  const cur = controlled ? open : own;
  const set = React.useCallback(
    (next: boolean, reason?: OpenChangeReason) => {
      if (!controlled) setOwn(next);
      onOpenChange?.(next, reason);
    },
    [controlled, onOpenChange],
  );
  return [cur, set];
}
