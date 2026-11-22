import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Badge, type BadgeStatus } from '../../index';

const NAMES: [BadgeStatus, string][] = [
  ['draft', '草稿'],
  ['doing', '進行中'],
  ['review', '審核中'],
  ['done', '完成'],
  ['fail', '失敗'],
];

test('Badge: every status says its name in text; the mark is hidden and its shape differs per status', () => {
  const shapes = new Set<string>();
  for (const [status, name] of NAMES) {
    const { container, unmount } = render(<Badge status={status} />);
    const badge = container.querySelector('.ui-badge') as HTMLElement;
    expect(badge.textContent).toBe(name);
    const mark = badge.querySelector('svg') as SVGElement;
    expect(mark.getAttribute('aria-hidden')).toBe('true');
    shapes.add(mark.querySelector('path')?.getAttribute('d') ?? 'ring');
    unmount();
  }
  // draft is a ring, doing a half, review a quarter, done and fail full: four shapes at least, not color alone.
  expect(shapes.size).toBeGreaterThanOrEqual(4);
});

test('Badge: children replace the name; the dot variant keeps the text', () => {
  const { container } = render(
    <>
      <Badge status="fail">建置失敗</Badge>
      <Badge status="done" variant="dot" />
    </>,
  );
  const [a, b] = Array.from(container.querySelectorAll('.ui-badge'));
  expect(a.textContent).toBe('建置失敗');
  expect(b.classList.contains('is-dot')).toBe(true);
  expect(b.textContent).toBe('完成');
});

test('Badge: an unknown status from data falls back to 草稿 instead of crashing', () => {
  const { container } = render(<Badge status={'archived' as BadgeStatus} />);
  expect(container.textContent).toBe('草稿');
});
