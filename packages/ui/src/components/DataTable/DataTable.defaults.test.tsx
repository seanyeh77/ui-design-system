import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import tokens from '@seanyeh77/tokens/tokens.json';
import { Badge, DataTable, type BadgeStatus } from '../../index';
import { ACCENT_SWATCHES, DEFAULT_ACCENT, setAccent, setTheme } from '../../theme';

// The defaults an agent gets from plain columns, and the review fixes: one toolbar height, 「⋯」, the 「/」 shortcut,
// filter chips, hugging columns, secondary lines, row states, sticky lead columns, remembered columns, Shift + click,
// rowHref, <time> dates and durations.

afterEach(() => history.replaceState(null, '', location.pathname));

type Job = { id: string; title: string; status: BadgeStatus; source: string; secs: number; words: number; created: string; reason?: string };
// A fixed clock (2026/11/18 12:00, a Wednesday): relative dates and 「今天」 read the same on any day the tests run.
const NOW = new Date(2026, 10, 18, 12, 0).getTime();
beforeAll(() => {
  vi.setSystemTime(NOW);
});
afterAll(() => {
  vi.useRealTimers();
});
const ago = (h: number) => new Date(NOW - h * 3600_000).toISOString();
const JOBS: Job[] = [
  { id: 'j1', title: '第 12 次週會錄音', status: 'done', source: 'YouTube', secs: 2802, words: 12840, created: ago(2) },
  { id: 'j2', title: '產品訪談：物流業者', status: 'fail', source: '上傳', secs: 6889, words: 0, created: ago(5), reason: '音訊格式不支援，請轉成 MP3 後重試' },
  { id: 'j3', title: '課程錄影 第 3 週', status: 'doing', source: 'Google Drive', secs: 90, words: 320, created: ago(30) },
  { id: 'j4', title: '客服通話抽樣', status: 'done', source: '上傳', secs: 1530, words: 5210, created: ago(200) },
];
const STATUS: Record<string, string> = { done: '完成', fail: '失敗', doing: '進行中', review: '審核中', draft: '草稿' };
const jobCols = [
  { key: 'title' as const, label: '標題', secondary: (r: Job) => r.reason },
  {
    key: 'status' as const,
    label: '狀態',
    mobile: 'status' as const,
    render: (r: Job) => <Badge status={r.status} />,
    searchText: (r: Job) => STATUS[r.status],
  },
  { key: 'source' as const, label: '來源' },
  { key: 'secs' as const, label: '長度', format: 'duration' as const },
  { key: 'words' as const, label: '字數', numeric: true, unit: '字' },
  { key: 'created' as const, label: '建立時間', format: 'relative' as const },
];
const jobs = (extra: Record<string, unknown> = {}) => (
  <DataTable<Job> label="轉錄紀錄" rows={JOBS} columns={jobCols} urlSync={false} filters={[{ key: 'source', label: '來源' }]} {...extra} />
);
/** A token as the browser resolves it (rgb()). */
const tokenColor = (name: string) => {
  const el = document.createElement('i');
  el.style.color = `var(--${name})`;
  document.body.appendChild(el);
  const c = getComputedStyle(el).color;
  el.remove();
  return c;
};
/** 「⋯」 → 「欄位」 from the keyboard (Enter, →). */
const openColumns = async (user: ReturnType<typeof userEvent.setup>) => {
  screen.getAllByRole('button', { name: '更多表格操作' })[0].focus();
  await user.keyboard('{Enter}');
  await screen.findByRole('menuitem', { name: '欄位' });
  await user.keyboard('{ArrowRight}');
  await screen.findByRole('menu', { name: '顯示的欄位' });
};
const headCell = (label: string) => screen.getByRole('columnheader', { name: new RegExp('^' + label) });

