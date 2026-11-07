import * as React from 'react';
import { Dialog as Base } from '@base-ui/react/dialog';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { Button } from '../Button/Button';

export interface DialogProps {
  /** Shows the dialog over a blurred backdrop, with focus trapped inside and Esc to close.
   *  Required unless modal={false}. */
  open?: boolean;
  /** Called on Esc, a press on the backdrop, × and the cancel button. */
  onClose?: () => void;
  /** States the decision; may be a question: 「刪除 api-gateway？」. */
  title: string;
  /** What happens and whether it can be undone, at most 2 short sentences. */
  children?: React.ReactNode;
  /** The confirming button's label, a verb: 刪除, 發布. With onConfirm, the dialog draws its own buttons. */
  confirmLabel?: string;
  onConfirm?: () => void;
  /** Default 「取消」. */
  cancelLabel?: string;
  /** danger: the confirming button is red. */
  tone?: 'default' | 'danger';
  /** Spinner on the confirming button while the action runs. */
  confirmLoading?: boolean;
  /** Your own buttons instead of confirmLabel: secondary first, primary last. */
  actions?: React.ReactNode;
  className?: string;
  /** @deprecated the id is generated. */
  titleId?: string;
  /** false: draw the panel inline, as a static preview in docs. Without it, pass open. */
  modal?: false;
}

/** A centered 400 px dialog for a decision. Secondary button left, primary right. */
export function Dialog(props: DialogProps) {
  const { open, onClose, title, children, confirmLabel, onConfirm, cancelLabel, tone = 'default', confirmLoading, actions, className } = props;
  devWarn((confirmLabel !== undefined) !== !!onConfirm, 'Dialog', 'confirmLabel and onConfirm go together; pass both, or pass actions.');
  devWarn(
    open === undefined && props.modal !== false,
    'Dialog',
    'pass open={…} (and onClose) to show a dialog; rendering it conditionally without open draws a static panel with no focus trap or Esc. Use modal={false} for a static preview.',
  );
  devWarn(open !== undefined && !onClose, 'Dialog', 'an open dialog needs onClose, or Esc and the backdrop cannot close it.');
  const footer =
    actions ??
    (confirmLabel && onConfirm ? (
      <>
        <Button onClick={onClose}>{cancelLabel ?? tr('取消')}</Button>
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
  const inline = open === undefined;
  const closeIcon = <Icon name="x" />;
  const head = (
    <div className="ui-dialog-head">
      {inline ? (
        <div id={id} className="ui-dialog-title">
          {title}
        </div>
      ) : (
        <Base.Title className="ui-dialog-title">{title}</Base.Title>
      )}
      {onClose && inline ? (
        <button type="button" className="ui-dialog-close" aria-label={tr('關閉')} onClick={onClose}>
          {closeIcon}
        </button>
      ) : onClose ? (
        <Base.Close className="ui-dialog-close" aria-label={tr('關閉')}>
          {closeIcon}
        </Base.Close>
      ) : null}
    </div>
  );
  const content = (
    <>
      {head}
      {children ? <div className="ui-dialog-body">{children}</div> : null}
      {footer ? <div className="ui-dialog-actions">{footer}</div> : null}
    </>
  );

  if (inline) {
    // A static panel for previews and docs: no backdrop, no focus handling.
    return (
      <div className={cx('ui-dialog', className)} role="dialog" aria-labelledby={id}>
        {content}
      </div>
    );
  }
  return (
    <Base.Root open={open} onOpenChange={(next) => !next && onClose?.()}>
      <Base.Portal>
        <Base.Backdrop className="ui-backdrop" />
        <Base.Viewport className="ui-dialog-viewport">
          <Base.Popup className={cx('ui-dialog', className)}>{content}</Base.Popup>
        </Base.Viewport>
      </Base.Portal>
    </Base.Root>
  );
}
