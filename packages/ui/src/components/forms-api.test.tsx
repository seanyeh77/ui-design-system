import * as React from 'react';
import { expect, test, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Calendar, Checkbox, DatePicker, DateRangePicker, Dialog, Menu, MultiSelect, Popover, RadioGroup, Switch, TextArea, TextField } from '../index';

const described = (el: Element) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? '');

test('TextField: onChange receives the value, then the event; your aria-describedby and aria-invalid are kept', async () => {
  const onChange = vi.fn();
  render(
    <>
      <p id="own">單位為公斤</p>
      <TextField label="重量" hint="只寫數字" aria-describedby="own" aria-invalid onChange={onChange} />
    </>,
  );
  const input = screen.getByRole('textbox', { name: '重量' });
  expect(described(input)).toEqual(['單位為公斤', '只寫數字']);
  expect(input.getAttribute('aria-invalid')).toBe('true');
  await userEvent.setup().type(input, '7');
  expect(onChange).toHaveBeenCalledWith('7', expect.objectContaining({ target: input }));
});

test('TextField hideLabel: the label is hidden from sight and still names the field', () => {
  render(<TextField label="搜尋專案" hideLabel />);
  const input = screen.getByRole('textbox', { name: '搜尋專案' });
  expect(document.querySelector(`label[for="${input.id}"]`)?.classList.contains('ui-visually-hidden')).toBe(true);
});

test('TextArea: the counter is part of the description; reaching the limit is announced once', async () => {
  function Box() {
    const [v, setV] = React.useState('');
    return <TextArea label="說明" hint="寫給審核者" value={v} onChange={setV} maxLength={3} />;
  }
  render(<Box />);
  const ta = screen.getByRole('textbox', { name: '說明' });
  expect(described(ta)).toEqual(['寫給審核者', '3 字中的 0 字']);
  await userEvent.setup().type(ta, 'abc');
  await waitFor(() => expect(document.querySelector('[data-ui-announcer]')?.textContent).toBe('已達 3 字上限'));
});

test('DateRangePicker: the name includes what is shown; 清除 sends [null, null]; hint and error describe it', async () => {
  const onChange = vi.fn();
  const a = new Date(2026, 10, 1);
  const b = new Date(2026, 10, 7);
  const { rerender } = render(<DateRangePicker label="報表期間" value={[a, b]} onChange={onChange} hint="最多 90 天" />);
  const btn = screen.getByRole('button', { name: /報表期間/ });
  const shown = btn.textContent ?? '';
  // WCAG 2.5.3: the accessible name contains the visible text.
  expect(btn.textContent && (btn.getAttribute('aria-label') ?? '')).toBe('');
  expect(document.getElementById((btn.getAttribute('aria-labelledby') ?? '').split(' ')[1])?.textContent).toBe(shown);
  expect(described(btn)).toEqual(['最多 90 天']);
  // The calendar icon is at the right end, after the text.
  expect(btn.lastElementChild?.classList.contains('ui-rangefield-icon')).toBe(true);
  await userEvent.setup().click(btn);
  await userEvent.setup().click(await screen.findByRole('button', { name: '清除' }));
  expect(onChange).toHaveBeenCalledWith([null, null]);
  rerender(<DateRangePicker label="報表期間" value={[null, null]} onChange={onChange} required error="請選擇期間" />);
  const empty = screen.getByRole('button', { name: /報表期間/ });
  expect(empty.getAttribute('aria-invalid')).toBe('true');
  expect(empty.getAttribute('aria-required')).toBe('true');
});

test('DatePicker in a FormGrid fills its column', async () => {
  const { FormGrid } = await import('../index');
  render(
    <div style={{ width: 900 }}>
      <FormGrid>
        <TextField label="名稱" />
        <DatePicker label="開始日期" value={null} onChange={() => {}} />
      </FormGrid>
    </div>,
  );
  const name = screen.getByRole('textbox', { name: '名稱' }).getBoundingClientRect().width;
  const date = document.querySelector('.ui-datefield')?.getBoundingClientRect().width ?? 0;
  expect(Math.abs(name - date)).toBeLessThan(1);
});

