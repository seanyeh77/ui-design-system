import type * as React from 'react';
import { cx } from '../../internal/util';

export interface GridProps {
  /** Columns from 1280 px. 960–1279 px: 4 becomes 2, 6 becomes 3, 1, 2 and 3 stay. 600–959 px: 2 (1 stays 1).
   *  Under 600 px: 1. Default 3. */
  columns?: 1 | 2 | 3 | 4 | 6;
  children: React.ReactNode;
  className?: string;
}

/** Equal columns for Cards and KpiCards, 24 px apart. Use it instead of writing your own CSS grid. */
export function Grid({ columns = 3, children, className }: GridProps) {
  return <div className={cx('ui-grid', 'is-' + columns, className)}>{children}</div>;
}

export interface PageProps {
  children: React.ReactNode;
  className?: string;
}

/** The content of a page: sections and Grids stacked 32 px apart. */
export function Page({ children, className }: PageProps) {
  return <div className={cx('ui-page', className)}>{children}</div>;
}
