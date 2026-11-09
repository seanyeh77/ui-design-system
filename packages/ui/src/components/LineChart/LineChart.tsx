import * as React from 'react';
import { ChartTip, TICKS, chartKey, tickDecimals, niceMax, seriesColor, smoothPath } from '../../internal/chart';
import { cx, digits } from '../../internal/util';
import { format } from '../../format';
import { tr } from '../../i18n';
import { announce } from '../../announce';

export interface LineSeries {
  name: string;
  values: number[];
}

export interface LineChartProps {
  /** Up to 3 series (chart-1 to chart-3); a legend appears for 2 or more. */
  series: LineSeries[];
  /** One label per point on the x axis. */
  labels: string[];
  /** Describes the chart for screen readers. */
  label: string;
  /** After each value in the tooltip. */
  unit?: string;
  /** Decimals of the values in the tooltip. Default 0. */
  decimals?: number;
  /** Top of the y axis. Default: a round number above the largest value. */
  max?: number;
  /** Show every nth x label when they would crowd. */
  labelEvery?: number;
  className?: string;
}

const L = 40;
const R = 630;
const T = 10;
const B = 210;

/** A trend over time: smooth lines, 5 grid lines, a guide and tooltip on hover. */
export function LineChart({ series, labels, label, unit, decimals, max, labelEvery = 1, className }: LineChartProps) {
  const [hi, setHi] = React.useState(-1);
  const top = max || niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = labels.length || series[0]?.values.length || 0;
  const step = (R - L) / Math.max(1, n - 1);
  const X = (i: number) => L + i * step;
  const Y = (v: number) => B - (v / top) * (B - T);
  const ticks = TICKS.map((f) => f * top);
  const suffix = unit ? ' ' + unit : '';
  const show = (j: number) => {
    setHi(j);
    announce(labels[j] + tr('：') + series.map((s) => (series.length > 1 ? s.name + ' ' : '') + format.number(s.values[j], decimals) + suffix).join(tr('，')));
  };
  const edge = { left: ((L - step / 2) / 640) * 100 + '%', right: ((640 - R - step / 2) / 640) * 100 + '%' };
  return (
    <div className={cx('ui-chart', className)}>
      {series.length > 1 ? (
        <div className="ui-chart-legend">
          {series.map((s, i) => (
            <span key={i}>
              <span className="ui-chart-swatch" style={{ background: seriesColor(i) }} />
              {s.name}
            </span>
          ))}
        </div>
      ) : null}
      <div
        className="ui-chart-plot"
        tabIndex={n ? 0 : undefined}
        role="group"
        aria-label={label}
        aria-description={tr('左右方向鍵查看每一個時間點的數值')}
        onMouseLeave={() => setHi(-1)}
        // The keyboard sees the values too: ← → move between points, each read aloud as it shows.
        onFocus={() => hi < 0 && n && show(0)}
        onBlur={() => setHi(-1)}
        onKeyDown={(e) => {
          const to = chartKey(e, hi, n);
          if (to != null) show(to);
        }}
      >
        {/* The group around it carries the name and the keys. */}
        <svg viewBox="0 0 640 240" width="100%" aria-hidden="true">
          {ticks.map((v, i) => (
            <g key={i}>
              <line x1={L} x2={R} y1={Y(v)} y2={Y(v)} className={i ? 'ui-chart-grid' : 'ui-chart-axis'} />
              <text x={L - 8} y={Y(v) + 4} textAnchor="end" className="ui-chart-tick">
                {format.number(v, tickDecimals(top))}
              </text>
            </g>
          ))}
          {series.map((s, i) => (
            <path
              key={i}
              d={smoothPath(s.values.map((v, j) => [X(j), Y(v)]))}
              pathLength={1}
              className="ui-chart-line"
              style={{ stroke: seriesColor(i), animationDelay: i * 150 + 'ms' }}
            />
          ))}
        </svg>
        <div className="ui-chart-hit" style={edge}>
          {labels.map((_, j) => (
            <div key={j} onMouseEnter={() => setHi(j)} className="ui-chart-col">
              {hi === j ? (
                <>
                  <div className="ui-chart-guide" />
                  {series.map((s, i) => (
                    <span key={i} className="ui-chart-dot" style={{ top: (Y(s.values[j]) / B) * 100 + '%', background: seriesColor(i) }} />
                  ))}
                </>
              ) : null}
            </div>
          ))}
        </div>
        {hi >= 0 ? (
          <ChartTip
            title={labels[hi]}
            style={{ left: (X(hi) / 640) * 100 + '%', transform: hi > n * 0.65 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}
            rows={series.map((s, i) => ({ color: seriesColor(i), name: s.name, value: format.number(s.values[hi], decimals) + suffix }))}
          />
        ) : null}
      </div>
      <div className="ui-chart-xlabels" style={{ marginLeft: edge.left, marginRight: edge.right }}>
        {labels.map((lb, j) => (
          <span key={j}>{labelEvery > 1 && j % labelEvery ? '' : digits(lb)}</span>
        ))}
      </div>
    </div>
  );
}
