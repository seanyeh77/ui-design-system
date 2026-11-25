import * as React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../Button/Button';
import { SearchField } from '../SearchField/SearchField';
import { Tabs } from '../Tabs/Tabs';
import { format } from '../../format';
import { tr, unitFor, type CountUnit } from '../../i18n';
import { Icon, type CustomIcon } from '../../icons/Icon';
import { TOUCH_ONLY, copyText, cx, idPart, monoNums, reduced, resizeObserver, seenOnly, useMedia, useNarrow } from '../../internal/util';
import { Tooltip } from '../Tooltip/Tooltip';
import { Skeleton } from '../Skeleton/Skeleton';
import { RelativeTime } from '../RelativeTime/RelativeTime';
import { DEV, devWarn } from '../../internal/dev';
import { useStored } from '../../internal/stored';
import { CheckMark } from '../../internal/Field';
import { announce } from '../../announce';
import { ScrollHint, useScrollHint } from '../../internal/scrollHint';
import { ColResize, MIN_COL, TableDialog, markdownTable } from '../../internal/tableTools';
import { asDate, cellText, isActive, isDateCol, matches, readSort, readUrl, resolveFilters, searchHit, writeSort, writeUrl, type SortLevel } from './filters';
import { FilterButton, FilterChips, FullText, LongText, MoreMenu, markMatch, type FilterChip } from './parts';
import { SortButton, dirWord, sortSentence } from './SortButton';
import type { DataTableColumn, DataTableFilter, DataTableView, FilterOption, FilterValue, ResolvedFilter, Row, RowKey, Total } from './types';
import { includeIcons } from '../../icons/store';
import phCaretRight from '../../icons/ph/caret-right';
import phCheck from '../../icons/ph/check';
import phX from '../../icons/ph/x';

includeIcons(phCaretRight, phCheck, phX);

// The checkbox column (px): the 22 px box with 9 px on each side.
const SEL = 40;

export type { DataTableColumn, DataTableFilter, DataTableView, FilterOption, FilterValue, RangeValue, Row, RowKey, Total } from './types';

export interface DataTableProps<R extends Row = Record<string, unknown>> {
  /** The columns, in order; key names a field of the row (checked by TypeScript). */
  columns: DataTableColumn<R>[];
  /** Give each row an `id` so selection and animations follow the row, not its position. */
  rows: R[];
  /** Title above the table, also its accessible name. */
  caption?: string;
  /** Segmented summary above the table: 「全部」 plus one tab per status with its count; picking one filters the rows.
   *  `unit` follows every count; default 「筆」. A function gets the count, for plurals in other languages. */
  summary?: { key: RowKey<R>; items: { value: string; label: string }[]; label?: string; unit?: CountUnit };
  /** aria-label when there is no caption. */
  label?: string;
  /** What one row is, after every count (the summary, 「24 筆」, the pages, 「已選 2 筆」): 「個」, 「件」. A function gets
   *  the count, for plurals in other languages. Default summary.unit, else 「筆」. */
  unit?: CountUnit;
  /** Data is still loading: the toolbar and header stay, and loadingRows skeleton rows of the columns' shape take the
   *  rows' place. Default false. */
  loading?: boolean;
  /** How many skeleton rows loading shows. Default pageSize, at most 10. */
  loadingRows?: number;
  /** Rows per page. Default 10. */
  pageSize?: number;
  /** Change it when the rows become a different data set: search, filters, sort, page, selection and summary reset. */
  resetKey?: string | number;
  /** The page's primary action, one primary Button (「新增」): at the right end of the toolbar, on one row with the
   *  summary tabs and the search field when they fit. Use it instead of a Card head that holds only this button. */
  action?: React.ReactNode;
  /** Checkboxes appear when a row is hovered, and on every row once any row is selected; the header's is always shown. */
  selectable?: boolean;
  /** Buttons for the bar that replaces the header while rows are selected. */
  bulkActions?: (ids: string[], clear: () => void) => React.ReactNode;
  /** IconButtons over the row's right end, shown while the row is hovered or has keyboard focus (always on touch
   *  screens and phone cards). They take no column of their own. */
  rowActions?: (row: R) => React.ReactNode;
  /** px kept free at the end of each row's last cell for the row actions, so they never cover its content. Default:
   *  the width the actions take, measured. */
  actionsWidth?: number;
  /** false: no toolbar row at all (no search, 「篩選」, 「排序」, 「⋯」 or count), for a small table of a few rows that
   *  needs none of them. Headings still sort on click. Default true. */
  toolbar?: boolean;
  /** Search box (default on; false hides it). Searches every column unless keys is given. */
  search?: false | { placeholder?: string; keys?: RowKey<R>[] };
  /** Filters in the 「篩選」 popover. */
  filters?: DataTableFilter<R>[];
  /** @deprecated use filters. */
  filter?: { key: RowKey<R>; label?: string; options: FilterOption[] };
  /** 「/」 focuses this table's search field when focus is not in a text field (no Ctrl, Alt or ⌘). Only the first
   *  table on the page with a search field takes it; it shows a small 「/」 in the empty field on desktop. Default true. */
  searchShortcut?: boolean;
  /** Each row's page: the first cell's text becomes a link to it, and a click anywhere else on the row (not on its own
   *  links, buttons or checkbox, nor a click that ends a text selection) opens it. Like a link, Ctrl, ⌘ or Shift + click
   *  and a middle click open it in a new tab. */
  rowHref?: (row: R) => string;
  /** With rowHref: called instead of following the link on a plain click (on the row or its first cell's link), so an
   *  app router can push the route. Ctrl, ⌘, Shift and middle clicks still open the href in a new tab. */
  onRowOpen?: (row: R, event: React.MouseEvent) => void;
  /** Write search and filters into the URL. Default true. */
  urlSync?: boolean;
  /** Prefix of the URL parameters when a page has several tables. */
  urlKey?: string;
  /** The sort before anyone changes it, first level first, e.g. [{ key: 'prog' }, { key: 'dt', dir: 'desc' }]. A level
   *  without dir starts like a click on its heading: numbers from the largest, text from A. Default: the rows' order. */
  defaultSort?: readonly { key: RowKey<R>; dir?: 'asc' | 'desc' }[];
  /** How many columns can sort at once (the 「排序」 panel, Shift + click on a heading). Default: no limit, every sortable
   *  column. */
  maxSort?: number;
  /** Saved views shown as tabs above the table. */
  views?: DataTableView<R>[];
  /** Totals row: 'sum', 'avg' or a function per column key. */
  totals?: Partial<Record<string, Total<R>>>;
  /** Keep the first column visible while scrolling sideways. */
  stickyFirst?: boolean;
  /** 「欄位」 in the 「⋯」 menu, to hide columns. Default true. */
  columnMenu?: boolean;
  /** Remembers the column widths readers drag (the borders in the header) and the columns they hide or show, in
   *  localStorage under this name (ui-dt-width:<storageKey>, ui-dt-cols:<storageKey>). Without it they go back to the
   *  defaults when the page reloads. resetKey does not clear them: they are the reader's own; 「欄位」 → 「還原預設」 does. */
  storageKey?: string;
  /** @deprecated Renamed `storageKey`, like every other component that remembers a choice; the stored values carry over. */
  widthKey?: string;
  /** 「放大表格」 in the 「⋯」 menu: the whole table, with its search, filters, sort and pages, in a dialog up to
   *  1200 px wide. A click on a link inside closes the dialog. Not on phones. Default true. */
  zoom?: boolean;
  /** 「複製成 Markdown」 in the 「⋯」 menu: every row the search and filters keep (all pages), in the shown columns and
   *  order; each cell is the column's fullText, else its searchText, else its value. Default true. */
  copy?: boolean;
  /** Your own text for 「複製成 Markdown」, from the same rows (all pages, sorted). */
  copyText?: (rows: R[]) => string;
  /** Copying failed (the browser does not allow the clipboard): say so, for example in a Toast. */
  onCopyError?: () => void;
  /** Default 「沒有符合的資料」. */
  emptyText?: string;
  /** Extra class on the root element. */
  className?: string;
}

const MOVE = { dur: 320, stagger: 25, ease: 'cubic-bezier(.2,.8,.2,1)' };
const ARROWS: Record<'asc' | 'desc' | 'none', CustomIcon> = { asc: 'M12 19V5M6 11l6-6 6 6', desc: 'M12 5v14M6 13l6 6 6-6', none: 'M8 9l4-4 4 4M8 15l4 4 4-4' };

const get = (row: Row, key: string): unknown => (row as Record<string, unknown>)[key];
// Stored column choices and widths (storageKey): an object, else the default.
const NO_TOGGLED: Record<string, boolean> = {};
const parseObject = (raw: string) => {
  const v: unknown = JSON.parse(raw);
  if (!v || typeof v !== 'object') throw new Error('not an object');
  return v;
};
const parseToggled = (raw: string) => parseObject(raw) as Record<string, boolean>;
const parseWidths = (raw: string) => parseObject(raw) as Record<string, number>;
const isNum = (c: DataTableColumn<never>) => c.numeric || c.format === 'money' || c.format === 'percent' || c.format === 'duration';
// Short by what it holds: numbers, units, dates, durations and status. It hugs its content instead of taking the room
// left (see widths below). A width is only a least width: it never makes a column short.
const isShort = (c: DataTableColumn<never>) => isNum(c) || !!c.unit || isDateCol(c) || c.mobile === 'status';
// A plain text column that is not the main one hugs its content up to this width (px); longer text wraps.
const TEXT_HUG_MAX = 280;
// Columns sized by props only, before the first measure (px).
const HUG_START = 96;
// A plain text column that hugs its content is at least this wide (px, 8 em), so a short name does not look cramped.
const TEXT_HUG_MIN = 128;
// What the main column and long columns ask for before the room left is shared (px): their content on one line, up
// to these. They get it only while every column fits; otherwise they share what is left and long text is cut.
const MAIN_WANT_MAX = 320;
const LONG_WANT_MAX = 512;
// The summary tabs, the search field (at least this wide, px) and the buttons share one row when all fit.
const SEARCH_MIN = 240;
const TOOL_GAP = 8;
// <time dateTime>: a date alone for 'date', the moment for the others.
const isoOf = (d: Date, dateOnly: boolean) =>
  dateOnly ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : d.toISOString();

