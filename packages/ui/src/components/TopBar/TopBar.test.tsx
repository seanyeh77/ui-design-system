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
