import type * as React from 'react';
import { cx } from '../../internal/util';

export interface FormGridProps {
  children?: React.ReactNode;
  className?: string;
}

/** Form layout: one column, two columns from 960 px. */
export function FormGrid({ children, className }: FormGridProps) {
  return <div className={cx('ui-formgrid', className)}>{children}</div>;
}
