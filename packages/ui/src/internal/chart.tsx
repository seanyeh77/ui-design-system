import * as React from 'react';
import { format } from '../format';
import { reduced } from './util';
import type { KpiCardProps } from '../components/KpiCard/KpiCard';

/** 0 → 1 with an ease-out over ms, restarted when target changes; 1 at once with reduced motion. */
export function useCountUp(target: unknown, ms: number): number {
  const [t, setT] = React.useState(reduced() ? 1 : 0);
  React.useEffect(() => {
    if (reduced()) return;
    let t0: number | null = null;
    let raf = 0;
    const step = (now: number) => {
      t0 ??= now;
      const x = Math.min(1, (now - t0) / ms);
      setT(1 - (1 - x) ** 3);
      if (x < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return t;
}

/** Decimals the axis labels need so that ticks a step apart read differently (0.5, 1, 1.5). */
export const tickDecimals = (top: number): number => Math.min(3, (String(+(top / 4).toPrecision(6)).split('.')[1] ?? '').length);

export type Point = [number, number];

/** A smooth SVG path (Catmull-Rom as cubic Béziers) through the points. */
export function smoothPath(p: Point[]): string {
  const f = (q: Point) => q[0].toFixed(1) + ',' + q[1].toFixed(1);
  if (p.length < 2) return p.length ? 'M' + f(p[0]) : '';
  let d = 'M' + f(p[0]);
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p2;
    d += ` C${f([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${f([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${f(p2)}`;
  }
  return d;
}

const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];
/** The color of series i. */
export const seriesColor = (i: number): string => CHART[i % CHART.length];
/** Grid lines at these fractions of the axis maximum. */
export const TICKS = [0, 0.25, 0.5, 0.75, 1];

/** KPI cards are the only place that abbreviates large numbers (format rules). */
export function kpiText(v: number, p: KpiCardProps, dec?: number): string {
  const big = p.compact !== false && Math.abs(p.value) >= 1e4;
  if (p.format === 'money') return format.money(v, { compact: big, currency: p.currency, like: p.value });
  if (p.format === 'percent') return format.number(v, dec || 1);
  return big ? format.compact(v, p.value) : format.number(v, dec);
}

/** Shrinks the KPI number (31 px down to 20 px) when the final value is wider than the card. */
export function useFitText(ref: React.RefObject<HTMLElement | null>, deps: React.DependencyList): void {
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '';
      const base = parseFloat(getComputedStyle(el).fontSize) || 31;
      const sizer = el.querySelector<HTMLElement>('.ui-kpi-sizer');
      const unit = el.querySelector<HTMLElement>('.ui-kpi-unit');
      const need = (sizer ? sizer.scrollWidth : 0) + (unit ? unit.offsetWidth + 4 : 0);
      const have = el.clientWidth;
      const next = need > have && have > 0 ? Math.max(20, Math.floor((base * have) / need)) : null;
      el.style.fontSize = next ? next + 'px' : '';
    };
    fit();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    ro?.observe((el.parentNode as Element | null) || el);
    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller lists what changes the text
  }, deps);
}

interface ChartTipRow {
  name: React.ReactNode;
  value: React.ReactNode;
  color?: string;
}

export function ChartTip({ title, rows, style }: { title?: React.ReactNode; rows: ChartTipRow[]; style?: React.CSSProperties }) {
  return (
    <div className="ui-chart-tip" style={style}>
      {title ? <div className="ui-chart-tip-title">{title}</div> : null}
      {rows.map((r, i) => (
        <div key={i} className="ui-chart-tip-row">
          {r.color ? <span className="ui-chart-swatch" style={{ background: r.color }} /> : null}
          <span className="ui-chart-tip-name">{r.name}</span>
          <span className="ui-chart-tip-val">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Rounds an axis maximum up to 2, 4, 5, 8 or 10 times a power of ten. */
export function niceMax(v: number): number {
  const e = 10 ** Math.floor(Math.log10(v || 1));
  const n = Math.ceil(v / e);
  return (n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 8 ? 8 : 10) * e;
}
