import { afterEach, expect, test } from 'vitest';
import { format, setLocale } from '../../index';

afterEach(() => setLocale('zh-TW', { currency: 'TWD' }));

const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);

test('format.date: 2026/11/04（三）, the year always shown; weekday: false drops the weekday', () => {
  expect(format.date(at(2026, 11, 4))).toBe('2026/11/04（三）');
  expect(format.date(at(2027, 1, 3))).toBe('2027/01/03（日）');
  expect(format.date(at(2026, 11, 4), { weekday: false })).toBe('2026/11/04');
  expect(format.date(null)).toBe('');
});

test('format.time and dateTime: 24-hour clock', () => {
  expect(format.time(at(2026, 11, 4, 15, 57))).toBe('15:57');
  expect(format.time(at(2026, 11, 4, 0, 5))).toBe('00:05');
  expect(format.dateTime(at(2026, 11, 4, 9, 3))).toBe('2026/11/04（三）09:03');
});

test('format.relative: within a week 「2 小時前」「昨天」「3 天前」; a week or more, or the future, the full date', () => {
  const now = at(2026, 11, 23, 12, 0);
  const ago = (s: number) => new Date(now.getTime() - s * 1000);
  expect(format.relative(ago(5), now)).toBe('現在');
  expect(format.relative(ago(5 * 60), now)).toBe('5 分鐘前');
  expect(format.relative(ago(2 * 3600), now)).toBe('2 小時前');
  expect(format.relative(ago(26 * 3600), now)).toBe('昨天');
  expect(format.relative(ago(3 * 86400), now)).toBe('3 天前');
  expect(format.relative(ago(6 * 86400 + 3600), now)).toBe('6 天前');
  expect(format.relative(ago(7 * 86400), now)).toBe('2026/11/16（一）12:00');
  expect(format.relative(new Date(now.getTime() + 3600 * 1000), now)).toBe('2026/11/23（一）13:00');
});

test('format.relative: across midnight it counts calendar days, not 24-hour spans', () => {
  // Shortly after midnight: 22:00 the evening before is 「昨天」, not 「3 小時前」; under an hour stays in minutes.
  const early = at(2026, 11, 18, 1, 0);
  expect(format.relative(at(2026, 11, 17, 22, 0), early)).toBe('昨天');
  expect(format.relative(at(2026, 11, 17, 0, 30), early)).toBe('昨天');
  expect(format.relative(at(2026, 11, 18, 0, 30), early)).toBe('30 分鐘前');
  expect(format.relative(at(2026, 11, 17, 23, 30), early)).toBe('昨天');
  // Late in the day: 01:00 the same day is 22 hours ago, the morning before is 「昨天」 though under 48 hours.
  const late = at(2026, 11, 18, 23, 0);
  expect(format.relative(at(2026, 11, 18, 1, 0), late)).toBe('22 小時前');
  expect(format.relative(at(2026, 11, 17, 1, 0), late)).toBe('昨天');
  expect(format.relative(at(2026, 11, 16, 23, 59), late)).toBe('前天');
  // Seven calendar days back, even under 7 × 24 hours: the full date.
  expect(format.relative(at(2026, 11, 11, 23, 59), at(2026, 11, 18, 0, 30))).toBe('2026/11/11（三）23:59');
  expect(format.relative(at(2026, 11, 12, 0, 0), at(2026, 11, 18, 23, 0))).toBe('6 天前');
});

test('format.money: NT$ 1,280 with a space, minus before NT$, no decimals', () => {
  expect(format.money(1280)).toBe('NT$ 1,280');
  expect(format.money(-1280)).toBe('-NT$ 1,280');
  expect(format.money(1280.6)).toBe('NT$ 1,281');
  expect(format.money(0)).toBe('NT$ 0');
  expect(format.money(12_840_000, { compact: true })).toBe('NT$ 1,284 萬');
});

