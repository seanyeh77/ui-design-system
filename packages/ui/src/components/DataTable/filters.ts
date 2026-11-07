import { format } from '../../format';
import type { DataTableColumn, DataTableFilter, FilterValue, RangeValue, ResolvedFilter, Row } from './types';

/* Search, filters and the URL for DataTable. Filters apply at once; every option shows how many rows it would leave;
   search covers every column and marks the matching text; the conditions go into the URL. */

const field = <R extends Row>(row: R, key: string): unknown => (row as Record<string, unknown>)[key];

/** Cell text: money as NT$ 1,280, dates as 2026/11/04（三）, numbers with their unit after them. */
export function cellText<R extends Row>(c: DataTableColumn<R>, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  const asDate = () => (v instanceof Date ? v : new Date(v as string | number));
  if (c.format === 'money') return format.money(Number(v), { currency: c.currency });
  if (c.format === 'date') return format.date(asDate());
  if (c.format === 'datetime') return format.dateTime(asDate());
  if (c.format === 'relative') return format.relative(asDate());
  // percent fixes the decimals only; the % comes from unit, as in KpiCard.
  const n =
    c.format === 'percent'
      ? format.number(Number(v), c.decimals ?? 'percent')
      : c.numeric && typeof v === 'number'
        ? format.number(v, c.decimals ?? (c.unit === 'GB' || c.unit === 'MB' ? 'size' : 0))
        : String(v);
  return c.unit ? `${n} ${c.unit}` : n;
}

/** The filters with defaults: list type, multiple, and options from the rows' distinct values. */
export function resolveFilters<R extends Row>(filters: DataTableFilter<R>[], rows: R[]): ResolvedFilter<R>[] {
  return filters.map((f) => {
    let options = f.options;
    if ((f.type ?? 'list') === 'list' && !options) {
      const seen = new Set<string>();
      options = [];
      for (const r of rows) {
        const v = field(r, f.key);
        if (v != null && !seen.has(String(v))) {
          seen.add(String(v));
          options.push({ value: String(v), label: String(v) });
        }
      }
    }
    return { ...f, type: f.type ?? 'list', multiple: f.multiple ?? true, options: options ?? [] };
  });
}

const isRange = (v: FilterValue): v is RangeValue => !Array.isArray(v);

export function isActive(v: FilterValue | undefined): boolean {
  if (!v) return false;
  return isRange(v) ? (v.min !== '' && v.min != null) || (v.max !== '' && v.max != null) : v.length > 0;
}

export function matches<R extends Row>(f: ResolvedFilter<R>, row: R, v: FilterValue | undefined): boolean {
  if (!v || !isActive(v)) return true;
  if (f.match) return f.match(row, v);
  const x = field(row, f.key);
  if (isRange(v)) {
    const k = f.scale || 1;
    const mn = parseFloat(v.min);
    const mx = parseFloat(v.max);
    const n = Number(x);
    return !(!Number.isNaN(mn) && n < mn * k) && !(!Number.isNaN(mx) && n > mx * k);
  }
  return v.includes(String(x));
}

export function searchHit<R extends Row>(row: R, cols: DataTableColumn<R>[], filters: ResolvedFilter<R>[], q: string, keys?: string[]): boolean {
  const ql = q.toLowerCase();
  return cols.some((c) => {
    if (keys && !keys.includes(c.key)) return false;
    const raw = field(row, c.key);
    let t = c.searchText ? c.searchText(row) : c.render ? '' : cellText(c, raw);
    const opt = filters.find((x) => x.key === c.key)?.options.find((o) => o.value === String(raw));
    if (opt) t += ' ' + opt.label;
    if (!t && c.render) t = raw == null ? '' : String(raw);
    return t.toLowerCase().includes(ql);
  });
}

const param = (prefix: string | undefined, key: string) => (prefix ? prefix + '.' : '') + key;

/** Filter values from the URL (?status=a,b&size_min=10). */
export function readUrl<R extends Row>(prefix: string | undefined, filters: ResolvedFilter<R>[]): { q: string; values: Record<string, FilterValue> } {
  const values: Record<string, FilterValue> = {};
  const sp = new URLSearchParams(location.search);
  for (const f of filters) {
    if (f.type === 'range') {
      const a = sp.get(param(prefix, f.key + '_min'));
      const b = sp.get(param(prefix, f.key + '_max'));
      if (a || b) values[f.key] = { min: a || '', max: b || '' };
    } else {
      const v = sp.get(param(prefix, f.key));
      if (v) values[f.key] = v.split(',');
    }
  }
  return { q: sp.get(param(prefix, 'q')) || '', values };
}

/** Writes search and filters into the URL without adding a history entry. */
export function writeUrl<R extends Row>(prefix: string | undefined, filters: ResolvedFilter<R>[], values: Record<string, FilterValue>, q: string): void {
  const sp = new URLSearchParams(location.search);
  const set = (k: string, v: string | undefined) => (v ? sp.set(param(prefix, k), v) : sp.delete(param(prefix, k)));
  set('q', q);
  for (const f of filters) {
    const v = values[f.key];
    if (f.type === 'range') {
      set(f.key + '_min', v && isRange(v) ? v.min : undefined);
      set(f.key + '_max', v && isRange(v) ? v.max : undefined);
    } else set(f.key, v && !isRange(v) && v.length ? v.join(',') : undefined);
  }
  const s = sp.toString();
  history.replaceState(history.state, '', location.pathname + (s ? '?' + s : '') + location.hash);
}
