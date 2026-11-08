import * as React from 'react';
import { Button } from '../Button/Button';
import { SearchField } from '../SearchField/SearchField';
import { Tabs } from '../Tabs/Tabs';
import { format } from '../../format';
import { tr } from '../../i18n';
import { Icon, type CustomIcon } from '../../icons/Icon';
import { cx, monoNums, reduced, useNarrow } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { CheckMark } from '../../internal/Field';
import { announce } from '../../announce';
import { ScrollHint, useScrollHint } from '../../internal/scrollHint';
import { cellText, isActive, matches, readUrl, resolveFilters, searchHit, writeUrl } from './filters';
import { ColumnMenu, FilterButton, FullText, LongText, markMatch } from './parts';
import type { DataTableColumn, DataTableFilter, DataTableView, FilterOption, FilterValue, ResolvedFilter, Row, RowKey, Total } from './types';

export type { DataTableColumn, DataTableFilter, DataTableView, FilterOption, FilterValue, RangeValue, Row, RowKey, Total } from './types';

export interface DataTableProps<R extends Row = Record<string, unknown>> {
  columns: DataTableColumn<R>[];
  /** Give each row an `id` so selection and animations follow the row, not its position. */
  rows: R[];
  /** Title above the table, also its accessible name. */
  caption?: string;
  /** Segmented summary above the table: 「全部」 plus one tab per status with its count; picking one filters the rows.
   *  `unit` follows every count; default 「筆」. */
  summary?: { key: RowKey<R>; items: { value: string; label: string }[]; label?: string; unit?: string };
  /** aria-label when there is no caption. */
  label?: string;
  /** Rows per page. Default 10. */
  pageSize?: number;
  /** Change it when the rows become a different data set: search, filters, sort, page, selection and summary reset. */
  resetKey?: string | number;
  /** Checkboxes appear when a row is hovered, and on every row once any row is selected. */
  selectable?: boolean;
  /** Buttons for the bar that replaces the header while rows are selected. */
  bulkActions?: (ids: string[], clear: () => void) => React.ReactNode;
  /** IconButtons at the row's right end, shown when the row is hovered. */
  rowActions?: (row: R) => React.ReactNode;
  /** px. Default 88. */
  actionsWidth?: number;
  /** Search box (default on; false hides it). Searches every column unless keys is given. */
  search?: false | { placeholder?: string; keys?: RowKey<R>[] };
  /** Filters in the 「篩選」 popover. */
  filters?: DataTableFilter<R>[];
  /** @deprecated use filters. */
  filter?: { key: RowKey<R>; label?: string; options: FilterOption[] };
  /** Write search and filters into the URL. Default true. */
  urlSync?: boolean;
  /** Prefix of the URL parameters when a page has several tables. */
  urlKey?: string;
  /** Saved views shown as tabs above the table. */
  views?: DataTableView<R>[];
  /** Totals row: 'sum', 'avg' or a function per column key. */
  totals?: Partial<Record<string, Total<R>>>;
  /** Keep the first column visible while scrolling sideways. */
  stickyFirst?: boolean;
  /** 「欄位」 menu to hide columns. Default true. */
  columnMenu?: boolean;
  /** Default 「沒有符合的資料」. */
  emptyText?: string;
  className?: string;
}

const MOVE = { dur: 320, stagger: 25, ease: 'cubic-bezier(.2,.8,.2,1)' };
const ARROWS: Record<'asc' | 'desc' | 'none', CustomIcon> = { asc: 'M12 19V5M6 11l6-6 6 6', desc: 'M12 5v14M6 13l6 6 6-6', none: 'M8 9l4-4 4 4M8 15l4 4 4-4' };

const get = (row: Row, key: string): unknown => (row as Record<string, unknown>)[key];
const isNum = (c: DataTableColumn<never>) => c.numeric || c.format === 'money' || c.format === 'percent';

function RowCheck({ v, label, onClick }: { v: boolean | 'mixed'; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={v}
      aria-label={label}
      className={cx('ui-check-box', 'ui-dt-check', v && 'is-on')}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <CheckMark v={v} />
    </button>
  );
}

interface Snapshot {
  kind: 'sort' | 'next' | 'prev';
  rows: Record<string, { top: number; bg: string; node: HTMLElement }>;
  order: string[];
}

