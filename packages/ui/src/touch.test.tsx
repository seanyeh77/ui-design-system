import * as React from 'react';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { cdp, page } from 'vitest/browser';
import { render } from '@testing-library/react';
import * as UI from './index';

// A touch screen (pointer: coarse): controls draw a larger hit area with ::before or ::after, absolutely positioned.
// That area is sized against its own element only if the element is positioned; on a static element 100% means the
// nearest positioned ancestor, up to the whole window, and the area covers the page.
beforeAll(async () => {
  await page.viewport(390, 844);
  await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'pointer', value: 'coarse' },
      { name: 'hover', value: 'none' },
    ],
  });
});
afterAll(async () => {
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
  await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
});

function Page() {
  const [sel, setSel] = React.useState<string | null>(null);
  const [edge, setEdge] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState('a');
  return (
    <div style={{ padding: 16 }}>
      <UI.Breadcrumb items={[{ label: '首頁', href: '#' }, { label: '架構' }]} />
      <UI.Tabs
        value={tab}
        onChange={setTab}
        unit="筆"
        items={[
          { id: 'a', label: '全部', count: 3 },
          { id: 'b', label: '錯誤', count: 1 },
        ]}
      />
      <UI.Button>儲存</UI.Button>
      <UI.IconButton label="複製" icon="copy" />
      <UI.Switch label="通知" />
      <UI.Checkbox label="記住我" />
      <p>
        見 <UI.InlineCode href="#child.c">child.c:86</UI.InlineCode>，和{' '}
        <UI.Term title="daemon" text="在背景執行的程式。">
          daemon
        </UI.Term>
        。
      </p>
      <UI.LayerGraph
        nodes={[
          { id: 'a', name: 'src/ibmon', layer: 0, size: 91 },
          { id: 'b', name: 'src/libibtrace', layer: 1, size: 114 },
          { id: 'c', name: 'src/common', shared: true },
          { id: 'd', name: 'include/ibtrace.h', shared: true },
        ]}
        edges={[
          { from: 'a', to: 'b', inferred: true, label: '環境變數 `IBTRACE_SHM`' },
          { from: 'a', to: 'c', count: 6 },
          { from: 'b', to: 'd', count: 2 },
        ]}
        selected={sel}
        onSelect={setSel}
        selectedEdge={edge}
        onSelectEdge={setEdge}
      />
      <UI.DataTable
        urlSync={false}
        rows={[{ id: '1', loc: 'main.c:42', text: '找不到 child.c，完整路徑應為 src/ibmon/child.c:86，請改成完整路徑後重新執行檢查' }]}
        columns={[
          { key: 'loc', label: '位置', render: (r) => <UI.InlineCode href="#">{r.loc}</UI.InlineCode>, searchText: (r) => r.loc },
          { key: 'text', label: '說明', long: true },
        ]}
        rowActions={() => <UI.IconButton label="刪除" icon="trash" />}
      />
      <UI.CodeView file="src/ibmon/child.c" fileHref="#child.c" code={'int main(void) {\n  return 0;\n}\n'} />
    </div>
  );
}

test('touch: every enlarged hit area stays on its own control', async () => {
  expect(matchMedia('(pointer: coarse)').matches).toBe(true);
  const { container } = render(<Page />);
  await new Promise((r) => setTimeout(r, 100));
  const escaped: string[] = [];
  for (const el of container.querySelectorAll<HTMLElement>('*')) {
    for (const pe of ['::before', '::after'] as const) {
      const ps = getComputedStyle(el, pe);
      if (!ps.content || ps.content === 'none' || ps.position !== 'absolute') continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      // Sized against the element itself: at most the larger of the element and the 48 px target.
      const w = parseFloat(ps.width) || 0;
      const h = parseFloat(ps.height) || 0;
      const fits = w <= Math.max(r.width, 48) + 1 && h <= Math.max(r.height, 48) + 1;
      const positioned = getComputedStyle(el).position !== 'static';
      if (!fits || !positioned) escaped.push(`${el.className || el.tagName}${pe} ${Math.round(w)} x ${Math.round(h)} px`);
    }
  }
  expect(escaped).toEqual([]);
  // A tap at the bottom of the screen lands on whatever is there, not on a control far above it.
  const hit = document.elementFromPoint(50, 820);
  expect(hit?.closest('.ui-lg-chip')).toBeNull();
});

test('touch: the scroll hint says 「左右滑動」', async () => {
  // Narrower than two 120 px boxes at 0.75: it scrolls.
  const { container } = render(
    <div style={{ width: 180 }}>
      <UI.LayerGraph
        nodes={[
          { id: 'a', name: 'src/ibmon', layer: 0 },
          { id: 'b', name: 'src/cli', layer: 0 },
        ]}
        edges={[]}
        legend={false}
      />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 100));
  expect(container.querySelector('.ui-scroll-hint')?.textContent).toBe('左右滑動');
});

test('touch: the search box shows no keyboard shortcut', async () => {
  const { container } = render(<UI.TopBar title="架構" onSearch={() => {}} />);
  expect(container.querySelector('.ui-search kbd')).toBeNull();
  expect(container.querySelector('.ui-search-icon')?.getAttribute('aria-label')).toBe('搜尋');
});

test('touch: a cut-off long cell has no hover Tooltip (the row caret shows it in full)', async () => {
  // A tablet: the table layout (600 px and up), not phone cards.
  await page.viewport(1024, 768);
  const { container } = render(
    <div style={{ width: 700 }}>
      <UI.DataTable
        urlSync={false}
        columns={[
          { key: 'fn', label: '函式' },
          { key: 'note', label: '筆記內容', long: true, width: 160 },
        ]}
        rows={[{ id: 'a', fn: 'ring_push', note: '以為滿了會覆蓋最舊的資料，實際上回傳 -EAGAIN 並丟掉新的一筆，呼叫端沒有檢查回傳值。'.repeat(2) }]}
      />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 100));
  const long = container.querySelector<HTMLElement>('.ui-dt-long');
  expect(long?.classList.contains('is-cut')).toBe(false);
  long?.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 200));
  expect(document.querySelector('.ui-tooltip')).toBeNull();
  expect(container.querySelector('.ui-dt-exp-btn')).not.toBeNull();
  await page.viewport(390, 844);
});

test('touch: in a LayerGraph scaled down to fit, every box keeps a 48 px touch area on screen', async () => {
  const { container } = render(
    <div style={{ width: 226 }}>
      <UI.LayerGraph
        nodes={[
          { id: 'a', name: 'src/ibmon', layer: 0 },
          { id: 'b', name: 'src/cli', layer: 0 },
          { id: 'c', name: 'src/libibtrace', layer: 1 },
        ]}
        edges={[{ from: 'a', to: 'c', inferred: true, label: '環境變數' }]}
        legend={false}
        listView={false}
        onSelectEdge={() => {}}
      />
    </div>,
  );
  const canvas = container.querySelector<HTMLElement>('.ui-lg-canvas');
  await new Promise((r) => setTimeout(r, 150));
  const s = Number(/scale\(([\d.]+)\)/.exec(canvas?.style.transform ?? '')?.[1]);
  expect(s).toBeLessThan(0.8);
  for (const el of container.querySelectorAll<HTMLElement>('.ui-lg-node, .ui-lg-label.is-clickable')) {
    const a = getComputedStyle(el, '::after');
    expect(parseFloat(a.height) * s).toBeGreaterThanOrEqual(47.5);
    expect(parseFloat(a.width) * s).toBeGreaterThanOrEqual(47.5);
  }
});
