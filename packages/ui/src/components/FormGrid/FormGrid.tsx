import type * as React from 'react';
import { cx } from '../../internal/util';

export interface FormGridProps {
  /** The fields; give a field className="is-full" to span both columns. */
  children?: React.ReactNode;
  className?: string;
}

/** Form layout: one column, two columns when the grid itself is 640 px wide or more (in a page, not in a Drawer). */
export function FormGrid({ children, className }: FormGridProps) {
  return (
    <div className={cx('ui-formgrid', className)}>
      <div className="ui-formgrid-in">{children}</div>
    </div>
  );
}
