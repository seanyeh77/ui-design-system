import type * as React from 'react';
import { cx } from '../../internal/util';

export interface DetailListItem {
  label: string;
  value: React.ReactNode;
}

export interface DetailListProps {
  items: DetailListItem[];
  className?: string;
}

/** Labelled facts about one item: label beside the value when there is room, above it under 600 px. */
export function DetailList({ items, className }: DetailListProps) {
  return (
    <dl className={cx('ui-dl', className)}>
      {items.map((it, i) => (
        <div key={i} className="ui-dl-item">
          <dt>{it.label}</dt>
          <dd>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
