import * as React from 'react';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Skeleton } from '../Skeleton/Skeleton';
import { Tag } from '../Tag/Tag';
import { DOC_SHAPE, FILE_KIND, fileExt, findNode, foldersOf, latest, pathTo, sortNodes, toDate, type TreeSort } from './helpers';
import { fileSize, format } from '../../format';
import { tr } from '../../i18n';
import { Icon, IconOf, type IconSource } from '../../icons/Icon';
import { cx, digits, reduced, browserKey, nodeText } from '../../internal/util';
import { announce } from '../../announce';
import { devWarn } from '../../internal/dev';
import { CheckMark } from '../../internal/Field';

export interface TreeNode {
  id: string;
  name: string;
  /** A folder (files kind) or an expandable item (plain kind). */
  children?: TreeNode[];
  /** Overrides the extension taken from the name. */
  ext?: string;
  date?: Date | number | string;
  /** Bytes. */
  size?: number;
  /** New to this person: the date turns accent and bold; folders say 「2 個新」. */
  unseen?: boolean;
  /** kind="plain": location shown under the name, shortened with format.path. */
  path?: string;
  /** kind="plain": text under the name instead of path; its numbers are in Geist Mono. */
  meta?: string;
  /** kind="plain": category tags after the name. Tag only what differs from most items. Their words are read as part
   *  of the item's name, after the name; give `ariaLabel` when a tag is an element whose words cannot be read off it. */
  tags?: React.ReactNode[];
  /** The whole name screen readers read for this item, instead of 「name，tags，meta，path」. */
  ariaLabel?: string;
  /** Expandable before its children are loaded (with loadChildren). */
  hasChildren?: boolean;
  /** kind="plain": name in the secondary color. */
  muted?: boolean;
  /** kind="plain": icon before the name. */
  icon?: IconSource;
}

export interface TreeListProps {
  items: TreeNode[];
  /** 'files' (default): folders and files with date and size. 'plain': any other tree, such as a call tree. */
  kind?: 'files' | 'plain';
  /** kind="plain": the selected row. */
  selectedId?: string;
  onSelect?: (node: TreeNode) => void;
  /** kind="plain": IconButtons at the row's right end. */
  rowActions?: (node: TreeNode) => React.ReactNode;
  /** kind="plain": show 「全部展開」. */
  toggleAll?: boolean;
  title?: React.ReactNode;
  /** Accessible name when there is no title. */
  label?: string;
  /** Buttons at the top right. */
  actions?: React.ReactNode;
  /** Default 'newest' for files, false (as given) for plain. */
  sort?: TreeSort;
  /** 'single' keeps one folder open per level; choose it when folders are many and messy. Default 'multi'. */
  expand?: 'multi' | 'single';
  defaultOpen?: string[];
  /** Second line under the title, e.g. 「17 個檔案」. */
  subtitle?: React.ReactNode;
  /** Fixed height (px or a CSS length such as '100%'): the header stays and the list scrolls inside. Needed inside a fixed-height panel. */
  height?: number | string;
  /** No card background, shadow or radius, for a tree inside a panel that is not a Card. Inside a Card this happens by itself. */
  bare?: boolean;
  /** Controlled open ids; update them in onToggle. */
  open?: string[];
  onToggle?: (node: TreeNode, isOpen: boolean, openIds: string[]) => void;
  /** Controlled mode: 「全部展開／全部收合」 reports every open id here. */
  onToggleAll?: (isOpen: boolean, openIds: string[]) => void;
  /** Loads the children of a node with hasChildren the first time it opens. */
  loadChildren?: (node: TreeNode) => TreeNode[] | Promise<TreeNode[]>;
  /** Files kind: checkboxes on hover; a folder's checkbox selects every file inside. */
  selectable?: boolean;
  selected?: string[];
  onSelectChange?: (ids: string[]) => void;
  bulkActions?: (files: TreeNode[], clear: () => void) => React.ReactNode;
  /** Adds 「下載」 to each file and to the bulk bar. */
  onDownload?: (files: TreeNode[]) => void;
  onOpen?: (file: TreeNode) => void;
  emptyText?: string;
  className?: string;
}

