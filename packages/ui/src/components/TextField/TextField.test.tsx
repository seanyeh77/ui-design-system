import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextField } from '../../index';

test('TextField: the error node exists only while there is an error; a new error is a new alert node', () => {
  const { container, rerender } = render(<TextField label="名稱" hint="最多 40 個字" />);
  const input = screen.getByLabelText('名稱');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent).toBe('最多 40 個字');
  rerender(<TextField label="名稱" hint="最多 40 個字" error="名稱不能空白，請輸入名稱。" />);
  const first = screen.getByRole('alert');
  expect(first.textContent).toBe('名稱不能空白，請輸入名稱。');
  expect(input.getAttribute('aria-describedby')).toBe(first.id);
  expect(input.getAttribute('aria-invalid')).toBe('true');
  // The same error again: the same node, not announced twice.
  rerender(<TextField label="名稱" hint="最多 40 個字" error="名稱不能空白，請輸入名稱。" />);
  expect(screen.getByRole('alert')).toBe(first);
  // A different error: inserted anew, so it is announced.
  rerender(<TextField label="名稱" hint="最多 40 個字" error="名稱太長，請刪到 40 個字以內。" />);
  expect(screen.getByRole('alert')).not.toBe(first);
  rerender(<TextField label="名稱" hint="最多 40 個字" />);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(container.querySelector('.ui-field-error')).toBeNull();
});
