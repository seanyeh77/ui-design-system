import { tr } from '../../i18n';
import { cx } from '../../internal/util';

export interface LoadingBarProps {
  /** Announced to screen readers. Default 「載入中」. */
  label?: string;
  className?: string;
}

/** Loading with no known end: a drop moving along a thin bar. */
export function LoadingBar({ label, className }: LoadingBarProps) {
  return (
    <div className={cx('ui-loading', className)} role="progressbar" aria-label={label || tr('載入中')} aria-busy="true">
      <div className="ui-loading-drop" />
    </div>
  );
}
