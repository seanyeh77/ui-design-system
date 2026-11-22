# EventTimeline

## 用法

監控畫面的事件列表，由新到舊：每一列是時間、類型圖示和一句說明。

```js
h(UI.EventTimeline, {
  label: '近 4 小時的事件',
  empty: '近 4 小時沒有事件',
  events: [{ time: new Date(), kind: 'alert', text: 'F 區進氣溫度超過上限 29 °C' }],
});
```

- 類型（`kind`）：`alert` 告警、`switch` 切換、`ai` AI、`manual` 人工。
- 依 `time` 由新到舊排，傳入的順序不影響。
- 沒有事件時顯示 `empty`。

## 細節

- 時間用 Geist Mono 13 px 灰字（24 小時制）；說明是內文大小。
- 類型圖示：`alert` warning 圖示、`warning-text` 色；`switch` 左右箭頭、`accent-text`；`ai` 星芒、灰；`manual` 人像、灰。圖示 20 px、沒有底色，螢幕閱讀器念類型名稱。
