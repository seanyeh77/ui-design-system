import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Alert } from './Alert';

test('Alert: danger is announced at once (role alert); info, success and warning are a status', () => {
  const { rerender } = render(<Alert title="已同步" />);
  expect(screen.getByRole('status')).toHaveClass('ui-alert', 'ui-alert-info');
  for (const tone of ['success', 'warning'] as const) {
    rerender(<Alert tone={tone} title="提示" />);
    expect(screen.getByRole('status')).toHaveClass(`ui-alert-${tone}`);
    expect(screen.queryByRole('alert')).toBeNull();
  }
  rerender(<Alert tone="danger" title="無法連線" />);
  expect(screen.getByRole('alert')).toHaveClass('ui-alert-danger');
  expect(screen.queryByRole('status')).toBeNull();
});

test('Alert: title and body inside the region, each only when given', () => {
  const { rerender, container } = render(
    <Alert tone="warning" title="憑證 3 天後到期">
      到期後 api-gateway 會拒絕連線。
    </Alert>,
  );
  const region = screen.getByRole('status');
  expect(region.querySelector('.ui-alert-title')).toHaveTextContent('憑證 3 天後到期');
  expect(region.querySelector('.ui-alert-body')).toHaveTextContent('到期後 api-gateway 會拒絕連線。');
  rerender(<Alert tone="warning">只有內文</Alert>);
  expect(container.querySelector('.ui-alert-title')).toBeNull();
  rerender(<Alert tone="warning" title="只有標題" />);
  expect(container.querySelector('.ui-alert-body')).toBeNull();
});

test('Alert: the action is a button named by its verb that calls onAction', async () => {
  const onAction = vi.fn();
  render(<Alert tone="danger" title="同步失敗" actionLabel="重試" onAction={onAction} />);
  const action = screen.getByRole('button', { name: '重試' });
  expect(action).toHaveClass('ui-btn', 'ui-btn-secondary', 'ui-alert-action');
  await userEvent.click(action);
  expect(onAction).toHaveBeenCalledTimes(1);
});

test('Alert: info and success can be closed with onDismiss; warning and danger cannot', async () => {
  const onDismiss = vi.fn();
  const { rerender } = render(<Alert tone="info" title="新版本" onDismiss={onDismiss} />);
  await userEvent.click(screen.getByRole('button', { name: '關閉提示' }));
  expect(onDismiss).toHaveBeenCalledTimes(1);
  rerender(<Alert tone="success" title="已儲存" onDismiss={onDismiss} />);
  expect(screen.getByRole('button', { name: '關閉提示' })).toBeInTheDocument();
  for (const tone of ['warning', 'danger'] as const) {
    rerender(<Alert tone={tone} title="問題" onDismiss={onDismiss} />);
    expect(screen.queryByRole('button', { name: '關閉提示' })).toBeNull();
  }
  rerender(<Alert tone="info" title="沒有 onDismiss" />);
  expect(screen.queryByRole('button')).toBeNull();
});
