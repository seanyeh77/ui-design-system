---
'@seanyeh77/ui': minor
---

- LayerGraph：新增 `external`（repo 外的項目）：畫在所有分層上方，虛線外框，名稱下方寫「repo 外」（`externalLabel`），沒有大小條；線、選取和清單和一般方框一樣。往下的線的標籤留在箭頭正上方的空隙，不再越過方框。
- 新元件 SplitPane：主要區域和側邊面板之間可以拖拉的分隔線（`role="separator"`，← → 16 px、Home、End、雙擊或 Enter 回到預設寬度），兩邊有最小寬度（`minA`、`minB`），寬度用 `storageKey` 記住；960 px 以下上下排列。
