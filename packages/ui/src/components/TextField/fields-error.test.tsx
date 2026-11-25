import type * as React from 'react';
import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { DatePicker, LoginCard, MultiSelect, Select, TextArea, TextField } from '../../index';

// One error pattern for every field type: the red border, the warning icon in the field, and the cause and fix under
// it as an alert that the field points to (aria-describedby).

const danger = () => {
  const probe = document.createElement('span');
  probe.style.color = 'var(--danger)';
  document.body.append(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
};

const cases: [string, () => React.ReactElement, string][] = [
  ['TextField', () => <TextField label="名稱" error="請填寫名稱" />, '.ui-input'],
  ['TextArea', () => <TextArea label="說明" value="" onChange={() => {}} error="請寫下退款原因" />, '.ui-textarea'],
  ['Select', () => <Select label="部門" options={[{ value: 'a', label: '研發' }]} error="請選擇部門" />, '.ui-select-trigger'],
  ['Select searchable', () => <Select label="部門" searchable options={[{ value: 'a', label: '研發' }]} error="請選擇部門" />, '.ui-select-trigger'],
  ['MultiSelect', () => <MultiSelect label="標籤" options={[{ value: 'a', label: '急件' }]} value={[]} onChange={() => {}} error="至少選一個標籤" />, '.ui-ms'],
  ['DatePicker', () => <DatePicker label="開始日期" value={null} onChange={() => {}} error="請選擇開始日期" />, '.ui-datefield'],
  ['LoginCard password', () => <LoginCard onSubmit={() => {}} error={{ password: '密碼不正確，請再試一次' }} />, '.ui-pwfield'],
];

test.each(cases)('%s with an error: red border, warning icon in the field, the message as an alert the field points to', (_, el, box) => {
  const { container } = render(el());
  const frame = container.querySelector(box) as HTMLElement;
  expect(frame, box).not.toBeNull();
  const cs = getComputedStyle(frame);
  expect(cs.borderTopColor).toBe(danger());
  // The icon sits inside the field (the box itself or the wrapper it shares with the input).
  const icon = (frame.querySelector('.ui-field-icon') ?? frame.parentElement?.querySelector(':scope > .ui-field-icon')) as HTMLElement | null;
  if (!icon) throw new Error('no warning icon');
  const ir = icon.getBoundingClientRect();
  const fr = frame.getBoundingClientRect();
  expect(ir.left >= fr.left && ir.right <= fr.right && ir.top >= fr.top && ir.bottom <= fr.bottom).toBe(true);
  // LoginCard moves focus to the invalid field instead, so its message is not an alert (one message at a time).
  const alert = container.querySelector(_ === 'LoginCard password' ? '.ui-field-error' : '[role="alert"].ui-field-error') as HTMLElement;
  expect(alert, 'message').not.toBeNull();
  const invalid = container.querySelector('[aria-invalid="true"]') as HTMLElement;
  expect(invalid, 'aria-invalid').not.toBeNull();
  expect((invalid.getAttribute('aria-describedby') ?? '').split(' ')).toContain(alert.id);
});
