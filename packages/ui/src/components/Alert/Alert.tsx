import type * as React from 'react';
import { tr } from '../../i18n';
import { Icon, type CustomIcon } from '../../icons/Icon';
import { cx } from '../../internal/util';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const ALERT_ICONS: Record<AlertTone, CustomIcon> = {
  info: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 11v5M12 7.5v.5',
  success: 'M5 12.5l4.5 4.5L19 7',
  warning: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  danger: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 8v5M12 16.5v.5',
};

export interface AlertProps {
  /** Default 'info'. danger is announced at once (role alert). */
  tone?: AlertTone;
  title?: string;
  /** The cause and the fix, at most 2 short sentences. */
  children?: React.ReactNode;
  /** A verb, such as 重試. */
  actionLabel?: string;
  onAction?: () => void;
  /** Adds × for info and success; warning and danger stay until the problem is solved. */
  onDismiss?: () => void;
  className?: string;
}

/** A message inside the page with a colored bar and icon. */
export function Alert({ tone = 'info', title, children, actionLabel, onAction, onDismiss, className }: AlertProps) {
  const t = ALERT_ICONS[tone] ? tone : 'info';
  const canClose = (t === 'info' || t === 'success') && onDismiss;
  return (
    <div className={cx('ui-alert', 'ui-alert-' + t, className)} role={t === 'danger' ? 'alert' : 'status'}>
      <Icon d={ALERT_ICONS[t]} className="ui-alert-icon" />
      <div className="ui-alert-content">
        {title ? <div className="ui-alert-title">{title}</div> : null}
        {children ? <div className="ui-alert-body">{children}</div> : null}
      </div>
      {actionLabel ? (
        <button type="button" className="ui-btn ui-btn-secondary ui-alert-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
      {canClose ? (
        <button type="button" className="ui-alert-close" aria-label={tr('關閉提示')} onClick={onDismiss}>
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </div>
  );
}
