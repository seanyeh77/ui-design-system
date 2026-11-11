import * as React from 'react';
import { expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { LayerGraph, addMessages, format, setLocale, type LayerGraphEdge } from '../../index';

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
  expect(screen.queryByRole('button', { name: / 到 / })).toBeNull();
});

test('LayerGraph: clicking a line selects it, again clears it; the label works too', async () => {
  const onEdge = vi.fn();
  render(<Demo onEdge={onEdge} onBox={() => {}} />);
  const line = screen.getByRole('button', { name: 'src/cli 到 src/libibtrace，7 次' });
  await user.click(line);
  expect(onEdge).toHaveBeenLastCalledWith('cli->lib');
  expect(line.getAttribute('aria-pressed')).toBe('true');
  await user.click(line);
  expect(onEdge).toHaveBeenLastCalledWith(null);
  await user.click(screen.getByText('IBTRACE_SHM'));
  expect(onEdge).toHaveBeenLastCalledWith('shm');
  expect(screen.getByRole('button', { name: 'src/ibmon 到 src/libibtrace，環境變數 IBTRACE_SHM' }).getAttribute('aria-pressed')).toBe('true');
});

test('LayerGraph: a line and a box are never selected together', async () => {
  const onEdge = vi.fn();
  const onBox = vi.fn();
  render(<Demo onEdge={onEdge} onBox={onBox} />);
  await user.click(screen.getByRole('button', { name: /^src\/cli 18/ }));
  expect(onBox).toHaveBeenLastCalledWith('cli');
  await user.click(screen.getByRole('button', { name: 'src/cli 到 src/libibtrace，7 次' }));
  expect(onBox).toHaveBeenLastCalledWith(null);
  expect(onEdge).toHaveBeenLastCalledWith('cli->lib');
  await user.click(screen.getByRole('button', { name: /^src\/ibmon 91/ }));
  expect(onEdge).toHaveBeenLastCalledWith(null);
  expect(onBox).toHaveBeenLastCalledWith('ibmon');
});

test('LayerGraph: Tab reaches the lines after the boxes; Enter selects, Escape clears', async () => {
  const onEdge = vi.fn();
  render(<Demo onEdge={onEdge} onBox={() => {}} />);
  // The line-label switch, the 「圖／清單」 tabs, the three boxes, then the lines.
  for (let k = 0; k < 6; k++) await user.tab();
  expect(document.activeElement?.getAttribute('aria-label')).toBe('src/ibmon 到 src/libibtrace，環境變數 IBTRACE_SHM');
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
  await user.click(screen.getByRole('button', { name: 'src/cli 到 src/libibtrace，7 次' }));
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
  await user.hover(screen.getByRole('button', { name: 'src/ibmon 到 src/libibtrace，環境變數 IBTRACE_SHM' }));
  expect(line.classList.contains('is-hover')).toBe(true);
  expect(Number(line.getAttribute('stroke-width'))).toBe(before + 2);
  expect(container.querySelector('.ui-lg-label')?.classList.contains('is-hover')).toBe(true);
});

test('LayerGraph: wider than its box, it shows a fade and a hint until scrolled', async () => {
  // Too narrow even with 120 px boxes at 0.75: it scrolls.
  const { container } = render(
    <div style={{ width: 180 }}>
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
  const line = screen.getByRole('button', { name: 'src/libibtrace 到 src/ibmon，經由 src/common 傳資料' });
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
  expect(list?.textContent).toContain('src/ibmon →到 src/libibtrace：環境變數 IBTRACE_SHM（推測）');
  expect(list?.textContent).toContain('src/cli →到 src/libibtrace：7 次');
  await user.click(screen.getByRole('button', { name: 'src/cli 到 src/libibtrace：7 次' }));
  expect(onEdge).toHaveBeenLastCalledWith('cli->lib');
  await user.click(screen.getByRole('button', { name: 'src/ibmon' }));
  expect(onBox).toHaveBeenLastCalledWith('ibmon');
  expect(container.querySelector('.ui-lg-scroller')?.classList.contains('is-hidden')).toBe(true);
});

test('LayerGraph: the sideways scroll comes back with the diagram', async () => {
  await page.viewport(1280, 900);
  const wide = (k: boolean) => (
    <div style={{ width: 180 }}>{k ? <LayerGraph nodes={nodes} edges={edges} legend={false} listView={false} scrollKey="keep" /> : <p>其他區塊</p>}</div>
  );
  const { container, rerender } = render(wide(true));
  const box = container.querySelector<HTMLElement>('.ui-lg-scroll');
  if (!box) throw new Error('no scroller');
  box.scrollLeft = 100;
  box.dispatchEvent(new Event('scroll'));
  rerender(wide(false));
  rerender(wide(true));
  expect(container.querySelector<HTMLElement>('.ui-lg-scroll')?.scrollLeft).toBe(100);
});

test('LayerGraph: a little too wide, the boxes narrow and nothing scrolls (PM)', async () => {
  await page.viewport(1280, 900);
  const { container } = render(
    <div style={{ width: 380 }}>
      <LayerGraph nodes={nodes} edges={edges} legend={false} listView={false} />
    </div>,
  );
  const box = container.querySelector<HTMLElement>('.ui-lg-scroll');
  const canvas = container.querySelector<HTMLElement>('.ui-lg-canvas');
  if (!box || !canvas) throw new Error('no canvas');
  await waitFor(() => expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth + 1));
  expect(canvas.style.transform).toBe('');
  const w = container.querySelector<HTMLElement>('.ui-lg-node')?.getBoundingClientRect().width ?? 0;
  expect(w).toBeLessThan(200);
  expect(w).toBeGreaterThanOrEqual(120);
});

