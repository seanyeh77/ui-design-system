import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { CodeText } from '../InlineCode/InlineCode';
import { tr } from '../../i18n';
import { Icon, IconOf, type IconSource } from '../../icons/Icon';
import { cx } from '../../internal/util';

export interface PaletteItem {
  id?: string | number;
  label: string;
  /** Under the label; `backticks` are code. */
  detail?: string;
  /** What it is: 頁面, 設定, 指令, 檔案, or your own kinds (with `kinds`). Picks the icon. */
  kind?: string;
  /** Overrides the kind's icon. */
  icon?: IconSource;
  /** The label is code: Geist Mono. */
  code?: boolean;
  /** More words that find it. */
  keywords?: string[];
}

const KIND_ICONS: Record<string, IconSource> = { 頁面: 'file-text', 設定: 'gear', 指令: 'command', 檔案: 'file-code' };

export interface CommandPaletteProps<T extends PaletteItem = PaletteItem> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: T[];
  onSelect?: (item: T) => void;
  /** Default 「搜尋」. */
  placeholder?: string;
  /** Shown before anything is typed. */
  recent?: T[];
  /** Default 「最近開啟」. */
  recentLabel?: string;
  /** Shown with nothing typed and no recent items. Default 「輸入名稱開始搜尋」. */
  emptyText?: string;
  /** Icon for each of your own kinds: { 函式: 'brackets-curly' }. */
  kinds?: Record<string, IconSource>;
  /** false: items are already filtered (server search with onQueryChange). */
  filter?: boolean;
  onQueryChange?: (query: string) => void;
  /** Shows 「搜尋中」 when there are no items yet. */
  loading?: boolean;
  /** Most results shown. Default 50. */
  limit?: number;
  /** Ctrl K / ⌘K toggles it. Default true. */
  hotkey?: boolean;
  defaultQuery?: string;
  /** Default 「搜尋」. */
  label?: string;
}

/** The score of an item for a query: label starts with it, label contains it, other text contains it; null: no match. */
function score(it: PaletteItem, q: string): [rank: number, at: number] | null {
  const i = it.label.toLowerCase().indexOf(q);
  if (i === 0) return [0, 0];
  if (i > 0) return [1, i];
  const more = [it.detail, it.kind, ...(it.keywords ?? [])].join(' ').toLowerCase();
  return more.includes(q) ? [2, -1] : null;
}

/** One search for everything, opened with Ctrl K (⌘K). A panel in the middle of the screen; results sorted by relevance. */
export function CommandPalette<T extends PaletteItem = PaletteItem>(props: CommandPaletteProps<T>) {
  const { open, onOpenChange, items, onSelect, placeholder, recent, recentLabel, emptyText, kinds, filter = true, onQueryChange, loading, limit = 50, hotkey = true, defaultQuery = '', label } = props;
  const [q, setQ] = React.useState(defaultQuery);
  const [active, setActive] = React.useState(0);
  const list = React.useRef<HTMLUListElement>(null);
  const id = React.useId();
  const toggle = React.useRef(onOpenChange);
  React.useLayoutEffect(() => {
    toggle.current = onOpenChange;
  });
  React.useEffect(() => {
    if (!hotkey) return;
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle.current(!open);
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [hotkey, open]);
  const query = q.trim().toLowerCase();
  const shown: { it: T; at: number }[] = (
    filter === false
      ? items.map((it) => ({ it, at: -1 }))
      : !query
        ? (recent ?? []).map((it) => ({ it, at: -1 }))
        : items
            .map((it, i) => {
              const r = score(it, query);
              return r ? { it, rank: r[0], at: r[1], i } : null;
            })
            .filter((x) => x !== null)
            .sort((a, b) => a.rank - b.rank || a.i - b.i)
  ).slice(0, limit);
  const act = Math.min(active, Math.max(0, shown.length - 1));
  React.useEffect(() => {
    list.current?.querySelector('.is-active')?.scrollIntoView?.({ block: 'nearest' });
  }, [act, open]);
  const pick = (it: T) => {
    onOpenChange(false);
    onSelect?.(it);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const d = e.key === 'ArrowDown' ? 1 : -1;
      setActive(shown.length ? (act + d + shown.length) % shown.length : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (shown[act]) pick(shown[act].it);
    }
  };
  const labelOf = (it: T, at: number) => {
    const t = it.label;
    return (
      <span className={cx('ui-pal-label', it.code && 'is-code')}>
        {at >= 0 && query ? (
          <>
            {t.slice(0, at)}
            <mark className="ui-pal-hit">{t.slice(at, at + query.length)}</mark>
            {t.slice(at + query.length)}
          </>
        ) : (
          t
        )}
      </span>
    );
  };
  const empty = query ? tr('找不到符合「{q}」的結果', { q: q.trim() }) : emptyText || tr('輸入名稱開始搜尋');
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setQ(defaultQuery);
          setActive(0);
        }
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="ui-pal-backdrop" />
        <Dialog.Popup className="ui-pal" aria-label={label || tr('搜尋')}>
          <div className="ui-pal-head">
            <Icon name="magnifying-glass" className="ui-pal-icon" />
            <input
              className="ui-pal-input"
              type="text"
              value={q}
              placeholder={placeholder || tr('搜尋')}
              role="combobox"
              aria-expanded
              aria-controls={id}
              aria-autocomplete="list"
              aria-activedescendant={shown[act] ? `${id}-${act}` : undefined}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="go"
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
                onQueryChange?.(e.target.value);
              }}
              onKeyDown={onKey}
            />
            <Dialog.Close className="ui-pal-cancel">{tr('取消')}</Dialog.Close>
          </div>
          {!query && shown.length && recent ? <div className="ui-pal-group">{recentLabel || tr('最近開啟')}</div> : null}
          {shown.length ? (
            <ul ref={list} id={id} className="ui-pal-list" role="listbox" aria-label={tr('搜尋結果')}>
              {shown.map(({ it, at }, i) => (
                <li
                  key={it.id ?? i}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={i === act}
                  className={cx('ui-pal-item', i === act && 'is-active')}
                  onMouseMove={() => act !== i && setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(it)}
                >
                  <span className="ui-pal-kind" title={it.kind}>
                    <IconOf icon={it.icon ?? (it.kind ? kinds?.[it.kind] ?? KIND_ICONS[it.kind] : undefined) ?? 'file'} size={16} />
                  </span>
                  <span className="ui-pal-text">
                    <span className="ui-pal-line">
                      {labelOf(it, at)}
                      {it.kind ? <span className="ui-visually-hidden">{'，' + it.kind}</span> : null}
                    </span>
                    {it.detail ? <CodeText className="ui-pal-detail" text={it.detail} /> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ui-pal-empty" role="status">
              {loading ? tr('搜尋中') : empty}
            </p>
          )}
          <div className="ui-pal-keys" aria-hidden="true">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              {tr('選擇')}
            </span>
            <span>
              <kbd>Enter</kbd>
              {tr('打開')}
            </span>
            <span>
              <kbd>Esc</kbd>
              {tr('關閉')}
            </span>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
