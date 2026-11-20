import { expect, test } from 'vitest';
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
