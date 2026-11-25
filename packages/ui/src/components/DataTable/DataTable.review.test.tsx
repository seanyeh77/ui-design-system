import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Badge, DataTable, Markdown, type BadgeStatus } from '../../index';

// Review fixes: the totals row is measured, a width is only a least width, 「/」 skips hidden tables, row clicks behave
// like a link (new tab, text selection, onRowOpen), the Shift + click range restarts when the shown rows change,
// Geist Mono stays off Chinese text, and measuring runs at most once a frame on row or column changes.

afterEach(() => history.replaceState(null, '', location.pathname));

type Order = { id: string; name: string; owner: string; status: BadgeStatus; progress: number; amount: number; items: number; updated: string };
// A fixed clock (2026/11/18 12:00, a Wednesday): relative dates and 「今天」 read the same on any day the tests run.
const NOW = new Date(2026, 10, 18, 12, 0).getTime();
beforeAll(() => {
  vi.setSystemTime(NOW);
});
afterAll(() => {
  vi.useRealTimers();
});
const ago = (h: number) => new Date(NOW - h * 3600_000).toISOString();
const ORDERS: Order[] = [
  { id: 'o1', items: 12, name: '年度採購', owner: '王小明', status: 'doing', progress: 42, amount: 128000, updated: ago(0.2) },
  { id: 'o2', items: 3, name: '設備維修', owner: '李大華', status: 'done', progress: 100, amount: 5600, updated: ago(3) },
  { id: 'o3', items: 40, name: '辦公用品', owner: '陳美玲', status: 'fail', progress: 8, amount: 1280, updated: ago(30) },
  { id: 'o4', items: 1, name: '軟體授權', owner: '林志明', status: 'review', progress: 100, amount: 64000, updated: ago(200) },
];
const orderCols = [
  { key: 'name' as const, label: '名稱' },
  { key: 'owner' as const, label: '負責人' },
  { key: 'status' as const, label: '狀態', mobile: 'status' as const, render: (r: Order) => <Badge status={r.status} /> },
  { key: 'progress' as const, label: '進度', numeric: true, unit: '%' },
  { key: 'amount' as const, label: '金額', format: 'money' as const },
  { key: 'updated' as const, label: '更新', format: 'relative' as const },
];
const orders = (extra: Record<string, unknown> = {}) => <DataTable<Order> label="訂單" rows={ORDERS} columns={orderCols} urlSync={false} {...extra} />;
const frames = (n = 2) =>
  new Promise<void>((r) =>
    (function f(k: number) {
      if (!k) r();
      else requestAnimationFrame(() => f(k - 1));
    })(n),
  );