test('LayerGraph: still too wide with 120 px boxes, the diagram scales, not below 0.75 (PM)', async () => {
  await page.viewport(1280, 900);
  const { container } = render(
    <div style={{ width: 250 }}>
      <LayerGraph nodes={nodes} edges={edges} legend={false} listView={false} />
    </div>,
  );
  const box = container.querySelector<HTMLElement>('.ui-lg-scroll');
  const canvas = container.querySelector<HTMLElement>('.ui-lg-canvas');
  if (!box || !canvas) throw new Error('no canvas');
  await waitFor(() => expect(canvas.style.transform).toMatch(/^scale\(/));
  const s = Number(canvas.style.transform.slice(6, -1));
  expect(s).toBeGreaterThanOrEqual(0.75);
  expect(s).toBeLessThan(1);
  expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth + 1);
});

test('LayerGraph: edgeLabels="hover" hides line labels until the line is hovered, focused or selected', async () => {
  await page.viewport(1280, 900);
  const quiet = (c: HTMLElement) => c.querySelector('.ui-lg-label')?.classList.contains('is-quiet');
  const { container, rerender } = render(<LayerGraph nodes={nodes} edges={edges} legend={false} edgeLabels="hover" />);
  const label = container.querySelector<HTMLElement>('.ui-lg-label');
  if (!label) throw new Error('no label');
  expect(quiet(container)).toBe(true);
  expect(getComputedStyle(label).pointerEvents).toBe('none');
  // Without onSelectEdge: a hover-only path, hidden from screen readers and the keyboard.
  const peek = container.querySelector<SVGPathElement>('.ui-lg-hit.is-peek');
  if (!peek) throw new Error('no hover path');
  expect(peek.closest('svg')?.getAttribute('aria-hidden')).toBe('true');
  expect(peek.getAttribute('tabindex')).toBeNull();
  await user.hover(peek);
  expect(quiet(container)).toBe(false);
  await user.unhover(peek);
  expect(quiet(container)).toBe(true);
  // With onSelectEdge: keyboard focus and the selected line show it too.
  rerender(<LayerGraph nodes={nodes} edges={edges} legend={false} edgeLabels="hover" onSelectEdge={() => {}} />);
  const hit = container.querySelector<SVGPathElement>('.ui-lg-hit[data-edge="shm"]');
  if (!hit) throw new Error('no line button');
  hit.focus();
  await waitFor(() => expect(quiet(container)).toBe(false));
  hit.blur();
  await waitFor(() => expect(quiet(container)).toBe(true));
  rerender(<LayerGraph nodes={nodes} edges={edges} legend={false} edgeLabels="hover" onSelectEdge={() => {}} selectedEdge="shm" />);
  expect(quiet(container)).toBe(false);
  // The selected box shows the labels of its lines.
  rerender(<LayerGraph nodes={nodes} edges={edges} legend={false} edgeLabels="hover" selected="ibmon" onSelect={() => {}} />);
  expect(quiet(container)).toBe(false);
});

test('LayerGraph: the 「線上文字」 switch shows or hides line labels and remembers the choice', async () => {
  await page.viewport(1280, 900);
  window.localStorage.removeItem('ui-lg-labels:tc');
  const quiet = (c: HTMLElement) => c.querySelector('.ui-lg-label')?.classList.contains('is-quiet');
  const graph = (extra: Partial<React.ComponentProps<typeof LayerGraph>> = {}) => (
    <LayerGraph nodes={nodes} edges={edges} legend={false} scrollKey="tc" {...extra} />
  );
  const { container, unmount } = render(graph());
  const btn = screen.getByRole('switch', { name: '線上文字' });
  expect(btn.getAttribute('aria-checked')).toBe('true');
  // Its text is on screen too, not only the screen reader's name.
  expect(container.querySelector('.ui-lg-labels-switch')?.textContent).toBe('線上文字');
  // Beside 「圖／清單」, on its left.
  const tabs = screen.getByRole('tablist', { name: '顯示方式' });
  expect((container.querySelector('.ui-lg-labels-switch') as HTMLElement).getBoundingClientRect().right).toBeLessThanOrEqual(tabs.getBoundingClientRect().left);
  expect(quiet(container)).toBe(false);
  // A click on the text switches too.
  await user.click(screen.getByText('線上文字'));
  expect(btn.getAttribute('aria-checked')).toBe('false');
  expect(quiet(container)).toBe(true);
  expect(window.localStorage.getItem('ui-lg-labels:tc')).toBe('0');
  unmount();
  // Comes back hidden, even though edgeLabels says shown.
  const again = render(graph());
  expect(quiet(again.container)).toBe(true);
  again.unmount();
  window.localStorage.removeItem('ui-lg-labels:tc');
  // Not on the list, and gone with labelToggle={false}.
  const list = render(graph({ edgeLabels: 'hover' }));
  expect(screen.getByRole('switch', { name: '線上文字' }).getAttribute('aria-checked')).toBe('false');
  await user.click(screen.getByRole('tab', { name: '清單' }));
  expect(screen.queryByRole('switch', { name: '線上文字' })).toBeNull();
  list.unmount();
  render(graph({ labelToggle: false }));
  expect(screen.queryByRole('switch', { name: '線上文字' })).toBeNull();
});

test('LayerGraph: labelToggle="icon" keeps the tag button, a toggle button with a fixed name (TC)', async () => {
  window.localStorage.removeItem('ui-lg-labels:tci');
  const { container } = render(<LayerGraph nodes={nodes} edges={edges} legend={false} scrollKey="tci" labelToggle="icon" />);
  expect(screen.queryByRole('switch')).toBeNull();
  const btn = screen.getByRole('button', { name: '顯示線上文字' });
  expect(btn.getAttribute('aria-pressed')).toBe('true');
  await user.click(btn);
  expect(btn.getAttribute('aria-pressed')).toBe('false');
  expect(screen.getByRole('button', { name: '顯示線上文字' })).toBe(btn);
  expect(container.querySelector('.ui-lg-label')?.classList.contains('is-quiet')).toBe(true);
  window.localStorage.removeItem('ui-lg-labels:tci');
});

