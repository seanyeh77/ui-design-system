import { afterEach, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ThemePicker, setTheme } from '../../index';

const root = document.documentElement;

afterEach(() => {
  vi.restoreAllMocks();
  setTheme('light');
  localStorage.removeItem('ui-theme');
});

test('ThemePicker: a named radio group; picking applies the theme to <html> and stores it', async () => {
  localStorage.setItem('ui-theme', 'light');
  render(<ThemePicker />);
  const group = screen.getByRole('radiogroup', { name: '主題' });
  expect(group).toBeTruthy();
  expect(screen.getByRole('radio', { name: '淺色' }).getAttribute('aria-checked')).toBe('true');
  expect(screen.getByRole('radio', { name: '深色' }).getAttribute('aria-checked')).toBe('false');
  await userEvent.setup().click(screen.getByRole('radio', { name: '深色' }));
  expect(screen.getByRole('radio', { name: '深色' }).getAttribute('aria-checked')).toBe('true');
  expect(root.getAttribute('data-theme')).toBe('dark');
  expect(root.getAttribute('data-theme-setting')).toBe('dark');
  expect(localStorage.getItem('ui-theme')).toBe('dark');
});

test('ThemePicker: starts from the stored theme, 自動 when nothing is stored', () => {
  localStorage.removeItem('ui-theme');
  const { unmount } = render(<ThemePicker />);
  expect(screen.getByRole('radio', { name: '自動' }).getAttribute('aria-checked')).toBe('true');
  unmount();
  localStorage.setItem('ui-theme', 'dark');
  render(<ThemePicker />);
  expect(screen.getByRole('radio', { name: '深色' }).getAttribute('aria-checked')).toBe('true');
});

test('ThemePicker: with onChange it only reports the pick; value controls the checked card', async () => {
  setTheme('light');
  const onChange = vi.fn();
  render(<ThemePicker value="auto" onChange={onChange} label="外觀" />);
  expect(screen.getByRole('radiogroup', { name: '外觀' })).toBeTruthy();
  await userEvent.setup().click(screen.getByRole('radio', { name: '深色' }));
  expect(onChange).toHaveBeenCalledWith('dark');
  expect(root.getAttribute('data-theme')).toBe('light');
  // Controlled: stays on the value until the parent changes it.
  expect(screen.getByRole('radio', { name: '自動' }).getAttribute('aria-checked')).toBe('true');
});

test('ThemePicker: blocked storage (private mode, sandboxed frame) still switches the theme', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  render(<ThemePicker />);
  expect(screen.getByRole('radio', { name: '自動' }).getAttribute('aria-checked')).toBe('true');
  await userEvent.setup().click(screen.getByRole('radio', { name: '深色' }));
  expect(root.getAttribute('data-theme')).toBe('dark');
  expect(screen.getByRole('radio', { name: '深色' }).getAttribute('aria-checked')).toBe('true');
});

test('ThemePicker: one Tab stop on the chosen card; arrows move to the next card and choose it', async () => {
  localStorage.setItem('ui-theme', 'light');
  render(
    <>
      <button type="button">前</button>
      <ThemePicker />
      <button type="button">後</button>
    </>,
  );
  const user = userEvent.setup();
  screen.getByRole('button', { name: '前' }).focus();
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('radio', { name: '淺色' }));
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(screen.getByRole('radio', { name: '深色' }));
  expect(screen.getByRole('radio', { name: '深色' }).getAttribute('aria-checked')).toBe('true');
  expect(root.getAttribute('data-theme')).toBe('dark');
  // Wraps around.
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(screen.getByRole('radio', { name: '自動' }));
  await user.keyboard('{ArrowLeft}');
  expect(document.activeElement).toBe(screen.getByRole('radio', { name: '深色' }));
  // Tab leaves the group in one step.
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: '後' }));
});
