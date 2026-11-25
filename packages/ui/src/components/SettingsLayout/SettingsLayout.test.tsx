import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { page } from 'vitest/browser';
import { SettingsLayout, SettingsRow, SettingsSection, Switch } from '../../index';

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

test('SettingsLayout: the open category goes into the URL hash and comes back from it; the name is announced', async () => {
  history.replaceState(null, '', location.pathname + location.search + '#members');
  const { unmount } = render(<SettingsLayout categories={cats} />);
  expect(screen.getByText('成員內容')).toBeTruthy();
  await userEvent.setup().click(screen.getByRole('button', { name: '一般' }));
  expect(location.hash).toBe('#general');
  await new Promise((r) => setTimeout(r, 200));
  expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('一般');
  unmount();
  history.replaceState(null, '', location.pathname + location.search);
});

test('SettingsRow: clicking the text toggles the Switch, which is described by the sentence', async () => {
  const onChange = vi.fn();
  render(
    <SettingsRow label="每週摘要" description="每週一寄出。">
      <Switch label="每週摘要" checked={false} onChange={onChange} />
    </SettingsRow>,
  );
  await userEvent.setup().click(screen.getByText('每週摘要'));
  expect(onChange).toHaveBeenCalledWith(true);
  const sw = screen.getByRole('switch', { name: '每週摘要' });
  expect(document.getElementById(sw.getAttribute('aria-describedby') ?? '')?.textContent).toBe('每週一寄出。');
});

test('SettingsLayout: on a phone the sections fill the width', async () => {
  await page.viewport(390, 800);
  const { container } = render(<SettingsLayout categories={cats} urlSync={false} />);
  const body = container.querySelector('.ui-settings-body') as HTMLElement;
  const section = container.querySelector('.ui-settings-section') as HTMLElement;
  expect(Math.round(section.getBoundingClientRect().width)).toBe(Math.round(body.getBoundingClientRect().width));
  await page.viewport(1280, 800);
});
