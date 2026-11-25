import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TextField } from '../../index';

test('TextField: the error node exists only while there is an error; a new error is a new alert node', () => {
  const { container, rerender } = render(<TextField label="名稱" hint="最多 40 個字" />);
  const input = screen.getByLabelText('名稱');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent).toBe('最多 40\u00a0個字');
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

test('prefix, suffix and unit: muted text inside the one frame, read with the description; the unit follows the text', async () => {
  const user = userEvent.setup();
  render(
    <>
      <TextField label="月預算" prefix="NT$" suffix="元" />
      <TextField label="儲存空間" unit="GB" />
    </>,
  );
  const budget = screen.getByRole('textbox', { name: '月預算' });
  expect(
    budget
      .getAttribute('aria-describedby')
      ?.split(' ')
      .map((id) => document.getElementById(id)?.textContent),
  ).toEqual(['NT$', '元']);
  const box = budget.closest('.ui-field-box') as HTMLElement;
  const pre = box.querySelector('.ui-field-affix') as HTMLElement;
  expect(pre.getBoundingClientRect().right).toBeLessThanOrEqual(budget.getBoundingClientRect().left);
  expect(getComputedStyle(box).boxShadow).toContain('inset');
  expect(getComputedStyle(budget).borderTopStyle).toBe('none');
  // The input is the whole box: its touch target.
  expect(budget.getBoundingClientRect().height).toBe(box.getBoundingClientRect().height);
  const size = screen.getByRole('textbox', { name: '儲存空間' });
  const unit = () => (size.closest('.ui-field-box') as HTMLElement).querySelector('.ui-field-unitline .ui-field-affix') as HTMLElement;
  const x0 = unit().getBoundingClientRect().left;
  await user.type(size, '1200');
  expect(unit().getBoundingClientRect().left).toBeGreaterThan(x0 + 20);
  // A focus ring around the whole frame.
  expect(getComputedStyle(size.closest('.ui-field-box') as HTMLElement).outlineStyle).toBe('solid');
});