test('LayerGraph: the line-label switch works when storage throws', async () => {
  const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const { container } = render(<LayerGraph nodes={nodes} edges={edges} legend={false} scrollKey="tc2" />);
  await user.click(screen.getByRole('switch', { name: '線上文字' }));
  expect(container.querySelector('.ui-lg-label')?.classList.contains('is-quiet')).toBe(true);
  get.mockRestore();
  set.mockRestore();
});

test('LayerGraph: labels are shown by default', () => {
  const { container } = render(<LayerGraph nodes={nodes} edges={edges} legend={false} />);
  expect(container.querySelector('.ui-lg-label.is-quiet')).toBeNull();
  expect(container.querySelector('.ui-lg-hit.is-peek')).toBeNull();
});

// Every label clear of every line (its own too), of every box and of every other label (2 px apart), inside the diagram.
function expectLabelsClear(container: HTMLElement) {
  const canvas = container.querySelector<HTMLElement>('.ui-lg-canvas');
  if (!canvas) throw new Error('no canvas');
  const c = canvas.getBoundingClientRect();
  const boxes = [...container.querySelectorAll<HTMLElement>('.ui-lg-canvas .ui-lg-node')].map((n) => n.getBoundingClientRect());
  // A numbered line's text (NA+B) shows over the lines on hover only, on its ground: not a label in place.
  const labels = [...container.querySelectorAll<HTMLElement>('.ui-lg-label:not(.is-numbered)')];
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
  const into = [...container.querySelectorAll('.ui-lg-li')].filter((li) => /→到\s*src\/common：/.test(li.textContent ?? ''));
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
  expect(screen.getByRole('button', { name: '被追蹤的程式 到 src/libibtrace，攔截 verbs' })).toBeTruthy();
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
      'traced program →to src/libibtrace: Interposes infiniband (18 functions) (Inferred)',
    ]);
    expect(text.join('')).not.toMatch(/[，：（）]/);
  } finally {
    setLocale('zh-TW');
  }
});

// MA: several labelled lines into one box, long English labels: each label next to its own line, no line through any
// label, nothing cut off.
const intercepts: LayerGraphEdge[] = [
  { id: 'verbs', from: 'app', to: 'lib', inferred: true, label: 'Interposes infiniband (18 functions)' },
  { id: 'ucp', from: 'app', to: 'lib', inferred: true, label: 'Interposes ucp (12 functions)' },
  { id: 'uct', from: 'app', to: 'lib', inferred: true, label: 'Interposes uct (9 functions)' },
  { id: 'env', from: 'ibmon', to: 'lib', inferred: true, label: 'Environment variable `IBTRACE_SHM`' },
  { from: 'ibmon', to: 'common', count: 6 },
];
test.each([
  [1280, 900],
  [390, 844],
])('LayerGraph: several labelled lines into one box keep every label by its own line, whole, at %i px', async (w, h) => {
  await page.viewport(w, h);
  const { container } = render(
    <LayerGraph
      nodes={[
        { id: 'app', name: 'traced program', external: true },
        { id: 'ibmon', name: 'src/ibmon', layer: 0, size: 91 },
        { id: 'lib', name: 'src/libibtrace', layer: 1, size: 114 },
        { id: 'common', name: 'src/common', shared: true },
      ]}
      edges={intercepts}
      onSelectEdge={() => {}}
    />,
  );
  expect(container.querySelectorAll('.ui-lg-label').length).toBe(4);
  expectLabelsClear(container);
  for (const label of container.querySelectorAll<HTMLElement>('.ui-lg-label')) {
    const text = label.textContent ?? '';
    expect(text).not.toContain('…');
    // Its own line passes within 12 px of it.
    const own = [...container.querySelectorAll<SVGPathElement>('.ui-lg-hit')].find((p) =>
      (p.getAttribute('aria-label') ?? '').replace(/\s/g, '').endsWith(text.replace(/\s/g, '')),
    );
    if (!own) throw new Error('no line for ' + text);
    const r = label.getBoundingClientRect();
    const m = own.getScreenCTM();
    if (!m) throw new Error('no CTM');
    let near = Infinity;
    for (let t = 0; t <= own.getTotalLength(); t += 2) {
      const q = own.getPointAtLength(t);
      const x = q.x * m.a + m.e;
      const y = q.y * m.d + m.f;
      near = Math.min(near, Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom)));
    }
    expect(near, text).toBeLessThanOrEqual(12);
  }
});

test('LayerGraph: the tag button shows the filled tag while pressed', async () => {
  window.localStorage.removeItem('ui-lg-labels:tc3');
  render(<LayerGraph nodes={nodes} edges={edges} legend={false} scrollKey="tc3" labelToggle="icon" />);
  const btn = screen.getByRole('button', { name: '顯示線上文字' });
  const markup = () => btn.querySelector('svg')?.innerHTML ?? '';
  const pressed = markup();
  await user.click(btn);
  expect(markup()).not.toBe(pressed);
  window.localStorage.removeItem('ui-lg-labels:tc3');
});

