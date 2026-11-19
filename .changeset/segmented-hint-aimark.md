---
'@seanyeh77/ui': minor
---

新增 `SegmentedControl`：同一份內容的兩三種顯示方式之間切換（例如「預覽／原始碼」），高 28 px，`iconOnly` 只顯示圖示、文字放在提示裡，可以放進 Workbench 的 `mainBar`；Workbench README 寫明 `mainBar` 能放的東西與高度。IconButton 的第一次使用提示泡泡改放在按鈕左邊、同一列，不再蓋住下方的列（左邊放不下時才放在下方）。`AiMark` 改成句尾的灰色小字「AI 撰寫」，新增 `text` 顯示其他來源標示（例如「推測」）；Markdown 的 `[AI](ai:)` 不論寫在開頭或結尾，都畫在那一段的最後，`[推測](ai:)` 顯示「推測」。
