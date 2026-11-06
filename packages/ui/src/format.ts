import { I18N, isZhTW } from './i18n';

/* Dates and numbers for the current locale (setLocale). zh-TW follows the design system's rules
   (2026/11/04（三）, 24-hour clock, NT$ 1,280, 萬 and 億 in KPI cards); other locales use Intl's conventions. */

export type Decimals = number | 'money' | 'percent' | 'size' | 'count';

const DECIMALS = { money: 0, percent: 1, size: 1, count: 0 } as const;

export const pad2 = (n: number): string => String(n).padStart(2, '0');

function locale(): string {
  return I18N.locale;
}

/** zh-TW: 2026/11/04（三）. Other locales: their short date with weekday. */
function date(d: Date | null | undefined, o: { weekday?: boolean; long?: boolean } = {}): string {
  if (!d) return '';
  const wd = o.weekday !== false;
  if (o.long) return new Intl.DateTimeFormat(I18N.locale, { year: 'numeric', month: 'long', day: 'numeric', weekday: wd ? 'long' : undefined }).format(d);
  if (isZhTW())
    return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}${wd ? `（${new Intl.DateTimeFormat('zh-TW', { weekday: 'narrow' }).format(d)}）` : ''}`;
  return new Intl.DateTimeFormat(I18N.locale, { year: 'numeric', month: '2-digit', day: '2-digit', weekday: wd ? 'short' : undefined }).format(d);
}

/** zh-TW: 24-hour 15:57. Other locales: their own clock. */
function time(d: Date | null | undefined): string {
  if (!d) return '';
  return new Intl.DateTimeFormat(
    I18N.locale,
    isZhTW() ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : { hour: 'numeric', minute: '2-digit' },
  ).format(d);
}

function dateTime(d: Date | null | undefined, o?: { weekday?: boolean }): string {
  return d ? `${date(d, o)} ${time(d)}` : '';
}

/** Within 7 days: 「2 小時前」、「昨天」. Older: full date and time. Pass now to test. */
function relative(d: Date | null | undefined, now: Date = new Date()): string {
  if (!d) return '';
  const s = (now.getTime() - d.getTime()) / 1000;
  if (s < 0 || s >= 604800) return dateTime(d);
  const rt = new Intl.RelativeTimeFormat(I18N.locale, { numeric: 'auto' });
  if (s < 60) return rt.format(0, 'second');
  if (s < 3600) return rt.format(-Math.floor(s / 60), 'minute');
  if (s < 86400) return rt.format(-Math.floor(s / 3600), 'hour');
  return rt.format(-Math.floor(s / 86400), 'day');
}

function month(d: Date): string {
  return new Intl.DateTimeFormat(I18N.locale, { year: 'numeric', month: 'long' }).format(d);
}

/** Week starts on Sunday for zh-TW; other locales use Intl's week info when the browser has it. */
function firstDay(): number {
  if (isZhTW()) return 0;
  try {
    const l = new Intl.Locale(I18N.locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
    const w = l.getWeekInfo ? l.getWeekInfo() : l.weekInfo;
    if (w?.firstDay) return w.firstDay % 7;
  } catch {
    /* older browsers have no week info */
  }
  return 0;
}

/** Narrow weekday names, starting from firstDay(). */
function weekdays(): string[] {
  const fd = firstDay();
  const f = new Intl.DateTimeFormat(I18N.locale, { weekday: 'narrow' });
  // 2026/11/01 is a Sunday.
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(2026, 10, 1 + ((fd + i) % 7))));
}

/** Decimals by unit: money 0, percent 1, size 1, count 0; pass a number to force it. */
function number(v: number, dec?: Decimals): string {
  const dd = typeof dec === 'number' ? dec : dec ? DECIMALS[dec] : 0;
  return new Intl.NumberFormat(I18N.locale, { minimumFractionDigits: dd, maximumFractionDigits: dd }).format(v);
}

function percent(v: number, dec = 1): string {
  return new Intl.NumberFormat(I18N.locale, { style: 'percent', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v / 100);
}

/** Only KPI cards abbreviate: 1,284 萬 in zh-TW (萬、億), 12.8M in English.
 *  like: format v with the unit and decimals that `like` gets, so a counting KPI keeps its width. */
function compact(v: number, like?: number): string {
  const ref = like ?? v;
  if (Math.abs(ref) < 1e4) return number(v);
  if (/^zh/i.test(I18N.locale)) {
    const a = Math.abs(ref);
    const [unit, div, maxDec] = a >= 1e8 ? (['億', 1e8, 2] as const) : (['萬', 1e4, 1] as const);
    const finalStr = new Intl.NumberFormat(I18N.locale, { maximumFractionDigits: maxDec }).format(a / div);
    const sign = v < 0 ? '-' : '';
    if (like === undefined) return `${sign}${finalStr} ${unit}`;
    const digits = (finalStr.split('.')[1] || '').length;
    return `${sign}${new Intl.NumberFormat(I18N.locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(v) / div)} ${unit}`;
  }
  const nf = new Intl.NumberFormat(I18N.locale, { notation: 'compact', maximumFractionDigits: 1 });
  if (like === undefined) return nf.format(v);
  const parts = nf.formatToParts(ref);
  let num = '';
  let dec = '';
  for (const pt of parts) {
    if (pt.type === 'integer') num += pt.value;
    if (pt.type === 'fraction') {
      num += '.' + pt.value;
      dec = pt.value;
    }
  }
  const mant = parseFloat(num) || 1;
  const scale = 10 ** Math.round(Math.log10(Math.abs(ref) / mant));
  const inner = new Intl.NumberFormat(I18N.locale, { minimumFractionDigits: dec.length, maximumFractionDigits: dec.length }).format(Math.abs(v) / scale);
  let done = false;
  const body = parts
    .map((pt) => {
      if (pt.type === 'integer' || pt.type === 'group' || pt.type === 'decimal' || pt.type === 'fraction') {
        if (done) return '';
        done = true;
        return inner;
      }
      return pt.value;
    })
    .join('');
  return (v < 0 && ref >= 0 ? '-' : '') + body;
}

/** zh-TW with TWD: NT$ 1,280, negatives -NT$ 1,280. Other locales and currencies: Intl's own symbol and order. */
function money(v: number, o: { currency?: string; compact?: boolean; like?: number } = {}): string {
  const cur = o.currency || I18N.currency;
  const body = o.compact ? compact(Math.abs(v), o.like !== undefined ? Math.abs(o.like) : undefined) : number(Math.abs(v), 'money');
  if (isZhTW() && cur === 'TWD') return `${v < 0 ? '-' : ''}NT$ ${body}`;
  if (o.compact) return `${v < 0 ? '-' : ''}${body} ${cur}`;
  return new Intl.NumberFormat(I18N.locale, {
    style: 'currency',
    currency: cur,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: cur === 'TWD' || cur === 'JPY' ? 0 : 2,
  }).format(v);
}

/** Bytes to 「186 KB」「54.9 MB」「1.2 GB」. */
export function fileSize(b: number | null | undefined): string {
  if (b == null || Number.isNaN(b)) return '';
  if (b < 1048576) return number(Math.max(1, Math.round(b / 1024))) + ' KB';
  if (b < 1073741824) return number(b / 1048576, 1) + ' MB';
  return number(b / 1073741824, 1) + ' GB';
}

/** Shortens a path: keeps the first segment and the last two, 「src/…/hooks/ops.c:58」. */
function path(p: string | null | undefined, o: { head?: number; tail?: number } = {}): string {
  const head = o.head ?? 1;
  const tail = o.tail ?? 2;
  const parts = String(p ?? '').split('/');
  return parts.length > head + tail ? `${parts.slice(0, head).join('/')}/…/${parts.slice(-tail).join('/')}` : String(p ?? '');
}

/** Every date, number, amount, size and path shown in the UI goes through these. */
export const format = { locale, date, time, dateTime, relative, month, weekdays, firstDay, number, percent, compact, money, fileSize, path };

/* Calendar helpers (local dates, no time). */
export const fmtDate = (d: Date | null | undefined): string => (d ? `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}` : '');

export function parseDate(s: string | null | undefined): Date | null {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(s || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getMonth() === +m[2] - 1 ? d : null;
}

export const sameDay = (a: Date | null | undefined, b: Date | null | undefined): boolean =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const dayAdd = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
