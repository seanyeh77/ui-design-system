import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { asText, useStored } from './stored';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

function Probe({ k, id }: { k?: string; id: string }) {
  const [v, set] = useStored<string | null>(k, asText, null);
  return (
    <button type="button" data-testid={id} onClick={() => set(v === 'b' ? null : 'b')}>
      {v ?? 'none'}
    </button>
  );
}

test('useStored: reads the stored value, writes through, and keeps two readers of one key in step', () => {
  localStorage.setItem('t-key', 'a');
  render(
    <>
      <Probe k="t-key" id="one" />
      <Probe k="t-key" id="two" />
    </>,
  );
  expect(screen.getByTestId('one').textContent).toBe('a');
  act(() => screen.getByTestId('one').click());
  expect(localStorage.getItem('t-key')).toBe('b');
  expect(screen.getByTestId('two').textContent).toBe('b');
  // null removes the key.
  act(() => screen.getByTestId('two').click());
  expect(localStorage.getItem('t-key')).toBeNull();
  expect(screen.getByTestId('one').textContent).toBe('none');
});

test('useStored: another tab’s change arrives through the storage event', () => {
  render(<Probe k="t-key" id="one" />);
  act(() => {
    localStorage.setItem('t-key', 'from another tab');
    window.dispatchEvent(new StorageEvent('storage', { key: 't-key' }));
  });
  expect(screen.getByTestId('one').textContent).toBe('from another tab');
});

test('useStored: no key keeps the value in memory; blocked storage still changes the value', () => {
  render(<Probe id="mem" />);
  act(() => screen.getByTestId('mem').click());
  expect(screen.getByTestId('mem').textContent).toBe('b');
  expect(localStorage.length).toBe(0);
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  render(<Probe k="t-blocked" id="blocked" />);
  act(() => screen.getByTestId('blocked').click());
  expect(screen.getByTestId('blocked').textContent).toBe('b');
});
