import * as React from 'react';
import { cx } from '../../internal/util';
import { format } from '../../format';
import { tr } from '../../i18n';

export interface MeterProps {
  /** What is measured, e.g. 「A 區進氣溫度」; also the name screen readers hear. */
  label: string;
  /** The current value. */
  value: number;
  /** The low end of the scale. */
  min: number;
  /** The high end of the scale. */
  max: number;
  /** From this value on the state is 「⚠ 注意」 (warning). Higher values are worse. */
  warn?: number;
  /** From this value on the state is 「⚠ 超過上限」 (danger). */
  limit?: number;
  /** After the value, e.g. '°C' or '%'. */
  unit?: string;
  /** Decimals of the value and marks. Default 0. */
  decimals?: number;
  /** Extra class on the root element. */
  className?: string;
}

/** A value against its levels: an 8 px bar shaded normal, watch and over the limit, a dot at the value, and the value
 *  with its state in words above. Meters stacked in a card line up: the state and the value end at the same places. */
export function Meter({ label, value, min, max, warn, limit, unit, decimals = 0, className }: MeterProps) {
  const span = max - min || 1;
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / span) * 100));
  const tone = limit != null && value >= limit ? 'danger' : warn != null && value >= warn ? 'warning' : 'success';
  const state = tone === 'danger' ? tr('⚠ 超過上限') : tone === 'warning' ? tr('⚠ 注意') : tr('正常');
  const num = (v: number) => format.number(v, decimals) + (unit ? ' ' + unit : '');
  // Marks keep the decimals they were given (27, 27.5), not the value's.
  const markNum = (v: number) => format.number(v, (String(v).split('.')[1] ?? '').length);
  const marksRef = React.useRef<HTMLDivElement>(null);
  const [stack, setStack] = React.useState(false);
  const w = warn != null ? pct(warn) : null;
  const l = limit != null ? pct(limit) : null;
  // Shaded stretches: normal up to warn, watch up to limit, over the limit after.
  const stops = [
    ['var(--meter-ok)', 0, w ?? l ?? 100],
    ...(w != null ? [['var(--meter-warn)', w, l ?? 100]] : []),
    ...(l != null ? [['var(--meter-over)', l, 100]] : []),
  ] as [string, number, number][];
  const marks = [
    ...(warn != null ? [{ v: warn, at: w as number, tone: 'warning', text: tr('注意 {v}', { v: markNum(warn) }) }] : []),
    ...(limit != null ? [{ v: limit, at: l as number, tone: 'danger', text: tr('上限 {v}', { v: markNum(limit) }) }] : []),
  ];
  // The watch label ends at its mark and the limit label starts at its own; when they still meet (marks close
  // together, or the limit near the end), the limit label moves to a second line.
  React.useLayoutEffect(() => {
    const box = marksRef.current;
    if (!box) return;
    const check = () => {
      const [a, b] = [...box.children].map((c) => c.getBoundingClientRect());
      setStack(!!a && !!b && a.right + 8 > b.left && a.left < b.right + 8);
    };
    check();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(check) : null;
    ro?.observe(box);
    return () => ro?.disconnect();
  }, [warn, limit, min, max]);
  return (
    <div
      className={cx('ui-meter', className)}
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={num(value) + tr('，') + state.replace('⚠ ', '') + marks.map((m) => tr('，') + m.text).join('')}
    >
      <div className="ui-meter-head" aria-hidden="true">
        <span className="ui-meter-label">{label}</span>
        <span className={'ui-meter-state is-' + tone}>{state}</span>
        <span className="ui-meter-value">{num(value)}</span>
      </div>
      <div
        className="ui-meter-track"
        aria-hidden="true"
        style={{ background: `linear-gradient(90deg, ${stops.map(([c, a, b]) => `${c} ${a}% ${b}%`).join(', ')})` } as React.CSSProperties}
      >
        {marks.map((m) => (
          <span key={m.tone} className={'ui-meter-mark is-' + m.tone} style={{ left: m.at + '%' }} />
        ))}
        <span className={'ui-meter-dot is-' + tone} style={{ left: pct(value) + '%' }} />
      </div>
      {marks.length ? (
        <div ref={marksRef} className={cx('ui-meter-marks', stack && 'is-stacked')} aria-hidden="true">
          {marks.map((m) => (
            <span
              key={m.tone}
              className={'is-' + m.tone}
              style={m.tone === 'warning' && marks.length > 1 ? { right: 100 - m.at + '%' } : m.at > 80 ? { right: 0 } : { left: m.at + '%' }}
            >
              {m.text}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