/** The width of what an element holds (its text and children, not absolutely placed parts such as the column border).
 *  Null where text cannot be measured (jsdom has no Range#getBoundingClientRect): the column keeps its default width. */
function contentWidth(el: Element): number | null {
  let left = Infinity;
  let right = -Infinity;
  const range = document.createRange();
  if (typeof range.getBoundingClientRect !== 'function') return null;
  for (const n of el.childNodes) {
    let r: DOMRect | null = null;
    if (n instanceof HTMLElement) {
      if (n.classList.contains('ui-col-resize') || getComputedStyle(n).position === 'absolute') continue;
      r = n.getBoundingClientRect();
    } else if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) {
      range.selectNodeContents(n);
      r = range.getBoundingClientRect();
    }
    if (r && r.width) {
      left = Math.min(left, r.left);
      right = Math.max(right, r.right);
    }
  }
  return right > left ? right - left : 0;
}

// 「/」 focuses the search field of the first table on the page that has one (in page order) and that is shown: a table
// in a hidden tab panel, a closed drawer or behind a modal does not take it. One listener for all.
const shortcutTables = new Set<HTMLElement>();
const shortcutListeners = new Set<() => void>();
// Tables hidden or shown later (a tab panel switched, a drawer opened) change size, so the 「/」 hint moves with them.
let shortcutSizes: ResizeObserver | null = null;
const notifyShortcut = () => shortcutListeners.forEach((f) => f());
type Visible = { checkVisibility?: (o?: Record<string, boolean>) => boolean };
/** Rendered and not hidden: not display: none (itself or an ancestor), not visibility: hidden, not inert or aria-hidden. */
function isShown(el: HTMLElement): boolean {
  if (!el.isConnected || el.closest('[inert], [aria-hidden="true"]')) return false;
  const check = (el as HTMLElement & Visible).checkVisibility;
  if (typeof check === 'function') return check.call(el, { checkVisibilityCSS: true, visibilityProperty: true });
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
}
const shortcutInput = (el: HTMLElement) => el.querySelector<HTMLInputElement>(':scope > .ui-dt-tools .ui-dt-search input');
const firstShortcutTable = (): HTMLElement | null =>
  [...shortcutTables]
    .filter((el) => isShown(el) && !!shortcutInput(el))
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))[0] ?? null;
// Where 「/」 is typed text or a key of the widget itself: fields, lists, grids, menus and dialogs keep it.
const SLASH_OWNERS =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="searchbox"], [role="combobox"], [role="listbox"], [role="grid"], [role="treegrid"], [role="tree"], [role="menu"], [role="menubar"], [role="dialog"], [role="alertdialog"], dialog';
function onSlash(e: KeyboardEvent) {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || e.isComposing) return;
  const t = e.target instanceof Element ? e.target : null;
  if (t?.closest(SLASH_OWNERS)) return;
  const table = firstShortcutTable();
  const input = table ? shortcutInput(table) : null;
  if (!input) return;
  input.focus();
  // Only when the field took the focus: otherwise the key does what it would have done.
  if (document.activeElement === input) e.preventDefault();
}
function registerShortcut(el: HTMLElement, changed: () => void): () => void {
  if (!shortcutTables.size) document.addEventListener('keydown', onSlash);
  if (!shortcutSizes && typeof ResizeObserver !== 'undefined') shortcutSizes = new ResizeObserver(notifyShortcut);
  shortcutTables.add(el);
  shortcutListeners.add(changed);
  shortcutSizes?.observe(el);
  notifyShortcut();
  return () => {
    shortcutTables.delete(el);
    shortcutListeners.delete(changed);
    shortcutSizes?.unobserve(el);
    if (!shortcutTables.size) {
      document.removeEventListener('keydown', onSlash);
      shortcutSizes?.disconnect();
      shortcutSizes = null;
    }
    notifyShortcut();
  };
}

// Ctrl, ⌘, Shift or the middle button: a link opens in a new tab or window.
const newTab = (e: React.MouseEvent) => e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1;

// What a row click leaves alone: links, buttons, fields, checkboxes and anything else that acts on its own.
const ROW_CONTROLS = 'a, button, input, select, textarea, label, [role="checkbox"], [role="button"], [role="menuitem"], [role="link"], [contenteditable]';

