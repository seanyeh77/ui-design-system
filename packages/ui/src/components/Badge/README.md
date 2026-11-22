# Badge

## 用法

項目的狀態標籤（進度或結果）：浮起 Chip，左側以進度圓圈表示狀態。說明「這是什麼」的分類用 Tag。

```tsx
<Badge status="doing" />
<Badge status="fail" variant="dot">部署失敗</Badge>
```

- 5 種 `status`：`draft`、`doing`、`review`、`done`、`fail`，預設文字見下表；`children` 可以換字。
- 放在卡片上時用 `variant="dot"`：圓點加文字，沒有底色和陰影，避免看起來像按鈕。DataTable 的手機卡片會自動使用。
- 狀態不只靠顏色：一定有文字。

## 細節

- 外型：`surface` 底色、`shadow-chip` 陰影、`radius-chip` 8 px 圓角、高度 `chip-height` 32 px。
- 文字用主要文字色 `ink`，顏色只出現在進度圓圈上。`variant="dot"` 的文字用該狀態的文字色（`success-text`、`danger-text`、`warning-text`、`accent-text`、`ink-muted`）。

| status   | 文字   | 進度圓圈 | 顏色          |
| -------- | ------ | -------- | ------------- |
| `draft`  | 草稿   | 空心     | `neutral-500` |
| `doing`  | 進行中 | 半滿     | `accent`      |
| `review` | 審核中 | 四分之一 | `warning`     |
| `done`   | 完成   | 全滿     | `success`     |
| `fail`   | 失敗   | 全滿     | `danger`      |
