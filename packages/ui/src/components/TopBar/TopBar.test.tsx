import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from '@testing-library/react';
import { ProjectSwitcher, TopBar } from '../../index';

test('TopBar on a phone: the project name gives way before the page title', async () => {
  await page.viewport(390, 844);
  const { container } = render(
    <TopBar title="Architecture" searchLabel="Search" onSearch={() => {}}>
      <ProjectSwitcher project="ibtrace-like" status="stale" statusLabel="Snapshot" />
    </TopBar>,
  );
  const title = container.querySelector<HTMLElement>('.ui-topbar-title');
  if (!title) throw new Error('no title');
  expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
  const bar = container.querySelector<HTMLElement>('.ui-topbar');
  expect(bar && bar.scrollWidth <= bar.clientWidth).toBe(true);
});

test('TopBar on a desktop: a long title is not capped at 45 % while there is room', async () => {
  await page.viewport(1280, 800);
  const long = '一個很長的頁面標題，用來確認桌機上不會在一半的地方就被截斷';
  const { container } = render(<TopBar title={long} />);
  const title = container.querySelector<HTMLElement>('.ui-topbar-title');
  const bar = container.querySelector<HTMLElement>('.ui-topbar');
  if (!title || !bar) throw new Error('no bar');
  expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
});
