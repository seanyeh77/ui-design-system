import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import { AppShell, Badge, PageHeader } from '../../index';

afterEach(async () => {
  await page.viewport(1280, 800);
});

const props = {
  title: '訂單 #1024',
  status: <Badge status="doing">出貨中</Badge>,
  meta: '建立於 2026/11/04（三）',
  primary: { label: '出貨', onClick: () => {} },
  actions: [{ label: '編輯', onClick: () => {} }],
  more: [{ label: '封存', onSelect: () => {} }],
};

test('PageHeader: one h1, the status beside the facts, one primary, outline actions and ⋯', async () => {
  await page.viewport(1280, 800);
  render(<PageHeader {...props} />);
  expect(screen.getByRole('heading', { level: 1, name: '訂單 #1024' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '出貨' }).className).toContain('ui-btn-primary');
  expect(screen.getByRole('button', { name: '編輯' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '更多操作' })).toBeTruthy();
  const meta = document.querySelector('.ui-pagehead-meta') as HTMLElement;
  expect(getComputedStyle(meta.querySelector('.ui-badge') as Element).fontSize).toBe(getComputedStyle(meta).fontSize);
});

test('PageHeader: on a phone the outline actions fold into ⋯; the primary stays', async () => {
  await page.viewport(390, 800);
  render(<PageHeader {...props} />);
  expect(screen.queryByRole('button', { name: '編輯' })).toBeNull();
  expect(screen.getByRole('button', { name: '出貨' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '更多操作' })).toBeTruthy();
});

test('PageHeader: a title next to an AppShell title warns; without a title there is no heading', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(
    <AppShell nav={[{ items: [{ id: 'a', label: '訂單', icon: 'house' }] }]} value="a" onNavigate={() => {}} title="訂單">
      <PageHeader title="訂單 #1024" />
    </AppShell>,
  );
  expect(warn.mock.calls.some((c) => String(c[0]).includes('PageHeader: the page title shows twice'))).toBe(true);
  warn.mockRestore();
  const { container } = render(<PageHeader status={<Badge status="done" />} />);
  expect(container.querySelector('h1')).toBeNull();
});