test('toolbar: the search field, 「篩選」, 「排序」 and 「⋯」 are all 40 px tall on one row; the search icon is 20 px', async () => {
  await page.viewport(1280, 900);
  const { container } = render(<div style={{ width: 1000 }}>{jobs()}</div>);
  const tools = container.querySelector('.ui-dt-tools') as HTMLElement;
  const els = [
    tools.querySelector('.ui-dt-search input'),
    tools.querySelector('.ui-dt-filterbtn'),
    tools.querySelector('.ui-dt-sortbtn'),
    screen.getByRole('button', { name: '更多表格操作' }),
  ] as HTMLElement[];
  expect(els.map((e) => Math.round(e.getBoundingClientRect().height))).toEqual([40, 40, 40, 40]);
  expect(new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))).size).toBe(1);
  const search = tools.querySelector('.ui-dt-search') as HTMLElement;
  expect(search.getBoundingClientRect().width).toBe(320);
  expect((tools.querySelector('.ui-searchfield-icon') as Element).getBoundingClientRect().width).toBe(20);
  // Copy, zoom and 「欄位」 are in 「⋯」, not on the row.
  expect(screen.queryByRole('button', { name: '複製成 Markdown' })).toBeNull();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '更多表格操作' }));
  const menu = await screen.findByRole('menu');
  expect(
    within(menu)
      .getAllByRole('menuitem')
      .map((m) => m.textContent),
  ).toEqual(['欄位', '複製成 Markdown', '放大表格']);
  await user.keyboard('{Escape}');
});

test('「/」 focuses the first table’s search field, not from a text field or with Ctrl; a 「/」 hint shows while it is empty', async () => {
  await page.viewport(1280, 900);
  const { container } = render(
    <div>
      <input aria-label="其他輸入框" />
      {jobs()}
      {jobs({ label: '第二個表格' })}
    </div>,
  );
  const [first, second] = [...container.querySelectorAll<HTMLInputElement>('.ui-dt-search input')];
  await waitFor(() => expect(container.querySelectorAll('.ui-dt-kbd').length).toBe(1));
  expect(first.closest('.ui-dt-search')?.querySelector('.ui-dt-kbd')).toBeTruthy();
  expect(first.getAttribute('aria-keyshortcuts')).toBe('/');
  expect(second.getAttribute('aria-keyshortcuts')).toBeNull();
  const user = userEvent.setup();
  const other = screen.getByRole('textbox', { name: '其他輸入框' });
  other.focus();
  await user.keyboard('/');
  expect(document.activeElement).toBe(other);
  expect((other as HTMLInputElement).value).toBe('/');
  (document.activeElement as HTMLElement).blur();
  await user.keyboard('{Control>}/{/Control}');
  expect(document.activeElement).not.toBe(first);
  await user.keyboard('/');
  expect(document.activeElement).toBe(first);
  // The key does not land in the field; the hint goes while it has focus.
  expect(first.value).toBe('');
  await waitFor(() => expect(container.querySelector('.ui-dt-kbd')).toBeNull());
});

test('filters: the button turns accent with a count, chips under the toolbar remove one condition each and update the URL', async () => {
  await page.viewport(1280, 900);
  history.replaceState(null, '', location.pathname + '?source=' + encodeURIComponent('上傳,YouTube'));
  const { container } = render(<DataTable<Job> label="轉錄紀錄" rows={JOBS} columns={jobCols} filters={[{ key: 'source', label: '來源' }]} />);
  const btn = container.querySelector('.ui-dt-filterbtn') as HTMLElement;
  expect(btn.classList.contains('is-active')).toBe(true);
  expect(getComputedStyle(btn).color).toBe(tokenColor('accent-text'));
  expect(getComputedStyle(btn).borderTopColor).toBe(tokenColor('accent'));
  const chips = () => [...container.querySelectorAll('.ui-dt-chip')].map((c) => c.textContent);
  expect(chips()).toEqual(['來源：上傳', '來源：YouTube']);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '移除篩選：來源：上傳' }));
  expect(chips()).toEqual(['來源：YouTube']);
  await waitFor(() => expect(new URLSearchParams(location.search).get('source')).toBe('YouTube'));
  // Focus moves to the chip left, not to the top of the page.
  await waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('移除篩選：來源：YouTube'));
  await user.click(screen.getByRole('button', { name: '清除全部' }));
  expect(container.querySelector('.ui-dt-chips')).toBeNull();
  expect(btn.classList.contains('is-active')).toBe(false);
  await waitFor(() => expect(location.search).toBe(''));
});

