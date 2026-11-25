import { expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Button, Card, DataTable, InlineCode, type DataTableColumn } from '../../index';

const cols = [{ key: 'name' as const, label: '名稱' }];
type User = ReturnType<typeof userEvent.setup>;
/** 「⋯」 then an item of it. */
const moreItem = async (user: User, name: string, scope: HTMLElement | Document = document) => {
  const btn = within(scope instanceof Document ? scope.body : scope).getAllByRole('button', { name: '更多表格操作' })[0];
  await user.click(btn);
  const item = await screen.findByRole('menuitem', { name });
  await user.click(item);
};
/** 「⋯」 → 「欄位」: the column checklist. */
const openColumns = async (user: User) => {
  // From the keyboard: Enter opens 「⋯」 on its first item (欄位), → opens the checklist.
  screen.getAllByRole('button', { name: '更多表格操作' })[0].focus();
  await user.keyboard('{Enter}');
  await screen.findByRole('menuitem', { name: '欄位' });
  await user.keyboard('{ArrowRight}');
  await screen.findByRole('menu', { name: '顯示的欄位' });
};

test('bulk actions only get the ids of rows that still exist', async () => {
  const bulk = vi.fn(() => null);
  const rows = [
    { id: 'a', name: 'alpha' },
    { id: 'b', name: 'beta' },
  ];
  const { rerender } = render(<DataTable columns={cols} rows={rows} selectable bulkActions={bulk} />);
  await userEvent.setup().click(screen.getAllByRole('checkbox', { name: '選取第 1 筆' })[0]);
  expect(bulk).toHaveBeenLastCalledWith(['a'], expect.any(Function));
  bulk.mockClear();
  rerender(<DataTable columns={cols} rows={rows.slice(1)} selectable bulkActions={bulk} />);
  // The deleted row no longer counts: the bulk bar is gone and never gets its id.
  expect(bulk).not.toHaveBeenCalledWith(['a'], expect.any(Function));
  expect(screen.queryByRole('button', { name: '取消選取' })).toBeNull();
});

test('rows hidden by a search are unchecked', async () => {
  const bulk = vi.fn(() => null);
  const rows = [
    { id: 'a', name: 'alpha' },
    { id: 'b', name: 'beta' },
  ];
  render(<DataTable columns={cols} rows={rows} selectable bulkActions={bulk} />);
  const user = userEvent.setup();
  await user.click(screen.getAllByRole('checkbox', { name: '選取第 1 筆' })[0]);
  await user.click(screen.getAllByRole('checkbox', { name: '選取第 2 筆' })[0]);
  expect(bulk).toHaveBeenLastCalledWith(['a', 'b'], expect.any(Function));
  await user.type(screen.getByRole('searchbox'), 'beta');
  expect(bulk).toHaveBeenLastCalledWith(['b'], expect.any(Function));
  await user.clear(screen.getByRole('searchbox'));
  expect(bulk).toHaveBeenLastCalledWith(['b'], expect.any(Function));
});