/** The table for records: sort, search, filters, page numbers, selection with a bulk bar, row actions; cards on phones. */
export function DataTable<R extends Row = Record<string, unknown>>(p: DataTableProps<R>) {
  const { columns: cols, rows, pageSize = 10, urlSync = true, urlKey, search = {}, selectable = false, stickyFirst: sticky = false } = p;
  const filters: ResolvedFilter<R>[] = React.useMemo(() => {
    const list = p.filters ? [...p.filters] : [];
    if (p.filter && !list.length)
      list.push({ key: p.filter.key, label: p.filter.label || cols.find((c) => c.key === p.filter?.key)?.label || p.filter.key, options: p.filter.options });
    return resolveFilters(list, rows);
  }, [p.filters, p.filter, cols, rows]);
  const fromUrl = () => (urlSync && typeof location !== 'undefined' ? readUrl(urlKey, filters) : { q: '', values: {} });
  const [sort, setSort] = React.useState<{ key: string | null; dir: 'asc' | 'desc' }>({ key: null, dir: 'desc' });
  const [page, setPage] = React.useState(0);
  const [q, setQ] = React.useState(() => fromUrl().q);
  const [values, setValues] = React.useState<Record<string, FilterValue>>(() => fromUrl().values);
  const [view, setView] = React.useState(p.views?.[0]?.id ?? null);
  // Columns people turned on or off in the 「欄位」 menu; the others follow their own `hidden`.
  const [toggled, setToggled] = React.useState<Record<string, boolean>>({});
  // Rows opened with the caret on the left: their long columns in full, below the row.
  const [opened, setOpened] = React.useState<Record<string, boolean>>({});
  const narrow = useNarrow();
  const uid = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [sel, setSel] = React.useState<Record<string, boolean>>({});
  const [sumVal, setSumVal] = React.useState('all');
  const [resetKey, setResetKey] = React.useState(p.resetKey);
  const resetting = resetKey !== p.resetKey;
  if (resetting) {
    setResetKey(p.resetKey);
    setQ('');
    setValues({});
    setPage(0);
    setSel({});
    setSumVal('all');
    setSort({ key: null, dir: 'desc' });
    setToggled({});
    setOpened({});
  }
  const valuesKey = JSON.stringify(values);
  React.useEffect(() => {
    if (urlSync && filters.length) writeUrl(urlKey, filters, values, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- written when the conditions change, not when the filter list is rebuilt
  }, [valuesKey, q]);
  devWarn(
    cols.some((c) => c.format === 'percent' && !c.unit),
    'DataTable',
    "format: 'percent' sets 1 decimal and shows no % sign; add unit: '%' to that column.",
  );
  devWarn(
    rows.length > 1 && rows.every((r) => get(r, 'id') == null) && selectable,
    'DataTable',
    'rows have no id, so a selection follows the position, not the row. Add an id to each row.',
  );

  devWarn(!!cols[0]?.hidden, 'DataTable', 'the first column is always shown, so its hidden: true does nothing. Move the column, or drop hidden.');
  devWarn(
    (p.columnMenu === false || cols.length <= 2) && cols.some((c, i) => i > 0 && c.hidden),
    'DataTable',
    'a column has hidden: true but there is no 「欄位」 menu (columnMenu is false, or the table has 2 columns or fewer), so nobody can turn it on. Turn the menu on, or leave the column out.',
  );
  const hidden: Record<string, boolean> = {};
  cols.forEach((c, i) => (hidden[c.key] = i > 0 && (toggled[c.key] ?? !!c.hidden)));
  const shownCols = cols.filter((c) => !hidden[c.key]);
  const { ref: scrollRef, more: scrollMore, overflows, scrolled, onScroll } = useScrollHint();
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const rowEls = React.useRef<Record<string, HTMLDivElement | null>>({});
  const snap = React.useRef<Snapshot | null>(null);

  let all = rows.map((r, i) => ({ r, i }));
  const viewObj = p.views?.find((v) => v.id === view);
  if (viewObj?.filter) all = all.filter((x) => viewObj.filter?.(x.r));
  const sumAll = all;
  const summary = p.summary;
  if (summary && sumVal !== 'all') all = all.filter((x) => String(get(x.r, summary.key)) === sumVal);
  const baseCount = all.length;
  const searching = search !== false && !!q;
  const passes = (r: R, skip?: string) =>
    (!searching || searchHit(r, cols, filters, q, search ? search.keys : undefined)) && filters.every((f) => f.key === skip || matches(f, r, values[f.key]));
  let list = all.filter((x) => passes(x.r));
  const activeN = filters.filter((f) => isActive(values[f.key])).length;
  if (sort.key) {
    const key = sort.key;
    const col = cols.find((c) => c.key === key);
    const val = (r: R) => (col?.sortValue ? col.sortValue(r) : get(r, key));
    const d = sort.dir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      const x = val(a.r);
      const y = val(b.r);
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'zh-Hant');
      return c * d || a.i - b.i;
    });
  }
  // After the search, a filter, the summary or the view changes (not on first render): 「顯示 6 筆」.
  const shownKey = `${q}|${valuesKey}|${sumVal}|${view}`;
  const firstKey = React.useRef(shownKey);
  const shownN = list.length;
  React.useEffect(() => {
    if (shownKey === firstKey.current) return;
    firstKey.current = '';
    const t = setTimeout(() => announce(tr('顯示 {n} 筆', { n: format.number(shownN) })), 400);
    return () => clearTimeout(t);
  }, [shownKey, shownN]);
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const pageNow = Math.min(page, pages - 1);
  const start = pageNow * pageSize;
  const vis = list.slice(start, start + pageSize);
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
      ghost.classList.add('ui-dt-ghost');
      ghost.style.top = o.top + 'px';
      ghost.style.backgroundColor = o.bg;
      body.appendChild(ghost);
      const to = sn.kind === 'next' ? -n : sn.kind === 'prev' ? n : n + 1 - j;
      ghost.animate(
        [
          { transform: 'none', opacity: 1 },
          { transform: `translateY(${to * rh}px)`, opacity: 0 },
        ],
        { duration: MOVE.dur, easing: MOVE.ease, fill: 'forwards' },
      ).onfinish = () => ghost.remove();
    });
  });

  const sortBy = (c: DataTableColumn<R>) => {
    if (c.sortable === false) return;
    const first = c.numeric ? 'desc' : 'asc';
    capture('sort');
    if (sort.key !== c.key) setSort({ key: c.key, dir: first });
    else if (sort.dir === first) setSort({ key: c.key, dir: first === 'asc' ? 'desc' : 'asc' });
    else setSort({ key: null, dir: 'desc' });
  };
  const goPage = (n: number) => {
    if (n === pageNow || n < 0 || n >= pages) return;
    capture(n > pageNow ? 'next' : 'prev');
    setPage(n);
  };
  const toggle = (ids: string[], v: boolean) => setSel({ ...sel, ...Object.fromEntries(ids.map((id) => [id, v])) });
  const clear = () => setSel({});
  const clearFilters = () => {
    setValues({});
    setQ('');
    setPage(0);
  };

  const hasAct = !!p.rowActions;
  const actW = p.actionsWidth || 88;
  const hasTitle = shownCols.some((c) => c.mobile === 'title');
  const mobileClass = (c: DataTableColumn<R>, ci: number) => {
    const m = c.mobile || (!hasTitle && ci === 0 ? 'title' : null);
    return m ? 'is-m-' + m : null;
  };
  // A caret on the left of each row when there are long columns (desktop; phone cards have 「顯示全部」).
  // Columns whose whole text the row's details show: long ones, and short ones with fullText.
  const longCols = shownCols.filter((c) => c.long || c.fullText);
  const expander = longCols.length > 0 && !narrow;
  const EXP = 40;
  const template = [
    expander ? EXP + 'px' : null,
    selectable ? '46px' : null,
    ...shownCols.map((c) => (c.width ? `minmax(${c.width}px, ${c.grow || 1}fr)` : c.numeric ? 'minmax(96px, .8fr)' : 'minmax(120px, 1fr)')),
    hasAct ? actW + 'px' : null,
  ]
    .filter(Boolean)
    .join(' ');
  const minW = (expander ? EXP : 0) + (selectable ? 46 : 0) + shownCols.reduce((a, c) => a + (c.width || (c.numeric ? 96 : 120)), 0) + (hasAct ? actW : 0);
  const gridStyle = { gridTemplateColumns: template, minWidth: minW };
  const stickyStyle = (ci: number) => (ci === 0 && sticky ? { left: (expander ? EXP : 0) + (selectable ? 46 : 0) } : undefined);
  const cellClass = (c: DataTableColumn<R>, ci: number, ...more: unknown[]) =>
    cx('ui-dt-cell', isNum(c) && 'is-num', ci === 0 && sticky && 'is-sticky', ...more);

  const head =
    selectable && selIds.length && p.bulkActions ? (
      <div className="ui-dt-row ui-dt-head ui-dt-bulk" role="row" style={{ minWidth: minW }}>
        <div className="ui-dt-cell" role="columnheader">
          <RowCheck v={allOn ? true : 'mixed'} label={tr('全選')} onClick={() => toggle(visIds, !allOn)} />
        </div>
        <span className="ui-dt-bulk-count">{tr('已選 {n} 筆', { n: selIds.length })}</span>
        <span className="ui-dt-bulk-actions">{p.bulkActions(selIds, clear)}</span>
        <button type="button" className="ui-dt-bulk-close" aria-label={tr('取消選取')} onClick={clear}>
          <Icon name="x" size={14} />
        </button>
      </div>
    ) : (
      <div className="ui-dt-row ui-dt-head" role="row" style={gridStyle}>
        {expander ? <div className="ui-dt-cell ui-dt-exp" role="columnheader" aria-label={tr('詳細')} /> : null}
        {selectable ? (
          <div className="ui-dt-cell ui-dt-sel" role="columnheader">
            <RowCheck v={allOn ? true : mixed ? 'mixed' : false} label={tr('全選')} onClick={() => toggle(visIds, !allOn)} />
          </div>
        ) : null}
        {shownCols.map((c, ci) => {
          const cur = sort.key === c.key;
          return (
            <div
              key={c.key}
              role="columnheader"
              aria-sort={cur ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
              className={cellClass(c, ci)}
              style={stickyStyle(ci)}
            >
              {c.sortable === false ? (
                c.label
              ) : (
                <button type="button" className={cx('ui-dt-sort', cur && 'is-on')} onClick={() => sortBy(c)}>
                  <span>{c.label}</span>
                  <Icon d={ARROWS[cur ? sort.dir : 'none']} size={14} className="ui-dt-arrow" />
                </button>
              )}
            </div>
          );
        })}
        {hasAct ? <div className="ui-dt-cell" role="columnheader" aria-label={tr('操作')} /> : null}
      </div>
    );

  const mark = searching ? q : '';
  const cellInner = (r: R, c: DataTableColumn<R>) => {
    const raw = get(r, c.key);
    let v: React.ReactNode;
    if (c.render) v = c.render(r);
    else if (c.unit && raw !== null && raw !== undefined && raw !== '')
      v = (
        <>
          {markMatch(cellText({ ...c, unit: undefined }, raw), mark)} <span className="ui-unit">{c.unit}</span>
        </>
      );
    else v = markMatch(cellText(c, raw), mark);
    return v;
  };
  const cell = (r: R, c: DataTableColumn<R>) => {
    const v = c.long ? <LongText>{cellInner(r, c)}</LongText> : cellInner(r, c);
    return c.fullText ? <FullText text={c.fullText(r)}>{v}</FullText> : v;
  };
  const total = (c: DataTableColumn<R>, ci: number): React.ReactNode => {
    const how = p.totals?.[c.key];
    const rowsAll = list.map((x) => x.r);
    if (ci === 0 && !how) return tr('合計 {n} 筆', { n: format.number(rowsAll.length) });
    if (typeof how === 'function') return how(rowsAll);
    if (how === 'sum' || how === 'avg') {
      const sum = rowsAll.reduce((a, r) => a + (Number(get(r, c.key)) || 0), 0);
      const val = how === 'sum' ? sum : sum / (rowsAll.length || 1);
      return (how === 'avg' ? tr('平均') + ' ' : '') + cellText(how === 'avg' && !c.format ? { ...c, decimals: 1 } : c, val);
    }
    return '';
  };

  return (
    <div ref={rootRef} className={cx('ui-dt', selIds.length && 'has-sel', p.className)}>
      {p.caption ? <div className="ui-dt-caption">{p.caption}</div> : null}
      {p.views ? (
        <div className="ui-dt-views" role="tablist" aria-label={tr('檢視')}>
          {p.views.map((v) => {
            const on = v.id === view;
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
                {v.label}
                <span className="ui-dt-view-n">
                  {format.number(rows.filter((r) => !v.filter || v.filter(r)).length)} <span className="ui-unit">{tr('筆')}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      {summary ? (
        <Tabs
          className="ui-dt-summary"
          label={summary.label || tr('依狀態篩選')}
          unit={summary.unit || '筆'}
          value={sumVal}
          onChange={(v) => {
            capture('sort');
            setSumVal(v);
            setPage(0);
          }}
          items={[
            { id: 'all', label: tr('全部'), count: sumAll.length },
            ...summary.items.map((it) => ({
              id: String(it.value),
              label: it.label,
              count: sumAll.filter((x) => String(get(x.r, summary.key)) === String(it.value)).length,
            })),
          ]}
        />
      ) : null}
      <div className="ui-dt-tools">
        {search !== false ? (
          <SearchField
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(0);
            }}
            placeholder={search.placeholder || tr('搜尋')}
            label={search.placeholder || tr('搜尋')}
            className="ui-dt-search"
          />
        ) : null}
        {filters.length ? (
          <FilterButton
            boundary={rootRef}
            filters={filters}
            values={values}
            activeCount={activeN}
            count={(f, v) => all.filter((x) => passes(x.r, f.key) && matches(f, x.r, f.type === 'list' ? [v] : undefined)).length}
            onChange={(key, v) => {
              setValues({ ...values, [key]: v });
              setPage(0);
            }}
            onClear={() => {
              setValues({});
              setPage(0);
            }}
          />
        ) : null}
        <span className="ui-dt-result">
          {/* Shown 「6 / 6 筆」; read 「6 筆中的 6 筆」, not 「6 斜線 6 筆」. */}
          <span aria-hidden="true">
            {monoNums(tr('{n} / {total} 筆', { n: '\u0001', total: '\u0002' }), [format.number(list.length), format.number(baseCount)])}
          </span>
          <span className="ui-visually-hidden">{format.fractionLabel(list.length, baseCount, tr('筆'))}</span>
        </span>
        {p.columnMenu !== false && cols.length > 2 ? (
          <ColumnMenu cols={cols} hidden={hidden} onToggle={(k) => setToggled({ ...toggled, [k]: !hidden[k] })} />
        ) : null}
      </div>
      <div className={cx('ui-dt-scroller', scrollMore && 'has-more')}>
        <div className="ui-dt-scroll" ref={scrollRef} onScroll={onScroll}>
          <div className="ui-dt-table" role="table" aria-label={p.label || p.caption}>
            {head}
            <div ref={bodyRef} className="ui-dt-body" role="rowgroup">
              {vis.length ? (
                vis.map((x, i) => {
                  const id = visIds[i];
                  const on = !!sel[id];
                  const open = expander && !!opened[id];
                  const detailId = `${uid}-d-${id}`;
                  const rowName = shownCols[0] ? String(cellText(shownCols[0], get(x.r, shownCols[0].key)) ?? '') : '';
                  return (
                    <React.Fragment key={id}>
                      <div
                        data-rid={id}
                        ref={(el) => {
                          rowEls.current[id] = el;
                        }}
                        role="row"
                        className={cx('ui-dt-row', i % 2 && 'is-even', on && 'is-selected', selectable && 'has-sel')}
                        style={gridStyle}
                      >
                        {expander ? (
                          <div className="ui-dt-cell ui-dt-exp" role="cell">
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
                          <div className="ui-dt-cell ui-dt-sel" role="cell">
                            <RowCheck v={on} label={tr('選取第 {n} 筆', { n: start + i + 1 })} onClick={() => toggle([id], !on)} />
                          </div>
                        ) : null}
                        {shownCols.map((c, ci) => (
                          <div
                            key={c.key}
                            role="cell"
                            data-label={c.label}
                            className={cellClass(c, ci, c.long && 'is-long', mobileClass(c, ci))}
                            style={stickyStyle(ci)}
                          >
                            {cell(x.r, c)}
                          </div>
                        ))}
                        {hasAct ? (
                          <div className="ui-dt-cell ui-dt-acts" role="cell">
                            {p.rowActions?.(x.r)}
                          </div>
                        ) : null}
                      </div>
                      {open ? (
                        <div id={detailId} role="row" className={cx('ui-dt-detail', i % 2 && 'is-even')} style={{ minWidth: minW }}>
                          <div role="cell" className="ui-dt-detail-cell" style={{ paddingLeft: EXP + (selectable ? 46 : 0) + 12 }}>
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
                <div className="ui-dt-empty">
                  {p.emptyText || tr('沒有符合的資料')}
                  {q || activeN ? (
                    <div>
                      <Button onClick={clearFilters}>{tr('清除篩選')}</Button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            {p.totals && list.length ? (
              <div className="ui-dt-row ui-dt-total" role="row" style={gridStyle}>
                {expander ? <div className="ui-dt-cell" role="cell" /> : null}
                {selectable ? <div className="ui-dt-cell" role="cell" /> : null}
                {shownCols.map((c, ci) => (
                  <div key={c.key} role="cell" className={cellClass(c, ci)} style={stickyStyle(ci)}>
                    {total(c, ci)}
                  </div>
                ))}
                {hasAct ? <div className="ui-dt-cell" role="cell" /> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <ScrollHint show={overflows} done={scrolled} />
      {/* One page: the count above the table already says how many rows there are, so no range and no page numbers. */}
      {pages > 1 ? (
        <div className="ui-dt-foot">
          <span className="ui-dt-range">
            {monoNums(tr('第 {a}–{b} 筆，共 {n} 筆', { a: '\u0001', b: '\u0002', n: '\u0003' }), [
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
    </div>
  );
}
