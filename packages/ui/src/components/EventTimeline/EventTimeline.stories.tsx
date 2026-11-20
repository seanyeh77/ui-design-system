import * as UI from '../../index';

export default { title: 'Data/EventTimeline', component: UI.EventTimeline };

const t = (h: number, m: number) => new Date(2026, 10, 20, h, m);

/** Newest first; an icon per kind. */
export const Events = {
  render: () => (
    <div style={{ maxWidth: 460 }}>
      <UI.EventTimeline
        label="近 4 小時的事件"
        empty="近 4 小時沒有事件"
        events={[
          { time: t(16, 20), kind: 'alert', text: 'F 區進氣溫度超過上限 29 °C' },
          { time: t(16, 5), kind: 'switch', text: '控制從 PID 切回 AI 最佳化' },
          { time: t(15, 42), kind: 'ai', text: 'AI 調高 2 號空調風量 10%' },
          { time: t(14, 58), kind: 'manual', text: '值班人員把 B 區設定溫度改成 24 °C' },
        ]}
      />
    </div>
  ),
};

/** No events in the period. */
export const Empty = { render: () => <UI.EventTimeline label="近 4 小時的事件" empty="近 4 小時沒有事件" events={[]} /> };