test('count without summary tabs: 「6 筆」 on one page, 「1 / 6 筆」 after a search, the range with pages; in the table unit', async () => {
  const user = userEvent.setup();
  const rows = Array.from({ length: 6 }, (_, i) => ({ id: String(i), name: 'row ' + i }));
  const { container, rerender } = render(<DataTable columns={cols} rows={rows} urlSync={false} />);
  // Nothing filtered, one page, no summary tabs: 「6 筆」 in the toolbar, no range below.
  const seenText = () =>
    [...container.querySelectorAll('.ui-dt-result .ui-seen')]
      .map((e) => getComputedStyle(e, '::before').content)
      .join('')
      .replace(/"|\s*\/\s*""/g, '');
  expect(seenText()).toBe('6 筆');
  expect(container.querySelector('.ui-dt-result')?.textContent).toBe('6 筆');
  expect(container.querySelector('.ui-dt-foot')).toBeNull();
  await user.type(screen.getByRole('searchbox'), 'row 1');
  // Shown 「1 / 6 筆」, drawn by CSS; the page's text and the screen reader have only 「6 筆中的 1 筆」.
  const seen = [...container.querySelectorAll('.ui-dt-result .ui-seen')].map((e) => getComputedStyle(e, '::before').content);
  expect(seen.join('').replace(/"|\s*\/\s*""/g, '')).toBe('1 / 6 筆');
  expect(container.querySelector('.ui-dt-result')?.textContent).toBe('6 筆中的 1 筆');
  await user.clear(screen.getByRole('searchbox'));
  rerender(<DataTable columns={cols} rows={rows} urlSync={false} pageSize={4} />);
  expect(container.querySelector('.ui-dt-range')?.textContent).toBe('第 1–4 筆，共 6 筆');
  // With pages the range says it: no toolbar count, the count is still in the page for screen readers.
  expect(container.querySelector('.ui-dt-result')).toBeNull();
  expect(container.querySelector(':scope .ui-dt > .ui-visually-hidden')?.textContent).toBe('6 筆');
  rerender(<DataTable columns={cols} rows={rows} urlSync={false} pageSize={4} unit="個" />);
  expect(container.querySelector('.ui-dt-range')?.textContent).toBe('第 1–4 個，共 6 個');
  rerender(<DataTable columns={cols} rows={rows} urlSync={false} pageSize={4} summary={{ key: 'name', items: [], unit: '件' }} />);
  expect(container.querySelector('.ui-dt-range')?.textContent).toBe('第 1–4 件，共 6 件');
});

test('loading: toolbar and header stay, skeleton rows in the columns shape, no empty text and no counts', () => {
  const { container, rerender } = render(
    <DataTable
      columns={[...cols, { key: 'n', label: '數量', numeric: true, unit: '個' }]}
      rows={[]}
      urlSync={false}
      loading
      loadingRows={3}
      summary={{ key: 'name', items: [{ value: 'a', label: 'A' }] }}
    />,
  );
  expect(screen.getByRole('searchbox')).toBeTruthy();
  expect(container.querySelector('.ui-dt-head')).toBeTruthy();
  const skel = container.querySelectorAll('.ui-dt-skelrow');
  expect(skel.length).toBe(3);
  expect(skel[0].querySelectorAll('.ui-skel').length).toBe(2);
  expect(skel[0].getAttribute('aria-hidden')).toBe('true');
  expect(screen.getByRole('table').getAttribute('aria-busy')).toBe('true');
  expect(container.querySelector('.ui-dt-empty')).toBeNull();
  expect(container.querySelector('.ui-tab-count')).toBeNull();
  rerender(<DataTable columns={cols} rows={[{ id: 'a', name: 'alpha' }]} urlSync={false} summary={{ key: 'name', items: [{ value: 'a', label: 'A' }] }} />);
  expect(container.querySelector('.ui-dt-skelrow')).toBeNull();
  expect(screen.getByRole('table').getAttribute('aria-busy')).toBeNull();
});

test('columns and filters written inline: a render with the same columns does not sort and filter again', () => {
  let reads = 0;
  const rows = [
    { id: 'a', name: 'b' },
    { id: 'b', name: 'a' },
  ];
  const Table = ({ tick }: { tick: number }) => (
    <DataTable
      caption={'專案 ' + (tick >= 0 ? '' : tick)}
      columns={[{ key: 'name', label: '名稱', sortValue: (r: { name: string }) => (reads++, r.name) }]}
      filters={[{ key: 'name', label: '名稱' }]}
      rows={rows}
      urlSync={false}
      defaultSort={[{ key: 'name' }]}
    />
  );
  const { rerender } = render(<Table tick={0} />);
  const after = reads;
  expect(after).toBeGreaterThan(0);
  rerender(<Table tick={1} />);
  rerender(<Table tick={2} />);
  expect(reads).toBe(after);
});

test('summary counts carry a unit', () => {
  const rows = [
    { id: 'a', name: 'alpha', status: 'error' },
    { id: 'b', name: 'beta', status: 'ok' },
  ];
  const { container, rerender } = render(
    <DataTable columns={cols} rows={rows} urlSync={false} summary={{ key: 'status', items: [{ value: 'error', label: '錯誤' }] }} />,
  );
  const counts = () => [...container.querySelectorAll('.ui-tab-count')].map((n) => n.textContent);
  expect(counts()).toEqual(['2 筆', '1 筆']);
  rerender(<DataTable columns={cols} rows={rows} urlSync={false} summary={{ key: 'status', unit: '則', items: [{ value: 'error', label: '錯誤' }] }} />);
  expect(counts()).toEqual(['2 則', '1 則']);
});

const LONG = '找不到 child.c，完整路徑應為 src/ibmon/child.c:86，請改成完整路徑後重新執行檢查';

test('a long cell cut off on desktop shows the whole text on focus', async () => {
  await page.viewport(1280, 800);
  const rows = [{ id: 'a', name: 'main.c', text: LONG }];
  const { container } = render(
    <div style={{ width: 520 }}>
      <DataTable columns={[cols[0], { key: 'text', label: '說明', long: true }]} rows={rows} urlSync={false} search={false} />
    </div>,
  );
  const cell = await waitFor(() => {
    const el = container.querySelector<HTMLElement>('.ui-dt-long.is-cut');
    if (!el) throw new Error('not cut');
    return el;
  });
  expect(cell.tabIndex).toBe(0);
  // Keyboard focus, as a person tabbing through the table.
  const user = userEvent.setup();
  // The heading borders, 「複製成 Markdown」 and 「放大表格」 come first now.
  for (let i = 0; i < 16 && document.activeElement !== cell; i++) await user.tab();
  expect(document.activeElement).toBe(cell);
  await waitFor(() => expect(document.querySelector('.ui-tooltip')?.textContent).toBe(LONG));
});

test('a table wider than its box shows a fade and a scroll hint', async () => {
  await page.viewport(1280, 800);
  const wide = (['a', 'b', 'c', 'd', 'e'] as const).map((k) => ({ key: k, label: '欄位 ' + k, width: 160 }));
  const { container } = render(
    <div style={{ width: 530 }}>
      <DataTable columns={wide} rows={[{ id: '1', a: 1, b: 2, c: 3, d: 4, e: 5 }]} urlSync={false} search={false} />
    </div>,
  );
  const outer = container.querySelector<HTMLElement>('.ui-dt-scroller');
  await waitFor(() => expect(outer?.classList.contains('has-more')).toBe(true));
  expect(screen.getByText('向右捲動')).toBeTruthy();
});

test('a table whose minimum widths fit does not scroll, however long a cell is', async () => {
  await page.viewport(1280, 800);
  const rows = [{ id: 'a', name: 'main.c', text: LONG + LONG }];
  const { container } = render(
    <div style={{ width: 960 }}>
      <DataTable columns={[cols[0], { key: 'text', label: '說明', long: true }]} rows={rows} urlSync={false} search={false} />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 50));
  const box = container.querySelector<HTMLElement>('.ui-dt-scroll');
  expect(box && box.scrollWidth <= box.clientWidth + 1).toBe(true);
  expect(container.querySelector('.ui-dt-scroller')?.classList.contains('has-more')).toBe(false);
  expect(screen.queryByText(/左右滑動|向右捲動/)).toBeNull();
});

test('a hidden column starts off, can be turned on in 「欄位」, and is off again after a new resetKey', async () => {
  await page.viewport(1280, 800);
  const columns = [
    { key: 'name' as const, label: '名稱' },
    { key: 'owner' as const, label: '負責人' },
    { key: 'path' as const, label: '路徑', hidden: true },
  ];
  const rows = [{ id: 'a', name: 'alpha', owner: 'Sean', path: 'src/a.c' }];
  const headers = () => [...document.querySelectorAll('[role="columnheader"]')].map((th) => th.textContent?.trim()).filter(Boolean);
  const { rerender } = render(<DataTable columns={columns} rows={rows} urlSync={false} resetKey={1} />);
  expect(headers()).toEqual(['名稱', '負責人']);
  const user = userEvent.setup();
  await openColumns(user);
  const box = await screen.findByRole('menuitemcheckbox', { name: '路徑' });
  expect(box.getAttribute('aria-checked')).toBe('false');
  await user.click(box);
  await waitFor(() => expect(box.getAttribute('aria-checked')).toBe('true'));
  await waitFor(() => expect(headers()).toEqual(['名稱', '負責人', '路徑']));
  // Turning off a column shown by default is reset too.
  await user.click(screen.getByRole('menuitemcheckbox', { name: '負責人' }));
  await waitFor(() => expect(headers()).toEqual(['名稱', '路徑']));
  await user.keyboard('{Escape}{Escape}');
  rerender(<DataTable columns={columns} rows={rows} urlSync={false} resetKey={2} />);
  await waitFor(() => expect(headers()).toEqual(['名稱', '負責人']));
});

test('long columns: the caret on the left opens the row, its long columns in full below it; a new resetKey closes it', async () => {
  await page.viewport(1280, 800);
  const columns = [
    { key: 'fn' as const, label: '函式' },
    { key: 'note' as const, label: '筆記內容', long: true, width: 160 },
    { key: 'desc' as const, label: '說明', long: true, width: 160 },
  ];
  const note = '先 fork 再 execve，子行程繼承 IBTRACE_SHM；父行程等到 ring 建好才回傳，避免子行程搶先寫入。';
  const rows = [{ id: 'a', fn: 'ibmon_spawn', note, desc: '預測和實際呼叫順序一致。' }];
  const { container, rerender } = render(
    <div style={{ width: 600 }}>
      <DataTable columns={columns} rows={rows} urlSync={false} resetKey={1} />
    </div>,
  );
  const caret = screen.getByRole('button', { name: '展開 ibmon_spawn' });
  expect(caret.getAttribute('aria-expanded')).toBe('false');
  await userEvent.setup().click(caret);
  expect(caret.getAttribute('aria-expanded')).toBe('true');
  expect(caret.getAttribute('aria-label')).toBe('收合 ibmon_spawn');
  const detail = document.getElementById(caret.getAttribute('aria-controls') ?? '');
  expect(detail?.getAttribute('role')).toBe('row');
  expect([...(detail?.querySelectorAll('.ui-dt-detail-label') ?? [])].map((e) => e.textContent)).toEqual(['筆記內容', '說明']);
  expect(detail?.querySelector('.ui-dt-detail-text')?.textContent).toBe(note);
  // Whole: as tall as its text needs, nothing cut off.
  const text = detail?.querySelector<HTMLElement>('.ui-dt-detail-text');
  expect(text && text.scrollWidth <= text.clientWidth + 1).toBe(true);
  rerender(
    <div style={{ width: 600 }}>
      <DataTable columns={columns} rows={rows} urlSync={false} resetKey={2} />
    </div>,
  );
  await waitFor(() => expect(container.querySelector('.ui-dt-detail')).toBeNull());
  expect(screen.getByRole('button', { name: '展開 ibmon_spawn' }).getAttribute('aria-expanded')).toBe('false');
  // Phone cards keep 「顯示全部」 and have no caret.
  await page.viewport(390, 844);
  await waitFor(() => expect(container.querySelector('.ui-dt-exp-btn')).toBeNull());
  await page.viewport(1280, 800);
});

test('long text is cut where the column ends, not after a set number of characters', async () => {
  await page.viewport(1280, 800);
  // About 300 px: the old cap of 20 em cut it; the 520 px column fits it.
  const text = '先 fork 再 execve，子行程繼承 IBTRACE_SHM。';
  const { container } = render(
    <div style={{ width: 1000 }}>
      <DataTable
        columns={[
          { key: 'fn', label: '函式', width: 160 },
          { key: 'note', label: '筆記內容', long: true, width: 520 },
        ]}
        rows={[{ id: 'a', fn: 'ibmon_spawn', note: text }]}
        urlSync={false}
        search={false}
      />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 150));
  const long = container.querySelector<HTMLElement>('.ui-dt-long');
  expect(long?.classList.contains('is-cut')).toBe(false);
  expect(long && long.scrollWidth <= long.clientWidth + 1).toBe(true);
});

test('no scroll hint when the table fits, also after a column is hidden', async () => {
  await page.viewport(1280, 800);
  const wide = (['a', 'b', 'c', 'd', 'e'] as const).map((k) => ({ key: k, label: '欄位 ' + k, width: 160 }));
  const rows = [{ id: '1', a: 'x', b: 'x', c: 'x', d: 'x', e: 'x' }];
  const { container, rerender } = render(
    <div style={{ width: 640 }}>
      <DataTable columns={wide} rows={rows} urlSync={false} search={false} />
    </div>,
  );
  await waitFor(() => expect(container.querySelector('.ui-scroll-hint')).not.toBeNull());
  rerender(
    <div style={{ width: 640 }}>
      <DataTable columns={wide.slice(0, 3)} rows={rows} urlSync={false} search={false} />
    </div>,
  );
  await waitFor(() => expect(container.querySelector('.ui-scroll-hint')).toBeNull());
  const scroll = container.querySelector<HTMLElement>('.ui-dt-scroll');
  expect(scroll && scroll.scrollWidth <= scroll.clientWidth + 1).toBe(true);
});

test('the filter panel stays over the table, not over the panel beside it', async () => {
  await page.viewport(1280, 800);
  const { container } = render(
    <div style={{ display: 'flex', gap: 24, width: 1000 }}>
      <div style={{ width: 420 }}>
        <DataTable
          columns={[
            { key: 'fn', label: '函式' },
            { key: 'res', label: '結果' },
          ]}
          rows={[{ id: 'a', fn: 'ibmon_spawn', res: '正確' }]}
          filters={[{ key: 'res', label: '結果' }]}
          urlSync={false}
        />
      </div>
      <h3 style={{ margin: 0 }}>詳細</h3>
    </div>,
  );
  await userEvent.setup().click(screen.getByRole('button', { name: /篩選/ }));
  const pop = await waitFor(() => {
    const el = document.querySelector<HTMLElement>('.ui-dt-filterpop');
    if (!el) throw new Error('no panel');
    return el;
  });
  const table = container.querySelector('.ui-dt')?.getBoundingClientRect();
  await waitFor(() => expect(pop.getBoundingClientRect().right).toBeLessThanOrEqual((table?.right ?? 0) + 0.5));
});

test('long columns: a click anywhere on the row opens and closes it, except on its own controls (EC)', async () => {
  await page.viewport(1280, 800);
  const columns = [
    { key: 'fn' as const, label: '函式', render: (r: { fn: string }) => <a href="#f">{r.fn}</a> },
    { key: 'note' as const, label: '筆記內容', long: true, width: 160 },
  ];
  const rows = [{ id: 'a', fn: 'ibmon_spawn', note: '先 fork 再 execve，子行程繼承 IBTRACE_SHM；父行程等到 ring 建好才回傳。' }];
  const { container } = render(
    <div style={{ width: 600 }}>
      <DataTable columns={columns} rows={rows} urlSync={false} rowActions={() => <button type="button">開啟</button>} />
    </div>,
  );
  const user = userEvent.setup();
  const caret = screen.getByRole('button', { name: '展開 ibmon_spawn' });
  const row = container.querySelector<HTMLElement>('.ui-dt-body .ui-dt-row');
  if (!row) throw new Error('no row');
  expect(getComputedStyle(row).cursor).toBe('pointer');
  const cell = row.querySelector<HTMLElement>('.is-long');
  if (!cell) throw new Error('no long cell');
  await user.click(cell);
  expect(caret.getAttribute('aria-expanded')).toBe('true');
  await user.click(cell);
  expect(caret.getAttribute('aria-expanded')).toBe('false');
  // The link and the row's own buttons do their own job.
  await user.click(screen.getByRole('link', { name: 'ibmon_spawn' }));
  await user.click(screen.getByRole('button', { name: '開啟' }));
  expect(caret.getAttribute('aria-expanded')).toBe('false');
  // The caret still works on its own, once per click.
  await user.click(caret);
  expect(caret.getAttribute('aria-expanded')).toBe('true');
});

test('fullText: a short cell shows its whole text on hover, to screen readers, and in the row details', async () => {
  await page.viewport(1280, 800);
  const rows = [{ id: 'a', file: 'ops.c', path: 'src/libibtrace/hooks/ops.c:58' }];
  const { container } = render(
    <div style={{ width: 600 }}>
      <DataTable
        columns={[
          { key: 'file', label: '位置', fullText: (r) => r.path },
          { key: 'path', label: '路徑' },
        ]}
        rows={rows}
        urlSync={false}
        search={false}
      />
    </div>,
  );
  const full = container.querySelector<HTMLElement>('.ui-dt-full');
  expect(full?.closest('[role="cell"]')?.getAttribute('aria-description')).toBe('src/libibtrace/hooks/ops.c:58');
  await userEvent.setup().hover(full as HTMLElement);
  await waitFor(() => expect(document.querySelector('.ui-tooltip')?.textContent).toBe('src/libibtrace/hooks/ops.c:58'));
  await userEvent.setup().click(screen.getByRole('button', { name: '展開 ops.c' }));
  expect(container.querySelector('.ui-dt-detail-text')?.textContent).toBe('src/libibtrace/hooks/ops.c:58');
});

test('a column grows to fit content that cannot wrap, instead of cutting it', async () => {
  await page.viewport(1280, 800);
  const cols2 = [
    { key: 'name' as const, label: '函式', width: 160 },
    {
      key: 'loc' as const,
      label: '位置',
      width: 120,
      render: (r: { loc: string }) => <InlineCode href="#x">{r.loc}</InlineCode>,
    },
  ];
  const rows = [{ id: 'a', name: 'ucp_worker_progress', loc: 'intercept_ucp_hooks.c:1234' }];
  const { container } = render(
    <div style={{ width: 360 }}>
      <DataTable columns={cols2} rows={rows} urlSync={false} />
    </div>,
  );
  const cell = container.querySelector<HTMLElement>('.ui-dt-body [data-col="loc"]');
  const chip = cell?.querySelector('a');
  if (!cell || !chip) throw new Error('no cell');
  await waitFor(() => expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1));
  expect(chip.getBoundingClientRect().right).toBeLessThanOrEqual(cell.getBoundingClientRect().right);
});

