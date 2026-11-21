import * as React from 'react';
import { ChartTip, TICKS, chartKey, tickDecimals, niceMax, seriesColor, smoothPath, type Point } from '../../internal/chart';
import { cx, digits } from '../../internal/util';
import { format } from '../../format';
import { tr } from '../../i18n';
import { announce } from '../../announce';
import { StatusBand, StatusLegend, type StatusBandProps } from '../StatusBand/StatusBand';

export interface LineSeries {
  name: string;
  /** One value per label; null where there is none (a forecast ahead of the measurements, a gap). */
  values: (number | null)[];
  /** A dashed line, e.g. a forecast or a baseline; the legend shows it dashed too. */
  dashed?: boolean;
  /** Which chart color (chart-1 to chart-4) instead of the series' place, e.g. 3 for a forecast, 4 for a baseline. */
  color?: 1 | 2 | 3 | 4;
}

export interface LineBand {
  /** The two series (indexes in series) the band fills between, e.g. [0, 1] for actual and forecast. */
  between: [number, number];
  /** `diverge`: orange where the first is above the second, blue where below (diverge-pos / diverge-neg, 30%).
   *  `success`: success at 28%, for what was saved between actual use and a baseline. */
  tone: 'diverge' | 'success';
  /** Its entry in the legend, e.g. 「實際偏高／偏低」 or 「省下的電」. */
  label: string;
}

export interface LineThreshold {
  value: number;
  /** Written on the line at the right, e.g. 「上限 29 °C」. */
  label: string;
  /** `warning` for a level to watch, `danger` for a limit. */
  tone: 'warning' | 'danger';
}

export interface LineChartProps {
  /** Up to 4 series (chart-1 to chart-4); a legend with each name appears for 2 or more. */
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
  /** Bottom of the y axis. Default 0; set it for values far from 0, such as temperatures. */
  min?: number;
  /** Show every nth x label when they would crowd. */
  labelEvery?: number;
  /** Fills between two series: the one exception to lines without fills (actual and forecast, use and baseline). */
  band?: LineBand;
  /** The point that is now: a 「現在」 line, and the part after it striped as forecast. */
  now?: number;
  /** Horizontal dashed lines for levels, e.g. a warning level and a limit. */
  thresholds?: LineThreshold[];
  /** One forecast point ahead, e.g. the next round: a hollow circle with its label. Its color is the series'. */
  marker?: { at: number; value: number; label: string; series?: number };
  /** A playhead at this point, for replaying: an accent line with a round handle on the x axis. Dragging (mouse,
   *  touch) or ← → Home End on the chart move it. */
  playhead?: number;
  onPlayheadChange?: (at: number) => void;
  /** A large figure above the chart, e.g. 「省 186 kWh（約 12%）」. */
  headline?: React.ReactNode;
  /** Shown in place of the lines when no series has a value. Default 「這段時間沒有資料」. */
  empty?: string;
  /** Height of the plot in px, axes included (x labels, the status band and the legend come on top). Default 240.
   *  Text in the chart stays at its own size however wide the chart is. */
  height?: number;
  /** A status band under the x axis, aligned with the points (StatusBand without its own spacing). */
  status?: Omit<StatusBandProps, 'count' | 'times' | 'legend' | 'className'>;
  className?: string;
}

/** Plot geometry in px: y labels left of L, the 現在 label above T, the playhead handle below B. */
const L = 40;
const T = 10;
const BELOW = 30;

/** Runs of consecutive points that have values. */
function runs(values: (number | null)[], X: (i: number) => number, Y: (v: number) => number): Point[][] {
  const out: Point[][] = [];
  let cur: Point[] = [];
  values.forEach((v, i) => {
    if (v == null || Number.isNaN(v)) {
      if (cur.length) out.push(cur);
      cur = [];
    } else cur.push([X(i), Y(v)]);
  });
  if (cur.length) out.push(cur);
  return out;
}

/** A trend over time: smooth lines, 5 grid lines, a guide and tooltip on hover. For monitoring it can also compare a
 *  forecast with what happened (band, now, thresholds, marker) and replay with a playhead. */
const colorOf = (s: LineSeries | undefined, i: number) => (s?.color ? seriesColor(s.color - 1) : seriesColor(i));

