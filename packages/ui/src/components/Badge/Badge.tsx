import type * as React from 'react';
import { tr } from '../../i18n';
import { cx } from '../../internal/util';

export type BadgeStatus = 'draft' | 'doing' | 'review' | 'done' | 'fail';

const STATUS: Record<BadgeStatus, { label: string; fill: string }> = {
  draft: { label: '草稿', fill: '' },
  doing: { label: '進行中', fill: 'M12 4a8 8 0 0 1 0 16z' },
  review: { label: '審核中', fill: 'M12 4a8 8 0 0 1 8 8h-8z' },
  done: { label: '完成', fill: 'M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16z' },
  fail: { label: '失敗', fill: 'M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16z' },
};

export interface BadgeProps {
  status: BadgeStatus;
  /** 'dot' on cards: a mark and colored text, no chip. Default 'chip'. */
  variant?: 'chip' | 'dot';
  /** Default: the status name (草稿, 進行中, 審核中, 完成, 失敗). */
  children?: React.ReactNode;
  className?: string;
}

/** Status of an item. The mark's shape carries the status too, so it never depends on color alone. */
export function Badge({ status, variant = 'chip', children, className }: BadgeProps) {
  const st = STATUS[status] ? status : 'draft';
  return (
    <span className={cx('ui-badge', 'ui-badge-' + st, variant === 'dot' && 'is-dot', className)}>
      <svg className="ui-badge-mark" width={15} height={15} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx={12} cy={12} r={8} fill="none" stroke="currentColor" strokeWidth={2.5} />
        {STATUS[st].fill ? <path d={STATUS[st].fill} fill="currentColor" /> : null}
      </svg>
      <span className="ui-badge-text">{children || tr(STATUS[st].label)}</span>
    </span>
  );
}