test('the same condition in the summary and a filter or a view warns in development', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const summary = { key: 'status' as const, items: [{ value: 'fail', label: '失敗' }] };
  render(<DataTable<Job> label="a" rows={JOBS} columns={jobCols} urlSync={false} summary={summary} filters={[{ key: 'status', label: '狀態' }]} />);
  render(
    <DataTable<Job>
      label="b"
      rows={JOBS}
      columns={jobCols}
      urlSync={false}
      summary={summary}
      views={[{ id: 'f', label: '只看失敗', filter: (r) => r.status === 'fail' }]}
    />,
  );
  const said = warn.mock.calls.map((c) => String(c[0]));
  expect(said.some((t) => t.includes('the filter 「狀態」') && t.includes('Drop it from filters'))).toBe(true);
  expect(said.some((t) => t.includes('the view 「只看失敗」') && t.includes('Drop the view'))).toBe(true);
  warn.mockRestore();
});

test('a number given as a string with its unit warns: pass a number and unit', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(<DataTable label="字數" urlSync={false} rows={[{ id: 1, w: '1,234 字' }]} columns={[{ key: 'w', label: '字數 a', unit: '字' }]} />);
  expect(warn.mock.calls.some((c) => String(c[0]).includes('got the string 「1,234 字」') && String(c[0]).includes('Pass a number'))).toBe(true);
  warn.mockRestore();
});

test('widths: short columns hug their content and the main text column takes the room left', async () => {
  await page.viewport(1280, 900);
  render(<div style={{ width: 1100 }}>{jobs()}</div>);
  const w = (l: string) => headCell(l).getBoundingClientRect().width;
  await waitFor(() => expect(w('標題')).toBeGreaterThan(400));
  for (const l of ['狀態', '來源', '長度', '字數']) expect(w(l)).toBeLessThan(170);
  // 「建立時間」 holds a full date for a row older than a week: wider, still on one line.
  expect(w('建立時間')).toBeLessThan(240);
  // Hugging means the widest content fits on one line: no cell of those columns is cut or wrapped.
  for (const el of document.querySelectorAll<HTMLElement>('.ui-dt-body .ui-dt-cell.is-hug')) {
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
    expect(el.getBoundingClientRect().height).toBeLessThan(80);
  }
  // An explicit grow still wins.
  const { unmount } = render(
    <div style={{ width: 1100 }}>
      <DataTable<Job>
        label="x"
        rows={JOBS}
        urlSync={false}
        columns={[
          { key: 'title', label: 'T', width: 200, grow: 0 },
          { key: 'source', label: 'S', grow: 1 },
        ]}
      />
    </div>,
  );
  const ts = screen.getAllByRole('columnheader', { name: /^S/ })[0].getBoundingClientRect().width;
  expect(ts).toBeGreaterThan(600);
  unmount();
});

test('secondary: a muted second line under the cell, found by search, also on phone cards', async () => {
  await page.viewport(1280, 900);
  const { container, unmount } = render(jobs());
  const sub = container.querySelector('.ui-dt-sub') as HTMLElement;
  expect(sub.textContent).toBe('音訊格式不支援，請轉成 MP3 後重試');
  expect(getComputedStyle(sub).fontSize).toBe('13px');
  expect(getComputedStyle(sub).textOverflow).toBe('ellipsis');
  const rows = [...container.querySelectorAll<HTMLElement>('.ui-dt-body .ui-dt-row')];
  // Only the row with a second line grows.
  expect(rows[1].getBoundingClientRect().height).toBeGreaterThan(rows[0].getBoundingClientRect().height);
  // 48 px and the 1 px line under it.
  expect(Math.round(rows[0].getBoundingClientRect().height)).toBe(49);
  await userEvent.setup().type(screen.getByRole('searchbox'), 'MP3');
  expect(container.querySelectorAll('.ui-dt-body .ui-dt-row').length).toBe(1);
  unmount();
  await page.viewport(390, 800);
  const b = render(jobs());
  expect((b.container.querySelector('.ui-dt-sub') as HTMLElement).getBoundingClientRect().width).toBeGreaterThan(0);
  await page.viewport(1280, 900);
});

