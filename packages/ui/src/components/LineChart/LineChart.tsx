import * as React from 'react';
import { CHART, ChartTip, fmtNum, niceMax, smoothPath } from '../../internal/chart';
import { cx, digits } from '../../internal/util';

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
export function LineChart({ series, labels, label, unit, max, labelEvery = 1, className }: LineChartProps) {
  const [hi, setHi] = React.useState(-1);
  const top = max || niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = labels.length || series[0]?.values.length || 0;
  const step = (R - L) / Math.max(1, n - 1);
  const X = (i: number) => L + i * step;
  const Y = (v: number) => B - (v / top) * (B - T);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  const suffix = unit ? ' ' + unit : '';
  const edge = { left: ((L - step / 2) / 640) * 100 + '%', right: ((640 - R - step / 2) / 640) * 100 + '%' };
  return (
    <div className={cx('ui-chart', className)}>
      {series.length > 1 ? (
        <div className="ui-chart-legend">
          {series.map((s, i) => (
            <span key={i}>
              <span className="ui-chart-swatch" style={{ background: CHART[i % 3] }} />
              {s.name}
            </span>
          ))}
        </div>
      ) : null}
      <div className="ui-chart-plot" onMouseLeave={() => setHi(-1)}>
        <svg viewBox="0 0 640 240" width="100%" role="img" aria-label={label}>
          {ticks.map((v, i) => (
            <g key={i}>
              <line x1={L} x2={R} y1={Y(v)} y2={Y(v)} className={i ? 'ui-chart-grid' : 'ui-chart-axis'} />
              <text x={L - 8} y={Y(v) + 4} textAnchor="end" className="ui-chart-tick">
                {fmtNum(v)}
              </text>
            </g>
          ))}
          {series.map((s, i) => (
            <path
              key={i}
              d={smoothPath(s.values.map((v, j) => [X(j), Y(v)]))}
              pathLength={1}
              className="ui-chart-line"
              style={{ stroke: CHART[i % 3], animationDelay: i * 150 + 'ms' }}
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
                    <span key={i} className="ui-chart-dot" style={{ top: (Y(s.values[j]) / 210) * 100 + '%', background: CHART[i % 3] }} />
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
            rows={series.map((s, i) => ({ color: CHART[i % 3], name: s.name, value: fmtNum(s.values[hi]) + suffix }))}
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
