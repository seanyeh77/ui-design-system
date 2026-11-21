import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as React from 'react';
import { ZoneMap, type Zone } from '../../index';

const ZONES: Zone[] = [
  { id: 'a', name: 'A 區', value: 20.5, unit: '°C', detail: '進氣 21.8 °C' },
  { id: 'b', name: 'B 區', value: 28.4, unit: '°C', tone: 'warning', state: '注意', detail: '進氣 26.1 °C' },
  { id: 'd', name: 'D 區', value: 25.8, unit: '°C', forecast: true },
  { id: 'h', name: 'H 區', value: null },
];

function Map() {
  const [sel, setSel] = React.useState<string | null>(null);
  return <ZoneMap label="機房分區" zones={ZONES} selectedId={sel} onSelect={(z) => setSel(z.id)} />;
}

test('zones are buttons named with their figure and state; Tab then Enter or Space selects', async () => {
  const { container } = render(<Map />);
  expect(screen.getAllByRole('button').length).toBe(3);
  const b = screen.getByRole('button', { name: 'B 區，28.4 °C，注意，進氣 26.1 °C' });
  expect(b.querySelector('.ui-zone-state')?.textContent).toBe('⚠ 注意');
  expect(b.classList.contains('is-warning')).toBe(true);
  expect(screen.getByRole('button', { name: /D 區/ }).classList.contains('ui-forecast')).toBe(true);
  expect(container.querySelector('.ui-zone.is-empty')?.textContent).toContain('沒有資料');
  const user = userEvent.setup();
  await user.tab();
  await user.tab();
  expect(document.activeElement).toBe(b);
  await user.keyboard('{Enter}');
  expect(b.getAttribute('aria-pressed')).toBe('true');
  await user.tab();
  await user.keyboard(' ');
  expect(screen.getByRole('button', { name: /D 區/ }).getAttribute('aria-pressed')).toBe('true');
  expect(b.getAttribute('aria-pressed')).toBe('false');
});

test('fill follows the value on the heat scale, and its text reaches 4.5:1 in both themes', () => {
  render(<ZoneMap label="機房分區" zones={ZONES} />);
  const a = screen.getByRole('button', { name: /A 區/ });
  expect(a.dataset.fill).toBe('heat-1');
  for (const theme of ['light', 'dark']) {
    document.documentElement.setAttribute('data-theme', theme);
    const s = getComputedStyle(a);
    const rgb = (c: string) => (c.match(/\d+/g) ?? []).slice(0, 3).map(Number);
    const lum = (c: number[]) =>
      c
        .map((v) => v / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0);
    const [x, y] = [lum(rgb(s.color)), lum(rgb(s.backgroundColor))];
    expect((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05), theme).toBeGreaterThanOrEqual(4.5);
  }
  document.documentElement.removeAttribute('data-theme');
});

test('fill: rows share the height the map is given, never below rowHeight', async () => {
  const zones = [
    { id: 'a', name: 'A 區', value: 23 },
    { id: 'b', name: 'B 區', value: 24 },
  ];
  const { container } = render(
    <div style={{ display: 'flex', flexDirection: 'column', height: 600, width: 800 }}>
      <ZoneMap label="機房分區" zones={zones} columns={1} fill />
    </div>,
  );
  const zone = container.querySelector('.ui-zone') as HTMLElement;
  await expect.poll(() => zone.getBoundingClientRect().height).toBeGreaterThan(250);
});
