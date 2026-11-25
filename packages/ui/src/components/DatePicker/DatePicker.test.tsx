import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DatePicker, DateRangePicker } from '../../index';

// Opening the calendar puts focus on a day (the APG date picker dialog), not on 「上個月」.
test('DatePicker: opening focuses the selected day, else today', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<DatePicker label="日期" value={new Date(2026, 10, 14)} onChange={() => {}} />);
  await user.click(screen.getByRole('button', { name: '開啟日曆' }));
  await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^2026年11月14日/));
  await user.keyboard('{Escape}');
  rerender(<DatePicker label="日期" value={null} onChange={() => {}} />);
  await user.click(screen.getByRole('button', { name: '開啟日曆' }));
  await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toMatch(/（今天）$/));
});

test('DateRangePicker: opening focuses a selected day', async () => {
  const user = userEvent.setup();
  render(<DateRangePicker label="期間" value={[new Date(2026, 10, 2), new Date(2026, 10, 9)]} onChange={() => {}} />);
  await user.click(screen.getByRole('button', { name: /期間/ }));
  await vi.waitFor(() => expect(document.activeElement?.classList.contains('ui-cal-day')).toBe(true));
  expect(document.activeElement?.getAttribute('aria-pressed')).toBe('true');
});
