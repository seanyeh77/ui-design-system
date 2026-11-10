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

test('ProjectSwitcher on a phone: the project name stays whole, the status is the dot; the full text is in title and the name', async () => {
  await page.viewport(390, 844);
  const { container } = render(
    <TopBar title="檢查筆記" searchLabel="搜尋" onSearch={() => {}}>
      <ProjectSwitcher
        project="ibtrace"
        status="live"
        statusLabel="即時"
        options={[{ id: 'a', label: 'ibtrace', detail: 'build' }]}
        value="a"
        onChange={() => {}}
      />
    </TopBar>,
  );
  const chip = container.querySelector<HTMLElement>('.ui-projsw');
  const name = container.querySelector<HTMLElement>('.ui-projsw-name');
  const status = container.querySelector<HTMLElement>('.ui-projsw-status');
  if (!chip || !name || !status) throw new Error('no chip');
  expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
  expect(status.getClientRects()).toHaveLength(0);
  expect(chip.getAttribute('title')).toBe('ibtrace · 即時');
  expect(chip.getAttribute('aria-label')).toContain('ibtrace · 即時');
});

test('ProjectSwitcher short of room on a desktop: the status gives way before the name', async () => {
  await page.viewport(1366, 768);
  const { container } = render(
    <div style={{ width: 150, display: 'flex' }}>
      <ProjectSwitcher project="ibtrace" status="stale" statusLabel="快照 a085bc3 的快照" />
    </div>,
  );
  const name = container.querySelector<HTMLElement>('.ui-projsw-name');
  const status = container.querySelector<HTMLElement>('.ui-projsw-status');
  if (!name || !status) throw new Error('no chip');
  expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
  expect(status.scrollWidth).toBeGreaterThan(status.clientWidth);
});
