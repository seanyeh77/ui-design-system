import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBand } from '../../index';

const CLASSES = [
  { value: 'ai', label: 'AI 最佳化' },
  { value: 'pid', label: 'PID' },
];

test('segments sit on the time axis, the legend has words, screen readers hear each stretch', () => {
  const times = ['13:00', '13:10', '13:20', '13:30'];
  const { container } = render(
    <div style={{ width: 400 }}>
      <StatusBand
        label="採用的策略"
        count={4}
        times={times}
        classes={CLASSES}
        segments={[
          { from: 0, to: 1, value: 'ai' },
          { from: 1, to: 4, value: 'pid' },
        ]}
      />
    </div>,
  );
  expect(screen.getByRole('img').getAttribute('aria-label')).toBe('採用的策略：13:00 到 13:10 AI 最佳化，13:10 到 13:30 PID');
  const parts = [...container.querySelectorAll<HTMLElement>('.ui-statusband-bar > span')];
  expect(parts.map((p) => p.style.width)).toEqual(['25%', '75%']);
  expect(container.querySelector('.ui-statusband-legend')?.textContent).toContain('AI 最佳化');
});

test('no segments: a gray band that says there is no data', () => {
  render(<StatusBand label="採用的策略" count={4} classes={CLASSES} segments={[]} />);
  expect(screen.getByRole('img').getAttribute('aria-label')).toBe('採用的策略：沒有資料');
});
