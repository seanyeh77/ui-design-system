import * as React from 'react';
import { format } from '../../format';
import { devWarn } from '../../internal/dev';
import { I18N, tr } from '../../i18n';
import { kpiText, smoothPath, useCountUp, useFitText, type Point } from '../../internal/chart';
import { cx, digits } from '../../internal/util';
import { codeText } from '../InlineCode/InlineCode';

export interface KpiCardProps {
  /** What is measured: 「本月營收」. */
  label: string;
  /** The figure, as a number (counts up from 0 when it appears). */
  value: number;
  /** 'money' shows NT$ 1,280; 'percent' 1 decimal without the % sign: pass unit="%" (same as DataTable). Default 'number'. */
  format?: 'number' | 'money' | 'percent';
  /** For money. Default: the locale's currency (TWD). */
  currency?: string;
  /** Abbreviate from 1 萬 (default true). The only place numbers are abbreviated. */
  compact?: boolean;
  /** Written after the number: 元, 人, ms, %. */
  unit?: string;
  /** Digits after the decimal point, for the figure and its change (delta). Default 0 for the figure; the change then
   *  keeps 1 (%) or 2 (pt). */
  decimals?: number;
  /** Change versus the comparison period. */
  delta?: number;
  /** '%' (default) or 'pt' for percentage points. */
  deltaUnit?: '%' | 'pt';
  /** Which way is better: 'up' (default; revenue, users) or 'down' (error rate, response time, cost). Sets good or bad from delta's sign. */
  direction?: 'up' | 'down';
  /** Overrides direction: whether this change is good (true) or bad (false), whatever its sign. */
  good?: boolean;
  /** Recent values for the sparkline. */
  spark?: number[];
  /** The comparison period after the change. Default 「較上週」. */
  compareLabel?: string;
  /** Its own class names. */
  className?: string;
  /** `compact`: a 22 px number for a top bar, no sparkline; with verdict and target below. Default 'default' (31 px). */
  size?: 'default' | 'compact';
  /** How the figure is judged, in words: 「預測準確」(success), 「偏差變大」(warning), 「需要校正」(danger). Shown only
   *  when it is not success, in place of the target line and in its color; screen readers always hear it. `backticks` are code. */
  verdict?: { tone: 'success' | 'warning' | 'danger'; text: string };
  /** One gray line under the number, e.g. 「目標 ≤ 0.5 °C（示意）」; `backticks` are code. */
  target?: string;
}

/** Chinese in a figure (the 萬 and 億 of an abbreviated number) in the text font and drawn like the unit (smaller,
 *  muted); Geist Mono stays on the digits. */
function sansCjk(text: string): React.ReactNode[] {
  // The space before 萬 is the unit's margin (CSS), not a space as wide as a Geist Mono digit.
  return text.split(/\s*([\u2e80-\u9fff\uff00-\uffef]+)/).map((t, i) =>
    i % 2 ? (
      <span key={i} className="ui-kpi-cjk">
        {t}
      </span>
    ) : (
      t
    ),
  );
}

/** One figure with its change and a sparkline. It is a card: put several in a grid, not inside another Card. */
export function KpiCard(props: KpiCardProps) {
  const { label, value, unit, decimals = 0, delta, deltaUnit, direction = 'up', good, spark, compareLabel, size = 'default', verdict, target, className } = props;
  const compact = size === 'compact';
  devWarn(compact && !!spark, 'KpiCard', 'size="compact" draws no sparkline, so spark is ignored. Drop spark, or use the default size.');
  devWarn(props.format === 'percent' && !unit, 'KpiCard', 'format=\'percent\' shows the number only; pass unit="%" for the smaller % after it.');
  const t = useCountUp(value, 900);
  const valRef = React.useRef<HTMLDivElement>(null);
  useFitText(valRef, [value, props.format, unit, decimals, props.compact, props.currency, I18N.locale]);
  const hasDelta = typeof delta === 'number';
  const up = hasDelta && delta > 0;
  const flat = hasDelta && delta === 0;
  // No change is neither good nor bad: no arrow, no word, muted.
  const isGood = good ?? (direction === 'down' ? hasDelta && delta < 0 : up);
  // The change follows decimals when it is given (decimals={1}: 「0.4 個百分點」, not 「0.40」).
  const dTxt = hasDelta
    ? deltaUnit === 'pt'
      ? tr('{n} 個百分點', { n: format.number(Math.abs(delta), props.decimals ?? 2) })
      : format.percent(Math.abs(delta), props.decimals ?? 1)
    : '';
  let sparkD: string | null = null;
  if (!compact && spark && spark.length > 1) {
    const mx = Math.max(...spark);
    const mn = Math.min(...spark);
    sparkD = smoothPath(spark.map((v, i): Point => [(i * 160) / (spark.length - 1), 32 - ((v - mn) / (mx - mn || 1)) * 28]));
  }
  const showUnit = unit && props.format !== 'money';
  return (
    <section className={cx('ui-kpi', compact && 'is-compact', className)}>
      <div className="ui-kpi-label">{label}</div>
      <div ref={valRef} className="ui-kpi-value">
        {/* The final figure for screen readers, as text (an aria-label on a div without a role is not read); the
            counting figure is hidden from them. */}
        <span className="ui-visually-hidden">{kpiText(value, props, decimals) + (showUnit ? ' ' + unit : '')}</span>
        <span className="ui-kpi-num" aria-hidden="true">
          <span className="ui-kpi-sizer">{sansCjk(kpiText(value, props, decimals))}</span>
          <span className="ui-kpi-live">{sansCjk(kpiText(value * t, props, decimals))}</span>
        </span>
        {showUnit ? (
          <span className="ui-kpi-unit" aria-hidden="true">
            {unit}
          </span>
        ) : null}
      </div>
      {sparkD ? (
        <svg className="ui-kpi-spark" width="100%" height={36} viewBox="0 0 160 36" preserveAspectRatio="none" aria-hidden="true">
          <path d={sparkD} fill="none" stroke="var(--chart-1)" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : null}
      {hasDelta ? (
        <div className="ui-kpi-delta">
          <span className={cx('ui-kpi-change', flat ? 'is-flat' : isGood ? 'is-good' : 'is-bad')}>
            {flat ? '' : up ? '▲ ' : '▼ '}
            {digits(dTxt)}
          </span>
          {/* Good or bad is not only a colour (WCAG 1.4.1): the word follows the comparison period, muted. */}
          <span className="ui-kpi-note">
            {(compareLabel || tr('較上週')) + (flat ? '' : isGood ? tr('（改善）') : tr('（變差）'))}
          </span>
        </div>
      ) : null}
      {verdict || target ? (
        verdict && verdict.tone !== 'success' ? (
          <div className={'ui-kpi-target ui-kpi-verdict is-' + verdict.tone}>
            {codeText(target ? tr('{v}（{t}）', { v: verdict.text, t: target }) : verdict.text)}
          </div>
        ) : (
          <div className="ui-kpi-target">
            {verdict ? <span className="ui-visually-hidden">{codeText(verdict.text + tr('，'))}</span> : null}
            {codeText(target)}
          </div>
        )
      ) : null}
    </section>
  );
}
