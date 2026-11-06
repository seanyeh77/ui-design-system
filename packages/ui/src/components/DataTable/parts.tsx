import * as React from 'react';
import { format } from '../../format';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FloatingPanel } from '../../internal/FloatingPanel';
import type { DataTableColumn, FilterValue, RangeValue, ResolvedFilter, Row } from './types';

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

/** 「欄位」: hide and show columns. The first column cannot be hidden; the menu stays open while toggling. */
export function ColumnMenu<R extends Row>({
  cols,
  hidden,
  onToggle,
}: {
  cols: DataTableColumn<R>[];
  hidden: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <FloatingPanel
      open={open}
      onOpenChange={setOpen}
      align="end"
      className="ui-menu ui-dt-colmenu"
      aria-label={tr('顯示的欄位')}
      trigger={
        <button type="button" className={cx('ui-btn', 'ui-btn-secondary', 'ui-dt-colbtn', open && 'is-open')}>
          <Icon name="columns" size={18} />
          {tr('欄位')}
        </button>
      }
    >
      <div className="ui-noti-group">{tr('顯示的欄位')}</div>
      {cols.map((c, i) => {
        const on = i === 0 || !hidden[c.key];
        return (
          <button key={c.key} type="button" role="checkbox" aria-checked={on} disabled={i === 0} className="ui-menu-item" onClick={() => onToggle(c.key)}>
            <span className={cx('ui-check-box', on && 'is-on')} aria-hidden="true">
              {on ? <Icon name="check" size={14} /> : null}
            </span>
            <span className="ui-menu-label">{c.label}</span>
          </button>
        );
      })}
    </FloatingPanel>
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
}

/** 「篩選」 with the number of active filters; options apply at once and show how many rows they would leave. */
export function FilterButton<R extends Row>({ filters, values, activeCount, count, onChange, onClear }: FilterButtonProps<R>) {
  const [open, setOpen] = React.useState(false);
  return (
    <FloatingPanel
      open={open}
      onOpenChange={setOpen}
      className="ui-dt-filterpop"
      aria-label={tr('篩選')}
      trigger={
        <button type="button" className={cx('ui-btn', 'ui-btn-secondary', 'ui-dt-filterbtn', open && 'is-open')}>
          <Icon name="funnel" size={18} />
          {tr('篩選')}
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
                      {on ? f.multiple ? <Icon name="check" size={14} /> : <span className="ui-radio-dot" /> : null}
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

/** Long text in a cell: on phone cards at most 2 lines with 「顯示全部」. */
export function LongText({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [open, setOpen] = React.useState(false);
  const [over, setOver] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const check = () => setOver(el.scrollHeight > el.clientHeight + 1);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [open, children]);
  return (
    <span className="ui-dt-long">
      <span ref={ref} className={cx('ui-dt-long-text', !open && 'is-clamped')}>
        {children}
      </span>
      {over || open ? (
        <button
          type="button"
          className="ui-dt-more"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          {open ? tr('收合') : tr('顯示全部')}
        </button>
      ) : null}
    </span>
  );
}
