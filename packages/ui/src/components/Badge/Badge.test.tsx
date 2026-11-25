import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Badge, Card, type BadgePreset } from '../../index';

const NAMES: [BadgePreset, string][] = [
  ['draft', '草稿'],
  ['doing', '進行中'],
  ['review', '審核中'],
  ['done', '完成'],
  ['fail', '失敗'],
  ['closed', '已關閉'],
  ['online', '在線'],
  ['offline', '離線'],
];

const shape = (badge: Element) =>
  Array.from(badge.querySelectorAll('svg path'))
    .map((p) => p.getAttribute('d'))
    .join('|') || 'ring';

test('Badge: every preset says its name in text; the mark is hidden and done and fail differ in shape', () => {
  const shapes = new Map<string, string>();
  for (const [status, name] of NAMES) {
    const { container, unmount } = render(<Badge status={status} />);
    const badge = container.querySelector('.ui-badge') as HTMLElement;
    expect(badge.textContent).toBe(name);
    expect(badge.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    shapes.set(status, shape(badge));
    unmount();
  }
  // Not colour alone: the work states each have their own shape, fail is not the filled circle of done.
  expect(new Set(['draft', 'doing', 'review', 'done', 'fail', 'closed', 'offline'].map((s) => shapes.get(s))).size).toBe(7);
});

test('Badge: a tone with text; each tone has its own mark', () => {
  const tones = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
  const { container } = render(
    <>
      {tones.map((t) => (
        <Badge key={t} tone={t}>
          {t}
        </Badge>
      ))}
    </>,
  );
  const all = Array.from(container.querySelectorAll('.ui-badge'));
  expect(all.map((b) => b.textContent)).toEqual([...tones]);
  expect(new Set(all.map(shape)).size).toBe(5);
  expect(all[4].classList.contains('is-danger')).toBe(true);
});

test('Badge: children replace the name; a tone overrides the preset colour', () => {
  const { container } = render(
    <>
      <Badge status="fail">建置失敗</Badge>
      <Badge status="closed" tone="warning">
        已停用
      </Badge>
    </>,
  );
  const [a, b] = Array.from(container.querySelectorAll('.ui-badge'));
  expect(a.textContent).toBe('建置失敗');
  expect(b.classList.contains('is-warning')).toBe(true);
});

test('Badge: an unknown status from data falls back to 草稿 instead of crashing', () => {
  const { container } = render(<Badge status={'archived' as BadgePreset} />);
  expect(container.textContent).toBe('草稿');
});

test('Badge: no chip and no shadow anywhere; only warning and danger colour their text and are bold', () => {
  const { container } = render(
    <>
      <Badge status="done" />
      <Card title="部署">
        <Badge status="doing" />
        <Badge status="review" />
        <Badge status="fail" />
      </Card>
    </>,
  );
  const [done, doing, review, fail] = Array.from(container.querySelectorAll('.ui-badge')) as HTMLElement[];
  const muted = getComputedStyle(container.querySelector('.ui-card') as Element)
    .getPropertyValue('--ink-muted')
    .trim();
  const probe = document.createElement('span');
  probe.style.color = muted;
  document.body.append(probe);
  const mutedRgb = getComputedStyle(probe).color;
  probe.remove();
  for (const b of [done, doing, review, fail]) {
    expect(getComputedStyle(b).boxShadow).toBe('none');
    expect(getComputedStyle(b).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  }
  expect(getComputedStyle(done).color).toBe(mutedRgb);
  expect(getComputedStyle(doing).color).toBe(mutedRgb);
  expect(Number(getComputedStyle(doing).fontWeight)).toBeLessThan(600);
  expect(getComputedStyle(review).color).not.toBe(mutedRgb);
  expect(getComputedStyle(fail).color).not.toBe(mutedRgb);
  expect(Number(getComputedStyle(fail).fontWeight)).toBe(600);
});
