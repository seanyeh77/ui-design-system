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
  expect(line().textContent).toBe('預測準確，目標 ≤ 0.5 °C');
  expect(line().classList.contains('ui-kpi-verdict')).toBe(false);
  rerender(
    <KpiCard size="compact" label="預測誤差" value={0.9} decimals={1} unit="°C" verdict={{ tone: 'warning', text: '偏差變大' }} target="目標 ≤ 0.5 °C" />,
  );
  expect(line().textContent).toBe('偏差變大（目標 ≤ 0.5 °C）');
  expect(line().classList.contains('is-warning')).toBe(true);
});
