// @vitest-environment jsdom
/*
 * Every component in jsdom, with no polyfills: apps test with jsdom, so every story must render there, and the
 * common interactions must work, without a thrown error or a React error in the console. jsdom has no layout
 * (sizes are 0) and lacks ResizeObserver, IntersectionObserver, matchMedia, Range#getBoundingClientRect,
 * Element#animate, scrollIntoView and others: the components check for them and skip what needs them.
 */
import * as React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { composeStories } from '@storybook/react';
import * as UI from './index';

type StoryModule = Parameters<typeof composeStories>[0];
const modules = import.meta.glob<StoryModule>('./components/*/*.stories.tsx', { eager: true });
const sources = import.meta.glob<string>('./components/*/*.stories.tsx', { eager: true, query: '?raw', import: 'default' });

let errors: string[] = [];
const onError = (e: ErrorEvent) => errors.push('uncaught: ' + (e.error?.stack ?? e.message));
// jsdom reports what it does not implement (window.scrollTo, canvas getContext…) to its own console, not to
// console.error: listened to here, so calling such an API fails the test too.
type VirtualConsole = { on: (event: 'jsdomError', f: (e: Error) => void) => void };
(globalThis as unknown as { jsdom?: { virtualConsole?: VirtualConsole } }).jsdom?.virtualConsole?.on('jsdomError', (e) => {
  errors.push('jsdom: ' + e.message);
});
beforeEach(() => {
  errors = [];
  document.documentElement.setAttribute('data-theme', 'light');
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.map((a) => (a instanceof Error ? a.stack : String(a))).join(' '));
  });
  window.addEventListener('error', onError);
});
afterEach(async () => {
  // Timers and animation frames the components scheduled run before the check.
  await act(() => new Promise((r) => setTimeout(r, 30)));
  cleanup();
  window.removeEventListener('error', onError);
  vi.restoreAllMocks();
  expect(errors.join('\n\n')).toBe('');
});

const stories = Object.entries(modules).flatMap(([path, mod]) => {
  const name = path.split('/')[2];
  return Object.entries(composeStories(mod) as Record<string, React.ComponentType>).map(([story, Story]) => ({ id: name + '/' + story, Story }));
});

const settle = () => act(() => new Promise((r) => setTimeout(r, 30)));

// Exported components that no story shows, rendered here instead.
const unstoried: Record<string, () => React.ReactElement> = {
  Icon: () => <UI.Icon name="gear" />,
  LocaleProvider: () => (
    <UI.LocaleProvider locale="zh-TW">
      <UI.Button>儲存</UI.Button>
    </UI.LocaleProvider>
  ),
  StatusLegend: () => (
    <UI.StatusLegend
      label="狀態"
      classes={[
        { value: 'ok', label: '正常' },
        { value: 'down', label: '中斷' },
      ]}
    />
  ),
  SectionGroupToggle: () => (
    <UI.SectionGroup bar={false}>
      <UI.SectionGroupToggle />
      <UI.Section title="一">內容一</UI.Section>
      <UI.Section title="二" id="jsdom-second">
        內容二
      </UI.Section>
    </UI.SectionGroup>
  ),
};

test('every exported component has a story or is rendered below', () => {
  const all = Object.values(sources).join('\n');
  const components = Object.entries(UI)
    .filter(([n, v]) => /^[A-Z][a-z]/.test(n) && (typeof v === 'function' || (typeof v === 'object' && v !== null && '$$typeof' in v)))
    .map(([n]) => n);
  expect(components.length).toBeGreaterThan(50);
  expect(components.filter((n) => !new RegExp('\\bUI\\.' + n + '\\b').test(all) && !unstoried[n])).toEqual([]);
});

describe('components without a story render in jsdom and on the server', () => {
  test.each(Object.entries(unstoried))('%s', async (_, El) => {
    expect(renderToString(<El />)).toBeTypeOf('string');
    render(<El />);
    await settle();
  });
});

describe('every story renders in jsdom', () => {
  test.each(stories)('$id', async ({ Story }) => {
    render(<Story />);
    await settle();
  });
});

