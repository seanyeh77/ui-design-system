import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { KpiCard } from '../../index';

test('compact: 22 px, no sparkline; the verdict replaces the target line only when it is not success', () => {
  const { container, rerender } = render(
    <KpiCard
      size="compact"
      label="預測誤差"
      value={0.4}
      decimals={1}
      unit="°C"
      verdict={{ tone: 'success', text: '預測準確' }}
      target="目標 ≤ 0.5 °C"
      spark={[1, 2, 3]}
    />,
  );
  expect(getComputedStyle(container.querySelector('.ui-kpi-value') as HTMLElement).fontSize).toBe('22px');
  expect(container.querySelector('.ui-kpi-spark')).toBeNull();
  const line = () => container.querySelector('.ui-kpi-target') as HTMLElement;
  expect(line().textContent).toBe('預測準確，目標 ≤ 0.5\u00a0°C');
  expect(line().classList.contains('ui-kpi-verdict')).toBe(false);
  rerender(
    <KpiCard size="compact" label="預測誤差" value={0.9} decimals={1} unit="°C" verdict={{ tone: 'warning', text: '偏差變大' }} target="目標 ≤ 0.5 °C" />,
  );
  expect(line().textContent).toBe('偏差變大（目標 ≤ 0.5\u00a0°C）');
  expect(line().classList.contains('is-warning')).toBe(true);
});

test('萬 and 億 in an abbreviated figure are in the text font, the digits in Geist Mono', () => {
  const { container } = render(<KpiCard label="營收" value={12840000} format="money" />);
  const cjk = container.querySelector('.ui-kpi-sizer .ui-kpi-cjk') as HTMLElement;
  expect(cjk.textContent).toBe('萬');
  expect(getComputedStyle(cjk).fontFamily).not.toMatch(/Geist Mono/);
});

test('screen readers get the final figure as text and whether the change is good; 萬 is drawn like a unit; delta follows decimals', () => {
  const { container, rerender } = render(<KpiCard label="營收" value={12840000} unit="元" delta={8.2} />);
  const value = container.querySelector('.ui-kpi-value') as HTMLElement;
  expect(value.getAttribute('aria-label')).toBeNull();
  expect((value.querySelector('.ui-visually-hidden') as HTMLElement).textContent).toBe('1,284\u00a0萬 元');
  expect(value.querySelector('.ui-kpi-num')?.getAttribute('aria-hidden')).toBe('true');
  expect(container.querySelector('.ui-kpi-change')?.textContent).toBe('▲ 8.2%');
  expect(container.querySelector('.ui-kpi-note')?.textContent).toBe('較上週（改善）');
  const cjk = container.querySelector('.ui-kpi-sizer .ui-kpi-cjk') as HTMLElement;
  const unit = container.querySelector('.ui-kpi-unit') as HTMLElement;
  expect(getComputedStyle(cjk).fontSize).toBe(getComputedStyle(unit).fontSize);
  rerender(<KpiCard label="錯誤率" value={0.42} unit="%" decimals={1} delta={0.4} deltaUnit="pt" direction="down" />);
  expect(container.querySelector('.ui-kpi-change')?.textContent).toBe('▲ 0.4 個百分點');
  expect(container.querySelector('.ui-kpi-note')?.textContent).toBe('較上週（變差）');
});

test('direction: down makes a drop good and a rise bad; good overrides it; no change is neither', () => {
  const { container, rerender } = render(<KpiCard label="回應時間" value={184} unit="ms" delta={-12.5} direction="down" compareLabel="較昨天" />);
  const change = () => container.querySelector('.ui-kpi-change') as HTMLElement;
  const note = () => (container.querySelector('.ui-kpi-note') as HTMLElement).textContent;
  expect(change().textContent).toBe('▼ 12.5%');
  expect(change().classList.contains('is-good')).toBe(true);
  expect(note()).toBe('較昨天（改善）');
  rerender(<KpiCard label="回應時間" value={184} unit="ms" delta={6} direction="down" />);
  expect(change().classList.contains('is-bad')).toBe(true);
  expect(note()).toBe('較上週（變差）');
  rerender(<KpiCard label="營收" value={100} delta={-3} />);
  expect(note()).toBe('較上週（變差）');
  rerender(<KpiCard label="營收" value={100} delta={-3} good />);
  expect(note()).toBe('較上週（改善）');
  rerender(<KpiCard label="營收" value={100} delta={0} />);
  expect(change().textContent).toBe('0.0%');
  expect(change().classList.contains('is-flat')).toBe(true);
  expect(note()).toBe('較上週');
});