// codemap's ibtrace map (round 5): three interpose lines and an environment variable into one box, a same-layer
// channel and an up channel with the same label, a channel down. At its desktop column and on a phone.
const cmNodes = [
  { id: 'ext', name: '被追蹤的程式', external: true },
  { id: 'ibmon', name: 'src/ibmon', layer: 0, size: 26 },
  { id: 'cli', name: 'src/cli', layer: 0, size: 26 },
  { id: 'lib', name: 'src/libibtrace', layer: 1, size: 26 },
  { id: 'common', name: 'src/common', layer: 2, size: 13 },
];
const cmEdges = [
  { id: 'ucp', from: 'ext', to: 'lib', inferred: true, label: '攔截 `ucp`（10 個函式）' },
  { id: 'uct', from: 'ext', to: 'lib', inferred: true, label: '攔截 `uct`（8 個函式）' },
  { id: 'verbs', from: 'ext', to: 'lib', inferred: true, label: '攔截 `verbs`（8 個函式）' },
  { id: 'c1', from: 'ibmon', to: 'common', count: 20 },
  { id: 'c2', from: 'cli', to: 'common', count: 20 },
  { id: 'c3', from: 'lib', to: 'common', count: 52 },
  { id: 'env', from: 'ibmon', to: 'lib', inferred: true, label: '環境變數 `IBTRACE_SHM`' },
  { id: 'x1', from: 'cli', to: 'ibmon', inferred: true, label: '經由 `execvp` 傳資料（執行 ibmon）' },
  { id: 'x2', from: 'lib', to: 'ibmon', inferred: true, label: '經由 `execvp` 傳資料（執行 ibmon）' },
  { id: 'ring', from: 'ibmon', to: 'common', inferred: true, label: '經由 `src/common` 傳資料（ring）' },
];
for (const w of [620, 358]) {
  test(`LayerGraph: codemap's map at ${w} px, no line through any label`, async () => {
    await page.viewport(1280, 900);
    const { container } = render(
      <div style={{ width: w }}>
        <LayerGraph nodes={cmNodes} edges={cmEdges} legend={false} onSelectEdge={() => {}} externalLabel="repo 外" />
      </div>,
    );
    await new Promise((r) => setTimeout(r, 200));
    expectLabelsClear(container);
  });
}

test('LayerGraph: two lines with the same label each get their source in front', () => {
  render(<LayerGraph nodes={cmNodes} edges={cmEdges} legend={false} onSelectEdge={() => {}} />);
  // A label may wrap (<br>): compared without spaces.
  const texts = [...document.querySelectorAll('.ui-lg-label')].map((l) => (l.textContent ?? '').replace(/\s/g, ''));
  expect(texts).toContain('來自src/cli，經由execvp傳資料（執行ibmon）');
  expect(texts).toContain('來自src/libibtrace，經由execvp傳資料（執行ibmon）');
  expect(texts).toContain('環境變數IBTRACE_SHM');
  expect(screen.getByRole('button', { name: 'src/cli 到 src/ibmon，來自 src/cli，經由 execvp 傳資料（執行 ibmon）' })).toBeTruthy();
});

test('LayerGraph: a line between two boxes of one layer runs under the row, into the bottom of its target', async () => {
  await page.viewport(1280, 900);
  const { container } = render(
    <LayerGraph
      nodes={[
        { id: 'a', name: 'src/cli', layer: 0 },
        { id: 'b', name: 'src/ibmon', layer: 0 },
      ]}
      edges={[{ id: 'x', from: 'a', to: 'b', inferred: true, label: '執行 ibmon' }]}
      legend={false}
      onSelectEdge={() => {}}
    />,
  );
  const boxes = [...container.querySelectorAll<HTMLElement>('.ui-lg-node')].map((n) => n.getBoundingClientRect());
  const line = container.querySelector<SVGPathElement>('.ui-lg-hit');
  const m = line?.getScreenCTM();
  if (!line || !m) throw new Error('no line');
  // No point of the line is inside a box.
  for (let t = 0; t <= line.getTotalLength(); t += 2) {
    const q = line.getPointAtLength(t);
    const x = q.x * m.a + m.e;
    const y = q.y * m.d + m.f;
    for (const b of boxes) expect(x > b.left + 1 && x < b.right - 1 && y > b.top + 1 && y < b.bottom - 1).toBe(false);
  }
  expectLabelsClear(container);
});

test('LayerGraph: the external box keeps its whole name when the boxes narrow', async () => {
  await page.viewport(1280, 900);
  const { container } = render(
    <div style={{ width: 358 }}>
      <LayerGraph nodes={cmNodes.map((n) => (n.external ? { ...n, name: 'Traced program' } : n))} edges={cmEdges} legend={false} />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 200));
  const name = container.querySelector<HTMLElement>('.ui-lg-node.is-external .ui-lg-name');
  if (!name) throw new Error('no external box');
  expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
});

test('LayerGraph list: each relation button is named with its description, not only 「A → B」', async () => {
  render(<LayerGraph nodes={cmNodes} edges={cmEdges} legend={false} onSelectEdge={() => {}} countLabel={(n) => (n === 1 ? '1 call' : `${n} calls`)} />);
  await user.click(screen.getByRole('tab', { name: '清單' }));
  const names = screen.getAllByRole('button', { name: /^被追蹤的程式 到 src\/libibtrace/ }).map((b) => b.textContent);
  expect(names).toHaveLength(3);
  expect(new Set(names).size).toBe(3);
  expect(screen.getByRole('button', { name: 'src/ibmon 到 src/common：20 calls' })).toBeTruthy();
});

test('LayerGraph: countLabel and sizeLabel can be functions of the number; English says 「1 call」', async () => {
  setLocale('en');
  try {
    const { container } = render(
      <LayerGraph
        nodes={[
          { id: 'a', name: 'a', layer: 0, size: 1 },
          { id: 'b', name: 'b', layer: 1, size: 1033 },
        ]}
        edges={[{ id: 'x', from: 'a', to: 'b', count: 1 }]}
        selected="a"
        onSelect={() => {}}
        legend={false}
        sizeLabel={(n) => (n === 1 ? '1 function' : `${format.number(n)} functions`)}
      />,
    );
    const counts = [...container.querySelectorAll('.ui-lg-count')].map((e) => e.textContent);
    expect(counts).toEqual(['1 function', '1,033 functions']);
    expect([...container.querySelectorAll('.ui-lg-label')].map((e) => e.textContent)).toContain('1 call');
  } finally {
    setLocale('zh-TW');
  }
});

test('LayerGraph: lines without a label of their own get no source in front', () => {
  render(
    <LayerGraph
      nodes={[
        { id: 'a', name: 'a', layer: 0 },
        { id: 'b', name: 'b', layer: 0 },
        { id: 'c', name: 'c', layer: 1 },
      ]}
      edges={[
        { id: 'x', from: 'a', to: 'c', inferred: true },
        { id: 'y', from: 'b', to: 'c', inferred: true },
      ]}
      legend={false}
    />,
  );
  const texts = [...document.querySelectorAll('.ui-lg-label')].map((l) => l.textContent);
  expect(texts).toEqual(['推測', '推測']);
});

