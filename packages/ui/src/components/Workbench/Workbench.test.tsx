import * as React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IconButton, TreeList, Workbench, useWorkbench, type WorkbenchHandle, type WorkbenchLayout, type WorkbenchView } from '../../index';

const user = userEvent.setup();
const views: WorkbenchView[] = [
  { id: 'outline', title: '大綱', render: () => <p>大綱內容</p> },
  { id: 'refs', title: '參考', render: () => <p>參考內容</p> },
  { id: 'problems', title: '問題', render: () => <p>問題內容</p>, attention: true },
  { id: 'output', title: '輸出', render: () => <p>輸出內容</p> },
];

function Reset() {
  const wb = useWorkbench();
  return <IconButton variant="quiet" icon="arrow-u-up-left" label="還原預設版面" onClick={wb.resetLayout} />;
}
function Picker() {
  const wb = useWorkbench();
  return (
    <button type="button" onClick={wb.explorerPicked}>
      controller.py
    </button>
  );
}

const shell = (width: number, height = 640) => (
  <div style={{ width, height }}>
    <Workbench
      id="test"
      brand={{ name: 'codemap', href: '#' }}
      crumbs={[{ label: 'harness' }, { label: 'controller.py' }]}
      actions={<Reset />}
      explorer={<Picker />}
      explorerFoot={<button type="button">設定</button>}
      views={views}
      defaultLayout={{ side: ['outline', 'refs'], panel: ['problems', 'output'] }}
    >
      <p>主畫面</p>
    </Workbench>
  </div>
);
const region = (name: string) => document.querySelector<HTMLElement>(`.ui-wb [aria-label="${name}"]:is(aside, section)`) as HTMLElement;
const isOpen = (name: string) => region(name).classList.contains('is-open');

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

test('wide: all regions open; the top-bar buttons, Ctrl B, Ctrl J and Ctrl Alt B close and open them', async () => {
  render(shell(1440));
  await waitFor(() => expect(isOpen('右側欄')).toBe(true));
  expect(isOpen('檔案總管')).toBe(true);
  expect(isOpen('下方面板')).toBe(true);
  const exBtn = screen.getByRole('button', { name: /^檔案總管/ });
  expect(exBtn.getAttribute('aria-pressed')).toBe('true');
  await user.click(exBtn);
  expect(isOpen('檔案總管')).toBe(false);
  expect(exBtn.getAttribute('aria-pressed')).toBe('false');
  await user.keyboard('{Control>}b{/Control}');
  expect(isOpen('檔案總管')).toBe(true);
  await user.keyboard('{Control>}j{/Control}');
  expect(isOpen('下方面板')).toBe(false);
  await user.keyboard('{Control>}{Alt>}b{/Alt}{/Control}');
  expect(isOpen('右側欄')).toBe(false);
  // The panel's view has something new: a dot on its button while the panel is closed.
  expect(screen.getByRole('button', { name: /^下方面板/ }).parentElement?.querySelector('.ui-wb-dot')).not.toBeNull();
  // Stored, and restored on the next visit.
  expect(JSON.parse(localStorage.getItem('ui-workbench:test') ?? '{}').open).toEqual({ explorer: true, side: false, panel: false });
});

test('splitters: role separator with value and limits, 16 px per arrow, double-click resets', async () => {
  render(shell(1440));
  const sep = await screen.findByRole('separator', { name: '檔案總管寬度' });
  expect(sep.getAttribute('aria-valuenow')).toBe('260');
  expect(sep.getAttribute('aria-valuemin')).toBe('180');
  expect(sep.getAttribute('aria-valuemax')).toBe('480');
  sep.focus();
  await user.keyboard('{ArrowRight}{ArrowRight}');
  expect(sep.getAttribute('aria-valuenow')).toBe('292');
  expect(region('檔案總管').getBoundingClientRect().width).toBe(292);
  await user.keyboard('{Home}');
  expect(sep.getAttribute('aria-valuenow')).toBe('180');
  fireEvent.doubleClick(sep);
  expect(sep.getAttribute('aria-valuenow')).toBe('260');
  // The side bar grows to the left.
  const side = screen.getByRole('separator', { name: '右側欄寬度' });
  side.focus();
  await user.keyboard('{ArrowLeft}');
  expect(side.getAttribute('aria-valuenow')).toBe('336');
});

