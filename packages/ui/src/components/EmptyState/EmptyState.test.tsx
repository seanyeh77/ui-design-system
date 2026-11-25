import { afterEach, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import { Button, EmptyState } from '../../index';

test('EmptyState: numbered first steps in an ordered list; the current one is marked for screen readers too', () => {
  render(
    <EmptyState
      title="還沒有專案"
      description="建立第一個專案後，追蹤結果會列在這裡。"
      steps={['建立專案', '安裝 agent', '送出第一筆資料']}
      current={1}
      action={<Button variant="primary">建立專案</Button>}
    />,
  );
  expect(screen.getByText('還沒有專案')).toBeTruthy();
  const items = screen.getAllByRole('listitem');
  expect(screen.getByRole('list').tagName).toBe('OL');
  expect(items.map((li) => li.getAttribute('aria-current'))).toEqual([null, 'step', null]);
  expect(screen.getByRole('button', { name: '建立專案' })).toBeTruthy();
});

test('EmptyState: without steps there is no list', () => {
  render(<EmptyState title="沒有結果" />);
  expect(screen.queryByRole('list')).toBeNull();
});

afterEach(() => page.viewport(1280, 800));

test('EmptyState on a phone: a description that wraps is left-aligned; a short one stays centred', async () => {
  await page.viewport(390, 844);
  render(
    <>
      <EmptyState title="還沒有專案" description="建立第一個專案之後，這裡會列出所有專案的進度、負責人與最近的更新，也可以從這裡匯入既有的資料。" />
      <EmptyState title="沒有通知" description="目前沒有新通知" />
    </>,
  );
  const [long, short] = [...document.querySelectorAll<HTMLElement>('.ui-empty-desc')];
  expect(getComputedStyle(long).textAlign).toBe('start');
  const box = long.getBoundingClientRect();
  expect(box.height).toBeGreaterThan(30);
  const r = short.getBoundingClientRect();
  const parent = (short.parentElement as HTMLElement).getBoundingClientRect();
  expect(Math.abs(r.left - parent.left - (parent.right - r.right))).toBeLessThanOrEqual(1);
});