describe('every story: click its buttons, tabs and switches; drag its separators and charts', () => {
  test.each(stories)('$id', async ({ Story }) => {
    const user = userEvent.setup({ delay: null });
    const { container } = render(<Story />);
    await settle();
    const targets = [...container.querySelectorAll<HTMLElement>('button:not(:disabled), [role="tab"], [role="switch"], [role="checkbox"]')].slice(0, 8);
    for (const t of targets) {
      if (!t.isConnected) continue;
      await user.click(t);
      await user.keyboard('{Escape}');
    }
    // Resize handles and chart scrubbing: a pointer drag, then the arrow keys.
    for (const t of [...container.querySelectorAll<HTMLElement>('[role="separator"], .ui-chart svg, svg[role="img"]')].slice(0, 4)) {
      fireEvent.pointerDown(t, { button: 0, pointerId: 1, clientX: 100, clientY: 100 });
      fireEvent.pointerMove(t, { button: 0, pointerId: 1, clientX: 60, clientY: 140 });
      fireEvent.pointerUp(t, { button: 0, pointerId: 1, clientX: 60, clientY: 140 });
      if (t.tabIndex >= 0) {
        t.focus();
        await user.keyboard('{ArrowLeft}{ArrowRight}{ArrowUp}{ArrowDown}');
      }
    }
    await settle();
  });
});

describe('every story renders on the server', () => {
  test.each(stories)('$id', ({ Story }) => {
    expect(renderToString(<Story />)).toBeTypeOf('string');
  });
});

// What a returning visitor has stored, by key prefix: other choices than the defaults, so a component that reads storage
// while rendering gives different markup than the server did.
const STORED: [prefix: string, value: string][] = [
  ['ui-theme', 'dark'],
  ['ui-accent', '#027874'],
  ['ui-nav-collapsed', '1'],
  ['ui-nav-pinned', '1'],
  ['ui-section:', '1'],
  ['ui-tour:', '1'],
  ['ui-dt-cols:', '{"owner":false}'],
  ['ui-dt-width:', '{"name":300}'],
  ['ui-lg-labels:', '0'],
  ['ui-lg-height:', '80'],
  ['ui-split:', '520'],
  ['ui-workbench:', '{"open":{"explorer":false,"side":false,"panel":false}}'],
];

// Components that read storage only when uncontrolled or given a storage key, which the stories do not do.
function TourCase() {
  const tour = UI.useTour('hydration');
  return <UI.IconButton icon="question" label="導覽" hint={tour.hint('第一次來？看看導覽。')} onClick={tour.start} />;
}
const storedCases = [
  { id: 'stored/ThemePicker', Story: () => <UI.ThemePicker /> },
  { id: 'stored/AccentPicker', Story: () => <UI.AccentPicker /> },
  {
    id: 'stored/Section',
    Story: () => (
      <UI.Section title="細節" storageKey="hydration">
        內容
      </UI.Section>
    ),
  },
  { id: 'stored/Tour', Story: TourCase },
  {
    id: 'stored/DataTable',
    Story: () => (
      <UI.DataTable
        label="清單"
        storageKey="hydration"
        columns={[
          { key: 'name', label: '名稱' },
          { key: 'owner', label: '負責人' },
          { key: 'at', label: '更新', format: 'relative' },
        ]}
        rows={[{ id: '1', name: 'a', owner: 'b', at: new Date(2026, 10, 18, 9, 0).toISOString() }]}
      />
    ),
  },
  {
    id: 'stored/LayerGraph',
    Story: () => (
      <UI.LayerGraph
        resizable
        storageKey="hydration"
        nodes={[
          { id: 'a', name: 'a', layer: 0 },
          { id: 'b', name: 'b', layer: 1 },
        ]}
        edges={[{ from: 'a', to: 'b', label: '呼叫' }]}
      />
    ),
  },
  { id: 'stored/ConsoleLayout', Story: () => <UI.ConsoleLayout title="監控" main={<div>主畫面</div>} /> },
];

describe('every story hydrates without a mismatch, with stored choices and media queries that differ from the server', () => {
  test.each([...stories, ...storedCases])('$id', async ({ Story }) => {
    // The server: nothing stored, no matchMedia.
    localStorage.clear();
    const html = renderToString(<Story />);
    // The browser: stored choices and every media query matching (dark, phone, touch, reduced motion).
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => STORED.find(([k]) => key.startsWith(k))?.[1] ?? null);
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <Story />, {
          onRecoverableError: (e) => errors.push('recoverable: ' + (e instanceof Error ? e.message : String(e))),
        });
      });
      await settle();
    } finally {
      act(() => root?.unmount());
      container.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  });
});

/** The composed stories of one component. */
const of = (name: string) => {
  const mod = Object.entries(modules).find(([p]) => p.split('/')[2] === name);
  if (!mod) throw new Error('no stories for ' + name);
  return composeStories(mod[1]) as Record<string, React.ComponentType>;
};

