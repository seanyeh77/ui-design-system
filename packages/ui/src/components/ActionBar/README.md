# ActionBar

卡片底部的一組操作按鈕。

- 寬度小於 600 px：最常用的一個（`primary: true`，沒有標示時用第一個）是全寬的主要按鈕，高度 44 px；其他收進右邊的「⋯」選單（外框，44 × 44 px）。
- 比較寬時：全部並排，主要按鈕在最前面，其他是次要按鈕，放不下就換行。
- 每個區塊最多一個主要按鈕。危險操作加 `danger: true` 和 `confirm`，在選單裡會放到最後，確認後才執行。

```tsx
<ActionBar
  actions={[
    { label: '部署', primary: true, onClick: deploy },
    { label: '查看紀錄', onClick: openLogs },
    { label: '刪除', danger: true, confirm: { title: '刪除這個環境？' }, onClick: remove },
  ]}
/>
```

## 無障礙

- 按了之後按鈕被移除、換成別的按鈕或變成不能按時，焦點移到同一個位置的按鈕，沒有時移到前一個，不會掉回頁面最上方。
