import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import { EventTimeline } from '../../index';

const t = (h: number, m: number) => new Date(2026, 10, 20, h, m);

test('newest first, the kind read aloud, and the empty text', () => {
  const { rerender } = render(
    <EventTimeline
      label="事件"
      empty="近 4 小時沒有事件"
      events={[
        { time: t(14, 10), kind: 'alert', text: 'B 區到達注意線' },
        { time: t(16, 5), kind: 'switch', text: '切回 AI 最佳化' },
        { time: t(15, 42), kind: 'manual', text: '值班人員調整設定' },
      ]}
    />,
  );
  const rows = screen.getAllByRole('listitem');
  expect(rows.map((r) => r.querySelector('.ui-events-time')?.textContent)).toEqual(['16:05', '15:42', '14:10']);
  expect(screen.getByRole('img', { name: '告警' })).not.toBeNull();
  rerender(<EventTimeline label="事件" empty="近 4 小時沒有事件" events={[]} />);
  expect(screen.getByText('近 4 小時沒有事件')).not.toBeNull();
});

test('own kinds, an actor, and a date above each day when the events span several days', () => {
  render(
    <EventTimeline
      label="訂單紀錄"
      kinds={{ paid: { icon: 'check-circle', label: '付款', tone: 'success' } }}
      events={[
        { time: new Date(2026, 10, 23, 18, 40), kind: 'manual', text: '建立訂單' },
        { time: new Date(2026, 10, 24, 9, 12), kind: 'paid', text: '付款', actor: '王小明' },
      ]}
    />,
  );
  expect(screen.getByRole('img', { name: '付款' })).not.toBeNull();
  expect(screen.getByText('王小明')).not.toBeNull();
  const dates = Array.from(document.querySelectorAll('.ui-events-date')).map((d) => d.textContent);
  expect(dates).toEqual(['2026/11/24（二）', '2026/11/23（一）']);
  expect(screen.getByRole('list', { name: '2026/11/24（二）' }).querySelectorAll('li')).toHaveLength(1);
});

test('two-line text at 390 px: the icon sits on the first line with the time; a wrapped actor starts flush left', async () => {
  await page.viewport(390, 844);
  render(
    <div style={{ width: 340 }}>
      <EventTimeline
        label="紀錄"
        events={[
          { time: t(14, 58), kind: 'manual', text: '值班人員把 B 區設定溫度改成 24 °C，並通知設備廠商到場檢查', actor: '值班人員王小明' },
          { time: t(14, 10), kind: 'alert', text: '短的一句', actor: '系統' },
        ]}
      />
    </div>,
  );
  const li = document.querySelector('.ui-events li') as HTMLElement;
  const icon = (li.querySelector('.ui-events-kind svg') as SVGElement).getBoundingClientRect();
  const time = (li.querySelector('.ui-events-time') as HTMLElement).getBoundingClientRect();
  const text = li.querySelector('.ui-events-text') as HTMLElement;
  const lineH = parseFloat(getComputedStyle(text).lineHeight);
  expect(text.getBoundingClientRect().height).toBeGreaterThan(lineH * 1.5);
  // The icon's middle within the first line, near the time's middle.
  const first = text.getBoundingClientRect().top + lineH / 2;
  expect(Math.abs(icon.top + icon.height / 2 - first)).toBeLessThanOrEqual(3);
  expect(Math.abs(time.top + time.height / 2 - first)).toBeLessThanOrEqual(4);
  // The actor on a line of its own starts at the text's left edge.
  const actor = (li.querySelector('.ui-events-actor') as HTMLElement).getClientRects();
  const last = actor[actor.length - 1];
  if (actor.length === 1 && last.top > text.getBoundingClientRect().top + lineH) {
    expect(Math.round(last.left)).toBe(Math.round(text.getBoundingClientRect().left));
  }
  // Number and unit stay together.
  expect(text.textContent).toContain('24 °C');
});
