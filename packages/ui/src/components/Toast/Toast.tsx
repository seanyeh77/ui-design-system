import type * as React from 'react';
import { Icon } from '../../icons/Icon';
import { includeIcons } from '../../icons/store';
import phCheck from '../../icons/ph/check';
import { codeText } from '../InlineCode/InlineCode';

includeIcons(phCheck);

export interface ToastProps {
  /** What happened, in the past tense: 「已刪除 3 筆」; in a string, `backticks` are code. */
  children?: React.ReactNode;
  /** Usually 「復原」. */
  actionLabel?: string;
  onAction?: () => void;
}

/** A short confirmation at the bottom right. The caller shows it for 3 s. */
export function Toast({ children, actionLabel, onAction }: ToastProps) {
  return (
    <div className="ui-toast" role="status">
      <Icon name="check" className="ui-toast-icon" />
      <span>{codeText(children)}</span>
      {actionLabel ? (
        <button type="button" className="ui-toast-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
