# Badge

## 用法

項目的狀態標籤（進度或結果）：浮起 Chip，左側以進度圓圈表示狀態。說明「這是什麼」的分類用 Tag。

```tsx
<Badge status="doing" />
<Badge status="fail" variant="dot">部署失敗</Badge>
```

- 5 種 `status`：`draft`、`doing`、`review`、`done`、`fail`，預設文字見下表；`children` 可以換字。
- 放在 `Card` 或 `DataTable` 裡時，不論寬度都自動變成圓點加文字（等同 `variant="dot"`），沒有底色和陰影，避免看起來像按鈕；不用自己給 `variant`。其他地方要圓點樣式時才給 `variant="dot"`。
- 狀態不只靠顏色：一定有文字。

## 細節

- 外型：`surface` 底色、`shadow-chip` 陰影、`radius-chip` 8 px 圓角、高度 `chip-height` 32 px。
- Chip 的文字用主要文字色 `ink`，顏色只出現在進度圓圈上。圓圈用各狀態的文字色，在任何底色（含表格滑過、斑馬紋與選中的列）上都至少 3:1。
- 圓點樣式（`Card`、`DataTable` 裡，或 `variant="dot"`）：只有要注意的狀態用該狀態的文字色：`fail` 用 `danger-text`、`review` 用 `warning-text`、`doing` 用 `accent-text`；`done` 和 `draft` 用 `ink-muted`，讓需要處理的項目先被看到。字級和旁邊的文字相同（表格裡和其他格子一樣大）；需要注意的三種加粗，`done`、`draft` 用一般粗細。進度圓圈保留各自的顏色和形狀。

| status   | 文字   | 進度圓圈 | 顏色          |
| -------- | ------ | -------- | ------------- |
| `draft`  | 草稿   | 空心     | `ink-muted` |
| `doing`  | 進行中 | 半滿     | `accent-text` |
| `review` | 審核中 | 四分之一 | `warning-text` |
| `done`   | 完成   | 全滿     | `success-text` |
| `fail`   | 失敗   | 全滿     | `danger-text` |
