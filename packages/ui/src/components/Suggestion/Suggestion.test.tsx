import { afterEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Suggestion } from '../../index';

afterEach(() => {
  vi.restoreAllMocks();
});

test('Suggestion: the − and + marks are hidden; screen readers hear 原本 and 改成', () => {
  const { container } = render(<Suggestion before="timeout = 30" after="timeout = 60" />);
  expect(container.querySelector('.ui-sug-title')?.textContent).toBe('建議修正');
  const lines = Array.from(container.querySelectorAll('.ui-sug-line'));
  expect(lines.length).toBe(2);
  for (const l of lines) expect(l.querySelector('.ui-sug-mark')?.getAttribute('aria-hidden')).toBe('true');
  expect(lines[0].querySelector('.ui-visually-hidden')?.textContent).toBe('原本：');
  expect(lines[1].querySelector('.ui-visually-hidden')?.textContent).toBe('改成：');
  expect(lines[1].textContent).toContain('timeout = 60');
});

test('Suggestion: without before there is only the + line', () => {
  const { container } = render(<Suggestion after="return 0;" />);
  expect(container.querySelectorAll('.ui-sug-line').length).toBe(1);
  expect(container.querySelector('.is-del')).toBeNull();
});

test('Suggestion: the copy button copies the new line, says 已複製 and announces it', async () => {
  // user-event puts its own clipboard on navigator: set it up first, then watch writeText.
  const user = userEvent.setup();
  const write = vi.fn(() => Promise.resolve());
  vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(write);
  const onCopy = vi.fn();
  const { container } = render(<Suggestion before="a" after="b" copyText="b // fixed" onCopy={onCopy} />);
  await user.click(screen.getByRole('button', { name: '複製修正' }));
  expect(write).toHaveBeenCalledWith('b // fixed');
  await waitFor(() => expect(onCopy).toHaveBeenCalledWith('b // fixed'));
  expect(screen.getByRole('button', { name: '已複製' })).toBeTruthy();
  expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('已複製');
});

test('Suggestion: a failed copy calls onCopyError and does not claim 已複製', async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => Promise.reject(new Error('denied')));
  vi.spyOn(document, 'execCommand').mockReturnValue(false);
  const onCopy = vi.fn();
  const onCopyError = vi.fn();
  render(<Suggestion after="b" onCopy={onCopy} onCopyError={onCopyError} />);
  await user.click(screen.getByRole('button', { name: '複製修正' }));
  await waitFor(() => expect(onCopyError).toHaveBeenCalledTimes(1));
  expect(onCopy).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: '已複製' })).toBeNull();
});
