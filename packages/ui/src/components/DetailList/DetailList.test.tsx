import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DetailList } from '../../index';

const items = [
  { label: '定義', value: 'src/libibtrace/hooks/ops.c:55' },
  { label: '外部指令', value: 'ibv_post_send、ibv_poll_cq' },
  { label: '可修改', value: '否' },
];

test('DetailList labelWidth auto, labelSize body: one label column as wide as the longest label, 16 px ink labels', () => {
  const { container } = render(
    <div style={{ width: 1300 }}>
      <DetailList items={items} labelWidth="auto" labelSize="body" />
    </div>,
  );
  const dts = [...container.querySelectorAll('dt')];
  const dds = [...container.querySelectorAll('dd')];
  const lefts = dds.map((d) => Math.round(d.getBoundingClientRect().left));
  expect(new Set(lefts).size).toBe(1);
  const widest = Math.max(...dts.map((d) => d.getBoundingClientRect().right));
  expect(lefts[0] - widest).toBeGreaterThanOrEqual(23);
  expect(lefts[0] - widest).toBeLessThan(26);
  expect(getComputedStyle(dts[0]).fontSize).toBe('16px');
  expect(getComputedStyle(dts[0]).color).toBe(getComputedStyle(dds[0]).color);
});

test('DetailList: under 600 px labels go above the values, whatever labelWidth', () => {
  for (const labelWidth of ['auto', 140] as const) {
    const { container, unmount } = render(
      <div style={{ width: 400 }}>
        <DetailList items={items} labelWidth={labelWidth} labelSize="body" />
      </div>,
    );
    const dt = container.querySelector('dt') as HTMLElement;
    const dd = container.querySelector('dd') as HTMLElement;
    expect(dd.getBoundingClientRect().top).toBeGreaterThanOrEqual(dt.getBoundingClientRect().bottom - 1);
    expect(getComputedStyle(dt).fontSize).toBe('13px');
    unmount();
  }
});

test('DetailList labelWidth number: that many px', () => {
  const { container } = render(
    <div style={{ width: 900 }}>
      <DetailList items={items} labelWidth={140} />
    </div>,
  );
  const dl = container.querySelector('dl') as HTMLElement;
  const dd = container.querySelector('dd') as HTMLElement;
  expect(Math.round(dd.getBoundingClientRect().left - dl.getBoundingClientRect().left)).toBe(140 + 12);
});

test('DetailList href: the value is a Link, the row is a 48 px target that opens it; external opens a new tab', () => {
  const opened = vi.fn((e: Event) => e.preventDefault());
  const { container } = render(
    <div style={{ width: 720 }}>
      <DetailList
        items={[
          { label: '定義', value: 'ops.c:55', href: '#def' },
          { label: '規格', value: 'POSIX', href: 'https://example.com/spec', external: true },
          { label: '元件', value: 'src/server' },
        ]}
      />
    </div>,
  );
  const link = screen.getByRole('link', { name: 'ops.c:55' });
  expect(link.getAttribute('href')).toBe('#def');
  link.addEventListener('click', opened);
  const row = link.closest('.ui-dl-item') as HTMLElement;
  expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
  expect(getComputedStyle(row).cursor).toBe('pointer');
  (row.querySelector('dt') as HTMLElement).click();
  expect(opened).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('link', { name: /POSIX/ }).getAttribute('target')).toBe('_blank');
  // Rows without href stay as they are.
  expect(container.querySelectorAll('.ui-dl-item.has-link')).toHaveLength(2);
});
