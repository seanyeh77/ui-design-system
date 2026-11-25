import * as React from 'react';
import { ChartTable, ChartTip, axisTicks, chartKey, chartNumber, ticksDecimals, useAxisWidth, type ChartFormat } from '../../internal/chart';
import { cx, digits } from '../../internal/util';
import { tr } from '../../i18n';
import { announce } from '../../announce';

export interface BarDatum {
  /** The category's name: the x label, the tooltip and the data table. */
  label: string;
  /** Shorter x-axis label when the full one would crowd. */
  short?: string;
  /** The bar's value, in unit. */
  value: number;
}

export interface BarChartProps {
  /** One bar per item, in order. */
  data: BarDatum[];
  /** Describes the chart for screen readers. */
  label: string;
  /** After each value, and above the y axis, e.g. 「次」. */
  unit?: string;
  /** Decimals of the values in the tooltip. Default 0. */
  decimals?: number;
  /** 'compact': the axis and the tooltip write 128 萬 and 1.5 億 (12.8M in English) instead of 1,280,000. Default
   *  'number'. */
  format?: ChartFormat;
  /** Top of the y axis. Default: the first round tick at or above the largest value. */
  max?: number;
  /** Height of the bars' area in px, or 'fill' to fill the parent's height (a Card in a Grid row as tall as its
   *  neighbours), at least 160 px. Default 200. */
  height?: number | 'fill';
  /** Extra class on the root element. */
  className?: string;
}

/** Compares a few categories: rounded bars that grow in, a tooltip on hover. */
export function BarChart({ data, label, unit, decimals, format: fmt, max, height = 200, className }: BarChartProps) {
  const [hi, setHi] = React.useState(-1);
  const root = React.useRef<HTMLDivElement>(null);
  const ticks = axisTicks(0, Math.max(1, ...data.map((d) => d.value)), { top: max, dec: decimals });
  const top = ticks[ticks.length - 1];
  const tickDec = fmt === 'compact' ? undefined : ticksDecimals(ticks);
  const tickText = ticks.map((t) => chartNumber(t, fmt, tickDec));
  // The y labels' own width: a 7-figure value or 「150 萬」 is never drawn outside the card.
  const axisW = useAxisWidth(root, tickText) + 8;
  const suffix = unit ? ' ' + unit : '';
  const val = (v: number) => chartNumber(v, fmt, decimals) + suffix;
  const show = (i: number) => {
    setHi(i);
    announce(data[i].label + tr('：') + val(data[i].value));
  };
  const fill = height === 'fill';
  return (
    <div
      ref={root}
      className={cx('ui-chart', fill && 'is-fill', className)}
      style={{ '--axis-w': axisW + 'px', ...(fill ? {} : { '--bars-h': height + 'px' }) } as React.CSSProperties}
    >
      {unit ? (
        <div className="ui-chart-axisunit" aria-hidden="true">
          {unit}
        </div>
      ) : null}
      <div
        className="ui-bars"
        // Keys move between bars inside it: an application, so screen readers pass the arrows on. The values are also
        // in the data table after it.
        role="application"
        aria-label={label}
        aria-roledescription={tr('長條圖')}
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
        {ticks.map((t, i) => (
          <div key={'g' + i} className={cx('ui-bars-grid', !i && 'is-axis')} style={{ bottom: (t / top) * 100 + '%' }}>
            <span className="ui-chart-tick">{tickText[i]}</span>
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
                    rows={[{ name: d.label, value: val(d.value) }]}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className="ui-bars-labels" aria-hidden="true">
        {data.map((d, i) => (
          <span key={i}>{digits(d.short || d.label)}</span>
        ))}
      </div>
      <ChartTable
        caption={label}
        head={[tr('項目'), unit ? tr('數值（{unit}）', { unit }) : tr('數值')]}
        rows={data.map((d) => [d.label, chartNumber(d.value, fmt, decimals)])}
      />
    </div>
  );
}
