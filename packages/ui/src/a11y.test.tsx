import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { page, userEvent as keys } from 'vitest/browser';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as UI from './index';

// Screen reader and keyboard behavior from codemap's third run: focus never falls to <body>, changes are announced,
// and names read as people say them.
const user = userEvent.setup();
const live = () => document.querySelector('[data-ui-announcer]')?.textContent ?? '';
afterEach(async () => {
  await page.viewport(1280, 900);
});

test('announce() reads through one polite live region', async () => {
  UI.announce('顯示 6 筆');
  const region = document.querySelector('[data-ui-announcer]');
  expect(region?.getAttribute('aria-live')).toBe('polite');
  await waitFor(() => expect(live()).toBe('顯示 6 筆'));
});

test('TreeList: short names, children in a group the item owns, expanding is announced', async () => {
  render(
    <UI.TreeList
      kind="plain"
      label="呼叫者"
      items={[
        {
          id: 'spawn',
          name: 'ibmon_spawn',
          meta: '呼叫 3 個函式',
          path: 'src/ibmon/main.c:141',
          children: [
            { id: 'a', name: 'fork' },
            { id: 'b', name: 'execve' },
            { id: 'c', name: 'setenv' },
          ],
        },
      ]}
    />,
  );
  const item = screen.getByRole('treeitem', { name: 'ibmon_spawn，呼叫 3 個函式，src/ibmon/main.c:141' });
  item.focus();
  await user.keyboard('{ArrowRight}');
  await waitFor(() => expect(live()).toBe('已展開，3 個子項目'));
  const group = document.getElementById(item.getAttribute('aria-owns') ?? '');
  expect(group?.getAttribute('role')).toBe('group');
  expect(group?.querySelectorAll('[role="treeitem"]').length).toBe(3);
});

test('TreeList, Tabs, RadioGroup: arrows with Alt, Meta or Ctrl are left to the browser (Alt+← goes back a page)', async () => {
  render(
    <div>
      <UI.TreeList kind="plain" label="呼叫者" items={[{ id: 'spawn', name: 'ibmon_spawn', children: [{ id: 'a', name: 'fork' }] }]} />
      <UI.Tabs
        items={[
          { id: 'a', label: '全部' },
          { id: 'b', label: '錯誤' },
        ]}
        value="a"
        onChange={() => {}}
      />
      <UI.RadioGroup
        label="排序"
        options={[
          { value: 'a', label: '名稱' },
          { value: 'b', label: '大小' },
        ]}
        value="a"
        onChange={() => {}}
      />
    </div>,
  );
  const item = screen.getByRole('treeitem', { name: 'ibmon_spawn' });
  item.focus();
  await user.keyboard('{ArrowRight}');
  await waitFor(() => expect(item.getAttribute('aria-expanded')).toBe('true'));
  for (const mod of ['Alt', 'Meta', 'Control']) {
    const ev = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
      cancelable: true,
      altKey: mod === 'Alt',
      metaKey: mod === 'Meta',
      ctrlKey: mod === 'Control',
    });
    expect(item.dispatchEvent(ev), `${mod}+← on a tree item`).toBe(true);
    expect(item.getAttribute('aria-expanded')).toBe('true');
  }
  const tab = screen.getByRole('tab', { name: '全部' });
  tab.focus();
  const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true, altKey: true });
  expect(tab.dispatchEvent(ev)).toBe(true);
  expect(document.activeElement).toBe(tab);
  const radio = screen.getByRole('radio', { name: '名稱' });
  radio.focus();
  expect(radio.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true, altKey: true }))).toBe(true);
  expect(document.activeElement).toBe(radio);
  // Plain ← still collapses.
  item.focus();
  await user.keyboard('{ArrowLeft}');
  await waitFor(() => expect(item.getAttribute('aria-expanded')).toBe('false'));
});

