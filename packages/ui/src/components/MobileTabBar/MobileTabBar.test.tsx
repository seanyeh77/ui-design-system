import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { page } from 'vitest/browser';
import { MobileTabBar } from '../../index';

test('labels={false}, icons only: each tab is named by its aria-label, no text shows', () => {
  const { container } = render(
    <MobileTabBar
      labels={false}
      value="graph"
      items={[
        { id: 'home', label: '總覽', icon: 'house' },
        { id: 'graph', label: '架構', icon: 'share-network' },
        { id: 'notes', label: '檢查', icon: 'check-square' },
      ]}
    />,
  );
  expect(container.querySelector('.ui-tabbar')?.textContent).toBe('');
  const current = screen.getByRole('button', { name: '架構' });
  expect(current.getAttribute('aria-current')).toBe('page');
  expect(current.getAttribute('aria-label')).toBe('架構');
});

test('by default a label under each icon names the tab; the selected one is bold (MA)', async () => {
  await page.viewport(360, 740);
  const { container } = render(
    <MobileTabBar
      value="graph"
      items={[
        { id: 'arch', label: '架構', icon: 'share-network' },
        { id: 'graph', label: '流程', icon: 'house' },
        { id: 'impact', label: '影響範圍', icon: 'magnifying-glass' },
        { id: 'notes', label: '檢查', icon: 'check-square' },
        { id: 'more', label: '更多', icon: 'dots-three' },
      ]}
    />,
  );
  const tab = screen.getByRole('button', { name: '流程' });
  expect(tab.hasAttribute('aria-label')).toBe(false);
  expect(tab.getAttribute('aria-current')).toBe('page');
  const labels = [...container.querySelectorAll<HTMLElement>('.ui-tabbar-label')];
  expect(labels.map((l) => l.textContent)).toEqual(['架構', '流程', '影響範圍', '檢查', '更多']);
  // 360 px: every label whole on one line, inside its own tab.
  for (const l of labels) {
    expect(l.scrollWidth).toBeLessThanOrEqual(l.clientWidth + 1);
    expect(l.getBoundingClientRect().height).toBeLessThan(20);
  }
  expect(getComputedStyle(labels[1]).fontWeight).toBe('700');
  await page.viewport(1280, 800);
});

test('the selected pill is centred on the icon and clear of the label', async () => {
  await page.viewport(390, 844);
  const { container } = render(
    <MobileTabBar
      value="b"
      items={[
        { id: 'a', label: '總覽', icon: 'house' },
        { id: 'b', label: '專案', icon: 'folder' },
        { id: 'c', label: '設定', icon: 'gear' },
      ]}
    />,
  );
  const pill = (container.querySelector('.ui-tabbar-pill') as HTMLElement).getBoundingClientRect();
  const tab = screen.getByRole('button', { name: '專案' });
  const icon = (tab.querySelector('svg') as SVGElement).getBoundingClientRect();
  const label = (tab.querySelector('.ui-tabbar-label') as HTMLElement).getBoundingClientRect();
  expect(Math.abs(pill.top + pill.height / 2 - (icon.top + icon.height / 2))).toBeLessThanOrEqual(1);
  expect(pill.top).toBeLessThan(icon.top);
  expect(pill.bottom).toBeGreaterThan(icon.bottom);
  expect(pill.bottom).toBeLessThanOrEqual(label.top);
  await page.viewport(1280, 800);
});
