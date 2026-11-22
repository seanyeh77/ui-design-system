import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingBar, ProgressBar, ProgressRing, Skeleton } from '../../index';

test('ProgressBar: a named progressbar from 0 to 100; out-of-range values are clamped', () => {
  const { rerender } = render(<ProgressBar value={42.4} label="上傳" />);
  const bar = screen.getByRole('progressbar', { name: '上傳' });
  expect(bar.getAttribute('aria-valuenow')).toBe('42');
  expect(bar.getAttribute('aria-valuemin')).toBe('0');
  expect(bar.getAttribute('aria-valuemax')).toBe('100');
  expect(screen.getByText('42%')).toBeTruthy();
  rerender(<ProgressBar value={-5} aria-label="a.pdf 上傳進度" />);
  expect(screen.getByRole('progressbar', { name: 'a.pdf 上傳進度' }).getAttribute('aria-valuenow')).toBe('0');
  rerender(<ProgressBar value={140} label="上傳" />);
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
  expect(screen.getByText('完成 ✓')).toBeTruthy();
  rerender(<ProgressBar value={Number.NaN} label="上傳" />);
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
});

test('ProgressRing: a named progressbar with the value', () => {
  render(<ProgressRing value={73} label="磁碟使用率" />);
  const ring = screen.getByRole('progressbar', { name: '磁碟使用率' });
  expect(ring.getAttribute('aria-valuenow')).toBe('73');
  expect(ring.getAttribute('aria-valuemax')).toBe('100');
});

test('LoadingBar: a busy progressbar with no value, named 載入中 by default', () => {
  const { rerender } = render(<LoadingBar />);
  const bar = screen.getByRole('progressbar', { name: '載入中' });
  expect(bar.getAttribute('aria-valuenow')).toBeNull();
  expect(bar.getAttribute('aria-busy')).toBe('true');
  rerender(<LoadingBar label="讀取報表" />);
  expect(screen.getByRole('progressbar', { name: '讀取報表' })).toBeTruthy();
});

test('Skeleton: hidden from screen readers, one text line tall by default', () => {
  const { container } = render(<Skeleton />);
  const sk = container.querySelector('.ui-skel') as HTMLElement;
  expect(sk.getAttribute('aria-hidden')).toBe('true');
  expect(sk.style.height).toBe('16px');
  expect(sk.style.width).toBe('100%');
});

test('ProgressBar in a table row: the done fill reaches 3:1 on a selected row for every theme and swatch', async () => {
  const { ACCENT_SWATCHES, DEFAULT_ACCENT, setAccent, setTheme } = await import('../../theme');
  const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const lum = (c: string) =>
    rgb(c)
      .map((v) => v / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const { container } = render(
    <div className="ui-dt-row is-selected" style={{ background: 'var(--accent-soft)' }}>
      <ProgressBar value={100} aria-label="匯入進度" />
    </div>,
  );
  const row = container.firstElementChild as HTMLElement;
  const fill = container.querySelector('.ui-progress-fill') as HTMLElement;
  const root = document.documentElement;
  // Read the end colors, not a step of the theme fade or the fill's color transition.
  const still = document.createElement('style');
  still.textContent = '*, *::before, *::after { transition: none !important; }';
  document.head.append(still);
  const fails: string[] = [];
  try {
    for (const theme of ['light', 'dark', 'teaching'] as const) {
      for (const [name, hex] of ACCENT_SWATCHES) {
        if (theme === 'teaching') root.setAttribute('data-theme', 'teaching');
        else setTheme(theme);
        setAccent(hex, true);
        const f = getComputedStyle(fill).backgroundColor;
        const g = getComputedStyle(row).backgroundColor;
        const r = contrast(f, g);
        if (r < 3) fails.push(`${theme} ${name}: fill ${f} on ${g}: ${r.toFixed(2)}:1`);
      }
    }
  } finally {
    still.remove();
    root.removeAttribute('data-theme');
    setTheme('light');
    setAccent(DEFAULT_ACCENT, true);
  }
  expect(fails).toEqual([]);
});
