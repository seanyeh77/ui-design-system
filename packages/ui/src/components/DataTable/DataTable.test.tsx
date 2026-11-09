import { expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DataTable, IconButton, InlineCode } from '../../index';

const cols = [{ key: 'name' as const, label: '名稱' }];

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

test('one page: the count above the table only, no range below', () => {
  const rows = Array.from({ length: 6 }, (_, i) => ({ id: String(i), name: 'row ' + i }));
  const { container, rerender } = render(<DataTable columns={cols} rows={rows} urlSync={false} />);
  // Shown 「6 / 6 筆」, drawn by CSS; the page's text and the screen reader have only 「6 筆中的 6 筆」.
  const seen = [...container.querySelectorAll('.ui-dt-result .ui-seen')].map((e) => getComputedStyle(e, '::before').content);
  expect(seen.join('').replace(/"|\s*\/\s*""/g, '')).toBe('6 / 6 筆');
  expect(container.querySelector('.ui-dt-result')?.textContent).toBe('6 筆中的 6 筆');
  expect(container.querySelector('.ui-dt-foot')).toBeNull();
  rerender(<DataTable columns={cols} rows={rows} urlSync={false} pageSize={4} />);
  expect(container.querySelector('.ui-dt-range')?.textContent).toBe('第 1–4 筆，共 6 筆');
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
  for (let i = 0; i < 6 && document.activeElement !== cell; i++) await user.tab();
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
  await user.click(screen.getByRole('button', { name: '欄位' }));
  const box = await screen.findByRole('checkbox', { name: '路徑' });
  expect(box.getAttribute('aria-checked')).toBe('false');
  await user.click(box);
  expect(box.getAttribute('aria-checked')).toBe('true');
  await waitFor(() => expect(headers()).toEqual(['名稱', '負責人', '路徑']));
  // Turning off a column shown by default is reset too.
  await user.click(screen.getByRole('checkbox', { name: '負責人' }));
  await waitFor(() => expect(headers()).toEqual(['名稱', '路徑']));
  await user.keyboard('{Escape}');
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

test('the row-action column stays at the right edge while the table scrolls', async () => {
  await page.viewport(1280, 800);
  const rows = [{ id: 'a', name: 'alpha', status: 'ok' }];
  const { container } = render(
    <div style={{ width: 300 }}>
      <DataTable
        columns={[
          { key: 'name', label: '名稱', width: 200 },
          { key: 'status', label: '狀態', width: 200 },
        ]}
        rows={rows}
        urlSync={false}
        rowActions={() => <IconButton label="開啟" icon="file-text" />}
      />
    </div>,
  );
  const scroll = container.querySelector<HTMLElement>('.ui-dt-scroll');
  const acts = container.querySelector<HTMLElement>('.ui-dt-body .ui-dt-acts');
  if (!scroll || !acts) throw new Error('no table');
  expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
  const edge = scroll.getBoundingClientRect().right;
  expect(Math.abs(acts.getBoundingClientRect().right - edge)).toBeLessThanOrEqual(1);
  await waitFor(() => expect(container.querySelector('.ui-dt-scroller.has-more')).not.toBeNull());
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
