import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as React from 'react';
import { LineChart } from '../../index';

const T = ['13:00', '13:10', '13:20', '13:30', '13:40', '13:50'];
const ACT = [24, 25, 26, 25.5, null, null];
const FC = [24.5, 24.6, 25.4, 26, 26.4, 26.1];

function Replay() {
  const [at, setAt] = React.useState(3);
  return (
    <div style={{ width: 640 }}>
      <LineChart
        label="進氣溫度"
        unit="°C"
        decimals={1}
        min={22}
        max={30}
        labels={T}
        series={[
          { name: '實際', values: ACT },
          { name: '預測', values: FC, dashed: true, color: 3 },
        ]}
        band={{ between: [0, 1], tone: 'diverge', label: '實際偏高／偏低' }}
        now={3}
        thresholds={[{ value: 27, label: '注意 27 °C', tone: 'warning' }]}
        marker={{ at: 4, value: 26.4, label: '下一回合 26.4 °C' }}
        playhead={at}
        onPlayheadChange={setAt}
        status={{ label: '採用的策略', classes: [{ value: 'ai', label: 'AI 最佳化' }], segments: [{ from: 0, to: 6, value: 'ai' }] }}
      />
      <output>{at}</output>
    </div>
  );
}

test('forecast parts: band only where both have values, colored by sign; now, threshold, marker, status band', () => {
  const { container } = render(<Replay />);
  const bands = [...container.querySelectorAll('.ui-chart-band')];
  // Steps 0-1, 1-2, 2-3 have both series; actual is below the forecast first, then above.
  expect(bands.map((b) => b.getAttribute('class')?.split(' ').pop())).toEqual(['is-neg', 'is-pos', 'is-pos']);
  expect(container.querySelector('.ui-chart-now text')?.textContent).toBe('現在');
  expect(container.querySelector('.ui-chart-threshold.is-warning text')?.textContent).toBe('注意 27 °C');
  expect(container.querySelector('.ui-chart-marker text')?.textContent).toBe('下一回合 26.4 °C');
  expect(container.querySelector('.ui-chart-line.is-dashed')).not.toBeNull();
  // The actual line stops where its values stop: one run of 4 points.
  expect(container.querySelectorAll('.ui-chart-line').length).toBe(2);
  expect(screen.getByRole('img', { name: /採用的策略/ })).not.toBeNull();
  expect(container.textContent).toContain('實際偏高／偏低');
});

test('playhead: ← → Home End on the chart move it; the values read aloud are those of that point', async () => {
  render(<Replay />);
  const user = userEvent.setup();
  await user.tab();
  expect(document.activeElement?.getAttribute('aria-label')).toBe('進氣溫度');
  await user.keyboard('{ArrowRight}');
  expect(document.querySelector('output')?.textContent).toBe('4');
  await user.keyboard('{Home}');
  expect(document.querySelector('output')?.textContent).toBe('0');
  await user.keyboard('{End}');
  expect(document.querySelector('output')?.textContent).toBe('5');
  // The tooltip at the playhead lists only series with a value there.
  expect(document.querySelector('.ui-chart-tip')?.textContent).not.toContain('實際');
});

test('playhead: pressing and dragging on the chart moves it', async () => {
  await page.viewport(1280, 800);
  const { container } = render(<Replay />);
  const plot = container.querySelector('.ui-chart-plot') as HTMLElement;
  const r = plot.getBoundingClientRect();
  const x = (i: number) => r.left + ((40 + (i * 590) / 5) / 640) * r.width;
  const user = userEvent.setup();
  const y = r.top + 50;
  await user.pointer({ keys: '[MouseLeft>]', target: plot, coords: { clientX: x(1), clientY: y } });
  expect(document.querySelector('output')?.textContent).toBe('1');
  await user.pointer({ target: plot, coords: { clientX: x(4), clientY: y } });
  expect(document.querySelector('output')?.textContent).toBe('4');
  await user.pointer({ keys: '[/MouseLeft]', target: plot, coords: { clientX: x(4), clientY: y } });
  await user.pointer({ target: plot, coords: { clientX: x(2), clientY: y } });
  expect(document.querySelector('output')?.textContent).toBe('4');
});

test('no values: the chart says so', () => {
  render(<LineChart label="昨天" labels={T} series={[{ name: '實際', values: T.map(() => null) }]} />);
  expect(screen.getByText('這段時間沒有資料')).not.toBeNull();
});

test('the plot is drawn at its real width, so text keeps its size; height sets the plot height', async () => {
  const { container } = render(
    <div style={{ width: 1000 }}>
      <LineChart label="溫度" labels={['13:00', '13:10', '13:20']} series={[{ name: '實際', values: [24, 25, 26] }]} height={300} />
    </div>,
  );
  const svg = container.querySelector('svg') as SVGSVGElement;
  await expect.poll(() => svg.getAttribute('viewBox')).toBe(`0 0 ${svg.clientWidth} 300`);
  expect(svg.clientHeight).toBe(300);
});

test('replay is a slider: its value is the point index, its text the time and the values', () => {
  render(<Replay />);
  const s = screen.getByRole('slider', { name: '進氣溫度' });
  expect(s.getAttribute('aria-valuemin')).toBe('0');
  expect(s.getAttribute('aria-valuemax')).toBe('5');
  expect(s.getAttribute('aria-valuenow')).toBe('3');
  expect(s.getAttribute('aria-valuetext')).toBe('13:30：實際 25.5 °C，預測 26.0 °C');
});

test('reading points: role application and a data table; the last x label stays inside; large values fit', async () => {
  await page.viewport(1280, 800);
  const labels = ['11/01', '11/02', '11/03', '11/04', '11/05'];
  const { container } = render(
    <div style={{ width: 600 }}>
      <LineChart label="每日請求" unit="次" labels={labels} series={[{ name: '請求', values: [120_000, 240_000, 410_000, 300_000, 380_000] }]} />
    </div>,
  );
  expect(screen.getByRole('application', { name: '每日請求' })).toBeTruthy();
  const table = screen.getByRole('table', { name: '每日請求' });
  expect(table.querySelectorAll('[role="row"]').length).toBe(6);
  const box = (container.firstElementChild as HTMLElement).getBoundingClientRect();
  const spans = [...container.querySelectorAll('.ui-chart-xlabels > span')];
  await expect.poll(() => Math.round(spans[spans.length - 1].getBoundingClientRect().right)).toBeLessThanOrEqual(Math.round(box.right));
  expect(spans[0].getBoundingClientRect().left).toBeGreaterThanOrEqual(box.left);
  for (const t of container.querySelectorAll('.ui-chart-tick')) expect(t.getBoundingClientRect().left).toBeGreaterThanOrEqual(box.left);
  // ticks: whole steps, the top near the largest value (500,000 for 410,000)
  expect([...container.querySelectorAll('.ui-chart-tick')].map((t) => t.textContent)).toEqual(['0', '100,000', '200,000', '300,000', '400,000', '500,000']);
});
