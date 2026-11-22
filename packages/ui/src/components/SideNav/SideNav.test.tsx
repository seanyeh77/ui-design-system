import { expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from '@testing-library/react';
import { SearchField, SideNav } from '../../index';

const SECTIONS = [
  {
    items: [
      { id: 'home', label: '首頁', icon: 'house' as const },
      { id: 'runs', label: '執行紀錄', icon: 'list' as const },
    ],
  },
];

test('Focus: every control reached by Tab in a SideNav and a SearchField shows a focus ring', async () => {
  const { container } = render(
    <>
      <SideNav sections={SECTIONS} value="home" onToggle={() => {}} onPin={() => {}} />
      <SearchField value="api" onChange={() => {}} />
      <button type="button" className="ui-link-btn">
        重看導覽
      </button>
    </>,
  );
  const stops = container.querySelectorAll('button, input').length;
  const seen: string[] = [];
  const bare: string[] = [];
  (document.activeElement as HTMLElement | null)?.blur();
  for (let i = 0; i < stops; i++) {
    await userEvent.keyboard('{Tab}');
    const el = document.activeElement as HTMLElement;
    if (!container.contains(el)) break;
    const name = el.getAttribute('aria-label') || el.textContent || el.className;
    seen.push(name);
    const cs = getComputedStyle(el);
    if (cs.boxShadow === 'none' && (cs.outlineStyle === 'none' || cs.outlineWidth === '0px')) bare.push(name);
  }
  expect(seen).toEqual(expect.arrayContaining(['釘選側邊欄', '收合側邊欄', '清除搜尋', '重看導覽']));
  expect(bare).toEqual([]);
});

test('SideNav: the pin and collapse buttons name themselves with a Tooltip on the right, not a native title', async () => {
  const { container } = render(<SideNav sections={SECTIONS} value="home" onToggle={() => {}} onPin={() => {}} />);
  const pin = container.querySelector('.ui-nav-pin') as HTMLElement;
  expect(container.querySelector('.ui-nav-collapse[title]')).toBeNull();
  pin.focus();
  await userEvent.hover(pin);
  await expect.poll(() => document.querySelector('.ui-tooltip')?.textContent).toBe('釘選側邊欄');
  expect(document.querySelector('.ui-tooltip')?.getAttribute('data-side')).toBe('right');
});
