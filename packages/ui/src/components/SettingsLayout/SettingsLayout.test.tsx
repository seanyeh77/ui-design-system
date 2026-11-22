import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SettingsLayout, SettingsSection } from '../../index';

const cats = [
  {
    id: 'general',
    label: '一般',
    content: (
      <SettingsSection title="外觀" description="主題和強調色。">
        <p>一般內容</p>
      </SettingsSection>
    ),
  },
  { id: 'members', label: '成員', content: <p>成員內容</p> },
];

test('SettingsLayout: categories in a named nav; the open one is aria-current, and a click switches the content', async () => {
  const onChange = vi.fn();
  render(<SettingsLayout title="設定" categories={cats} onChange={onChange} />);
  expect(screen.getByRole('heading', { level: 1, name: '設定' })).toBeTruthy();
  const nav = screen.getByRole('navigation', { name: '設定分類' });
  expect(nav).toBeTruthy();
  expect(screen.getByRole('button', { name: '一般' }).getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('heading', { level: 2, name: '外觀' })).toBeTruthy();
  await userEvent.setup().click(screen.getByRole('button', { name: '成員' }));
  expect(onChange).toHaveBeenCalledWith('members');
  expect(screen.getByText('成員內容')).toBeTruthy();
  expect(screen.queryByText('一般內容')).toBeNull();
  expect(screen.getByRole('button', { name: '成員' }).getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('button', { name: '一般' }).getAttribute('aria-current')).toBeNull();
});

test('SettingsLayout: value controls the open category; an unknown id shows the first', () => {
  const { rerender } = render(<SettingsLayout categories={cats} value="members" />);
  expect(screen.getByText('成員內容')).toBeTruthy();
  rerender(<SettingsLayout categories={cats} value="gone" />);
  expect(screen.getByText('一般內容')).toBeTruthy();
});