test('LayerGraph: a language without its own 「1 次」 uses its {n} form', () => {
  addMessages('de', { '{n} 次': '{n} Aufrufe' });
  setLocale('de');
  try {
    render(
      <LayerGraph
        nodes={[
          { id: 'a', name: 'a', layer: 0 },
          { id: 'b', name: 'b', layer: 1 },
        ]}
        edges={[{ id: 'x', from: 'a', to: 'b', count: 1 }]}
        selected="a"
        onSelect={() => {}}
        legend={false}
      />,
    );
    expect([...document.querySelectorAll('.ui-lg-label')].map((l) => l.textContent)).toEqual(['1 Aufrufe']);
  } finally {
    setLocale('zh-TW');
  }
});

// The ibtrace architecture as codemap draws it (0.11.0 feedback): five labelled lines into one box.
const ibNodes = [
  { id: 'ext', name: '被追蹤的程式', external: true },
  { id: 'analysis', name: 'analysis（Python）', layer: 0 },
  { id: 'cluster', name: 'cluster（Python）', layer: 0 },
  { id: 'ibmon', name: 'src/ibmon', layer: 1, size: 91 },
  { id: 'ucx', name: 'src/ucx_ib_test', layer: 1, size: 22 },
  { id: 'lib', name: 'src/libibtrace', layer: 2, size: 114 },
  { id: 'common', name: 'src/common', layer: 3, size: 13, shared: true },
];
const ibEdges: LayerGraphEdge[] = [
  { id: 'ib', from: 'ext', to: 'lib', inferred: true, label: '攔截 `infiniband`（18 個函式）' },
  { id: 'ucp', from: 'ext', to: 'lib', inferred: true, label: '攔截 `ucp`（11 個函式）' },
  { id: 'uct', from: 'ext', to: 'lib', inferred: true, label: '攔截 `uct`（4 個函式）' },
  { id: 'launch', from: 'ucx', to: 'ext', inferred: true, label: '啟動（execvp, fork），設定 LD_PRELOAD' },
  { id: 'a', from: 'analysis', to: 'ibmon', inferred: true, label: '執行 `ibmon`' },
  { id: 'c', from: 'cluster', to: 'ibmon', inferred: true, label: '執行 `ibmon`' },
  { id: 'cu', from: 'cluster', to: 'ucx', inferred: true, label: '執行 `ucx_ib_test`' },
  { id: 'env', from: 'ibmon', to: 'lib', inferred: true, label: '環境變數 `IBTRACE_SHM`' },
  { id: 'u17', from: 'ucx', to: 'lib', inferred: true, label: '攔截 17 次 `ucp` 呼叫' },
  { from: 'ibmon', to: 'common', count: 12 },
];

test('LayerGraph: a diagram that grows past its box after the boxes narrow (labels, lanes) scales down instead of scrolling (PM)', async () => {
  await page.viewport(1366, 900);
  const { container } = render(
    <div style={{ width: 590 }}>
      <LayerGraph nodes={ibNodes} edges={ibEdges} onSelectEdge={() => {}} />
    </div>,
  );
  const scroll = container.querySelector<HTMLElement>('.ui-lg-scroll');
  const canvas = container.querySelector<HTMLElement>('.ui-lg-canvas');
  if (!scroll || !canvas) throw new Error('no diagram');
  await waitFor(() => expect(canvas.style.transform).toMatch(/scale\(0\.\d+\)/));
  await waitFor(() => expect(scroll.scrollWidth).toBeLessThanOrEqual(scroll.clientWidth + 1));
});

test('LayerGraph: labels keep a visible gap from each other; one that must cross a line hides the line behind it', async () => {
  await page.viewport(1440, 900);
  const { container } = render(
    <div style={{ width: 664 }}>
      <LayerGraph nodes={ibNodes} edges={ibEdges} onSelectEdge={() => {}} />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 300));
  const boxes = [...container.querySelectorAll<HTMLElement>('.ui-lg-label')].map((l) => ({ t: l.textContent, r: l.getBoundingClientRect() }));
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].r;
      const b = boxes[j].r;
      const apart = Math.max(a.left, b.left) - Math.min(a.right, b.right) >= 2 || Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom) >= 2;
      expect(apart, `${boxes[i].t} / ${boxes[j].t}`).toBe(true);
    }
  for (const l of container.querySelectorAll<HTMLElement>('.ui-lg-label.is-over')) expect(getComputedStyle(l).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('LayerGraph: a wrapped label never starts a line with a comma', async () => {
  await page.viewport(1440, 900);
  const { container } = render(
    <div style={{ width: 664 }}>
      <LayerGraph nodes={ibNodes} edges={ibEdges} onSelectEdge={() => {}} />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 300));
  for (const l of container.querySelectorAll<HTMLElement>('.ui-lg-label'))
    for (const line of l.innerText.split('\n')) expect(line.trim()).not.toMatch(/^[,，、]/);
});

