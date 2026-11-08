import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SplitPane } from '../../index';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.removeItem('ui-split:test');
});

const panel = (c: HTMLElement) => c.querySelector<HTMLElement>('.ui-split-b')?.getBoundingClientRect().width ?? 0;

function Split(props: Partial<React.ComponentProps<typeof SplitPane>> & { width?: number }) {
  const { width = 1200, ...rest } = props;
  return (
    <div style={{ width }}>
      <SplitPane a={<p>主要區域</p>} b={<p>程式碼面板</p>} defaultB={420} minA={360} minB={280} storageKey="test" {...rest} />
    </div>
  );
}

test('SplitPane: a separator the keyboard moves 16 px at a time; Home and End go to the ends', async () => {
  await page.viewport(1280, 800);
  const { container } = render(<Split />);
  const sep = await screen.findByRole('separator', { name: '調整面板寬度' });
  expect(sep.getAttribute('aria-orientation')).toBe('vertical');
  // The value is the main area's width: 1200 - 16 - 420.
  await waitFor(() => expect(sep.getAttribute('aria-valuenow')).toBe('764'));
  expect(sep.getAttribute('aria-valuemin')).toBe('360');
  expect(sep.getAttribute('aria-valuemax')).toBe(String(1200 - 16 - 280));
  expect(panel(container)).toBe(420);
  sep.focus();
  const user = userEvent.setup();
  await user.keyboard('{ArrowLeft}');
  expect(sep.getAttribute('aria-valuenow')).toBe('748');
  expect(panel(container)).toBe(436);
  await user.keyboard('{ArrowRight}{ArrowRight}');
  expect(panel(container)).toBe(404);
  await user.keyboard('{Home}');
  expect(sep.getAttribute('aria-valuenow')).toBe('360');
  expect(panel(container)).toBe(1200 - 16 - 360);
  await user.keyboard('{End}');
  expect(panel(container)).toBe(280);
  expect(window.localStorage.getItem('ui-split:test')).toBe('280');
  await user.keyboard('{Enter}');
  expect(panel(container)).toBe(420);
});

test('SplitPane: dragging keeps both minimums; a double-click goes back to the default width', async () => {
  await page.viewport(1280, 800);
  const { container } = render(<Split />);
  const sep = await screen.findByRole('separator');
  const root = container.querySelector<HTMLElement>('.ui-split');
  const r = root?.getBoundingClientRect();
  if (!r) throw new Error('no root');
  const drag = (x: number) => {
    sep.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1, clientX: r.right - 428 }));
    sep.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: x }));
    sep.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: x }));
  };
  drag(r.right - 600 - 8);
  await waitFor(() => expect(panel(container)).toBe(600));
  expect(window.localStorage.getItem('ui-split:test')).toBe('600');
  // Too far either way: the minimums hold.
  drag(r.left + 10);
  await waitFor(() => expect(panel(container)).toBe(1200 - 16 - 360));
  drag(r.right - 20);
  await waitFor(() => expect(panel(container)).toBe(280));
  sep.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  await waitFor(() => expect(panel(container)).toBe(420));
});

test('SplitPane: the width comes back from storageKey, and works when storage throws', async () => {
  await page.viewport(1280, 800);
  window.localStorage.setItem('ui-split:test', '520');
  const first = render(<Split />);
  await waitFor(() => expect(panel(first.container)).toBe(520));
  first.unmount();
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const { container } = render(<Split />);
  const sep = await screen.findByRole('separator');
  await waitFor(() => expect(panel(container)).toBe(420));
  sep.focus();
  await userEvent.setup().keyboard('{ArrowLeft}');
  expect(panel(container)).toBe(436);
});

test('SplitPane: under 960 px the areas stack, panel below, without the separator', async () => {
  await page.viewport(1280, 800);
  const { container } = render(<Split width={800} />);
  await waitFor(() => expect(container.querySelector('.ui-split')?.classList.contains('is-stacked')).toBe(true));
  expect(screen.queryByRole('separator')).toBeNull();
  const a = container.querySelector('.ui-split-a')?.getBoundingClientRect();
  const b = container.querySelector('.ui-split-b')?.getBoundingClientRect();
  expect(b && a && b.top >= a.bottom).toBe(true);
  expect(Math.round(b?.width ?? 0)).toBe(800);
});
