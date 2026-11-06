import * as React from 'react';
import { format } from '../../format';
import { devWarn } from '../../internal/dev';
import { I18N, tr } from '../../i18n';
import { kpiText, smoothPath, useCountUp, useFitText, type Point } from '../../internal/chart';
import { cx, digits } from '../../internal/util';

export interface KpiCardProps {
  /** What is measured: 「本月營收」. */
  label: string;
  value: number;
  /** 'money' shows NT$ 1,280; 'percent' 1 decimal. Default 'number'. */
  format?: 'number' | 'money' | 'percent';
  /** For money. Default: the locale's currency (TWD). */
  currency?: string;
  /** Abbreviate from 1 萬 (default true). The only place numbers are abbreviated. */
  compact?: boolean;
  /** Written after the number: 元, 人, ms, %. */
  unit?: string;
  decimals?: number;
  /** Change versus the comparison period. */
  delta?: number;
  /** '%' (default) or 'pt' for percentage points. */
  deltaUnit?: '%' | 'pt';
  /** Whether the change is good. Default: delta > 0. Set false where up is bad (error rate, cost). */
  good?: boolean;
  /** Recent values for the sparkline. */
  spark?: number[];
  /** Default 「較上週」. */
  compareLabel?: string;
  className?: string;
}

/** One figure with its change and a sparkline. It is a card: put several in a grid, not inside another Card. */
export function KpiCard(props: KpiCardProps) {
  const { label, value, unit, decimals = 0, delta, deltaUnit, good, spark, compareLabel, className } = props;
  devWarn(props.format === 'percent' && !unit, 'KpiCard', 'format=\'percent\' shows the number only; pass unit="%" for the smaller % after it.');
  const t = useCountUp(value, 900);
  const valRef = React.useRef<HTMLDivElement>(null);
  useFitText(valRef, [value, props.format, unit, decimals, props.compact, props.currency, I18N.locale]);
  const hasDelta = typeof delta === 'number';
  const up = hasDelta && delta > 0;
  const isGood = good ?? up;
  const dTxt = hasDelta ? (deltaUnit === 'pt' ? tr('{n} 個百分點', { n: format.number(Math.abs(delta), 2) }) : format.percent(Math.abs(delta))) : '';
  let sparkD: string | null = null;
  if (spark && spark.length > 1) {
    const mx = Math.max(...spark);
    const mn = Math.min(...spark);
    sparkD = smoothPath(spark.map((v, i): Point => [(i * 160) / (spark.length - 1), 32 - ((v - mn) / (mx - mn || 1)) * 28]));
  }
  const showUnit = unit && props.format !== 'money';
  return (
    <section className={cx('ui-kpi', className)}>
      <div className="ui-kpi-label">{label}</div>
      <div ref={valRef} className="ui-kpi-value" aria-label={kpiText(value, props, decimals) + (showUnit ? ' ' + unit : '')}>
        <span className="ui-kpi-num" aria-hidden="true">
          <span className="ui-kpi-sizer">{kpiText(value, props, decimals)}</span>
          <span className="ui-kpi-live">{kpiText(value * t, props, decimals)}</span>
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
          <span className={cx('ui-kpi-change', isGood ? 'is-good' : 'is-bad')}>
            {up ? '▲ ' : '▼ '}
            {digits(dTxt)}
          </span>
          <span className="ui-kpi-note">{compareLabel || tr('較上週')}</span>
        </div>
      ) : null}
    </section>
  );
}
