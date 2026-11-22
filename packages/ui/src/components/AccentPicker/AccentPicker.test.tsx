import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AccentPicker, setAccent, setTheme } from '../../index';
import { DEFAULT_ACCENT } from '../../theme';

const accent = () => document.documentElement.style.getPropertyValue('--accent');

const reset = () => {
  vi.restoreAllMocks();
  setTheme('light');
  setAccent(DEFAULT_ACCENT, true);
  localStorage.removeItem('ui-accent');
  localStorage.removeItem('ui-theme');
};
beforeEach(reset);
afterEach(reset);

test('AccentPicker: 8 named swatches in a radio group; the stored accent is checked, 藍 by default', () => {
  localStorage.removeItem('ui-accent');
  const { unmount } = render(<AccentPicker />);
  const group = screen.getByRole('radiogroup', { name: '強調色' });
  const radios = group.querySelectorAll('[role="radio"]');
  expect(radios.length).toBe(8);
  expect(screen.getByRole('radio', { name: '藍' }).getAttribute('aria-checked')).toBe('true');
  unmount();
  localStorage.setItem('ui-accent', '#0e827d');
  render(<AccentPicker />);
  expect(screen.getByRole('radio', { name: '青' }).getAttribute('aria-checked')).toBe('true');
  expect(screen.getByRole('radio', { name: '藍' }).getAttribute('aria-checked')).toBe('false');
});

test('AccentPicker: a swatch applies the accent to the root and stores it', async () => {
  render(<AccentPicker />);
  await userEvent.setup().click(screen.getByRole('radio', { name: '綠' }));
  expect(accent()).toBe('#1a844a');
  expect(localStorage.getItem('ui-accent')).toBe('#1a844a');
  expect(screen.getByRole('radio', { name: '綠' }).getAttribute('aria-checked')).toBe('true');
});

test('AccentPicker: the hex field applies a full #rrggbb at once and explains a wrong one', async () => {
  render(<AccentPicker />);
  const user = userEvent.setup();
  const input = screen.getByRole('textbox', { name: '自訂強調色（色碼）' });
  await user.type(input, '#12');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByText('色碼格式不正確，例如 #2457d6')).toBeTruthy();
  expect(accent()).toBe(DEFAULT_ACCENT);
  await user.clear(input);
  await user.type(input, '#AA3366');
  expect(input.getAttribute('aria-invalid')).toBeNull();
  // Stored lower-case; no swatch is checked for a custom color.
  expect(accent()).toBe('#aa3366');
  expect(localStorage.getItem('ui-accent')).toBe('#aa3366');
  expect(screen.getByRole('radiogroup').querySelector('[aria-checked="true"]')).toBeNull();
});

test('AccentPicker: with onChange it only reports; value controls the checked swatch', async () => {
  const onChange = vi.fn();
  render(<AccentPicker value="#C2407A" onChange={onChange} />);
  expect(screen.getByRole('radio', { name: '桃紅' }).getAttribute('aria-checked')).toBe('true');
  await userEvent.setup().click(screen.getByRole('radio', { name: '紅' }));
  expect(onChange).toHaveBeenCalledWith('#cd3a2f');
  expect(accent()).toBe(DEFAULT_ACCENT);
  expect(localStorage.getItem('ui-accent')).toBeNull();
});

test('AccentPicker: blocked storage still applies the accent', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  render(<AccentPicker />);
  expect(screen.getByRole('radio', { name: '藍' }).getAttribute('aria-checked')).toBe('true');
  await userEvent.setup().click(screen.getByRole('radio', { name: '橘' }));
  expect(accent()).toBe('#b85a0e');
});

test('AccentPicker: the swatches are one Tab stop; arrows move and choose, then Tab goes to the hex field', async () => {
  render(<AccentPicker />);
  const user = userEvent.setup();
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('radio', { name: '藍' }));
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(screen.getByRole('radio', { name: '靛' }));
  expect(accent()).toBe('#5b4fd6');
  await user.keyboard('{ArrowLeft}{ArrowLeft}');
  expect(document.activeElement).toBe(screen.getByRole('radio', { name: '青' }));
  expect(accent()).toBe('#0e827d');
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('textbox', { name: '自訂強調色（色碼）' }));
});
