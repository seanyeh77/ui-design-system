import * as React from 'react';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TextArea } from '../../index';

function Box(p: { maxLength?: number; hint?: string; required?: boolean }) {
  const [v, setV] = React.useState('');
  return <TextArea label="說明" value={v} onChange={setV} {...p} />;
}

test('TextArea: named by its label; required is said to screen readers, the asterisk is not read', () => {
  render(<Box required />);
  const ta = screen.getByRole('textbox', { name: '說明' });
  expect(ta.tagName).toBe('TEXTAREA');
  expect(ta.getAttribute('aria-required')).toBe('true');
});

test('TextArea: the hint describes the field', () => {
  render(<Box hint="寫給審核者看的說明。" />);
  const ta = screen.getByRole('textbox', { name: '說明' });
  const ids = (ta.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
  expect(ids.map((id) => document.getElementById(id)?.textContent)).toContain('寫給審核者看的說明。');
});

test('TextArea: the counter is read 「200 字中的 n 字」, not with a slash; maxLength stops typing', async () => {
  render(<Box maxLength={5} />);
  const user = userEvent.setup();
  const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
  await user.type(ta, 'abc');
  const hidden = document.querySelector('.ui-count .ui-visually-hidden');
  expect(hidden?.textContent).toBe('5 字中的 3 字');
  expect(document.querySelector('.ui-count [aria-hidden="true"] .ui-seen')?.getAttribute('data-text')).toBe('3 / 5');
  await user.type(ta, 'defgh');
  expect(ta.value).toBe('abcde');
  expect(hidden?.textContent).toBe('5 字中的 5 字');
});

test('TextArea: the counter defaults to 200', () => {
  render(<Box />);
  expect(document.querySelector('.ui-count .ui-visually-hidden')?.textContent).toBe('200 字中的 0 字');
  expect(screen.getByRole('textbox').getAttribute('maxlength')).toBe('200');
});

test('TextArea: grows with its text up to 8 lines, then scrolls', async () => {
  render(<Box maxLength={2000} />);
  const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
  const h0 = ta.getBoundingClientRect().height;
  const user = userEvent.setup();
  ta.focus();
  await user.paste('一\n二\n三\n四\n五');
  const h1 = ta.getBoundingClientRect().height;
  expect(h1).toBeGreaterThan(h0);
  await user.paste('\n六\n七\n八\n九\n十\n十一\n十二\n十三\n十四');
  const h2 = ta.getBoundingClientRect().height;
  expect(h2).toBeGreaterThan(h1);
  expect(h2).toBeLessThanOrEqual(8 * 26 + 22 + 0.5);
  expect(ta.scrollHeight).toBeGreaterThan(ta.clientHeight);
});
