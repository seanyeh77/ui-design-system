import * as React from 'react';
import { expect, test, vi } from 'vitest';
import { userEvent as realUser } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SearchField } from '../../index';

function Box({ onValue }: { onValue?: (v: string) => void }) {
  const [v, setV] = React.useState('');
  return (
    <SearchField
      value={v}
      onChange={(x) => {
        setV(x);
        onValue?.(x);
      }}
    />
  );
}

test('SearchField: a search box named 「搜尋」 by default, label replaces it', () => {
  const { unmount } = render(<SearchField value="" onChange={() => {}} />);
  expect(screen.getByRole('searchbox', { name: '搜尋' })).toBeTruthy();
  unmount();
  render(<SearchField value="" onChange={() => {}} label="搜尋專案" placeholder="名稱或 ID" />);
  const box = screen.getByRole('searchbox', { name: '搜尋專案' });
  expect(box.getAttribute('placeholder')).toBe('名稱或 ID');
});

test('SearchField: onChange gets each keystroke; the clear button shows only with text', async () => {
  const onValue = vi.fn();
  render(<Box onValue={onValue} />);
  expect(screen.queryByRole('button', { name: '清除搜尋' })).toBeNull();
  const user = userEvent.setup();
  await user.type(screen.getByRole('searchbox'), 'api');
  expect(onValue.mock.calls.map((c) => c[0])).toEqual(['a', 'ap', 'api']);
  expect(screen.getByRole('button', { name: '清除搜尋' })).toBeTruthy();
});

test('SearchField: 清除搜尋 empties the field and leaves focus in it, not on the page', async () => {
  const onValue = vi.fn();
  render(<Box onValue={onValue} />);
  const user = userEvent.setup();
  const box = screen.getByRole('searchbox') as HTMLInputElement;
  await user.type(box, 'api');
  await user.click(screen.getByRole('button', { name: '清除搜尋' }));
  expect(onValue).toHaveBeenLastCalledWith('');
  expect(box.value).toBe('');
  expect(screen.queryByRole('button', { name: '清除搜尋' })).toBeNull();
  expect(document.activeElement).toBe(box);
});

test('SearchField: Escape in the field clears it (the browser does it for type=search; a real key press)', async () => {
  const onValue = vi.fn();
  render(<Box onValue={onValue} />);
  const box = screen.getByRole('searchbox') as HTMLInputElement;
  await userEvent.setup().type(box, 'api');
  box.focus();
  await realUser.keyboard('{Escape}');
  expect(box.value).toBe('');
  expect(onValue).toHaveBeenLastCalledWith('');
});
