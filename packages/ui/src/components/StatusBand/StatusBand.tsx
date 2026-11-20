import { seriesColor } from '../../internal/chart';
import { cx } from '../../internal/util';
import { tr } from '../../i18n';

export interface StatusSegment {
  /** First point of the segment (index). */
  from: number;
  /** The point after the last one (index), so segments meet: { from: 0, to: 6 }, { from: 6, to: 10 }. */
  to: number;
  /** One of the classes' values. */
  value: string;
}

export interface StatusBandProps {
  /** Who held each stretch of time, e.g. which control strategy was in use. */
  segments: StatusSegment[];
  /** The classes in color order (chart-1 to chart-4) with their legend words; at most 4. */
  classes: { value: string; label: string }[];
  /** What the band shows, for screen readers, e.g. 「採用的策略」. */
  label: string;
  /** How many points the time axis has; the band spans all of them. */
  count: number;
  /** One label per point (the chart's x labels), so screen readers hear 「13:00 到 14:00 AI 最佳化」. */
  times?: string[];
  /** The legend under the band. Default true. */
  legend?: boolean;
  className?: string;
}

/** A 12 px band along a time axis, one color per class (chart-1 to chart-4), e.g. which strategy was in use every
 *  10 minutes; under a LineChart (its `status`) or on its own. The legend below gives the words. */
export function StatusBand({ segments, classes, label, count, times, legend = true, className }: StatusBandProps) {
  const color = (v: string) =>
    seriesColor(
      Math.max(
        0,
        classes.findIndex((c) => c.value === v),
      ),
    );
  const name = (v: string) => classes.find((c) => c.value === v)?.label ?? v;
  const said = segments
    .map((s) => (times ? times[s.from] + ' ' + tr('到') + ' ' + (times[s.to] ?? times[times.length - 1]) + ' ' : '') + name(s.value))
    .join(tr('，'));
  return (
    <div className={cx('ui-statusband', className)}>
      <div className="ui-statusband-bar" role="img" aria-label={label + tr('：') + (said || tr('沒有資料'))}>
        {segments.map((s, i) => (
          <span
            key={i}
            style={{ left: (s.from / count) * 100 + '%', width: ((Math.min(count, s.to) - s.from) / count) * 100 + '%', background: color(s.value) }}
          />
        ))}
      </div>
      {legend ? <StatusLegend classes={classes} label={label} /> : null}
    </div>
  );
}

/** The legend of a StatusBand: its label, then a swatch and the words for each class. */
export function StatusLegend({ classes, label }: Pick<StatusBandProps, 'classes' | 'label'>) {
  return (
    <div className="ui-chart-legend ui-statusband-legend" aria-hidden="true">
      <span>{label}</span>
      {classes.map((c, i) => (
        <span key={c.value}>
          <span className="ui-chart-swatch" style={{ background: seriesColor(i) }} />
          {c.label}
        </span>
      ))}
    </div>
  );
}
