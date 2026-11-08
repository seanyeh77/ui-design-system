import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  Button,
  CommandPalette,
  DatePicker,
  Dialog,
  Drawer,
  Menu,
  MultiSelect,
  Popover,
  ProjectSwitcher,
  Select,
  SideNav,
  Term,
  TextField,
  Tooltip,
  Tour,
} from '../index';

const user = userEvent.setup();

describe('danger actions are confirmed', () => {
  test('Button with confirm asks first, then runs onClick', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="danger" confirm={{ title: '刪除 api？' }} onClick={onClick}>
        刪除
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: '刪除' }));
    expect(onClick).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog', { name: '刪除 api？' });
    await user.click(within(dialog).getByRole('button', { name: '刪除' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('a danger submit button submits only after confirming', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" variant="danger" confirm={{ title: '刪除帳號？' }}>
          刪除
        </Button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: '刪除' }));
    expect(onSubmit).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog', { name: '刪除帳號？' });
    await user.click(within(dialog).getByRole('button', { name: '刪除' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('Menu danger item asks first', async () => {
    const onSelect = vi.fn();
    render(<Menu items={[{ label: '重新命名' }, { label: '刪除', danger: true, confirm: { title: '刪除這筆？' }, onSelect }]} />);
    await user.click(screen.getByRole('button', { name: '更多操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '刪除' }));
    expect(onSelect).not.toHaveBeenCalled();
    await screen.findByRole('dialog', { name: '刪除這筆？' });
    await user.click(screen.getByRole('button', { name: '刪除' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

test('Dialog closes on Esc and returns focus', async () => {
  function Demo() {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>開啟</Button>
        <Dialog open={open} onClose={() => setOpen(false)} title="發布？" confirmLabel="發布" onConfirm={() => setOpen(false)}>
          內容
        </Dialog>
      </>
    );
  }
  render(<Demo />);
  const opener = screen.getByRole('button', { name: '開啟' });
  await user.click(opener);
  await screen.findByRole('dialog', { name: '發布？' });
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(opener));
});

test('Drawer with unsaved changes asks before closing', async () => {
  const onClose = vi.fn();
  render(
    <Drawer open dirty onClose={onClose} title="編輯">
      欄位
    </Drawer>,
  );
  await user.click(await screen.findByRole('button', { name: '關閉' }));
  await screen.findByRole('dialog', { name: '放棄未儲存的變更？' });
  expect(onClose).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '放棄' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('Select picks with the keyboard', async () => {
  const onChange = vi.fn();
  render(
    <Select
      label="環境"
      options={[
        { value: 'dev', label: '開發' },
        { value: 'prod', label: '正式' },
      ]}
      onChange={onChange}
    />,
  );
  await user.click(screen.getByRole('combobox', { name: '環境' }));
  await user.click(await screen.findByRole('option', { name: '正式' }));
  expect(onChange).toHaveBeenCalledWith('prod');
});

test('Select over 8 options has a search box', async () => {
  const onChange = vi.fn();
  const options = Array.from({ length: 12 }, (_, i) => ({ value: 'v' + i, label: '選項 ' + i }));
  render(<Select label="清單" options={options} onChange={onChange} />);
  await user.click(screen.getByRole('combobox', { name: '清單' }));
  await user.type(await screen.findByRole('combobox', { name: '搜尋' }), '11');
  await user.click(await screen.findByRole('option', { name: '選項 11' }));
  expect(onChange).toHaveBeenCalledWith('v11');
});

test('MultiSelect adds and removes chips', async () => {
  function Demo() {
    const [v, setV] = React.useState<string[]>([]);
    return (
      <MultiSelect
        label="標籤"
        value={v}
        onChange={setV}
        options={[
          { value: 'a', label: '前端' },
          { value: 'b', label: '後端' },
        ]}
      />
    );
  }
  render(<Demo />);
  await user.click(screen.getByLabelText('標籤'));
  await user.click(await screen.findByRole('option', { name: '後端' }));
  expect(screen.getByRole('button', { name: '移除 後端' })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: '移除 後端' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: '移除 後端' })).toBeNull());
});

test('DatePicker picks today from the calendar', async () => {
  const onChange = vi.fn();
  render(<DatePicker label="日期" value={null} onChange={onChange} />);
  await user.click(screen.getByRole('button', { name: '開啟日曆' }));
  await user.click(await screen.findByRole('button', { name: '今天' }));
  const d = onChange.mock.calls[0][0] as Date;
  expect(d.toDateString()).toBe(new Date().toDateString());
});

test('Popover opens on click and shows its content', async () => {
  render(
    <Popover label="說明" title="篩選">
      內容文字
    </Popover>,
  );
  await user.click(screen.getByRole('button', { name: '說明' }));
  expect(await screen.findByText('內容文字')).toBeTruthy();
});

test('Tooltip shows on focus', async () => {
  render(
    <Tooltip label="複製連結">
      <button type="button">copy</button>
    </Tooltip>,
  );
  await user.tab();
  expect(await screen.findByText('複製連結', { ignore: '[hidden], script, style' })).toBeTruthy();
});

test('CommandPalette opens with Ctrl K and picks with Enter', async () => {
  const onSelect = vi.fn();
  function Demo() {
    const [open, setOpen] = React.useState(false);
    return (
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={[
          { label: '設定', kind: '頁面' },
          { label: '帳單', kind: '頁面' },
        ]}
        onSelect={onSelect}
      />
    );
  }
  render(<Demo />);
  await user.keyboard('{Control>}k{/Control}');
  const input = await screen.findByRole('combobox');
  await user.type(input, '帳');
  await user.keyboard('{Enter}');
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ label: '帳單' }));
});

test('CommandPalette reads each result as kind, then name', async () => {
  render(<CommandPalette open onOpenChange={() => {}} items={[{ label: 'IBTRACE_SHM', kind: '環境變數', detail: '`child.c:141`' }]} />);
  const input = await screen.findByRole('combobox');
  await user.type(input, 'IBT');
  const option = await screen.findByRole('option');
  expect(option.textContent?.startsWith('環境變數 IBTRACE_SHM')).toBe(true);
  expect(option.textContent).not.toContain('，');
});

test('Term opens its explanation and closes with ×', async () => {
  render(<Term text="一段說明">名詞</Term>);
  await user.click(screen.getByRole('button', { name: /名詞/ }));
  expect(await screen.findByText('一段說明')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: '關閉說明' }));
  await waitFor(() => expect(screen.queryByText('一段說明')).toBeNull());
});

test('Tour steps forward and ends', async () => {
  const onClose = vi.fn();
  render(
    <Tour
      open
      steps={[
        { title: '第一步', text: 'a' },
        { title: '第二步', text: 'b' },
      ]}
      onClose={onClose}
    />,
  );
  await screen.findByText('第一步');
  await user.click(screen.getByRole('button', { name: '下一步' }));
  await screen.findByText('第二步');
  await user.click(screen.getByRole('button', { name: '完成' }));
  expect(onClose).toHaveBeenCalledWith('done');
});

test('CommandPalette starts empty on every open', async () => {
  function Demo() {
    const [open, setOpen] = React.useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>搜尋</Button>
        <CommandPalette open={open} onOpenChange={setOpen} items={[{ id: 'a', label: 'beta' }]} onSelect={() => setOpen(false)} />
      </>
    );
  }
  render(<Demo />);
  await user.type(await screen.findByRole('combobox'), 'bet');
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull());
  await user.click(screen.getByRole('button', { name: '搜尋' }));
  expect(await screen.findByRole('combobox')).toHaveProperty('value', '');
});

test('MultiSelect creatable adds the typed value on Enter; Backspace removes the last value', async () => {
  const onChange = vi.fn();
  const { rerender } = render(<MultiSelect label="標籤" creatable options={[{ value: 'a', label: 'A' }]} value={[]} onChange={onChange} />);
  await user.type(screen.getByRole('combobox'), 'zzz{Enter}');
  expect(onChange).toHaveBeenLastCalledWith(['zzz']);
  rerender(<MultiSelect label="標籤" options={[]} value={['a', 'b', 'c']} maxChips={2} onChange={onChange} />);
  await user.click(screen.getByRole('combobox'));
  await user.keyboard('{Backspace}');
  expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
});

test('ProjectSwitcher closes after picking', async () => {
  const onChange = vi.fn();
  render(
    <ProjectSwitcher
      project="Alpha"
      value="a"
      onChange={onChange}
      options={[
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
      ]}
    />,
  );
  await user.click(screen.getByRole('button'));
  await user.click(await screen.findByRole('menuitemradio', { name: /Beta/ }));
  expect(onChange).toHaveBeenCalledWith('b');
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
});

test('Drawer focuses the first field, not the close button', async () => {
  render(
    <Drawer open onClose={() => {}} title="編輯">
      <TextField label="名稱" />
    </Drawer>,
  );
  const field = await screen.findByRole('textbox', { name: '名稱' });
  await waitFor(() => expect(document.activeElement).toBe(field));
});

test('Tooltip text describes its trigger', async () => {
  render(
    <Tooltip label="沒有權限">
      <Button>發布</Button>
    </Tooltip>,
  );
  expect(screen.getByRole('button', { name: '發布' }).getAttribute('aria-describedby')).toBeTruthy();
});

test('a menu inside a dialog is painted above it', async () => {
  render(
    <Dialog open onClose={() => {}} title="設定">
      <Menu items={[{ label: '重新命名' }]} />
    </Dialog>,
  );
  await user.click(await screen.findByRole('button', { name: '更多操作' }));
  const item = await screen.findByRole('menuitem', { name: '重新命名' });
  const r = item.getBoundingClientRect();
  expect(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('[role="menuitem"]')).toBe(item);
});

test('Drawer: the footer 取消 from requestClose asks before discarding changes', async () => {
  const onClose = vi.fn();
  render(
    <Drawer open dirty onClose={onClose} title="編輯" actions={(requestClose) => <Button onClick={requestClose}>取消</Button>}>
      <TextField label="名稱" />
    </Drawer>,
  );
  await user.click(await screen.findByRole('button', { name: '取消' }));
  expect(onClose).not.toHaveBeenCalled();
  expect(await screen.findByRole('dialog', { name: '放棄未儲存的變更？' })).toBeTruthy();
});

test('SideNav collapsed: a parent opens its first page', async () => {
  const onChange = vi.fn();
  render(
    <SideNav
      collapsed
      value="home"
      onChange={onChange}
      sections={[
        {
          items: [
            { id: 'home', label: '總覽', icon: 'house' },
            {
              id: 'proj',
              label: '專案',
              icon: 'folder',
              children: [
                { id: 'p1', label: '進行中' },
                { id: 'p2', label: '封存' },
              ],
            },
          ],
        },
      ]}
    />,
  );
  await user.click(screen.getByRole('button', { name: '專案' }));
  expect(onChange).toHaveBeenCalledWith('p1');
});
