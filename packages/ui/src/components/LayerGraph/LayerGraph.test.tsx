import * as React from 'react';
import { expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { LayerGraph, setLocale, type LayerGraphEdge } from '../../index';

const user = userEvent.setup();
const nodes = [
  { id: 'ibmon', name: 'src/ibmon', layer: 0, size: 91 },
  { id: 'cli', name: 'src/cli', layer: 0, size: 18 },
  { id: 'lib', name: 'src/libibtrace', layer: 1, size: 114 },
];
const edges: LayerGraphEdge[] = [
  { id: 'shm', from: 'ibmon', to: 'lib', inferred: true, label: '環境變數 `IBTRACE_SHM`' },
  { from: 'cli', to: 'lib', count: 7 },
];

function Demo({ onEdge, onBox }: { onEdge: (id: string | null) => void; onBox: (id: string | null) => void }) {
  const [box, setBox] = React.useState<string | null>(null);
  const [edge, setEdge] = React.useState<string | null>(null);
  return (
    <LayerGraph
      nodes={nodes}
      edges={edges}
      selected={box}
      onSelect={(id) => {
        onBox(id);
        setBox(id);
      }}
      selectedEdge={edge}
      onSelectEdge={(id) => {
        onEdge(id);
        setEdge(id);
      }}
      legend={false}
    />
  );
}

test('LayerGraph: without onSelectEdge, lines are not buttons', () => {
  render(<LayerGraph nodes={nodes} edges={edges} />);
  expect(screen.queryByRole('button', { name: /→/ })).toBeNull();
});

test('LayerGraph: clicking a line selects it, again clears it; the label works too', async () => {
  const onEdge = vi.fn();
  render(<Demo onEdge={onEdge} onBox={() => {}} />);
  const line = screen.getByRole('button', { name: 'src/cli → src/libibtrace，7 次' });
  await user.click(line);
  expect(onEdge).toHaveBeenLastCalledWith('cli->lib');
  expect(line.getAttribute('aria-pressed')).toBe('true');
  await user.click(line);
  expect(onEdge).toHaveBeenLastCalledWith(null);
  await user.click(screen.getByText('IBTRACE_SHM'));
  expect(onEdge).toHaveBeenLastCalledWith('shm');
  expect(screen.getByRole('button', { name: 'src/ibmon → src/libibtrace，環境變數 IBTRACE_SHM' }).getAttribute('aria-pressed')).toBe('true');
});

test('LayerGraph: a line and a box are never selected together', async () => {
  const onEdge = vi.fn();
  const onBox = vi.fn();
  render(<Demo onEdge={onEdge} onBox={onBox} />);
  await user.click(screen.getByRole('button', { name: /^src\/cli 18/ }));
  expect(onBox).toHaveBeenLastCalledWith('cli');
  await user.click(screen.getByRole('button', { name: 'src/cli → src/libibtrace，7 次' }));
  expect(onBox).toHaveBeenLastCalledWith(null);
  expect(onEdge).toHaveBeenLastCalledWith('cli->lib');
  await user.click(screen.getByRole('button', { name: /^src\/ibmon 91/ }));
  expect(onEdge).toHaveBeenLastCalledWith(null);
  expect(onBox).toHaveBeenLastCalledWith('ibmon');
});

test('LayerGraph: Tab reaches the lines after the boxes; Enter selects, Escape clears', async () => {
  const onEdge = vi.fn();
  render(<Demo onEdge={onEdge} onBox={() => {}} />);
  // The 「圖／清單」 switch, the three boxes, then the lines.
  for (let k = 0; k < 5; k++) await user.tab();
  expect(document.activeElement?.getAttribute('aria-label')).toBe('src/ibmon → src/libibtrace，環境變數 IBTRACE_SHM');
  await user.keyboard('{Enter}');
  expect(onEdge).toHaveBeenLastCalledWith('shm');
  await user.keyboard('{Escape}');
  expect(onEdge).toHaveBeenLastCalledWith(null);
  await user.tab();
  await user.keyboard(' ');
  expect(onEdge).toHaveBeenLastCalledWith('cli->lib');
});

test('LayerGraph: a click on the empty diagram clears the selected line', async () => {
  const onEdge = vi.fn();
  const { container } = render(<Demo onEdge={onEdge} onBox={() => {}} />);
  await user.click(screen.getByRole('button', { name: 'src/cli → src/libibtrace，7 次' }));
  const canvas = container.querySelector<HTMLElement>('.ui-lg-canvas');
  if (!canvas) throw new Error('no canvas');
  await user.pointer({
    keys: '[MouseLeft]',
    target: canvas,
    coords: { x: canvas.getBoundingClientRect().left + 2, y: canvas.getBoundingClientRect().top + 2 },
  });
  expect(onEdge).toHaveBeenLastCalledWith(null);
});

test('LayerGraph: hovering a selectable line makes it darker and 2 px thicker; its label underlines', async () => {
  const { container } = render(<Demo onEdge={() => {}} onBox={() => {}} />);
  const line = container.querySelectorAll<SVGPathElement>('.ui-lg-edge')[0];
  const before = Number(line.getAttribute('stroke-width'));
  await user.hover(screen.getByRole('button', { name: 'src/ibmon → src/libibtrace，環境變數 IBTRACE_SHM' }));
  expect(line.classList.contains('is-hover')).toBe(true);
  expect(Number(line.getAttribute('stroke-width'))).toBe(before + 2);
  expect(container.querySelector('.ui-lg-label')?.classList.contains('is-hover')).toBe(true);
});

test('LayerGraph: wider than its box, it shows a fade and a hint until scrolled', async () => {
  const { container } = render(
    <div style={{ width: 326 }}>
      <LayerGraph nodes={nodes} edges={edges} legend={false} />
    </div>,
  );
  const outer = container.querySelector<HTMLElement>('.ui-lg-scroller');
  const box = container.querySelector<HTMLElement>('.ui-lg-scroll');
  if (!outer || !box) throw new Error('no scroller');
  await waitFor(() => expect(outer.classList.contains('has-more')).toBe(true));
  const hint = screen.getByText('向右捲動');
  // Under the diagram, never over a box.
  expect(hint.getBoundingClientRect().top).toBeGreaterThanOrEqual(outer.getBoundingClientRect().bottom);
  box.scrollLeft = box.scrollWidth;
  box.dispatchEvent(new Event('scroll'));
  await waitFor(() => expect(outer.classList.contains('has-more')).toBe(false));
  expect(hint.classList.contains('is-done')).toBe(true);
  expect(getComputedStyle(hint).visibility).toBe('hidden');
});

test('LayerGraph: no fade or hint when it fits', async () => {
  await page.viewport(1280, 900);
  const { container } = render(<LayerGraph nodes={nodes} edges={edges} legend={false} />);
  await new Promise((r) => setTimeout(r, 50));
  expect(container.querySelector('.ui-lg-scroller')?.classList.contains('has-more')).toBe(false);
  expect(screen.queryByText(/左右滑動|向右捲動/)).toBeNull();
});

test('LayerGraph: the legend lists only the kinds of line drawn', () => {
  const { container, rerender } = render(<LayerGraph nodes={nodes} edges={[edges[0]]} />);
  const legend = () => container.querySelector('.ui-graph-legend')?.textContent ?? '';
  expect(legend()).toContain('推測的關係');
  expect(legend()).not.toContain('次數越多線越粗');
  rerender(<LayerGraph nodes={nodes} edges={[edges[1]]} />);
  expect(legend()).toContain('次數越多線越粗');
  expect(legend()).not.toContain('推測的關係');
  rerender(<LayerGraph nodes={nodes} edges={[]} />);
  expect(container.querySelector('.ui-graph-legend')).toBeNull();
});

test('LayerGraph: a shared item is a selectable box; the boxes that use it say how often', async () => {
  const onSelect = vi.fn();
  const withShared = [...nodes, { id: 'common', name: 'src/common', shared: true }];
  const uses: LayerGraphEdge[] = [...edges, { from: 'ibmon', to: 'common', count: 6 }, { from: 'lib', to: 'common', count: 3 }];
  const { container, rerender } = render(<LayerGraph nodes={withShared} edges={uses} selected={null} onSelect={onSelect} />);
  const chip = screen.getByRole('button', { name: /src\/common/ });
  expect(chip.getAttribute('aria-pressed')).toBe('false');
  await user.click(chip);
  expect(onSelect).toHaveBeenLastCalledWith('common');
  rerender(<LayerGraph nodes={withShared} edges={uses} selected="common" onSelect={onSelect} />);
  expect(chip.classList.contains('is-selected')).toBe(true);
  const badges = [...container.querySelectorAll('.ui-lg-use')].map((n) => n.textContent);
  expect(badges).toEqual(['使用 6 次', '使用 3 次']);
  const cli = screen.getByRole('button', { name: /src\/cli/ });
  expect(cli.classList.contains('is-dim')).toBe(true);
  await user.click(chip);
  expect(onSelect).toHaveBeenLastCalledWith(null);
});

// Lines to a higher layer (a data channel back up). Whatever the layout, the line and its label stay inside the
// diagram, the line passes through no box, and the label covers no box and no other label.
const top3 = [
  { id: 'ibmon', name: 'src/ibmon', layer: 0, size: 91 },
  { id: 'cli', name: 'src/cli', layer: 0, size: 18 },
  { id: 'ucx', name: 'src/ucx_ib_test', layer: 0, size: 22 },
  { id: 'lib', name: 'src/libibtrace', layer: 1, size: 114 },
  { id: 'hook', name: 'src/hooks', layer: 1, size: 40 },
];
const ring = (to: string): LayerGraphEdge => ({ id: 'up', from: 'lib', to, inferred: true, label: '經由 `src/common` 傳資料（ring）' });
const overlap = (a: DOMRect, b: DOMRect, pad = 0) => a.left < b.right - pad && b.left < a.right - pad && a.top < b.bottom - pad && b.top < a.bottom - pad;

test.each([
  ['the leftmost box (left lane)', 'ibmon'],
  ['the rightmost box (right lane)', 'ucx'],
  ['a box in the middle (from below)', 'cli'],
])('LayerGraph: a line up to %s stays inside and clear of boxes and labels', async (_, to) => {
  await page.viewport(1280, 900);
  const { container } = render(
    <LayerGraph
      nodes={top3}
      edges={[{ from: 'ibmon', to: 'lib', inferred: true, label: '環境變數 `IBTRACE_SHM`' }, { from: 'cli', to: 'hook', count: 4 }, ring(to)]}
      onSelectEdge={() => {}}
    />,
  );
  const canvas = container.querySelector<HTMLElement>('.ui-lg-canvas');
  if (!canvas) throw new Error('no canvas');
  const c = canvas.getBoundingClientRect();
  const boxes = [...container.querySelectorAll<HTMLElement>('.ui-lg-node')].map((n) => [n.textContent ?? '', n.getBoundingClientRect()] as const);
  const labels = [...container.querySelectorAll<HTMLElement>('.ui-lg-label')].map((n) => n.getBoundingClientRect());
  expect(labels.length).toBe(2);
  for (const l of labels) {
    expect(l.left).toBeGreaterThanOrEqual(c.left - 0.5);
    expect(l.right).toBeLessThanOrEqual(c.right + 0.5);
    expect(l.top).toBeGreaterThanOrEqual(c.top - 0.5);
    expect(l.bottom).toBeLessThanOrEqual(c.bottom + 0.5);
    for (const [, b] of boxes) expect(overlap(l, b)).toBe(false);
  }
  expect(overlap(labels[0], labels[1])).toBe(false);
  // The up line: every point inside the diagram and outside every box (a few px of slack where it meets its two boxes).
  const hit = container.querySelector<SVGPathElement>('.ui-lg-hit[data-edge="up"]');
  if (!hit) throw new Error('no up line');
  const len = hit.getTotalLength();
  const m = hit.getScreenCTM();
  if (!m) throw new Error('no CTM');
  for (let t = 0; t <= len; t += 4) {
    const q = hit.getPointAtLength(t);
    const x = q.x * m.a + m.e;
    const y = q.y * m.d + m.f;
    expect(x).toBeGreaterThanOrEqual(c.left - 0.5);
    expect(x).toBeLessThanOrEqual(c.right + 0.5);
    expect(y).toBeGreaterThanOrEqual(c.top - 0.5);
    expect(y).toBeLessThanOrEqual(c.bottom + 0.5);
    for (const [, b] of boxes) expect(x > b.left + 2 && x < b.right - 2 && y > b.top + 2 && y < b.bottom - 2).toBe(false);
  }
});

test('LayerGraph: a line up can be selected, hovered and used from the keyboard', async () => {
  const onEdge = vi.fn();
  const { container } = render(
    <LayerGraph
      nodes={nodes}
      edges={[...edges, { id: 'ring', from: 'lib', to: 'ibmon', inferred: true, label: '經由 `src/common` 傳資料' }]}
      onSelectEdge={onEdge}
    />,
  );
  const line = screen.getByRole('button', { name: 'src/libibtrace → src/ibmon，經由 src/common 傳資料' });
  await user.click(line);
  expect(onEdge).toHaveBeenLastCalledWith('ring');
  await user.hover(line);
  const drawn = [...container.querySelectorAll('.ui-lg-edge')].find((p) => p.classList.contains('is-hover'));
  expect(drawn).toBeTruthy();
  line.focus();
  await user.keyboard('{Enter}');
  expect(onEdge).toHaveBeenCalledTimes(2);
  await user.click(screen.getByText('src/common'));
  expect(onEdge).toHaveBeenCalledTimes(3);
});

test('LayerGraph: the list view shows every box and line as text, selectable like the diagram', async () => {
  const onEdge = vi.fn();
  const onBox = vi.fn();
  const { container } = render(<LayerGraph nodes={nodes} edges={edges} onSelect={onBox} onSelectEdge={onEdge} sizeLabel="{n} 個函式" />);
  await user.click(screen.getByRole('tab', { name: '清單' }));
  const list = container.querySelector('.ui-lg-list');
  expect(list?.textContent).toContain('src/ibmon，91 個函式');
  expect(list?.textContent).toContain('src/ibmon → src/libibtrace：環境變數 IBTRACE_SHM（推測）');
  expect(list?.textContent).toContain('src/cli → src/libibtrace：7 次');
  await user.click(screen.getByRole('button', { name: 'src/cli → src/libibtrace' }));
  expect(onEdge).toHaveBeenLastCalledWith('cli->lib');
  await user.click(screen.getByRole('button', { name: 'src/ibmon' }));
  expect(onBox).toHaveBeenLastCalledWith('ibmon');
  expect(container.querySelector('.ui-lg-scroller')?.classList.contains('is-hidden')).toBe(true);
});

test('LayerGraph: the sideways scroll comes back with the diagram', async () => {
  await page.viewport(1280, 900);
  const wide = (k: boolean) => (
    <div style={{ width: 300 }}>{k ? <LayerGraph nodes={nodes} edges={edges} legend={false} listView={false} scrollKey="keep" /> : <p>其他區塊</p>}</div>
  );
  const { container, rerender } = render(wide(true));
  const box = container.querySelector<HTMLElement>('.ui-lg-scroll');
  if (!box) throw new Error('no scroller');
  box.scrollLeft = 120;
  box.dispatchEvent(new Event('scroll'));
  rerender(wide(false));
  rerender(wide(true));
  expect(container.querySelector<HTMLElement>('.ui-lg-scroll')?.scrollLeft).toBe(120);
});

// Every label clear of every line (its own too), of every box and of every other label (2 px apart), inside the diagram.
function expectLabelsClear(container: HTMLElement) {
  const canvas = container.querySelector<HTMLElement>('.ui-lg-canvas');
  if (!canvas) throw new Error('no canvas');
  const c = canvas.getBoundingClientRect();
  const boxes = [...container.querySelectorAll<HTMLElement>('.ui-lg-canvas .ui-lg-node')].map((n) => n.getBoundingClientRect());
  const labels = [...container.querySelectorAll<HTMLElement>('.ui-lg-label')];
  const rects = labels.map((l) => l.getBoundingClientRect());
  const lines = [...container.querySelectorAll<SVGPathElement>('.ui-lg-hit')];
  labels.forEach((label, i) => {
    const r = rects[i];
    const text = label.textContent;
    expect(r.left, text ?? '').toBeGreaterThanOrEqual(c.left - 0.5);
    expect(r.right, text ?? '').toBeLessThanOrEqual(c.right + 0.5);
    expect(r.top, text ?? '').toBeGreaterThanOrEqual(c.top - 0.5);
    expect(r.bottom, text ?? '').toBeLessThanOrEqual(c.bottom + 0.5);
    for (const b of boxes) expect(overlap(r, b), `${text} on a box`).toBe(false);
    rects.forEach(
      (o, j) =>
        j !== i &&
        expect(r.left < o.right + 2 && o.left < r.right + 2 && r.top < o.bottom + 2 && o.top < r.bottom + 2, `${text} touches ${labels[j].textContent}`).toBe(
          false,
        ),
    );
    for (const line of lines) {
      const m = line.getScreenCTM();
      if (!m) throw new Error('no CTM');
      for (let t = 0; t <= line.getTotalLength(); t += 2) {
        const q = line.getPointAtLength(t);
        const x = q.x * m.a + m.e;
        const y = q.y * m.d + m.f;
        expect(x > r.left && x < r.right && y > r.top && y < r.bottom, `${text} on ${line.dataset.edge}`).toBe(false);
      }
    }
  });
}

// The same pair both ways (an environment variable down, a data channel back up), on a phone and a tablet: the label
// of the line up wraps, or the gap grows, rather than lie on the line down.
const pair = [
  { id: 'ibmon', name: 'src/ibmon', layer: 0, size: 91 },
  { id: 'ucx', name: 'src/ucx_ib_test', layer: 0, size: 22 },
  { id: 'lib', name: 'src/libibtrace', layer: 1, size: 114 },
  { id: 'common', name: 'src/common', shared: true },
];
const pairEdges: LayerGraphEdge[] = [
  { id: 'env', from: 'ibmon', to: 'lib', inferred: true, label: '環境變數 `IBTRACE_SHM`' },
  { id: 'hook', from: 'ucx', to: 'lib', inferred: true, label: '攔截 17 個 `ucp` 呼叫' },
  { from: 'ibmon', to: 'common', count: 6 },
  { id: 'ring', from: 'lib', to: 'ibmon', inferred: true, label: '經由 `src/common` 傳資料（ring）' },
];
test.each([
  [390, 844],
  [768, 1024],
])('LayerGraph: lines both ways between one pair keep every label off every line at %i px', async (w, h) => {
  await page.viewport(w, h);
  const { container } = render(<LayerGraph nodes={pair} edges={pairEdges} onSelectEdge={() => {}} />);
  expect(container.querySelectorAll('.ui-lg-label').length).toBe(3);
  expectLabelsClear(container);
});

test.each([
  ['the leftmost box (left lane)', 'ibmon'],
  ['the rightmost box (right lane)', 'ucx'],
  ['a box in the middle (from below)', 'cli'],
])('LayerGraph: a label of a line up to %s lies on no line', async (_, to) => {
  await page.viewport(390, 844);
  const { container } = render(
    <LayerGraph
      nodes={top3}
      edges={[{ from: 'ibmon', to: 'lib', inferred: true, label: '環境變數 `IBTRACE_SHM`' }, { from: 'cli', to: 'hook', count: 4 }, ring(to)]}
      onSelectEdge={() => {}}
    />,
  );
  expectLabelsClear(container);
});

test('LayerGraph: a shared item counts every item that uses it, other shared items too, like the list does', async () => {
  const { container } = render(
    <LayerGraph
      nodes={[
        { id: 'ibmon', name: 'src/ibmon', layer: 0 },
        { id: 'lib', name: 'src/libibtrace', layer: 1 },
        { id: 'common', name: 'src/common', shared: true },
        { id: 'util', name: 'src/util', shared: true },
      ]}
      edges={[
        { from: 'ibmon', to: 'lib', count: 3 },
        { from: 'ibmon', to: 'common', count: 6 },
        { from: 'lib', to: 'common', count: 7 },
        { from: 'util', to: 'common', count: 2 },
      ]}
      onSelect={() => {}}
    />,
  );
  const chip = [...container.querySelectorAll('.ui-lg-chip')].find((c) => c.textContent?.includes('src/common'));
  expect(chip?.querySelector('.ui-lg-shared-meta')?.textContent).toBe('3 個項目使用，共 15 次');
  // The list: the same three lines into src/common, 6 + 7 + 2 = 15 times.
  await userEvent.setup().click(screen.getByRole('tab', { name: '清單' }));
  const into = [...container.querySelectorAll('.ui-lg-li')].filter((li) => /→\s*src\/common：/.test(li.textContent ?? ''));
  expect(into.length).toBe(3);
  expect(into.reduce((a, li) => a + Number(/(\d+) 次/.exec(li.textContent ?? '')?.[1] ?? 0), 0)).toBe(15);
});

test('LayerGraph: an external box sits above every layer, dashed, 「repo 外」 and no size bar; selectable, lines and list as usual', async () => {
  const onSelect = vi.fn();
  const { container } = render(
    <LayerGraph
      nodes={[
        { id: 'app', name: '被追蹤的程式', external: true, size: 50 },
        { id: 'ibmon', name: 'src/ibmon', layer: 0, size: 91 },
        { id: 'lib', name: 'src/libibtrace', layer: 1, size: 114 },
      ]}
      edges={[
        { id: 'verbs', from: 'app', to: 'lib', inferred: true, label: '攔截 `verbs`' },
        { from: 'ibmon', to: 'lib', count: 3 },
      ]}
      onSelect={onSelect}
      onSelectEdge={() => {}}
    />,
  );
  const box = screen.getByRole('button', { name: '被追蹤的程式 repo 外' });
  expect(box.classList.contains('is-external')).toBe(true);
  expect(box.querySelector('.ui-lg-size')).toBeNull();
  expect(getComputedStyle(box).borderTopStyle).toBe('dashed');
  const ibmon = screen.getByRole('button', { name: /^src\/ibmon.*個項目$/ });
  expect(box.getBoundingClientRect().bottom).toBeLessThan(ibmon.getBoundingClientRect().top);
  // Its line is drawn and selectable like any other.
  expect(container.querySelector('[data-edge="verbs"]')).not.toBeNull();
  expect(screen.getByRole('button', { name: '被追蹤的程式 → src/libibtrace，攔截 verbs' })).toBeTruthy();
  await userEvent.setup().click(box);
  expect(onSelect).toHaveBeenLastCalledWith('app');
  // The list says it is outside the repository.
  await userEvent.setup().click(screen.getByRole('tab', { name: '清單' }));
  const li = [...container.querySelectorAll('.ui-lg-li')].find((l) => l.textContent?.startsWith('被追蹤的程式'));
  expect(li?.textContent).toBe('被追蹤的程式，repo 外');
});

test('LayerGraph list in English: ASCII separators, no full-width punctuation', async () => {
  setLocale('en-US');
  try {
    const { container } = render(
      <LayerGraph
        nodes={[
          { id: 'app', name: 'traced program', external: true },
          { id: 'lib', name: 'src/libibtrace', layer: 0, size: 114 },
        ]}
        edges={[{ from: 'app', to: 'lib', inferred: true, label: 'Interposes infiniband (18 functions)' }]}
        onSelectEdge={() => {}}
      />,
    );
    await userEvent.setup().click(screen.getByRole('tab', { name: 'List' }));
    const text = [...container.querySelectorAll('.ui-lg-li')].map((li) => li.textContent);
    expect(text).toEqual([
      'traced program, outside the repo',
      'src/libibtrace, 114 items',
      'traced program → src/libibtrace: Interposes infiniband (18 functions) (Inferred)',
    ]);
    expect(text.join('')).not.toMatch(/[，：（）]/);
  } finally {
    setLocale('zh-TW');
  }
});