function RowCheck({ v, label, onClick }: { v: boolean | 'mixed'; label: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={v}
      aria-label={label}
      className={cx('ui-check-box', 'ui-dt-check', v && 'is-on')}
      // Shift + click picks a range: no text selection from it.
      onMouseDown={(e) => e.shiftKey && e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      <CheckMark v={v} />
    </button>
  );
}

interface Measured {
  fit: Record<string, number>;
  clipped: boolean | null;
  want: Record<string, number>;
  roomy: boolean;
  actsW: number | null;
  onerow: boolean;
}
const UNMEASURED: Measured = { fit: {}, clipped: null, want: {}, roomy: false, actsW: null, onerow: false };

/** A date with its time, 「2026/11/18（三）04:51」: the date and the time each stay whole, and a phone card that has no
 *  room for both breaks the line between them only. Text without 「）」 (other locales, 「2 小時前」) as it is. */
function dateParts(text: string, mark: string): React.ReactNode {
  const i = text.indexOf('）');
  if (i < 0 || i === text.length - 1) return markMatch(text, mark);
  return (
    <>
      <span className="ui-dt-nowrap">{markMatch(text.slice(0, i + 1), mark)}</span>
      <wbr />
      <span className="ui-dt-nowrap">{markMatch(text.slice(i + 1), mark)}</span>
    </>
  );
}

/** The value from the render where sig last changed: a new array that says the same thing keeps the old one, so memos
 *  that depend on it do not run again. */
function useSameWhile<T>(value: T, sig: string): T {
  const [kept, setKept] = React.useState({ value, sig });
  if (kept.sig !== sig) {
    setKept({ value, sig });
    return value;
  }
  return kept.value;
}

/** What the columns say, as text: changes when a key, label or format changes, not when the array is rebuilt. */
function columnsSig(cols: readonly DataTableColumn<never>[]): string {
  return cols
    .map((c) =>
      [c.key, c.label, c.format, c.numeric, c.mono, c.unit, c.currency, c.decimals, c.sortable, !!c.sortValue, !!c.searchText, !!c.render].join('\u0002'),
    )
    .join('\u0001');
}
/** The same for the filters: keys, labels, types and options; a match function counts only by being there. */
function filtersSigOf(fs: readonly DataTableFilter<never>[] | undefined, f: { key: string; label?: string; options: FilterOption[] } | undefined): string {
  return JSON.stringify([fs?.map((x) => [x.key, x.label, x.type, x.multiple, x.scale, x.unitLabel, x.options, !!x.match]), f]);
}

interface Snapshot {
  kind: 'sort' | 'next' | 'prev';
  rows: Record<string, { top: number; bg: string; node: HTMLElement }>;
  order: string[];
}

/** The table for records: sort, search, filters, page numbers, selection with a bulk bar, row actions; cards on phones. */
export function DataTable<R extends Row = Record<string, unknown>>(p: DataTableProps<R>) {
  const { columns: cols, rows, pageSize = 10, urlSync = true, urlKey, search = {}, selectable = false, stickyFirst: sticky = false } = p;
  // Columns, filters and views are often written inline (a new array every render): the memos below follow what they
  // say (keys, formats, options), read through refs, not the arrays' identity, so a render does not sort and filter again.
  const memoCols = useSameWhile(cols, columnsSig(cols));
  const given = useSameWhile({ filters: p.filters, filter: p.filter }, filtersSigOf(p.filters, p.filter));
  const filters: ResolvedFilter<R>[] = React.useMemo(() => {
    const list = given.filters ? [...given.filters] : [];
    const f = given.filter;
    if (f && !list.length) list.push({ key: f.key, label: f.label || memoCols.find((c) => c.key === f.key)?.label || f.key, options: f.options });
    return resolveFilters(list, rows);
  }, [given, memoCols, rows]);
  const countUnit: CountUnit = p.unit ?? p.summary?.unit ?? '筆';
  const unitOf = (n: number) => unitFor(countUnit, n);
  const fromUrl = () => (urlSync && typeof location !== 'undefined' ? readUrl(urlKey, filters) : { q: '', values: {} });
  const maxSort = Math.max(1, p.maxSort ?? Infinity);
  const sortCols = cols.filter((c) => c.sortable !== false).map((c) => ({ key: c.key, label: c.label, numeric: isNum(c) }));
  const firstDir = (key: string): SortLevel['dir'] => (sortCols.find((c) => c.key === key)?.numeric ? 'desc' : 'asc');
  // Only sortable columns, each once, at most maxSort.
  const validSort = (l: readonly { key: string; dir?: SortLevel['dir'] }[]): SortLevel[] =>
    l
      .filter((x, i) => sortCols.some((c) => c.key === x.key) && l.findIndex((y) => y.key === x.key) === i)
      .slice(0, maxSort)
      .map((x) => ({ key: x.key, dir: x.dir ?? firstDir(x.key) }));
  const initialSort = validSort(p.defaultSort ?? []);
  const [sort, setSort] = React.useState<SortLevel[]>(() => validSort((urlSync && typeof location !== 'undefined' ? readSort(urlKey) : null) ?? initialSort));
  const [page, setPage] = React.useState(0);
  const [q, setQ] = React.useState(() => fromUrl().q);
  const [values, setValues] = React.useState<Record<string, FilterValue>>(() => fromUrl().values);
  const [view, setView] = React.useState(p.views?.[0]?.id ?? null);
  // Columns people turned on or off in the 「欄位」 menu; the others follow their own `hidden`. Remembered under storageKey.
  const storageKey = p.storageKey ?? p.widthKey;
  const colsKey = storageKey ? 'ui-dt-cols:' + storageKey : null;
  // None on the server and the first browser render, then the stored choice (useStored); an empty choice is removed.
  const [toggled, setToggled] = useStored<Record<string, boolean>>(colsKey ?? undefined, parseToggled, NO_TOGGLED, (t) =>
    Object.keys(t).length ? JSON.stringify(t) : null,
  );
  // Rows opened with the caret on the left: their long columns in full, below the row.
  const [opened, setOpened] = React.useState<Record<string, boolean>>({});
  const narrow = useNarrow();
  const touch = useMedia(TOUCH_ONLY);
  const uid = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [sel, setSel] = React.useState<Record<string, boolean>>({});
  const [sumVal, setSumVal] = React.useState('all');
  // What the measuring effect reads from the drawn table, in one state so one measure is one render (see below).
  const [measured, setMeasured] = React.useState<Measured>(UNMEASURED);
  // fit: widths (px) that columns grew to so content that cannot wrap is not cut. clipped: whether a long cell on the
  // page is cut at its column's edge (desktop; null until measured). want, roomy: what the main and long columns ask for
  // (px), and whether every column gets it. actsW: the row actions' width (px), kept free at the end of the last cell.
  // onerow: the summary tabs, the search field and the buttons fit on one row.
  const { fit, clipped, want, roomy, actsW, onerow: onerowState } = measured;
  const wantRef = React.useRef(want);
  // A2: widths readers dragged (px per column key); null = width and grow decide. Remembered under storageKey.
  const [widths, setWidths] = useStored<Record<string, number> | null>(storageKey ? 'ui-dt-width:' + storageKey : undefined, parseWidths, null);
  // In the 「放大表格」 dialog: open, and the widths dragged there (not kept; the page's widths stay).
  const [zoomed, setZoomed] = React.useState(false);
  const [zoomWidths, setZoomWidths] = React.useState<Record<string, number> | null>(null);
  const zoomRef = React.useRef<HTMLDivElement>(null);
  // Without a search field, a table right under a Card's title puts its tools in that title row instead of a row of
  // their own: the Card's head element, found after the first render.
  const [headSlot, setHeadSlot] = React.useState<HTMLElement | null>(null);
  const noSearch = search === false && !p.caption;
  React.useLayoutEffect(() => {
    const prev = noSearch ? rootRef.current?.previousElementSibling : null;
    setHeadSlot(prev instanceof HTMLElement && prev.classList.contains('ui-card-head') && prev.parentElement?.classList.contains('ui-card') ? prev : null);
  }, [noSearch]);
  // A Card head with only buttons above the table (the old way to place 「新增」) leaves a row of its own for one button.
  React.useEffect(() => {
    const prev = rootRef.current?.previousElementSibling;
    devWarn(
      prev?.classList.contains('ui-card-head') && !prev.querySelector('.ui-card-title') && prev.querySelector('.ui-card-actions'),
      'DataTable',
      "the Card around this table has actions but no title, so its one button takes a row of its own above the table. Pass the page's primary action to DataTable's action instead: it goes at the right end of the toolbar.",
    );
  }, []);
  const [resetKey, setResetKey] = React.useState(p.resetKey);
  const resetting = resetKey !== p.resetKey;
  if (resetting) {
    setResetKey(p.resetKey);
    setQ('');
    setValues({});
    setPage(0);
    setSel({});
    setSumVal('all');
    setSort(initialSort);
    // Remembered columns (storageKey) are the reader's own, like the widths: a new data set keeps them.
    if (!colsKey) setToggled({});
    setOpened({});
    setMeasured((m) => ({ ...m, fit: {}, want: {}, clipped: null }));
  }
  const valuesKey = JSON.stringify(values);
  const sortKey = JSON.stringify(sort);
  React.useEffect(() => {
    if (urlSync && typeof location !== 'undefined') writeSort(urlKey, sort, initialSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- written when the sort changes
  }, [sortKey]);
  React.useEffect(() => {
    if (urlSync && filters.length) writeUrl(urlKey, filters, values, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- written when the conditions change, not when the filter list is rebuilt
  }, [valuesKey, q]);
  devWarn(
    p.widthKey !== undefined,
    'DataTable',
    '`widthKey` is deprecated: rename it to `storageKey`, as in every other component that remembers a choice. The stored widths and columns carry over.',
  );
  devWarn(
    () => cols.some((c) => c.format === 'percent' && !c.unit),
    'DataTable',
    "format: 'percent' sets 1 decimal and shows no % sign; add unit: '%' to that column.",
  );
  devWarn(
    () => rows.length > 1 && rows.every((r) => get(r, 'id') == null) && selectable,
    'DataTable',
    'rows have no id, so a selection follows the position, not the row. Add an id to each row.',
  );

  devWarn(
    () => cols.some((c) => c.format === 'datetime'),
    'DataTable',
    "format: 'datetime' is the old spelling, kept for now. Write format: 'dateTime', as format.dateTime().",
  );
  devWarn(!!cols[0]?.hidden, 'DataTable', 'the first column is always shown, so its hidden: true does nothing. Move the column, or drop hidden.');
  devWarn(
    () => (p.columnMenu === false || cols.length <= 2) && cols.some((c, i) => i > 0 && c.hidden),
    'DataTable',
    'a column has hidden: true but there is no 「欄位」 menu (columnMenu is false, or the table has 2 columns or fewer), so nobody can turn it on. Turn the menu on, or leave the column out.',
  );
  // One condition in one place: a status the summary tabs pick should not be a filter or a view as well.
  const sumKey = p.summary?.key;
  if (DEV) {
    const twiceFilter = sumKey ? filters.find((f) => f.key === sumKey) : undefined;
    devWarn(
      twiceFilter,
      'DataTable',
      `the filter 「${twiceFilter?.label}」 filters ${String(sumKey)}, which the summary tabs already filter, so the same condition is in two places. Drop it from filters (or drop summary).`,
    );
    // A view filters the same key when the rows it keeps are exactly the rows of one summary value.
    const twiceView =
      sumKey && rows.length
        ? p.views?.find((v) => {
            if (!v.filter) return false;
            const kept = rows.filter((r) => v.filter?.(r));
            if (!kept.length || kept.length === rows.length) return false;
            const val = String(get(kept[0], sumKey));
            return kept.every((r) => String(get(r, sumKey)) === val) && rows.filter((r) => String(get(r, sumKey)) === val).length === kept.length;
          })
        : undefined;
    devWarn(
      twiceView,
      'DataTable',
      `the view 「${twiceView?.label}」 keeps exactly the rows of one ${String(sumKey)} value, which a summary tab already picks, so the same condition is in two places. Drop the view (or drop summary).`,
    );
    // A number with its unit baked into a string cannot be formatted, aligned or sorted as a number.
    for (const c of cols) {
      if (!c.unit && !c.numeric) continue;
      const bad = rows
        .map((r) => get(r, c.key))
        .find((v) => typeof v === 'string' && /\d/.test(v) && (c.unit ? v.includes(c.unit) : !/^\s*-?[\d,]*\.?\d+\s*$/.test(v)));
      devWarn(
        bad !== undefined,
        'DataTable',
        `column 「${c.label}」 got the string 「${String(bad)}」. Pass a number${c.unit ? '' : ' and the unit in unit'} (e.g. { numeric: true, unit: '${c.unit || 'items'}' } with 1234), so it is formatted, right-aligned and sorted as a number.`,
      );
    }
  }
  const hidden: Record<string, boolean> = {};
  cols.forEach((c, i) => (hidden[c.key] = i > 0 && (toggled[c.key] ?? !!c.hidden)));
  const shownCols = cols.filter((c) => !hidden[c.key]);
  const { ref: scrollRef, more: scrollMore, overflows, scrolled, onScroll } = useScrollHint();
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const rowEls = React.useRef<Record<string, HTMLDivElement | null>>({});
  const snap = React.useRef<Snapshot | null>(null);

  const summary = p.summary;
  const searching = search !== false && !!q;
  const searchKeys = search ? search.keys : undefined;
  // Read by the memo below as a string, so a new keys array with the same keys does not search again.
  const searchKeysKey = searchKeys ? searchKeys.join('\u0001') : null;
  const passes = (r: R, skip?: string) =>
    (!searching || searchHit(r, cols, filters, q, searchKeys)) && filters.every((f) => f.key === skip || matches(f, r, values[f.key]));
  // View, summary, search, filters and sort run again only when one of them or the rows change, not on every render
  // (a hover, a selection, a measured width).
  const views = useSameWhile(p.views, p.views ? p.views.map((v) => v.id + '\u0002' + !!v.filter).join('\u0001') : '');
  const { all, sumAll, list } = React.useMemo(() => {
    const cols = memoCols;
    let all = rows.map((r, i) => ({ r, i }));
    const viewObj = views?.find((v) => v.id === view);
    if (viewObj?.filter) all = all.filter((x) => viewObj.filter?.(x.r));
    const sumAll = all;
    if (sumKey && sumVal !== 'all') all = all.filter((x) => String(get(x.r, sumKey)) === sumVal);
    const keys = searchKeysKey === null ? undefined : (searchKeysKey.split('\u0001') as RowKey<R>[]);
    const hit = (r: R) => (!searching || searchHit(r, cols, filters, q, keys)) && filters.every((f) => matches(f, r, values[f.key]));
    let list = all.filter((x) => hit(x.r));
    if (sort.length) {
      // The first level decides; the next only between rows the first finds equal; then the rows' own order.
      const by = sort.map((l) => {
        const col = cols.find((c) => c.key === l.key);
        // Dates by time (an ISO string or a Date), not by their text.
        const val = (r: R): unknown => {
          if (col?.sortValue) return col.sortValue(r);
          const v = get(r, l.key);
          if (v instanceof Date || (col && isDateCol(col))) return asDate(v)?.getTime() ?? -Infinity;
          return v;
        };
        return { val, d: l.dir === 'asc' ? 1 : -1 };
      });
      list = [...list].sort((a, b) => {
        for (const { val, d } of by) {
          const x = val(a.r);
          const y = val(b.r);
          const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'zh-Hant');
          if (c) return c * d;
        }
        return a.i - b.i;
      });
    }
    return { all, sumAll, list };
  }, [rows, memoCols, filters, values, q, searching, searchKeysKey, sort, view, views, sumKey, sumVal]);
  const baseCount = all.length;
  const activeN = filters.filter((f) => isActive(values[f.key])).length;
  // After the search, a filter, the summary or the view changes (not on first render): 「顯示 6 筆」.
  const shownKey = `${q}|${valuesKey}|${sumVal}|${view}`;
  const firstKey = React.useRef(shownKey);
  const shownN = list.length;
  const shownText = tr('顯示 {n} {unit}', { n: format.number(shownN), unit: unitOf(shownN) });
  React.useEffect(() => {
    if (shownKey === firstKey.current) return;
    firstKey.current = '';
    const t = setTimeout(() => announce(shownText), 400);
    return () => clearTimeout(t);
  }, [shownKey, shownText]);
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const pageNow = Math.min(page, pages - 1);
  const start = pageNow * pageSize;
  const vis = React.useMemo(() => list.slice(start, start + pageSize), [list, start, pageSize]);
  const idOf = (x: { r: R; i: number }) => {
    const id = get(x.r, 'id');
    return id != null ? String(id) : String(x.i);
  };
  // Only rows the filters, search, view and summary still show (any page) stay selected: rows filtered out or
  // deleted are unchecked, so bulkActions acts only on what the person can see.
  const present = new Set(list.map(idOf));
  const selIds = Object.keys(sel).filter((k) => sel[k] && present.has(k));
  // Skipped while resetting: the reset above already cleared the selection, and this call would win over it.
  if (!resetting && Object.keys(sel).some((k) => sel[k] && !present.has(k))) setSel(Object.fromEntries(selIds.map((k) => [k, true])));
  const visIds = vis.map(idOf);
  const selVis = visIds.filter((id) => sel[id]).length;
  const allOn = visIds.length > 0 && selVis === visIds.length;
  const mixed = selVis > 0 && !allOn;

  // Remember where every row is; the layout effect then animates from there (FLIP).
  const capture = (kind: Snapshot['kind']) => {
    const body = bodyRef.current;
    if (!body) return;
    const top0 = body.getBoundingClientRect().top;
    const snapRows: Snapshot['rows'] = {};
    const order: string[] = [];
    for (const id of visIds) {
      const el = rowEls.current[id];
      if (!el) continue;
      snapRows[id] = { top: el.getBoundingClientRect().top - top0, bg: getComputedStyle(el).backgroundColor, node: el };
      order.push(id);
    }
    snap.current = { kind, rows: snapRows, order };
  };
  React.useLayoutEffect(() => {
    const sn = snap.current;
    snap.current = null;
    const body = bodyRef.current;
    if (!sn || !body || reduced() || typeof Element.prototype.animate !== 'function') return;
    const top0 = body.getBoundingClientRect().top;
    const n = Math.max(sn.order.length, visIds.length);
    let k = 0;
    let rh = 48;
    visIds.forEach((id, i) => {
      const el = rowEls.current[id];
      if (!el) return;
      const r = el.getBoundingClientRect();
      rh = r.height || rh;
      const old = sn.rows[id];
      const timing = { duration: MOVE.dur, delay: i * MOVE.stagger, easing: MOVE.ease, fill: 'backwards' as const };
      if (old) {
        const from = old.top - (r.top - top0);
        el.animate(
          [
            { transform: `translateY(${from}px)`, backgroundColor: old.bg },
            { transform: 'none', backgroundColor: getComputedStyle(el).backgroundColor },
          ],
          timing,
        );
      } else {
        const off = sn.kind === 'next' ? n : sn.kind === 'prev' ? -n : n + k - i;
        k++;
        el.animate(
          [
            { transform: `translateY(${off * rh}px)`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          timing,
        );
      }
    });
    // Rows that left the page: animate a copy out.
    sn.order.forEach((id, j) => {
      if (visIds.includes(id)) return;
      const o = sn.rows[id];
      const ghost = o.node.cloneNode(true) as HTMLElement;
      ghost.removeAttribute('data-rid');
      ghost.setAttribute('aria-hidden', 'true');
      // A picture of the leaving row only: nothing in it takes focus or repeats an id of the live table.
      ghost.inert = true;
      for (const el of ghost.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')) el.tabIndex = -1;
      for (const el of [ghost, ...ghost.querySelectorAll<HTMLElement>('[id]')]) el.removeAttribute('id');
      ghost.classList.add('ui-dt-ghost');
      ghost.style.top = o.top + 'px';
      ghost.style.backgroundColor = o.bg;
      body.appendChild(ghost);
      const to = sn.kind === 'next' ? -n : sn.kind === 'prev' ? n : n + 1 - j;
      // Clipped to the table body while copies leave (is-leaving): they never draw below the table or its Card.
      body.classList.add('is-leaving');
      ghost.animate(
        [
          { transform: 'none', opacity: 1 },
          { transform: `translateY(${to * rh}px)`, opacity: 0 },
        ],
        { duration: MOVE.dur, easing: MOVE.ease, fill: 'forwards' },
      ).onfinish = () => {
        ghost.remove();
        if (!body.querySelector(':scope > .ui-dt-ghost')) body.classList.remove('is-leaving');
      };
    });
  });

  const changeSort = (next: SortLevel[]) => {
    capture('sort');
    setSort(next);
    announce(sortSentence(next, sortCols));
  };
  // A click sorts by this column alone: first click from A (numbers from the largest), second reversed, third back
  // to the rows' order. Shift + click (add) makes it the next level instead: added, reversed, removed.
  const sortBy = (c: DataTableColumn<R>, add = false) => {
    if (c.sortable === false) return;
    const first = firstDir(c.key);
    const flip = first === 'asc' ? 'desc' : 'asc';
    const i = sort.findIndex((l) => l.key === c.key);
    if (add) {
      if (i < 0) {
        if (sort.length < maxSort) changeSort([...sort, { key: c.key, dir: first }]);
        else announce(tr('最多 {n} 層排序。', { n: maxSort }));
      } else if (sort[i].dir === first) changeSort(sort.map((l, j) => (j === i ? { key: l.key, dir: flip } : l)));
      else changeSort(sort.filter((_, j) => j !== i));
      return;
    }
    if (sort.length !== 1 || i !== 0) changeSort([{ key: c.key, dir: first }]);
    else if (sort[0].dir === first) changeSort([{ key: c.key, dir: flip }]);
    else changeSort([]);
  };
  const goPage = (n: number) => {
    if (n === pageNow || n < 0 || n >= pages) return;
    capture(n > pageNow ? 'next' : 'prev');
    setPage(n);
  };
  const toggle = (ids: string[], v: boolean) => setSel({ ...sel, ...Object.fromEntries(ids.map((id) => [id, v])) });
  const clear = () => setSel({});
  // Shift + click on a row's checkbox: every row from the last one clicked to this one (in the shown order, any page)
  // takes this one's new state. Only rows the search, filters, view and summary keep, in the current sort.
  const lastPick = React.useRef<string | null>(null);
  // A new search, filter, summary tab, view, sort or page size changes which rows lie between two clicks: the range
  // starts again from the next click.
  const anchorKey = `${shownKey}|${sortKey}|${pageSize}`;
  React.useEffect(() => {
    lastPick.current = null;
  }, [anchorKey]);
  const pickRow = (id: string, on: boolean, shift: boolean) => {
    const ids = list.map(idOf);
    const from = shift && lastPick.current ? ids.indexOf(lastPick.current) : -1;
    const to = ids.indexOf(id);
    lastPick.current = id;
    if (from < 0 || to < 0 || from === to) return toggle([id], !on);
    const next = { ...sel, ...Object.fromEntries(ids.slice(Math.min(from, to), Math.max(from, to) + 1).map((k) => [k, !on])) };
    setSel(next);
    const n = ids.filter((k) => next[k]).length;
    announce(tr('已選 {n} {unit}', { n, unit: unitOf(n) }));
  };
  const clearFilters = () => {
    setValues({});
    setQ('');
    setPage(0);
  };

  const hasAct = !!p.rowActions;
  const onerow = onerowState && !narrow;
  const hasTitle = shownCols.some((c) => c.mobile === 'title');
  const mobileClass = (c: DataTableColumn<R>, ci: number) => {
    const m = c.mobile || (!hasTitle && ci === 0 ? 'title' : null);
    return m ? 'is-m-' + m : null;
  };
  // A caret on the left of each row when there are long columns (desktop; phone cards have 「顯示全部」).
  // Columns whose whole text the row's details show: long ones, and short ones with fullText.
  const longCols = shownCols.filter((c) => c.long || c.fullText);
  // A long column only needs the caret while a cell on the page is cut (measured below; null until measured, and where
  // layout cannot be measured). fullText always says more than the cell, so it keeps the caret. An open row keeps it.
  const expander = longCols.length > 0 && !narrow && (clipped !== false || longCols.some((c) => c.fullText) || visIds.some((id) => opened[id]));
  const EXP = 40;
  // Widths by default. The main column (the first text column) and long ones take the room left; the others hug their
  // content: numbers, units, dates, durations, status Badges and other short text. A width is a least width for any
  // column and never decides which column is the main one. A grow prop wins either way. Hugging columns are measured below (their heading and every cell on the page, widest wins).
  // A mono column (an ID, a hash) is never the main one: without another text column, none takes the room left.
  const mainKey = shownCols.find((c) => !isShort(c) && !c.long && !c.mono && c.grow !== 0)?.key;
  const grows = (c: DataTableColumn<R>) => (c.grow != null ? c.grow > 0 : c.long || c.key === mainKey);
  // A column is at least as wide as content that cannot wrap (a code chip, a link with a path): measured below.
  const minOf = (c: DataTableColumn<R>) => {
    if (grows(c)) return Math.max(c.width || (isNum(c) ? 96 : 120), fit[c.key] || 0, roomy ? want[c.key] || 0 : 0);
    const text = c.width == null && !isShort(c);
    const cap = text ? TEXT_HUG_MAX : Infinity;
    return Math.max(c.width || 0, MIN_COL, text ? TEXT_HUG_MIN : 0, Math.min(fit[c.key] ?? c.width ?? HUG_START, cap));
  };
  // Dragged widths (A2) fix every shown column in px; a column shown later starts at its least width.
  const layout = (w: Record<string, number> | null) => {
    const colW = (c: DataTableColumn<R>) => (w ? `${w[c.key] ?? minOf(c)}px` : grows(c) ? `minmax(${minOf(c)}px, ${c.grow || 1}fr)` : `${minOf(c)}px`);
    // Row actions take no column: they show over the row's end (see .ui-dt-acts). On touch screens, where they always
    // show, the rows keep --dt-acts-w free at their end instead.
    const template = [expander ? EXP + 'px' : null, selectable ? SEL + 'px' : null, ...shownCols.map(colW)].filter(Boolean).join(' ');
    const minW = (expander ? EXP : 0) + (selectable ? SEL : 0) + shownCols.reduce((a, c) => a + (w ? (w[c.key] ?? minOf(c)) : minOf(c)), 0);
    return { gridTemplateColumns: template, minWidth: minW };
  };
  const pageGrid = layout(widths);
  const zoomGrid = layout(zoomWidths);
  // The drawn width of each shown column (px), read from its header cell: where a first drag starts.
  const drawn = (root: HTMLElement | null) => {
    const out: Record<string, number> = {};
    for (const c of shownCols) {
      const el = root?.querySelector<HTMLElement>(`.ui-dt-head [data-col="${CSS.escape(c.key)}"]`);
      out[c.key] = el ? Math.ceil(el.getBoundingClientRect().width) : minOf(c);
    }
    return out;
  };
  // A column is never narrower than its heading and sort arrow (headings do not wrap), nor than 48 px.
  const headMin = (root: HTMLElement | null, key: string) => {
    const el = root?.querySelector<HTMLElement>(`.ui-dt-head [data-col="${CSS.escape(key)}"] > :first-child`);
    return Math.max(MIN_COL, el ? Math.ceil(el.getBoundingClientRect().width) + 24 : MIN_COL);
  };
  // Desktop rows: a cell whose content cannot wrap and is wider than the cell (InlineCode, a path) widens its column
  // instead of being cut. Long columns truncate on purpose and are left alone. Widths only grow, until resetKey.
  // Hugging columns take the widest of their heading, every cell on the page and the totals row, each read on one line
  // from its content's own boxes (not scrollWidth, which misses text that overflows to the left of a right-aligned cell).
  // Measured on mount, then at most once a frame when the shown rows or columns change, rows are added or removed, or
  // web fonts load; not on every render or text change. The state changes only when a column has to grow.
  const measureRef = React.useRef<() => void>(() => {});
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || narrow) return;
    // A new resetKey (or the table back from phone cards): what the columns ask for is measured afresh.
    wantRef.current = {};
    const measure = () => {
      const need: Record<string, number> = {};
      for (const el of root.querySelectorAll<HTMLElement>(':scope > .ui-dt-scroller .ui-dt-body .ui-dt-cell[data-col]:not(.is-long):not(.is-hug)')) {
        const over = el.scrollWidth - el.clientWidth;
        const key = el.dataset.col;
        if (over > 1 && key) need[key] = Math.max(need[key] ?? 0, Math.ceil(el.getBoundingClientRect().width + over));
      }
      // Hugging columns: the widest of their heading, cells and total on one line (is-measuring keeps every one
      // unwrapped for this read; the class is gone before the browser paints).
      // Each cell's own padding counts: the last one keeps the row actions' width free at its end.
      const pad = (el: HTMLElement) => {
        const st = getComputedStyle(el);
        return (parseFloat(st.paddingLeft) || 0) + (parseFloat(st.paddingRight) || 0) + (parseFloat(st.borderRightWidth) || 0);
      };
      const hugs = root.querySelectorAll<HTMLElement>(':scope > .ui-dt-scroller .ui-dt-cell.is-hug[data-col]');
      // The main and long columns: their content on one line too, what they ask for before the room is shared.
      const growCells = root.querySelectorAll<HTMLElement>(':scope > .ui-dt-scroller .ui-dt-cell.is-grow[data-col]');
      const asks: Record<string, number> = {};
      if (hugs.length || growCells.length) {
        root.classList.add('is-measuring');
        for (const el of hugs) {
          const key = el.dataset.col;
          const inner = el.querySelector(':scope > .ui-dt-stack > .ui-dt-main') ?? el;
          const w = contentWidth(inner);
          if (key && w !== null) need[key] = Math.max(need[key] ?? 0, Math.ceil(w + pad(el)));
        }
        for (const el of growCells) {
          const key = el.dataset.col;
          const long = el.querySelector<HTMLElement>('.ui-dt-long-text');
          const w = long ? long.getBoundingClientRect().width : contentWidth(el.querySelector(':scope > .ui-dt-stack > .ui-dt-main') ?? el);
          if (!key || w === null || !w) continue;
          const max = el.classList.contains('is-long') ? LONG_WANT_MAX : MAIN_WANT_MAX;
          asks[key] = Math.max(asks[key] ?? 0, Math.min(max, Math.ceil(w + pad(el))));
        }
        root.classList.remove('is-measuring');
      }
      // Everything read in this pass goes into one state update (one render), and none when nothing changed.
      const next: Partial<Measured> = {};
      const head = root.querySelector<HTMLElement>(':scope > .ui-dt-scroller .ui-dt-head');
      const scroll = root.querySelector<HTMLElement>(':scope > .ui-dt-scroller .ui-dt-scroll');
      if (head && scroll && scroll.clientWidth > 0) {
        // Only grows, like fit, until resetKey: paging back and forth does not make columns jump.
        const before = wantRef.current;
        const more = Object.entries(asks).filter(([k, w]) => w > (before[k] ?? 0));
        const merged = more.length ? { ...before, ...Object.fromEntries(more) } : before;
        wantRef.current = merged;
        if (more.length) next.want = merged;
        // Every column gets what it asks for when the hugging columns, the checkbox column and every main or long
        // column's ask fit in the box (the caret column is left out: it goes when nothing is cut).
        let used = 0;
        for (const el of head.children as HTMLCollectionOf<HTMLElement>) {
          if (el.classList.contains('ui-dt-exp')) continue;
          const key = el.dataset.col;
          used += key && el.classList.contains('is-grow') ? Math.max(asks[key] ?? 0, merged[key] ?? 0, 48) : el.getBoundingClientRect().width;
        }
        next.roomy = used <= scroll.clientWidth;
      }
      // The row actions' width: the widest set of buttons over a row end.
      let aw = 0;
      for (const el of root.querySelectorAll<HTMLElement>(':scope > .ui-dt-scroller .ui-dt-body .ui-dt-acts')) {
        if (el.childElementCount) aw = Math.max(aw, Math.ceil(el.getBoundingClientRect().width));
      }
      if (root.querySelector(':scope > .ui-dt-scroller .ui-dt-body .ui-dt-acts')) next.actsW = aw;
      // One toolbar row when the summary tabs, the search field at its least width and the buttons fit.
      const tools = root.querySelector<HTMLElement>(':scope > .ui-dt-tools.has-summary');
      if (tools && tools.clientWidth > 0) {
        const tabs = tools.querySelector<HTMLElement>('.ui-dt-summary');
        const actions = tools.querySelector<HTMLElement>(':scope > .ui-dt-actions');
        let need2 = (tabs?.scrollWidth ?? 0) + (tools.querySelector(':scope > .ui-dt-search') ? SEARCH_MIN + 2 * TOOL_GAP : TOOL_GAP);
        const parts = actions ? [...(actions.children as HTMLCollectionOf<HTMLElement>)].filter((e) => getComputedStyle(e).position !== 'absolute') : [];
        for (const e of parts) {
          const text = e.querySelector<HTMLElement>('.ui-dt-sortbtn-text');
          need2 += e.getBoundingClientRect().width + (text ? Math.max(0, text.scrollWidth - text.clientWidth) : 0);
        }
        need2 += Math.max(0, parts.length - 1) * TOOL_GAP;
        next.onerow = need2 <= tools.clientWidth;
      }
      // A long cell cut at its column's edge: the caret column is needed. Only where layout is real (not jsdom).
      const scroller = root.querySelector<HTMLElement>(':scope > .ui-dt-scroller .ui-dt-scroll');
      if (scroller && scroller.clientWidth > 0) {
        const cut = [...root.querySelectorAll<HTMLElement>(':scope > .ui-dt-scroller .ui-dt-body .ui-dt-long')].some(
          (el) => el.scrollWidth > el.clientWidth + 1,
        );
        next.clipped = cut;
      }
      setMeasured((m) => {
        const grow = Object.entries(need).filter(([k, w]) => w > (m.fit[k] ?? 0));
        if (grow.length) next.fit = { ...m.fit, ...Object.fromEntries(grow) };
        const aw2 = next.actsW;
        const actsSame = aw2 == null || (m.actsW !== null && Math.abs(m.actsW - aw2) <= 1);
        const same =
          !next.fit &&
          !next.want &&
          (next.roomy === undefined || next.roomy === m.roomy) &&
          actsSame &&
          (next.onerow === undefined || next.onerow === m.onerow) &&
          (next.clipped === undefined || next.clipped === m.clipped);
        if (same) return m;
        return { ...m, ...next, actsW: actsSame ? m.actsW : (next.actsW ?? m.actsW) };
      });
    };
    let frame = 0;
    const later = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    measureRef.current = later;
    measure();
    // Rows added or removed (a page, a filter, new data) and the header or totals row swapped: the child lists of the
    // table and its body only, not every text change inside a cell.
    const mo = new MutationObserver(later);
    for (const el of root.querySelectorAll(':scope > .ui-dt-scroller .ui-dt-table, :scope > .ui-dt-scroller .ui-dt-body')) mo.observe(el, { childList: true });
    document.fonts?.ready.then(later).catch(() => {});
    // A wider or narrower table cuts long cells differently: the caret column follows. Only the width: a row growing
    // taller is not a reason to measure.
    let lastW = -1;
    const ro = resizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      if (w !== lastW && lastW >= 0) later();
      lastW = w;
    });
    ro?.observe(root);
    // The text's own size: a font that loads late, a zoom of the text only, or reader styles that add letter, word or
    // line spacing (WCAG 1.4.12) change how wide a cell's content is, though the table's width stays.
    const probe = root.querySelector<HTMLElement>(':scope > .ui-dt-probe');
    let probeSize = '';
    const po = probe
      ? resizeObserver(() => {
          const r = probe.getBoundingClientRect();
          const size = `${Math.round(r.width)}x${Math.round(r.height)}`;
          if (probeSize && size !== probeSize) later();
          probeSize = size;
        })
      : null;
    if (probe) po?.observe(probe);
    return () => {
      mo.disconnect();
      ro?.disconnect();
      po?.disconnect();
      cancelAnimationFrame(frame);
      measureRef.current = () => {};
    };
    // resetKey clears the widths: measured again even when the rows look the same.
  }, [narrow, resetKey]);
  // A new width for the row actions changes the last cell's padding: measured again.
  React.useLayoutEffect(() => {
    measureRef.current();
  }, [actsW]);
  // The same rows with new content (rows replaced by the app, a search marking text, totals recomputed): once a frame.
  const contentKey = `${visIds.join('\u0001')}|${shownCols.map((c) => c.key).join(',')}|${list.length}|${q}|${!!p.totals}`;
  React.useLayoutEffect(() => {
    measureRef.current();
  }, [contentKey, rows]);
  const stickyStyle = (ci: number) => (ci === 0 && sticky ? { left: (expander ? EXP : 0) + (selectable ? SEL : 0) } : undefined);
  const cellClass = (c: DataTableColumn<R>, ci: number, ...more: unknown[]) =>
    cx(
      'ui-dt-cell',
      isNum(c) && 'is-num',
      c.mono && 'is-mono',
      grows(c) ? 'is-grow' : 'is-hug',
      ci === 0 && sticky && 'is-sticky is-sticky-end',
      ci === shownCols.length - 1 && 'is-lastcol',
      ...more,
    );
  // stickyFirst: the caret and checkbox columns before the first column stay too, so nothing scrolls under them.
  const lead = (what: 'exp' | 'sel') =>
    sticky ? { className: 'is-sticky', style: { left: what === 'sel' && expander ? EXP : 0 } } : { className: undefined, style: undefined };

  const headOf = (inZoom: boolean) => {
    const gridStyle = inZoom ? zoomGrid : pageGrid;
    const w = inZoom ? zoomWidths : widths;
    const setW = inZoom ? setZoomWidths : setWidths;
    const root = () => (inZoom ? zoomRef.current : rootRef.current);
    return (
      <div className="ui-dt-row ui-dt-head" role="row" style={gridStyle}>
        {expander ? (
          <div className={cx('ui-dt-cell ui-dt-exp', lead('exp').className)} style={lead('exp').style} role="columnheader">
            <span className="ui-visually-hidden">{tr('展開')}</span>
          </div>
        ) : null}
        {selectable ? (
          <div className={cx('ui-dt-cell ui-dt-sel', lead('sel').className)} style={lead('sel').style} role="columnheader">
            <RowCheck v={allOn ? true : mixed ? 'mixed' : false} label={tr('全選')} onClick={() => toggle(visIds, !allOn)} />
          </div>
        ) : null}
        {shownCols.map((c, ci) => {
          const at = sort.findIndex((l) => l.key === c.key);
          const cur = at >= 0;
          const many = sort.length > 1;
          return (
            <div
              key={c.key}
              role="columnheader"
              // ARIA allows aria-sort on one column: the first level. The others say their place in the button's name.
              aria-sort={at === 0 ? (sort[0].dir === 'asc' ? 'ascending' : 'descending') : 'none'}
              className={cellClass(c, ci)}
              style={stickyStyle(ci)}
              data-col={c.key}
            >
              {c.sortable === false ? (
                c.label
              ) : (
                <button
                  type="button"
                  className={cx('ui-dt-sort', cur && 'is-on')}
                  aria-label={cur && many ? tr('{name}，第 {n} 排序，{dir}', { name: c.label, n: at + 1, dir: dirWord(sort[at].dir) }) : undefined}
                  aria-keyshortcuts="Shift+Enter"
                  onClick={(e) => sortBy(c, e.shiftKey)}
                  onKeyDown={(e) => {
                    if (e.shiftKey && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      sortBy(c, true);
                    }
                  }}
                >
                  <span>{c.label}</span>
                  <Icon d={ARROWS[cur ? sort[at].dir : 'none']} size={14} className="ui-dt-arrow" />
                  {cur && many ? (
                    <span className="ui-dt-sortpri" aria-hidden="true">
                      {at + 1}
                    </span>
                  ) : null}
                </button>
              )}
              {narrow ? null : (
                <ColResize
                  name={c.label}
                  width={w?.[c.key] ?? minOf(c)}
                  start={() => (w ?? drawn(root()))[c.key] ?? minOf(c)}
                  onWidth={(px) => setW({ ...(w ?? drawn(root())), [c.key]: Math.max(headMin(root(), c.key), px) })}
                  onReset={() => setW(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const mark = searching ? q : '';
  // A relative date's full date and time: in a Tooltip on hover and as the cell's description (no extra tab stop).
  const absDate = (r: R, c: DataTableColumn<R>) => {
    if (c.format !== 'relative' || c.render) return '';
    const d = asDate(get(r, c.key));
    const abs = d ? format.dateTime(d) : '';
    return abs && abs !== format.relative(d) ? abs : '';
  };
  const cellInner = (r: R, c: DataTableColumn<R>) => {
    const raw = get(r, c.key);
    let v: React.ReactNode;
    if (c.render) v = c.render(r);
    else if (isDateCol(c) && asDate(raw)) {
      const d = asDate(raw) as Date;
      const abs = absDate(r, c);
      // Relative times stay current (one shared minute timer) and render the same on the server and at hydration.
      const t =
        c.format === 'relative' ? (
          <RelativeTime className="ui-dt-time" value={d}>
            {(text) => dateParts(text, mark)}
          </RelativeTime>
        ) : (
          <time className="ui-dt-time" dateTime={isoOf(d, c.format === 'date')}>
            {dateParts(String(cellText(c, raw) ?? ''), mark)}
          </time>
        );
      v = abs ? (
        <Tooltip label={abs} describe={false} disabled={touch}>
          {t}
        </Tooltip>
      ) : (
        t
      );
    } else if (c.unit && raw !== null && raw !== undefined && raw !== '')
      // One inline element: the cell is a flex box, which drops a bare space between the number and the unit.
      v = (
        <span className="ui-dt-qty">
          {markMatch(cellText({ ...c, unit: undefined }, raw), mark)} <span className="ui-unit">{c.unit}</span>
        </span>
      );
    else if (raw === null || raw === undefined || raw === '')
      // Nothing to show: a quiet dash, so an empty cell does not read as content.
      v = <span className="ui-dt-none">{cellText(c, raw)}</span>;
    else v = markMatch(cellText(c, raw), mark);
    return v;
  };
  // A click on the row itself: not on one of its own controls, and not the end of a text selection.
  const rowClick = (e: React.MouseEvent<HTMLElement>) => {
    const t = e.target as Element;
    const ctl = t.closest(ROW_CONTROLS);
    if (ctl && ctl !== e.currentTarget) return false;
    const s = window.getSelection();
    return !(s && !s.isCollapsed && String(s).trim());
  };
  const openRow = (r: R, e: React.MouseEvent<HTMLElement>) => {
    const href = p.rowHref?.(r);
    if (href == null) return;
    if (newTab(e)) {
      e.preventDefault();
      window.open(href, '_blank', 'noopener');
    } else if (p.onRowOpen) p.onRowOpen(r, e);
    else e.currentTarget.querySelector<HTMLAnchorElement>('a.ui-dt-rowlink')?.click();
  };
  const cell = (r: R, c: DataTableColumn<R>, ci: number) => {
    let v = c.long ? <LongText>{cellInner(r, c)}</LongText> : cellInner(r, c);
    if (c.fullText) v = <FullText text={c.fullText(r)}>{v}</FullText>;
    if (ci === 0 && p.rowHref)
      v = (
        <a
          className="ui-dt-rowlink"
          href={p.rowHref(r)}
          onClick={
            p.onRowOpen
              ? (e) => {
                  if (newTab(e)) return;
                  e.preventDefault();
                  p.onRowOpen?.(r, e);
                }
              : undefined
          }
        >
          {v}
        </a>
      );
    const sub = c.secondary?.(r);
    if (sub == null || sub === '' || sub === false) return v;
    return (
      <span className="ui-dt-stack">
        <span className="ui-dt-main">{v}</span>
        <span className="ui-dt-sub">{sub}</span>
      </span>
    );
  };
  const total = (c: DataTableColumn<R>, ci: number): React.ReactNode => {
    const how = p.totals?.[c.key];
    const rowsAll = list.map((x) => x.r);
    // Numbers in Geist Mono, the words (「合計」「平均」「筆」) and the unit in the text font.
    if (ci === 0 && !how)
      return (
        <span className="ui-dt-qty">{monoNums(tr('合計 {n} {unit}', { n: '\u0001', unit: unitOf(rowsAll.length) }), [format.number(rowsAll.length)])}</span>
      );
    if (typeof how === 'function') return how(rowsAll);
    if (how === 'sum' || how === 'avg') {
      const sum = rowsAll.reduce((a, r) => a + (Number(get(r, c.key)) || 0), 0);
      const val = how === 'sum' ? sum : sum / (rowsAll.length || 1);
      const num = cellText({ ...(how === 'avg' && !c.format ? { ...c, decimals: 1 } : c), unit: undefined }, val);
      return (
        <span className="ui-dt-qty">
          {how === 'avg' ? <span className="ui-unit">{tr('平均')} </span> : null}
          {num}
          {c.unit ? (
            <>
              {' '}
              <span className="ui-unit">{c.unit}</span>
            </>
          ) : null}
        </span>
      );
    }
    return '';
  };

  // C2: every row the search and filters keep (all pages, in the current order), as a Markdown table.
  const copyMarkdown = () => {
    const all = list.map((x) => x.r);
    if (p.copyText) return p.copyText(all);
    return markdownTable(
      shownCols.map((c) => c.label),
      all.map((r) => shownCols.map((c) => String(c.fullText?.(r) ?? c.searchText?.(r) ?? cellText(c, get(r, c.key)) ?? ''))),
    );
  };
  // The toolbar, the table and the page numbers: on the page, and again in the 「放大表格」 dialog with the same state.
  // One row of tools: search, filter, count, copy, sort, columns, zoom. Without a search field the title goes on the
  // same row: the caption in front of the tools, or, when the table sits under a Card's title, the tools move into
  // that title row (inHead). How it wraps depends on the table's own width (container query in styles.css).
  // 「複製成 Markdown」 from the 「⋯」 menu: the menu closes, so a small 「已複製」 shows under it for 2 s and is announced.
  const [copied, setCopied] = React.useState(false);
  const copiedTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(copiedTimer.current), []);
  const doCopy = () =>
    copyText(copyMarkdown()).then(
      () => {
        setCopied(true);
        announce(tr('已複製'));
        clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(false), 2000);
      },
      () => p.onCopyError?.(),
    );
  // 「/」 focuses the search field of the first table on the page that has one; that table shows the 「/」 hint.
  const slash = search !== false && p.toolbar !== false && p.searchShortcut !== false;
  const [slashOwner, setSlashOwner] = React.useState(false);
  React.useEffect(() => {
    const el = rootRef.current;
    if (!slash || !el) return;
    const changed = () => setSlashOwner(firstShortcutTable() === el);
    const off = registerShortcut(el, changed);
    return () => {
      off();
      setSlashOwner(false);
    };
  }, [slash]);
  const [searchFocus, setSearchFocus] = React.useState(false);
  // The applied conditions as removable chips under the toolbar: 「狀態：失敗 ×」, one per picked option or range.
  const setFilter = (key: string, v: FilterValue | undefined) => {
    setValues(v === undefined ? Object.fromEntries(Object.entries(values).filter(([k]) => k !== key)) : { ...values, [key]: v });
    setPage(0);
  };
  const chips: FilterChip[] = [];
  for (const f of filters) {
    const v = values[f.key];
    if (!v || !isActive(v)) continue;
    if (Array.isArray(v))
      for (const val of v)
        chips.push({
          id: f.key + '=' + val,
          text: tr('{name}：{value}', { name: f.label, value: f.options.find((o) => String(o.value) === val)?.label ?? val }),
          remove: () =>
            setFilter(
              f.key,
              v.filter((x) => x !== val),
            ),
        });
    else {
      const range = v.min && v.max ? `${v.min}–${v.max}` : v.min ? `≥ ${v.min}` : `≤ ${v.max}`;
      chips.push({ id: f.key, text: tr('{name}：{value}', { name: f.label, value: range }), remove: () => setFilter(f.key, undefined) });
    }
  }
  const chipsView = (inZoom: boolean) => (
    <FilterChips
      chips={chips}
      onClear={() => {
        setValues({});
        setPage(0);
      }}
      filterButton={() => (inZoom ? zoomRef : rootRef).current?.querySelector<HTMLElement>('.ui-dt-filterbtn') ?? null}
    />
  );
  // The toolbar, the table and the page numbers: on the page, and again in the 「放大表格」 dialog with the same state.
  // One row of tools: search, 「篩選」, the count, 「排序」 and 「⋯」 (欄位, 複製成 Markdown, 放大表格), every one 40 px tall.
  // Without a search field the title goes on the same row: the caption in front of the tools, or, when the table sits
  // under a Card's title, the tools move into that title row (inHead). How it wraps depends on the table's own width
  // (container query in styles.css).
  // The summary tabs: the first part of the toolbar (on the same row as the search and buttons when they all fit, see
  // onerow), or above it when the tools moved into a Card's title row.
  const summaryView = summary ? (
    <Tabs
      className="ui-dt-summary"
      label={summary.label || tr('依狀態篩選')}
      unit={countUnit}
      value={sumVal}
      onChange={(v) => {
        capture('sort');
        setSumVal(v);
        setPage(0);
      }}
      items={[
        // No counts while loading: 「全部 0」 would be wrong.
        { id: 'all', label: tr('全部'), count: p.loading ? undefined : sumAll.length },
        ...summary.items.map((it) => ({
          id: String(it.value),
          label: it.label,
          count: p.loading ? undefined : sumAll.filter((x) => String(get(x.r, summary.key)) === String(it.value)).length,
        })),
      ]}
      hideUnit
    />
  ) : null;
  // With summary tabs: 「6 / 24 筆」 only while a search or filter keeps fewer rows (「全部 24」 already says how many).
  // Without them: 「24 筆」 on one page, 「6 / 24 筆」 after a search or filter; with pages the range under the table says
  // it. Screen readers always have the count (countText), shown or not.
  const filtered = list.length !== baseCount;
  const showCount = filtered || (!summary && pages <= 1 && !p.loading);
  const countText = p.loading
    ? tr('載入中')
    : filtered
      ? format.fractionLabel(list.length, baseCount, unitOf(baseCount))
      : `${format.number(list.length)} ${unitOf(list.length)}`;
  const toolsView = (inZoom: boolean, inHead = false) => (
    <div className={cx('ui-dt-tools', inHead && 'is-inhead', summaryView && !inZoom && !inHead && 'has-summary', onerow && !inZoom && !inHead && 'is-onerow')}>
      {summaryView && !inZoom && !inHead ? <div className="ui-dt-sumwrap">{summaryView}</div> : null}
      {search === false && p.caption && !inZoom && !inHead ? <div className="ui-dt-caption">{p.caption}</div> : null}
      {search !== false ? (
        <div className="ui-dt-search" onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}>
          <SearchField
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(0);
            }}
            placeholder={search.placeholder || tr('搜尋')}
            label={search.placeholder || tr('搜尋')}
            aria-keyshortcuts={slashOwner && !inZoom ? '/' : undefined}
            className="ui-dt-searchfield"
          />
          {slashOwner && !inZoom && !narrow && !q && !searchFocus ? (
            <kbd className="ui-dt-kbd" aria-hidden="true">
              /
            </kbd>
          ) : null}
        </div>
      ) : null}
      <div className="ui-dt-actions">
        {filters.length ? (
          <FilterButton
            boundary={inZoom ? zoomRef : rootRef}
            filters={filters}
            values={values}
            activeCount={activeN}
            count={(f, v) => all.filter((x) => passes(x.r, f.key) && matches(f, x.r, f.type === 'list' ? [v] : undefined)).length}
            onChange={(key, v) => setFilter(key, v)}
            onClear={() => {
              setValues({});
              setPage(0);
            }}
          />
        ) : null}
        {showCount ? (
          <span className="ui-dt-result">
            {/* Shown 「6 / 24 筆」; read 「24 筆中的 6 筆」, not 「6 斜線 24 筆」. The shown one is drawn by CSS, so the page's
                text has only the readable one (no 「6 / 24 筆24 筆中的 6 筆」 when copied or read by a tool). */}
            <span aria-hidden="true">
              {filtered
                ? seenOnly(tr('{n} / {total} {unit}', { n: '\u0001', total: '\u0002', unit: unitOf(baseCount) }), [
                    format.number(list.length),
                    format.number(baseCount),
                  ])
                : seenOnly(tr('{n} {unit}', { n: '\u0001', unit: unitOf(list.length) }), [format.number(list.length)])}
            </span>
            <span className="ui-visually-hidden">{countText}</span>
          </span>
        ) : null}
        {sortCols.length ? <SortButton cols={sortCols} levels={sort} max={maxSort} onChange={changeSort} boundary={inZoom ? zoomRef : rootRef} /> : null}
        {narrow ? null : (
          <MoreMenu
            columns={
              p.columnMenu !== false && cols.length > 2
                ? {
                    cols,
                    hidden,
                    onToggle: (k) => setToggled({ ...toggled, [k]: !hidden[k] }),
                    onReset: () => {
                      setToggled({});
                      setWidths(null);
                      setZoomWidths(null);
                      announce(tr('已還原預設的欄位與欄寬'));
                    },
                  }
                : undefined
            }
            onCopy={p.copy !== false ? doCopy : undefined}
            onZoom={p.zoom !== false && !inZoom ? () => setZoomed(true) : undefined}
          />
        )}
        {p.action && !inZoom ? <div className="ui-dt-primary">{p.action}</div> : null}
        {copied && !narrow ? (
          <span className="ui-dt-copied" aria-hidden="true">
            <Icon name="check" size={16} />
            {tr('已複製')}
          </span>
        ) : null}
      </div>
    </div>
  );
  // While rows are selected: the count, the bulk actions and 「取消選取」 in a toolbar above the table (not a row of the
  // table: the header row and its column headers stay).
  const bulkView =
    selectable && selIds.length && p.bulkActions ? (
      <div className="ui-dt-bulk" role="toolbar" aria-label={tr('已選 {n} {unit}', { n: selIds.length, unit: unitOf(selIds.length) })}>
        <span className="ui-dt-bulk-count">
          {monoNums(tr('已選 {n} {unit}', { n: '\u0001', unit: unitOf(selIds.length) }), [format.number(selIds.length)])}
        </span>
        <span className="ui-dt-bulk-actions">{p.bulkActions(selIds, clear)}</span>
        <button type="button" className="ui-dt-bulk-close" aria-label={tr('取消選取')} onClick={clear}>
          <Icon name="x" size={16} />
        </button>
      </div>
    ) : null;
  // loading: rows of the columns' shape, each cell a bar as wide as what it will hold. One row says 「載入中」 to screen
  // readers; the bars are hidden from them.
  const skeletonRows = (grid: React.CSSProperties) => {
    const n = Math.max(1, p.loadingRows ?? Math.min(pageSize, 10));
    const MAIN = ['72%', '56%', '64%', '48%'];
    // Bars as wide as typical content (px), so the hugging columns are measured as when loaded and nothing jumps.
    const TYPICAL: Record<string, number> = { date: 128, dateTime: 184, datetime: 184, relative: 72, duration: 64, money: 96, percent: 56 };
    const widthOf = (c: DataTableColumn<R>, i: number) =>
      c.key === mainKey
        ? MAIN[i % MAIN.length]
        : c.mobile === 'status'
          ? 64
          : (TYPICAL[c.format ?? ''] ?? (isNum(c) ? 56 : c.mono ? 112 : c.long ? '80%' : '60%'));
    return [
      <div key="busy" role="row" className="ui-visually-hidden">
        <div role="cell">{tr('載入中')}</div>
      </div>,
      ...Array.from({ length: n }, (_, i) => (
        <div key={'skel' + i} aria-hidden="true" className={cx('ui-dt-row ui-dt-skelrow', i % 2 && 'is-even')} style={grid}>
          {expander ? <div className={cx('ui-dt-cell ui-dt-exp', lead('exp').className)} style={lead('exp').style} /> : null}
          {selectable ? <div className={cx('ui-dt-cell ui-dt-sel', lead('sel').className)} style={lead('sel').style} /> : null}
          {shownCols.map((c, ci) => (
            <div key={c.key} data-label={c.label} data-col={c.key} className={cellClass(c, ci, mobileClass(c, ci))} style={stickyStyle(ci)}>
              <Skeleton width={widthOf(c, i)} />
            </div>
          ))}
        </div>
      )),
    ];
  };
  const tableView = (inZoom: boolean) => {
    const grid = inZoom ? zoomGrid : pageGrid;
    const pfx = inZoom ? uid + 'z' : uid;
    return (
      <div className={cx('ui-dt-scroller', scrollMore && !inZoom && 'has-more')}>
        <div className={cx('ui-dt-scroll', pages > 1 && 'is-paged')} ref={inZoom ? undefined : scrollRef} onScroll={inZoom ? undefined : onScroll}>
          <div className="ui-dt-table" role="table" aria-label={p.label || p.caption} aria-busy={p.loading || undefined}>
            {headOf(inZoom)}
            <div ref={inZoom ? undefined : bodyRef} className="ui-dt-body" role="rowgroup">
              {p.loading ? (
                skeletonRows(grid)
              ) : vis.length ? (
                vis.map((x, i) => {
                  const id = visIds[i];
                  const on = !!sel[id];
                  const open = expander && !!opened[id];
                  const detailId = `${pfx}-d-${idPart(id)}`;
                  const rowName = shownCols[0] ? String(cellText(shownCols[0], get(x.r, shownCols[0].key)) ?? '') : '';
                  return (
                    <React.Fragment key={id}>
                      <div
                        data-rid={id}
                        ref={
                          inZoom
                            ? undefined
                            : (el) => {
                                rowEls.current[id] = el;
                              }
                        }
                        role="row"
                        // Named by its first cell (the function name, say), not by every cell and the caret's 「展開 …」.
                        aria-labelledby={shownCols.length ? `${pfx}-n-${start + i}` : undefined}
                        className={cx(
                          'ui-dt-row',
                          i % 2 && 'is-even',
                          hasAct && 'has-acts',
                          on && 'is-selected',
                          selectable && 'has-sel',
                          expander && !p.rowHref && 'has-exp',
                          p.rowHref && 'has-href',
                        )}
                        style={grid}
                        // EC: a click anywhere on the row opens or closes its details, except on its own controls
                        // and when the click ends a text selection. Keyboard users have the caret button. With rowHref
                        // the click opens the row's page instead (its first cell's link, or onRowOpen); Ctrl, ⌘,
                        // Shift and the middle button open it in a new tab, as on a link.
                        onClick={
                          expander || p.rowHref
                            ? (e) => {
                                if (!rowClick(e)) return;
                                if (p.rowHref) return openRow(x.r, e);
                                setOpened({ ...opened, [id]: !open });
                              }
                            : undefined
                        }
                        // Shift + click would select text up to here and the middle button would start autoscroll:
                        // neither, so those clicks open the row like a link.
                        onMouseDown={
                          p.rowHref
                            ? (e) => {
                                if ((e.shiftKey || e.button === 1) && !(e.target as Element).closest(ROW_CONTROLS)) e.preventDefault();
                              }
                            : undefined
                        }
                        onAuxClick={
                          p.rowHref
                            ? (e) => {
                                if (e.button === 1 && rowClick(e)) openRow(x.r, e);
                              }
                            : undefined
                        }
                      >
                        {expander ? (
                          <div className={cx('ui-dt-cell ui-dt-exp', lead('exp').className)} style={lead('exp').style} role="cell">
                            <button
                              type="button"
                              className={cx('ui-dt-exp-btn', open && 'is-open')}
                              aria-expanded={open}
                              aria-controls={open ? detailId : undefined}
                              aria-label={tr(open ? '收合 {name}' : '展開 {name}', { name: rowName })}
                              onClick={() => setOpened({ ...opened, [id]: !open })}
                            >
                              <Icon name="caret-right" size={16} />
                            </button>
                          </div>
                        ) : null}
                        {selectable ? (
                          <div className={cx('ui-dt-cell ui-dt-sel', lead('sel').className)} style={lead('sel').style} role="cell">
                            <RowCheck v={on} label={tr('選取第 {n} 筆', { n: start + i + 1 })} onClick={(e) => pickRow(id, on, e.shiftKey)} />
                          </div>
                        ) : null}
                        {shownCols.map((c, ci) => (
                          <div
                            key={c.key}
                            role="cell"
                            id={ci === 0 ? `${pfx}-n-${start + i}` : undefined}
                            // fullText: the whole text as the cell's description, not hidden text beside the short one
                            // (that put 「ucp.c:62，src/…/ucp.c:62」 in the page's text and the phone card).
                            aria-description={[c.fullText?.(x.r), absDate(x.r, c)].filter(Boolean).join(tr('，')) || undefined}
                            data-label={c.label}
                            data-col={c.key}
                            className={cellClass(c, ci, c.long && 'is-long', mobileClass(c, ci))}
                            style={stickyStyle(ci)}
                          >
                            {cell(x.r, c, ci)}
                          </div>
                        ))}
                        {hasAct ? (
                          <div className="ui-dt-cell ui-dt-acts" role="cell">
                            {p.rowActions?.(x.r)}
                          </div>
                        ) : null}
                      </div>
                      {open ? (
                        <div id={detailId} role="row" className={cx('ui-dt-detail', i % 2 && 'is-even')} style={{ minWidth: grid.minWidth }}>
                          <div role="cell" className="ui-dt-detail-cell" style={{ paddingLeft: EXP + (selectable ? SEL : 0) + 12 }}>
                            {longCols.map((c) => (
                              <div key={c.key} className="ui-dt-detail-item">
                                <div className="ui-dt-detail-label">{c.label}</div>
                                <div className="ui-dt-detail-text">{c.fullText ? c.fullText(x.r) : cellInner(x.r, c)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </React.Fragment>
                  );
                })
              ) : (
                // A row with one cell, so the table keeps the rows its role needs (ARIA table > rowgroup > row).
                <div className="ui-dt-emptyrow" role="row">
                  <div className="ui-dt-empty" role="cell">
                    {p.emptyText || tr('沒有符合的資料')}
                    {q || activeN ? (
                      <div>
                        <Button onClick={clearFilters}>{tr('清除篩選')}</Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
            {p.totals && list.length ? (
              <div className="ui-dt-row ui-dt-total" role="row" style={grid}>
                {expander ? <div className={cx('ui-dt-cell ui-dt-exp', lead('exp').className)} style={lead('exp').style} role="cell" /> : null}
                {selectable ? <div className={cx('ui-dt-cell ui-dt-sel', lead('sel').className)} style={lead('sel').style} role="cell" /> : null}
                {shownCols.map((c, ci) => (
                  <div
                    key={c.key}
                    role="cell"
                    className={cellClass(c, ci)}
                    style={stickyStyle(ci)}
                    data-col={c.key}
                    // On a phone the totals row is a summary under the cards: each total as 「label value」.
                    data-label={ci > 0 && p.totals?.[c.key] ? c.label : undefined}
                  >
                    {total(c, ci)}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };
  const footView = (
    <>
      {/* One page: the count above the table already says how many rows there are, so no range and no page numbers. */}
      {/* While loading the count is not known yet: no range from the rows of before. */}
      {pages > 1 && !p.loading ? (
        <div className="ui-dt-foot">
          <span className="ui-dt-range">
            {monoNums(tr('第 {a}–{b} {unit}，共 {n} {unit}', { a: '\u0001', b: '\u0002', n: '\u0003', unit: unitOf(list.length) }), [
              start + 1,
              Math.min(list.length, start + pageSize),
              format.number(list.length),
            ])}
          </span>
          <nav className="ui-dt-pages" aria-label={tr('分頁')}>
            <button type="button" className="ui-dt-page" aria-label={tr('上一頁')} disabled={pageNow === 0} onClick={() => goPage(pageNow - 1)}>
              ‹
            </button>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={cx('ui-dt-page', i === pageNow && 'is-on')}
                aria-current={i === pageNow ? 'page' : undefined}
                onClick={() => goPage(i)}
              >
                {String(i + 1)}
              </button>
            ))}
            <button type="button" className="ui-dt-page" aria-label={tr('下一頁')} disabled={pageNow >= pages - 1} onClick={() => goPage(pageNow + 1)}>
              ›
            </button>
          </nav>
        </div>
      ) : null}
    </>
  );

  return (
    <div
      ref={rootRef}
      className={cx('ui-dt', search === false && 'is-nosearch', selIds.length && 'has-sel', hasAct && 'has-acts', p.className)}
      style={hasAct ? ({ '--dt-acts-w': (p.actionsWidth ?? actsW ?? 72) + 'px' } as React.CSSProperties) : undefined}
    >
      {p.caption && search !== false ? <div className="ui-dt-caption">{p.caption}</div> : null}
      {p.views ? (
        <div className="ui-dt-views" role="tablist" aria-label={tr('檢視')}>
          {p.views.map((v) => {
            const on = v.id === view;
            const vn = rows.filter((r) => !v.filter || v.filter(r)).length;
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={on}
                className={cx('ui-dt-view', on && 'is-on')}
                onClick={() => {
                  setView(v.id);
                  setPage(0);
                }}
              >
                {v.label}{' '}
                <span className="ui-dt-view-n">
                  {format.number(vn)}
                  <span className="ui-visually-hidden"> {unitOf(vn)}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      {/* Measures the text's size (see the measuring effect): its text is drawn by CSS, so it is not in the page's text. */}
      <span className="ui-dt-probe" aria-hidden="true" />
      {summaryView && (headSlot || p.toolbar === false) ? <div className="ui-dt-top">{summaryView}</div> : null}
      {p.toolbar === false ? null : headSlot ? createPortal(toolsView(false, true), headSlot) : toolsView(false)}
      {chipsView(false)}
      {/* The count for screen readers when it is not shown (summary tabs or the page range say it on screen). */}
      {showCount && p.toolbar !== false ? null : <span className="ui-visually-hidden">{countText}</span>}
      {bulkView}
      {tableView(false)}
      <ScrollHint show={overflows} done={scrolled} />
      {footView}
      <TableDialog open={zoomed} onClose={() => setZoomed(false)} title={p.caption || p.label}>
        <div ref={zoomRef} className="ui-dt ui-dt-zoomed">
          {p.toolbar === false ? null : toolsView(true)}
          {chipsView(true)}
          {bulkView}
          {tableView(true)}
          {footView}
        </div>
      </TableDialog>
    </div>
  );
}
