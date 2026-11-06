# ActionBar

卡片底部的一組操作按鈕。

- 寬度小於 600 px：最常用的一個（`primary: true`，沒有標示時用第一個）是全寬的主要按鈕，高度 44 px；其他收進右邊的「⋯」選單（外框，44 × 44 px）。
- 比較寬時：全部並排，主要按鈕在最前面，其他是次要按鈕，放不下就換行。
- 每個區塊最多一個主要按鈕。危險操作加 `danger: true`，在選單裡會放到最後。

```js
h(UI.ActionBar, { actions: [
  { label: '追流程', primary: true, onClick: trace },
  { label: '看影響', onClick: impact },
  { label: '展開 macro', onClick: expand }
] })
```
