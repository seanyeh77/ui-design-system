import * as React from 'react';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  AppShell,
  BarChart,
  Calendar,
  DataTable,
  DatePicker,
  DateRangePicker,
  FileUpload,
  LineChart,
  Menu,
  NotificationBell,
  TreeList,
  addMessages,
  format,
  setLocale,
  t as tr,
} from './index';

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

test('Menu: a danger item asks 「Delete?」 in English, with a half-width question mark', async () => {
  setLocale('en');
  try {
    render(<Menu items={[{ label: 'Delete', danger: true, confirm: undefined as never, onSelect: () => {} }]} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await waitFor(() => expect(screen.getByRole('dialog').textContent).toContain('Delete?'));
  } finally {
    setLocale('zh-TW');
  }
});

test('NotificationBell: an unread notification is read as unread', async () => {
  render(<NotificationBell items={[{ id: 1, title: '部署完成', read: false }]} />);
  await userEvent.setup().click(screen.getByRole('button', { name: '通知，1 則未讀' }));
  expect(await screen.findByRole('button', { name: /^未讀，\s*部署完成/ })).toBeTruthy();
});

test('DatePicker: a required date field says so to screen readers', () => {
  render(<DatePicker label="開始日期" required value={null} onChange={() => {}} />);
  expect(screen.getByRole('textbox', { name: '開始日期' }).getAttribute('aria-required')).toBe('true');
});

test('DateRangePicker: dates follow the language', () => {
  setLocale('en');
  try {
    render(<DateRangePicker label="Period" value={[new Date(2026, 10, 4), new Date(2026, 10, 9)]} onChange={() => {}} />);
    const btn = screen.getByRole('button', { name: /^Period: / });
    expect(btn.textContent).toBe(`${format.date(new Date(2026, 10, 4), { weekday: false })} – ${format.date(new Date(2026, 10, 9), { weekday: false })}`);
    expect(btn.textContent).not.toContain('2026/11/04');
  } finally {
    setLocale('zh-TW');
  }
});

test('FileUpload: each progress bar is named after its file', () => {
  render(<FileUpload files={[{ id: 1, name: 'a.pdf', status: 'uploading', progress: 40 }]} />);
  expect(screen.getByRole('progressbar', { name: 'a.pdf 上傳進度' })).toBeTruthy();
});

test('DatePicker: a half-typed date is not an error until the field is left; a valid one clears it', async () => {
  const user = userEvent.setup();
  render(<DatePicker label="開始日期" value={null} onChange={() => {}} />);
  const box = screen.getByRole('textbox', { name: '開始日期' });
  await user.type(box, '2026/1');
  expect(box.getAttribute('aria-invalid')).toBeNull();
  await user.tab();
  expect(box.getAttribute('aria-invalid')).toBe('true');
  await user.click(box);
  await user.type(box, '1/14');
  expect(box.getAttribute('aria-invalid')).toBeNull();
});

test('Calendar: one day in the Tab order; arrows, Home, End and PageDown move it, across months', async () => {
  const user = userEvent.setup();
  render(<Calendar focus={new Date(2026, 10, 30)} />);
  const day = () => document.activeElement?.getAttribute('aria-label') ?? '';
  const stops = [...document.querySelectorAll('.ui-cal-day')].filter((b) => b.getAttribute('tabindex') === '0');
  expect(stops).toHaveLength(1);
  (stops[0] as HTMLElement).focus();
  expect(day()).toBe(format.date(new Date(2026, 10, 30), { weekday: false, long: true }));
  await user.keyboard('{ArrowRight}');
  expect(day()).toBe(format.date(new Date(2026, 11, 1), { weekday: false, long: true }));
  await user.keyboard('{ArrowUp}');
  expect(day()).toBe(format.date(new Date(2026, 10, 24), { weekday: false, long: true }));
  await user.keyboard('{PageDown}');
  expect(day()).toBe(format.date(new Date(2026, 11, 24), { weekday: false, long: true }));
  // zh-TW weeks start on Sunday: 2026/12/24 is a Thursday, so Home is Sunday 12/20.
  await user.keyboard('{Home}');
  expect(day()).toBe(format.date(new Date(2026, 11, 20), { weekday: false, long: true }));
});

test('BarChart and LineChart: Tab to the plot, ← → show and announce each value', async () => {
  const user = userEvent.setup();
  render(
    <>
      <BarChart
        label="每月"
        data={[
          { label: '1 月', value: 3 },
          { label: '2 月', value: 5 },
        ]}
        unit="個"
      />
      <LineChart label="每週" labels={['W1', 'W2']} series={[{ name: '完成', values: [1, 4] }]} unit="個" />
    </>,
  );
  await user.tab();
  expect(document.activeElement?.getAttribute('aria-label')).toBe('每月');
  expect(document.querySelector('.ui-chart-tip')?.textContent).toContain('3 個');
  await user.keyboard('{ArrowRight}');
  expect(document.querySelector('.ui-chart-tip')?.textContent).toContain('5 個');
  await waitFor(() => expect(document.querySelector('[data-ui-announcer]')?.textContent).toBe('2 月：5 個'));
  await user.tab();
  expect(document.activeElement?.getAttribute('aria-label')).toBe('每週');
  await user.keyboard('{End}');
  expect(document.querySelector('.ui-chart-tip')?.textContent).toContain('4 個');
});
