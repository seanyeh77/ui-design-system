import * as React from 'react';
import { Menu as Base } from '@base-ui/react/menu';
import { IconButton } from '../IconButton/IconButton';
import { SearchField } from '../SearchField/SearchField';
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb/Breadcrumb';
import { Icon, type CustomIcon } from '../../icons/Icon';
import { cx, IS_MAC, resizeObserver } from '../../internal/util';
import { readStored, useStored } from '../../internal/stored';
import { devWarn } from '../../internal/dev';
import { tr } from '../../i18n';
import { dropTransition } from '../../motion';
import { includeIcons } from '../../icons/store';
import phCaretDown from '../../icons/ph/caret-down';
import phCaretLeft from '../../icons/ph/caret-left';
import phCaretRight from '../../icons/ph/caret-right';

includeIcons(phCaretDown, phCaretLeft, phCaretRight);

export type WorkbenchRegion = 'explorer' | 'side' | 'panel';
type ViewRegion = 'side' | 'panel';

/** One view in the side bar or the bottom panel: a tab and what it shows. */
export interface WorkbenchView {
  id: string;
  /** The tab's name, a noun: 「大綱」「問題」. */
  title: string;
  /** The view's content; only the open view is rendered. */
  render: () => React.ReactNode;
  /** Something worth a look (new problems): a dot on the tab, and on the region's top-bar button while it is closed. */
  attention?: boolean;
}

/** Where each view sits and what is open; kept in localStorage under 「ui-workbench:」 + id. */
export interface WorkbenchLayout {
  side: string[];
  panel: string[];
  active: { side?: string; panel?: string };
  open: Record<WorkbenchRegion, boolean>;
  size: Record<WorkbenchRegion, number>;
}

export interface WorkbenchProps {
  /** Names the stored layout: one per page, such as 'app'. */
  id: string;
  /** Product at the top left. The name is hidden on phones; the mark stays. */
  brand?: { mark?: React.ReactNode; name: string; href?: string };
  /** Where the main view is: on a 36 px bar above the main view, in line with the tab rows of the side bar and the
   *  panel. When it does not fit, the levels before the last one shrink first. */
  crumbs?: BreadcrumbItem[];
  /** Small buttons at the right of the bar above the main view, such as 「用 VS Code 開啟」: IconButton
   *  variant="quiet". */
  mainBar?: React.ReactNode;
  /** The page's own buttons at the top right (search, help, project switch): IconButton variant="quiet". */
  actions?: React.ReactNode;
  /** The file explorer's content, usually a TreeList kind="plain" density="compact" bare. */
  explorer?: React.ReactNode;
  /** The explorer's filter: a 36 px row at its top (magnifier and a borderless field), in line with the bars beside
   *  it. The page filters its own tree. */
  explorerFilter?: { value: string; onChange: (value: string) => void; label?: string };
  /** Above the explorer, under the filter, fixed: anything else. */
  explorerHead?: React.ReactNode;
  /** Below the explorer, fixed: 「設定」 and the like. */
  explorerFoot?: React.ReactNode;
  /** Tabs of the side bar and the bottom panel. Where each one sits is the user's choice, kept per browser. */
  views?: WorkbenchView[];
  /** The layout before the user changes it, and after 「還原預設版面」. Views in neither list go to the panel. */
  defaultLayout?: {
    side?: string[];
    panel?: string[];
    open?: Partial<Record<WorkbenchRegion, boolean>>;
    size?: Partial<Record<WorkbenchRegion, number>>;
  };
  /** The main view: a diagram, a document or code. */
  children?: React.ReactNode;
  /** Accessible name of the whole layout. Default 「編輯器」. */
  label?: string;
  className?: string;
  /** Called with the layout on the first render and after every change (a tab picked or moved, a region opened or
   *  closed, a size changed), for example to put the panel's current tab in the URL. */
  onLayoutChange?: (layout: WorkbenchLayout) => void;
  /** show, toggle, resetLayout and getLayout from outside, such as URL handling in the page around the Workbench. */
  ref?: React.Ref<WorkbenchHandle>;
}

export interface WorkbenchApi {
  /** Back to defaultLayout: places, open regions and sizes. */
  resetLayout: () => void;
  /** Opens or closes a region, as its top-bar button. */
  toggle: (region: WorkbenchRegion) => void;
  /** Call after the user picked something in the explorer: where the explorer covers the main view (below 960 px),
   *  it closes so the choice can be seen. */
  explorerPicked: () => void;
  /** Phones (below 600 px). */
  phone: boolean;
  /** Opens a view where it is: makes it the current tab of its region and opens the region (laid over the main view
   *  on narrow screens; the merged panel on phones). Does not move the view. Unknown ids are ignored. */
  show: (viewId: string) => void;
  /** The current layout: where each view sits, the current tab of each region, what is open, sizes. */
  layout: WorkbenchLayout;
}

/** The same calls from outside the Workbench, through `ref`. */
export type WorkbenchHandle = Omit<WorkbenchApi, 'layout'> & {
  /** The current layout at the time of the call. */
  getLayout: () => WorkbenchLayout;
};

const Ctx = React.createContext<WorkbenchApi | null>(null);

/** For anything rendered inside a Workbench (actions, explorer, views). */
export function useWorkbench(): WorkbenchApi {
  const api = React.useContext(Ctx);
  if (!api) throw new Error('useWorkbench() works inside <Workbench>.');
  return api;
}

const TOP = 48;
const BAR = 36;
const LIM: Record<WorkbenchRegion, [number, number]> = { explorer: [180, 480], side: [240, 560], panel: [120, Infinity] };
const DEF_SIZE: Record<WorkbenchRegion, number> = { explorer: 260, side: 320, panel: 220 };
const STEP = 16;