test('a view moves to the other region with the tab-row button, and 「還原預設版面」 puts it back', async () => {
  render(shell(1440));
  const side = region('右側欄');
  await user.click(within(side).getByRole('button', { name: '把目前分頁移到下方面板' }));
  const panelTabs = within(region('下方面板'))
    .getAllByRole('tab')
    .map((t) => t.textContent);
  expect(panelTabs).toEqual(['問題', '輸出', '大綱']);
  expect(within(region('下方面板')).getByRole('tab', { selected: true }).textContent).toBe('大綱');
  expect(
    within(side)
      .getAllByRole('tab')
      .map((t) => t.textContent),
  ).toEqual(['參考']);
  await user.click(screen.getByRole('button', { name: '還原預設版面' }));
  expect(
    within(region('右側欄'))
      .getAllByRole('tab')
      .map((t) => t.textContent),
  ).toEqual(['大綱', '參考']);
});

test('below 960 px the explorer and side bar lie over the main view, closed until asked; picking in the explorer closes it', async () => {
  render(shell(900));
  await waitFor(() => expect(region('檔案總管').classList.contains('is-drawer')).toBe(true));
  expect(isOpen('檔案總管')).toBe(false);
  expect(isOpen('右側欄')).toBe(false);
  await user.click(screen.getByRole('button', { name: /^檔案總管/ }));
  expect(isOpen('檔案總管')).toBe(true);
  await user.click(screen.getByRole('button', { name: 'controller.py' }));
  expect(isOpen('檔案總管')).toBe(false);
  // The stored layout keeps the wide screen's choices.
  expect(JSON.parse(localStorage.getItem('ui-workbench:test') ?? '{}').open.explorer).toBe(true);
});

test('phone: no product name; the whole path on the bar above the main view; side bar and panel views in one panel under the main view', async () => {
  render(shell(390, 720));
  await waitFor(() => expect(getComputedStyle(screen.getByText('codemap')).display).toBe('none'));
  const crumbs = screen.getByRole('navigation', { name: '路徑' });
  expect(within(crumbs).getByText('harness')).toBeTruthy();
  expect(crumbs.closest('.ui-wb-mainbar')).not.toBeNull();
  await user.click(screen.getByRole('button', { name: /^下方面板/ }));
  const sheet = screen.getByRole('region', { name: '面板分頁' });
  await waitFor(() => expect(sheet.classList.contains('is-open')).toBe(true));
  const tabs = within(sheet)
    .getAllByRole('tab')
    .map((t) => t.textContent);
  expect(tabs).toEqual(['大綱', '參考', '問題', '輸出']);
  expect(within(sheet).getByRole('tab', { selected: true }).textContent).toBe('問題');
  expect(screen.getByText('問題內容')).toBeTruthy();
  // The main view stays above it, not covered.
  const main = screen.getByRole('main');
  expect(main.getBoundingClientRect().bottom).toBeLessThanOrEqual(sheet.getBoundingClientRect().top + 1);
  await user.click(within(sheet).getByRole('button', { name: '目前分頁往左移' }));
  expect(
    within(sheet)
      .getAllByRole('tab')
      .map((t) => t.textContent),
  ).toEqual(['大綱', '問題', '參考', '輸出']);
});