test('Tour gives focus back to what opened it on 完成 and on 略過', async () => {
  function Demo() {
    const [open, setOpen] = React.useState(false);
    return (
      <div>
        <button type="button" onClick={() => setOpen(true)}>
          重看導覽
        </button>
        <UI.Tour
          open={open}
          onClose={() => setOpen(false)}
          steps={[
            { title: '一', text: '第一步。' },
            { title: '二', text: '第二步。' },
          ]}
        />
      </div>
    );
  }
  render(<Demo />);
  const opener = screen.getByRole('button', { name: '重看導覽' });
  await user.click(opener);
  expect(await screen.findByText('第 1 步，共 2 步')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: '略過' }));
  await waitFor(() => expect(document.activeElement).toBe(opener));
  await user.click(opener);
  await user.click(await screen.findByRole('button', { name: '下一步' }));
  await user.click(await screen.findByRole('button', { name: '完成' }));
  await waitFor(() => expect(document.activeElement).toBe(opener));
});

test('Tour keeps Tab inside its card and gives focus back on Escape', async () => {
  function Demo() {
    const [open, setOpen] = React.useState(false);
    return (
      <div>
        <a href="#main">跳到主要內容</a>
        <button type="button" onClick={() => setOpen(true)}>
          重看導覽
        </button>
        <UI.Tour
          open={open}
          onClose={() => setOpen(false)}
          steps={[
            { title: '一', text: '第一步。' },
            { title: '二', text: '第二步。' },
            { title: '三', text: '第三步。' },
          ]}
        />
      </div>
    );
  }
  render(<Demo />);
  const opener = screen.getByRole('button', { name: '重看導覽' });
  await user.click(opener);
  await user.click(await screen.findByRole('button', { name: '下一步' }));
  const card = document.querySelector('.ui-tour-card');
  if (!card) throw new Error('no card');
  await waitFor(() => expect(document.activeElement?.textContent).toBe('下一步'));
  // Real Tab presses, both ways, more than once around: always on a named control in the card.
  const seen: string[] = [];
  for (const back of [false, false, false, false, true, true, true, true]) {
    await keys.keyboard(back ? '{Shift>}{Tab}{/Shift}' : '{Tab}');
    const at = document.activeElement as HTMLElement | null;
    expect(card.contains(at), `focus on ${at?.tagName} ${at?.textContent}`).toBe(true);
    expect(at?.textContent?.trim() || at?.getAttribute('aria-label')).toBeTruthy();
    seen.push(at?.textContent ?? '');
  }
  expect(new Set(seen)).toEqual(new Set(['略過', '上一步', '下一步']));
  await keys.keyboard('{Escape}');
  await waitFor(() => expect(document.querySelector('.ui-tour-card')).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(opener));
});

test('CommandPalette: Escape gives focus back; a result that changes page moves focus to the new page title', async () => {
  function Demo() {
    const [open, setOpen] = React.useState(false);
    const [pageName, setPageName] = React.useState('首頁');
    return (
      <div>
        <main>
          <h1>{pageName}</h1>
          {pageName === '首頁' ? (
            <button type="button" onClick={() => setOpen(true)}>
              搜尋
            </button>
          ) : null}
        </main>
        <UI.CommandPalette
          open={open}
          onOpenChange={setOpen}
          items={[
            { label: 'IBTRACE_SHM', kind: '環境變數' },
            { label: 'ibmon_spawn', kind: '函式' },
          ]}
          onSelect={(it) => setPageName(it.label)}
        />
      </div>
    );
  }
  render(<Demo />);
  const opener = screen.getByRole('button', { name: '搜尋' });
  await user.click(opener);
  await screen.findByRole('combobox');
  await user.keyboard('{Escape}');
  await waitFor(() => expect(document.activeElement).toBe(opener));
  await user.click(opener);
  await user.type(await screen.findByRole('combobox'), 'IBT');
  await waitFor(() => expect(live()).toBe('找到 1 筆結果'));
  await user.keyboard('{Enter}');
  // The opener is gone with the old page: focus goes to the new page's heading.
  await waitFor(() => expect(document.activeElement?.textContent).toBe('IBTRACE_SHM'));
  expect(document.activeElement?.tagName).toBe('H1');
});

