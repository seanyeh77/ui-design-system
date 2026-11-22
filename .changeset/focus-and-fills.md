---
'@seanyeh77/ui': minor
'@seanyeh77/tokens': minor
---

焦點、填色與狀態記號一律達到 WCAG 對比：文字 4.5:1，非文字 3:1，淺色、深色、教材主題與 8 個推薦色票都成立。

- 焦點：所有控制項改用同一種焦點樣式，2 px 實線外框、離控制項 2 px（貼齊會裁切的容器時畫在內側 2 px），顏色是新的 `focus` token（等於 `accent-text`，在每種底色上至少 4.5:1）。原本 3 px 的 `focus-ring` 光暈只有約 1.6:1（淺色）與 2:1（深色），已全部換掉；`styles.css` 也對其他 `:focus-visible` 元素預設同一種外框。`focus-ring` 保留為舊名稱，數值和 `focus` 相同；`danger-ring` 不再使用，數值改為 `danger-text`。
- 強調色填色：`setAccent()` 換算出的 `accent` 在 `bg`、`surface`、`surface-sub`、`surface-chrome`、`accent-soft` 上至少 3:1，`on-accent` 在它上面至少 4.5:1；不夠時淺色混黑色（每步 4%）、深色混白色（每步 5%）。深色主題預設 `accent` 由 `#2457d6`（在 `surface-sub` 上 1.69:1）改為 `#6689e2`（3.09:1），`accent-hover`／`accent-press` 改為往亮的方向 `#7897e5`／`#88a3e8`，`on-accent` 改為 `#171512`。淺色的 8 個推薦色不變。
- 語意實色：淺色 `success` `#1ca655` → `#1b9f52`、`warning` `#d68710` → `#bc770e`，深色 `danger` `#cd2823` → `#dc6965`，在各底色與表格列上至少 3:1；新增 `on-danger`（淺色白、深色 `#171512`）給危險按鈕與數字徽章的文字。必填星號改用 `danger-text`。
- 狀態記號：Badge 的進度圓圈、TreeList 與 Workbench 的圓點、ProjectSwitcher 的狀態點、Meter 的標記與圓點、LineChart 的門檻線改用 `success-text`、`warning-text`、`danger-text`、`accent-text`，草稿用 `ink-muted`。
- Tabs 與 SegmentedControl 選中的白塊加 1 px `line-strong` 框，選中處對灰底達到 3:1。
