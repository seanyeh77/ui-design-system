import * as React from 'react';
import { format } from '../../format';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { TOUCH_ONLY, cx, useMedia, useNarrow, resizeObserver } from '../../internal/util';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Tooltip } from '../Tooltip/Tooltip';
import { FloatingPanel } from '../../internal/FloatingPanel';
import { CheckMark } from '../../internal/Field';
import type { DataTableColumn, FilterValue, RangeValue, ResolvedFilter, Row } from './types';
import { includeIcons } from '../../icons/store';
import phArrowUUpLeft from '../../icons/ph/arrow-u-up-left';
import phCaretRight from '../../icons/ph/caret-right';
import phColumns from '../../icons/ph/columns';
import phCopy from '../../icons/ph/copy';
import phCornersOut from '../../icons/ph/corners-out';
import phDotsThree from '../../icons/ph/dots-three';
import phFunnel from '../../icons/ph/funnel';
import phX from '../../icons/ph/x';

includeIcons(phArrowUUpLeft, phCaretRight, phColumns, phCopy, phCornersOut, phDotsThree, phFunnel, phX);

/** Marks the first match of q in text. */
export function markMatch(text: React.ReactNode, q: string): React.ReactNode {
  if (!q || typeof text !== 'string') return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="ui-mark">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/** The toolbar's 「⋯」 (更多表格操作): the secondary tools in one menu. 「欄位」 opens a submenu of checkboxes (the first
 *  column cannot be hidden) with 「還原預設」 at its end; 「複製成 Markdown」 and 「放大表格」 follow. A tool that is off
 *  is left out; with none the button is not drawn. Keyboard: Base UI Menu (↑ ↓, → opens the submenu, Esc closes). */
export function MoreMenu<R extends Row>({
  columns,
  onCopy,
  onZoom,
}: {
  columns?: { cols: DataTableColumn<R>[]; hidden: Record<string, boolean>; onToggle: (key: string) => void; onReset: () => void };
  onCopy?: () => void;
  onZoom?: () => void;
}) {
  if (!columns && !onCopy && !onZoom) return null;
  const label = tr('更多表格操作');
  return (
    <BaseMenu.Root>
      <Tooltip label={label} describe={false}>
        <BaseMenu.Trigger className={cx('ui-iconbtn', 'is-quiet', 'ui-menu-trigger', 'ui-dt-menubtn')} aria-label={label}>
          <Icon name="dots-three" size={20} />
        </BaseMenu.Trigger>
      </Tooltip>
      <BaseMenu.Portal>
        <BaseMenu.Positioner className="ui-float" side="bottom" align="end" sideOffset={4}>
          <BaseMenu.Popup className="ui-menu ui-dt-moremenu">
            {columns ? (
              <BaseMenu.SubmenuRoot>
                <BaseMenu.SubmenuTrigger className="ui-menu-item">
                  <Icon name="columns" size={16} />
                  <span className="ui-menu-label">{tr('欄位')}</span>
                  <Icon name="caret-right" size={16} className="ui-dt-subcaret" />
                </BaseMenu.SubmenuTrigger>
                <BaseMenu.Portal>
                  <BaseMenu.Positioner className="ui-float" side="left" align="start" sideOffset={4} alignOffset={-6}>
                    <BaseMenu.Popup className="ui-menu ui-dt-colmenu" aria-label={tr('顯示的欄位')}>
                      <BaseMenu.Group>
                        <BaseMenu.GroupLabel className="ui-noti-group">{tr('顯示的欄位')}</BaseMenu.GroupLabel>
                        {columns.cols.map((c, i) => {
                          const on = i === 0 || !columns.hidden[c.key];
                          return (
                            <BaseMenu.CheckboxItem
                              key={c.key}
                              checked={on}
                              disabled={i === 0}
                              closeOnClick={false}
                              className="ui-menu-item"
                              onCheckedChange={() => columns.onToggle(c.key)}
                            >
                              <span className={cx('ui-check-box', on && 'is-on')} aria-hidden="true">
                                <CheckMark v={on} />
                              </span>
                              <span className="ui-menu-label">{c.label}</span>
                            </BaseMenu.CheckboxItem>
                          );
                        })}
                      </BaseMenu.Group>
                      <BaseMenu.Separator className="ui-menu-sep" />
                      <BaseMenu.Item className="ui-menu-item" closeOnClick={false} onClick={columns.onReset}>
                        <Icon name="arrow-u-up-left" size={16} />
                        <span className="ui-menu-label">{tr('還原預設')}</span>
                      </BaseMenu.Item>
                    </BaseMenu.Popup>
                  </BaseMenu.Positioner>
                </BaseMenu.Portal>
              </BaseMenu.SubmenuRoot>
            ) : null}
            {onCopy ? (
              <BaseMenu.Item className="ui-menu-item" onClick={onCopy}>
                <Icon name="copy" size={16} />
                <span className="ui-menu-label">{tr('複製成 Markdown')}</span>
              </BaseMenu.Item>
            ) : null}
            {onZoom ? (
              <BaseMenu.Item className="ui-menu-item" onClick={onZoom}>
                <Icon name="corners-out" size={16} />
                <span className="ui-menu-label">{tr('放大表格')}</span>
              </BaseMenu.Item>
            ) : null}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

/** One applied condition: 「狀態：失敗」, removed with its ×. */
export interface FilterChip {
  id: string;
  text: string;
  remove: () => void;
}

/** The applied conditions under the toolbar, each removable, and 「清除全部」; nothing when no condition is applied.
 *  Removing one moves focus to the next chip (or the previous, or 「篩選」 when none is left). */
export function FilterChips({ chips, onClear, filterButton }: { chips: FilterChip[]; onClear: () => void; filterButton: () => HTMLElement | null }) {
  const box = React.useRef<HTMLDivElement>(null);
  if (!chips.length) return null;
  const focusAfter = (i: number) =>
    requestAnimationFrame(() => {
      const left = box.current?.querySelectorAll<HTMLElement>('.ui-dt-chip');
      const next = left?.[Math.min(i, left.length - 1)];
      (next ?? filterButton())?.focus();
    });
  return (
    <div ref={box} className="ui-dt-chips" role="group" aria-label={tr('套用的篩選')}>
      {chips.map((c, i) => (
        <button
          key={c.id}
          type="button"
          className="ui-dt-chip"
          aria-label={tr('移除篩選：{name}', { name: c.text })}
          onClick={() => {
            c.remove();
            focusAfter(i);
          }}
        >
          <span className="ui-dt-chip-text">{c.text}</span>
          <Icon name="x" size={16} />
        </button>
      ))}
      <button
        type="button"
        className="ui-link-btn ui-dt-chipclear"
        onClick={() => {
          onClear();
          requestAnimationFrame(() => filterButton()?.focus());
        }}
      >
        {tr('清除全部')}
      </button>
    </div>
  );
}

interface FilterButtonProps<R extends Row> {
  filters: ResolvedFilter<R>[];
  values: Record<string, FilterValue>;
  activeCount: number;
  /** Rows left if this option alone changed. */
  count: (f: ResolvedFilter<R>, value: string) => number;
  onChange: (key: string, value: FilterValue) => void;
  onClear: () => void;
  /** The table: the panel stays over it. */
  boundary?: React.RefObject<Element | null>;
}

/** 「篩選」 with the number of active filters; options apply at once and show how many rows they would leave. */
export function FilterButton<R extends Row>({ filters, values, activeCount, count, onChange, onClear, boundary }: FilterButtonProps<R>) {
  const [open, setOpen] = React.useState(false);
  return (
    <FloatingPanel
      open={open}
      onOpenChange={setOpen}
      boundary={boundary}
      className="ui-dt-filterpop"
      aria-label={tr('篩選')}
      trigger={
        <button
          type="button"
          className={cx('ui-btn', 'ui-btn-secondary', 'ui-dt-filterbtn', open && 'is-open', activeCount > 0 && 'is-active')}
          aria-label={activeCount ? tr('篩選，已套用 {n} 個條件', { n: activeCount }) : undefined}
        >
          <Icon name="funnel" size={20} />
          <span className="ui-dt-btntext">{tr('篩選')}</span>
          {activeCount ? <span className="ui-pop-count">{activeCount}</span> : null}
        </button>
      }
    >
      <div className="ui-dt-filterhead">
        <span className="ui-popover-title">{tr('篩選')}</span>
        {activeCount ? (
          <button type="button" className="ui-link-btn" onClick={onClear}>
            {tr('清除全部')}
          </button>
        ) : null}
      </div>
      <div className="ui-dt-facets">
        {filters.map((f) => {
          const v = values[f.key];
          if (f.type === 'range') {
            const cur: RangeValue = v && !Array.isArray(v) ? v : { min: '', max: '' };
            const set = (k: keyof RangeValue) => (e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(f.key, { ...cur, [k]: e.target.value.replace(/[^\d.]/g, '') });
            return (
              <fieldset key={f.key} className="ui-dt-facet">
                <legend>{f.label}</legend>
                <div className="ui-dt-range-inputs">
                  <input
                    className="ui-input"
                    inputMode="decimal"
                    aria-label={`${f.label} ${tr('最低')}`}
                    placeholder={tr('最低')}
                    value={cur.min}
                    onChange={set('min')}
                  />
                  <span>–</span>
                  <input
                    className="ui-input"
                    inputMode="decimal"
                    aria-label={`${f.label} ${tr('最高')}`}
                    placeholder={tr('最高')}
                    value={cur.max}
                    onChange={set('max')}
                  />
                </div>
                {f.unitLabel ? <div className="ui-field-hint">{f.unitLabel}</div> : null}
              </fieldset>
            );
          }
          const arr = Array.isArray(v) ? v : [];
          return (
            <fieldset key={f.key} className="ui-dt-facet">
              <legend>{f.label}</legend>
              {f.options.map((o) => {
                const value = String(o.value);
                const on = arr.includes(value);
                const n = count(f, value);
                const next = f.multiple ? (on ? arr.filter((x) => x !== value) : [...arr, value]) : on ? [] : [value];
                return (
                  <button
                    key={o.value}
                    type="button"
                    role={f.multiple ? 'checkbox' : 'radio'}
                    aria-checked={on}
                    className={cx('ui-dt-opt', on && 'is-on', !n && !on && 'is-zero')}
                    onClick={() => onChange(f.key, next)}
                  >
                    <span className={cx(f.multiple ? 'ui-check-box' : 'ui-radio-ring', on && 'is-on')} aria-hidden="true">
                      {f.multiple ? <CheckMark v={on} /> : on ? <span className="ui-radio-dot" /> : null}
                    </span>
                    <span className="ui-dt-opt-label">{o.label}</span>
                    <span className="ui-dt-opt-n">{format.number(n)}</span>
                  </button>
                );
              })}
            </fieldset>
          );
        })}
      </div>
    </FloatingPanel>
  );
}

/** A short cell with its whole text in a Tooltip (a mouse; not on a touch screen, where the row's details show it). */
export function FullText({ text, children }: { text: string; children: React.ReactNode }) {
  const touch = useMedia(TOUCH_ONLY);
  // The span is the Tooltip's trigger for hover; focus on a link inside it bubbles up and opens it too. Screen readers
  // get the whole text from the cell's aria-description (DataTable), not from hidden text here.
  return (
    <Tooltip label={text} wrap describe={false} disabled={touch || !text}>
      <span className="ui-dt-full">{children}</span>
    </Tooltip>
  );
}

/** Long text in a cell. Phone cards: at most 2 lines with 「顯示全部」. Desktop: one line; the row's caret shows it in
 *  full below the row, and with a mouse, hover or focus on a cut-off cell shows it in a Tooltip. No Tooltip on a touch
 *  screen: a tap would leave it over the next rows. */
export function LongText({ children }: { children: React.ReactNode }) {
  const box = React.useRef<HTMLSpanElement>(null);
  const ref = React.useRef<HTMLSpanElement>(null);
  const narrow = useNarrow();
  const touch = useMedia(TOUCH_ONLY);
  const [open, setOpen] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const [cut, setCut] = React.useState('');
  React.useLayoutEffect(() => {
    const el = ref.current;
    const outer = box.current;
    if (!el || !outer || open) return;
    const check = () => {
      setOver(el.scrollHeight > el.clientHeight + 1);
      // Desktop: the outer span holds one line with an ellipsis.
      setCut(!narrow && !touch && outer.scrollWidth > outer.clientWidth + 1 ? (outer.textContent ?? '') : '');
    };
    check();
    const ro = resizeObserver(check);
    ro?.observe(outer);
    return () => ro?.disconnect();
  }, [open, children, narrow, touch]);
  const body = (
    <span ref={box} className={cx('ui-dt-long', !!cut && 'is-cut')} tabIndex={cut ? 0 : undefined}>
      <span ref={ref} className={cx('ui-dt-long-text', !open && 'is-clamped')}>
        {children}
      </span>
      {narrow && (over || open) ? (
        <button
          type="button"
          className="ui-dt-more"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          {open ? tr('清單::收合') : tr('顯示全部')}
        </button>
      ) : null}
    </span>
  );
  // Always mounted, turned on only when cut: swapping the wrapper would remount the cell and lose the measurement.
  return (
    <Tooltip label={cut} wrap disabled={!cut}>
      {body}
    </Tooltip>
  );
}
