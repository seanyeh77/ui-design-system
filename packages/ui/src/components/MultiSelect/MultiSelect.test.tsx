import * as React from 'react';
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Dialog, MultiSelect, TextField } from '../../index';

const OPTIONS = [
  { value: 'a', label: '前端' },
  { value: 'b', label: '後端' },
  { value: 'c', label: '設計' },
];

function Controlled({ initial = ['a', 'b'], onChange }: { initial?: string[]; onChange?: (v: string[]) => void }) {
  const [v, setV] = React.useState(initial);
  return (
    <MultiSelect
      label="標籤"
      options={OPTIONS}
      value={v}
      onChange={(next) => {
        setV(next);
        onChange?.(next);
      }}
    />
  );
}

test('40 px tall like the other fields, with chips and with an error', () => {
  const { container } = render(
    <div style={{ width: 400 }}>
      <TextField label="名稱" value="" onChange={() => {}} />
      <MultiSelect label="標籤" options={OPTIONS} value={['a', 'b', 'c']} onChange={() => {}} />
      <MultiSelect label="標籤 2" options={OPTIONS} value={[]} onChange={() => {}} error="至少選一個" />
    </div>,
  );
  // As tall as a TextField: 40 px, 48 px on a phone-width page (the test page is narrow).
  const field = (container.querySelector('.ui-input') as HTMLElement).getBoundingClientRect().height;
  expect([40, 48]).toContain(field);
  const [a, b] = container.querySelectorAll<HTMLElement>('.ui-ms');
  expect(a.getBoundingClientRect().height).toBe(field);
  expect(b.getBoundingClientRect().height).toBe(field);
});

test('Esc in the closed field keeps the values; the list open, Esc only closes it', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<Controlled onChange={change} />);
  const input = screen.getByRole('combobox');
  await user.click(input);
  expect(await screen.findByRole('listbox')).toBeTruthy();
  await user.keyboard('{Escape}');
  await vi.waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  await user.keyboard('{Escape}');
  expect(change).not.toHaveBeenCalled();
  expect(screen.getAllByText('前端').length).toBeGreaterThan(0);
});

test('Esc in the closed field inside a Dialog closes the Dialog and keeps the values', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const open = vi.fn();
  render(
    <Dialog open onOpenChange={open} title="編輯">
      <Controlled onChange={change} />
    </Dialog>,
  );
  const input = await screen.findByRole('combobox');
  input.focus();
  await user.keyboard('{Escape}');
  expect(change).not.toHaveBeenCalled();
  expect(open).toHaveBeenCalledWith(false, expect.anything());
});

test('清除 removes every value and is announced; a chip × removes one', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<Controlled initial={['a', 'b', 'c']} onChange={change} />);
  await user.click(screen.getByRole('button', { name: '移除 前端' }));
  expect(change).toHaveBeenLastCalledWith(['b', 'c']);
  const live = () => [...document.querySelectorAll('[aria-live]')].map((e) => e.textContent).join(' ');
  await vi.waitFor(() => expect(live()).toContain('已移除 前端'));
  // Reachable with Tab, and Enter clears.
  const clear = screen.getByRole('button', { name: '清除標籤' });
  expect(clear.tabIndex).toBe(0);
  clear.focus();
  await user.keyboard('{Enter}');
  expect(change).toHaveBeenLastCalledWith([]);
  await vi.waitFor(() => expect(live()).toContain('已清除標籤'));
});