describe('interactions in jsdom', () => {
  test('DataTable: sort, search, select, the ⋯ menu', async () => {
    const user = userEvent.setup();
    const rows = Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      name: 'row ' + i,
      owner: 'user ' + (i % 4),
      size: (i * 7) % 11,
      when: new Date(2026, 0, 1 + i).toISOString(),
    }));
    render(
      <UI.DataTable
        columns={[
          { key: 'name', label: '名稱' },
          { key: 'owner', label: '負責人' },
          { key: 'size', label: '大小', numeric: true, unit: 'MB' },
          { key: 'when', label: '更新日期', format: 'date' },
        ]}
        rows={rows}
        selectable
        bulkActions={() => null}
      />,
    );
    await settle();
    await user.click(screen.getAllByRole('button', { name: /大小/ })[0]);
    await user.type(screen.getByRole('searchbox'), 'row 1');
    await user.click(screen.getAllByRole('checkbox', { name: '選取第 1 筆' })[0]);
    await user.click(screen.getAllByRole('button', { name: '更多表格操作' })[0]);
    await screen.findByRole('menuitem', { name: '欄位' });
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{Escape}');
    await user.clear(screen.getByRole('searchbox'));
    await settle();
  });

  test('DataTable stories: sort and the ⋯ menu', async () => {
    const user = userEvent.setup();
    for (const Story of Object.values(of('DataTable'))) {
      render(<Story />);
      await settle();
      const more = screen.queryAllByRole('button', { name: '更多表格操作' })[0];
      if (more) {
        await user.click(more);
        await user.keyboard('{Escape}');
      }
      const box = screen.queryAllByRole('searchbox')[0];
      if (box) await user.type(box, 'a');
      cleanup();
    }
  });

  test('Select: open and pick', async () => {
    const user = userEvent.setup();
    const { Default } = of('Select');
    render(<Default />);
    const box = screen.getAllByRole('combobox')[0];
    await user.click(box);
    await user.click(await screen.findByRole('option', { name: '每月' }));
    await settle();
    expect(box.textContent).toContain('每月');
    box.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Escape}');
  });

  test('Menu: open, pick, danger confirm', async () => {
    const user = userEvent.setup();
    const { Default } = of('Menu');
    render(<Default />);
    await user.click(screen.getByRole('button', { name: '叢集監控 的更多操作' }));
    await user.click(await screen.findByRole('menuitem', { name: /編輯/ }));
    await settle();
    await user.click(screen.getByRole('button', { name: '叢集監控 的更多操作' }));
    await user.click(await screen.findByRole('menuitem', { name: /刪除/ }));
    const dialog = await screen.findByRole('alertdialog').catch(() => screen.findByRole('dialog'));
    await user.click(within(dialog).getAllByRole('button')[0]);
    await settle();
  });

  test('Section: the address points at a section, the group toggle', async () => {
    const user = userEvent.setup();
    location.hash = 'jsdom-second';
    const El = unstoried.SectionGroupToggle;
    render(<El />);
    await settle();
    await user.click(screen.getByRole('button', { name: '全部展開' }));
    await user.click(screen.getByRole('button', { name: '全部收合' }));
    await settle();
    location.hash = '';
  });

  test('Dialog: open and close', async () => {
    const user = userEvent.setup();
    function D() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <UI.Button onClick={() => setOpen(true)}>開啟</UI.Button>
          <UI.Dialog open={open} title="設定" onOpenChange={setOpen} actions={<UI.Button onClick={() => setOpen(false)}>完成</UI.Button>}>
            內容
          </UI.Dialog>
        </>
      );
    }
    render(<D />);
    await user.click(screen.getByRole('button', { name: '開啟' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await settle();
    await user.click(screen.getByRole('button', { name: '開啟' }));
    await user.click(await screen.findByRole('button', { name: '完成' }));
    await settle();
  });

  test('Tabs: click and arrow keys', async () => {
    const user = userEvent.setup();
    for (const Story of Object.values(of('Tabs'))) {
      render(<Story />);
      const tabs = screen.getAllByRole('tab');
      await user.click(tabs[1]);
      await user.keyboard('{ArrowRight}{ArrowLeft}{End}{Home}');
      await settle();
      cleanup();
    }
  });

  test('TreeList: open a folder, select, download', async () => {
    const user = userEvent.setup();
    const { Default } = of('TreeList');
    render(<Default />);
    await settle();
    const buttons = screen.getAllByRole('button');
    for (const b of buttons.slice(0, 6)) await user.click(b);
    const boxes = screen.queryAllByRole('checkbox');
    for (const b of boxes.slice(0, 3)) await user.click(b);
    await user.keyboard('{ArrowDown}{ArrowUp}');
    await settle();
  });

  test('CodeView: every story, click its links and lines', async () => {
    const user = userEvent.setup();
    for (const Story of Object.values(of('CodeView'))) {
      render(<Story />);
      await settle();
      for (const b of screen.queryAllByRole('button').slice(0, 4)) await user.click(b);
      for (const l of screen.queryAllByRole('link').slice(0, 3)) await user.hover(l);
      await user.keyboard('{Escape}');
      await settle();
      cleanup();
    }
  });
});