export function LineChart({
  series,
  labels,
  label,
  unit,
  decimals,
  max,
  min = 0,
  labelEvery = 1,
  band,
  now,
  thresholds,
  marker,
  playhead,
  onPlayheadChange,
  headline,
  status,
  empty,
  height = 240,
  className,
}: LineChartProps) {
  const [hi, setHi] = React.useState(-1);
  const plot = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(640);
  React.useLayoutEffect(() => {
    const el = plot.current;
    if (!el) return;
    const fit = () => {
      if (el.clientWidth > 0) setW(el.clientWidth);
    };
    fit();
    if (typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const R = W - 10;
  const B = height - BELOW;
  const stripes = 'ui-stripes-' + React.useId().replace(/:/g, '');
  const dragging = React.useRef(false);
  const all = series.flatMap((s) => s.values.filter((v): v is number => v != null));
  const top = max ?? niceMax(Math.max(min + 1, ...all, ...(thresholds ?? []).map((t) => t.value)) - min) + min;
  const n = labels.length || series[0]?.values.length || 0;
  const step = (R - L) / Math.max(1, n - 1);
  const X = (i: number) => L + i * step;
  const Y = (v: number) => B - ((v - min) / (top - min)) * (B - T);
  const ticks = TICKS.map((f) => min + f * (top - min));
  const suffix = unit ? ' ' + unit : '';
  const num = (v: number | null | undefined) => (v == null ? '—' : format.number(v, decimals) + suffix);
  const replay = playhead != null && !!onPlayheadChange;
  const show = (j: number) => {
    setHi(j);
    announce(
      labels[j] +
        tr('：') +
        series
          .filter((s) => s.values[j] != null)
          .map((s) => (series.length > 1 ? s.name + ' ' : '') + num(s.values[j]))
          .join(tr('，')),
    );
  };
  const move = (j: number) => {
    if (replay) onPlayheadChange(j);
    show(j);
  };
  const at = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    return Math.max(0, Math.min(n - 1, Math.round((x - L) / step)));
  };
  const edge = { left: ((L - step / 2) / W) * 100 + '%', right: ((W - R - step / 2) / W) * 100 + '%' };
  const legend = series.length > 1 || band;
  // Fewer x labels when they would touch: Geist Mono 12 px is about 7.5 px a character, 12 px between labels.
  const widest = Math.max(0, ...labels.map((lb) => lb.length)) * 7.5 + 12;
  const every = Math.max(labelEvery, Math.ceil((n * widest) / Math.max(1, R - L) / labelEvery) * labelEvery);
  // The marker's label goes left of the point when it would run past the right edge (CJK about 14 px a character).
  const markerLeft = marker ? X(marker.at) + 10 + [...marker.label].reduce((w, c) => w + (c.charCodeAt(0) > 0x2e80 ? 14 : 8), 0) > W : false;
  // Band: one quadrilateral per step where both series have values, colored by which one is higher.
  const bandShapes: { d: string; up: boolean }[] = [];
  if (band) {
    const a = series[band.between[0]]?.values ?? [];
    const b = series[band.between[1]]?.values ?? [];
    for (let i = 0; i < n - 1; i++) {
      const a0 = a[i],
        a1 = a[i + 1],
        b0 = b[i],
        b1 = b[i + 1];
      if (a0 == null || a1 == null || b0 == null || b1 == null) continue;
      bandShapes.push({
        d: `M${X(i)},${Y(a0)} L${X(i + 1)},${Y(a1)} L${X(i + 1)},${Y(b1)} L${X(i)},${Y(b0)} Z`,
        up: a0 + a1 >= b0 + b1,
      });
    }
  }
  const tipRows = (j: number) => {
    const rows = series
      .map((s, i) => ({ color: colorOf(series[i], i), name: s.name, value: s.values[j] }))
      .filter((r) => r.value != null)
      .map((r) => ({ ...r, value: num(r.value) }));
    if (band) {
      const a = series[band.between[0]]?.values[j];
      const b = series[band.between[1]]?.values[j];
      if (a != null && b != null) rows.push({ color: '', name: tr('差'), value: (a - b > 0 ? '+' : '') + num(a - b) });
    }
    return rows;
  };
  const shown = hi >= 0 ? hi : -1;
  return (
    <div className={cx('ui-chart', className)}>
      {headline ? <div className="ui-chart-headline">{headline}</div> : null}
      {legend ? (
        <div className="ui-chart-legend">
          {series.map((s, i) => (
            <span key={i}>
              <span
                className={cx('ui-chart-swatch', s.dashed && 'is-dashed')}
                style={{ background: s.dashed ? undefined : colorOf(series[i], i), color: colorOf(series[i], i) }}
              />
              {s.name}
            </span>
          ))}
          {band ? (
            <span>
              <span className={cx('ui-chart-swatch', 'is-band', 'is-' + band.tone)} />
              {band.label}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        ref={plot}
        className={cx('ui-chart-plot', replay && 'is-replay')}
        tabIndex={n ? 0 : undefined}
        role="group"
        aria-label={label}
        aria-description={replay ? tr('左右方向鍵移動播放頭') : tr('左右方向鍵查看每一個時間點的數值')}
        onMouseLeave={() => !dragging.current && setHi(-1)}
        // The keyboard sees the values too: ← → move between points, each read aloud as it shows.
        onFocus={() => hi < 0 && n && show(replay ? playhead : 0)}
        onBlur={() => setHi(-1)}
        onKeyDown={(e) => {
          const to = chartKey(e, replay ? playhead : hi, n);
          if (to != null) move(to);
        }}
        onPointerDown={
          replay
            ? (e) => {
                if (e.button !== 0) return;
                dragging.current = true;
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  /* a pointer the browser no longer tracks: dragging still works inside the chart */
                }
                move(at(e));
              }
            : undefined
        }
        onPointerMove={
          replay
            ? (e) => {
                if (dragging.current) move(at(e));
              }
            : undefined
        }
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        {/* The group around it carries the name and the keys. */}
        <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} aria-hidden="true">
          {now != null && now < n - 1 ? (
            <>
              {/* After now everything is forecast: the same 45° stripes as ui-forecast (4 px line, 9 px period). */}
              <defs>
                <pattern id={stripes} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="4" height="9" className="ui-chart-stripe" />
                </pattern>
              </defs>
              <rect x={X(now)} y={T} width={R - X(now)} height={B - T} fill={`url(#${stripes})`} />
            </>
          ) : null}
          {ticks.map((v, i) => (
            <g key={i}>
              <line x1={L} x2={R} y1={Y(v)} y2={Y(v)} className={i ? 'ui-chart-grid' : 'ui-chart-axis'} />
              <text x={L - 8} y={Y(v) + 4} textAnchor="end" className="ui-chart-tick">
                {format.number(v, tickDecimals(top - min))}
              </text>
            </g>
          ))}
          {bandShapes.map((s, i) => (
            <path key={i} d={s.d} className={cx('ui-chart-band', band?.tone === 'success' ? 'is-success' : s.up ? 'is-pos' : 'is-neg')} />
          ))}
          {(thresholds ?? []).map((t, i) => (
            <g key={i} className={'ui-chart-threshold is-' + t.tone}>
              <line x1={L} x2={R} y1={Y(t.value)} y2={Y(t.value)} />
              <text x={R - 2} y={Y(t.value) - 5} textAnchor="end">
                {t.label}
              </text>
            </g>
          ))}
          {series.map((s, i) =>
            runs(s.values, X, Y).map((pts, k) => (
              <path
                key={i + '-' + k}
                d={smoothPath(pts)}
                pathLength={s.dashed ? undefined : 1}
                className={cx('ui-chart-line', s.dashed && 'is-dashed')}
                style={{ stroke: colorOf(series[i], i), animationDelay: i * 150 + 'ms' }}
              />
            )),
          )}
          {now != null ? (
            <g className="ui-chart-now">
              <line x1={X(now)} x2={X(now)} y1={T - 4} y2={B} />
              <text x={X(now)} y={T - 8} textAnchor="middle">
                {tr('現在')}
              </text>
            </g>
          ) : null}
          {marker ? (
            <g className="ui-chart-marker">
              <circle
                cx={X(marker.at)}
                cy={Y(marker.value)}
                r={5.5}
                style={{ stroke: colorOf(series[marker.series ?? series.length - 1], marker.series ?? series.length - 1) }}
              />
              <text x={X(marker.at) + (markerLeft ? -10 : 10)} y={Y(marker.value) + 20} textAnchor={markerLeft ? 'end' : 'start'}>
                {marker.label}
              </text>
            </g>
          ) : null}
          {replay ? (
            <g className="ui-chart-playhead">
              <line x1={X(playhead)} x2={X(playhead)} y1={T} y2={B} />
              <circle cx={X(playhead)} cy={B} r={8} />
            </g>
          ) : null}
        </svg>
        <div className="ui-chart-hit" style={{ ...edge, bottom: BELOW }}>
          {labels.map((_, j) => (
            <div key={j} onMouseEnter={() => !dragging.current && setHi(j)} className="ui-chart-col">
              {shown === j ? (
                <>
                  <div className="ui-chart-guide" />
                  {series.map((s, i) => {
                    const v = s.values[j];
                    return v == null ? null : (
                      <span key={i} className="ui-chart-dot" style={{ top: (Y(v) / B) * 100 + '%', background: colorOf(series[i], i) }} />
                    );
                  })}
                </>
              ) : null}
            </div>
          ))}
        </div>
        {!all.length ? <div className="ui-chart-empty">{empty ?? tr('這段時間沒有資料')}</div> : null}
        {shown >= 0 ? (
          <ChartTip
            title={labels[shown]}
            style={{ left: (X(shown) / W) * 100 + '%', transform: shown > n * 0.65 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}
            rows={tipRows(shown)}
          />
        ) : null}
      </div>
      {status ? (
        <div style={{ marginLeft: edge.left, marginRight: edge.right }}>
          <StatusBand {...status} count={n} times={labels} legend={false} className="is-attached" />
        </div>
      ) : null}
      <div className="ui-chart-xlabels" style={{ marginLeft: edge.left, marginRight: edge.right }}>
        {labels.map((lb, j) => (
          <span key={j}>{every > 1 && j % every ? '' : digits(lb)}</span>
        ))}
      </div>
      {status ? <StatusLegend classes={status.classes} label={status.label} /> : null}
    </div>
  );
}
