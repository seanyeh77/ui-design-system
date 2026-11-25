import * as React from 'react';
import { Dialog as Base } from '@base-ui/react/dialog';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { baseReason, useOpenState, type OpenChangeReason } from '../../internal/open';
import { Button } from '../Button/Button';
import { includeIcons } from '../../icons/store';
import phX from '../../icons/ph/x';
import { codeText } from '../InlineCode/InlineCode';

includeIcons(phX);

interface DialogBase {
  /** States the decision; may be a question: 「刪除 api-gateway？」. */
  title: string;
  /** What happens and whether it can be undone, at most 2 short sentences; in a string, `backticks` are code. Linked
   *  to the dialog as its description (aria-describedby). */
  children?: React.ReactNode;
  /** danger: the confirming button is red, and the dialog is an alert dialog (role="alertdialog") that opens with
   *  focus on the safe button (取消) and does not close on a press outside. Default 'neutral'. ('default' is the
   *  old name of 'neutral'.) */
  tone?: 'neutral' | 'danger' | 'default';
  className?: string;
  /** @deprecated the id is generated. */
  titleId?: string;
}

/** Buttons drawn by the dialog: 取消 on the left, the confirming button on the right. */
interface DialogConfirm {
  /** The confirming button's label, a verb: 刪除, 發布. */
  confirmLabel: string;
  /** Runs on the confirming button. Close the dialog yourself when the action is done. */
  onConfirm: () => void;
  /** Default 「取消」. */
  cancelLabel?: string;
  /** Spinner on the confirming button while the action runs; the button keeps focus. */
  confirmLoading?: boolean;
  actions?: never;
}

/** Your own buttons. */
interface DialogActions {
  /** Your own buttons instead of confirmLabel: secondary first, primary last. Focus starts on the first one. */
  actions?: React.ReactNode;
  confirmLabel?: never;
  onConfirm?: never;
  cancelLabel?: never;
  confirmLoading?: never;
}

/** A real dialog over the page. */
interface DialogModal {
  /** Controlled: shown while true, over a blurred backdrop, with focus trapped inside and Esc to close. */
  open?: boolean;
  /** Uncontrolled: shown at first, then closes itself. */
  defaultOpen?: boolean;
  /** Called with false (and why) on Esc, a press on the backdrop, × and 取消. */
  onOpenChange?: (open: boolean, reason?: OpenChangeReason) => void;
  /** @deprecated use onOpenChange: called on Esc, a press on the backdrop, × and 取消. */
  onClose?: () => void;
  modal?: true;
}

/** A static panel drawn in the page, for docs and previews: no backdrop, no focus trap. */
interface DialogStatic {
  /** false: draw the panel inline, as a static preview in docs. */
  modal: false;
  /** The × and 取消 of the preview. */
  onClose?: () => void;
  open?: never;
  defaultOpen?: never;
  onOpenChange?: never;
}

export type DialogProps = DialogBase & (DialogConfirm | DialogActions) & (DialogModal | DialogStatic);

/** A centered 400 px dialog for a decision. Secondary button left, primary right. */
export function Dialog(props: DialogProps) {
  const { title, children, className } = props;
  const { confirmLabel, onConfirm, cancelLabel, confirmLoading, actions } = props as DialogBase & Partial<DialogConfirm> & { actions?: React.ReactNode };
  const { open: openProp, defaultOpen, onOpenChange, onClose } = props as Partial<DialogModal>;
  const tone = props.tone === 'default' ? 'neutral' : (props.tone ?? 'neutral');
  devWarn((confirmLabel !== undefined) !== !!onConfirm, 'Dialog', 'confirmLabel and onConfirm go together; pass both, or pass actions.');
  devWarn(
    openProp === undefined && defaultOpen === undefined && props.modal !== false,
    'Dialog',
    'pass open={…} (and onOpenChange) to show a dialog; rendering it conditionally without open draws a static panel with no focus trap or Esc. Use modal={false} for a static preview.',
  );
  devWarn(
    openProp !== undefined && !onOpenChange && !onClose,
    'Dialog',
    'an open dialog needs onOpenChange, or Esc and the backdrop cannot close it. Pass onOpenChange={(open) => setOpen(open)}.',
  );
  devWarn(!!onClose && props.modal !== false, 'Dialog', 'onClose is deprecated: use onOpenChange={(open) => !open && close()}. It still works for now.');
  const [open, setOpen] = useOpenState({ open: openProp, defaultOpen, onOpenChange });
  const close = (reason: OpenChangeReason) => {
    setOpen(false, reason);
    onClose?.();
  };
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const popup = React.useRef<HTMLDivElement>(null);
  const footer =
    actions ??
    (confirmLabel && onConfirm ? (
      <>
        <Button ref={cancelRef} onClick={() => close('cancel')}>
          {cancelLabel ?? tr('取消')}
        </Button>
        {tone === 'danger' ? (
          <Button variant="danger" confirmed loading={confirmLoading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        ) : (
          <Button variant="primary" loading={confirmLoading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        )}
      </>
    ) : null);
  const id = React.useId();
  const inline = props.modal === false || (openProp === undefined && defaultOpen === undefined);
  const closeIcon = <Icon name="x" />;
  const canClose = inline ? !!onClose : true;
  const head = (
    <div className="ui-dialog-head">
      {inline ? (
        <div id={id} className="ui-dialog-title">
          {title}
        </div>
      ) : (
        <Base.Title className="ui-dialog-title">{title}</Base.Title>
      )}
      {canClose && inline ? (
        <button type="button" className="ui-dialog-close" aria-label={tr('關閉')} onClick={onClose}>
          {closeIcon}
        </button>
      ) : canClose ? (
        <Base.Close className="ui-dialog-close" aria-label={tr('關閉')}>
          {closeIcon}
        </Base.Close>
      ) : null}
    </div>
  );
  const body = children ? (
    inline ? (
      <div id={id + '-desc'} className="ui-dialog-body">
        {codeText(children)}
      </div>
    ) : (
      <Base.Description render={<div />} className="ui-dialog-body">
        {codeText(children)}
      </Base.Description>
    )
  ) : null;
  const content = (
    <>
      {head}
      {body}
      {footer ? <div className="ui-dialog-actions">{footer}</div> : null}
    </>
  );

  if (inline) {
    // A static panel for previews and docs: no backdrop, no focus handling.
    return (
      <div
        className={cx('ui-dialog', className)}
        role={tone === 'danger' ? 'alertdialog' : 'dialog'}
        aria-labelledby={id}
        aria-describedby={children ? id + '-desc' : undefined}
      >
        {content}
      </div>
    );
  }
  const danger = tone === 'danger';
  const Root = danger ? AlertDialog.Root : Base.Root;
  // The safe action first: 取消 (or the first of your own buttons) in a danger dialog; the first button of the footer
  // otherwise, never the ×.
  const initialFocus = () =>
    (danger ? cancelRef.current : null) ?? popup.current?.querySelector<HTMLElement>('.ui-dialog-actions button:not([disabled])') ?? true;
  return (
    <Root open={open} onOpenChange={(next, details) => !next && close(baseReason(details?.reason))}>
      <Base.Portal>
        <Base.Backdrop className="ui-backdrop" />
        <Base.Viewport className="ui-dialog-viewport">
          <Base.Popup ref={popup} initialFocus={initialFocus} className={cx('ui-dialog', className)}>
            {content}
          </Base.Popup>
        </Base.Viewport>
      </Base.Portal>
    </Root>
  );
}