test('fullText: the whole text is the cell description, not a second copy in the cell; a row is named by its first cell', async () => {
  const cols3 = [
    { key: 'fn' as const, label: '函式' },
    { key: 'loc' as const, label: '位置', width: 140, fullText: (r: { full: string }) => r.full },
  ];
  const rows = [{ id: 'a', fn: 'ucp_worker_progress', loc: 'ucp.c:62', full: 'src/libibtrace/hooks/ucp.c:62' }];
  const { container } = render(<DataTable columns={cols3} rows={rows} urlSync={false} />);
  const cell = container.querySelector<HTMLElement>('.ui-dt-body [data-col="loc"]');
  expect(cell?.textContent).toBe('ucp.c:62');
  expect(cell?.getAttribute('aria-description')).toBe('src/libibtrace/hooks/ucp.c:62');
  expect(screen.getByRole('row', { name: 'ucp_worker_progress' })).toBeTruthy();
});

test('a column grows again when a row gets longer content later, without a resetKey', async () => {
  await page.viewport(1280, 800);
  const cols2 = [
    { key: 'name' as const, label: '函式', width: 160 },
    { key: 'loc' as const, label: '位置', width: 120, render: (r: { loc: string }) => <InlineCode href="#x">{r.loc}</InlineCode> },
  ];
  const short = [{ id: 'a', name: 'f', loc: 'a.c:1' }];
  const long = [{ id: 'a', name: 'f', loc: 'src/libibtrace/intercept_ucp_hooks.c:1234' }];
  const { container, rerender } = render(<DataTable columns={cols2} rows={short} urlSync={false} />);
  rerender(<DataTable columns={cols2} rows={long} urlSync={false} />);
  const cell = container.querySelector<HTMLElement>('.ui-dt-body [data-col="loc"]');
  if (!cell) throw new Error('no cell');
  await waitFor(() => expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1));
});

test('summary on a phone: equal tabs while they fit; longer ones keep their text whole and the row scrolls', async () => {
  await page.viewport(390, 844);
  const rows = [{ id: 'a', name: 'x', status: 'fail' }];
  render(
    <DataTable
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
      ]}
      rows={rows}
      urlSync={false}
      summary={{
        key: 'status',
        unit: (n) => (n === 1 ? 'item' : 'items'),
        items: [
          { value: 'fail', label: 'Wrong' },
          { value: 'review', label: 'To review' },
          { value: 'done', label: 'Matches' },
        ],
      }}
    />,
  );
  const tabs = screen.getAllByRole('tab');
  expect(tabs[1].textContent).toBe('Wrong 1 item');
  for (let i = 1; i < tabs.length; i++) expect(tabs[i].getBoundingClientRect().left).toBeGreaterThanOrEqual(tabs[i - 1].getBoundingClientRect().right - 0.5);
  for (const t of tabs) expect(t.scrollWidth).toBeLessThanOrEqual(t.clientWidth + 1);
  await page.viewport(1280, 800);
});

