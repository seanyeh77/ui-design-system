import type * as React from 'react';
import { cx } from '../../internal/util';

export interface TagProps {
  children?: React.ReactNode;
  className?: string;
}

/** What kind of thing an item is (「外部」「範本」): small gray text. Status uses Badge instead. */
export function Tag({ children, className }: TagProps) {
  return <span className={cx('ui-tag', className)}>{children}</span>;
}
