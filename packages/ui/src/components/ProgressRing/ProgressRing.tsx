import { useCountUp } from '../../internal/chart';
import { cx } from '../../internal/util';

export interface ProgressRingProps {
  /** 0 to 100. */
  value: number;
  /** What is measured; announced to screen readers. */
  label: string;
  /** Diameter in px. Default 72. */
  size?: number;
  className?: string;
}

/** A ring that fills to a percentage, for a single figure in a card. */
export function ProgressRing({ value, label, size = 72, className }: ProgressRingProps) {
  const sw = 8;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value || 0));
  const t = useCountUp(v, 900);
  const mid = size / 2;
  return (
    <svg
      className={cx('ui-ring', className)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      aria-label={label}
    >
      <circle cx={mid} cy={mid} r={r} className="ui-ring-track" strokeWidth={sw} />
      <circle
        cx={mid}
        cy={mid}
        r={r}
        className="ui-ring-fill"
        strokeWidth={sw}
        strokeDasharray={`${(((c * v) / 100) * t).toFixed(1)} ${c.toFixed(1)}`}
        transform={`rotate(-90 ${mid} ${mid})`}
      />
      <text x={mid} y={mid + 5} textAnchor="middle" className="ui-ring-text">
        {Math.round(v * t) + '%'}
      </text>
    </svg>
  );
}
