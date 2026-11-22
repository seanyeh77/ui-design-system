import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { LoginCard } from '../../index';

const described = (el: HTMLElement) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent)
    .join(' ');

test('LoginCard: empty fields are not sent; each says what is missing under it', async () => {
  const onSubmit = vi.fn();
  render(<LoginCard onSubmit={onSubmit} />);
  expect(screen.getByRole('heading', { level: 1, name: '登入' })).toBeTruthy();
  await userEvent.setup().click(screen.getByRole('button', { name: '登入' }));
  expect(onSubmit).not.toHaveBeenCalled();
  const account = screen.getByLabelText('帳號');
  const password = screen.getByLabelText('密碼');
  expect(account.getAttribute('aria-invalid')).toBe('true');
  expect(described(account)).toBe('請輸入帳號');
  expect(password.getAttribute('aria-invalid')).toBe('true');
  expect(described(password)).toBe('請輸入密碼');
});

test('LoginCard: Enter sends account and password; error.password shows under the password only', async () => {
  const onSubmit = vi.fn();
  const { rerender } = render(<LoginCard onSubmit={onSubmit} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('帳號'), 'sean');
  await user.type(screen.getByLabelText('密碼'), 'secret{Enter}');
  expect(onSubmit).toHaveBeenCalledWith({ account: 'sean', password: 'secret' });
  rerender(<LoginCard onSubmit={onSubmit} error={{ password: '帳號或密碼不正確，請再試一次。' }} />);
  expect(screen.getByLabelText('帳號').getAttribute('aria-invalid')).toBeNull();
  expect(described(screen.getByLabelText('密碼'))).toBe('帳號或密碼不正確，請再試一次。');
  expect(screen.getByRole('alert').textContent).toBe('帳號或密碼不正確，請再試一次。');
});

test('LoginCard: the eye button shows the password and says whether it is pressed', async () => {
  render(<LoginCard onSubmit={() => {}} forgotHref="/forgot" />);
  const pw = screen.getByLabelText('密碼') as HTMLInputElement;
  expect(pw.type).toBe('password');
  expect(pw.getAttribute('autocomplete')).toBe('current-password');
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '顯示密碼' }));
  expect(pw.type).toBe('text');
  const hide = screen.getByRole('button', { name: '隱藏密碼' });
  expect(hide.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('link', { name: '忘記密碼' }).getAttribute('href')).toBe('/forgot');
});

test('LoginCard: loading disables the submit button', () => {
  render(<LoginCard onSubmit={() => {}} loading />);
  const btn = screen.getByRole('button', { name: '登入' }) as HTMLButtonElement;
  expect(btn.disabled).toBe(true);
  expect(btn.getAttribute('aria-busy')).toBe('true');
});

test('LoginCard: an account error is announced like the password error (role alert)', () => {
  render(<LoginCard onSubmit={() => {}} error={{ account: '找不到這個帳號，請確認拼字。' }} />);
  const alerts = screen.getAllByRole('alert');
  expect(alerts.map((a) => a.textContent)).toEqual(['找不到這個帳號，請確認拼字。']);
  expect(described(screen.getByLabelText('帳號'))).toBe('找不到這個帳號，請確認拼字。');
});
