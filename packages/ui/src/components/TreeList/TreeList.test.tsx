import { expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as React from 'react';
import { TreeList, type TreeNode } from '../../index';

const ITEMS: TreeNode[] = [
  { id: 'client', name: 'client', children: [{ id: 'connect', name: 'connect' }] },
  { id: 'server', name: 'server', children: [{ id: 'listen', name: 'listen' }] },
];

function Tree({ onSelect }: { onSelect: (n: TreeNode) => void }) {
  const [sel, setSel] = React.useState<string | undefined>(undefined);
  return (
    <TreeList
      kind="plain"
      label="元件"
      items={ITEMS}
      selectedId={sel}
      onSelect={(n) => {
        setSel(n.id);
        onSelect(n);
      }}
    />
  );
}

test('clicking the selected row again does not open, close or replay the slide-in', async () => {
  const onSelect = vi.fn();
  const { container } = render(<Tree onSelect={onSelect} />);
  const user = userEvent.setup();
  const row = () => container.querySelector<HTMLElement>('[aria-label="client"]') as HTMLElement;
  await user.click(row());
  expect(row().getAttribute('aria-expanded')).toBe('true');
  await new Promise((r) => setTimeout(r, 450));
  expect(container.querySelector('.ui-tree-in')).toBeNull();
  await user.click(row());
  expect(onSelect).toHaveBeenCalledTimes(2);
  expect(row().getAttribute('aria-expanded')).toBe('true');
  expect(container.querySelector('.ui-tree-in')).toBeNull();
  await user.keyboard('{Enter}');
  expect(row().getAttribute('aria-expanded')).toBe('true');
  // The caret still closes it.
  await user.click(row().querySelector('.ui-tree-caretbtn') as HTMLElement);
  expect(row().getAttribute('aria-expanded')).toBe('false');
  // Another row: selected and opened as before.
  await user.click(container.querySelector<HTMLElement>('[aria-label="server"]') as HTMLElement);
  expect(container.querySelector('[aria-label="server"]')?.getAttribute('aria-expanded')).toBe('true');
});