test('LayerGraph: a declared edge has long-short dashes, its label, 「宣告」 in the list and its own legend entry (DC)', async () => {
  const { container } = render(
    <LayerGraph
      nodes={nodes}
      edges={[
        { id: 'ring', from: 'lib', to: 'ibmon', declared: true, label: '經由 `src/common` 傳資料（ring）' },
        { id: 'shm', from: 'ibmon', to: 'lib', inferred: true, label: '環境變數 `IBTRACE_SHM`' },
      ]}
      declaredText="由 rules.json 宣告"
    />,
  );
  const lines = [...container.querySelectorAll<SVGPathElement>('.ui-lg-edge')];
  expect(lines.filter((l) => l.classList.contains('is-declared'))).toHaveLength(1);
  expect(lines.filter((l) => l.classList.contains('is-inferred'))).toHaveLength(1);
  const dash = getComputedStyle(container.querySelector('.ui-lg-edge.is-declared') as Element).strokeDasharray;
  expect(dash).not.toBe(getComputedStyle(container.querySelector('.ui-lg-edge.is-inferred') as Element).strokeDasharray);
  // An up line's label may wrap: compare without the spaces.
  expect([...container.querySelectorAll('.ui-lg-label')].map((l) => l.textContent?.replace(/\s/g, ''))).toContain('經由src/common傳資料（ring）');
  const legend = container.querySelector('.ui-graph-legend')?.textContent ?? '';
  expect(legend).toContain('推測的關係');
  expect(legend).toContain('專案宣告的關係');
  expect(container.querySelector('.ui-graph-legend .ui-graph-edge.is-declared')).not.toBeNull();
  await user.click(screen.getByRole('tab', { name: '清單' }));
  expect(screen.getByText(/傳資料（ring）（宣告）/)).toBeTruthy();
});

test('LayerGraph: too wide even at 0.75, it scrolls with the boxes back at their own width, names whole (WA)', async () => {
  await page.viewport(390, 844);
  const { container } = render(
    <div style={{ width: 326 }}>
      <LayerGraph nodes={ibNodes} edges={ibEdges} />
    </div>,
  );
  const scroll = container.querySelector<HTMLElement>('.ui-lg-scroll');
  if (!scroll) throw new Error('no diagram');
  await waitFor(() => expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth));
  await waitFor(() => {
    for (const n of container.querySelectorAll<HTMLElement>('.ui-lg-name')) expect(n.scrollWidth).toBeLessThanOrEqual(n.clientWidth + 1);
  });
  expect(container.querySelector<HTMLElement>('.ui-lg-canvas')?.style.transform ?? '').toBe('');
  await page.viewport(1280, 800);
});

test('LayerGraph list in English: no gap before the comma after a box name', async () => {
  setLocale('en');
  try {
    const { container } = render(<LayerGraph nodes={nodes} edges={edges} onSelect={() => {}} />);
    await user.click(screen.getByRole('tab', { name: 'List' }));
    const li = container.querySelector('.ui-lg-li');
    const name = li?.querySelector('.ui-lg-libtn .ui-lg-code');
    const meta = li?.querySelector(':scope > .ui-lg-limeta');
    if (!name || !meta) throw new Error('no list item');
    expect(meta.textContent?.startsWith(',')).toBe(true);
    expect(meta.getBoundingClientRect().left - name.getBoundingClientRect().right).toBeLessThan(1.5);
  } finally {
    setLocale('zh-TW');
  }
});

test('LayerGraph: a line up gets its label nearer its own line than any other line', async () => {
  await page.viewport(1440, 900);
  const up: LayerGraphEdge = { id: 'launch', from: 'ibmon', to: 'ext', inferred: true, label: '啟動（execvp, fork），設定 LD_PRELOAD' };
  const list = [...ibEdges.filter((e) => e.id !== 'launch'), up];
  const { container } = render(
    <div style={{ width: 1000 }}>
      <LayerGraph nodes={ibNodes} edges={list} onSelectEdge={() => {}} />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 300));
  const drawn = list.filter((e) => e.to !== 'common');
  const paths = [...container.querySelectorAll<SVGPathElement>('path.ui-lg-edge')];
  expect(paths).toHaveLength(drawn.length);
  const svg = container.querySelector('.ui-lg-canvas svg') as SVGSVGElement;
  const o = svg.getBoundingClientRect();
  const dist = (path: SVGPathElement, r: DOMRect) => {
    let best = Infinity;
    for (let t = 0; t <= path.getTotalLength(); t += 2) {
      const p = path.getPointAtLength(t);
      const x = o.left + p.x;
      const y = o.top + p.y;
      best = Math.min(best, Math.hypot(Math.max(0, r.left - x, x - r.right), Math.max(0, r.top - y, y - r.bottom)));
    }
    return best;
  };
  const label = [...container.querySelectorAll<HTMLElement>('.ui-lg-label')].find((l) => l.textContent?.replace(/\s/g, '').startsWith('啟動'));
  if (!label) throw new Error('no label');
  const r = label.getBoundingClientRect();
  const own = dist(paths[drawn.indexOf(up)], r);
  const others = paths.filter((_, i) => drawn[i] !== up).map((p) => dist(p, r));
  expect(own, `label ${JSON.stringify(r)}, own ${own}, others ${others.join(' ')}`).toBeLessThan(Math.min(...others));
});

test('LayerGraph list: every relation can be selected, one into a shared item too, by click, Enter or Space', async () => {
  const onEdge = vi.fn();
  function ListDemo() {
    const [e, setE] = React.useState<string | null>(null);
    return (
      <LayerGraph
        nodes={ibNodes}
        edges={ibEdges}
        selectedEdge={e}
        onSelectEdge={(id) => {
          onEdge(id);
          setE(id);
        }}
      />
    );
  }
  render(<ListDemo />);
  await user.click(screen.getByRole('tab', { name: '清單' }));
  const shared = screen.getByRole('button', { name: /src\/ibmon 到 src\/common/ });
  expect(shared.getAttribute('aria-pressed')).toBe('false');
  await user.click(shared);
  expect(onEdge).toHaveBeenLastCalledWith('ibmon->common');
  expect(shared.getAttribute('aria-pressed')).toBe('true');
  const env = screen.getByRole('button', { name: /環境變數/ });
  env.focus();
  await user.keyboard('{Enter}');
  expect(onEdge).toHaveBeenLastCalledWith('env');
  expect(env.getAttribute('aria-pressed')).toBe('true');
  expect(shared.getAttribute('aria-pressed')).toBe('false');
  await user.keyboard(' ');
  expect(onEdge).toHaveBeenLastCalledWith(null);
});

