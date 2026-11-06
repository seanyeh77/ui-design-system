import { tr } from '../../i18n';
import { cx } from '../../internal/util';

export interface ProgressBarProps {
  /** 0 to 100. */
  value: number;
  label?: string;
  className?: string;
}

/** Progress of a task with a known end, with the percentage after the bar. */
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, value || 0));
  const done = v >= 100;
  return (
    <div className={cx('ui-progress', done && 'is-done', className)}>
      {label ? <div className="ui-field-label">{label}</div> : null}
      <div className="ui-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={label}>
        <div className="ui-progress-fill" style={{ width: v + '%' }} />
      </div>
      <div className="ui-progress-text">{done ? tr('完成 ✓') : Math.round(v) + '%'}</div>
    </div>
  );
}

