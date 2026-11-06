import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AppShell } from '../../index';

const user = userEvent.setup();
const nav = [
  {
    items: [
      { id: 'home', label: '總覽', icon: 'house' as const },
      {
        id: 'proj',
        label: '專案',
        icon: 'folder' as const,
        children: [
          { id: 'p1', label: '進行中' },
          { id: 'p2', label: '封存' },
        ],
      },
      { id: 'billing', label: '帳務' },
    ],
  },
];

afterEach(() => page.viewport(1280, 900));

test('phones: 「更多」 opens the full nav, also when the current page sits behind it', async () => {
  await page.viewport(390, 844);
  const onNavigate = vi.fn();
  render(
    <AppShell nav={nav} value="billing" onNavigate={onNavigate}>
      內容
    </AppShell>,
  );
  const more = await screen.findByRole('button', { name: '更多' });
  expect(more.getAttribute('aria-current')).toBe('page');
  await user.click(more);
  const drawer = await screen.findByRole('dialog', { name: '全部頁面' });
  await user.click(within(drawer).getByRole('button', { name: '封存' }));
  expect(onNavigate).toHaveBeenCalledWith('p2');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

test('phones: a tab for a group opens its first page', async () => {
  await page.viewport(390, 844);
  const onNavigate = vi.fn();
  render(
    <AppShell nav={nav} value="home" onNavigate={onNavigate}>
      內容
    </AppShell>,
  );
  await user.click(await screen.findByRole('button', { name: '專案' }));
  expect(onNavigate).toHaveBeenCalledWith('p1');
});