test('LayerGraph on a phone: starts at the boxes, the leftmost whole; a box selected later scrolls into view', async () => {
  await page.viewport(412, 915);
  function Pick() {
    const [s, setS] = React.useState<string | null>(null);
    return (
      <div style={{ width: 348 }}>
        <button type="button" onClick={() => setS('ucx')}>
          選 ucx
        </button>
        <LayerGraph nodes={ibNodes} edges={ibEdges} selected={s} onSelect={setS} scrollKey="phone-start" />
      </div>
    );
  }
  const { container } = render(<Pick />);
  const scroll = container.querySelector<HTMLElement>('.ui-lg-scroll');
  if (!scroll) throw new Error('no diagram');
  await waitFor(() => expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth));
  const s = scroll.getBoundingClientRect();
  const boxes = () => [...container.querySelectorAll<HTMLElement>('.ui-lg-node')];
  await waitFor(() => {
    const left = Math.min(...boxes().map((b) => b.getBoundingClientRect().left));
    expect(left).toBeGreaterThanOrEqual(s.left);
    expect(left - s.left).toBeLessThan(24);
  });
  await user.click(screen.getByRole('button', { name: '選 ucx' }));
  await waitFor(() => {
    const el = boxes().find((x) => x.textContent?.includes('src/ucx_ib_test'));
    if (!el) throw new Error('no src/ucx_ib_test');
    const b = el.getBoundingClientRect();
    expect(b.left).toBeGreaterThanOrEqual(s.left - 0.5);
    expect(b.right).toBeLessThanOrEqual(s.right + 0.5);
  });
  await page.viewport(1280, 800);
});

test('LayerGraph: a line up never runs behind a box, also after a label written out on the left moved the boxes', async () => {
  await page.viewport(1366, 768);
  const up: LayerGraphEdge = { id: 'launch', from: 'ibmon', to: 'ext', inferred: true, label: '啟動（execvp, fork），設定 LD_PRELOAD' };
  const list = [
    ...ibEdges.filter((e) => e.id !== 'launch'),
    { id: 'far', from: 'analysis', to: 'ibmon', inferred: true, label: '來自 analysis（Python），執行 ibmon 與其他許多工具' },
    up,
  ];
  for (const w of [1000, 664]) {
    const { container, unmount } = render(
      <div style={{ width: w }}>
        <LayerGraph nodes={ibNodes} edges={list} onSelectEdge={() => {}} />
      </div>,
    );
    await new Promise((r) => setTimeout(r, 300));
    const drawn = list.filter((e) => e.to !== 'common');
    const path = [...container.querySelectorAll<SVGPathElement>('path.ui-lg-edge')][drawn.indexOf(up)];
    const svg = container.querySelector<SVGSVGElement>('.ui-lg-canvas svg');
    if (!svg) throw new Error('no svg');
    const o = svg.getBoundingClientRect();
    const boxes = [...container.querySelectorAll<HTMLElement>('.ui-lg-node')].filter((b) => !/src\/ibmon|被追蹤的程式/.test(b.textContent ?? ''));
    const sx = o.width / Number(svg.getAttribute('width'));
    for (let t = 0; t <= path.getTotalLength(); t += 3) {
      const pt = path.getPointAtLength(t);
      const x = o.left + pt.x * sx;
      const y = o.top + pt.y * sx;
      for (const b of boxes) {
        const r = b.getBoundingClientRect();
        expect(x > r.left + 1 && x < r.right - 1 && y > r.top + 1 && y < r.bottom - 1, `${w} px: behind ${b.textContent}`).toBe(false);
      }
    }
    unmount();
  }
});

test('LayerGraph: a label with no spot of its own becomes a number on its line, listed under the diagram (NA+B)', async () => {
  await page.viewport(1440, 900);
  // ibtrace's three interpose lines into one box: 「攔截 ucp」, the middle one, has no spot of its own.
  const crowd: LayerGraphEdge[] = [
    { id: 'ib', from: 'ext', to: 'lib', inferred: true, label: '攔截 `infiniband`（18 個函式）' },
    { id: 'ucp', from: 'ext', to: 'lib', inferred: true, label: '攔截 `ucp`（11 個函式）' },
    { id: 'uct', from: 'ext', to: 'lib', inferred: true, label: '攔截 `uct`（4 個函式）' },
    { id: 'env', from: 'ibmon', to: 'lib', inferred: true, label: '環境變數 `IBTRACE_SHM`' },
    { id: 'u17', from: 'ucx', to: 'lib', inferred: true, label: '17 處 `ucp` 呼叫被攔截' },
  ];
  const { container } = render(
    <div style={{ width: 590 }}>
      <LayerGraph nodes={ibNodes.filter((n) => !n.shared)} edges={crowd} onSelectEdge={() => {}} />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 300));
  await waitFor(() => expect(container.querySelectorAll('.ui-lg-canvas .ui-lg-num').length).toBeGreaterThan(0));
  const dots = [...container.querySelectorAll<HTMLElement>('.ui-lg-canvas .ui-lg-num')];
  const list = screen.getByRole('list', { name: '編號的線' });
  expect(list.querySelectorAll('li')).toHaveLength(dots.length);
  // Hidden until the line is hovered; then the full text shows.
  const hidden = container.querySelector<HTMLElement>('.ui-lg-label.is-numbered');
  if (!hidden) throw new Error('no numbered label');
  expect(getComputedStyle(hidden).visibility).toBe('hidden');
  await user.hover(dots[0]);
  await waitFor(() => expect(container.querySelector<HTMLElement>('.ui-lg-label.is-numbered.is-shown')).not.toBeNull());
  // Every label still on the diagram reads as its own line's: none sits over another label.
  expectLabelsClear(container);
});