// Layout toggles: a frame, its region filled while open (256 viewBox, Phosphor's 16 px stroke).
const FRAME = '<rect x="24" y="40" width="208" height="176" rx="20" fill="none" stroke="currentColor" stroke-width="16"/>';
const TOGGLE: Record<WorkbenchRegion, [string, string]> = {
  explorer: ['<rect x="40" y="56" width="64" height="144" rx="6"/>', '<path d="M100 44v168" stroke="currentColor" stroke-width="16"/>'],
  side: ['<rect x="152" y="56" width="64" height="144" rx="6"/>', '<path d="M156 44v168" stroke="currentColor" stroke-width="16"/>'],
  panel: ['<rect x="40" y="136" width="176" height="64" rx="6"/>', '<path d="M28 140h200" stroke="currentColor" stroke-width="16"/>'],
};
const toggleIcon = (r: WorkbenchRegion, open: boolean) => (FRAME + TOGGLE[r][open ? 0 : 1]) as CustomIcon;
const MOVE_ICON = 'M4 8h15m0 0-3.5-3.5M19 8l-3.5 3.5M20 16H5m0 0 3.5-3.5M5 16l3.5 3.5' as CustomIcon;

function defaults(views: WorkbenchView[], d: WorkbenchProps['defaultLayout']): WorkbenchLayout {
  const ids = views.map((v) => v.id);
  const side = (d?.side ?? []).filter((x) => ids.includes(x));
  const panel = (d?.panel ?? []).filter((x) => ids.includes(x) && !side.includes(x));
  for (const x of ids) if (!side.includes(x) && !panel.includes(x)) panel.push(x);
  return {
    side,
    panel,
    active: { side: side[0], panel: panel[0] },
    open: { explorer: true, side: true, panel: true, ...d?.open },
    size: { ...DEF_SIZE, ...d?.size },
  };
}

// A stored layout, checked against today's views: unknown ids dropped, new ones placed as the defaults say.
function restore(raw: string, def: WorkbenchLayout): WorkbenchLayout {
  try {
    const s = JSON.parse(raw) as Partial<WorkbenchLayout>;
    const all = [...def.side, ...def.panel];
    const side = (s.side ?? []).filter((x) => all.includes(x));
    const panel = (s.panel ?? []).filter((x) => all.includes(x) && !side.includes(x));
    for (const x of def.side) if (!side.includes(x) && !panel.includes(x)) side.push(x);
    for (const x of def.panel) if (!side.includes(x) && !panel.includes(x)) panel.push(x);
    return {
      side,
      panel,
      active: { ...def.active, ...s.active },
      open: { ...def.open, ...s.open },
      size: { ...def.size, ...s.size },
    };
  } catch {
    return def;
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
const inField = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/** A draggable border between two regions: role="separator", arrows 16 px, Shift 64 px, Home/End, double-click resets. */
function Splitter(p: {
  label: string;
  vertical: boolean;
  value: number;
  min: number;
  max: number;
  /** +1: dragging right or down grows the region; -1: left or up grows it. */
  grow: 1 | -1;
  onChange: (v: number) => void;
  onReset: () => void;
  onDrag: (on: boolean) => void;
  style: React.CSSProperties;
}) {
  const start = React.useRef<{ at: number; v: number } | null>(null);
  const [on, setOn] = React.useState(false);
  const pos = (e: React.PointerEvent) => (p.vertical ? e.clientX : e.clientY);
  return (
    <div
      className={cx('ui-wb-split', p.vertical ? 'is-v' : 'is-h', on && 'is-on')}
      role="separator"
      aria-orientation={p.vertical ? 'vertical' : 'horizontal'}
      aria-label={p.label}
      aria-valuenow={p.value}
      aria-valuemin={p.min}
      aria-valuemax={p.max}
      tabIndex={0}
      style={p.style}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        start.current = { at: pos(e), v: p.value };
        setOn(true);
        p.onDrag(true);
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (s) p.onChange(clamp(s.v + (pos(e) - s.at) * p.grow, p.min, p.max));
      }}
      onPointerUp={() => {
        start.current = null;
        setOn(false);
        p.onDrag(false);
      }}
      onPointerCancel={() => {
        start.current = null;
        setOn(false);
        p.onDrag(false);
      }}
      onDoubleClick={p.onReset}
      onKeyDown={(e) => {
        const step = e.shiftKey ? STEP * 4 : STEP;
        // The key pointing away from the region grows it.
        const grow = p.vertical ? (p.grow > 0 ? 'ArrowRight' : 'ArrowLeft') : p.grow > 0 ? 'ArrowDown' : 'ArrowUp';
        const shrink = p.vertical ? (p.grow > 0 ? 'ArrowLeft' : 'ArrowRight') : p.grow > 0 ? 'ArrowUp' : 'ArrowDown';
        let v: number | null = null;
        if (e.key === grow) v = p.value + step;
        else if (e.key === shrink) v = p.value - step;
        else if (e.key === 'Home') v = p.min;
        else if (e.key === 'End') v = p.max;
        if (v == null) return;
        e.preventDefault();
        p.onChange(clamp(v, p.min, p.max));
      }}
    >
      <span className="ui-wb-split-line" aria-hidden="true" />
    </div>
  );
}

interface DragState {
  id: string;
  over?: { region: ViewRegion; before: string | null; noop: boolean };
}