// Row grounds from the CSS (the --dt-* formulas on .ui-dt, read through the CSSOM) and the token values.
type Rgb = [number, number, number];
const hex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
const lum = (c: Rgb) =>
  c
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: Rgb, b: Rgb) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
function rowVars(dark: boolean): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (rules: CSSRuleList) => {
    for (const r of rules) {
      if (r instanceof CSSStyleRule && (r.selectorText === '.ui-dt' || (dark && r.selectorText === `[data-theme="dark"] .ui-dt`))) {
        for (const n of ['--dt-hover', '--dt-zebra']) if (r.style.getPropertyValue(n)) out[n] = r.style.getPropertyValue(n).trim();
      } else if (r instanceof CSSGroupingRule)
        walk(r.cssRules); // @layer, @media
      else if (r instanceof CSSImportRule && r.styleSheet) walk(r.styleSheet.cssRules);
    }
  };
  for (const sh of document.styleSheets) walk(sh.cssRules);
  return out;
}
const resolve = (expr: string, c: Record<string, string>): Rgb => {
  const v = /^var\(--([\w-]+)\)$/.exec(expr);
  if (v) return hex(c[v[1]]);
  const m = /^color-mix\(in srgb, var\(--([\w-]+)\),? var\(--([\w-]+)\) (\d+(?:\.\d+)?)%\)$/.exec(expr);
  if (!m) throw new Error('not a formula this test reads: ' + expr);
  const [a, b, p] = [hex(c[m[1]]), hex(c[m[2]]), Number(m[3]) / 100];
  return a.map((x, i) => Math.round(x * (1 - p) + b[i] * p)) as Rgb;
};
type Value = string | { light: string; dark?: string };
const colors = Object.fromEntries(tokens.color.tokens.map((t) => [t.name, t.value as Value]));
const themeColors = (t: 'light' | 'dark') =>
  Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, typeof v === 'string' ? v : t === 'dark' ? (v.dark ?? v.light) : v.light]));
const TEXTS = ['ink', 'ink-muted', ...Object.keys(colors).filter((n) => n.endsWith('-text'))];

test.each(['light', 'dark'] as const)('%s: text on every row ground (zebra, hover, selected, header) reaches 4.5:1', (theme) => {
  const c = themeColors(theme);
  const vars = rowVars(theme === 'dark');
  expect(Object.keys(vars).sort()).toEqual(['--dt-hover', '--dt-zebra']);
  const grounds: Record<string, Rgb> = {
    surface: hex(c.surface),
    zebra: resolve(vars['--dt-zebra'], c),
    hover: resolve(vars['--dt-hover'], c),
    selected: hex(c['accent-soft']),
    header: hex(c['surface-sub']),
  };
  const fails: string[] = [];
  for (const t of TEXTS)
    for (const [g, rgb] of Object.entries(grounds)) {
      const r = contrast(hex(c[t]), rgb);
      if (r < 4.5) fails.push(`${t} on ${g}: ${r.toFixed(2)}:1`);
    }
  expect(fails).toEqual([]);
  // The rows are told apart: hover differs from both the plain and the zebra rows.
  expect(contrast(grounds.hover, grounds.surface)).toBeGreaterThan(1.05);
  expect(contrast(grounds.hover, grounds.zebra)).toBeGreaterThan(1.02);
});

test.each(['light', 'dark'] as const)('%s: accent-text of every preset accent reads on the hover and zebra rows', (theme) => {
  const root = document.documentElement;
  const c = themeColors(theme);
  const vars = rowVars(theme === 'dark');
  const fails: string[] = [];
  try {
    for (const [name, h] of ACCENT_SWATCHES) {
      setTheme(theme);
      setAccent(h, true);
      const text = hex(root.style.getPropertyValue('--accent-text'));
      for (const g of ['--dt-hover', '--dt-zebra']) {
        const r = contrast(text, resolve(vars[g], c));
        if (r < 4.5) fails.push(`${name} on ${g}: ${r.toFixed(2)}:1`);
      }
    }
  } finally {
    setTheme('light');
    setAccent(DEFAULT_ACCENT, true);
  }
  expect(fails).toEqual([]);
});

test('row states: selected has accent-soft and a 3 px bar, a keyboard row a 2 px bar; the header has a strong line under it', async () => {
  await page.viewport(1280, 900);
  const { container } = render(jobs({ selectable: true, bulkActions: () => null }));
  const head = container.querySelector('.ui-dt-head') as HTMLElement;
  expect(getComputedStyle(head).borderBottomColor).toBe(tokenColor('line-strong'));
  expect(getComputedStyle(head).backgroundColor).toBe(tokenColor('surface-sub'));
  const user = userEvent.setup();
  await user.click(screen.getAllByRole('checkbox', { name: '選取第 1 筆' })[0]);
  const row = container.querySelector('.ui-dt-body .ui-dt-row.is-selected') as HTMLElement;
  expect(getComputedStyle(row.firstElementChild as Element).boxShadow).toMatch(/3px 0px 0px 0px inset/);
  // Keyboard focus in the next row.
  await user.tab();
  const next = (document.activeElement as HTMLElement).closest('.ui-dt-row') as HTMLElement | null;
  expect(next).not.toBeNull();
  expect(next?.classList.contains('is-selected')).toBe(false);
  expect(getComputedStyle(next?.firstElementChild as Element).boxShadow).toMatch(/2px 0px 0px 0px inset/);
});