test('TreeList density="compact": 28 px rows; a mark is a dot read after the name', async () => {
  render(
    <TreeList
      kind="plain"
      density="compact"
      label="檔案"
      bare
      items={[
        { id: 'a', name: 'controller.py', icon: 'file', mark: { label: '有值得注意的地方' } },
        { id: 'b', name: 'topology.py', icon: 'file' },
      ]}
    />,
  );
  const rows = screen.getAllByRole('treeitem');
  expect(rows[0].getBoundingClientRect().height).toBe(28);
  expect(rows[0].getAttribute('aria-label')).toBe('controller.py，有值得注意的地方');
  expect(rows[0].querySelector('.ui-tree-mark')).not.toBeNull();
  expect(rows[1].querySelector('.ui-tree-mark')).toBeNull();
});

test('IconButton variant="quiet": 32 px without a border', () => {
  render(<IconButton variant="quiet" icon="magnifying-glass" label="搜尋" />);
  const b = screen.getByRole('button', { name: '搜尋' });
  const cs = getComputedStyle(b);
  expect(b.getBoundingClientRect().width).toBe(32);
  expect(cs.borderTopWidth).toBe('0px');
});

function ShowInside() {
  const wb = useWorkbench();
  return (
    <button type="button" onClick={() => wb.show('output')}>
      到輸出看細節（目前：{wb.layout.active.panel}）
    </button>
  );
}

test('show(id) from inside and through ref: the view becomes its region’s tab and the region opens, without moving', async () => {
  const ref = React.createRef<WorkbenchHandle>();
  const seen: WorkbenchLayout[] = [];
  render(
    <div style={{ width: 1440, height: 640 }}>
      <Workbench
        id="show"
        ref={ref}
        views={views}
        defaultLayout={{ side: ['outline', 'refs'], panel: ['problems', 'output'], open: { panel: false, side: false } }}
        actions={<ShowInside />}
        onLayoutChange={(l) => seen.push(l)}
      >
        <p>主畫面</p>
      </Workbench>
    </div>,
  );
  await waitFor(() => expect(seen.length).toBeGreaterThan(0));
  expect(seen[0].active.panel).toBe('problems');
  expect(isOpen('下方面板')).toBe(false);
  await user.click(screen.getByRole('button', { name: /到輸出看細節/ }));
  expect(isOpen('下方面板')).toBe(true);
  expect(within(region('下方面板')).getByRole('tab', { selected: true }).textContent).toBe('輸出');
  expect(screen.getByRole('button', { name: /到輸出看細節/ }).textContent).toContain('output');
  expect(seen[seen.length - 1].active.panel).toBe('output');
  // From outside, through the handle.
  React.act(() => ref.current?.show('refs'));
  expect(isOpen('右側欄')).toBe(true);
  expect(within(region('右側欄')).getByRole('tab', { selected: true }).textContent).toBe('參考');
  expect(ref.current?.getLayout().active.side).toBe('refs');
  expect(ref.current?.getLayout().side).toEqual(['outline', 'refs']);
});

test('show(id) on a narrow screen lays the side bar over the main view; on a phone it opens the merged panel', async () => {
  const ref = React.createRef<WorkbenchHandle>();
  const { rerender } = render(
    <div style={{ width: 1000, height: 640 }}>
      <Workbench id="show2" ref={ref} views={views} defaultLayout={{ side: ['outline', 'refs'], panel: ['problems', 'output'] }} />
    </div>,
  );
  await waitFor(() => expect(region('右側欄').classList.contains('is-drawer')).toBe(true));
  React.act(() => ref.current?.show('refs'));
  expect(isOpen('右側欄')).toBe(true);
  // The wide screen's stored choice is untouched.
  expect(ref.current?.getLayout().open.side).toBe(true);
  rerender(
    <div style={{ width: 390, height: 720 }}>
      <Workbench id="show2" ref={ref} views={views} defaultLayout={{ side: ['outline', 'refs'], panel: ['problems', 'output'] }} />
    </div>,
  );
  await waitFor(() => expect(ref.current?.phone).toBe(true));
  React.act(() => ref.current?.show('output'));
  const sheet = screen.getByRole('region', { name: '面板分頁' });
  await waitFor(() => expect(sheet.classList.contains('is-open')).toBe(true));
  expect(within(sheet).getByRole('tab', { selected: true }).textContent).toBe('輸出');
});

