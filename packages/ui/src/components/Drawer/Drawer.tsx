import * as React from 'react';
import { Dialog as Base } from '@base-ui/react/dialog';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { Button } from '../Button/Button';
import { devWarn } from '../../internal/dev';
import { baseReason, useOpenState, type OpenChangeReason } from '../../internal/open';
import { includeIcons } from '../../icons/store';
import phX from '../../icons/ph/x';
import { codeText } from '../InlineCode/InlineCode';

includeIcons(phX);

export interface DrawerProps {
  /** Controlled: shown while true. Leave it out (with defaultOpen) to let the drawer keep its own state. */
  open?: boolean;
  /** Uncontrolled: whether it starts open. */
  defaultOpen?: boolean;
  /** Called with false (and why) on ×, Esc, a press on the backdrop and requestClose, after the unsaved-changes check. */
  onOpenChange?: (open: boolean, reason?: OpenChangeReason) => void;
  /** @deprecated use onOpenChange. Called when the drawer closes. */
  onClose?: () => void;
  title: string;
  /** One sentence under the title on what the drawer is for; read with the title when it opens (aria-describedby). */
  description?: string;
  /** Footer buttons: secondary first, primary last. Pass a function to get requestClose for your 取消 button: it
   *  asks before discarding unsaved changes, like × and Esc. */
  actions?: React.ReactNode | ((requestClose: () => void) => React.ReactNode);
  /** Unsaved changes: closing asks 「放棄未儲存的變更？」 first, in the drawer's footer. */
  dirty?: boolean;
  /** px. Default 400. */
  width?: number;
  /** Which edge it slides in from. Default 'right'; 'left' for navigation opened from a menu button at the left. */
  side?: 'right' | 'left';
  /** The question of the close confirmation. Default 「放棄未儲存的變更？」. */
  confirmTitle?: string;
  /** The sentence of the close confirmation; `backticks` are code. */
  confirmText?: string;
  children?: React.ReactNode;
}

/** A 400 px panel from the right for editing one item without leaving the page. */
export function Drawer({
  open: openProp,
  defaultOpen,
  onOpenChange,
  onClose,
  title,
  description,
  actions,
  dirty,
  width,
  side = 'right',
  confirmTitle,
  confirmText,
  children,
}: DrawerProps) {
  devWarn(!!onClose, 'Drawer', 'onClose is deprecated: use onOpenChange={(open) => !open && close()}. It still works for now.');
  devWarn(openProp !== undefined && !onOpenChange && !onClose, 'Drawer', 'a controlled drawer needs onOpenChange, or × and Esc cannot close it.');
  const [open, setOpen] = useOpenState({ open: openProp, defaultOpen, onOpenChange });
  const [asking, setAsking] = React.useState(false);
  const qid = React.useId();
  const close = (reason: OpenChangeReason) => {
    setAsking(false);
    setOpen(false, reason);
    onClose?.();
  };
  // Unsaved changes: the question replaces the footer, in the drawer, instead of a dialog over the whole page.
  const back = React.useRef<HTMLElement | null>(null);
  const request = (reason: OpenChangeReason = 'cancel') => {
    if (!dirty) return close(reason);
    const a = document.activeElement;
    back.current = a instanceof HTMLElement && a !== document.body ? a : null;
    setAsking(true);
  };
  const keep = React.useRef<HTMLButtonElement>(null);
  const wasAsking = React.useRef(false);
  React.useEffect(() => {
    if (asking) keep.current?.focus();
    // Back to editing: focus returns to where it was before the question (the × or the field), not to the page.
    else if (wasAsking.current && open) {
      const to = back.current?.isConnected ? back.current : null;
      const f = to ?? firstField();
      if (f instanceof HTMLElement) f.focus();
    }
    wasAsking.current = asking;
  }, [asking]);
  const panel = React.useRef<HTMLDivElement>(null);
  // Focus the first field (or action), not the close button.
  const firstField = () =>
    panel.current?.querySelector<HTMLElement>(
      '.ui-drawer-body :is(input, textarea, select, button, [tabindex]):not([disabled], [tabindex="-1"]), .ui-drawer-foot button:not([disabled])',
    ) ?? true;
  const foot = actions ? (typeof actions === 'function' ? actions(() => request('cancel')) : actions) : null;
  return (
    <Base.Root
      open={open}
      onOpenChange={(next, details) => {
        if (next) return;
        // Esc while asking: back to editing.
        if (asking) return setAsking(false);
        request(baseReason(details?.reason));
      }}
    >
      <Base.Portal>
        <Base.Backdrop className="ui-drawer-backdrop" />
        <Base.Popup ref={panel} initialFocus={firstField} className={side === 'left' ? 'ui-drawer is-left' : 'ui-drawer'} style={width ? { width } : undefined}>
          <div className="ui-drawer-head">
            <div className="ui-drawer-heading">
              <Base.Title className="ui-drawer-title">{title}</Base.Title>
              {description ? <Base.Description className="ui-drawer-desc">{codeText(description)}</Base.Description> : null}
            </div>
            <button type="button" className="ui-drawer-close ui-dialog-close" aria-label={tr('關閉')} onClick={() => request('close')}>
              <Icon name="x" />
            </button>
          </div>
          <div className="ui-drawer-body">{children}</div>
          {asking ? (
            <div className="ui-drawer-foot is-asking" role="group" aria-labelledby={qid} aria-describedby={qid + '-t'}>
              <div className="ui-drawer-ask">
                <div id={qid} className="ui-drawer-ask-title">
                  {confirmTitle || tr('放棄未儲存的變更？')}
                </div>
                <div id={qid + '-t'} className="ui-drawer-ask-text">
                  {codeText(confirmText || tr('關閉後，剛才的修改不會保留。'))}
                </div>
              </div>
              <div className="ui-drawer-ask-actions">
                <Button ref={keep} onClick={() => setAsking(false)}>
                  {tr('繼續編輯')}
                </Button>
                <Button variant="danger" confirmed onClick={() => close('confirm')}>
                  {tr('放棄')}
                </Button>
              </div>
            </div>
          ) : foot ? (
            <div className="ui-drawer-foot">{foot}</div>
          ) : null}
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}