test('CommandPalette: a slow closing animation still ends with focus on the new page title', async () => {
  // A slow machine (CI) closes the palette after the first look for focus: focus falls to the page later, when the
  // popup is removed. Made slow on purpose here.
  const slow = document.createElement('style');
  slow.textContent = '.ui-pal { transition: opacity 400ms !important; opacity: 1; } .ui-pal[data-ending-style] { opacity: 0 !important; }';
  document.head.append(slow);
  function Demo() {
    const [open, setOpen] = React.useState(false);
    const [pageName, setPageName] = React.useState('首頁');
    return (
      <div>
        <main>
          <h1>{pageName}</h1>
          {pageName === '首頁' ? (
            <button type="button" onClick={() => setOpen(true)}>
              搜尋
            </button>
          ) : null}
        </main>
        <UI.CommandPalette open={open} onOpenChange={setOpen} items={[{ label: 'IBTRACE_SHM' }]} onSelect={(it) => setPageName(it.label)} />
      </div>
    );
  }
  try {
    render(<Demo />);
    await user.click(screen.getByRole('button', { name: '搜尋' }));
    await user.type(await screen.findByRole('combobox'), 'IBT');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(document.querySelector('.ui-pal')).toBeNull(), { timeout: 2000 });
    await waitFor(() => expect(document.activeElement?.tagName).toBe('H1'));
  } finally {
    slow.remove();
  }
});

test('CommandPalette: 「找不到…」 is announced through the live region', async () => {
  render(<UI.CommandPalette open onOpenChange={() => {}} items={[{ label: 'IBTRACE_SHM' }]} />);
  await user.type(await screen.findByRole('combobox'), 'zzz');
  await waitFor(() => expect(live()).toBe('找不到符合「zzz」的結果'));
});

test('Tabs keep focus on the tab after switching, and read 「全部 26 個」 with a space', async () => {
  function Demo() {
    const [v, setV] = React.useState('all');
    return (
      <UI.Tabs
        value={v}
        onChange={setV}
        unit="個"
        items={[
          { id: 'all', label: '全部', count: 26 },
          { id: 'err', label: '錯誤', count: 4 },
        ]}
      />
    );
  }
  render(<Demo />);
  const all = screen.getByRole('tab', { name: '全部 26 個' });
  await user.click(all);
  await user.keyboard('{ArrowRight}');
  const err = screen.getByRole('tab', { name: '錯誤 4 個' });
  expect(document.activeElement).toBe(err);
  expect(err.getAttribute('aria-selected')).toBe('true');
  await waitFor(() => expect(live()).toBe('錯誤 4 個'));
});

test('ActionBar: a pressed button that turns disabled or goes away hands focus to its neighbour', async () => {
  function Demo() {
    const [saved, setSaved] = React.useState(false);
    const [shown, setShown] = React.useState(true);
    return (
      <UI.ActionBar
        actions={[
          { label: '儲存', primary: true, disabled: saved, onClick: () => setSaved(true) },
          ...(shown ? [{ label: '重新整理', onClick: () => setShown(false) }] : []),
          { label: '匯出', onClick: () => {} },
        ]}
      />
    );
  }
  render(<Demo />);
  const save = screen.getAllByRole('button', { name: '儲存' })[0];
  await user.click(save);
  await waitFor(() => expect(document.activeElement).not.toBe(document.body));
  expect(document.activeElement?.tagName).toBe('BUTTON');
  await user.click(screen.getAllByRole('button', { name: '重新整理' })[0]);
  await waitFor(() => expect(document.activeElement?.textContent).toBe('匯出'));
});

