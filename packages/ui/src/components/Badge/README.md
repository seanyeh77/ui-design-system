# Badge

## 用法

項目的狀態（進度、結果、連線）：狀態圓圈加文字，沒有底色和陰影。說明「這是什麼」的分類用 Tag。

```tsx
<Badge status="doing" />
<Badge status="fail">部署失敗</Badge>
<Badge tone="success">已付款</Badge>
```

- 常用狀態用 `status` 預設（名稱、顏色、圓圈形狀都定好）；其他狀態給 `tone` 加文字：`neutral`、`info`、`success`、`warning`、`danger`。
- 只有要處理的狀態醒目：`warning`、`danger` 的文字上色加粗，其他文字是 `ink-muted` 一般粗細，顏色只在圓圈上。
- 狀態不只靠顏色：一定有文字，圓圈的形狀也不同（`fail` 是 ×，不是和 `done` 一樣的實心圓）。
- 字級跟著旁邊的文字（表格裡和其他格子一樣大，頁首和頁首的文字一樣大），不必另外設定。
- 常見狀態：已啟用 `<Badge tone="success">已啟用</Badge>`；已停用、已取消用 `status="closed"` 加文字（「已停用」「已取消」）；連線用 `online`、`offline`。

## 預設狀態

| status    | 文字   | tone      | 圓圈           |
| --------- | ------ | --------- | -------------- |
| `draft`   | 草稿   | `neutral` | 空心           |
| `doing`   | 進行中 | `info`    | 半滿           |
| `review`  | 審核中 | `warning` | 四分之一       |
| `done`    | 完成   | `success` | 全滿           |
| `fail`    | 失敗   | `danger`  | 空心加 ×       |
| `closed`  | 已關閉 | `neutral` | 空心加橫線     |
| `online`  | 在線   | `success` | 全滿           |
| `offline` | 離線   | `neutral` | 空心加斜線     |

- `children` 換文字（「已取消」、「已停用」用 `closed`）；`tone` 換顏色，圓圈形狀照 `status`。
- 只給 `tone` 時的圓圈：`neutral` 空心、`info` 半滿、`success` 全滿、`warning` 空心加 !、`danger` 空心加 ×。

## 細節

- 圓圈 15 px，顏色：`neutral` 用 `ink-muted`、`info` 用 `accent-text`、`success` 用 `success-text`、`warning` 用 `warning-text`、`danger` 用 `danger-text`。這些文字色在任何底色（含表格滑過、斑馬紋與選中的列）上都至少 3:1。
- 強制色彩模式（Windows 高對比）下圓圈用系統文字色，形狀仍分得出狀態。
