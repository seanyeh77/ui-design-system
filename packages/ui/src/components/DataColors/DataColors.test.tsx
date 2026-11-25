import { afterEach, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tag, divergeToken, heatToken, textOn } from '../../index';

const TOKENS = [
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => 'heat-' + n),
  'diverge-neg-strong',
  'diverge-neg',
  'diverge-zero',
  'diverge-pos',
  'diverge-pos-strong',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
];
const rgb = (c: string) => {
  const m = /#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(c.trim());
  return m ? m.slice(1).map((x) => parseInt(x, 16)) : [0, 0, 0];
};
const lum = (c: string) =>
  rgb(c)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a: string, b: string) => {
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

afterEach(() => document.documentElement.removeAttribute('data-theme'));

test.each(['light', 'dark'])('every data color reaches 4.5:1 with the text textOn() picks (%s)', (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  for (const t of TOKENS) {
    const fill = getComputedStyle(document.documentElement).getPropertyValue('--' + t);
    expect(ratio(fill, textOn(t)), t).toBeGreaterThanOrEqual(4.5);
  }
});

test('heatToken and divergeToken map values to steps', () => {
  expect(heatToken(20, 20, 30)).toBe('heat-1');
  expect(heatToken(25, 20, 30)).toBe('heat-4');
  expect(heatToken(40, 20, 30)).toBe('heat-7');
  expect(heatToken(10, 20, 30)).toBe('heat-1');
  expect(divergeToken(0.1, { zero: 0.2, strong: 1.5 })).toBe('diverge-zero');
  expect(divergeToken(-0.5, { zero: 0.2, strong: 1.5 })).toBe('diverge-neg');
  expect(divergeToken(2, { zero: 0.2, strong: 1.5 })).toBe('diverge-pos-strong');
  expect(textOn('#ffffff')).toBe('#171512');
  expect(textOn('#000000')).toBe('#ffffff');
});

test('Tag forecast and demo read on the page in both themes', () => {
  render(
    <p>
      <Tag icon="trend-up" tone="info">
        預測
      </Tag>
      <Tag icon="info">示範資料</Tag>
    </p>,
  );
  const hex = (c: string) =>
    '#' +
    (c.match(/\d+/g) ?? [])
      .slice(0, 3)
      .map((x) => Number(x).toString(16).padStart(2, '0'))
      .join('');
  for (const theme of ['light', 'dark']) {
    document.documentElement.setAttribute('data-theme', theme);
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    for (const name of ['預測', '示範資料']) {
      const el = screen.getByText(name);
      expect(el.querySelector('svg'), name).not.toBeNull();
      expect(getComputedStyle(el).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(ratio(hex(getComputedStyle(el).color), bg), name + ' ' + theme).toBeGreaterThanOrEqual(4.5);
    }
  }
});
