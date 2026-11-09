import * as React from 'react';
import { ChartTip, TICKS, chartKey, tickDecimals, niceMax } from '../../internal/chart';
import { cx, digits } from '../../internal/util';
import { format } from '../../format';
import { tr } from '../../i18n';
import { announce } from '../../announce';

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
  /** Decimals of the values in the tooltip. Default 0. */
  decimals?: number;
  max?: number;
  className?: string;
}

/** Compares a few categories: rounded bars that grow in, a tooltip on hover. */
export function BarChart({ data, label, unit, decimals, max, className }: BarChartProps) {
  const [hi, setHi] = React.useState(-1);
  const top = max || niceMax(Math.max(1, ...data.map((d) => d.value)));
  const suffix = unit ? ' ' + unit : '';
  const show = (i: number) => {
    setHi(i);
    announce(data[i].label + tr('：') + format.number(data[i].value, decimals) + suffix);
  };
  return (
    <div className={cx('ui-chart', className)}>
      <div
        className="ui-bars"
        role="img"
        aria-label={label}
        aria-description={tr('左右方向鍵查看每一項的數值')}
        tabIndex={data.length ? 0 : undefined}
        onMouseLeave={() => setHi(-1)}
        // The keyboard sees the values too: ← → move between bars, each read aloud as it shows.
        onFocus={() => hi < 0 && data.length && show(0)}
        onBlur={() => setHi(-1)}
        onKeyDown={(e) => {
          const to = chartKey(e, hi, data.length);
          if (to != null) show(to);
        }}
      >
        {TICKS.map((f, i) => (
          <div key={'g' + i} className={cx('ui-bars-grid', !i && 'is-axis')} style={{ bottom: f * 100 + '%' }}>
            <span className="ui-chart-tick">{format.number(f * top, tickDecimals(top))}</span>
          </div>
        ))}
        <div className="ui-bars-row">
          {data.map((d, i) => {
            const ht = (d.value / top) * 100 + '%';
            return (
              <div key={i} className="ui-bar-slot" onMouseEnter={() => setHi(i)}>
                <div className="ui-bar" style={{ height: ht, animationDelay: i * 40 + 'ms', opacity: hi >= 0 && hi !== i ? 0.55 : 1 }} />
                {hi === i ? (
                  <ChartTip
                    style={{ bottom: `calc(${ht} + 8px)`, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
                    rows={[{ name: d.label, value: format.number(d.value, decimals) + suffix }]}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className="ui-bars-labels">
        {data.map((d, i) => (
          <span key={i}>{digits(d.short || d.label)}</span>
        ))}
      </div>
    </div>
  );
}