test('focus: every toolbar control shows the focus ring when tabbed to', async () => {
  await page.viewport(1280, 900);
  history.replaceState(null, '', location.pathname + '?source=YouTube');
  const { container } = render(
    <DataTable<Job>
      label="轉錄紀錄"
      rows={JOBS}
      columns={jobCols}
      filters={[{ key: 'source', label: '來源' }]}
      views={[
        { id: 'all', label: '全部' },
        { id: 'mine', label: '我的', filter: (r) => r.source !== '上傳' },
      ]}
    />,
  );
  const user = userEvent.setup();
  document.body.focus();
  const seen: string[] = [];
  for (let i = 0; i < 12; i++) {
    await user.tab();
    const el = document.activeElement as HTMLElement;
    if (!container.contains(el) || el.closest('.ui-dt-table')) break;
    const cs = getComputedStyle(el);
    const ring = cs.boxShadow !== 'none' || (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0);
    seen.push(`${el.getAttribute('aria-label') || el.textContent?.trim()}:${ring}`);
  }
  expect(seen.length).toBeGreaterThan(5);
  expect(seen.filter((s) => s.endsWith(':false'))).toEqual([]);
});

test('stickyFirst with a checkbox and a caret: those columns stay too, on the row’s own ground', async () => {
  await page.viewport(1280, 900);
  const wide = [
    { key: 'title' as const, label: '標題', width: 260 },
    { key: 'note' as const, label: '說明', long: true, width: 400 },
    { key: 'source' as const, label: '來源', width: 400 },
  ];
  const rows = JOBS.map((j) => ({ ...j, note: '很長的說明 '.repeat(20) }));
  const { container } = render(
    <div style={{ width: 600 }}>
      <DataTable label="捲動" rows={rows} columns={wide} urlSync={false} search={false} selectable bulkActions={() => null} stickyFirst />
    </div>,
  );
  const scroll = container.querySelector('.ui-dt-scroll') as HTMLElement;
  const row = container.querySelectorAll<HTMLElement>('.ui-dt-body .ui-dt-row')[1];
  const [exp, sel, first] = [...row.children] as HTMLElement[];
  const before = [exp, sel, first].map((e) => e.getBoundingClientRect().left);
  scroll.scrollLeft = 300;
  await new Promise((r) => requestAnimationFrame(r));
  expect([exp, sel, first].map((e) => e.getBoundingClientRect().left)).toEqual(before);
  // No gap: each starts where the one before ends.
  expect(Math.round(sel.getBoundingClientRect().left)).toBe(Math.round(exp.getBoundingClientRect().right));
  expect(Math.round(first.getBoundingClientRect().left)).toBe(Math.round(sel.getBoundingClientRect().right));
  for (const e of [exp, sel, first]) expect(getComputedStyle(e).backgroundColor).toBe(getComputedStyle(row).backgroundColor);
});

test('widthKey remembers the shown columns; 「還原預設」 brings back the defaults and the widths', async () => {
  await page.viewport(1280, 900);
  localStorage.removeItem('ui-dt-cols:jobs');
  localStorage.setItem('ui-dt-width:jobs', JSON.stringify({ title: 500 }));
  const user = userEvent.setup();
  const heads = () => [...document.querySelectorAll('.ui-dt-head [role="columnheader"]')].map((h) => h.textContent?.trim()).filter(Boolean);
  const a = render(jobs({ widthKey: 'jobs' }));
  await waitFor(() => expect(Math.round(headCell('標題').getBoundingClientRect().width)).toBe(500));
  await openColumns(user);
  await user.click(await screen.findByRole('menuitemcheckbox', { name: '來源' }));
  await waitFor(() => expect(heads()).not.toContain('來源'));
  expect(JSON.parse(localStorage.getItem('ui-dt-cols:jobs') || '{}')).toEqual({ source: true });
  await user.keyboard('{Escape}{Escape}');
  a.unmount();
  render(jobs({ widthKey: 'jobs' }));
  expect(heads()).not.toContain('來源');
  await openColumns(user);
  await user.click(await screen.findByRole('menuitem', { name: '還原預設' }));
  await waitFor(() => expect(heads()).toContain('來源'));
  expect(localStorage.getItem('ui-dt-cols:jobs')).toBeNull();
  expect(localStorage.getItem('ui-dt-width:jobs')).toBeNull();
  await user.keyboard('{Escape}{Escape}');
});

