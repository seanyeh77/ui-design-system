import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Meter } from '../../index';

test('state in words, a meter role, and stacked meters line up on the right', () => {
  render(
    <div style={{ width: 420 }}>
      <Meter label="A 區進氣溫度" value={24.6} min={20} max={32} warn={27} limit={29} unit="°C" decimals={1} />
      <Meter label="B 區進氣溫度" value={28.1} min={20} max={32} warn={27} limit={29} unit="°C" decimals={1} />
      <Meter label="UPS 負載" value={92} min={0} max={100} warn={80} limit={90} unit="%" />
    </div>,
  );
  const meters = screen.getAllByRole('meter');
  expect(meters.map((m) => m.querySelector('.ui-meter-state')?.textContent)).toEqual(['正常', '⚠ 注意', '⚠ 超過上限']);
  expect(screen.getByRole('meter', { name: 'B 區進氣溫度' }).getAttribute('aria-valuetext')).toBe('28.1 °C，注意，注意 27，上限 29');
  const right = (sel: string) => meters.map((m) => Math.round((m.querySelector(sel) as HTMLElement).getBoundingClientRect().right));
  expect(new Set(right('.ui-meter-value')).size).toBe(1);
  expect(new Set(right('.ui-meter-state')).size).toBe(1);
});
