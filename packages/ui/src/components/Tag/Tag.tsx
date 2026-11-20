import type * as React from 'react';
import { cx } from '../../internal/util';

export interface TagProps {
  children?: React.ReactNode;
  /** `plain` (default): small gray text. `forecast`: marks a value as forecast, not measured (accent-soft fill), e.g.
   *  「預測」 beside it or on a striped `ui-forecast` area. `demo`: a whole page of sample values (warning-soft fill,
   *  bold), e.g. 「示範資料」 beside the brand; one per page. */
  variant?: 'plain' | 'forecast' | 'demo';
  className?: string;
}

/** What kind of thing an item is (「外部」「範本」): small gray text. Status uses Badge instead. Two filled kinds say
 *  where numbers come from: forecast and demo. */
export function Tag({ children, variant = 'plain', className }: TagProps) {
  return <span className={cx('ui-tag', variant !== 'plain' && 'is-' + variant, className)}>{children}</span>;
}