// DataTable lines up with Markdown tables: dragged column widths (remembered under storageKey), 「放大表格」 and
// 「複製成 Markdown」.
type Fn = { id: string; fn: string; rel: string; loc: string };
const fnRows: Fn[] = [
  { id: '1', fn: 'VirtualRouter._sync_as', rel: '呼叫 VirtualRouter._monitor_loop', loc: 'controller.py:540' },
  { id: '2', fn: '_run', rel: '呼叫 subprocess.run', loc: 'controller.py:91' },
  { id: '3', fn: 'Oracle.flow_priority', rel: '被 controller.py 呼叫', loc: 'oracle.py:126' },
];
const fnCols = [
  { key: 'fn' as const, label: '函式', grow: 2 },
  { key: 'rel' as const, label: '關係', searchText: (r: Fn) => r.rel + '（直接）' },
  { key: 'loc' as const, label: '位置', fullText: (r: Fn) => 'harness/' + r.loc, render: (r: Fn) => <InlineCode onClick={() => {}}>{r.loc}</InlineCode> },
];

test('DataTable widths: a heading border drags with ← →; Enter back to width and grow; storageKey remembers', async () => {
  await page.viewport(1280, 900);
  localStorage.removeItem('ui-dt-width:impact');
  const user = userEvent.setup();
  const { unmount } = render(<DataTable columns={fnCols} rows={fnRows} label="受影響的函式" storageKey="impact" urlSync={false} />);
  const head = () => screen.getByRole('columnheader', { name: /關係/ });
  const w0 = head().getBoundingClientRect().width;
  const bar = screen.getByRole('separator', { name: '調整「關係」欄寬' });
  bar.focus();
  await user.keyboard('{ArrowRight}{ArrowRight}');
  expect(Math.abs(head().getBoundingClientRect().width - (w0 + 32))).toBeLessThanOrEqual(1);
  expect(JSON.parse(localStorage.getItem('ui-dt-width:impact') || '{}').rel).toBe(Math.ceil(w0) + 32);
  unmount();
  render(<DataTable columns={fnCols} rows={fnRows} label="受影響的函式" storageKey="impact" urlSync={false} />);
  expect(Math.abs(head().getBoundingClientRect().width - (w0 + 32))).toBeLessThanOrEqual(1);
  // Never narrower than the heading and its sort arrow, nor 48 px.
  screen.getByRole('separator', { name: '調整「關係」欄寬' }).focus();
  for (let i = 0; i < 30; i++) await user.keyboard('{ArrowLeft}');
  const sortBtn = head().querySelector('.ui-dt-sort') as HTMLElement;
  expect(head().getBoundingClientRect().width).toBeGreaterThanOrEqual(Math.max(48, sortBtn.getBoundingClientRect().width + 24 - 1));
  await user.keyboard('{Enter}');
  expect(localStorage.getItem('ui-dt-width:impact')).toBeNull();
  expect(Math.abs(head().getBoundingClientRect().width - w0)).toBeLessThanOrEqual(1);
});

test('DataTable widths: no borders, zoom or copy on phone cards', async () => {
  await page.viewport(390, 800);
  render(<DataTable columns={fnCols} rows={fnRows} label="受影響的函式" urlSync={false} />);
  expect(screen.queryByRole('separator')).toBeNull();
  // Copy, zoom and 「欄位」 live in 「⋯」, which phones do not have.
  expect(screen.queryByRole('button', { name: '更多表格操作' })).toBeNull();
});

test('DataTable zoom: the same table, search and sort in a dialog; a link click closes it', async () => {
  await page.viewport(1280, 900);
  const user = userEvent.setup();
  let opened = '';
  const cols = fnCols.map((c) => (c.key === 'loc' ? { ...c, render: (r: Fn) => <InlineCode onClick={() => (opened = r.loc)}>{r.loc}</InlineCode> } : c));
  render(<DataTable columns={cols} rows={fnRows} label="受影響的函式" urlSync={false} />);
  await moreItem(user, '放大表格');
  const dialog = await screen.findByRole('dialog', { name: '受影響的函式' });
  expect(dialog.getBoundingClientRect().width).toBeGreaterThan(1000);
  const box = dialog.querySelector('input[type="search"]') as HTMLInputElement;
  await user.type(box, 'oracle');
  expect(dialog.querySelectorAll('.ui-dt-body [role="row"]').length).toBe(1);
  await user.click(dialog.querySelector('.ui-code') as HTMLElement);
  expect(opened).toBe('oracle.py:126');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  // The page's table kept the search typed in the dialog.
  expect((document.querySelector('.ui-dt input[type="search"]') as HTMLInputElement).value).toBe('oracle');
});

test('DataTable copy: every kept row (all pages) in the shown columns; fullText, then searchText, then the value; copyText overrides', async () => {
  await page.viewport(1280, 900);
  const user = userEvent.setup();
  const writes: string[] = [];
  const clip = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (t: string) => (writes.push(t), Promise.resolve()) } });
  try {
    const { unmount } = render(<DataTable columns={fnCols} rows={fnRows} label="受影響的函式" pageSize={2} urlSync={false} />);
    await moreItem(user, '複製成 Markdown');
    await waitFor(() => expect(writes.length).toBe(1));
    expect(writes[0]).toBe(
      [
        '| 函式 | 關係 | 位置 |',
        '|---|---|---|',
        '| VirtualRouter._sync_as | 呼叫 VirtualRouter._monitor_loop（直接） | harness/controller.py:540 |',
        '| _run | 呼叫 subprocess.run（直接） | harness/controller.py:91 |',
        '| Oracle.flow_priority | 被 controller.py 呼叫（直接） | harness/oracle.py:126 |',
      ].join('\n'),
    );
    // The menu has closed: 「已複製」 shows under 「⋯」 for 2 s.
    await waitFor(() => expect(document.querySelector('.ui-dt-copied')?.textContent).toBe('已複製'));
    unmount();
    render(
      <DataTable columns={fnCols} rows={fnRows} label="受影響的函式" urlSync={false} copyText={(rs) => rs.map((r) => `[${r.fn}](fn:${r.fn})`).join('\n')} />,
    );
    await moreItem(user, '複製成 Markdown');
    await waitFor(() => expect(writes.length).toBe(2));
    expect(writes[1]).toBe('[VirtualRouter._sync_as](fn:VirtualRouter._sync_as)\n[_run](fn:_run)\n[Oracle.flow_priority](fn:Oracle.flow_priority)');
  } finally {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clip });
  }
});

test('unit: a space between the number and the unit, also in the rendered and copied text', () => {
  const { container } = render(
    <DataTable label="耗時" rows={[{ id: 1, dt: 212.4 }]} columns={[{ key: 'dt', label: 'ΔT', numeric: true, unit: 'ms', decimals: 1 }]} />,
  );
  const cell = container.querySelector('.ui-dt-body .ui-dt-cell.is-num') as HTMLElement;
  expect(cell.innerText).toBe('212.4 ms');
  const num = cell.querySelector('.ui-dt-qty')?.firstChild as Node;
  const range = document.createRange();
  range.selectNodeContents(num);
  const unit = cell.querySelector('.ui-unit') as HTMLElement;
  expect(unit.getBoundingClientRect().left - range.getBoundingClientRect().right).toBeGreaterThan(2);
});

test('code in a cell has a border and a background that differs from the even rows; the caption is the card title size', () => {
  const { container } = render(
    <DataTable
      caption="指令"
      rows={[
        { id: 1, cmd: 'ib_write_bw -a' },
        { id: 2, cmd: 'ib_send_lat -n 1000' },
      ]}
      columns={[{ key: 'cmd', label: '指令', render: (r) => <InlineCode>{r.cmd}</InlineCode> }]}
    />,
  );
  const rows = container.querySelectorAll('.ui-dt-body .ui-dt-row');
  const even = [...rows].find((r) => r.classList.contains('is-even')) as HTMLElement;
  const code = even.querySelector('.ui-code') as HTMLElement;
  expect(getComputedStyle(code).backgroundColor).not.toBe(getComputedStyle(even).backgroundColor);
  expect(getComputedStyle(code).boxShadow).toContain('inset');
  expect(getComputedStyle(container.querySelector('.ui-dt-caption') as HTMLElement).fontSize).toBe('17px');
});

