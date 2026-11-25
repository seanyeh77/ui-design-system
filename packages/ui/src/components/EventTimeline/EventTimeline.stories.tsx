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

/** An order's activity over several days: own kinds, a date above each day, who did it. */
export const Activity = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <UI.EventTimeline
        label="訂單 #1024 的紀錄"
        kinds={{
          created: { icon: 'plus', label: '建立' },
          paid: { icon: 'check-circle', label: '付款', tone: 'success' },
          refund: { icon: 'arrow-u-up-left', label: '退款', tone: 'warning' },
        }}
        events={[
          { time: new Date(2026, 10, 24, 15, 2), kind: 'refund', text: '退回 1 件商品 NT$ 320', actor: '客服 林小姐' },
          { time: new Date(2026, 10, 24, 9, 12), kind: 'paid', text: '信用卡付款 NT$ 1,280', actor: '王小明' },
          { time: new Date(2026, 10, 23, 18, 40), kind: 'created', text: '建立訂單', actor: '王小明' },
        ]}
      />
    </div>
  ),
};
