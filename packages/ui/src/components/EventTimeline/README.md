# EventTimeline

## 用法

事件或活動紀錄，由新到舊：每一列是時間、類型圖示、一句說明和誰做的。監控畫面的告警紀錄、訂單或資料的異動紀錄都用它。

```tsx
<EventTimeline
  label="訂單 #1024 的紀錄"
  kinds={{
    created: { icon: 'plus', label: '建立' },
    paid: { icon: 'check-circle', label: '付款', tone: 'success' },
    refund: { icon: 'arrow-u-up-left', label: '退款', tone: 'warning' },
  }}
  events={[
    { time: new Date(2026, 10, 24, 9, 12), kind: 'paid', text: '信用卡付款 NT$ 1,280', actor: '王小明' },
    { time: new Date(2026, 10, 23, 18, 40), kind: 'created', text: '建立訂單', actor: '王小明' },
  ]}
/>
```

- 類型（`kind`）：自己的類型寫在 `kinds`（`icon`、`label` 給螢幕閱讀器念、`tone` 是圖示顏色）；內建 `alert` 告警、`switch` 切換、`ai` AI、`manual` 人工，不必另外定義。
- 只有要注意的類型給 `tone`（`warning`、`danger`）；一般的類型不給，圖示是灰色。
- 事件跨好幾天時，每天上面有日期（`2026/11/24（二）`），每列只寫時間；全部在同一天時沒有日期。
- `actor`：誰做的，接在說明後面，灰字。
- 依 `time` 由新到舊排，傳入的順序不影響；沒有事件時顯示 `empty`。

## 細節

- 時間用 Geist Mono 13 px 灰字（24 小時制）；說明是內文大小；日期 13 px 灰色粗體。
- 圖示 20 px、沒有底色，螢幕閱讀器念類型名稱。內建類型：`alert` warning 圖示、`warning-text` 色；`switch` 左右箭頭、`accent-text`；`ai` 星芒、灰；`manual` 人像、灰。
- `tone` 的顏色：`info` 用 `accent-text`，`success`、`warning`、`danger` 用各自的文字色。
- 沒有定義的 `kind` 顯示一個灰色圓點，開發模式會提醒加進 `kinds`。
