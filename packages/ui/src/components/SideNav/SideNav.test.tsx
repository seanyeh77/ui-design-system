import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
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
      <SideNav sections={SECTIONS} value="home" onCollapsedChange={() => {}} onPinnedChange={() => {}} />
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
  const { container } = render(<SideNav sections={SECTIONS} value="home" onCollapsedChange={() => {}} onPinnedChange={() => {}} />);
  const pin = container.querySelector('.ui-nav-pin') as HTMLElement;
  expect(container.querySelector('.ui-nav-collapse[title]')).toBeNull();
  pin.focus();
  await userEvent.hover(pin);
  await expect.poll(() => document.querySelector('.ui-tooltip')?.textContent).toBe('釘選側邊欄');
  expect(document.querySelector('.ui-tooltip')?.getAttribute('data-side')).toBe('right');
});

test('SideNav: the pin and collapse icons sit on the same vertical line as the item icons, open and collapsed', async () => {
  for (const collapsed of [false, true]) {
    const { container, unmount } = render(
      <div style={{ height: 600, display: 'flex' }}>
        <SideNav sections={SECTIONS} value="home" collapsed={collapsed} onCollapsedChange={() => {}} onPinnedChange={() => {}} />
      </div>,
    );
    const centre = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    };
    const item = centre(container.querySelector('.ui-nav-icon') as Element);
    // Open, they sit side by side: the first lines up; collapsed, they stack and both line up.
    const icons = Array.from(container.querySelectorAll('.ui-nav-collapse .ui-icon'));
    for (const icon of collapsed ? icons : icons.slice(0, 1)) {
      expect(Math.abs(centre(icon) - item)).toBeLessThan(0.6);
      expect(icon.getBoundingClientRect().width).toBe(22);
    }
    unmount();
  }
});

test('SideNav: onCollapsedChange and onPinnedChange get the state to set; the old onToggle and onPin still work and warn', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const onCollapsedChange = vi.fn();
  const onPinnedChange = vi.fn();
  const { unmount } = render(
    <SideNav sections={SECTIONS} value="home" collapsed pinned onCollapsedChange={onCollapsedChange} onPinnedChange={onPinnedChange} />,
  );
  screen.getByRole('button', { name: '展開側邊欄' }).click();
  expect(onCollapsedChange).toHaveBeenCalledWith(false);
  screen.getByRole('button', { name: '取消釘選' }).click();
  expect(onPinnedChange).toHaveBeenCalledWith(false);
  unmount();
  const onToggle = vi.fn();
  const onPin = vi.fn();
  render(<SideNav sections={SECTIONS} value="home" onToggle={onToggle} onPin={onPin} />);
  screen.getByRole('button', { name: '收合側邊欄' }).click();
  screen.getByRole('button', { name: '釘選側邊欄' }).click();
  expect(onToggle).toHaveBeenCalledTimes(1);
  expect(onPin).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls.some((c) => String(c[0]).includes('`onToggle` is deprecated'))).toBe(true);
  warn.mockRestore();
});
