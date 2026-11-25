import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DataTable } from './components/DataTable/DataTable';
import { KpiCard } from './components/KpiCard/KpiCard';
import { LayerGraph } from './components/LayerGraph/LayerGraph';
import { ProgressBar } from './components/ProgressBar/ProgressBar';
import { TreeList } from './components/TreeList/TreeList';

// Geist Mono is for numbers, code and IDs only: a Chinese word in it is drawn in the fallback font beside mono digits,
// at the wrong width. Every visible text node with CJK characters in these components must use the text font.

const CJK = /[\u3000-\u9fff\uff00-\uffef]/;

function cjkInMono(root: HTMLElement): string[] {
  const out: string[] = [];
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walk.nextNode())) {
    const t = n.nodeValue || '';
    const el = n.parentElement;
    if (!el || !CJK.test(t) || el.closest('pre, code, .ui-cv, .ui-visually-hidden')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (/^"?Geist Mono/i.test(cs.fontFamily.trim())) out.push(`${el.className || el.tagName}: ${t.trim()}`);
  }
  return out;
}

// A fixed clock (2026/11/18 12:00, a Wednesday): relative dates and 「今天」 read the same on any day the tests run.
const NOW = new Date(2026, 10, 18, 12, 0).getTime();
beforeAll(() => {
  vi.setSystemTime(NOW);
});
afterAll(() => {
  vi.useRealTimers();
});
const hoursAgo = (h: number) => new Date(NOW - h * 3600_000);

test('KpiCard: the unit (個, 人, 天) is in the text font, the digits in Geist Mono', () => {
  const { container } = render(
    <div>
      <KpiCard label="新增使用者" value={1284} unit="人" />
      <KpiCard label="平均處理" value={3} unit="天" />
    </div>,
  );
  expect(cjkInMono(container)).toEqual([]);
  const value = container.querySelector('.ui-kpi-value');
  expect(value && getComputedStyle(value).fontFamily).toMatch(/^"?Geist Mono/);
});

test('TreeList: dates, relative times and meta lines are in the text font with tabular digits', () => {
  const { container } = render(
    <TreeList
      label="檔案"
      items={[
        {
          id: 'f',
          name: '報告',
          children: [
            { id: 'a', name: 'a.pdf', date: hoursAgo(13), size: 120_000 },
            { id: 'b', name: 'b.pdf', date: hoursAgo(30), size: 4_000 },
          ],
        },
        { id: 'c', name: 'c.pdf', date: hoursAgo(2), size: 2_000, unseen: true },
      ]}
      defaultOpen={['f']}
    />,
  );
  const meta = container.querySelector('.ui-tree-col, .ui-tree-meta');
  expect(meta && getComputedStyle(meta).fontVariantNumeric).toContain('tabular-nums');
  expect(cjkInMono(container)).toEqual([]);
});

test('ProgressBar: 「完成 ✓」 is in the text font; the percentage stays in Geist Mono', () => {
  const { container } = render(
    <div>
      <ProgressBar value={100} aria-label="匯入進度" />
      <ProgressBar value={40} aria-label="上傳進度" />
    </div>,
  );
  expect(cjkInMono(container)).toEqual([]);
  const texts = container.querySelectorAll('.ui-progress-text');
  expect(getComputedStyle(texts[1]).fontFamily).toMatch(/^"?Geist Mono/);
});

test('DataTable: Chinese cells, units, dates, relative times and the totals row are in the text font', () => {
  const rows = [
    { id: 1, name: '週會紀錄', n: 12, at: hoursAgo(3), day: new Date(2026, 10, 4) },
    { id: 2, name: '季度報告', n: 4, at: hoursAgo(50), day: new Date(2026, 9, 1) },
  ];
  const { container } = render(
    <DataTable
      caption="文件"
      rows={rows}
      columns={[
        { key: 'name', label: '名稱' },
        { key: 'n', label: '頁數', numeric: true, unit: '頁' },
        { key: 'at', label: '更新', format: 'relative' },
        { key: 'day', label: '日期', format: 'date' },
      ]}
      totals={{ n: 'sum' }}
    />,
  );
  expect(cjkInMono(container)).toEqual([]);
});

test('LayerGraph: a name in words is in the text font; a name marked code is in Geist Mono', () => {
  const { container } = render(
    <div style={{ width: 900 }}>
      <LayerGraph
        nodes={[
          { id: 'ext', name: '被追蹤的程式', external: true },
          { id: 'cli', name: 'src/cli', code: true, layer: 0, size: 12 },
          { id: 'srv', name: 'src/server', code: true, layer: 1, size: 40 },
        ]}
        edges={[
          { from: 'cli', to: 'srv', count: 3 },
          { from: 'srv', to: 'ext', inferred: true, label: '經由 `LD_PRELOAD` 載入' },
        ]}
      />
    </div>,
  );
  expect(cjkInMono(container)).toEqual([]);
  const names = [...container.querySelectorAll('.ui-lg-name')];
  const code = names.find((n) => n.textContent === 'src/cli');
  expect(code && getComputedStyle(code).fontFamily).toMatch(/^"?Geist Mono/);
});