const PROCS = [
  { id: 1, prog: 'ib_write_bw', fn: 'ibv_post_send', dt: 18.1 },
  { id: 2, prog: 'ibv_rc_pingpong', fn: 'ibv_poll_cq', dt: 212.4 },
  { id: 3, prog: 'ib_write_bw', fn: 'ibv_poll_cq', dt: 41.7 },
  { id: 4, prog: 'perftest', fn: 'ibv_reg_mr', dt: 96.5 },
  { id: 5, prog: 'ibv_rc_pingpong', fn: 'ibv_post_recv', dt: 7.9 },
];
const PROC_COLS = [
  { key: 'prog' as const, label: '程式' },
  { key: 'fn' as const, label: '函式' },
  { key: 'dt' as const, label: 'ΔT', numeric: true, unit: 'ms', decimals: 1 },
];
const firstCol = (c: HTMLElement) => [...c.querySelectorAll('.ui-dt-body .ui-dt-row')].map((r) => r.querySelector('.ui-dt-cell')?.textContent);
const dtCol = (c: HTMLElement) => [...c.querySelectorAll('.ui-dt-body .ui-dt-row .ui-dt-cell.is-num')].map((x) => x.textContent);

test('multi-column sort: a click sorts by one column, Shift + click adds the next level; aria-sort stays on the first', async () => {
  history.replaceState(null, '', location.pathname);
  const user = userEvent.setup();
  const { container } = render(<DataTable label="耗時" rows={PROCS} columns={PROC_COLS} />);
  await user.click(screen.getByRole('button', { name: '程式' }));
  expect(firstCol(container)).toEqual(['ib_write_bw', 'ib_write_bw', 'ibv_rc_pingpong', 'ibv_rc_pingpong', 'perftest']);
  await user.keyboard('{Shift>}');
  await user.click(screen.getByRole('button', { name: 'ΔT' }));
  await user.keyboard('{/Shift}');
  // 程式 first, then ΔT from the largest within each program
  expect(dtCol(container)).toEqual(['41.7 ms', '18.1 ms', '212.4 ms', '7.9 ms', '96.5 ms']);
  const heads = [...container.querySelectorAll('.ui-dt-head [role="columnheader"]')];
  expect(heads.map((h) => h.getAttribute('aria-sort'))).toEqual(['ascending', 'none', 'none']);
  expect(screen.getByRole('button', { name: 'ΔT，第 2 排序，由大到小' })).toBeTruthy();
  expect(location.search).toBe('?sort=prog%2C-dt');
  expect(screen.getByRole('button', { name: '排序：程式 由小到大、ΔT 由大到小' }).textContent).toContain('排序：程式 ↑、ΔT ↓');
  // Shift + Enter on a focused heading adds a level from the keyboard too
  screen.getByRole('button', { name: '函式' }).focus();
  await user.keyboard('{Shift>}{Enter}{/Shift}');
  expect(location.search).toBe('?sort=prog%2C-dt%2Cfn');
  // a plain click goes back to one column
  await user.click(screen.getByRole('button', { name: '函式，第 3 排序，由小到大' }));
  expect(location.search).toBe('?sort=fn');
  history.replaceState(null, '', location.pathname);
});

test('multi-column sort: the 「排序」 panel flips, removes, adds and reorders levels', async () => {
  history.replaceState(null, '', location.pathname);
  const user = userEvent.setup();
  const { container } = render(<DataTable label="耗時" rows={PROCS} columns={PROC_COLS} defaultSort={[{ key: 'prog' }, { key: 'dt' }]} />);
  expect(dtCol(container)).toEqual(['41.7 ms', '18.1 ms', '212.4 ms', '7.9 ms', '96.5 ms']);
  // the default sort is not written into the URL
  expect(location.search).toBe('');
  await user.click(screen.getByRole('button', { name: '排序：程式 由小到大、ΔT 由大到小' }));
  const dialog = await screen.findByRole('dialog', { name: '排序' });
  // flip ΔT
  const dtDir = within(dialog).getByRole('radiogroup', { name: '「ΔT」的方向' });
  await user.click(within(dtDir).getByRole('radio', { name: '↑ 由小到大' }));
  expect(dtCol(container)).toEqual(['18.1 ms', '41.7 ms', '7.9 ms', '212.4 ms', '96.5 ms']);
  // ΔT up to the first level with Alt + ↑ on its handle
  within(dialog).getByRole('button', { name: '「ΔT」第 2 排序' }).focus();
  await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
  expect(dtCol(container)).toEqual(['7.9 ms', '18.1 ms', '41.7 ms', '96.5 ms', '212.4 ms']);
  expect(location.search).toBe('?sort=dt%2Cprog');
  await waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('「ΔT」第 1 排序'));
  // Without dragging: 下移 moves ΔT back down; the focus stays on the moved level (上移 once it is at the bottom).
  await user.click(within(dialog).getByRole('button', { name: '下移「ΔT」' }));
  expect(location.search).toBe('?sort=prog%2Cdt');
  await waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('上移「ΔT」'));
  await user.click(within(dialog).getByRole('button', { name: '上移「ΔT」' }));
  expect(location.search).toBe('?sort=dt%2Cprog');
  // The direction radios: one tab stop, arrows pick the other.
  const asc = within(within(dialog).getByRole('radiogroup', { name: '「ΔT」的方向' })).getByRole('radio', { name: '↑ 由小到大' });
  expect(asc.tabIndex).toBe(0);
  asc.focus();
  await user.keyboard('{ArrowRight}');
  expect(location.search).toBe('?sort=-dt%2Cprog');
  await waitFor(() => expect(document.activeElement?.textContent).toBe('↓ 由大到小'));
  // remove both, then add 函式
  await user.click(within(dialog).getByRole('button', { name: '移除「ΔT」排序' }));
  await user.click(within(dialog).getByRole('button', { name: '移除「程式」排序' }));
  expect(within(dialog).getByText('照資料原本的順序。')).toBeTruthy();
  expect(location.search).toBe('?sort=');
  await user.click(within(dialog).getByRole('button', { name: '排序依據…' }));
  const pick = within(dialog).getByRole('group', { name: '依哪一欄排序' });
  await waitFor(() => expect(document.activeElement?.textContent).toBe('程式'));
  await user.click(within(pick).getByRole('button', { name: '函式' }));
  expect(location.search).toBe('?sort=fn');
  history.replaceState(null, '', location.pathname);
});

test('multi-column sort: read from the URL with urlKey; maxSort limits the levels; resetKey goes back to defaultSort', async () => {
  history.replaceState(null, '', location.pathname + '?procs.sort=-dt,nope,prog');
  const user = userEvent.setup();
  const { container, rerender } = render(
    <DataTable label="耗時" urlKey="procs" rows={PROCS} columns={PROC_COLS} maxSort={2} defaultSort={[{ key: 'prog' }]} resetKey="a" />,
  );
  // an unknown key is dropped
  expect(dtCol(container)).toEqual(['212.4 ms', '96.5 ms', '41.7 ms', '18.1 ms', '7.9 ms']);
  expect(screen.getByRole('button', { name: '排序：ΔT 由大到小、程式 由小到大' })).toBeTruthy();
  await user.keyboard('{Shift>}');
  await user.click(screen.getByRole('button', { name: '函式' }));
  await user.keyboard('{/Shift}');
  expect(location.search).toBe('?procs.sort=-dt%2Cprog');
  rerender(<DataTable label="耗時" urlKey="procs" rows={PROCS} columns={PROC_COLS} maxSort={2} defaultSort={[{ key: 'prog' }]} resetKey="b" />);
  expect(screen.getByRole('button', { name: '排序：程式 由小到大' })).toBeTruthy();
  await waitFor(() => expect(location.search).toBe(''));
  history.replaceState(null, '', location.pathname);
});

test('multi-column sort on phones: the button says 「排序」 and the number of levels', async () => {
  history.replaceState(null, '', location.pathname);
  await page.viewport(390, 800);
  render(<DataTable label="耗時" rows={PROCS} columns={PROC_COLS} defaultSort={[{ key: 'prog' }, { key: 'dt' }]} />);
  const btn = screen.getByRole('button', { name: '排序：程式 由小到大、ΔT 由大到小' });
  expect(btn.innerText.replace(/\s/g, '')).toBe('排序2');
  await page.viewport(1280, 900);
});

