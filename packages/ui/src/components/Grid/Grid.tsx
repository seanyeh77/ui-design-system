import type * as React from 'react';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';

/** Widths of unequal columns as parts of the row: [2, 1] is a main column twice as wide as its aside. */
export type GridRatio = readonly [number, number] | readonly [number, number, number];

export interface GridProps {
  /** Equal columns from 1280 px (960–1279 px: 4 becomes 2, 6 becomes 3; 600–959 px: 2; under 600 px: 1), or a ratio
   *  such as [2, 1] for a main column and an aside (one column under 960 px). Default 3. */
  columns?: 1 | 2 | 3 | 4 | 6 | GridRatio;
  /** The cards, one per cell. Several cards in one column: wrap them in a Page, which then stacks them 24 px apart. */
  children: React.ReactNode;
  /** Cards in one row: 'stretch' makes them as tall as the tallest (a chart with height="fill" fills the rest),
   *  'start' keeps each card its own height. Default 'stretch' for equal columns, 'start' for a ratio. */
  align?: 'start' | 'stretch';
  /** Extra class on the root element. */
  className?: string;
}

/** Columns for Cards and KpiCards, 24 px apart: equal, or a ratio such as [2, 1] for main and aside. Use it instead of
 *  writing your own CSS grid. */
export function Grid({ columns = 3, align, children, className }: GridProps) {
  const alignCls = align === 'stretch' ? 'is-stretch' : align === 'start' ? 'is-start' : null;
  if (Array.isArray(columns)) {
    const ratio = columns as GridRatio;
    devWarn(
      ratio.some((n) => !(n > 0)),
      'Grid',
      `columns=[${ratio.join(', ')}] has a part that is not a positive number. Give each column's share, e.g. [2, 1].`,
    );
    const template = ratio.map((n) => `minmax(0, ${n > 0 ? n : 1}fr)`).join(' ');
    return (
      <div className={cx('ui-grid', 'is-ratio', alignCls, className)} style={{ '--grid-ratio': template } as React.CSSProperties}>
        {children}
      </div>
    );
  }
  return <div className={cx('ui-grid', 'is-' + String(columns), alignCls, className)}>{children}</div>;
}

export interface PageProps {
  /** The blocks of the page, top to bottom: Grid, Card, Section. */
  children: React.ReactNode;
  /** Extra class on the root element. */
  className?: string;
}

/** The content of a page: sections and Grids stacked 32 px apart. */
export function Page({ children, className }: PageProps) {
  return <div className={cx('ui-page', className)}>{children}</div>;
}
