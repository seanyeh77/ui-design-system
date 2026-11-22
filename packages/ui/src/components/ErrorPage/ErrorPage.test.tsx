import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ErrorPage } from '../../index';

test('ErrorPage: 404 has its own heading in a main landmark; the big code is not read', () => {
  const { container } = render(<ErrorPage code={404} onBack={() => {}} onHome={() => {}} />);
  expect(screen.getByRole('main')).toBeTruthy();
  expect(screen.getByRole('heading', { level: 1, name: '找不到這個頁面' })).toBeTruthy();
  expect(container.querySelector('.ui-errorpage-code')?.getAttribute('aria-hidden')).toBe('true');
});

test('ErrorPage: 403 and 500 have their own words; another code falls back to 發生錯誤; title overrides', () => {
  const { rerender } = render(<ErrorPage code={403} />);
  expect(screen.getByRole('heading', { name: '沒有權限查看這個頁面' })).toBeTruthy();
  rerender(<ErrorPage code={500} />);
  expect(screen.getByRole('heading', { name: '伺服器暫時無法回應' })).toBeTruthy();
  rerender(<ErrorPage code={418} />);
  expect(screen.getByRole('heading', { name: '發生錯誤' })).toBeTruthy();
  rerender(<ErrorPage code={404} title="找不到這個專案" description="專案可能已經刪除。" />);
  expect(screen.getByRole('heading', { name: '找不到這個專案' })).toBeTruthy();
  expect(screen.getByText('專案可能已經刪除。')).toBeTruthy();
});

test('ErrorPage: 回上一頁 and 回首頁 call their handlers; 回首頁 is the one primary button', async () => {
  const onBack = vi.fn();
  const onHome = vi.fn();
  render(<ErrorPage code={404} onBack={onBack} onHome={onHome} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '回上一頁' }));
  await user.click(screen.getByRole('button', { name: '回首頁' }));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(onHome).toHaveBeenCalledTimes(1);
  expect(document.querySelectorAll('.ui-btn-primary').length).toBe(1);
  expect(screen.getByRole('button', { name: '回首頁' }).classList.contains('ui-btn-primary')).toBe(true);
});
