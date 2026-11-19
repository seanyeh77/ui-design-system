import { afterEach, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IconButton, Tour, useTour } from '../../index';

afterEach(() => localStorage.clear());

const steps = [{ title: '流程樹', text: '名稱旁的標籤是關係的來源。' }];

function Page({ withHint, k }: { withHint: boolean; k: string }) {
  const tour = useTour(k);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 16 }}>
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
  // The bubble sits left of the button, in its row, so it never covers what is under the bar.
  const b = btn.getBoundingClientRect();
  const r = bubble.getBoundingClientRect();
  expect(r.right).toBeLessThan(b.left);
  expect(Math.abs((r.top + r.bottom) / 2 - (b.top + b.bottom) / 2)).toBeLessThan(1);
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

test('a hint on a button with no room on its left goes below it', () => {
  render(<IconButton label="導覽" icon="question" hint={{ text: '導覽：一個步驟介紹這頁。', onAction: () => {}, onDismiss: () => {} }} />);
  const b = screen.getByRole('button', { name: '導覽' }).getBoundingClientRect();
  const r = screen.getByRole('status').getBoundingClientRect();
  expect(r.top).toBeGreaterThan(b.bottom);
  expect(r.left).toBeGreaterThanOrEqual(0);
  expect(r.left).toBeLessThan(b.right);
});
