import * as React from 'react';
import { ChartTip, fmtNum, niceMax } from '../../internal/chart';
import { cx } from '../../internal/util';

export interface BarDatum {
  label: string;
  /** Shorter x-axis label when the full one would crowd. */
  short?: string;
  value: number;
}

export interface BarChartProps {
  data: BarDatum[];
  /** Describes the chart for screen readers. */
  label: string;
  unit?: string;
  max?: number;
  className?: string;
}

/** Compares a few categories: rounded bars that grow in, a tooltip on hover. */
export function BarChart({ data, label, unit, max, className }: BarChartProps) {
  const [hi, setHi] = React.useState(-1);
  const top = max || niceMax(Math.max(1, ...data.map((d) => d.value)));
  const suffix = unit ? ' ' + unit : '';
  return (
    <div className={cx('ui-chart', className)}>
      <div className="ui-bars" role="img" aria-label={label} onMouseLeave={() => setHi(-1)}>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <div key={'g' + i} className={cx('ui-bars-grid', !i && 'is-axis')} style={{ bottom: f * 100 + '%' }}>
            <span className="ui-chart-tick">{fmtNum(f * top)}</span>
          </div>
        ))}
        <div className="ui-bars-row">
          {data.map((d, i) => {
            const ht = (d.value / top) * 100 + '%';
            return (
              <div key={i} className="ui-bar-slot" onMouseEnter={() => setHi(i)}>
                <div className="ui-bar" style={{ height: ht, animationDelay: i * 40 + 'ms', opacity: hi >= 0 && hi !== i ? 0.55 : 1 }} />
                {hi === i ? <ChartTip style={{ bottom: `calc(${ht} + 8px)`, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }} rows={[{ name: d.label, value: fmtNum(d.value) + suffix }]} /> : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className="ui-bars-labels">
        {data.map((d, i) => (
          <span key={i}>{d.short || d.label}</span>
        ))}
      </div>
    </div>
  );
}
