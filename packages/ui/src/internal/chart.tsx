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

const CHART = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];
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

/** The y axis: tick values from lo to top, a step of 1, 2 or 5 times a power of ten (never 2.5: no 12.5 or 37.5),
 *  3 to 5 steps, the top the first tick at or above the largest value (128 萬 gets a 150 萬 axis, not 200 萬). Whole
 *  steps unless the values need decimals (dec > 0) or the range is under 3. A given top that the steps do not divide
 *  gets 4 equal steps. */
export function axisTicks(lo: number, hi: number, o: { top?: number; dec?: number } = {}): number[] {
  const range = (o.top ?? hi) - lo;
  if (!(range > 0)) return [lo, lo + 1];
  const whole = !o.dec && range >= 3;
  const raw = range / 5;
  let step = 0;
  for (let e = 10 ** Math.floor(Math.log10(raw)); !step; e *= 10)
    for (const m of [1, 2, 5]) {
      const s = m * e;
      if (s >= raw && (!whole || Number.isInteger(s)) && Math.ceil(range / s - 1e-9) <= 5) {
        step = s;
        break;
      }
    }
  let n = Math.max(1, Math.ceil(range / step - 1e-9));
  if (o.top != null && Math.abs(n * step - range) > step * 1e-6) {
    n = 4;
    step = range / 4;
  }
  // Rounded so 0.1 + 0.2 does not show as 0.30000000000000004.
  return Array.from({ length: n + 1 }, (_, i) => +(lo + i * step).toPrecision(12));
}

/** How a chart writes a value: 'number' (1,280,000) or 'compact' (128 萬, 1.5 億; 1.3M in English). */
export type ChartFormat = 'number' | 'compact';
/** A tick or tooltip value as text, in the chart's format. */
export function chartNumber(v: number, fmt: ChartFormat | undefined, dec?: number): string {
  return fmt === 'compact' && Math.abs(v) >= 1e4 ? format.compact(v) : format.number(v, dec);
}
/** Decimals the ticks need so that neighbours read differently (0.5, 1, 1.5). */
export const ticksDecimals = (ticks: number[]): number => Math.min(3, Math.max(0, ...ticks.map((t) => (String(+t.toPrecision(6)).split('.')[1] ?? '').length)));

/** The width (px) the y axis labels need: measured from the drawn labels (a font that loads late, text spacing a reader
 *  adds), else estimated from their length where nothing is measured (jsdom). Measured again when the labels change
 *  or the text's size does. */
export function useAxisWidth(ref: React.RefObject<HTMLElement | null>, labels: string[], scaleKey: number | string = ''): number {
  // Geist Mono 12 px: about 7.5 px a character; CJK (萬、億) about 12 px.
  const guess = Math.ceil(Math.max(0, ...labels.map((t) => [...t].reduce((w, c) => w + (c.charCodeAt(0) > 0x2e80 ? 12 : 7.5), 0))));
  const [w, setW] = React.useState(guess);
  // scaleKey: an SVG drawn at another width than its box is scaled, and so are its labels: measured again once it
  // has its real width.
  const key = labels.join('|') + '|' + scaleKey;
  React.useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const read = () => {
      let m = 0;
      for (const el of root.querySelectorAll<Element>('.ui-chart-tick')) m = Math.max(m, el.getBoundingClientRect().width);
      const next = m > 0 ? Math.ceil(m) : guess;
      setW((v) => (Math.abs(v - next) > 1 ? next : v));
    };
    read();
    const probe = root.querySelector('.ui-chart-tick');
    if (!probe || typeof ResizeObserver !== 'function') return;
    // SVG text has no box to observe: the root's size stands in (text spacing and zoom change it too), and fonts.
    const ro = new ResizeObserver(read);
    ro.observe(root);
    document.fonts?.ready.then(read).catch(() => {});
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- measured again when the labels change
  }, [key]);
  return w;
}

/** Rounds an axis maximum up to 2, 4, 5, 8 or 10 times a power of ten. */
export function niceMax(v: number): number {
  const e = 10 ** Math.floor(Math.log10(v || 1));
  const n = Math.ceil(v / e);
  return (n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 8 ? 8 : 10) * e;
}

/** ← → (and Home, End) on a chart: the item to show next, or null for any other key. */
export function chartKey(e: React.KeyboardEvent, at: number, n: number): number | null {
  if (e.altKey || e.metaKey || e.ctrlKey || !n) return null;
  const i = Math.max(0, at);
  const to =
    e.key === 'ArrowRight' ? Math.min(n - 1, i + 1) : e.key === 'ArrowLeft' ? Math.max(0, i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
  if (to != null) e.preventDefault();
  return to;
}

/** The chart's values as a table for screen readers (visually hidden): one row per item or point, the first cell its
 *  name. Charts with arrow keys are role="application", which some screen readers read only key by key; this table
 *  reads like any other. */
export function ChartTable({ caption, head, rows }: { caption: string; head: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return null;
  // ARIA table roles on divs: no native <table> (the system replaces it), and the hiding box keeps its 1 px width.
  return (
    <div className="ui-visually-hidden" role="table" aria-label={caption}>
      <div role="row">
        {head.map((h, i) => (
          <span key={i} role="columnheader">
            {h}
          </span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={i} role="row">
          <span role="rowheader">{r[0]}</span>
          {r.slice(1).map((c, j) => (
            <span key={j} role="cell">
              {c}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
