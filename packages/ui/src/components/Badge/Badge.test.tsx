import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from '@testing-library/react';
import { Badge, Card, type BadgeStatus } from '../../index';

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

test('Badge: inside a Card it is the dot form at every width; only fail, review and doing color their text', async () => {
  const { container } = render(
    <>
      <Badge status="done" />
      <Card title="部署">
        <Badge status="done" />
        <Badge status="draft" />
        <Badge status="fail" />
      </Card>
    </>,
  );
  const [loose, done, draft, fail] = Array.from(container.querySelectorAll('.ui-badge')) as HTMLElement[];
  const muted = getComputedStyle(container.querySelector('.ui-card') as Element)
    .getPropertyValue('--ink-muted')
    .trim();
  const probe = document.createElement('span');
  probe.style.color = muted;
  document.body.append(probe);
  const mutedRgb = getComputedStyle(probe).color;
  probe.remove();
  for (const width of [1280, 390]) {
    await page.viewport(width, 800);
    expect(getComputedStyle(loose).boxShadow).not.toBe('none');
    for (const b of [done, draft, fail]) {
      expect(getComputedStyle(b).boxShadow).toBe('none');
      expect(getComputedStyle(b).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    }
    expect(getComputedStyle(done).color).toBe(mutedRgb);
    expect(getComputedStyle(draft).color).toBe(mutedRgb);
    expect(getComputedStyle(fail).color).not.toBe(mutedRgb);
  }
  await page.viewport(1280, 800);
});
