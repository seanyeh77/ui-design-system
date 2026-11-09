import * as React from 'react';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AppShell, DataTable, TreeList, addMessages, format, setLocale, t as tr } from './index';

// Whole-repo review fixes, one test each.

test('format.fileSize: an empty file is 0 KB, a tiny one 1 KB', () => {
  expect(format.fileSize(0)).toBe('0 KB');
  expect(format.fileSize(10)).toBe('1 KB');
});

test('tr: Simplified Chinese uses the messages an app adds for it; zh-TW stays the source text', () => {
  addMessages('zh-CN', { 關閉: '关闭' });
  setLocale('zh-CN');
  try {
    expect(tr('關閉')).toBe('关闭');
  } finally {
    setLocale('zh-TW');
  }
  expect(tr('關閉')).toBe('關閉');
});

test('TreeList: an open folder whose id has a space still owns its children (aria-owns finds the group)', async () => {
  render(
    <TreeList
      kind="plain"
      label="樹"
      defaultOpen={['src/my dir']}
      items={[{ id: 'src/my dir', name: 'my dir', children: [{ id: 'src/my dir/a.c', name: 'a.c' }] }]}
    />,
  );
  const row = screen.getByRole('treeitem', { name: /my dir/ });
  const owns = row.getAttribute('aria-owns') ?? '';
  expect(owns).not.toMatch(/\s/);
  expect(document.getElementById(owns)?.getAttribute('role')).toBe('group');
});

test('DataTable: the caret of a row whose id has a space controls its details', async () => {
  await page.viewport(1280, 800);
  render(
    <DataTable
      columns={[
        { key: 'name', label: '名稱' },
        { key: 'note', label: '筆記', long: true },
      ]}
      rows={[{ id: 'a b', name: 'alpha', note: 'long text' }]}
      urlSync={false}
    />,
  );
  await userEvent.setup().click(screen.getByRole('button', { name: '展開 alpha' }));
  const ctl = screen.getByRole('button', { name: '收合 alpha' }).getAttribute('aria-controls') ?? '';
  expect(ctl).not.toMatch(/\s/);
  expect(document.getElementById(ctl)).not.toBeNull();
});

test('AppShell: the tablet drawer does not open again after the window was a desktop', async () => {
  await page.viewport(800, 900);
  const nav = [
    {
      items: [
        { id: 'a', label: '首頁', icon: 'house' as const },
        { id: 'b', label: '設定', icon: 'gear' as const },
      ],
    },
  ];
  render(
    <AppShell nav={nav} value="a" onNavigate={() => {}} title="首頁">
      <p>內容</p>
    </AppShell>,
  );
  await userEvent.setup().click(screen.getByRole('button', { name: '開啟導覽' }));
  await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
  await page.viewport(1280, 900);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await page.viewport(800, 900);
  await new Promise((r) => setTimeout(r, 300));
  expect(screen.queryByRole('dialog')).toBeNull();
  await page.viewport(1280, 900);
});
