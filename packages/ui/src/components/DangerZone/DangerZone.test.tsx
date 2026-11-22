import { expect, test, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DangerZone } from '../../index';

const user = userEvent.setup();

test('DangerZone: a heading, the consequence, and a button that only asks at first', async () => {
  const onAction = vi.fn();
  render(
    <DangerZone
      description="刪除後，所有專案和資料都無法復原。"
      actionLabel="刪除帳號"
      confirm={{ title: '刪除帳號？', body: '無法復原。' }}
      onAction={onAction}
    />,
  );
  expect(screen.getByRole('heading', { level: 2, name: '危險操作' })).toBeTruthy();
  expect(screen.getByText('刪除後，所有專案和資料都無法復原。')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: '刪除帳號' }));
  expect(onAction).not.toHaveBeenCalled();
  const dialog = await screen.findByRole('dialog', { name: '刪除帳號？' });
  expect(within(dialog).getByText('無法復原。')).toBeTruthy();
  // The dialog's danger button carries the same verb.
  await user.click(within(dialog).getByRole('button', { name: '刪除帳號' }));
  expect(onAction).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

test('DangerZone: 取消 and Escape close the dialog and do nothing', async () => {
  const onAction = vi.fn();
  render(<DangerZone description="刪除這個專案。" confirm={{ title: '刪除 api-gateway？' }} onAction={onAction} />);
  // Default label 「刪除」.
  const btn = screen.getByRole('button', { name: '刪除' });
  await user.click(btn);
  const dialog = await screen.findByRole('dialog', { name: '刪除 api-gateway？' });
  await user.click(within(dialog).getByRole('button', { name: '取消' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await user.click(btn);
  await screen.findByRole('dialog', { name: '刪除 api-gateway？' });
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(onAction).not.toHaveBeenCalled();
});

test('DangerZone: title replaces 危險操作', () => {
  render(<DangerZone title="刪除專案" description="無法復原。" confirm={{ title: '刪除？' }} onAction={() => {}} />);
  expect(screen.getByRole('heading', { name: '刪除專案' })).toBeTruthy();
});