/** A region's tab row: droplet underline, overflow (更多 menu with a mouse, scrolling on phones), drag and drop. */
function TabRow(p: {
  name: string;
  region: ViewRegion | 'sheet';
  ids: string[];
  active?: string;
  views: Record<string, WorkbenchView>;
  onPick: (id: string) => void;
  overflow: 'menu' | 'scroll';
  drag?: DragState | null;
  setDrag?: (d: DragState | null) => void;
  onDrop?: (id: string, before: string | null) => void;
  onReorder?: (ids: string[]) => void;
  buttons: React.ReactNode;
}) {
  const track = React.useRef<HTMLDivElement>(null);
  const tabs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const widths = React.useRef<Record<string, number>>({});
  const [fit, setFit] = React.useState(p.ids.length);
  const [box, setBox] = React.useState<{ left: number; right: number } | null>(null);
  const [forward, setForward] = React.useState(true);
  const [edges, setEdges] = React.useState({ left: false, right: false });
  const [hold, setHold] = React.useState<{ id: string; at: number } | null>(null);
  const press = React.useRef<{
    id: string | null;
    x: number;
    y: number;
    scroll: number;
    mode: null | 'scroll' | 'drag';
    timer?: ReturnType<typeof setTimeout>;
  } | null>(null);
  const prevActive = React.useRef(p.active);
  const menu = p.overflow === 'menu';

  // Phones: while a tab is held, the row shows the order it will have when let go.
  const order = hold
    ? (() => {
        const a = p.ids.filter((x) => x !== hold.id);
        a.splice(hold.at, 0, hold.id);
        return a;
      })()
    : p.ids;
  let shown = order;
  let hidden: string[] = [];
  if (menu && fit < order.length) {
    shown = order.slice(0, Math.max(1, fit));
    if (p.active && order.includes(p.active) && !shown.includes(p.active)) shown = [...shown.slice(0, -1), p.active];
    hidden = order.filter((x) => !shown.includes(x));
  }

  const measure = React.useCallback(() => {
    const tr2 = track.current;
    if (!tr2) return;
    const el = p.active ? tabs.current[p.active] : null;
    setBox(el ? { left: el.offsetLeft + 10, right: tr2.clientWidth - el.offsetLeft - el.offsetWidth + 10 } : null);
    const left = tr2.scrollLeft > 1;
    const right = tr2.scrollLeft + tr2.clientWidth < tr2.scrollWidth - 1;
    setEdges((m) => (m.left === left && m.right === right ? m : { left, right }));
    if (menu) {
      for (const [id, t] of Object.entries(tabs.current)) if (t) widths.current[id] = t.offsetWidth;
      // Room for 「更多 N」 when some do not fit.
      let used = 0;
      let n = 0;
      const total = p.ids.reduce((a, id) => a + (widths.current[id] ?? 80), 0);
      const room = tr2.clientWidth - (total > tr2.clientWidth ? 72 : 0);
      for (const id of p.ids) {
        used += widths.current[id] ?? 80;
        if (used > room) break;
        n++;
      }
      setFit((f) => (f === n ? f : n));
    }
  }, [p.active, p.ids, menu]);

  React.useLayoutEffect(() => {
    if (prevActive.current !== p.active) {
      setForward(p.ids.indexOf(p.active ?? '') > p.ids.indexOf(prevActive.current ?? ''));
      prevActive.current = p.active;
    }
    measure();
    const tr2 = track.current;
    if (!tr2) return;
    const el = p.active ? tabs.current[p.active] : null;
    if (el && !menu) {
      if (el.offsetLeft < tr2.scrollLeft) tr2.scrollLeft = el.offsetLeft - 4;
      else if (el.offsetLeft + el.offsetWidth > tr2.scrollLeft + tr2.clientWidth) tr2.scrollLeft = el.offsetLeft + el.offsetWidth - tr2.clientWidth + 4;
    }
    const ro = resizeObserver(measure);
    ro?.observe(tr2);
    return () => ro?.disconnect();
  }, [p.active, p.ids, measure, menu, hold]);

  const drag = p.drag;
  const over = drag?.over?.region === p.region ? drag.over : undefined;
  const di = drag ? p.ids.indexOf(drag.id) : -1;
  const noop = (before: string | null) => di >= 0 && (before === drag?.id || before === (p.ids[di + 1] ?? null));

  const tabEl = (id: string, i: number, list: string[]) => {
    const v = p.views[id];
    const on = id === p.active;
    const next = list[i + 1] ?? null;
    const lineBefore = !!over && !over.noop && over.before === id;
    const lineAfter = !!over && !over.noop && over.before === null && i === list.length - 1 && list.length === p.ids.length;
    return (
      <button
        key={id}
        ref={(n) => {
          tabs.current[id] = n;
        }}
        type="button"
        role="tab"
        data-id={id}
        aria-selected={on}
        tabIndex={on ? 0 : -1}
        className={cx(
          'ui-wb-tab',
          on && 'is-on',
          drag?.id === id && 'is-ghost',
          hold?.id === id && 'is-held',
          lineBefore && 'has-line',
          lineAfter && 'has-line-after',
        )}
        draggable={!!p.setDrag}
        onClick={() => p.onPick(id)}
        onKeyDown={(e) => {
          const k = e.key;
          const j = k === 'ArrowRight' ? i + 1 : k === 'ArrowLeft' ? i - 1 : k === 'Home' ? 0 : k === 'End' ? list.length - 1 : -1;
          if (j < 0 || j >= list.length) return;
          e.preventDefault();
          p.onPick(list[j]);
          tabs.current[list[j]]?.focus();
        }}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', id);
          e.dataTransfer.effectAllowed = 'move';
          p.setDrag?.({ id });
        }}
        onDragEnd={() => p.setDrag?.(null)}
        onDragOver={(e) => {
          if (!drag || !p.setDrag) return;
          e.preventDefault();
          e.stopPropagation();
          // Left half: before this tab; right half: after it.
          const r = e.currentTarget.getBoundingClientRect();
          const before = e.clientX > r.left + r.width / 2 ? next : id;
          const nn = noop(before);
          if (!over || over.before !== before || over.noop !== nn) p.setDrag({ id: drag.id, over: { region: p.region as ViewRegion, before, noop: nn } });
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (drag && over && !over.noop) p.onDrop?.(drag.id, over.before);
          p.setDrag?.(null);
        }}
      >
        {v.title}
        {v.attention ? <span className="ui-wb-dot" aria-label={tr('有新內容')} role="img" /> : null}
      </button>
    );
  };

  // Phones: hold a tab 300 ms, then drag it; move first and the row scrolls instead.
  const pressHandlers = p.onReorder
    ? {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
          const t = (e.target as HTMLElement).closest?.('[data-id]');
          const c = e.currentTarget;
          const pr = {
            id: t ? t.getAttribute('data-id') : null,
            x: e.clientX,
            y: e.clientY,
            scroll: c.scrollLeft,
            mode: null as null | 'scroll' | 'drag',
            timer: undefined as ReturnType<typeof setTimeout> | undefined,
          };
          pr.timer = setTimeout(() => {
            if (press.current === pr && !pr.mode && pr.id) {
              pr.mode = 'drag';
              c.setPointerCapture?.(e.pointerId);
              navigator.vibrate?.(10);
              setHold({ id: pr.id, at: p.ids.indexOf(pr.id) });
            }
          }, 300);
          press.current = pr;
        },
        onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
          const pr = press.current;
          if (!pr) return;
          const dx = e.clientX - pr.x;
          if (!pr.mode && (Math.abs(dx) > 8 || Math.abs(e.clientY - pr.y) > 8)) {
            clearTimeout(pr.timer);
            pr.mode = 'scroll';
          }
          const c = e.currentTarget;
          if (pr.mode === 'scroll') c.scrollLeft = pr.scroll - dx;
          else if (pr.mode === 'drag' && pr.id) {
            let at = 0;
            c.querySelectorAll<HTMLElement>('[data-id]').forEach((el) => {
              if (el.getAttribute('data-id') === pr.id) return;
              const r = el.getBoundingClientRect();
              if (e.clientX > r.left + r.width / 2) at++;
            });
            setHold((h) => (h && h.at === at ? h : { id: pr.id as string, at }));
            const r = c.getBoundingClientRect();
            if (e.clientX < r.left + 28) c.scrollLeft -= 6;
            else if (e.clientX > r.right - 28) c.scrollLeft += 6;
          }
        },
        onPointerUp: () => {
          const pr = press.current;
          press.current = null;
          if (!pr) return;
          clearTimeout(pr.timer);
          if (pr.mode === 'drag' && hold) {
            const next = order;
            setHold(null);
            if (next.join('\n') !== p.ids.join('\n')) p.onReorder?.(next);
          }
        },
        onPointerCancel: () => {
          const pr = press.current;
          if (pr) clearTimeout(pr.timer);
          press.current = null;
          setHold(null);
        },
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      }
    : {};

  return (
    <div className="ui-wb-tabbar">
      <div
        ref={track}
        className={cx('ui-wb-tabs', !menu && 'is-scroll', edges.left && 'has-more-left', edges.right && 'has-more-right', p.onReorder && 'is-touch')}
        role="tablist"
        aria-label={p.name}
        onScroll={measure}
        onWheel={(e) => {
          const c = e.currentTarget;
          if (!menu && c.scrollWidth > c.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) c.scrollLeft += e.deltaY;
        }}
        {...pressHandlers}
      >
        {box ? (
          <span className="ui-wb-ind" aria-hidden="true" style={{ left: box.left, right: box.right, transition: dropTransition('left', 'right', forward) }} />
        ) : null}
        {shown.map((id, i) => tabEl(id, i, shown))}
      </div>
      {hidden.length ? (
        <Base.Root>
          <Base.Trigger className="ui-wb-more" aria-label={tr('更多分頁（{n} 個）', { n: hidden.length })}>
            {tr('更多 {n}', { n: hidden.length })}
            <Icon name="caret-down" size={14} />
          </Base.Trigger>
          <Base.Portal>
            <Base.Positioner className="ui-menu-pos" align="end" sideOffset={4}>
              <Base.Popup className="ui-menu">
                {hidden.map((id) => (
                  <Base.Item key={id} className="ui-menu-item" onClick={() => p.onPick(id)}>
                    <span className="ui-menu-noicon" />
                    <span className="ui-menu-label">{p.views[id].title}</span>
                  </Base.Item>
                ))}
              </Base.Popup>
            </Base.Positioner>
          </Base.Portal>
        </Base.Root>
      ) : null}
      <div className="ui-wb-tabbtns">{p.buttons}</div>
    </div>
  );
}