test('show() with an unknown id does nothing and warns in development', async () => {
  const ref = React.createRef<WorkbenchHandle>();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(
    <div style={{ width: 1440, height: 640 }}>
      <Workbench id="show3" ref={ref} views={views} />
    </div>,
  );
  React.act(() => ref.current?.show('nope'));
  expect(warn.mock.calls.some((c) => String(c[0]).includes("show('nope')"))).toBe(true);
  warn.mockRestore();
});

function OpenOnMount({ width, view }: { width: number; view: string }) {
  const ref = React.useRef<WorkbenchHandle>(null);
  React.useEffect(() => {
    ref.current?.show(view);
  }, [view]);
  return (
    <div style={{ width, height: 720 }}>
      <Workbench id={'mount-' + width} ref={ref} views={views} defaultLayout={{ side: ['outline', 'refs'], panel: ['problems', 'output'] }} />
    </div>
  );
}

test('show() while mounting on a phone: the panel stays open after the first measurement', async () => {
  render(<OpenOnMount width={390} view="output" />);
  const sheet = screen.getByRole('region', { name: '面板分頁', hidden: true });
  await new Promise((r) => setTimeout(r, 300));
  expect(sheet.classList.contains('is-open')).toBe(true);
  expect(within(sheet).getByRole('tab', { selected: true }).textContent).toBe('輸出');
});

test('show() while mounting on a narrow screen: the side bar stays laid over the main view', async () => {
  render(<OpenOnMount width={1000} view="refs" />);
  await new Promise((r) => setTimeout(r, 300));
  expect(isOpen('右側欄')).toBe(true);
  expect(region('右側欄').classList.contains('is-drawer')).toBe(true);
});

test('the breadcrumb and mainBar sit on a 36 px bar above the main view, in line with the side bar’s tab row', async () => {
  const seen: string[] = [];
  function Filtered() {
    const [q, setQ] = React.useState('');
    return (
      <div style={{ width: 1440, height: 640 }}>
        <Workbench
          id="bar"
          crumbs={[{ label: 'harness' }, { label: 'controller.py' }]}
          mainBar={<IconButton variant="quiet" icon="arrow-square-out" label="用 VS Code 開啟" />}
          explorerFilter={{
            value: q,
            onChange: (v) => {
              setQ(v);
              seen.push(v);
            },
            label: '篩選檔案與函式',
          }}
          explorer={<p>tree</p>}
          views={views}
          defaultLayout={{ side: ['outline', 'refs'], panel: ['problems', 'output'] }}
        >
          <p>主畫面</p>
        </Workbench>
      </div>
    );
  }
  render(<Filtered />);
  const bar = await waitFor(() => document.querySelector('.ui-wb-mainbar') as HTMLElement);
  const nav = within(bar).getByRole('navigation', { name: '路徑' });
  expect(nav).toBeTruthy();
  expect(within(bar).getByRole('button', { name: '用 VS Code 開啟' })).toBeTruthy();
  expect(document.querySelector('.ui-wb-top .ui-crumb')).toBeNull();
  const tabRow = region('右側欄').querySelector('.ui-wb-tabbar') as HTMLElement;
  const filter = document.querySelector('.ui-wb-exfilter') as HTMLElement;
  expect(bar.getBoundingClientRect().bottom).toBe(tabRow.getBoundingClientRect().bottom);
  expect(filter.getBoundingClientRect().bottom).toBe(tabRow.getBoundingClientRect().bottom);
  expect(screen.getByRole('main').getBoundingClientRect().top).toBe(bar.getBoundingClientRect().bottom);
  await user.type(screen.getByRole('searchbox', { name: '篩選檔案與函式' }), 'sy');
  expect(seen).toEqual(['s', 'sy']);
});
