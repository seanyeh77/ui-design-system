import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Button, Menu, useFilePicker } from '../../index';

const user = userEvent.setup();
afterEach(() => vi.restoreAllMocks());

const pickedInput = () => document.body.querySelector<HTMLInputElement>(':scope > input[type="file"]');
function choose(input: HTMLInputElement, names: string[]) {
  const dt = new DataTransfer();
  for (const n of names) dt.items.add(new File(['{}'], n, { type: 'application/json' }));
  input.files = dt.files;
  input.dispatchEvent(new Event('change'));
}

test('useFilePicker: open() from a Button and a Menu item opens one hidden input while the click event is handled', async () => {
  const clicks: { accept: string; multiple: boolean; inGesture: boolean }[] = [];
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
    clicks.push({ accept: this.accept, multiple: this.multiple, inGesture: window.event?.type === 'click' });
  });
  const picked: string[][] = [];
  function Page() {
    const picker = useFilePicker({ accept: '.json', multiple: true, onPick: (files) => picked.push(files.map((f) => f.name)) });
    return (
      <>
        <Button onClick={picker.open}>開啟檔案</Button>
        <Menu label="更多操作" items={[{ label: '開啟檔案', icon: 'folder-open', onSelect: picker.open }]} />
      </>
    );
  }
  const r = render(<Page />);
  // Nothing in the document before the first open.
  expect(pickedInput()).toBeNull();
  await user.click(screen.getByRole('button', { name: '開啟檔案' }));
  const input = pickedInput() as HTMLInputElement;
  expect(input).not.toBeNull();
  expect(input.hidden).toBe(true);
  expect(clicks).toEqual([{ accept: '.json', multiple: true, inGesture: true }]);
  choose(input, ['a.json', 'b.json']);
  expect(picked).toEqual([['a.json', 'b.json']]);
  // Cleared, so the same file can be picked again.
  expect(input.value).toBe('');

  await user.click(screen.getByRole('button', { name: '更多操作' }));
  await user.click(await screen.findByRole('menuitem', { name: '開啟檔案' }));
  expect(clicks).toHaveLength(2);
  expect(document.body.querySelectorAll(':scope > input[type="file"]')).toHaveLength(1);
  // Cancelling (no files) calls nothing.
  choose(input, []);
  expect(picked).toHaveLength(1);

  r.unmount();
  expect(pickedInput()).toBeNull();
});
