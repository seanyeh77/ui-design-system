import { afterEach, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IconButton, Tour, useTour } from '../../index';

afterEach(() => localStorage.clear());

const steps = [{ title: '流程樹', text: '名稱旁的標籤是關係的來源。' }];

function Page({ withHint, k }: { withHint: boolean; k: string }) {
  const tour = useTour(k);
  return (
    <div>
      <IconButton label="導覽" icon="question" onClick={tour.start} hint={withHint ? tour.hint('導覽：一個步驟介紹這頁。') : undefined} />
      <Tour open={tour.open} onClose={tour.close} steps={steps} />
    </div>
  );
}

test('a page without a hint opens the tour by itself, once', async () => {
  const { unmount } = render(<Page withHint={false} k="t-auto" />);
  await screen.findByText('流程樹');
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByText('流程樹')).toBeNull());
  unmount();
  render(<Page withHint={false} k="t-auto" />);
  await new Promise((r) => setTimeout(r, 100));
  expect(screen.queryByText('流程樹')).toBeNull();
});

test('with a hint: dot and bubble instead of the tour; 開始 starts it and finishing hides the hint for good', async () => {
  const { unmount } = render(<Page withHint k="t-hint" />);
  const btn = screen.getByRole('button', { name: '導覽' });
  const bubble = screen.getByRole('status');
  expect(bubble.textContent).toContain('導覽：一個步驟介紹這頁。');
  expect(btn.getAttribute('aria-describedby')).toBe(bubble.id);
  expect(btn.querySelector('.ui-iconbtn-dot')).not.toBeNull();
  await new Promise((r) => setTimeout(r, 100));
  expect(screen.queryByText('流程樹')).toBeNull();
  // The bubble sits below the button, its right edge on the button's.
  const b = btn.getBoundingClientRect();
  const r = bubble.getBoundingClientRect();
  expect(r.top).toBeGreaterThan(b.bottom);
  expect(Math.abs(r.right - b.right)).toBeLessThan(1);
  await userEvent.click(screen.getByRole('button', { name: '開始' }));
  await screen.findByText('流程樹');
  expect(screen.queryByRole('status')).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: '完成' }));
  await waitFor(() => expect(screen.queryByText('流程樹')).toBeNull());
  expect(document.querySelector('.ui-hint')).toBeNull();
  unmount();
  render(<Page withHint k="t-hint" />);
  expect(document.querySelector('.ui-hint, .ui-iconbtn-dot')).toBeNull();
});

test('× hides the hint for good without opening the tour', async () => {
  const { unmount } = render(<Page withHint k="t-x" />);
  await userEvent.click(screen.getByRole('button', { name: '關閉提示' }));
  expect(document.querySelector('.ui-hint, .ui-iconbtn-dot')).toBeNull();
  expect(screen.queryByText('流程樹')).toBeNull();
  unmount();
  render(<Page withHint k="t-x" />);
  expect(document.querySelector('.ui-hint')).toBeNull();
});
