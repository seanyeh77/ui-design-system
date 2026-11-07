import type * as React from 'react';
import { cx } from '../../internal/util';

export interface GridProps {
  /** Columns from 1280 px. Under 600 px there is one column; in between, at most 2. Default 3. */
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