/** The first family of a token's font stack, as the browser resolves it. */
const firstFamily = (css: string) => css.split(',')[0].trim().replace(/["']/g, '');
const tokenFamily = (name: string) => {
  const el = document.createElement('i');
  el.style.fontFamily = `var(--${name})`;
  document.body.appendChild(el);
  const f = firstFamily(getComputedStyle(el).fontFamily);
  el.remove();
  return f;
};
/** Every text node with a Han character under root, with the first family it is drawn in. */
const hanFonts = (root: Element) => {
  const out: { text: string; font: string }[] = [];
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (!/\p{Script=Han}/u.test(n.textContent ?? '') || !n.parentElement) continue;
    out.push({ text: n.textContent ?? '', font: firstFamily(getComputedStyle(n.parentElement).fontFamily) });
  }
  return out;
};

test('totals: the totals row is measured with the column, so 「平均 63 %」 is not cut on the left', async () => {
  await page.viewport(1280, 900);
  const { container } = render(<div style={{ width: 1100 }}>{orders({ totals: { progress: 'avg', amount: 'sum' } })}</div>);
  const total = container.querySelector('.ui-dt-total') as HTMLElement;
  for (const key of ['progress', 'amount']) {
    const cell = total.querySelector<HTMLElement>(`[data-col="${key}"]`);
    if (!cell) throw new Error('no data-col on the total cell ' + key);
    const inner = cell.querySelector('.ui-dt-qty') as HTMLElement;
    await waitFor(() => expect(inner.getBoundingClientRect().left).toBeGreaterThanOrEqual(cell.getBoundingClientRect().left + 11));
    expect(inner.getBoundingClientRect().right).toBeLessThanOrEqual(cell.getBoundingClientRect().right - 11);
  }
  expect(total.querySelector('[data-col="progress"]')?.textContent).toBe('平均 62.5 %');
});

test('widths: a width is a least width; it does not make the first text column short or another column the main one', async () => {
  await page.viewport(1280, 900);
  const cols = orderCols.map((c) => (c.key === 'name' ? { ...c, width: 180 } : c));
  render(
    <div style={{ width: 1100 }}>
      <DataTable<Order> label="訂單" rows={ORDERS} columns={cols} urlSync={false} />
    </div>,
  );
  const w = (l: string) => screen.getByRole('columnheader', { name: new RegExp('^' + l) }).getBoundingClientRect().width;
  await waitFor(() => expect(w('名稱')).toBeGreaterThan(400));
  // 負責人 hugs its content.
  expect(w('負責人')).toBeLessThan(140);
  // A width on a short column: at least that wide, still hugging (not taking the room left).
  const { unmount } = render(
    <div style={{ width: 1100 }}>
      <DataTable<Order> label="訂單 2" rows={ORDERS} columns={orderCols.map((c) => (c.key === 'progress' ? { ...c, width: 150 } : c))} urlSync={false} />
    </div>,
  );
  const p = screen.getAllByRole('columnheader', { name: /^進度/ })[1].getBoundingClientRect().width;
  expect(p).toBeGreaterThanOrEqual(150);
  expect(p).toBeLessThan(200);
  unmount();
});

test('「/」 skips a hidden table, moves its hint when tables show or hide, and leaves lists, grids and menus alone', async () => {
  await page.viewport(1280, 900);
  const { container } = render(
    <div>
      <div className="hide-me" hidden>
        {orders({ label: '隱藏的表格' })}
      </div>
      {orders({ label: '看得到的表格' })}
      <div role="listbox" tabIndex={0} aria-label="清單" />
      <div role="grid" tabIndex={0} aria-label="格線" />
    </div>,
  );
  const [hiddenInput, shownInput] = [...container.querySelectorAll<HTMLInputElement>('.ui-dt-search input')];
  await waitFor(() => expect(shownInput.closest('.ui-dt-search')?.querySelector('.ui-dt-kbd')).toBeTruthy());
  expect(hiddenInput.getAttribute('aria-keyshortcuts')).toBeNull();
  const user = userEvent.setup();
  await user.keyboard('/');
  expect(document.activeElement).toBe(shownInput);
  expect(shownInput.value).toBe('');
  for (const name of ['清單', '格線']) {
    const box = screen.getByRole(name === '清單' ? 'listbox' : 'grid', { name });
    box.focus();
    await user.keyboard('/');
    expect(document.activeElement).toBe(box);
  }
  // The hidden table shows: it comes first on the page, so the hint and the key move to it.
  (container.querySelector('.hide-me') as HTMLElement).hidden = false;
  await waitFor(() => expect(hiddenInput.closest('.ui-dt-search')?.querySelector('.ui-dt-kbd')).toBeTruthy());
  expect(shownInput.closest('.ui-dt-search')?.querySelector('.ui-dt-kbd')).toBeNull();
});

test('「/」 with no table shown: the key is not taken', async () => {
  const { container } = render(<div hidden>{orders()}</div>);
  await frames();
  const e = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
  document.body.dispatchEvent(e);
  expect(e.defaultPrevented).toBe(false);
  expect(document.activeElement).not.toBe(container.querySelector('.ui-dt-search input'));
});

test('rowHref: middle, Ctrl, ⌘ and Shift clicks open a new tab; a click that ends a text selection does nothing', async () => {
  await page.viewport(1280, 900);
  const followed: string[] = [];
  const onLink = (e: MouseEvent) => {
    const a = (e.target as Element).closest('a');
    if (!a) return;
    if (!e.defaultPrevented) followed.push(a.getAttribute('href') || '');
    e.preventDefault();
  };
  document.addEventListener('click', onLink);
  const open = vi.spyOn(window, 'open').mockImplementation(() => null);
  try {
    render(orders({ rowHref: (r: Order) => '/orders/' + r.id }));
    const row = screen.getByRole('link', { name: '年度採購' }).closest('.ui-dt-row') as HTMLElement;
    const owner = row.querySelector('[data-col="owner"]') as HTMLElement;
    owner.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
    expect(open).toHaveBeenLastCalledWith('/orders/o1', '_blank', 'noopener');
    for (const mod of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
      open.mockClear();
      fireEvent.click(owner, mod);
      expect(open).toHaveBeenCalledWith('/orders/o1', '_blank', 'noopener');
    }
    expect(followed).toEqual([]);
    // A selection inside the row: the click ends it, nothing opens.
    open.mockClear();
    getSelection()?.selectAllChildren(owner);
    fireEvent.click(owner);
    expect(followed).toEqual([]);
    expect(open).not.toHaveBeenCalled();
    getSelection()?.removeAllRanges();
    fireEvent.click(owner);
    expect(followed).toEqual(['/orders/o1']);
  } finally {
    document.removeEventListener('click', onLink);
    open.mockRestore();
  }
});

test('onRowOpen: a plain click on the row or its link calls it instead of navigating; Ctrl + click on the link keeps the href', async () => {
  await page.viewport(1280, 900);
  const followed: string[] = [];
  const onLink = (e: MouseEvent) => {
    const a = (e.target as Element).closest('a');
    if (!a) return;
    if (!e.defaultPrevented) followed.push(a.getAttribute('href') || '');
    e.preventDefault();
  };
  document.addEventListener('click', onLink);
  try {
    const onRowOpen = vi.fn();
    render(orders({ rowHref: (r: Order) => '/orders/' + r.id, onRowOpen }));
    const link = screen.getByRole('link', { name: '設備維修' });
    const row = link.closest('.ui-dt-row') as HTMLElement;
    const user = userEvent.setup();
    await user.click(row.querySelector('[data-col="owner"]') as HTMLElement);
    expect(onRowOpen).toHaveBeenCalledTimes(1);
    expect(onRowOpen.mock.calls[0][0]).toBe(ORDERS[1]);
    await user.click(link);
    expect(onRowOpen).toHaveBeenCalledTimes(2);
    expect(followed).toEqual([]);
    expect(link.getAttribute('href')).toBe('/orders/o2');
    fireEvent.click(link, { ctrlKey: true });
    expect(onRowOpen).toHaveBeenCalledTimes(2);
    expect(followed).toEqual(['/orders/o2']);
  } finally {
    document.removeEventListener('click', onLink);
  }
});

test('Shift + click range: only the shown rows; a new search starts the range again (as do sort, filters and page size)', async () => {
  await page.viewport(1280, 900);
  const bulk = vi.fn(() => null);
  render(orders({ selectable: true, bulkActions: bulk }));
  const user = userEvent.setup();
  const box = (n: number) => screen.getAllByRole('checkbox', { name: `選取第 ${n} 筆` })[0];
  await user.click(box(1));
  // A search (here typed and cleared again) changes what lies between two clicks: the next Shift + click is a plain one.
  const search = screen.getByRole('searchbox');
  await user.type(search, '採購');
  await user.clear(search);
  await user.keyboard('{Shift>}');
  await user.click(box(4));
  await user.keyboard('{/Shift}');
  expect((bulk.mock.lastCall as unknown as [string[]])[0].sort()).toEqual(['o1', 'o4']);
  await user.click(screen.getByRole('button', { name: '取消選取' }));
  // Search keeps o1 and o4 (「年度」「軟體」 share nothing; search the owners' family names instead).
  await user.type(screen.getByRole('searchbox'), '明');
  await waitFor(() => expect(screen.getAllByRole('checkbox', { name: /^選取第/ }).length).toBe(2));
  await user.click(box(1));
  await user.keyboard('{Shift>}');
  await user.click(box(2));
  await user.keyboard('{/Shift}');
  expect((bulk.mock.lastCall as unknown as [string[]])[0].sort()).toEqual(['o1', 'o4']);
});

test('fonts: Geist Mono only on figures; units, dates, 「合計」「平均」 and counts are in the text font', async () => {
  await page.viewport(1280, 900);
  const mono = tokenFamily('font-mono');
  const sans = tokenFamily('font-sans');
  const { container } = render(
    <div style={{ width: 1100 }}>
      <DataTable<Order>
        label="訂單"
        rows={ORDERS}
        columns={[...orderCols, { key: 'items', label: '件數', numeric: true, unit: '件' }]}
        urlSync={false}
        pageSize={2}
        totals={{ progress: 'avg', amount: 'sum' }}
        summary={{
          key: 'status',
          items: [
            { value: 'fail', label: '失敗' },
            { value: 'done', label: '完成' },
          ],
        }}
      />
      <Markdown>{'| 項目 | 時間 |\n|---|---|\n| a | 46 分 |\n| b | 3 分 |'}</Markdown>
    </div>,
  );
  await frames();
  const han = hanFonts(container);
  expect(han.length).toBeGreaterThan(10);
  expect(han.filter((h) => h.font === mono)).toEqual([]);
  // The figures beside them are mono.
  const qty = container.querySelector('.ui-dt-body [data-col="progress"] .ui-dt-qty') as HTMLElement;
  expect(firstFamily(getComputedStyle(qty).fontFamily)).toBe(mono);
  const time = container.querySelector('.ui-dt-body time') as HTMLElement;
  expect(firstFamily(getComputedStyle(time).fontFamily)).toBe(sans);
  expect(getComputedStyle(time).fontVariantNumeric).toBe('tabular-nums');
  const md = container.querySelector('.ui-md-table td.is-num') as HTMLElement;
  expect(md.textContent).toBe('46 分');
  expect(firstFamily(getComputedStyle(md).fontFamily)).toBe(mono);
});

test('measuring: at most once a frame, on row and column changes only, not on text changes inside a cell', async () => {
  await page.viewport(1280, 900);
  const { container, rerender } = render(orders());
  await frames(3);
  const root = container.querySelector('.ui-dt') as HTMLElement;
  let runs = 0;
  const mo = new MutationObserver((recs) => {
    for (const r of recs) if (r.oldValue?.includes('is-measuring')) runs++;
  });
  mo.observe(root, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  // A text change inside a cell: not measured.
  const text = [...(container.querySelector('.ui-dt-body [data-col="owner"]') as HTMLElement).childNodes].find((n) => n.nodeType === Node.TEXT_NODE) as Text;
  text.data = '王小明王小明';
  await frames(3);
  expect(runs).toBe(0);
  // Three new row arrays in one frame: one measure.
  act(() => {
    rerender(orders({ rows: ORDERS.slice(0, 3) }));
    rerender(orders({ rows: ORDERS.slice(0, 2) }));
    rerender(orders({ rows: [...ORDERS] }));
  });
  await frames(3);
  mo.disconnect();
  expect(runs).toBe(1);
  expect(within(container).getAllByRole('row').length).toBeGreaterThan(4);
});
