---
'@seanyeh77/ui': minor
---

DataTable 和 Markdown 表格的操作一致：

- DataTable：表頭的欄位邊框可以拖拉調整欄寬（鍵盤 ← →，Enter 或雙擊回到預設）；新的選填 `widthKey` 把拖出的寬度記在 localStorage。
- DataTable：表格右上方的「放大表格」圖示（`zoom`，預設開），在最寬 1200 px 的對話框裡顯示同一張表，搜尋、篩選、排序、分頁沿用。
- DataTable：工具列的「複製成 Markdown」圖示（`copy`，預設開），複製篩選後的全部列；新的選填 `copyText` 自訂內容、`onCopyError`。
- Markdown 表格與 DataTable：在放大對話框裡點連結，會先做連結的事再關閉對話框。拖拉邊框、放大對話框、複製圖示改用同一份實作。
