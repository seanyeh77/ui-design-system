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
  // Focus goes to the first field with an error, which reads it; the errors are not alerts firing at once.
  expect(document.activeElement).toBe(account);
  expect(screen.queryAllByRole('alert')).toEqual([]);
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
  // The error from the sign-in check moves focus to its field.
  expect(document.activeElement).toBe(screen.getByLabelText('密碼'));
});

test('LoginCard: the eye button shows the password and says whether it is pressed', async () => {
  render(<LoginCard onSubmit={() => {}} forgotHref="/forgot" />);
  const pw = screen.getByLabelText('密碼') as HTMLInputElement;
  expect(pw.type).toBe('password');
  expect(pw.getAttribute('autocomplete')).toBe('current-password');
  const user = userEvent.setup();
  const eye = screen.getByRole('button', { name: '顯示密碼' });
  expect(eye.getAttribute('aria-pressed')).toBe('false');
  await user.click(eye);
  expect(pw.type).toBe('text');
  // The same name; only the pressed state changes.
  expect(eye.getAttribute('aria-label')).toBe('顯示密碼');
  expect(eye.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('link', { name: '忘記密碼' }).getAttribute('href')).toBe('/forgot');
});

test('LoginCard: loading keeps the submit button focusable but inert (aria-disabled, aria-busy); focus stays on it', async () => {
  const onSubmit = vi.fn();
  const { rerender } = render(<LoginCard onSubmit={onSubmit} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('帳號'), 'sean');
  await user.type(screen.getByLabelText('密碼'), 'secret');
  const btn = screen.getByRole('button', { name: '登入' }) as HTMLButtonElement;
  btn.focus();
  await user.keyboard('{Enter}');
  rerender(<LoginCard onSubmit={onSubmit} loading />);
  expect(btn.disabled).toBe(false);
  expect(btn.getAttribute('aria-disabled')).toBe('true');
  expect(btn.getAttribute('aria-busy')).toBe('true');
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  expect(document.activeElement).toBe(btn);
  await user.keyboard('{Enter}');
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

test('LoginCard: the page is the main landmark; a logo goes beside the brand', () => {
  render(<LoginCard onSubmit={() => {}} brand="專案中心" logo={<svg data-testid="logo" />} />);
  expect(screen.getByRole('main').contains(screen.getByTestId('logo'))).toBe(true);
});

test('LoginCard: an account error from the sign-in check is in the field description and takes focus', () => {
  const { rerender } = render(<LoginCard onSubmit={() => {}} />);
  rerender(<LoginCard onSubmit={() => {}} error={{ account: '找不到這個帳號，請確認拼字。' }} />);
  expect(described(screen.getByLabelText('帳號'))).toBe('找不到這個帳號，請確認拼字。');
  expect(document.activeElement).toBe(screen.getByLabelText('帳號'));
});
