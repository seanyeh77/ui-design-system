# StatusBand

## 用法

沿著時間軸的類別色帶，例如每 10 分鐘當時採用的策略；可以貼在 LineChart 底部（`status`），也可以單獨使用。

```js
h(UI.StatusBand, {
  label: '採用的策略',
  count: 24,
  classes: [
    { value: 'ai', label: 'AI 最佳化' },
    { value: 'pid', label: 'PID' },
  ],
  segments: [
    { from: 0, to: 10, value: 'ai' },
    { from: 10, to: 24, value: 'pid' },
  ],
});
```

- 高 12 px，類別依 `classes` 的順序用 `chart-1` 到 `chart-4`；最多 4 類。帶上不寫字，名稱寫在下方的圖例。
- `segments` 的 `from` 是第一個時間點，`to` 是下一段開始的時間點（兩段相接）。

## 細節

- 貼在 LineChart 底部時和 x 軸的時間點對齊，圖例放在時間標籤下方。
- 沒有資料的時段是淡灰色。
- 螢幕閱讀器念整條帶：「採用的策略：13:00 到 14:00 AI 最佳化，…」（給 `times` 時寫出時間）。
- 狀態不只靠顏色：圖例有文字；需要看某個時間點時，LineChart 的數值提示會列出當時的類別。
