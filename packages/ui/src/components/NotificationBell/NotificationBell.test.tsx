import { expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { NotificationBell } from '../../index';

const items = [
  { id: 'a', title: '部署完成', time: '5 分鐘前' },
  { id: 'b', title: '帳單已寄出', read: true },
];

test('NotificationBell: open, defaultOpen and onOpenChange; onSelect gets the item and closes the panel', async () => {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  const onSelect = vi.fn();
  render(<NotificationBell items={items} onOpenChange={onOpenChange} onSelect={onSelect} />);
  await user.click(screen.getByRole('button', { name: /^通知中心/ }));
  expect(onOpenChange).toHaveBeenLastCalledWith(true, 'trigger');
  await user.click(await screen.findByRole('button', { name: /部署完成/ }));
  expect(onSelect).toHaveBeenCalledWith(items[0]);
  expect(onOpenChange).toHaveBeenLastCalledWith(false, 'select');
  await waitFor(() => expect(screen.queryByRole('button', { name: /部署完成/ })).toBeNull());
});

test('NotificationBell: controlled open; the deprecated onOpen still gets the item and warns', async () => {
  const user = userEvent.setup();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const onOpen = vi.fn();
  render(<NotificationBell items={items} open onOpen={onOpen} />);
  await user.click(await screen.findByRole('button', { name: /帳單已寄出/ }));
  expect(onOpen).toHaveBeenCalledWith(items[1]);
  // Controlled: stays open until the page changes `open`.
  expect(screen.getByRole('button', { name: /部署完成/ })).toBeTruthy();
  expect(warn.mock.calls.some((c) => String(c[0]).includes('`onOpen` is deprecated'))).toBe(true);
  warn.mockRestore();
});