test('format.number: decimals by unit (money 0, percent 1, size 1, count 0)', () => {
  expect(format.number(1234.56, 'money')).toBe('1,235');
  expect(format.number(12.345, 'percent')).toBe('12.3');
  expect(format.number(54.92, 'size')).toBe('54.9');
  expect(format.number(3, 'count')).toBe('3');
  expect(format.number(-5)).toBe('-5');
  expect(format.percent(12.345)).toBe('12.3%');
});

test('format.fileSize: whole KB under 1 MB, one decimal in MB and GB', () => {
  expect(format.fileSize(186 * 1024)).toBe('186 KB');
  expect(format.fileSize(Math.round(54.9 * 1048576))).toBe('54.9 MB');
  expect(format.fileSize(1.2 * 1073741824)).toBe('1.2 GB');
  expect(format.fileSize(1048576)).toBe('1.0 MB');
  expect(format.fileSize(null)).toBe('');
  expect(format.fileSize(Number.NaN)).toBe('');
});

test('format.fileSize: a size that rounds to 1,024 KB or 1,024.0 MB moves up a unit', () => {
  expect(format.fileSize(1047551)).toBe('1,023 KB');
  expect(format.fileSize(1048500)).toBe('1.0 MB');
  expect(format.fileSize(1073741823)).toBe('1.0 GB');
});

test('format.compact: KPI abbreviations 萬 and 億; under 10,000 the full number', () => {
  expect(format.compact(9999)).toBe('9,999');
  expect(format.compact(12_840_000)).toBe('1,284 萬');
  expect(format.compact(12_345)).toBe('1.2 萬');
  expect(format.compact(123_456_789)).toBe('1.23 億');
  expect(format.compact(-12_840_000)).toBe('-1,284 萬');
  // like keeps the decimals of the final value while counting up.
  expect(format.compact(10_000, 12_345)).toBe('1.0 萬');
});

test('format.compact: a value that rounds to 10,000 萬 is written 1 億', () => {
  expect(format.compact(99_999_999)).toBe('1 億');
  expect(format.compact(99_940_000)).toBe('9,994 萬');
});

test('format.path keeps the first segment and the last two', () => {
  expect(format.path('src/core/runtime/hooks/ops.c:58')).toBe('src/…/hooks/ops.c:58');
  expect(format.path('src/ops.c')).toBe('src/ops.c');
  expect(format.path(null)).toBe('');
});

test('other locales use their own conventions through Intl; the currency follows the data', () => {
  setLocale('en-US', { currency: 'USD' });
  expect(format.date(at(2026, 11, 4))).toBe('Wed, 11/04/2026');
  expect(format.time(at(2026, 11, 4, 15, 57))).toBe('3:57 PM');
  expect(format.compact(12_840_000)).toBe('12.8M');
  expect(format.money(486_000)).toBe('$486,000');
  expect(format.money(486_000, { currency: 'TWD' })).toBe('NT$486,000');
  expect(format.firstDay()).toBe(0);
  setLocale('de-DE');
  expect(format.number(3480.3, 1)).toBe('3.480,3');
  expect(format.firstDay()).toBe(1);
});

test('format.weekdays: zh-TW starts on Sunday', () => {
  expect(format.weekdays()).toEqual(['日', '一', '二', '三', '四', '五', '六']);
});

test('format.duration: m:ss under an hour (minutes not padded), h:mm:ss from an hour; negative or NaN is 「—」', () => {
  expect(format.duration(2802)).toBe('46:42');
  expect(format.duration(90)).toBe('1:30');
  expect(format.duration(5)).toBe('0:05');
  expect(format.duration(0)).toBe('0:00');
  expect(format.duration(3599.4)).toBe('59:59');
  expect(format.duration(3600)).toBe('1:00:00');
  expect(format.duration(6889)).toBe('1:54:49');
  expect(format.duration(36000 + 61)).toBe('10:01:01');
  expect(format.duration(-1)).toBe('—');
  expect(format.duration(Number.NaN)).toBe('—');
  expect(format.duration(null)).toBe('—');
  expect(format.duration(Number.POSITIVE_INFINITY)).toBe('—');
});
