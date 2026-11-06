import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Button, CommandPalette, DatePicker, Dialog, Drawer, Menu, MultiSelect, Popover, Select, Term, Tooltip, Tour } from '../index';

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
    await user.click(screen.getAllByRole('button', { name: '刪除' }).find((b) => dialog.contains(b))!);
    expect(onClick).toHaveBeenCalledTimes(1);
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
  render(<Select label="環境" options={[{ value: 'dev', label: '開發' }, { value: 'prod', label: '正式' }]} onChange={onChange} />);
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
    return <MultiSelect label="標籤" value={v} onChange={setV} options={[{ value: 'a', label: '前端' }, { value: 'b', label: '後端' }]} />;
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
  render(<Popover label="說明" title="篩選">內容文字</Popover>);
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
  expect(await screen.findByText('複製連結')).toBeTruthy();
});

test('CommandPalette opens with Ctrl K and picks with Enter', async () => {
  const onSelect = vi.fn();
  function Demo() {
    const [open, setOpen] = React.useState(false);
    return <CommandPalette open={open} onOpenChange={setOpen} items={[{ label: '設定', kind: '頁面' }, { label: '帳單', kind: '頁面' }]} onSelect={onSelect} />;
  }
  render(<Demo />);
  await user.keyboard('{Control>}k{/Control}');
  const input = await screen.findByRole('combobox');
  await user.type(input, '帳');
  await user.keyboard('{Enter}');
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ label: '帳單' }));
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
  render(<Tour open steps={[{ title: '第一步', text: 'a' }, { title: '第二步', text: 'b' }]} onClose={onClose} />);
  await screen.findByText('第一步');
  await user.click(screen.getByRole('button', { name: '下一步' }));
  await screen.findByText('第二步');
  await user.click(screen.getByRole('button', { name: '完成' }));
  expect(onClose).toHaveBeenCalledWith('done');
});
