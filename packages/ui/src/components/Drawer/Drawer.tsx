import * as React from 'react';
import { Dialog as Base } from '@base-ui/react/dialog';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { Dialog } from '../Dialog/Dialog';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Footer buttons: secondary first, primary last. */
  actions?: React.ReactNode;
  /** Unsaved changes: closing asks 「放棄未儲存的變更？」 first. */
  dirty?: boolean;
  /** px. Default 400. */
  width?: number;
  confirmTitle?: string;
  confirmText?: string;
  children?: React.ReactNode;
}

/** A 400 px panel from the right for editing one item without leaving the page. */
export function Drawer({ open, onClose, title, actions, dirty, width, confirmTitle, confirmText, children }: DrawerProps) {
  const [asking, setAsking] = React.useState(false);
  const request = () => (dirty ? setAsking(true) : onClose());
  return (
    <Base.Root open={open} onOpenChange={(next) => !next && request()}>
      <Base.Portal>
        <Base.Backdrop className="ui-drawer-backdrop" />
        <Base.Popup className="ui-drawer" style={width ? { width } : undefined}>
          <div className="ui-drawer-head">
            <Base.Title className="ui-drawer-title">{title}</Base.Title>
            <button type="button" className="ui-drawer-close ui-dialog-close" aria-label={tr('關閉')} onClick={request}>
              <Icon name="x" />
            </button>
          </div>
          <div className="ui-drawer-body">{children}</div>
          {actions ? <div className="ui-drawer-foot">{actions}</div> : null}
          <Dialog
            open={asking}
            onClose={() => setAsking(false)}
            title={confirmTitle || tr('放棄未儲存的變更？')}
            tone="danger"
            cancelLabel={tr('繼續編輯')}
            confirmLabel={tr('放棄')}
            onConfirm={() => {
              setAsking(false);
              onClose();
            }}
          >
            {confirmText || tr('關閉後，剛才的修改不會保留。')}
          </Dialog>
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}