// The toolbar by the table's own width: one row from 760 px with zoom at its end; narrower, search on a row of its own
// and every button on the next; without a search field the tools share the title row.
const toolbarTable = (extra: Record<string, unknown> = {}) => (
  <DataTable label="耗時" rows={PROCS} columns={PROC_COLS} urlSync={false} defaultSort={[{ key: 'prog' }, { key: 'dt' }]} {...extra} />
);
const leaves = (t: Element) =>
  [...t.querySelectorAll(':scope > .ui-dt-search, :scope > .ui-dt-caption, .ui-dt-actions > *')].filter((e) => e.getBoundingClientRect().width > 0);
const rowsOf = (els: Element[]) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2))).size;

test('toolbar: one row with 「⋯」 at its end when the table is 760 px or wider', async () => {
  await page.viewport(1280, 900);
  const { container } = render(<div style={{ width: 900 }}>{toolbarTable()}</div>);
  const tools = container.querySelector('.ui-dt-tools') as HTMLElement;
  const items = leaves(tools);
  expect(rowsOf(items)).toBe(1);
  expect(items[items.length - 1].getAttribute('aria-label')).toBe('更多表格操作');
  // nothing overflows the row
  expect(tools.scrollWidth).toBeLessThanOrEqual(tools.clientWidth);
});

test('toolbar: under 760 px wide the search field takes the room the buttons leave; they go to the next row, right-aligned, only when both do not fit', async () => {
  await page.viewport(1280, 900);
  for (const w of [700, 520, 480]) {
    const { container, unmount } = render(<div style={{ width: w }}>{toolbarTable()}</div>);
    const tools = container.querySelector('.ui-dt-tools') as HTMLElement;
    const search = tools.querySelector('.ui-dt-search') as HTMLElement;
    const rest = leaves(tools).filter((e) => e !== search);
    // The buttons keep one row, end at the toolbar's right edge, and never overlap the field.
    expect(rowsOf(rest)).toBe(1);
    const last = rest[rest.length - 1].getBoundingClientRect();
    expect(Math.abs(last.right - tools.getBoundingClientRect().right)).toBeLessThan(2);
    const sr = search.getBoundingClientRect();
    const first = rest[0].getBoundingClientRect();
    const sameRow = first.top < sr.bottom;
    if (sameRow) expect(first.left).toBeGreaterThanOrEqual(sr.right);
    else expect(Math.round(sr.width)).toBe(Math.round(tools.getBoundingClientRect().width));
    expect(sr.width).toBeGreaterThanOrEqual(200);
    unmount();
  }
});

test('toolbar on phones: the search field and the buttons share one row, the field takes the room left, nothing overlaps', async () => {
  await page.viewport(390, 800);
  const { container } = render(toolbarTable());
  const tools = container.querySelector('.ui-dt-tools') as HTMLElement;
  const search = tools.querySelector('.ui-dt-search') as HTMLElement;
  const sr = search.getBoundingClientRect();
  expect(sr.width).toBeGreaterThanOrEqual(120);
  const rest = leaves(tools)
    .filter((e) => e !== search)
    .map((e) => e.getBoundingClientRect());
  expect(rest.length).toBeGreaterThanOrEqual(1);
  expect(rest[0].left).toBeGreaterThanOrEqual(sr.right);
  rest.forEach((r) => expect(r.top).toBeLessThan(sr.bottom));
  rest.forEach((r, i) => i && expect(r.left).toBeGreaterThanOrEqual(rest[i - 1].right));
  expect(Math.max(...rest.map((r) => r.right))).toBeLessThanOrEqual(tools.getBoundingClientRect().right + 1);
  await page.viewport(1280, 900);
});

test('toolbar without a search field: the caption and the tools share a row; under a Card title the tools join it', async () => {
  await page.viewport(1280, 900);
  const a = render(<div style={{ width: 900 }}>{toolbarTable({ search: false, caption: '每個程式的耗時' })}</div>);
  const tools = a.container.querySelector('.ui-dt-tools') as HTMLElement;
  expect(tools.firstElementChild?.textContent).toBe('每個程式的耗時');
  expect(rowsOf(leaves(tools))).toBe(1);
  a.unmount();
  const b = render(
    <div style={{ width: 900 }}>
      <Card title="每個程式的耗時" padding={false}>
        {toolbarTable({ search: false })}
      </Card>
    </div>,
  );
  const head = b.container.querySelector('.ui-card-head') as HTMLElement;
  const inHead = head.querySelector('.ui-dt-tools') as HTMLElement;
  expect(inHead).toBeTruthy();
  expect(rowsOf([head.querySelector('.ui-card-title') as Element, ...leaves(inHead)])).toBe(1);
  // the table has no tools row of its own
  expect(b.container.querySelector('.ui-dt > .ui-dt-tools')).toBeNull();
});

test('toolbar beside a panel (about 350 px): search on one row, every button on the next; the sort shows its level count', async () => {
  await page.viewport(1280, 900);
  const { container } = render(<div style={{ width: 350 }}>{toolbarTable({ filters: [{ key: 'prog', label: '程式' }] })}</div>);
  const tools = container.querySelector('.ui-dt-tools') as HTMLElement;
  const search = tools.querySelector('.ui-dt-search') as HTMLElement;
  const rest = leaves(tools).filter((e) => e !== search);
  expect(rowsOf(rest)).toBe(1);
  // icon and count only; the name still says the whole sort
  expect((tools.querySelector('.ui-dt-sortbtn') as HTMLElement).getBoundingClientRect().width).toBeLessThan(80);
  expect(screen.getByRole('button', { name: '排序：程式 由小到大、ΔT 由大到小' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /^篩選/ })).toBeTruthy();
  expect(tools.scrollWidth).toBeLessThanOrEqual(tools.clientWidth);
});

test('height: a paged table has no box of its own to scroll in; the wheel always passes on to the page', async () => {
  await page.viewport(1280, 900);
  const many = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, prog: 'p' + i, fn: 'f' + i, dt: i }));
  const a = render(<DataTable label="分頁" rows={many} columns={PROC_COLS} urlSync={false} />);
  const paged = a.container.querySelector('.ui-dt-scroll') as HTMLElement;
  expect(getComputedStyle(paged).maxHeight).toBe('none');
  expect(getComputedStyle(paged).overscrollBehaviorY).toBe('auto');
  a.unmount();
  const b = render(<DataTable label="不分頁" rows={many} columns={PROC_COLS} pageSize={100} urlSync={false} />);
  const box = b.container.querySelector('.ui-dt-scroll') as HTMLElement;
  expect(getComputedStyle(box).maxHeight).toBe('560px');
  expect(getComputedStyle(box).overscrollBehaviorY).toBe('auto');
});

test('action: the primary button at the right end of the summary row, or of the toolbar without a summary', async () => {
  await page.viewport(1280, 900);
  const rows = [
    { id: 'a', name: 'alpha', status: 'fail' },
    { id: 'b', name: 'beta', status: 'done' },
  ];
  const columns = [
    { key: 'name' as const, label: '名稱' },
    { key: 'status' as const, label: '狀態' },
  ];
  const add = <Button variant="primary">新增</Button>;
  const a = render(
    <div style={{ width: 900 }}>
      <Card padding={false}>
        <DataTable
          label="項目"
          columns={columns}
          rows={rows}
          urlSync={false}
          summary={{ key: 'status', items: [{ value: 'fail', label: '失敗' }] }}
          action={add}
        />
      </Card>
    </div>,
  );
  const top = a.container.querySelector('.ui-dt-tools') as HTMLElement;
  const btn = within(top).getByRole('button', { name: '新增' });
  const tabs = within(top).getByRole('tablist');
  const search = within(top).getByRole('searchbox').closest('.ui-searchfield') as HTMLElement;
  // One toolbar row: the tabs on the left, then the search field and the buttons, 新增 at the right end, all 40 px.
  await waitFor(() => expect(top.classList.contains('is-onerow')).toBe(true));
  const mid = (e: Element) => e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2;
  expect(Math.abs(mid(btn) - mid(tabs))).toBeLessThan(2);
  expect(Math.abs(mid(search) - mid(tabs))).toBeLessThan(2);
  for (const e of [btn, tabs, search]) expect(Math.round(e.getBoundingClientRect().height)).toBe(40);
  expect(Math.round(top.getBoundingClientRect().right - parseFloat(getComputedStyle(top).paddingRight) - btn.getBoundingClientRect().right)).toBe(0);
  expect(a.container.querySelector('.ui-card-head')).toBeNull();
  // The tabs give the counts: no 「2 / 2 筆」 on screen until a search keeps fewer rows.
  expect(a.container.querySelector('.ui-dt-result')).toBeNull();
  // Counts are numbers only on screen; the unit stays for screen readers.
  const count = tabs.querySelector('.ui-tab-count') as HTMLElement;
  expect(count.textContent).toBe('2 筆');
  expect((count.querySelector('.ui-visually-hidden') as HTMLElement).getBoundingClientRect().width).toBeLessThanOrEqual(1);
  a.unmount();
  const b = render(
    <div style={{ width: 900 }}>
      <DataTable label="項目" columns={columns} rows={rows} urlSync={false} action={add} />
    </div>,
  );
  const tools = b.container.querySelector('.ui-dt-tools') as HTMLElement;
  const items = leaves(tools);
  expect(rowsOf(items)).toBe(1);
  expect(items[items.length - 1].textContent).toBe('新增');
  b.unmount();
});

