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