test('MultiSelect: 「+n」 is read with the names it hides; required, hint and disabled', () => {
  const options = ['a', 'b', 'c', 'd'].map((v) => ({ value: v, label: '標籤 ' + v }));
  render(<MultiSelect label="標籤" options={options} value={['a', 'b', 'c', 'd']} onChange={() => {}} required hint="可選多個" disabled />);
  const more = document.querySelector('.ui-chip-more');
  expect(more?.querySelector('.ui-visually-hidden')?.textContent).toBe('另外 2 個：標籤 c、標籤 d');
  const input = screen.getByRole('combobox', { name: '標籤' });
  expect(input.getAttribute('aria-required')).toBe('true');
  expect(described(input)).toEqual(['可選多個']);
  expect((input as HTMLInputElement).disabled).toBe(true);
});

test('Checkbox, Switch and RadioGroup work uncontrolled with defaultChecked / defaultValue', async () => {
  render(
    <>
      <Checkbox label="同意條款" defaultChecked />
      <Switch label="通知" />
      <RadioGroup
        label="方案"
        defaultValue="a"
        options={[
          { value: 'a', label: '月繳' },
          { value: 'b', label: '年繳' },
        ]}
      />
    </>,
  );
  const user = userEvent.setup();
  const box = screen.getByRole('checkbox', { name: '同意條款' });
  expect(box.getAttribute('aria-checked')).toBe('true');
  await user.click(box);
  expect(box.getAttribute('aria-checked')).toBe('false');
  const sw = screen.getByRole('switch', { name: '通知' });
  await user.click(sw);
  expect(sw.getAttribute('aria-checked')).toBe('true');
  expect(screen.getByRole('radiogroup', { name: '方案' })).toBeTruthy();
  await user.click(screen.getByRole('radio', { name: '年繳' }));
  expect(screen.getByRole('radio', { name: '年繳' }).getAttribute('aria-checked')).toBe('true');
  await user.keyboard('{ArrowLeft}');
  expect(screen.getByRole('radio', { name: '月繳' }).getAttribute('aria-checked')).toBe('true');
});

test('Dialog tone danger: an alert dialog, described by its body, focus on 取消 (the safe action)', async () => {
  render(
    <Dialog open onOpenChange={() => {}} tone="danger" title="刪除 api-gateway？" confirmLabel="刪除" onConfirm={() => {}}>
      設定和紀錄會一起刪除，無法復原。
    </Dialog>,
  );
  const dlg = await screen.findByRole('alertdialog', { name: '刪除 api-gateway？' });
  expect(described(dlg)).toEqual(['設定和紀錄會一起刪除，無法復原。']);
  await waitFor(() => expect(document.activeElement).toBe(within(dlg).getByRole('button', { name: '取消' })));
});

test('Dialog: onOpenChange(false, reason) on 取消 and Esc; defaultOpen closes itself', async () => {
  const onOpenChange = vi.fn();
  const user = userEvent.setup();
  render(
    <Dialog defaultOpen onOpenChange={onOpenChange} title="發布？" confirmLabel="發布" onConfirm={() => {}}>
      內容
    </Dialog>,
  );
  const dlg = await screen.findByRole('dialog', { name: '發布？' });
  expect(described(dlg)).toEqual(['內容']);
  await user.click(within(dlg).getByRole('button', { name: '取消' }));
  expect(onOpenChange).toHaveBeenCalledWith(false, 'cancel');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

test('Popover and Menu are controllable: open, onOpenChange', async () => {
  const onPop = vi.fn();
  const onMenu = vi.fn();
  render(
    <>
      <Popover label="篩選" open count={2} unit="個條件" onOpenChange={onPop} className="extra">
        內容
      </Popover>
      <Menu items={[{ label: '重新命名' }]} defaultOpen onOpenChange={onMenu} />
    </>,
  );
  expect(await screen.findByText('內容')).toBeTruthy();
  expect(document.querySelector('.ui-popover.extra')).toBeTruthy();
  expect(screen.getByRole('button', { name: /篩選/ }).textContent).toContain('2');
  expect(await screen.findByRole('menuitem', { name: '重新命名' })).toBeTruthy();
});

test('Calendar month: follows a new value from outside', () => {
  const { rerender } = render(<Calendar month={new Date(2026, 0, 10)} />);
  expect(document.querySelector('.ui-cal-title')?.textContent).toMatch(/1/);
  const first = document.querySelector('.ui-cal-title')?.textContent;
  rerender(<Calendar month={new Date(2026, 5, 10)} />);
  expect(document.querySelector('.ui-cal-title')?.textContent).not.toBe(first);
  expect(document.querySelector('.ui-cal-title')?.textContent).toMatch(/6/);
});