test('row actions take no column: drawn over the row end on hover or keyboard focus, on the row ground', async () => {
  await page.viewport(1280, 900);
  const rows = [
    { id: 'a', name: 'alpha', note: '' },
    { id: 'b', name: 'beta', note: 'x' },
  ];
  const columns = [
    { key: 'name' as const, label: '名稱' },
    { key: 'note' as const, label: '備註' },
  ];
  const { container } = render(
    <div style={{ width: 900 }}>
      <DataTable label="項目" columns={columns} rows={rows} urlSync={false} rowActions={(r) => <button type="button">{`編輯 ${r.name}`}</button>} />
    </div>,
  );
  const head = container.querySelector('.ui-dt-head') as HTMLElement;
  // Two columns, no empty one for the actions.
  expect(head.querySelectorAll('[role="columnheader"]').length).toBe(2);
  const row = container.querySelector('.ui-dt-body .ui-dt-row') as HTMLElement;
  const acts = row.querySelector('.ui-dt-acts') as HTMLElement;
  expect(getComputedStyle(acts).position).toBe('absolute');
  expect(getComputedStyle(acts).opacity).toBe('0');
  // Keyboard focus shows it.
  (within(row).getByRole('button') as HTMLElement).focus();
  await waitFor(() => expect(getComputedStyle(acts).opacity).toBe('1'));
  expect(Math.round(acts.getBoundingClientRect().right)).toBe(Math.round(row.getBoundingClientRect().right));
  // The empty cell's dash is muted.
  const dash = row.querySelector('.ui-dt-none') as HTMLElement;
  expect(dash.textContent).toBe('—');
  expect(getComputedStyle(dash).color).not.toBe(getComputedStyle(row).color);
});

test('long columns: the caret column shows only while a long cell is cut', async () => {
  await page.viewport(1280, 900);
  const columns = [
    { key: 'fn' as const, label: '函式' },
    { key: 'note' as const, label: '筆記內容', long: true },
  ];
  const rows = [{ id: 'a', fn: 'ibmon_spawn', note: '短的筆記。' }];
  const { container, rerender } = render(
    <div style={{ width: 900 }}>
      <DataTable columns={columns} rows={rows} urlSync={false} />
    </div>,
  );
  await waitFor(() => expect(container.querySelector('.ui-dt-exp-btn')).toBeNull());
  rerender(
    <div style={{ width: 900 }}>
      <DataTable
        columns={columns}
        rows={[{ ...rows[0], note: '先 fork 再 execve，子行程繼承 IBTRACE_SHM；父行程等到 ring 建好才回傳。'.repeat(4) }]}
        urlSync={false}
      />
    </div>,
  );
  await waitFor(() => expect(container.querySelector('.ui-dt-exp-btn')).not.toBeNull());
});

test('selectable: the header checkbox is always shown, a row checkbox on hover; the column is 40 px', async () => {
  await page.viewport(1280, 900);
  const { container } = render(
    <div style={{ width: 900 }}>
      <DataTable columns={cols} rows={[{ id: 'a', name: 'alpha' }]} urlSync={false} selectable />
    </div>,
  );
  const headBox = container.querySelector('.ui-dt-head .ui-dt-check') as HTMLElement;
  const rowBox = container.querySelector('.ui-dt-body .ui-dt-check') as HTMLElement;
  expect(getComputedStyle(headBox).opacity).toBe('1');
  expect(getComputedStyle(rowBox).opacity).toBe('0');
  expect(Math.round((container.querySelector('.ui-dt-head .ui-dt-sel') as HTMLElement).getBoundingClientRect().width)).toBe(40);
});

test('toolbar with a summary: too narrow for one row, the tabs get a row of their own above the search field and buttons', async () => {
  await page.viewport(1280, 900);
  const rows = [{ id: 'a', name: 'alpha', status: 'fail' }];
  const items = ['失敗', '審核中', '進行中', '完成', '草稿', '封存'].map((label, i) => ({ value: String(i), label }));
  const { container } = render(
    <div style={{ width: 640 }}>
      <DataTable
        label="項目"
        columns={[{ key: 'name', label: '名稱' }]}
        rows={rows}
        urlSync={false}
        summary={{ key: 'status', items }}
        action={<Button variant="primary">新增</Button>}
      />
    </div>,
  );
  const tools = container.querySelector('.ui-dt-tools') as HTMLElement;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  expect(tools.classList.contains('is-onerow')).toBe(false);
  const tabs = tools.querySelector('[role="tablist"]') as HTMLElement;
  const search = tools.querySelector('.ui-dt-search') as HTMLElement;
  expect(search.getBoundingClientRect().top).toBeGreaterThanOrEqual(tabs.getBoundingClientRect().bottom);
  const btn = within(tools).getByRole('button', { name: '新增' });
  expect(Math.abs(btn.getBoundingClientRect().top - search.getBoundingClientRect().top)).toBeLessThan(2);
});

test('columns: a short text column is at least 128 px, a long column does not take more than its text, and the last cell keeps the row actions clear of its content', async () => {
  await page.viewport(1280, 900);
  const rows = [
    { id: 'a', name: '網站改版', owner: '王小明', note: 'node-3 的代理程式版本太舊，需要更新後重新部署。', at: new Date(2026, 10, 3, 13, 0) },
    { id: 'b', name: '叢集監控', owner: '李小華', note: '已對帳。', at: new Date(2026, 10, 4, 13, 0) },
  ];
  const { container } = render(
    <div style={{ width: 1160 }}>
      <DataTable
        label="項目"
        rows={rows}
        urlSync={false}
        columns={[
          { key: 'name', label: '名稱' },
          { key: 'owner', label: '負責人' },
          { key: 'note', label: '備註', long: true },
          { key: 'at', label: '更新', format: 'dateTime' },
        ]}
        rowActions={(r) => (
          <button type="button" aria-label={`編輯 ${r.name}`} className="ui-iconbtn">
            e
          </button>
        )}
      />
    </div>,
  );
  const w = (k: string) => (container.querySelector(`.ui-dt-head [data-col="${k}"]`) as HTMLElement).getBoundingClientRect().width;
  await waitFor(() => expect(w('owner')).toBeGreaterThanOrEqual(128));
  // The note is shown whole (no caret), and the leftover goes to the main column, not all to the note.
  await waitFor(() => expect(container.querySelector('.ui-dt-exp-btn')).toBeNull());
  expect(w('name')).toBeGreaterThan(200);
  expect(w('note')).toBeLessThan(560);
  // Hovered or not, the date is never cut and the actions sit beside it, not on it.
  const row = container.querySelector('.ui-dt-body .ui-dt-row') as HTMLElement;
  within(row).getByRole('button').focus();
  const time = row.querySelector('time') as HTMLElement;
  const cell = time.closest('[role="cell"]') as HTMLElement;
  expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1);
  // In the table the date and its time stay on one line (the break between them is only for phone cards).
  expect(time.getClientRects()).toHaveLength(1);
  expect(time.getBoundingClientRect().height).toBeLessThan(30);
  const acts = row.querySelector('.ui-dt-acts') as HTMLElement;
  await waitFor(() => expect(getComputedStyle(acts).opacity).toBe('1'));
  expect(acts.getBoundingClientRect().left).toBeGreaterThanOrEqual(time.getBoundingClientRect().right - 1);
});