/** The view's content; on a change its children rise one after another, 40 ms apart. */
function Pane({ view, onSwipe }: { view?: WorkbenchView; onSwipe?: (dir: 1 | -1) => void }) {
  const start = React.useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      className="ui-wb-panebox"
      role="tabpanel"
      onPointerDown={onSwipe ? (e) => (start.current = { x: e.clientX, y: e.clientY }) : undefined}
      onPointerUp={
        onSwipe
          ? (e) => {
              const s = start.current;
              start.current = null;
              if (!s) return;
              const dx = e.clientX - s.x;
              const dy = e.clientY - s.y;
              // A swipe: 48 px across, and clearly more across than down, so scrolling stays scrolling.
              if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 1 : -1);
            }
          : undefined
      }
    >
      {view ? (
        <div key={view.id} className="ui-wb-pane">
          {view.render()}
        </div>
      ) : null}
    </div>
  );
}

/** An editor layout like VS Code: top bar, file explorer, main view, side bar and bottom panel, with resizable borders,
 *  views that move between the side bar and the panel, Ctrl B / Ctrl J / Ctrl Alt B, and a remembered layout. */
export function Workbench({ ref, ...p }: WorkbenchProps) {
  const views = React.useMemo(() => p.views ?? [], [p.views]);
  const byId = React.useMemo(() => Object.fromEntries(views.map((v) => [v.id, v])), [views]);
  const key = 'ui-workbench:' + p.id;
  const def = React.useMemo(() => defaults(views, p.defaultLayout), [views, p.defaultLayout]);
  // The default layout on the server and the first browser render, then the stored one (also when another tab changes it).
  const parseLayout = React.useCallback((raw: string) => restore(raw, def), [def]);
  const [lay, saveLay] = useStored<WorkbenchLayout>(key, parseLayout, def);
  // An update reads the layout from storage, so two updates in one event build on each other.
  const setLay = React.useCallback(
    (u: WorkbenchLayout | ((l: WorkbenchLayout) => WorkbenchLayout)) => {
      const raw = readStored(key);
      const cur = raw ? restore(raw, def) : def;
      saveLay(typeof u === 'function' ? u(cur) : u);
    },
    [key, def, saveLay],
  );
  devWarn(
    () => new Set(views.map((v) => v.id)).size !== views.length,
    'Workbench',
    'two views share an id. Give each view its own id: the layout stores views by id.',
  );

  const root = React.useRef<HTMLDivElement>(null);
  // Until the first measurement the size is a guess; `measured` keeps that guess from counting as a change of size.
  const [dim, setDim] = React.useState({ w: 1280, h: 800, measured: false });
  React.useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const read = () =>
      setDim((d) => (d.measured && d.w === el.clientWidth && d.h === el.clientHeight ? d : { w: el.clientWidth, h: el.clientHeight, measured: true }));
    read();
    const ro = resizeObserver(read);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  const onLayoutChange = p.onLayoutChange;
  React.useEffect(() => {
    onLayoutChange?.(lay);
    // Only when the layout changes, not when the page passes a new function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lay]);

  // Overlays (narrow screens) open and close here, never in the stored layout, so a wide screen keeps its own.
  const [ov, setOv] = React.useState({ explorer: false, side: false });
  const [sheet, setSheet] = React.useState<{ open: boolean; act?: string }>({ open: false });
  const [sheetH, setSheetH] = React.useState<number | null>(null);
  const [drag, setDrag] = React.useState<DragState | null>(null);
  const [sizing, setSizing] = React.useState(false);

  const { w, h } = dim;
  const phone = w < 600;
  const exOverlay = w < 960;
  const sideOverlay = w < 1280;
  const bodyH = Math.max(0, h - TOP);
  // Leaving the narrow sizes closes what was laid over the main view.
  const [lastBand, setLastBand] = React.useState<number | null>(null);
  const band = phone ? 3 : exOverlay ? 2 : sideOverlay ? 1 : 0;
  // The first measurement only sets the size band: what show() opened while mounting stays open.
  if (dim.measured && lastBand === null) setLastBand(band);
  else if (dim.measured && band !== lastBand) {
    setLastBand(band);
    setOv({ explorer: false, side: false });
    setSheet((s) => ({ ...s, open: false }));
  }

  const panelMax = Math.max(LIM.panel[0], Math.round(bodyH * 0.6));
  const exW = phone ? Math.round(w * 0.85) : clamp(lay.size.explorer, LIM.explorer[0], LIM.explorer[1]);
  const sideW = phone ? w : Math.min(clamp(lay.size.side, LIM.side[0], LIM.side[1]), w - 48);
  const panelH = clamp(lay.size.panel, LIM.panel[0], panelMax);
  const sheetMax = Math.round(bodyH * 0.75);
  const sheetSize = clamp(sheetH ?? bodyH * 0.45, 120, Math.max(120, sheetMax));

  const exOpen = exOverlay ? ov.explorer : lay.open.explorer;
  const sideHas = lay.side.length > 0;
  const panelHas = lay.panel.length > 0;
  const sideOpen = !phone && sideHas && (sideOverlay ? ov.side : lay.open.side);
  const panelOpen = !phone && panelHas && lay.open.panel;
  const exDocked = !exOverlay && exOpen;
  const sideDocked = !sideOverlay && sideOpen;
  const merged = [...lay.side, ...lay.panel];
  const sheetOpen = phone && sheet.open && merged.length > 0;
  const mainL = exDocked ? exW : 0;
  const mainR = sideDocked ? sideW : 0;
  const mainB = phone ? (sheetOpen ? sheetSize : 0) : panelOpen ? panelH : 0;

  const activeOf = (r: ViewRegion) => {
    const a = lay.active[r];
    return a && lay[r].includes(a) ? a : lay[r][0];
  };

  const update = React.useCallback((fn: (l: WorkbenchLayout) => WorkbenchLayout) => setLay((l) => fn(l)), [setLay]);
  const openSheet = (from: ViewRegion) =>
    setSheet((s) => {
      const act = lay.active[from] && lay[from].includes(lay.active[from] as string) ? lay.active[from] : lay[from][0];
      return s.open && s.act === act ? { open: false, act } : { open: true, act: act ?? merged[0] };
    });
  const toggle = (r: WorkbenchRegion) => {
    if (r === 'explorer') {
      if (exOverlay) setOv((o) => ({ ...o, explorer: !o.explorer }));
      else update((l) => ({ ...l, open: { ...l.open, explorer: !l.open.explorer } }));
    } else if (phone) openSheet(r);
    else if (r === 'side' && sideOverlay) setOv((o) => ({ ...o, side: !o.side }));
    else update((l) => ({ ...l, open: { ...l.open, [r]: !l.open[r] } }));
  };
  const toggleRef = React.useRef(toggle);
  React.useLayoutEffect(() => {
    toggleRef.current = toggle;
  });

  // Ctrl B, Ctrl J, Ctrl Alt B (⌘ on macOS); Esc closes what lies over the main view.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOv((o) => (o.explorer || o.side ? { explorer: false, side: false } : o));
        return;
      }
      const mod = IS_MAC ? e.metaKey : e.ctrlKey;
      if (!mod || e.shiftKey) return;
      const k = e.key.toLowerCase();
      const code = e.code;
      if ((k === 'b' || code === 'KeyB') && e.altKey) toggleRef.current('side');
      else if (k === 'b' || code === 'KeyB') {
        if (inField(e.target)) return;
        toggleRef.current('explorer');
      } else if (k === 'j' || code === 'KeyJ') toggleRef.current('panel');
      else return;
      e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const move = (id: string, to: ViewRegion, before: string | null) =>
    update((l) => {
      const from: ViewRegion = l.side.includes(id) ? 'side' : 'panel';
      const n = { ...l, side: l.side.filter((x) => x !== id), panel: l.panel.filter((x) => x !== id), active: { ...l.active }, open: { ...l.open } };
      const arr = n[to];
      const i = before ? arr.indexOf(before) : -1;
      if (i >= 0) arr.splice(i, 0, id);
      else arr.push(id);
      n.active[to] = id;
      if (from !== to && l.active[from] === id) n.active[from] = n[from][0];
      n.open[to] = true;
      return n;
    });
  const moveOver = (r: ViewRegion) => {
    const act = activeOf(r);
    if (!act) return;
    move(act, r === 'side' ? 'panel' : 'side', null);
    if (r === 'side' && sideOverlay) setOv((o) => ({ ...o, side: false }));
    if (r === 'panel' && sideOverlay) setOv((o) => ({ ...o, side: true }));
  };
  const resetLayout = () => {
    setLay(defaults(views, p.defaultLayout));
    setOv({ explorer: false, side: false });
    setSheet({ open: false });
    setSheetH(null);
  };

  const show = (viewId: string) => {
    const r: ViewRegion | null = lay.side.includes(viewId) ? 'side' : lay.panel.includes(viewId) ? 'panel' : null;
    devWarn(!r, 'Workbench', `show('${viewId}'): no view has this id. Pass the id of one of the views.`);
    if (!r) return;
    // Called while mounting, before the size was measured: read the real width now.
    const cw = root.current?.clientWidth || w;
    const phone = cw < 600;
    const sideOverlay = cw < 1280;
    // Wide screens remember it open; narrow screens lay it over the main view; phones open the merged panel.
    const remember = !phone && !(r === 'side' && sideOverlay);
    update((l) => ({ ...l, active: { ...l.active, [r]: viewId }, open: remember ? { ...l.open, [r]: true } : l.open }));
    if (phone) setSheet({ open: true, act: viewId });
    else if (r === 'side' && sideOverlay) setOv((o) => ({ ...o, side: true }));
  };

  const api: WorkbenchApi = {
    resetLayout,
    toggle,
    explorerPicked: () => {
      if (exOverlay) setOv((o) => ({ ...o, explorer: false }));
    },
    phone,
    show,
    layout: lay,
  };
  // The handle reads the latest render's functions, so a call from outside sees today's layout and screen size.
  const latest = React.useRef(api);
  React.useLayoutEffect(() => {
    latest.current = api;
  });
  React.useImperativeHandle(
    ref,
    () => ({
      show: (id) => latest.current.show(id),
      toggle: (r) => latest.current.toggle(r),
      resetLayout: () => latest.current.resetLayout(),
      explorerPicked: () => latest.current.explorerPicked(),
      get phone() {
        return latest.current.phone;
      },
      getLayout: () => latest.current.layout,
    }),
    [],
  );

  const regionName = { explorer: tr('檔案總管'), side: tr('右側欄'), panel: tr('下方面板') };
  const keys = { explorer: (IS_MAC ? '⌘' : 'Ctrl ') + 'B', side: (IS_MAC ? '⌘⌥' : 'Ctrl Alt ') + 'B', panel: (IS_MAC ? '⌘' : 'Ctrl ') + 'J' };
  const attention = (r: ViewRegion) => lay[r].some((id) => byId[id]?.attention);
  const toggleBtn = (r: WorkbenchRegion, open: boolean, dot: boolean) => (
    <span className="ui-wb-toggle">
      <IconButton
        variant="quiet"
        icon={toggleIcon(r, open)}
        label={tr('{v}（{t}）', { v: regionName[r], t: keys[r] })}
        aria-pressed={open}
        onClick={() => toggle(r)}
      />
      {dot ? <span className="ui-wb-dot is-on-button" aria-hidden="true" /> : null}
    </span>
  );

  const dropFrame = (r: ViewRegion) => {
    const o = drag?.over;
    if (!o || o.region !== r) return null;
    const same = lay[r].includes(drag.id);
    const text = o.noop ? tr('位置不變') : same ? tr('放開以排在這裡') : tr('放開以移到{region}', { region: regionName[r] });
    return (
      <div className="ui-wb-dropframe" aria-hidden="true">
        <span>{text}</span>
      </div>
    );
  };
  const regionDrop = (r: ViewRegion) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!drag) return;
      e.preventDefault();
      const noop = lay[r][lay[r].length - 1] === drag.id;
      const o = drag.over;
      if (!o || o.region !== r || o.before !== null || o.noop !== noop) setDrag({ id: drag.id, over: { region: r, before: null, noop } });
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (drag && !drag.over?.noop) move(drag.id, r, drag.over?.region === r ? drag.over.before : null);
      setDrag(null);
    },
  });

  const regionBox = (r: ViewRegion) => {
    const act = activeOf(r);
    return (
      <>
        <TabRow
          name={regionName[r]}
          region={r}
          ids={lay[r]}
          active={act}
          views={byId}
          onPick={(id) => update((l) => ({ ...l, active: { ...l.active, [r]: id } }))}
          overflow="menu"
          drag={drag}
          setDrag={setDrag}
          onDrop={(id, before) => move(id, r, before)}
          buttons={
            <>
              <IconButton
                variant="quiet"
                icon={MOVE_ICON}
                label={tr('把目前分頁移到{region}', { region: regionName[r === 'side' ? 'panel' : 'side'] })}
                onClick={() => moveOver(r)}
                disabled={!act}
              />
              <IconButton
                variant="quiet"
                icon={r === 'side' ? 'caret-right' : 'caret-down'}
                label={tr('{v}（{t}）', { v: tr('收合{region}', { region: regionName[r] }), t: keys[r] })}
                onClick={() => toggle(r)}
              />
            </>
          }
        />
        <Pane view={act ? byId[act] : undefined} />
        {dropFrame(r)}
      </>
    );
  };

  const brand = p.brand;
  const hasBar = !!(p.crumbs?.length || p.mainBar);
  const filter = p.explorerFilter;
  const brandInner = brand ? (
    <>
      {brand.mark ? (
        <span className="ui-wb-mark" aria-hidden="true">
          {brand.mark}
        </span>
      ) : null}
      <span className="ui-wb-name">{brand.name}</span>
    </>
  ) : null;

  // Phone: side bar and panel views in one panel docked under the main view.
  const sheetAct = sheet.act && merged.includes(sheet.act) ? sheet.act : merged[0];
  const sheetIdx = merged.indexOf(sheetAct ?? '');
  const pickSheet = (id: string) => {
    setSheet((s) => ({ ...s, act: id }));
    const r: ViewRegion = lay.side.includes(id) ? 'side' : 'panel';
    update((l) => ({ ...l, active: { ...l.active, [r]: id } }));
  };
  const reorderMerged = (next: string[]) => {
    const nSide = lay.side.length;
    update((l) => ({ ...l, side: next.slice(0, nSide), panel: next.slice(nSide) }));
  };
  const shiftSheet = (dir: 1 | -1) => {
    const j = sheetIdx + dir;
    if (sheetIdx < 0 || j < 0 || j >= merged.length) return;
    const next = merged.slice();
    next[sheetIdx] = next[j];
    next[j] = sheetAct as string;
    reorderMerged(next);
  };

  const showDropSide = !!drag && !phone && !sideDocked;
  const showDropPanel = !!drag && !phone && !panelOpen;

  return (
    <Ctx.Provider value={api}>
      <div ref={root} className={cx('ui-wb', phone && 'is-phone', sizing && 'is-sizing', p.className)} role="group" aria-label={p.label ?? tr('編輯器')}>
        <header className="ui-wb-top">
          <div className="ui-wb-top-l">
            {toggleBtn('explorer', exOpen, false)}
            {brand ? (
              brand.href ? (
                <a className="ui-wb-brand" href={brand.href} aria-label={phone ? brand.name : undefined}>
                  {brandInner}
                </a>
              ) : (
                <span className="ui-wb-brand">{brandInner}</span>
              )
            ) : null}
          </div>
          <div className="ui-wb-top-r">
            {p.actions}
            {views.length ? <span className="ui-wb-sep" aria-hidden="true" /> : null}
            {views.length
              ? toggleBtn('panel', phone ? sheetOpen && lay.panel.includes(sheetAct ?? '') : panelOpen, (phone ? !sheetOpen : !panelOpen) && attention('panel'))
              : null}
            {views.length
              ? toggleBtn('side', phone ? sheetOpen && lay.side.includes(sheetAct ?? '') : sideOpen, (phone ? !sheetOpen : !sideOpen) && attention('side'))
              : null}
          </div>
        </header>
        <div className="ui-wb-body">
          {hasBar ? (
            <div className="ui-wb-mainbar" style={{ left: mainL, right: mainR }}>
              {p.crumbs?.length ? <Breadcrumb className="ui-wb-crumbs" items={p.crumbs} /> : <span className="ui-wb-mainbar-fill" />}
              {p.mainBar ? <div className="ui-wb-mainbar-btns">{p.mainBar}</div> : null}
            </div>
          ) : null}
          <main className="ui-wb-main" style={{ left: mainL, right: mainR, bottom: mainB, top: hasBar ? BAR : 0 }}>
            {p.children}
          </main>

          {p.explorer || p.explorerHead || p.explorerFoot || filter ? (
            <>
              {exOverlay ? (
                <button
                  type="button"
                  tabIndex={-1}
                  className={cx('ui-wb-scrim', exOpen && 'is-open')}
                  aria-label={tr('關閉{region}', { region: regionName.explorer })}
                  onClick={() => setOv((o) => ({ ...o, explorer: false }))}
                />
              ) : null}
              <aside
                className={cx('ui-wb-ex', exOverlay ? 'is-drawer' : 'is-docked', exOpen ? 'is-open' : 'is-shut')}
                style={{ width: exW }}
                aria-label={regionName.explorer}
                inert={!exOpen}
              >
                {filter ? (
                  <div className="ui-wb-exfilter">
                    <SearchField value={filter.value} onChange={filter.onChange} label={filter.label ?? tr('篩選')} placeholder={filter.label ?? tr('篩選')} />
                  </div>
                ) : null}
                {p.explorerHead ? <div className="ui-wb-exhead">{p.explorerHead}</div> : null}
                <div className="ui-wb-exbody">{p.explorer}</div>
                {p.explorerFoot ? <div className="ui-wb-exfoot">{p.explorerFoot}</div> : null}
              </aside>
              {exDocked ? (
                <Splitter
                  label={tr('{region}寬度', { region: regionName.explorer })}
                  vertical
                  grow={1}
                  value={exW}
                  min={LIM.explorer[0]}
                  max={LIM.explorer[1]}
                  onChange={(v) => update((l) => ({ ...l, size: { ...l.size, explorer: v } }))}
                  onReset={() => update((l) => ({ ...l, size: { ...l.size, explorer: def.size.explorer } }))}
                  onDrag={setSizing}
                  style={{ left: exW }}
                />
              ) : null}
            </>
          ) : null}

          {!phone && panelHas ? (
            <>
              <section
                className={cx('ui-wb-panel', panelOpen ? 'is-open' : 'is-shut', drag?.over?.region === 'panel' && 'is-dropping')}
                style={{ left: mainL, right: mainR, height: panelH }}
                aria-label={regionName.panel}
                inert={!panelOpen}
                {...regionDrop('panel')}
              >
                {regionBox('panel')}
              </section>
              {panelOpen ? (
                <Splitter
                  label={tr('{region}高度', { region: regionName.panel })}
                  vertical={false}
                  grow={-1}
                  value={panelH}
                  min={LIM.panel[0]}
                  max={panelMax}
                  onChange={(v) => update((l) => ({ ...l, size: { ...l.size, panel: v } }))}
                  onReset={() => update((l) => ({ ...l, size: { ...l.size, panel: def.size.panel } }))}
                  onDrag={setSizing}
                  style={{ left: mainL, right: mainR, bottom: panelH }}
                />
              ) : null}
            </>
          ) : null}

          {!phone && sideHas ? (
            <>
              {sideOverlay ? (
                <button
                  type="button"
                  tabIndex={-1}
                  className={cx('ui-wb-scrim', sideOpen && 'is-open')}
                  aria-label={tr('關閉{region}', { region: regionName.side })}
                  onClick={() => setOv((o) => ({ ...o, side: false }))}
                />
              ) : null}
              <aside
                className={cx(
                  'ui-wb-side',
                  sideOverlay ? 'is-drawer' : 'is-docked',
                  sideOpen ? 'is-open' : 'is-shut',
                  drag?.over?.region === 'side' && 'is-dropping',
                )}
                style={{ width: sideW }}
                aria-label={regionName.side}
                inert={!sideOpen}
                {...regionDrop('side')}
              >
                {regionBox('side')}
              </aside>
              {sideDocked ? (
                <Splitter
                  label={tr('{region}寬度', { region: regionName.side })}
                  vertical
                  grow={-1}
                  value={sideW}
                  min={LIM.side[0]}
                  max={LIM.side[1]}
                  onChange={(v) => update((l) => ({ ...l, size: { ...l.size, side: v } }))}
                  onReset={() => update((l) => ({ ...l, size: { ...l.size, side: def.size.side } }))}
                  onDrag={setSizing}
                  style={{ right: sideW }}
                />
              ) : null}
            </>
          ) : null}

          {showDropSide ? (
            <div
              className={cx('ui-wb-dropzone is-side', drag?.over?.region === 'side' && 'is-over')}
              style={{ bottom: (panelOpen ? panelH : 0) + 8 }}
              {...regionDrop('side')}
            >
              {tr('放開以移到{region}', { region: regionName.side })}
            </div>
          ) : null}
          {showDropPanel ? (
            <div
              className={cx('ui-wb-dropzone is-panel', drag?.over?.region === 'panel' && 'is-over')}
              style={{ left: mainL + 8, right: mainR + (showDropSide ? 120 : 8) }}
              {...regionDrop('panel')}
            >
              {tr('放開以移到{region}', { region: regionName.panel })}
            </div>
          ) : null}

          {phone && merged.length ? (
            <section
              className={cx('ui-wb-sheet', sheetOpen ? 'is-open' : 'is-shut')}
              style={{ height: sheetSize }}
              aria-label={tr('面板分頁')}
              inert={!sheetOpen}
            >
              <Splitter
                label={tr('面板高度')}
                vertical={false}
                grow={-1}
                value={sheetSize}
                min={120}
                max={Math.max(120, sheetMax)}
                onChange={setSheetH}
                onReset={() => setSheetH(null)}
                onDrag={setSizing}
                style={{ top: 0, left: 0, right: 0 }}
              />
              <span className="ui-wb-grab" aria-hidden="true" />
              <TabRow
                name={tr('面板分頁')}
                region="sheet"
                ids={merged}
                active={sheetAct}
                views={byId}
                onPick={pickSheet}
                overflow="scroll"
                onReorder={reorderMerged}
                buttons={
                  <>
                    <IconButton variant="quiet" icon="caret-left" label={tr('目前分頁往左移')} disabled={sheetIdx <= 0} onClick={() => shiftSheet(-1)} />
                    <IconButton
                      variant="quiet"
                      icon="caret-right"
                      label={tr('目前分頁往右移')}
                      disabled={sheetIdx < 0 || sheetIdx >= merged.length - 1}
                      onClick={() => shiftSheet(1)}
                    />
                    <IconButton variant="quiet" icon="caret-down" label={tr('收起面板')} onClick={() => setSheet((s) => ({ ...s, open: false }))} />
                  </>
                }
              />
              <Pane
                view={sheetAct ? byId[sheetAct] : undefined}
                onSwipe={(dir) => {
                  const j = sheetIdx + dir;
                  if (j >= 0 && j < merged.length) pickSheet(merged[j]);
                }}
              />
              <div className="ui-wb-dots" aria-hidden="true">
                {merged.map((id) => (
                  <span key={id} className={cx('ui-wb-pagedot', id === sheetAct && 'is-on')} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </Ctx.Provider>
  );
}