type Load = { status: 'loading' } | { status: 'done'; children: TreeNode[] } | { status: 'error'; error: string };

interface NodeRow {
  x?: undefined;
  n: TreeNode;
  depth: number;
  guides: number[];
  fresh: boolean;
  isF: boolean;
  open: boolean;
  pos: number;
  size: number;
}
interface ExtraRow {
  x: 'loading' | 'error';
  n: TreeNode;
  depth: number;
  guides: number[];
  error?: string;
}

const vars = (v: Record<string, number>) => v as React.CSSProperties;

function Guides({ guides }: { guides: number[] }) {
  return (
    <>
      {guides.map((d) => (
        <span key={d} className={cx('ui-tree-guide', d >= 3 && 'is-deep')} aria-hidden="true" style={vars({ '--g': d })} />
      ))}
    </>
  );
}

/** Folders and files (or any tree) that expand in place, with guide lines, keyboard navigation and lazy children. It is a card on its own. */
export function TreeList(p: TreeListProps) {
  const { items } = p;
  const single = p.expand === 'single';
  const plain = p.kind === 'plain';
  const sort: TreeSort = p.sort === undefined ? (plain ? false : 'newest') : p.sort;
  const selectable = !!p.selectable && !plain;
  devWarn(plain && p.selectable, 'TreeList', 'selectable works with kind="files" only; for plain trees use selectedId and onSelect.');
  const [ownOpen, setOwnOpen] = React.useState<Record<string, boolean>>(() => Object.fromEntries((p.defaultOpen ?? []).map((k) => [k, true])));
  const open: Record<string, boolean> = p.open ? Object.fromEntries(p.open.map((k) => [k, true])) : ownOpen;
  const [loaded, setLoaded] = React.useState<Record<string, Load>>({});
  const kids = (n: TreeNode): TreeNode[] | null => {
    const l = loaded[n.id];
    return n.children ?? (l?.status === 'done' ? l.children : null);
  };
  const expandable = (n: TreeNode) => {
    const c = kids(n);
    return c ? c.length > 0 : !!n.hasChildren;
  };
  const load = (n: TreeNode) => {
    const loader = p.loadChildren;
    if (!loader || kids(n) || loaded[n.id]?.status === 'loading') return;
    setLoaded((m) => ({ ...m, [n.id]: { status: 'loading' } }));
    Promise.resolve()
      .then(() => loader(n))
      .then(
        (c) => setLoaded((m) => ({ ...m, [n.id]: { status: 'done', children: c || [] } })),
        (err: unknown) => setLoaded((m) => ({ ...m, [n.id]: { status: 'error', error: err instanceof Error ? err.message : String(err ?? '') } })),
      );
  };
  const openKey = p.open?.join('\u0000');
  React.useEffect(() => {
    for (const k of Object.keys(open)) {
      const n = open[k] ? findNode(k, items, kids) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- starts loading children for ids opened from outside
      if (n) load(n);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load the children of ids opened from outside
  }, [openKey]);
  // Folders just opened: their rows slide in.
  const [fresh, setFresh] = React.useState<Record<string, boolean>>({});
  // The slide-in runs once: forget the folders after the animation so rows mounted later do not replay it.
  React.useEffect(() => {
    if (!Object.keys(fresh).length) return;
    const t = setTimeout(() => setFresh({}), 400);
    return () => clearTimeout(t);
  }, [fresh]);
  const [ownSel, setOwnSel] = React.useState<string[]>([]);
  const sel = p.selected ?? ownSel;
  const setSel = (v: string[]) => {
    if (!p.selected) setOwnSel(v);
    p.onSelectChange?.(v);
  };
  const uid = React.useId().replace(/:/g, '');
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const refs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const want = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (want.current) {
      refs.current[want.current]?.focus();
      want.current = null;
    }
  });
  const selSet = new Set(sel);
  // Files under a node, loaded children included; an unloaded folder has no known files yet.
  const filesUnder = (n: TreeNode): TreeNode[] => {
    const c = kids(n);
    return c ? c.flatMap(filesUnder) : n.hasChildren ? [] : [n];
  };
  const allFiles = items.flatMap(filesUnder);

  const toggle = (n: TreeNode) => {
    const o = { ...open };
    const will = !o[n.id];
    if (single && will) {
      const path = pathTo(n.id, items, kids);
      const siblings = (path && path.length > 1 ? kids(path[path.length - 2]) : items) ?? [];
      for (const s of siblings) if (s.id !== n.id) o[s.id] = false;
    }
    o[n.id] = will;
    setFresh(will && !reduced() ? { [n.id]: true } : {});
    if (will) load(n);
    p.onToggle?.(
      n,
      will,
      Object.keys(o).filter((k) => o[k]),
    );
    if (!p.open) setOwnOpen(o);
    // Screen readers hear what happened and how many children opened.
    const c = will ? kids(n) : null;
    announce(will ? (c ? tr('已展開，{n} 個子項目', { n: c.length }) : tr('已展開')) : tr('已收合'));
  };
  const checkState = (n: TreeNode): boolean | 'mixed' => {
    const fl = filesUnder(n);
    const k = fl.filter((f) => selSet.has(f.id)).length;
    return k === 0 ? false : k === fl.length ? true : 'mixed';
  };
  const checkToggle = (n: TreeNode) => {
    const on = checkState(n) !== true;
    const m = new Set(selSet);
    for (const f of filesUnder(n)) {
      if (on) m.add(f.id);
      else m.delete(f.id);
    }
    setSel(allFiles.filter((f) => m.has(f.id)).map((f) => f.id));
  };
  const openFile = (n: TreeNode) => (p.onOpen ? p.onOpen(n) : p.onDownload?.([n]));

  const every: (NodeRow | ExtraRow)[] = [];
  const walk = (list: TreeNode[], depth: number, guides: number[], isFresh: boolean) => {
    const sorted = sortNodes(list, sort, plain && !sort);
    sorted.forEach((n, i) => {
      const isF = plain ? expandable(n) : !!(n.children || n.hasChildren);
      const isOpen = isF && !!open[n.id];
      every.push({ n, depth, guides, fresh: isFresh, isF, open: isOpen, pos: i + 1, size: sorted.length });
      if (!isOpen) return;
      const c = kids(n);
      const st = loaded[n.id];
      const g = [...guides, depth];
      if (c) walk(c, depth + 1, g, isFresh || !!fresh[n.id]);
      else if (st?.status === 'error') every.push({ x: 'error', n, depth: depth + 1, guides: g, error: st.error });
      else if (p.loadChildren) every.push({ x: 'loading', n, depth: depth + 1, guides: g });
    });
  };
  walk(items, 0, [], false);
  const rows = every.filter((r): r is NodeRow => !r.x);
  const cur = Math.max(
    0,
    rows.findIndex((r) => r.n.id === focusId),
  );

  const go = (j: number) => {
    if (!rows[j]) return;
    want.current = rows[j].n.id;
    setFocusId(rows[j].n.id);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).getAttribute('role') !== 'treeitem' || !rows.length || browserKey(e)) return;
    const r = rows[cur];
    const k = e.key;
    const handled = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'ArrowRight', 'ArrowLeft', 'Enter'].includes(k) || (k === ' ' && selectable);
    if (!handled) return;
    e.preventDefault();
    if (k === 'ArrowDown') go(cur + 1);
    else if (k === 'ArrowUp') go(cur - 1);
    else if (k === 'Home') go(0);
    else if (k === 'End') go(rows.length - 1);
    else if (k === 'ArrowRight') {
      if (r.isF && !r.open) toggle(r.n);
      else if (r.isF) go(cur + 1);
    } else if (k === 'ArrowLeft') {
      if (r.isF && r.open) toggle(r.n);
      else
        for (let j = cur - 1; j >= 0; j--)
          if (rows[j].depth < r.depth) {
            go(j);
            break;
          }
    } else if (k === 'Enter') {
      if (plain) {
        p.onSelect?.(r.n);
        if (r.isF) toggle(r.n);
      } else if (r.isF) toggle(r.n);
      else openFile(r.n);
    } else checkToggle(r.n);
  };

  const itemProps = (r: NodeRow, idx: number) => ({
    ref: (el: HTMLDivElement | null) => {
      refs.current[r.n.id] = el;
    },
    role: 'treeitem',
    tabIndex: idx === cur ? 0 : -1,
    'aria-level': r.depth + 1,
    'aria-posinset': r.pos,
    'aria-setsize': r.size,
    'aria-expanded': r.isF ? r.open : undefined,
    // The children's group sits after the row (the row is a grid); aria-owns ties it to this item.
    'aria-owns': r.isF && r.open ? `${uid}-g-${r.n.id}` : undefined,
    style: vars({ '--d': r.depth }),
    onFocus: () => focusId !== r.n.id && setFocusId(r.n.id),
  });

  const plainRow = (r: NodeRow, idx: number) => {
    const { n, isF } = r;
    const on = p.selectedId != null && p.selectedId === n.id;
    const meta = n.meta ?? (n.path ? format.path(n.path) : '');
    return (
      <div
        key={n.id}
        {...itemProps(r, idx)}
        // Only the item's own words: name, tags, meta, then the full path (the shortened one would read 「…」 aloud).
        aria-label={n.ariaLabel ?? [n.name, ...(n.tags ?? []).map(nodeText), n.meta, n.path].filter(Boolean).join('，')}
        aria-selected={p.onSelect ? on : undefined}
        className={cx('ui-tree-row', 'is-plain', on && 'is-current', n.muted && 'is-muted', r.fresh && 'ui-tree-in')}
        // A click anywhere on the row selects it and, when it has children, opens or closes it too.
        onClick={() => {
          setFocusId(n.id);
          p.onSelect?.(n);
          if (isF) toggle(n);
        }}
      >
        <Guides guides={r.guides} />
        <button
          type="button"
          tabIndex={-1}
          className={cx('ui-tree-caret', 'ui-tree-caretbtn', r.open && 'is-open', !isF && 'is-leaf')}
          // A mouse target only: the item itself says whether it is expanded.
          aria-hidden="true"
          onClick={(e) => {
            e.stopPropagation();
            if (isF) toggle(n);
          }}
        >
          <Icon name="caret-right" size={16} />
        </button>
        {n.icon ? (
          <span className="ui-tree-picon" aria-hidden="true">
            <IconOf icon={n.icon} size={20} />
          </span>
        ) : null}
        <div className="ui-tree-main">
          <div className="ui-tree-name">
            {r.depth > 3 ? (
              <span className="ui-tree-depth" aria-hidden="true">
                {'L' + (r.depth + 1)}
              </span>
            ) : null}
            <span className="ui-tree-label is-one">{n.name}</span>
            {(n.tags ?? []).map((t, i) => (
              <Tag key={i}>{t}</Tag>
            ))}
          </div>
          {meta ? <div className={cx('ui-tree-pmeta', n.meta == null && 'is-path')}>{n.meta != null ? digits(meta, /(\d[\d,.]*)/) : meta}</div> : null}
        </div>
        {p.rowActions ? (
          <span className="ui-tree-act" onClick={(e) => e.stopPropagation()}>
            {p.rowActions(n)}
          </span>
        ) : null}
      </div>
    );
  };

  const extraRow = (r: ExtraRow) => (
    <div key={`${r.n.id}:${r.x}`} className={cx('ui-tree-row is-plain is-extra', r.x === 'error' && 'is-error')} style={vars({ '--d': r.depth })} role="none">
      <Guides guides={r.guides} />
      <span className="ui-tree-caret is-leaf" aria-hidden="true" />
      {r.x === 'loading' ? (
        <>
          <div className="ui-tree-main">
            <Skeleton width="55%" height={14} />
          </div>
          <span className="ui-visually-hidden" role="status">
            {tr('載入中')}
          </span>
        </>
      ) : (
        <>
          <div className="ui-tree-main" role="alert">
            {tr('無法載入 {name} 的子項目', { name: r.n.name })}
            {r.error ? '：' + r.error : ''}。
          </div>
          <button
            type="button"
            className="ui-link-btn"
            onClick={() => {
              setLoaded(({ [r.n.id]: _, ...m }) => m);
              setTimeout(() => load(r.n), 0);
            }}
          >
            {tr('重試')}
          </button>
        </>
      )}
    </div>
  );

  const fileRow = (r: NodeRow, idx: number) => {
    const { n, isF } = r;
    const ck = selectable ? checkState(n) : false;
    const ext = isF ? '' : fileExt(n);
    const kind = FILE_KIND[ext] || 'other';
    const fl = isF ? filesUnder(n) : [];
    const when = isF ? latest(n) : toDate(n.date);
    const dateTxt = when ? format.relative(when) : '';
    const sizeTxt = !isF ? fileSize(n.size) : '';
    const nNew = fl.filter((f) => f.unseen).length;
    const isNew = !isF && !!n.unseen;
    const bits = (isF ? [fl.length ? tr('{n} 個檔案', { n: fl.length }) : '', dateTxt] : [dateTxt, sizeTxt]).filter(Boolean);
    return (
      <div
        key={n.id}
        {...itemProps(r, idx)}
        aria-label={n.ariaLabel}
        aria-selected={selectable ? ck === true : undefined}
        className={cx('ui-tree-row', isF && 'is-folder', ck === true && 'is-selected', r.fresh && 'ui-tree-in')}
        onClick={() => {
          setFocusId(n.id);
          if (isF) toggle(n);
          else openFile(n);
        }}
      >
        <Guides guides={r.guides} />
        {selectable ? (
          <span className="ui-tree-sel">
            <button
              type="button"
              role="checkbox"
              tabIndex={-1}
              aria-checked={ck}
              aria-label={tr('選取 {name}', { name: n.name })}
              className={cx('ui-check', ck && 'is-on')}
              onClick={(e) => {
                e.stopPropagation();
                checkToggle(n);
              }}
            >
              <span className="ui-check-box" aria-hidden="true">
                <CheckMark v={ck} />
              </span>
            </button>
          </span>
        ) : null}
        {isF ? (
          <>
            <span className={cx('ui-tree-caret', r.open && 'is-open')} aria-hidden="true">
              <Icon name="caret-right" size={16} />
            </span>
            <span className="ui-tree-ficon" aria-hidden="true">
              <Icon name={r.open ? 'folder-open' : 'folder'} size={24} />
            </span>
          </>
        ) : (
          <span className={cx('ui-tree-doc', 'is-' + kind)} aria-hidden="true">
            <svg width={30} height={36} viewBox="0 0 30 36">
              <path d={DOC_SHAPE} />
              <path d="M20 1.5V9h7.5" fill="none" />
            </svg>
            <span className="ui-tree-ext">{(ext || '?').slice(0, 4).toUpperCase()}</span>
          </span>
        )}
        <div className="ui-tree-main">
          <div className="ui-tree-name">
            <span className="ui-tree-label">{n.name}</span>
            {nNew ? <span className="ui-tree-newcount">{tr('{n} 個新', { n: nNew })}</span> : null}
            {isF && fl.length ? <span className="ui-tree-count ui-tree-mc">{tr('{n} 個檔案', { n: fl.length })}</span> : null}
          </div>
          {bits.length ? (
            <div className="ui-tree-meta ui-tree-mb">
              {bits.map((t, i) => (
                <span key={i} className={cx(!isF && t === dateTxt && isNew && 'is-new')}>
                  {(i ? '· ' : '') + t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <span className={cx('ui-tree-col', 'ui-tree-date', 'ui-tree-mc', isNew && 'is-new')}>{dateTxt}</span>
        <span className="ui-tree-col ui-tree-size ui-tree-mc">{sizeTxt}</span>
        {p.onDownload ? (
          isF ? (
            <span className="ui-tree-actsp" aria-hidden="true" />
          ) : (
            <span className="ui-tree-act">
              <IconButton
                label={tr('下載 {name}', { name: n.name })}
                icon="download-simple"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  p.onDownload?.([n]);
                }}
              />
            </span>
          )
        ) : null}
      </div>
    );
  };

  // Every folder whose children are known, loaded ones included.
  const folders = foldersOf(items, kids);
  const anyClosed = folders.some((f) => !open[f.id]);
  const selFiles = allFiles.filter((f) => selSet.has(f.id));
  const total = selFiles.reduce((a, f) => a + (f.size || 0), 0);
  const showToggleAll = !single && folders.length > 0 && (!plain || !!p.toggleAll) && (!p.open || !!p.onToggleAll);
  devWarn(
    p.open && (!plain || p.toggleAll) && !single && !p.onToggleAll,
    'TreeList',
    'with controlled open ids, 「全部展開」 needs onToggleAll to report the new ids; it is hidden until you pass it.',
  );
  const head =
    selectable && selFiles.length ? (
      <div className="ui-tree-head ui-tree-bulk">
        <span className="ui-tree-bulk-count">
          {tr('已選 {n} 個檔案', { n: selFiles.length })}
          {total ? <span className="ui-tree-bulk-size">{tr('共 {size}', { size: fileSize(total) })}</span> : null}
        </span>
        <span className="ui-tree-head-actions">
          <Button onClick={() => setSel([])}>{tr('清除選取')}</Button>
          {p.onDownload ? (
            <Button
              variant="primary"
              icon="download-simple"
              onClick={() => {
                p.onDownload?.(selFiles);
                setSel([]);
              }}
            >
              {tr('下載')}
            </Button>
          ) : null}
          {p.bulkActions?.(selFiles, () => setSel([]))}
        </span>
      </div>
    ) : p.title || p.actions || showToggleAll ? (
      <div className="ui-tree-head">
        {p.title ? (
          <div className="ui-tree-titles">
            <h2 className="ui-tree-title">{p.title}</h2>
            {p.subtitle ? <div className="ui-tree-subtitle">{p.subtitle}</div> : null}
          </div>
        ) : (
          <span />
        )}
        <span className="ui-tree-head-actions">
          {showToggleAll ? (
            <Button
              onClick={() => {
                const o = Object.fromEntries(folders.map((f) => [f.id, anyClosed]));
                setFresh(anyClosed && !reduced() ? Object.fromEntries(folders.filter((f) => !open[f.id]).map((f) => [f.id, true])) : {});
                if (p.open) p.onToggleAll?.(anyClosed, anyClosed ? [...new Set([...p.open, ...folders.map((f) => f.id)])] : []);
                else setOwnOpen(o);
              }}
            >
              {anyClosed ? tr('全部展開') : tr('全部收合')}
            </Button>
          ) : null}
          {p.actions ?? null}
        </span>
      </div>
    ) : null;
  // The flat rows nested again: each open item's children in a role="group" right after it.
  const render1 = (r: NodeRow | ExtraRow) => (r.x ? extraRow(r) : plain ? plainRow(r, rows.indexOf(r)) : fileRow(r, rows.indexOf(r)));
  const nest = (start: number, depth: number): [React.ReactNode[], number] => {
    const out: React.ReactNode[] = [];
    let i = start;
    while (i < every.length && every[i].depth >= depth) {
      const r = every[i];
      out.push(render1(r));
      i++;
      if (!r.x && r.open && i < every.length && every[i].depth > depth) {
        const [kidsOut, next] = nest(i, depth + 1);
        out.push(
          <div key={'g-' + r.n.id} id={`${uid}-g-${r.n.id}`} role="group" className="ui-tree-group">
            {kidsOut}
          </div>,
        );
        i = next;
      }
    }
    return [out, i];
  };
  return (
    <section
      className={cx(
        'ui-tree',
        plain && 'is-plain',
        selectable && 'is-selectable',
        selFiles.length && 'has-sel',
        p.bare && 'is-bare',
        p.height != null && 'has-height',
        p.className,
      )}
      aria-label={p.title ? undefined : p.label}
      style={p.height != null ? { height: typeof p.height === 'number' ? p.height + 'px' : p.height } : undefined}
    >
      {head}
      {rows.length ? (
        <div
          role="tree"
          aria-label={p.label || (typeof p.title === 'string' ? p.title : undefined)}
          aria-multiselectable={selectable || undefined}
          className="ui-tree-list"
          onKeyDown={onKey}
        >
          {nest(0, 0)[0]}
        </div>
      ) : (
        <p className="ui-tree-empty">{p.emptyText || (plain ? tr('沒有項目') : tr('這裡還沒有檔案'))}</p>
      )}
    </section>
  );
}