test('bulk bar: a toolbar above the table while rows are selected; the header row keeps its column headers', async () => {
  await page.viewport(1280, 900);
  const user = userEvent.setup();
  const rows = [
    { id: 'a', name: 'alpha' },
    { id: 'b', name: 'beta' },
  ];
  render(<DataTable label="項目" columns={cols} rows={rows} urlSync={false} selectable bulkActions={() => <Button>刪除</Button>} />);
  await user.click(screen.getByRole('checkbox', { name: '選取第 1 筆' }));
  const bar = screen.getByRole('toolbar', { name: '已選 1 筆' });
  expect(bar.closest('[role="table"]')).toBeNull();
  const table = screen.getByRole('table');
  // the select-all checkbox and 名稱 stay in the header row
  expect(table.querySelectorAll('.ui-dt-head [role="columnheader"]').length).toBe(2);
  expect(within(table).getByRole('checkbox', { name: '全選' }).getAttribute('aria-checked')).toBe('mixed');
  await user.click(within(bar).getByRole('button', { name: '取消選取' }));
  expect(screen.queryByRole('toolbar')).toBeNull();
});

test('toolbar={false}: no search, buttons or count; mono: IDs in Geist Mono, the row link too', () => {
  const rows = [
    { id: 'a', code: 'JOB-0012', name: 'alpha' },
    { id: 'b', code: 'JOB-0013', name: 'beta' },
  ];
  const { container } = render(
    <DataTable
      label="工作"
      toolbar={false}
      columns={[
        { key: 'code', label: 'ID', mono: true },
        { key: 'name', label: '名稱' },
      ]}
      rows={rows}
      rowHref={(r) => '#' + r.id}
      urlSync={false}
    />,
  );
  expect(container.querySelector('.ui-dt-tools')).toBeNull();
  expect(screen.queryByRole('searchbox')).toBeNull();
  const link = screen.getByRole('link', { name: 'JOB-0012' });
  expect(getComputedStyle(link).fontFamily).toMatch(/Geist Mono/);
  expect(getComputedStyle(container.querySelector('[data-col="name"][role="cell"]') as HTMLElement).fontFamily).not.toMatch(/Geist Mono/);
});

test('pages: the current page is quiet (accent text on accent-soft); a disabled arrow keeps 4.5:1', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ id: String(i), name: 'row ' + i }));
  render(<DataTable label="分頁" columns={cols} rows={rows} urlSync={false} />);
  const cur = screen.getByRole('button', { name: '1' });
  expect(getComputedStyle(cur).opacity).toBe('1');
  expect(getComputedStyle(cur).color).not.toBe(getComputedStyle(cur).backgroundColor);
  const prev = screen.getByRole('button', { name: '上一頁' }) as HTMLButtonElement;
  expect(prev.disabled).toBe(true);
  expect(getComputedStyle(prev).opacity).toBe('1');
});

test('phone cards at 320 px with WCAG 1.4.12 text spacing: a date and its time stay inside the card', async () => {
  await page.viewport(320, 800);
  const style = document.createElement('style');
  style.textContent = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }';
  document.head.append(style);
  // Inside a page's 16 px side padding, as in AppShell on a phone.
  const { container, unmount } = render(
    <div style={{ padding: 16 }}>
      <Card padding={false}>
        <DataTable
          label="續約"
          rows={[{ id: 1, name: 'web-frontend', at: '2026-11-18T04:51:00+08:00' }]}
          columns={[
            { key: 'name', label: '名稱' },
            { key: 'at', label: '下次續約', format: 'dateTime' },
          ]}
        />
      </Card>
    </div>,
  );
  const card = container.querySelector('.ui-dt-body .ui-dt-row') as HTMLElement;
  const right = card.getBoundingClientRect().right;
  for (const part of container.querySelectorAll<HTMLElement>('.ui-dt-body .ui-dt-time .ui-dt-nowrap'))
    expect(part.getBoundingClientRect().right).toBeLessThanOrEqual(right + 0.5);
  unmount();
  style.remove();
  await page.viewport(1280, 900);
});

test('loading: columns as wide as when loaded, headings whole, a mono ID column is not the main one, no old count', async () => {
  await page.viewport(1280, 900);
  type R = { id: string; name: string; created: string; renew: string; amount: number };
  const rows: R[] = Array.from({ length: 12 }, (_, i) => ({
    id: 'INV-2026-00' + i,
    name: '客戶 ' + i,
    created: '2026-11-18T04:51:00+08:00',
    renew: '2026-11-25T01:00:00+08:00',
    amount: 1280 * i,
  }));
  const columns: DataTableColumn<R>[] = [
    { key: 'id', label: '編號', mono: true },
    { key: 'name', label: '客戶' },
    { key: 'created', label: '建立時間', format: 'dateTime' },
    { key: 'amount', label: '金額', format: 'money' },
    { key: 'renew', label: '下次續約', format: 'relative' },
  ];
  const widths = (root: HTMLElement) =>
    Object.fromEntries([...root.querySelectorAll<HTMLElement>('.ui-dt-head [data-col]')].map((h) => [h.dataset.col, h.getBoundingClientRect().width]));
  const table = (loading: boolean) => (
    <Card padding={false}>
      <DataTable<R> label="合約" urlSync={false} rows={rows} pageSize={5} loading={loading} columns={columns} rowActions={() => <Button>續約</Button>} />
    </Card>
  );
  const { container, rerender } = render(table(true));
  await new Promise((r) => setTimeout(r, 100));
  const before = widths(container);
  for (const h of container.querySelectorAll<HTMLElement>('.ui-dt-head [data-col] .ui-dt-sort > span'))
    expect(h.scrollWidth).toBeLessThanOrEqual(h.clientWidth);
  expect(container.querySelector('.ui-dt-range')).toBeNull();
  // The name column takes the room left, not the ID.
  expect(before.name).toBeGreaterThan(before.id * 2);
  rerender(table(false));
  await new Promise((r) => setTimeout(r, 100));
  const after = widths(container);
  for (const k of ['created', 'amount']) expect(Math.abs(after[k] - before[k])).toBeLessThanOrEqual(16);
  expect(container.querySelector('.ui-dt-range')?.textContent).toContain('共 12 筆');
});

test('phone cards: a field name sits on the value baseline; code in a row is the row size', async () => {
  await page.viewport(390, 844);
  const { container, unmount } = render(
    <DataTable
      label="檔案"
      rows={[{ id: 1, name: 'web', file: 'src/app.ts', owner: '王小明' }]}
      columns={[
        { key: 'name', label: '名稱' },
        { key: 'owner', label: '負責人' },
        { key: 'file', label: '檔案', render: (r) => <InlineCode href={'#' + r.file}>{r.file}</InlineCode> },
      ]}
    />,
  );
  const cell = container.querySelector('.ui-dt-body [data-col="owner"]') as HTMLElement;
  // A baseline probe: an empty inline-block sits on the baseline of the text around it.
  const probe = (el: HTMLElement, font: string) => {
    const s = document.createElement('span');
    s.style.cssText = `display:inline-block;width:0;height:0;vertical-align:baseline;font:${font}`;
    el.prepend(s);
    const y = s.getBoundingClientRect().top;
    s.remove();
    return y;
  };
  const before = getComputedStyle(cell, '::before');
  const label = document.createElement('span');
  label.textContent = '負責人';
  label.style.cssText = `position:absolute;top:0;left:0;font-size:${before.fontSize};line-height:${before.lineHeight}`;
  cell.append(label);
  expect(Math.abs(probe(label, `${before.fontSize} sans-serif`) - probe(cell, 'inherit'))).toBeLessThanOrEqual(2);
  label.remove();
  const row = getComputedStyle(container.querySelector('.ui-dt-body [data-col="file"]') as HTMLElement).fontSize;
  expect(getComputedStyle(container.querySelector('.ui-dt-body .ui-code') as HTMLElement).fontSize).toBe(row);
  unmount();
  await page.viewport(1280, 900);
});
