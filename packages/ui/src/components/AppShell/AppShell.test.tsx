import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AppShell } from '../../index';

const user = userEvent.setup();
const nav = [
  {
    items: [
      { id: 'home', label: '總覽', icon: 'house' as const },
      {
        id: 'proj',
        label: '專案',
        icon: 'folder' as const,
        children: [
          { id: 'p1', label: '進行中' },
          { id: 'p2', label: '封存' },
        ],
      },
      { id: 'billing', label: '帳務' },
    ],
  },
];

afterEach(() => page.viewport(1280, 900));

test('phones: 「更多」 opens the full nav, also when the current page sits behind it', async () => {
  await page.viewport(390, 844);
  const onNavigate = vi.fn();
  render(
    <AppShell nav={nav} value="billing" onNavigate={onNavigate}>
      內容
    </AppShell>,
  );
  const more = await screen.findByRole('button', { name: '更多' });
  expect(more.getAttribute('aria-current')).toBe('page');
  await user.click(more);
  const drawer = await screen.findByRole('dialog', { name: '全部頁面' });
  await user.click(within(drawer).getByRole('button', { name: '封存' }));
  expect(onNavigate).toHaveBeenCalledWith('p2');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

test('phones: a tab for a group opens its first page', async () => {
  await page.viewport(390, 844);
  const onNavigate = vi.fn();
  render(
    <AppShell nav={nav} value="home" onNavigate={onNavigate}>
      內容
    </AppShell>,
  );
  await user.click(await screen.findByRole('button', { name: '專案' }));
  expect(onNavigate).toHaveBeenCalledWith('p1');
});

test('AppShell from 600 to 1024 px: no sidebar; the top bar menu opens the navigation in a drawer', async () => {
  await page.viewport(820, 900);
  const onNavigate = vi.fn();
  const { container } = render(
    <AppShell
      nav={[
        {
          items: [
            { id: 'home', label: '總覽', icon: 'house' },
            { id: 'graph', label: '架構', icon: 'share-network' },
          ],
        },
      ]}
      value="graph"
      onNavigate={onNavigate}
      title="src/libibtrace 的呼叫關係"
    >
      <p>內容</p>
    </AppShell>,
  );
  expect(container.querySelector('.ui-sidenav')).toBeNull();
  expect(container.querySelector('.ui-tabbar')).toBeNull();
  await userEvent.setup().click(screen.getByRole('button', { name: '開啟導覽' }));
  const current = await screen.findByRole('button', { name: '架構' });
  expect(current.getAttribute('aria-current')).toBe('page');
  await userEvent.setup().click(screen.getByRole('button', { name: '總覽' }));
  expect(onNavigate).toHaveBeenCalledWith('home');
  await page.viewport(1280, 900);
});

test('AppShell at 1024 px still uses the drawer; above 1024 px the sidebar shows', async () => {
  await page.viewport(1024, 768);
  const { container } = render(
    <AppShell nav={nav} value="home" onNavigate={() => {}} title="總覽">
      <p>內容</p>
    </AppShell>,
  );
  expect(container.querySelector('.ui-sidenav')).toBeNull();
  expect(screen.getByRole('button', { name: '開啟導覽' })).toBeTruthy();
  await page.viewport(1025, 768);
  await waitFor(() => expect(container.querySelector('.ui-sidenav')).not.toBeNull());
  expect(screen.queryByRole('button', { name: '開啟導覽' })).toBeNull();
});

test.each([
  [390, 844],
  [1280, 900],
])('AppShell at %i px: the document never scrolls, also with visually hidden text deep in the content', async (w, h) => {
  await page.viewport(w, h);
  document.body.style.margin = '0';
  render(
    <AppShell nav={nav} value="home" onNavigate={() => {}} title="總覽">
      {Array.from({ length: 40 }, (_, i) => (
        <p key={i}>
          第 {i + 1} 段<span className="ui-visually-hidden">隱藏的說明 {i + 1}</span>
          <span style={{ position: 'absolute' }}>絕對定位</span>
        </p>
      ))}
    </AppShell>,
  );
  await waitFor(() => expect(document.querySelector('.ui-shell-main')).not.toBeNull());
  expect(document.documentElement.scrollHeight).toBe(innerHeight);
  expect(document.documentElement.scrollWidth).toBe(innerWidth);
  document.body.style.margin = '';
});

test('the skip link has no shadow off screen, so nothing darkens the corner; Tab shows it with its shadow', async () => {
  await page.viewport(1440, 900);
  const { container } = render(
    <AppShell nav={nav} value="home" onNavigate={() => {}} brand="ibtrace" title="追蹤報告">
      <p>內容</p>
    </AppShell>,
  );
  const skip = container.querySelector('.ui-skip') as HTMLElement;
  expect(getComputedStyle(skip).boxShadow).toBe('none');
  expect(skip.getBoundingClientRect().bottom).toBeLessThanOrEqual(0);
  await user.tab();
  expect(document.activeElement).toBe(skip);
  await waitFor(() => expect(skip.getBoundingClientRect().top).toBeGreaterThanOrEqual(0));
  expect(getComputedStyle(skip).boxShadow).not.toBe('none');
});

// Desktop sidebar: not pinned by default, a 72 px strip of icons that opens over the content.
const shell = (extra: Record<string, unknown> = {}, onNavigate = vi.fn()) => (
  <AppShell nav={nav} value="home" onNavigate={onNavigate} brand="專案中心" title="總覽" {...extra}>
    <p>內容</p>
  </AppShell>
);
const resetStore = () => {
  localStorage.removeItem('ui-nav-pinned');
  localStorage.removeItem('ui-nav-collapsed');
};
const sideWidth = (c: HTMLElement) => (c.querySelector('.ui-sidenav') as HTMLElement).getBoundingClientRect().width;
const mainLeft = (c: HTMLElement) => (c.querySelector('.ui-shell-body') as HTMLElement).getBoundingClientRect().left;

test('sidebar not pinned by default: a 72 px strip that opens over the content when the pointer rests on it', async () => {
  resetStore();
  await page.viewport(1280, 900);
  const { container } = render(shell());
  const rail = container.querySelector('.ui-shell-rail') as HTMLElement;
  expect(rail).toBeTruthy();
  await waitFor(() => expect(sideWidth(container)).toBe(72));
  expect(mainLeft(container)).toBe(72);
  expect(screen.getByRole('button', { name: '釘選側邊欄' }).getAttribute('aria-pressed')).toBe('false');
  expect(screen.queryByRole('button', { name: '收合側邊欄' })).toBeNull();
  await user.hover(rail);
  await waitFor(() => expect(sideWidth(container)).toBe(240));
  expect(rail.classList.contains('is-open')).toBe(true);
  // over the content: the content does not move
  expect(mainLeft(container)).toBe(72);
  await user.unhover(rail);
  await waitFor(() => expect(sideWidth(container)).toBe(72));
});

test('sidebar not pinned: the keyboard opens it, Esc closes it, and choosing a page closes it', async () => {
  resetStore();
  await page.viewport(1280, 900);
  const onNavigate = vi.fn();
  const { container } = render(shell({}, onNavigate));
  const rail = container.querySelector('.ui-shell-rail') as HTMLElement;
  await user.tab(); // skip link
  await user.tab(); // first nav item
  expect(rail.contains(document.activeElement)).toBe(true);
  await waitFor(() => expect(rail.classList.contains('is-open')).toBe(true));
  const focused = document.activeElement;
  await user.keyboard('{Escape}');
  expect(rail.classList.contains('is-open')).toBe(false);
  expect(document.activeElement).toBe(focused);
  await user.hover(rail);
  await waitFor(() => expect(rail.classList.contains('is-open')).toBe(true));
  await user.click(screen.getByRole('button', { name: '帳務' }));
  expect(onNavigate).toHaveBeenCalledWith('billing');
  expect(rail.classList.contains('is-open')).toBe(false);
});

test('pinning: the sidebar sits beside the content as before, collapses to 72 px, and the choice is kept', async () => {
  resetStore();
  await page.viewport(1280, 900);
  const first = render(shell());
  await user.click(screen.getByRole('button', { name: '釘選側邊欄' }));
  expect(first.container.querySelector('.ui-shell-rail')).toBeNull();
  await waitFor(() => expect(sideWidth(first.container)).toBe(240));
  expect(mainLeft(first.container)).toBe(240);
  expect(screen.getByRole('button', { name: '取消釘選' }).getAttribute('aria-pressed')).toBe('true');
  await user.click(screen.getByRole('button', { name: '收合側邊欄' }));
  await waitFor(() => expect(sideWidth(first.container)).toBe(72));
  first.unmount();
  const again = render(shell());
  expect(again.container.querySelector('.ui-shell-rail')).toBeNull();
  await waitFor(() => expect(sideWidth(again.container)).toBe(72));
  await user.click(screen.getByRole('button', { name: '取消釘選' }));
  expect(again.container.querySelector('.ui-shell-rail')).toBeTruthy();
  expect(localStorage.getItem('ui-nav-pinned')).toBe('0');
  resetStore();
});

test('pinning: someone who chose collapsed before keeps a pinned, collapsed sidebar; defaultPinned starts pinned', async () => {
  resetStore();
  await page.viewport(1280, 900);
  localStorage.setItem('ui-nav-collapsed', '1');
  const a = render(shell());
  expect(a.container.querySelector('.ui-shell-rail')).toBeNull();
  await waitFor(() => expect(sideWidth(a.container)).toBe(72));
  a.unmount();
  resetStore();
  const b = render(shell({ defaultPinned: true }));
  expect(b.container.querySelector('.ui-shell-rail')).toBeNull();
  await waitFor(() => expect(sideWidth(b.container)).toBe(240));
  b.unmount();
  resetStore();
});

test('brand { mark, name, href }: collapsed the mark alone, a link named by the name, in line with the icons; open the name fades in', async () => {
  resetStore();
  await page.viewport(1280, 900);
  const mark = <span className="test-mark" style={{ display: 'block', width: 16, height: 16, background: 'var(--accent)' }} />;
  const { container } = render(shell({ brand: { mark, name: 'codemap', href: '#home' } }));
  const rail = container.querySelector('.ui-shell-rail') as HTMLElement;
  await waitFor(() => expect(sideWidth(container)).toBe(72));
  const link = screen.getByRole('link', { name: 'codemap' });
  const name = container.querySelector('.ui-nav-brand-name') as HTMLElement;
  expect(getComputedStyle(name).opacity).toBe('0');
  const centre = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2;
  };
  const icon = container.querySelector('.ui-nav-item .ui-nav-icon') as Element;
  const markBox = container.querySelector('.test-mark') as Element;
  expect(Math.abs(centre(markBox) - centre(icon))).toBeLessThan(0.5);
  const before = centre(markBox);
  await user.hover(rail);
  await waitFor(() => expect(sideWidth(container)).toBe(240));
  await waitFor(() => expect(getComputedStyle(name).opacity).toBe('1'));
  expect(link.getAttribute('aria-label')).toBeNull();
  expect(link.textContent).toBe('codemap');
  // The mark does not move.
  expect(Math.abs(centre(markBox) - before)).toBeLessThan(0.5);
});

test('brand as text: collapsed its first character in an accent square, named by the whole text', async () => {
  resetStore();
  await page.viewport(1280, 900);
  const { container } = render(shell());
  await waitFor(() => expect(sideWidth(container)).toBe(72));
  expect(container.querySelector('.ui-nav-monogram')?.textContent).toBe('專');
  expect(screen.getByRole('img', { name: '專案中心' })).toBeTruthy();
});
