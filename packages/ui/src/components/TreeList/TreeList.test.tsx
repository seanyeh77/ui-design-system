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
      value={sel}
      onChange={(id, n) => {
        setSel(id);
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

test('files: date and size figures in Geist Mono, words in the text font; per-row download is quiet; 全部展開 is an icon button; the title is 17 px', async () => {
  const files: TreeNode[] = [
    { id: 'docs', name: 'docs', children: [{ id: 'a', name: 'a.pdf', size: 186_000, date: Date.now() - 2 * 3600_000 }] },
    { id: 'b', name: 'b.csv', size: 54_900_000, date: Date.now() - 3600_000 },
  ];
  const { container } = render(<TreeList title="檔案" items={files} onDownload={() => {}} />);
  const size = container.querySelector('.ui-tree-row:not(.is-folder) .ui-tree-size') as HTMLElement;
  expect(getComputedStyle(size.querySelector('.ui-num') as HTMLElement).fontFamily).toMatch(/Geist Mono/);
  expect(getComputedStyle(size).fontFamily).not.toMatch(/Geist Mono/);
  expect(container.querySelector('.ui-tree-act .ui-iconbtn')?.classList.contains('is-quiet')).toBe(true);
  const toggle = container.querySelector('.ui-tree-toggleall') as HTMLElement;
  expect(toggle.getAttribute('aria-label')).toBe('全部展開');
  expect(toggle.textContent).toBe('');
  const title = container.querySelector('.ui-tree-title') as HTMLElement;
  expect(getComputedStyle(title).fontSize).toBe(getComputedStyle(document.documentElement).getPropertyValue('--text-title').trim());
});

test('plain: the name contains the meta as shown (WCAG 2.5.3), then the full path when it is shortened', () => {
  const { container } = render(
    <TreeList
      kind="plain"
      label="呼叫"
      items={[
        { id: 'x', name: 'hook_of', meta: '×4' },
        { id: 'y', name: 'open', path: 'src/a/b/c/d/e/f/g/h/i/j/file.c:58' },
      ]}
    />,
  );
  expect(container.querySelector('[role="treeitem"]')?.getAttribute('aria-label')).toBe('hook_of，×4');
  const row = container.querySelectorAll('[role="treeitem"]')[1] as HTMLElement;
  const shown = (row.querySelector('.ui-tree-pmeta') as HTMLElement).textContent as string;
  expect(row.getAttribute('aria-label')).toContain(shown);
});

test('loading children failed: 重試 loads them again', async () => {
  let fail = true;
  const user = userEvent.setup();
  const { container, findByText } = render(
    <TreeList
      kind="plain"
      label="樹"
      items={[{ id: 'r', name: 'root', hasChildren: true }]}
      loadChildren={async () => {
        if (fail) throw new Error('斷線');
        return [{ id: 'c', name: 'child' }];
      }}
    />,
  );
  await user.click(container.querySelector('[aria-label="root"]') as HTMLElement);
  fail = false;
  await user.click(await findByText('重試'));
  expect(await findByText('child')).toBeTruthy();
});
