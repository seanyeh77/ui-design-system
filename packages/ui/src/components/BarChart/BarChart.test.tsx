import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import { BarChart } from '../../index';
import { axisTicks } from '../../internal/chart';

test('axis ticks: steps of 1, 2 or 5 times a power of ten, the top close to the largest value', () => {
  expect(axisTicks(0, 1_280_000)).toEqual([0, 500_000, 1_000_000, 1_500_000]);
  expect(axisTicks(0, 42)).toEqual([0, 10, 20, 30, 40, 50]);
  expect(axisTicks(0, 3)).toEqual([0, 1, 2, 3]);
  // never 12.5 or 37.5
  for (const max of [7, 37, 150, 333, 9_999]) expect(axisTicks(0, max).every((t) => Number.isInteger(t))).toBe(true);
  // a given top the steps do not divide: 4 equal steps
  expect(axisTicks(22, 26.4, { top: 30, dec: 1 })).toEqual([22, 24, 26, 28, 30]);
});

test('large values: the y labels fit inside the chart; compact writes 萬; the unit is above the axis', async () => {
  await page.viewport(390, 800);
  const data = [
    { label: '北區', value: 1_280_000 },
    { label: '南區', value: 640_000 },
  ];
  const a = render(
    <div style={{ width: 300, padding: 0 }}>
      <BarChart label="請求數" unit="次" data={data} />
    </div>,
  );
  const box = (a.container.firstElementChild as HTMLElement).getBoundingClientRect();
  const ticks = [...a.container.querySelectorAll('.ui-chart-tick')];
  expect(ticks.map((t) => t.textContent)).toEqual(['0', '500,000', '1,000,000', '1,500,000']);
  for (const t of ticks) expect(t.getBoundingClientRect().left).toBeGreaterThanOrEqual(box.left);
  expect(a.container.querySelector('.ui-chart-axisunit')?.textContent).toBe('次');
  // the values are in a table for screen readers
  expect(screen.getByRole('table', { name: '請求數' })).toBeTruthy();
  expect(screen.getByRole('application', { name: '請求數' })).toBeTruthy();
  a.unmount();
  const b = render(<BarChart label="請求數" unit="次" format="compact" data={data} />);
  expect([...b.container.querySelectorAll('.ui-chart-tick')].map((t) => t.textContent)).toEqual(['0', '50 萬', '100 萬', '150 萬']);
  await page.viewport(1280, 900);
});