test('AppShell: a skip link first, a main landmark, focusMain(), and aria-current on the page', async () => {
  render(
    <UI.AppShell
      nav={[
        {
          items: [
            { id: 'home', label: '總覽', icon: 'house' },
            { id: 'graph', label: '架構', icon: 'share-network' },
          ],
        },
      ]}
      value="graph"
      onNavigate={() => {}}
      title="架構"
    >
      <p>內容</p>
    </UI.AppShell>,
  );
  const links = document.querySelectorAll('a');
  expect(links[0]?.textContent).toBe('跳到主要內容');
  expect(screen.getByRole('main')).toBeTruthy();
  expect(screen.getByRole('button', { name: '架構' }).getAttribute('aria-current')).toBe('page');
  await user.click(links[0]);
  expect(document.activeElement?.textContent).toBe('架構');
  UI.focusMain();
  expect(document.activeElement?.tagName).toBe('H1');
});

test('AppShell on a phone: the current tab has aria-current', async () => {
  await page.viewport(390, 844);
  render(
    <UI.AppShell
      nav={[
        {
          items: [
            { id: 'home', label: '總覽', icon: 'house' },
            { id: 'graph', label: '架構', icon: 'share-network' },
          ],
        },
      ]}
      value="graph"
      onNavigate={() => {}}
      title="架構"
    >
      <p>內容</p>
    </UI.AppShell>,
  );
  await waitFor(() => expect(document.querySelector('.ui-tabbar [aria-current="page"]')?.getAttribute('aria-label')).toBe('架構'));
});

test('LayerGraph: line buttons sit in a group, not an image, and labels are not read twice', () => {
  const { container } = render(
    <UI.LayerGraph
      nodes={[
        { id: 'a', name: 'src/ibmon', layer: 0, size: 91 },
        { id: 'b', name: 'src/libibtrace', layer: 1, size: 114 },
      ]}
      edges={[{ from: 'a', to: 'b', inferred: true, label: '環境變數 `IBTRACE_SHM`' }]}
      onSelectEdge={() => {}}
    />,
  );
  expect(container.querySelector('.ui-lg-hits')?.getAttribute('role')).toBe('group');
  expect(screen.getByRole('button', { name: 'src/ibmon → src/libibtrace，環境變數 IBTRACE_SHM' })).toBeTruthy();
  expect(container.querySelector('.ui-lg-label')?.getAttribute('aria-hidden')).toBe('true');
});

test('Term reads 「說明 caller」', () => {
  render(
    <p>
      見 <UI.Term text="呼叫這個函式的地方。">caller</UI.Term>。
    </p>,
  );
  expect(screen.getByRole('button', { name: '說明 caller' })).toBeTruthy();
});

test('DataTable announces how many rows a search leaves', async () => {
  render(
    <UI.DataTable
      urlSync={false}
      columns={[{ key: 'name', label: '名稱' }]}
      rows={[
        { id: '1', name: 'alpha' },
        { id: '2', name: 'beta' },
      ]}
    />,
  );
  await user.type(screen.getByRole('searchbox'), 'beta');
  await waitFor(() => expect(live()).toBe('顯示 1 筆'));
});

test('TopBar: a mouse and keyboard see the shortcut, ⌘K on a Mac and Ctrl K elsewhere', () => {
  const { container } = render(<UI.TopBar title="架構" onSearch={() => {}} />);
  const mac = /mac/i.test(navigator.platform);
  expect(container.querySelector('.ui-search kbd')?.textContent).toBe(mac ? '⌘K' : 'Ctrl K');
});

test('format.fraction and fractionLabel: shown with a slash, read without it', () => {
  expect(UI.format.fraction(1, 1, '個')).toBe('1 / 1 個');
  expect(UI.format.fractionLabel(1, 1, '個')).toBe('1 個中的 1 個');
  expect(UI.format.fraction(1280, 3000, '筆')).toBe('1,280 / 3,000 筆');
  expect(UI.format.fractionLabel(1280, 3000, '筆')).toBe('3,000 筆中的 1,280 筆');
  expect(UI.format.fraction(1, 5)).toBe('1 / 5');
  expect(UI.format.fractionLabel(1, 5)).toBe('5 中的 1');
});