// TAW: a short tag beside the name; the name is cut first, the tag never; warning tags carry a lock; list and names too.
test('LayerGraph: tag stays whole beside a cut name, in the list and in the name; warning has a lock (TAW)', async () => {
  const { container } = render(
    <div style={{ width: 680 }}>
      <LayerGraph
        nodes={[
          { id: 'c', name: 'controller_with_a_long_name.py', layer: 0, size: 88, tag: '可修改' },
          { id: 'r', name: 'routing_with_a_long_name.py', layer: 0, size: 64, tag: '受保護', tagTone: 'warning' },
          { id: 't', name: 'topology_builder_long.py', layer: 0, size: 41 },
        ]}
        edges={[]}
        onSelect={() => {}}
      />
    </div>,
  );
  const box = screen.getByRole('button', { name: /^controller_with_a_long_name\.py 可修改/ });
  const name = box.querySelector('.ui-lg-name') as HTMLElement;
  const tag = box.querySelector('.ui-lg-tag') as HTMLElement;
  expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
  expect(tag.scrollWidth).toBeLessThanOrEqual(tag.clientWidth);
  expect(tag.getBoundingClientRect().right).toBeLessThanOrEqual(box.getBoundingClientRect().right);
  expect(tag.querySelector('svg')).toBeNull();
  const warn = screen.getByRole('button', { name: /^routing_with_a_long_name\.py 受保護/ }).querySelector('.ui-lg-tag');
  expect(warn?.classList.contains('is-warning')).toBe(true);
  expect(warn?.querySelector('svg')).not.toBeNull();
  await user.click(screen.getByRole('tab', { name: '清單' }));
  const items = [...container.querySelectorAll('.ui-lg-li')].map((li) => li.textContent);
  expect(items[0]).toBe('controller_with_a_long_name.py可修改，88 個項目');
  expect(screen.getByRole('button', { name: 'routing_with_a_long_name.py 受保護' })).toBeTruthy();
});

// T option 1: on a phone the tag would leave fewer than 8 characters of a name: every tag goes on its own line.
test('LayerGraph: tags move under the names when a name would keep fewer than 8 characters', () => {
  const { container } = render(
    <div style={{ width: 300 }}>
      <LayerGraph
        nodes={[
          { id: 'cli', name: 'src/cli', layer: 0, size: 34 },
          { id: 'server', name: 'src/server', layer: 0, size: 88, tag: '受保護', tagTone: 'warning' },
        ]}
        edges={[]}
      />
    </div>,
  );
  const boxes = [...container.querySelectorAll<HTMLElement>('.ui-lg-node')];
  expect(boxes.every((b) => b.style.height === '76px')).toBe(true);
  const server = boxes[1];
  expect(server.querySelector('.ui-lg-head .ui-lg-tag')).toBeNull();
  expect(server.querySelector(':scope > .ui-lg-tag')?.textContent).toBe('受保護');
  const name = server.querySelector('.ui-lg-name') as HTMLElement;
  expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
});

test('LayerGraph toolbar: the page own switch on the same row as 「圖／清單」, at its left', () => {
  render(
    <div style={{ width: 880 }}>
      <LayerGraph nodes={[{ id: 'a', name: 'a.py', layer: 0, size: 3 }]} edges={[]} toolbar={<button type="button">依檔案</button>} />
    </div>,
  );
  const own = screen.getByRole('button', { name: '依檔案' }).getBoundingClientRect();
  const view = screen.getByRole('tab', { name: '圖' }).getBoundingClientRect();
  expect(Math.abs(own.top + own.height / 2 - (view.top + view.height / 2))).toBeLessThan(2);
  expect(own.right).toBeLessThan(view.left);
});

// HC: the height handle under the diagram.
const tall = [
  { id: 'a', name: 'controller.py', layer: 0, size: 25 },
  { id: 'b', name: 'runtime.py', layer: 1, size: 37 },
  { id: 'c', name: 'model.py', layer: 2, size: 17 },
];
const tallEdges = [
  { from: 'a', to: 'b', count: 3 },
  { from: 'b', to: 'c', count: 2 },
];

test('LayerGraph resizable (HC): down spreads the layers, up past the drawn height scrolls in a shorter frame, Enter goes back', async () => {
  await page.viewport(1280, 900);
  const user = userEvent.setup();
  const { container } = render(
    <div style={{ width: 880 }}>
      <LayerGraph nodes={tall} edges={tallEdges} resizable />
    </div>,
  );
  const bar = screen.getByRole('separator', { name: '調整架構圖高度' });
  expect(bar.getAttribute('aria-orientation')).toBe('horizontal');
  const boxTop = (name: string) => screen.getByRole('button', { name: new RegExp('^' + name) }).getBoundingClientRect().top;
  const top0 = boxTop('model.py');
  const scroll = container.querySelector('.ui-lg-scroll') as HTMLElement;
  const h0 = scroll.getBoundingClientRect().height;
  bar.focus();
  await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
  // 64 px shared by the two gaps: the last layer 64 px lower, the diagram 64 px taller, no inner scroll.
  expect(Math.round(boxTop('model.py') - top0)).toBe(64);
  expect(Math.round(scroll.getBoundingClientRect().height - h0)).toBe(64);
  await user.keyboard('{Enter}');
  expect(Math.round(boxTop('model.py') - top0)).toBe(0);
  await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
  expect(Math.round(scroll.getBoundingClientRect().height)).toBe(Math.round(h0 - 80));
  expect(getComputedStyle(scroll).overflowY).toBe('auto');
  expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
  expect(Math.round(boxTop('model.py') - top0)).toBe(0);
  expect(Number(bar.getAttribute('aria-valuenow'))).toBe(Math.round(h0 - 80));
});

test('LayerGraph resizable: heightKey remembers the height; without resizable there is no handle', () => {
  localStorage.setItem('ui-lg-height:arch', '-40');
  const { container, unmount } = render(
    <div style={{ width: 880 }}>
      <LayerGraph nodes={tall} edges={tallEdges} resizable heightKey="arch" />
    </div>,
  );
  expect((container.querySelector('.ui-lg-scroll') as HTMLElement).classList.contains('is-framed')).toBe(true);
  unmount();
  localStorage.removeItem('ui-lg-height:arch');
  render(<LayerGraph nodes={tall} edges={tallEdges} />);
  expect(screen.queryByRole('separator')).toBeNull();
});
