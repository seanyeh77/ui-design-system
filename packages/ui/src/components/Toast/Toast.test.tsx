import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SettingsLayout, Toast } from '../../index';

test('Toast: a polite status message; the caller times it, so it stays until removed', async () => {
  vi.useFakeTimers();
  try {
    render(<Toast>已刪除 3 筆</Toast>);
    const st = screen.getByRole('status');
    expect(st.textContent).toBe('已刪除 3 筆');
    // No timer of its own: still there long after 3 s.
    vi.advanceTimersByTime(10_000);
    expect(screen.getByRole('status')).toBe(st);
  } finally {
    vi.useRealTimers();
  }
  // Without actionLabel there is nothing to press.
  expect(screen.queryByRole('button')).toBeNull();
});

test('Toast: 復原 is a button inside the status and runs onAction once per press', async () => {
  const onAction = vi.fn();
  render(
    <Toast actionLabel="復原" onAction={onAction}>
      已刪除 3 筆
    </Toast>,
  );
  const undo = screen.getByRole('button', { name: '復原' });
  expect(screen.getByRole('status').contains(undo)).toBe(true);
  expect(undo.getAttribute('type')).toBe('button');
  const user = userEvent.setup();
  await user.click(undo);
  expect(onAction).toHaveBeenCalledTimes(1);
  // From the keyboard too.
  undo.focus();
  await user.keyboard('{Enter}');
  expect(onAction).toHaveBeenCalledTimes(2);
});

test('SettingsLayout: 「已儲存」 shows as a Toast only while toast is set', () => {
  const cats = [{ id: 'a', label: '一般', content: <p>內容</p> }];
  const { rerender } = render(<SettingsLayout categories={cats} toast="已儲存" />);
  expect(screen.getByRole('status').textContent).toBe('已儲存');
  rerender(<SettingsLayout categories={cats} toast="" />);
  expect(screen.queryByRole('status')).toBeNull();
});
