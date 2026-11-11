import type * as React from 'react';
import { cx } from '../../internal/util';

export interface DetailListItem {
  label: string;
  value: React.ReactNode;
}

export interface DetailListProps {
  items: DetailListItem[];
  /** The label column. Default: 30 % of the width (at least 96 px). 'auto': as wide as the longest label (at most
   *  40 %), the same on every row, 24 px before the values; a number: that many px. Under 600 px labels go above. */
  labelWidth?: 'auto' | number;
  /** small (default): 13 px, muted. body: the value's size (16 px) and the ink color, for wide panels where a pale small
   *  label is hard to read. Under 600 px labels stay 13 px. */
  labelSize?: 'small' | 'body';
  className?: string;
}

/** Labelled facts about one item: label beside the value when there is room, above it under 600 px. */
export function DetailList({ items, labelWidth, labelSize, className }: DetailListProps) {
  return (
    <dl
      className={cx('ui-dl', labelWidth === 'auto' && 'is-auto', typeof labelWidth === 'number' && 'is-fixed', labelSize === 'body' && 'is-body', className)}
      style={typeof labelWidth === 'number' ? ({ '--dl-label': labelWidth + 'px' } as React.CSSProperties) : undefined}
    >
      {items.map((it, i) => (
        <div key={i} className="ui-dl-item">
          <dt>{it.label}</dt>
          <dd>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
