import * as React from 'react';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FloatingPanel } from '../../internal/FloatingPanel';
import type { SortLevel } from './filters';

export interface SortColumn {
  key: string;
  label: string;
  /** Numbers start from the largest; text from A. */
  numeric?: boolean;
}

/** 「由小到大」 or 「由大到小」. */
export const dirWord = (dir: SortLevel['dir']) => (dir === 'asc' ? tr('由小到大') : tr('由大到小'));
const ARROW = { asc: '↑', desc: '↓' };

/** The whole sort read out: 「依 程式 由小到大，再依 ΔT 由大到小排序」. */
export function sortSentence(levels: SortLevel[], cols: SortColumn[]): string {
  if (!levels.length) return tr('已還原原本的順序');
  const name = (k: string) => cols.find((c) => c.key === k)?.label ?? k;
  return tr('依 {list} 排序', { list: levels.map((l) => name(l.key) + ' ' + dirWord(l.dir)).join(tr('，再依 ')) });
}

interface SortButtonProps {
  /** The columns that can be sorted, in table order. */
  cols: SortColumn[];
  levels: SortLevel[];
  max: number;
  onChange: (levels: SortLevel[]) => void;
  boundary?: React.RefObject<Element | null>;
}

/** The toolbar's 「排序」 button: it shows the current sort and opens a panel to add, order, flip and remove levels. */
export function SortButton({ cols, levels, max, onChange, boundary }: SortButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [drag, setDrag] = React.useState<{ from: number; over: number } | null>(null);
  const listRef = React.useRef<HTMLOListElement>(null);
  const firstAdd = React.useRef<HTMLButtonElement>(null);
  const addId = React.useId();
  React.useEffect(() => {
    if (adding) firstAdd.current?.focus();
  }, [adding]);
  const name = (k: string) => cols.find((c) => c.key === k)?.label ?? k;
  const first = (k: string): SortLevel['dir'] => (cols.find((c) => c.key === k)?.numeric ? 'desc' : 'asc');
  const rest = cols.filter((c) => !levels.some((l) => l.key === c.key));
  const move = (from: number, to: number, focus?: boolean) => {
    if (to < 0 || to >= levels.length || from === to) return;
    const next = levels.slice();
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
    if (focus) requestAnimationFrame(() => listRef.current?.querySelectorAll<HTMLElement>('.ui-dt-sortgrip')[to]?.focus());
  };
  const shown = levels.map((l) => name(l.key) + ' ' + ARROW[l.dir]).join(tr('、'));
  const read = levels.map((l) => name(l.key) + ' ' + dirWord(l.dir)).join(tr('、'));
  return (
    <FloatingPanel
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setAdding(false);
      }}
      boundary={boundary}
      className="ui-dt-sortpop"
      aria-label={tr('排序')}
      trigger={
        <button
          type="button"
          className={cx('ui-btn', 'ui-btn-secondary', 'ui-dt-sortbtn', open && 'is-open', levels.length > 0 && 'is-on')}
          aria-label={levels.length ? tr('排序：{list}', { list: read }) : tr('排序')}
        >
          <Icon name="sort-ascending" size={20} />
          {/* The whole sort, or on a narrow table (container query) 「排序」 and the number of levels. */}
          <span className="ui-dt-sortbtn-text">{levels.length ? tr('排序：{list}', { list: shown }) : tr('排序')}</span>
          {levels.length ? (
            <span className="ui-dt-sortbtn-short">
              <span className="ui-dt-btntext">{tr('排序')}</span>
              <span className="ui-pop-count">{levels.length}</span>
            </span>
          ) : null}
        </button>
      }
    >
      <div className="ui-dt-filterhead">
        <span className="ui-popover-title">{tr('排序')}</span>
        {levels.length ? (
          <button type="button" className="ui-link-btn" onClick={() => onChange([])}>
            {tr('清除全部')}
          </button>
        ) : null}
      </div>
      {levels.length ? (
        <ol className="ui-dt-sortlist" ref={listRef}>
          {levels.map((l, i) => (
            <li
              key={l.key}
              className={cx('ui-dt-sortlvl', drag?.from === i && 'is-dragging', drag && drag.over === i && drag.from !== i && 'is-over')}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(i));
                setDrag({ from: i, over: i });
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (drag && drag.over !== i) setDrag({ ...drag, over: i });
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (drag) move(drag.from, i);
                setDrag(null);
              }}
              onDragEnd={() => setDrag(null)}
            >
              <button
                type="button"
                className="ui-dt-sortgrip"
                aria-label={tr('「{name}」第 {n} 排序；按 Alt＋↑ ↓ 調整順序', { name: name(l.key), n: i + 1 })}
                aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                onKeyDown={(e) => {
                  if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
                  e.preventDefault();
                  move(i, i + (e.key === 'ArrowUp' ? -1 : 1), true);
                }}
              >
                <Icon name="dots-six-vertical" size={16} />
              </button>
              <span className="ui-dt-sortn">{i + 1}</span>
              <span className="ui-dt-sortname">{name(l.key)}</span>
              <span className="ui-dt-sortdir" role="radiogroup" aria-label={tr('「{name}」的方向', { name: name(l.key) })}>
                {(['asc', 'desc'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={l.dir === d}
                    className={cx(l.dir === d && 'is-on')}
                    onClick={() => onChange(levels.map((x, j) => (j === i ? { key: x.key, dir: d } : x)))}
                  >
                    {ARROW[d]} {dirWord(d)}
                  </button>
                ))}
              </span>
              <button
                type="button"
                className="ui-dt-sortrm"
                aria-label={tr('移除「{name}」排序', { name: name(l.key) })}
                onClick={() => onChange(levels.filter((_, j) => j !== i))}
              >
                <Icon name="x" size={16} />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="ui-dt-sortnone">{tr('照資料原本的順序。')}</p>
      )}
      {rest.length && levels.length < max ? (
        adding ? (
          // The columns not sorted yet, under a heading that says what picking one does.
          <div className="ui-dt-sortadd" role="group" aria-labelledby={addId}>
            <span id={addId} className="ui-dt-sortaddhead">
              {levels.length ? tr('再依哪一欄') : tr('依哪一欄排序')}
            </span>
            {rest.map((c, i) => (
              <button
                key={c.key}
                ref={i === 0 ? firstAdd : undefined}
                type="button"
                className="ui-dt-opt"
                onClick={() => {
                  onChange([...levels, { key: c.key, dir: first(c.key) }]);
                  setAdding(false);
                }}
              >
                <Icon name="plus" size={16} />
                {c.label}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="ui-link-btn ui-dt-sortmore" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} />
            {levels.length ? tr('再依…') : tr('排序依據…')}
          </button>
        )
      ) : levels.length >= max && rest.length ? (
        <p className="ui-dt-sortnone">{tr('最多 {n} 層排序。', { n: max })}</p>
      ) : null}
    </FloatingPanel>
  );
}
