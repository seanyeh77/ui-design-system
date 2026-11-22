import { expect, test } from 'vitest';
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