test('Shift + click on a row checkbox selects every row from the last one clicked and says how many', async () => {
  await page.viewport(1280, 900);
  const bulk = vi.fn(() => null);
  render(jobs({ selectable: true, bulkActions: bulk }));
  const user = userEvent.setup();
  await user.click(screen.getAllByRole('checkbox', { name: '選取第 1 筆' })[0]);
  await user.keyboard('{Shift>}');
  await user.click(screen.getAllByRole('checkbox', { name: '選取第 4 筆' })[0]);
  await user.keyboard('{/Shift}');
  expect(bulk).toHaveBeenLastCalledWith(['j1', 'j2', 'j3', 'j4'], expect.any(Function));
  await waitFor(() => expect(document.querySelector('[aria-live]')?.textContent ?? '').toContain('已選 4 筆'));
});

test('rowHref: the first cell is a real link and a click elsewhere on the row opens it, not on its controls', async () => {
  await page.viewport(1280, 900);
  const opened: string[] = [];
  const onLink = (e: MouseEvent) => {
    const a = (e.target as Element).closest('a');
    if (a) {
      e.preventDefault();
      opened.push(a.getAttribute('href') || '');
    }
  };
  document.addEventListener('click', onLink);
  try {
    const act = vi.fn();
    render(jobs({ rowHref: (r: Job) => '/jobs/' + r.id, selectable: true, bulkActions: () => null, rowActions: () => <button onClick={act}>重試</button> }));
    const link = screen.getByRole('link', { name: '第 12 次週會錄音' });
    expect(link.getAttribute('href')).toBe('/jobs/j1');
    const user = userEvent.setup();
    const row = link.closest('.ui-dt-row') as HTMLElement;
    await user.click(row.querySelector('[data-col="source"]') as HTMLElement);
    expect(opened).toEqual(['/jobs/j1']);
    await user.click(within(row).getByRole('button', { name: '重試' }));
    await user.click(within(row).getByRole('checkbox'));
    expect(opened).toEqual(['/jobs/j1']);
    expect(act).toHaveBeenCalledTimes(1);
  } finally {
    document.removeEventListener('click', onLink);
  }
});

test('dates: <time dateTime>, tabular figures; a relative one shows the full date on hover and as the cell description', async () => {
  await page.viewport(1280, 900);
  const { container } = render(jobs());
  const times = [...container.querySelectorAll<HTMLTimeElement>('.ui-dt-body time')];
  expect(times.length).toBe(4);
  expect(times[0].dateTime).toBe(JOBS[0].created);
  expect(times[0].textContent).toBe('2 小時前');
  expect(getComputedStyle(times[0]).fontVariantNumeric).toBe('tabular-nums');
  // Not a tab stop.
  expect(times[0].tabIndex).toBe(-1);
  const cell = times[0].closest('[role="cell"]') as HTMLElement;
  expect(cell.getAttribute('aria-description')).toMatch(/^\d{4}\/\d{2}\/\d{2}（.）\d{2}:\d{2}$/);
  await userEvent.setup().hover(times[0]);
  await waitFor(() => expect(document.querySelector('.ui-tooltip')?.textContent).toBe(cell.getAttribute('aria-description')));
  // Older than a week: already the full date, no Tooltip and no description.
  expect(times[3].closest('[role="cell"]')?.getAttribute('aria-description')).toBeNull();
});

test('duration: 46:42 and 1:54:49, right-aligned in tabular figures, sorted by the number', async () => {
  await page.viewport(1280, 900);
  const { container } = render(jobs());
  const col = () => [...container.querySelectorAll<HTMLElement>('.ui-dt-body [data-col="secs"]')];
  expect(col().map((c) => c.textContent)).toEqual(['46:42', '1:54:49', '1:30', '25:30']);
  expect(col()[0].classList.contains('is-num')).toBe(true);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '長度' }));
  // Numbers start from the largest.
  expect(col().map((c) => c.textContent)).toEqual(['1:54:49', '46:42', '25:30', '1:30']);
});
