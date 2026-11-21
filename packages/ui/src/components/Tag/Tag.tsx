import type * as React from 'react';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';

export interface TagProps {
  children?: React.ReactNode;
  /** `plain` (default): small gray text. `forecast`: marks a value as forecast, not measured: a trend icon and the
   *  words in accent text, e.g. 「預測」 beside it. `demo`: a whole page of sample values: an info icon and the words in
   *  the color of the text beside them, e.g. 「示範資料」 beside the brand; one per page. Both take the size of the text
   *  beside them. */
  variant?: 'plain' | 'forecast' | 'demo';
  className?: string;
}

/** What kind of thing an item is (「外部」「範本」): small gray text. Status uses Badge instead. Two kinds say where
 *  numbers come from, with an icon and no fill: forecast and demo. */
export function Tag({ children, variant = 'plain', className }: TagProps) {
  return (
    <span className={cx('ui-tag', variant !== 'plain' && 'is-' + variant, className)}>
      {variant === 'forecast' ? <Icon name="trend-up" size={16} /> : variant === 'demo' ? <Icon name="info" size={16} /> : null}
      {children}
    </span>
  );
}
