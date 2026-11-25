import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import { ProjectSwitcher, Tag, TopBar } from '../../index';

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
  // The status goes whole: it wraps to the cut-off second line of the one-line box, not 「快照 a0…」.
  const box = container.querySelector<HTMLElement>('.ui-projsw-text');
  expect(status.getBoundingClientRect().top).toBeGreaterThanOrEqual(box?.getBoundingClientRect().bottom ?? 0);
});

test('TopBar on a desktop: short of room the project switcher shrinks before the page title', async () => {
  await page.viewport(1024, 800);
  const { container } = render(
    <div style={{ width: 640 }}>
      <TopBar title="訂單出貨管理總覽" onSearch={() => {}}>
        <ProjectSwitcher project="web-app-production-east" status="live" />
      </TopBar>
    </div>,
  );
  const title = container.querySelector<HTMLElement>('.ui-topbar-title');
  if (!title) throw new Error('no title');
  expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
});

test('tags beside the title are small and muted, not part of the title; a tone keeps its color', () => {
  render(
    <TopBar
      title="營運總覽"
      onSearch={false}
      tags={
        <>
          <Tag icon="info">示範資料</Tag>
          <Tag icon="trend-up" tone="info">
            預測
          </Tag>
        </>
      }
    />,
  );
  const demo = screen.getByText('示範資料').closest('.ui-tag') as HTMLElement;
  const title = screen.getByText('營運總覽');
  const cs = getComputedStyle(demo);
  expect(cs.fontSize).toBe('12px');
  expect(cs.color).not.toBe(getComputedStyle(title).color);
  expect(parseFloat(getComputedStyle(title).fontSize)).toBeGreaterThan(12);
  const forecast = screen.getByText('預測').closest('.ui-tag') as HTMLElement;
  expect(getComputedStyle(forecast).color).not.toBe(cs.color);
});
